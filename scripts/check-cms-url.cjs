const value = process.env.VITE_CMS_URL;
let url;
try { url = new URL(value); } catch { /* handled below */ }
if (!url || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /^(localhost|127\.|0\.|\[::1\])/.test(url.hostname)) {
  console.error('::error::Set the VITE_CMS_URL repository variable to the public HTTPS CMS origin before production deployment.');
  process.exit(1);
}
