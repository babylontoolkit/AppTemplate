import type { IContentInstallerHostOptions } from "../chrome/content-installer";

/** The folder of the playground scenes Home's demos load (samplescene.gz.gltf, openterrain.gz.gltf). */
const PLAYGROUND_SCENE_BASE_URL: string = "https://repo.babylontoolkit.com/playground/";

/**
 * The app's content installer settings (offline install and fast loads of the hosted game content).
 * Off by default: the one change to turn it on is `VITE_CONTENT_INSTALLER=on` in `.env`. The scene host is
 * `VITE_SCENE_BASE_URL` (default: the playground folder), and it must serve `content-manifest.json` with CORS (see
 * README › Hosting game content for the content installer). On localhost and private network hosts the installer stays
 * off unless `VITE_CONTENT_INSTALLER_LOCALHOST=on`, so dev sessions behave exactly as before.
 */
export const CONTENT_INSTALLER_OPTIONS: IContentInstallerHostOptions = {
  enabled: import.meta.env.VITE_CONTENT_INSTALLER === "on",
  sceneBaseUrl: import.meta.env.VITE_SCENE_BASE_URL ?? PLAYGROUND_SCENE_BASE_URL,
  enableOnLocalHost: import.meta.env.VITE_CONTENT_INSTALLER_LOCALHOST === "on",
};
