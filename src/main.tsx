import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { bootstrapCMS } from './cms/runtime';
import { CMSContentProvider } from './cms/CMSContentProvider';
import { startPerfTier } from './utils/perfTier';
import './index.css';
import './homepage.css';
import './responsive.css';
import './perf-tier.css';

// How much decorative motion this device gets (html[data-perf]), decided before anything is drawn.
startPerfTier();

// Resolve published content before eager data modules evaluate, with a bounded offline fallback.
void bootstrapCMS().then(async () => {
const { default: App } = await import('./App.tsx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CMSContentProvider><App /></CMSContentProvider>
  </StrictMode>,
);

});
