const value = process.env.VITE_CMS_URL;
if (value === undefined || value === '') {
  console.log('::notice title=CMS configuration::VITE_CMS_URL is not configured. Deployment will use bundled content when no same-origin CMS is available. Live CMS updates require a deployed public HTTPS CMS origin in the VITE_CMS_URL repository variable, or a same-origin /api/site-content service.');
  process.exit(0);
}
let url;
try { url = new URL(value); } catch { /* handled below */ }
if (!url || /\s/.test(value) || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /^(localhost|127\.|0\.|\[::1\])/.test(url.hostname)) {
  console.error('::error title=Invalid CMS address::VITE_CMS_URL is configured but invalid. Use the actual deployed CMS origin, for example https://cms.example.org, without an API path, credentials, query or fragment. A bare hostname or static website address does not connect the CMS. Remove the variable to deploy with bundled content.');
  process.exit(1);
}
