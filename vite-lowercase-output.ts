import { readdirSync } from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * Every file the build writes has an all-lowercase path. A web build that goes into a Unity project's export is copied
 * by the Babylon Toolkit exporter, which (with its Force Lower Casing option) lowercases every file name it copies: a
 * mixed-case name (`vendor-CPvUQCMa.js`) would be renamed after the build while the page still asks for the old name, and
 * a case-sensitive host would answer 403 or 404 for it. With lowercase names that renaming changes nothing.
 */

/** A chunk or asset as the output naming functions receive it (the fields this file reads). */
interface INamedOutput {
    /** A chunk's name. */
    name?: string;
    /** An asset's original file names (rolldown); the first one names the output file. */
    names?: readonly string[];
}

/**
 * A chunk or entry name made safe for the lowercase build: lowercased.
 * @param name The bundler's name for the chunk.
 * @returns The lowercase name.
 */
function lowercaseName(name: string | undefined): string {
    return (name ?? "chunk").toLowerCase();
}

/**
 * The output path of an entry chunk: `<name>.js`, lowercase (the page loads `./index.js`).
 * @param chunk The entry chunk.
 * @returns The file name.
 */
export function lowercaseEntryFileName(chunk: INamedOutput): string {
    return `${lowercaseName(chunk.name)}.js`;
}

/**
 * The output path of a shared or lazy chunk: `assets/<name>-<hash>.js`, lowercase (the hash is hex, see
 * {@link LOWERCASE_HASH_CHARACTERS}).
 * @param chunk The chunk.
 * @returns The file name pattern.
 */
export function lowercaseChunkFileName(chunk: INamedOutput): string {
    return `assets/${lowercaseName(chunk.name)}-[hash].js`;
}

/**
 * The output path of an asset (a font, an image, Havok's wasm, the stylesheet): `<name>.<ext>` at the root, as before, lowercase.
 * @param asset The asset.
 * @returns The file name.
 */
export function lowercaseAssetFileName(asset: INamedOutput): string {
    const originalName: string = asset.names?.[0] ?? asset.name ?? "asset";
    const extension: string = path.extname(originalName);
    return `${path.basename(originalName, extension)}${extension}`.toLowerCase();
}

/** Hash characters for chunk names: hex is lowercase only (the default base64 mixes cases). */
export const LOWERCASE_HASH_CHARACTERS = "hex" as const;

/**
 * Every file under a folder, as paths relative to it.
 * @param folder The folder.
 * @param prefix The relative path of the folder so far.
 * @returns The relative file paths.
 */
function listFiles(folder: string, prefix: string = ""): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const relativePath: string = prefix + entry.name;
        if (entry.isDirectory()) files.push(...listFiles(path.join(folder, entry.name), `${relativePath}/`));
        else files.push(relativePath);
    }
    return files;
}

/** System files a folder may hold whatever their case (never part of the game). */
const IGNORED_SYSTEM_FILES: ReadonlySet<string> = new Set([".DS_Store", "Thumbs.db"]);

/**
 * The paths that break the lowercase rule.
 * @param relativePaths Output file paths.
 * @returns The ones with an uppercase letter.
 */
export function findUppercasePaths(relativePaths: readonly string[]): string[] {
    return relativePaths.filter((relativePath: string) => !IGNORED_SYSTEM_FILES.has(path.basename(relativePath)) && relativePath !== relativePath.toLowerCase());
}

/**
 * Fails the build when any file it wrote — bundled or copied from `public/` — has an uppercase letter in its path, so a
 * new mixed-case file name never reaches the hosted game.
 * @returns The plugin.
 */
export function lowercaseOutputGuardPlugin(): Plugin {
    let outputFolder: string = "";
    return {
        name: "bt-lowercase-output-guard",
        apply: "build",
        configResolved(config: ResolvedConfig): void {
            outputFolder = path.resolve(config.root, config.build.outDir);
        },
        closeBundle(): void {
            const uppercasePaths: string[] = findUppercasePaths(listFiles(outputFolder));
            if (uppercasePaths.length === 0) return;
            throw new Error(`[build] ${uppercasePaths.length} output file(s) have uppercase letters; the Babylon Toolkit Unity export lowercases `
                + `the files it copies, which would break them on the hosted game. Rename them lowercase (and their references): ${uppercasePaths.slice(0, 10).join(", ")}`);
        },
    };
}
