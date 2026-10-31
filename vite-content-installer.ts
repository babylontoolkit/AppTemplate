import type { Connect, Plugin, ResolvedConfig } from "vite";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

/** Options of contentInstallerPlugin. */
export interface IContentInstallerPluginOptions {
    /** Absolute path of bt-content-worker.js (resolved from "@babylonjs-toolkit/next/workers/bt-content-worker.js"). */
    workerSourcePath: string;
    /** Paths (relative to outDir) left out of the shell manifest, e.g. /\.map$/. */
    excludePatterns?: RegExp[];
}

/** One file of the shell manifest (format 1, the content manifest's shape). */
interface IShellManifestFile {
    /** Bytes on disk (what the network sends). */
    size: number;
    /** Bytes the browser delivers (decoded for `.gz.` files). */
    contentSize: number;
    /** Lowercase hex SHA-256 of the delivered bytes. */
    hash: string;
    /** Media type. */
    type: string;
    /** "gzip" for `.gz.` files only. */
    encoding?: "gzip";
}

/** The shell manifest written at build. */
interface IShellManifest {
    format: number;
    version: string;
    generated: string;
    generator: string;
    navigationFallback: string;
    files: Record<string, IShellManifestFile>;
    groups: Record<string, { scene: string; files: string[] }>;
}

/** The worker file name, served and emitted at the app root. */
const WORKER_FILE_NAME = "bt-content-worker.js";
/** The shell manifest file name at the app root. */
const SHELL_MANIFEST_FILE_NAME = "bt-shell-manifest.json";
/** The shell manifest's one group. */
const SHELL_GROUP_ID = "shell";
/** The page the worker answers offline navigations with. */
const NAVIGATION_FALLBACK = "index.html";
/** The manifest format the installer reads. */
const MANIFEST_FORMAT = 1;
/** The manifest's generator text. */
const GENERATOR = "vite-content-installer";
/** System files never listed, wherever they sit (the exporter's manifest leaves them out too, D11). */
const ALWAYS_EXCLUDED_FILE_NAMES: string[] = [".DS_Store", "Thumbs.db"];
/** A file whose last path segment contains this is served gzip encoded (the exporter's rule). */
const GZIP_MARKER = ".gz.";
/** Media type of an extension the table does not list. */
const DEFAULT_MEDIA_TYPE = "application/octet-stream";
/** Media types by lowercase extension. */
const MEDIA_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".wasm": "application/wasm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".ktx2": "image/ktx2",
    ".gltf": "model/gltf+json",
    ".glb": "model/gltf-binary",
    ".bin": "application/octet-stream",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".txt": "text/plain",
};

/**
 * The content installer's Vite plugin (pwa-content-installer D23): serves "/bt-content-worker.js" in dev (text/javascript,
 * no-cache), emits it at build, and after the build writes "bt-shell-manifest.json" (format 1, group "shell",
 * navigationFallback "index.html") listing every file in outDir except itself, system files (.DS_Store, Thumbs.db) and
 * `excludePatterns`, with size,
 * contentSize, SHA-256 and type. When `workerSourcePath` does not exist it logs one warning and does nothing else (D34).
 * @param options - The worker source and the shell manifest's exclusions.
 * @returns The plugin.
 */
export function contentInstallerPlugin(options: IContentInstallerPluginOptions): Plugin {
    const { workerSourcePath, excludePatterns = [] } = options;
    const hasWorker: boolean = workerSourcePath !== "" && existsSync(workerSourcePath);
    let resolvedConfig: ResolvedConfig | null = null;

    return {
        name: "content-installer",
        configResolved(config: ResolvedConfig): void {
            resolvedConfig = config;
            if (!hasWorker) {
                config.logger.warn(`[content-installer] ${WORKER_FILE_NAME} was not found in @babylonjs-toolkit/next: the content installer stays off (no worker, no shell manifest).`);
            }
        },
        configureServer(server): void {
            if (!hasWorker) return;
            server.middlewares.use((request: Connect.IncomingMessage, response, next) => {
                const requestPath: string = (request.url ?? "").split("?")[0];
                if (requestPath !== `/${WORKER_FILE_NAME}`) {
                    next();
                    return;
                }
                response.setHeader("Content-Type", "text/javascript");
                response.setHeader("Cache-Control", "no-cache");
                response.end(readFileSync(workerSourcePath, "utf8"));
            });
        },
        generateBundle(): void {
            if (!hasWorker) return;
            this.emitFile({ type: "asset", fileName: WORKER_FILE_NAME, source: readFileSync(workerSourcePath, "utf8") });
        },
        closeBundle(): void {
            if (!hasWorker || resolvedConfig == null || resolvedConfig.command !== "build") return;
            const outDir: string = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir);
            if (!existsSync(outDir)) return;
            const manifest: IShellManifest = buildShellManifest(outDir, excludePatterns);
            writeFileSync(path.join(outDir, SHELL_MANIFEST_FILE_NAME), `${JSON.stringify(manifest, null, 2)}\n`);
            resolvedConfig.logger.info(`[content-installer] ${SHELL_MANIFEST_FILE_NAME}: ${Object.keys(manifest.files).length} files, version ${manifest.version.slice(0, 12)}`);
        },
    };
}

/**
 * Builds the shell manifest of a build folder.
 * @param outDir - The build folder.
 * @param excludePatterns - Paths (relative, "/" separators) left out.
 * @returns The manifest.
 */
function buildShellManifest(outDir: string, excludePatterns: RegExp[]): IShellManifest {
    const relativePaths: string[] = listFiles(outDir)
        .filter((relativePath: string) => relativePath !== SHELL_MANIFEST_FILE_NAME)
        .filter((relativePath: string) => !ALWAYS_EXCLUDED_FILE_NAMES.includes(path.posix.basename(relativePath)))
        .filter((relativePath: string) => !excludePatterns.some((pattern: RegExp) => pattern.test(relativePath)))
        .sort(compareOrdinal);
    const files: Record<string, IShellManifestFile> = {};
    for (const relativePath of relativePaths) files[relativePath] = describeFile(outDir, relativePath);
    const groups: Record<string, { scene: string; files: string[] }> = {
        [SHELL_GROUP_ID]: { scene: NAVIGATION_FALLBACK, files: relativePaths },
    };
    return {
        format: MANIFEST_FORMAT,
        version: computeVersion(files, groups, NAVIGATION_FALLBACK),
        generated: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
        generator: GENERATOR,
        navigationFallback: NAVIGATION_FALLBACK,
        files,
        groups,
    };
}

/**
 * Lists every file under a folder.
 * @param rootFolder - The folder.
 * @returns Paths relative to it, with "/" separators.
 */
function listFiles(rootFolder: string): string[] {
    const relativePaths: string[] = [];
    const visit = (folder: string): void => {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
            const absolutePath: string = path.join(folder, entry.name);
            if (entry.isDirectory()) visit(absolutePath);
            else if (entry.isFile()) relativePaths.push(path.relative(rootFolder, absolutePath).split(path.sep).join("/"));
        }
    };
    visit(rootFolder);
    return relativePaths;
}

/**
 * Describes one file: wire size, delivered size, SHA-256 of the delivered bytes, media type and encoding.
 * @param outDir - The build folder.
 * @param relativePath - The file's path relative to it.
 * @returns The manifest entry.
 */
function describeFile(outDir: string, relativePath: string): IShellManifestFile {
    const wireBytes: Buffer = readFileSync(path.join(outDir, relativePath));
    const isGzipEncoded: boolean = path.posix.basename(relativePath).toLowerCase().includes(GZIP_MARKER);
    const deliveredBytes: Buffer = isGzipEncoded ? gunzipSync(wireBytes) : wireBytes;
    const entry: IShellManifestFile = {
        size: wireBytes.length,
        contentSize: deliveredBytes.length,
        hash: createHash("sha256").update(deliveredBytes).digest("hex"),
        type: MEDIA_TYPES[path.posix.extname(relativePath).toLowerCase()] ?? DEFAULT_MEDIA_TYPE,
    };
    if (isGzipEncoded) entry.encoding = "gzip";
    return entry;
}

/**
 * The manifest version (D10, the exporter's ComputeVersion): SHA-256 hex of the canonical text — "F\t<path>\t<hash>\t<size>\n"
 * per file in ordinal path order, "G\t<group>\t<path>\n" per group file in ordinal order, then "N\t<navigationFallback>\n".
 * @param files - The files.
 * @param groups - The groups.
 * @param navigationFallback - The offline navigation page.
 * @returns The version.
 */
function computeVersion(files: Record<string, IShellManifestFile>, groups: Record<string, { files: string[] }>, navigationFallback: string): string {
    let canonicalText = "";
    for (const filePath of Object.keys(files).sort(compareOrdinal)) {
        canonicalText += `F\t${filePath}\t${files[filePath].hash}\t${files[filePath].size}\n`;
    }
    for (const groupId of Object.keys(groups).sort(compareOrdinal)) {
        for (const filePath of [...groups[groupId].files].sort(compareOrdinal)) canonicalText += `G\t${groupId}\t${filePath}\n`;
    }
    canonicalText += `N\t${navigationFallback}\n`;
    return createHash("sha256").update(canonicalText, "utf8").digest("hex");
}

/**
 * Ordinal (UTF-16 code unit) string order, the exporter's StringComparer.Ordinal.
 * @param first - A string.
 * @param second - Another string.
 * @returns Negative, zero or positive.
 */
function compareOrdinal(first: string, second: string): number {
    if (first === second) return 0;
    return first < second ? -1 : 1;
}
