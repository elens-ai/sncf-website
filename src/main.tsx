import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { bootstrapCMS } from './cms/runtime';
import { CMSContentProvider } from './cms/CMSContentProvider';
import './index.css';
import './homepage.css';
import './responsive.css';

// Resolve published content before eager data modules evaluate, with a bounded offline fallback.
void bootstrapCMS().then(async () => {
const { default: App } = await import('./App.tsx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CMSContentProvider><App /></CMSContentProvider>
  </StrictMode>,
);

});
