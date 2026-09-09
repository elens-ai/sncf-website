const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const script = join(__dirname, 'check-cms-url.cjs');

test('an absent CMS origin permits bundled-content deployments and explains how to enable live updates', () => {
  for (const value of [undefined, '']) {
    const env = { ...process.env };
    if (value === undefined) delete env.VITE_CMS_URL;
    else env.VITE_CMS_URL = value;
    const result = spawnSync(process.execPath, [script], { env, encoding: 'utf8' });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /::notice title=CMS configuration::/);
    assert.match(result.stdout, /bundled content/);
    assert.match(result.stdout, /Live CMS updates require/);
    assert.equal(result.stderr, '');
  }
});

test('production CMS configuration accepts HTTPS origins with an optional trailing slash', () => {
  for (const value of ['https://cms.example.org', 'https://cms.example.org/', 'https://cms.example.org:8443']) {
    const result = spawnSync(process.execPath, [script], { env: { ...process.env, VITE_CMS_URL: value } });
    assert.equal(result.status, 0, value);
  }
});

test('production CMS configuration rejects endpoint paths, credentials and local origins', () => {
  for (const value of [' ', 'not a URL', 'sncf.elens.in', 'http://cms.example.org', 'https://cms.example.org/api/site-content', 'https://cms.example.org/subpath/', 'https://cms.example.org?token=value', 'https://cms.example.org#fragment', 'https://user:pass@cms.example.org', 'https://localhost:3001', 'https://127.0.0.1:3001', 'https://[::1]:3001', ' https://cms.example.org', 'https://cms.example.org\n']) {
    const result = spawnSync(process.execPath, [script], { env: { ...process.env, VITE_CMS_URL: value }, encoding: 'utf8' });
    assert.equal(result.status, 1, value);
    assert.match(result.stderr, /::error title=Invalid CMS address::/);
    assert.match(result.stderr, /https:\/\/cms\.example\.org/);
  }
});
