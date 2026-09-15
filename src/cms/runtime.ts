/** Public, published content only. Authentication and preview tokens never enter this store. */
export interface CMSPublication {
  version: string;
  pillars?: unknown[];
  activities?: unknown[];
  events?: unknown[];
  partners?: unknown[];
  awards?: unknown[];
  gallery?: unknown[];
  pages?: unknown[];
  copy?: Record<string, string>;
  assets?: Record<string, string | { url?: string; source?: string }>;
  components?: Record<string, { enabled?: boolean; order?: number; options?: Record<string, unknown> }>;
  site?: Record<string, unknown>;
  pavilion?: Record<string, unknown>;
  stats?: Record<string, { value: string | number; label?: string; period?: string; asOf?: string }>;
}

const EMPTY: CMSPublication = { version: 'bundled' };
let snapshot: CMSPublication = EMPTY;
let revision = 0;
let etag = '';
let previewState: 'loading' | 'connected' | 'unauthorized' | 'offline' = 'loading';
const subscribers = new Set<() => void>();
const adapters = new Set<(publication: CMSPublication) => void>();
const blockedKeys = new Set(['__proto__', 'constructor', 'prototype']);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** No data:, javascript:, credential-bearing or protocol-relative media URLs. */
export function safeCMSURL(value: unknown, link = false): value is string {
  if (typeof value !== 'string' || !value || value.length > 4096 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (link && (/^#[\w-]+$/.test(value) || /^(mailto|tel):[^<>]+$/i.test(value))) return true;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch { return false; }
}

function cleanJSON(value: unknown, depth = 0): unknown {
  if (depth > 16) return undefined;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') return value.length <= 100_000 ? value : undefined;
  if (Array.isArray(value)) return value.slice(0, 4000).map(item => cleanJSON(item, depth + 1));
  if (!isRecord(value)) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value).slice(0, 12000)) {
    if (blockedKeys.has(key)) continue;
    const cleaned = cleanJSON(item, depth + 1);
    if (cleaned !== undefined) result[key] = cleaned;
  }
  return result;
}

export function validateCMSPublication(value: unknown): CMSPublication | null {
  if (!isRecord(value) || (typeof value.version !== 'string' && typeof value.version !== 'number')) return null;
  const clean = cleanJSON(value) as Record<string, unknown>;
  const result: CMSPublication = { version: String(clean.version) };
  for (const key of ['pillars', 'activities', 'events', 'partners', 'awards', 'gallery', 'pages'] as const) {
    if (Array.isArray(clean[key])) result[key] = clean[key];
  }
  for (const key of ['site', 'pavilion', 'stats', 'components'] as const) {
    if (isRecord(clean[key])) Object.assign(result, { [key]: clean[key] });
  }
  if (isRecord(clean.copy)) {
    result.copy = Object.fromEntries(Object.entries(clean.copy).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  }
  if (isRecord(clean.assets)) {
    result.assets = {};
    for (const [key, asset] of Object.entries(clean.assets)) {
      const source = typeof asset === 'string' ? asset : isRecord(asset) ? asset.url ?? asset.source : null;
      if (safeCMSURL(source)) result.assets[key] = source;
    }
  }
  return result;
}

export function getCMSSnapshot() { return snapshot; }
export function getCMSRevision() { return revision; }
export function getCMSPreviewState() { return preview ? previewState : null; }
export function subscribeCMS(listener: () => void) {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}

/** Data modules bind once; a publication updates their exports before React is notified. */
export function registerCMSAdapter(adapter: (publication: CMSPublication) => void) {
  adapters.add(adapter);
  return () => { adapters.delete(adapter); };
}

/** Refresh module-level content tables without recreating their React components. */
export function bindCMSValue<T>(factory: () => T, update: (value: T) => void): T {
  registerCMSAdapter(() => update(factory()));
  return factory();
}

export function applyCMSPublication(value: unknown): boolean {
  const next = validateCMSPublication(value);
  if (!next || next.version === snapshot.version) return false;
  // Apply all validated data together, so readers cannot observe a half-updated publication.
  snapshot = next;
  for (const adapter of adapters) adapter(next);
  revision += 1;
  for (const listener of subscribers) listener();
  return true;
}

export function getCMSValue<T>(path: string, fallback: T): T {
  let value: unknown = snapshot;
  for (const part of path.split('.')) {
    if (blockedKeys.has(part) || !isRecord(value)) return fallback;
    value = value[part];
  }
  return value === undefined || value === null ? fallback : value as T;
}

export function getCMSCopy(key: string, fallback: string) {
  return typeof snapshot.copy?.[key] === 'string' ? snapshot.copy[key] : fallback;
}

export function resolveCMSAsset(key: string, fallback: string): string {
  const sourceOf = (item: CMSPublication['assets'][string] | undefined) => typeof item === 'string' ? item : item?.url ?? item?.source;
  const local = sourceOf(snapshot.assets?.[key]);
  const shared = sourceOf(snapshot.assets?.[fallback]);
  // Seeded per-component defaults must not mask an editor's global file replacement.
  const source = safeCMSURL(local) && local !== fallback ? local : shared ?? local;
  return safeCMSURL(source) ? source : fallback;
}
export const resolveAsset = resolveCMSAsset;

const env: Record<string, string | undefined> = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const cmsBase = (env.VITE_CMS_URL ?? '').replace(/\/$/, '');
const preview = typeof location !== 'undefined' && new URLSearchParams(location.search).get('cms-preview') === 'true';
const endpoint = `${cmsBase}/api/site-content${preview ? '?preview=true' : ''}`;
const cacheKey = `sncf:cms:v1:${cmsBase || 'same-origin'}`;
const requestTimeout = 3500;
const pollingInterval = preview ? 5000 : 30_000;
let request: Promise<boolean> | null = null;
let controller: AbortController | null = null;

function readCache() {
  if (preview) return;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached && cached.length <= 2_000_000) applyCMSPublication(JSON.parse(cached));
  } catch { /* Private browsing, stale cache and storage limits keep bundled content working. */ }
}
function writeCache() {
  if (preview) return;
  try {
    const content = JSON.stringify(snapshot);
    if (content.length <= 2_000_000) localStorage.setItem(cacheKey, content);
  } catch { /* Caching is an optimization, never required for rendering. */ }
}

function setPreviewState(state: typeof previewState) {
  if (!preview || state === previewState) return;
  previewState = state;
  revision += 1;
  for (const listener of subscribers) listener();
}

async function refresh(timeoutMs = requestTimeout): Promise<boolean> {
  if (request) return request;
  controller = new AbortController();
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  const signal = controller.signal;
  request = (async () => {
    try {
      const response = await fetch(endpoint, { signal, credentials: preview ? 'include' : 'omit', headers: etag ? { 'If-None-Match': etag } : {}, cache: preview ? 'no-store' : 'no-cache' });
      if (response.status === 304) return true;
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        if (preview && (response.status === 401 || response.status === 403)) applyCMSPublication({ version: `preview-sign-in-${Date.now()}` });
        setPreviewState(response.status === 401 || response.status === 403 ? 'unauthorized' : 'offline');
        return false;
      }
      if (Number(response.headers.get('content-length')) > 2_000_000) return false;
      const raw = await response.text();
      if (raw.length > 2_000_000) return false;
      const publication = validateCMSPublication(JSON.parse(raw));
      if (!publication) return false;
      applyCMSPublication(publication);
      setPreviewState('connected');
      etag = response.headers.get('etag') ?? '';
      writeCache();
      return true;
    } catch { setPreviewState('offline'); return false; }
    finally { clearTimeout(timer); request = null; controller = null; }
  })();
  return request;
}

/** One bounded request before the App/data modules load; offline visitors still get the site. */
export async function bootstrapCMS() {
  if (typeof window === 'undefined') return;
  readCache();
  await refresh(1200);
}

/** Conditional requests only while visible and online. Failed backends back off to five minutes. */
export function startCMSPolling() {
  if (typeof document === 'undefined') return () => {};
  let stopped = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    if (!stopped) timer = setTimeout(tick, Math.min(300_000, pollingInterval * 2 ** failures));
  };
  const tick = async () => {
    if (stopped) return;
    if (document.visibilityState !== 'hidden' && navigator.onLine !== false) {
      const ok = await refresh();
      failures = ok ? 0 : Math.min(4, failures + 1);
    }
    schedule();
  };
  const wake = () => {
    if (document.visibilityState === 'hidden') { controller?.abort(); return; }
    failures = 0;
    clearTimeout(timer);
    void tick();
  };
  schedule();
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('online', wake);
  return () => {
    stopped = true;
    clearTimeout(timer);
    controller?.abort();
    document.removeEventListener('visibilitychange', wake);
    window.removeEventListener('online', wake);
  };
}
