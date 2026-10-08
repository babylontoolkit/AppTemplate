'use client';

import BabylonSceneViewer from '../babylon/system/babylon';
import { useSceneLoadRequests } from '../babylon/system/sceneload';

/**
 * The /play route: mounts the Babylon scene viewer and remounts it (new key) for every toolkit `SceneLoad` request,
 * so a scene change loads the destination without a page reload.
 */
export default function PlayRoute() {
  const generation = useSceneLoadRequests();
  return (
      <BabylonSceneViewer
        key={generation}
        fullPage={true}
        allowQueryParams={true}
        enableCustomOverlay={true}
      />
  );
}
