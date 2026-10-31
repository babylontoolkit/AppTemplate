import { useState, type CSSProperties } from 'react';
import { babylonLogo } from '../chrome/loading';
import { useUnifiedNavigation } from '../babylon/system/platform';
import { ContentInstallPanel, useContentInstaller, useInstallAppPrompt } from '../chrome/content-installer';
import './Home.css'

/** Keeps the install controls a readable width inside the splash layout. */
const INSTALL_SECTION_STYLE: CSSProperties = { width: '100%', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' };

function Home() {

  const { navigate } = useUnifiedNavigation();
  const { state: installerState } = useContentInstaller();
  const { canPrompt, isIosSafari, promptInstall } = useInstallAppPrompt();
  const [isInstallPanelOpen, setInstallPanelOpen] = useState<boolean>(false);
  // The install controls appear only while the content installer runs (VITE_CONTENT_INSTALLER=on and supported here).
  const showInstallControls: boolean = installerState != null && installerState.availability !== 'disabled';

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
      {showInstallControls && (
        <section className="splash-install" style={INSTALL_SECTION_STYLE} aria-label="Install">
          <div className="content-install-panel__actions">
            <button type="button" className="splash-install-button" aria-expanded={isInstallPanelOpen} onClick={() => setInstallPanelOpen((isOpen: boolean) => !isOpen)}>
              Install Game
            </button>
            {canPrompt && (
              <button type="button" className="splash-install-button" onClick={() => void promptInstall()}>
                Install App
              </button>
            )}
          </div>
          {isIosSafari && <p className="splash-install-hint">Tap Share, then Add to Home Screen</p>}
          {isInstallPanelOpen && <ContentInstallPanel />}
        </section>
      )}
      <footer className="splash-footer">
        <small><a href="https://babylontoolkit.com" target="_blank">Babylon Toolkit Game Development</a></small>
      </footer>
    </div>
  )
}

export default Home;
