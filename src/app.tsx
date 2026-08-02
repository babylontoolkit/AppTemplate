import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DefaultBabylonPreloader } from './chrome/loading';
import { ReactRouterNavAdapter } from './routing/adapter';
import Home from './pages/Home';
import './app.css'

// Note: All babylon imports stay inside the PlayRoute lazy load chunk
const PlayRoute = lazy(() => import('./routing/router'));

// The app must boot under ANY serving prefix: "/" in dev, but "/play/<shareId>/" when a
// published build is served by the platform. With a relative vite base (base: "./"),
// import.meta.env.BASE_URL is "./" — resolving it against the URL of the document that
// loaded us yields the real mount point at runtime ("/" in dev, "/play/<id>/" on a share).
// Passing BASE_URL straight to the router gives basename "/./", which matches nothing.
function appBasename(): string {
  return new URL(import.meta.env.BASE_URL, window.location.href).pathname;
}

function App() {
  return (
    <BrowserRouter basename={appBasename()}>
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
