import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DefaultBabylonPreloader } from './babylon/custom/loading';
import { ReactRouterNavAdapter } from './routing/adpter';
import Home from './pages/Home';
import './app.css'

// Note: All babylon imports stay inside the PlayRoute lazy load chunk
const PlayRoute = lazy(() => import('./routing/router'));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
     <ReactRouterNavAdapter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={
          <Suspense fallback={<DefaultBabylonPreloader />}>
            <PlayRoute />
          </Suspense>
        } />
      </Routes>
     </ReactRouterNavAdapter>
    </BrowserRouter>
  )
}

export default App
