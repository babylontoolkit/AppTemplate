import { babylonLogo } from '../custom/loading';
import { useUnifiedNavigation } from '../babylon/system/platform';
import './Home.css'

function Home() {

  const { navigate } = useUnifiedNavigation();
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
      <footer className="splash-footer">
        <small><a href="https://babylontoolkit.github.io/repo" target="_blank">Babylon Toolkit Prototype Asset Library</a></small>
      </footer>
    </div>
  )
}

export default Home;
