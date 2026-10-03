/** The 3D models shown in the pillar cards and hero, by pillar or project id. */
export const pavilionDefaults = {
  models: { heal: '/models/heal.glb', enrich: '/models/enrich.glb?v=2dacc3', empower: '/models/empower.glb', projects: '/models/projects.glb?v=sncf-bloom-balanced', amrit: '/models/amrit.glb', oneness: '/models/oneness.glb' },
};
export type PavilionSettings = typeof pavilionDefaults;

/** Accept only web media URLs; never allow scripts or protocol-relative URLs. */
export function safePavilionURL(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return fallback;
  if (value === '' || (value.startsWith('/') && !value.startsWith('//'))) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : fallback; } catch { return fallback; }
}

/** Missing or unsafe model URLs keep their bundled file. */
export function normalizePavilionSettings(input: unknown): PavilionSettings {
  const raw = input && typeof input === 'object' ? (input as { models?: unknown }).models : undefined;
  const models = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return { models: Object.fromEntries(Object.entries(pavilionDefaults.models).map(([id, fallback]) => [id, safePavilionURL(models[id], fallback)])) as PavilionSettings['models'] };
}
