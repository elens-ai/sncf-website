import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { CoreValuesPage } from './pages/CoreValuesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WhoWeArePage } from './pages/WhoWeArePage';
import { GuidingForcePage } from './pages/GuidingForcePage';
import { ScrollToTop } from './components/ScrollToTop';

/**
 * THE SITE'S ROUTES.
 *
 * Home is the exhibition — the splash, the hero wheel, the hall, the awards
 * ring, the media wall — and it is left exactly as it was built. The four
 * pages beneath it are the reference volumes: what the hall shows in motion,
 * written down with every figure the activity report gives.
 *
 * All four share PageShell, so the header, the accent ground and the footer
 * are the same objects the home page uses. Only the reading matter changes.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/core-values" element={<CoreValuesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/who-we-are" element={<WhoWeArePage />} />
        <Route path="/our-guiding-force" element={<GuidingForcePage />} />
        {/* An unknown address lands on the hall rather than a dead end. */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
