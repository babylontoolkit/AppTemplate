import { useRef, useState } from 'react';
import { babylonLogo } from '../chrome/loading';
import { useUnifiedNavigation } from '../babylon/system/platform';
import { ContentInstallPanel, useContentInstaller } from '../chrome/content-installer';
import './Home.css'

function Home() {

  const { navigate } = useUnifiedNavigation();
  const { state: installerState } = useContentInstaller();
  const downloadDialogRef = useRef<HTMLDialogElement | null>(null);
  const [isDownloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);
  // The Download button appears only while the content installer runs (VITE_CONTENT_INSTALLER=on and supported here).
  const showDownloadControls: boolean = installerState != null && installerState.availability !== 'disabled';
  const downloadButtonLabel: string = installerState?.everythingInstalled === true ? 'Downloaded ✓' : 'Download';

  /** Opens the Download Game Data dialog as a modal (Escape closes it). */
  const openDownloadDialog = (): void => {
    downloadDialogRef.current?.showModal();
    setDownloadDialogOpen(true);
  };
  /** Closes the Download Game Data dialog (a running download keeps going). */
  const closeDownloadDialog = (): void => {
    downloadDialogRef.current?.close();
  };

  const handlePlayerDemo = () => {
    navigate('/play', {
      gameMode: 'PlayerControllerDemo',
      sceneUrl: 'https://repo.babylontoolkit.com/playground/samplescene.gz.gltf',
    });
  };
  const handleVehicleDemo = () => {
    navigate('/play', {
      gameMode: 'VehicleControllerDemo',
      sceneUrl: 'https://repo.babylontoolkit.com/playground/openterrain.gz.gltf',
    });
  };

  return (
    <div id="splash">
      <main className="splash-center">
        <a href="https://babylonjs.com" target="_blank">
          <img src={babylonLogo} className="splash-logo" alt="Babylon logo" />
        </a>
      </main>
      {showDownloadControls && (
        <section className="splash-download" aria-label="Game data">
          <button type="button" className="splash-download-button" aria-haspopup="dialog" onClick={openDownloadDialog}>
            {downloadButtonLabel}
          </button>
          <dialog className="splash-download-dialog" aria-label="Download Game Data" ref={downloadDialogRef} onClose={() => setDownloadDialogOpen(false)}>
            {isDownloadDialogOpen && <ContentInstallPanel onClose={closeDownloadDialog} />}
          </dialog>
        </section>
      )}
      <footer className="splash-footer">
        <small><a href="https://babylontoolkit.com" target="_blank">Babylon Toolkit Game Development</a></small>
      </footer>
    </div>
  )
}

export default Home;
