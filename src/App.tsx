import { CMSMetadata } from './cms/CMSMetadata';
import { useCMSRevision } from './cms/CMSContentProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import HomePage from './pages/HomePage';
import { ScrollToTop } from './components/ScrollToTop';
const CMSPage = lazy(() => import('./pages/CMSPage'));
const CoreValuesPage = lazy(() => import('./pages/CoreValuesPage').then(m => ({ default: m.CoreValuesPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const WhoWeArePage = lazy(() => import('./pages/WhoWeArePage').then(m => ({ default: m.WhoWeArePage })));
const GuidingForcePage = lazy(() => import('./pages/GuidingForcePage').then(m => ({ default: m.GuidingForcePage })));

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
  useCMSRevision();
  return (
    <BrowserRouter>
      <CMSMetadata />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen grid place-items-center bg-neutral-950 text-white/70" role="status">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/core-values" element={<CoreValuesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/who-we-are" element={<WhoWeArePage />} />
        <Route path="/our-guiding-force" element={<GuidingForcePage />} />
        <Route path="/pages/:slug" element={<CMSPage />} />
        {/* An unknown address lands on the hall rather than a dead end. */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
