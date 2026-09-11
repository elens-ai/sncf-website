/** Authoring contract for the pavilion. Bounds protect the visitor's GPU and camera path. */
export const pavilionDefaults = {
  materials: {
    stone: { color: '#d8cdb8', roughness: .85, texture: '' },
    trim: { color: '#80745e', roughness: .7, texture: '' },
    plaster: { color: '#f2eadb', roughness: .85, texture: '' },
    brass: { color: '#88724b', roughness: .32, metalness: .78, texture: '' },
    wall: { color: '#bcbcaf', roughness: .9, texture: '' },
    wood: { color: '#544738', roughness: .65, texture: '' },
    displayBase: { color: '#243e38', roughness: .8, texture: '' },
    floor: { color: '#f4ead9', roughness: .68, texture: '' },
    carpet: { color: '#cf203b', roughness: .95, texture: '' },
    queueMetal: { color: '#b5a17b', roughness: .3, metalness: .72, texture: '' },
    queueBelt: { color: '#244b42', roughness: .94, texture: '' },
    planterColors: ['#e3d2b8', '#454d49', '#ad6f4c'],
  },
  chapters: [
    { id: 'heal', wall: '#709d83', panel: '#a8cbb5', led: '#53d695', ink: '#91d6ae' },
    { id: 'enrich', wall: '#498995', panel: '#b1dfe6', led: '#2dacc3', ink: '#2dacc3' },
    { id: 'empower', wall: '#bc839f', panel: '#dfb3c9', led: '#ed79b3', ink: '#e6a4be' },
    { id: 'projects', wall: '#6da7a9', panel: '#a4d1d0', led: '#55d5dc', ink: '#9cd5da' },
  ],
  lighting: {
    exposure: 1.02, background: '#111714', fogNear: 25, fogFar: 90,
    pendantColor: '#fff1db', pendantIntensity: 60, edgeIntensity: 14,
    pictureColor: '#fff2de', pictureIntensity: 14, exhibitColor: '#fff5e3', exhibitIntensity: 32,
    frameGlow: 1, beamOpacity: .055,
  },
  camera: { fieldOfView: 48, positionSmoothing: 16, turnSmoothing: 12, scrollSmoothing: 8, photoPause: .25, modelFloat: .09, modelSway: .35 },
  performance: { maxWidth: 1280, maxHeight: 1000, fps: 60, adaptiveQuality: true, minScale: .65, maxScale: 1, photoLoadDistance: 70 },
  components: { planters: true, barriers: true, benches: true, pendants: true, photoLights: true, frameBacklights: true, edgeStrips: true, models: true, windows: true, carpet: true },
  finale: { logo: '/images/sncf-logo.webp', model: '/models/sncf-emblem.glb', modelSize: 2.4, modelHeight: 4.35, modelLightIntensity: 8, title: 'Thank you for visiting', subtitle: 'SERVICE WITH HUMILITY', background: '#183d36', textColor: '#d6eee4', mosaic: true, mosaicHue: 157, mosaicSaturation: 28, tileSize: 24 },
  windows: {
    amrit: { video: '/video/amrit-lake.mp4', poster: '/images/pavilion/projects-1.jpg', woodColor: '#ffffff', grainColor: '#f5f4ef', woodRoughness: .48, glassColor: '#e8f5f3', glassOpacity: .07, frost: true, frostOpacity: .94, frostBlur: .024, autoplay: true },
    oneness: { video: '/video/oneness-forest.mp4', poster: '/images/pavilion/projects-2.jpg', woodColor: '#ffffff', grainColor: '#f5f4ef', woodRoughness: .48, glassColor: '#e8f5f3', glassOpacity: .07, frost: false, frostOpacity: .94, frostBlur: .024, autoplay: true },
  },
  models: { heal: '/models/heal.glb', enrich: '/models/enrich.glb?v=2dacc3', empower: '/models/empower.glb', projects: '/models/projects.glb?v=sncf-bloom-balanced', amrit: '/models/amrit.glb', oneness: '/models/oneness.glb' },
};
export type PavilionSettings = typeof pavilionDefaults;

export const pavilionNumberBounds: Record<string, readonly [number, number]> = {
  exposure: [.25, 2.5], roughness: [0, 1], metalness: [0, 1],
  fogNear: [5, 80], fogFar: [30, 130], pendantIntensity: [0, 120], edgeIntensity: [0, 50], pictureIntensity: [0, 50], exhibitIntensity: [0, 80], frameGlow: [0, 2], beamOpacity: [0, .2],
  fieldOfView: [35, 70], positionSmoothing: [3, 30], turnSmoothing: [3, 30], scrollSmoothing: [3, 20], photoPause: [0, .65], modelFloat: [0, .2], modelSway: [0, .6],
  maxWidth: [640, 1920], maxHeight: [480, 1440], fps: [24, 60], minScale: [.5, 1], maxScale: [.5, 1], photoLoadDistance: [40, 100],
  modelSize: [1, 3], modelHeight: [3.8, 4.8], modelLightIntensity: [0, 80], mosaicHue: [0, 360], mosaicSaturation: [0, 100], tileSize: [12, 64], woodRoughness: [0, 1], glassOpacity: [0, .5], frostOpacity: [0, 1], frostBlur: [0, .05],
};

/** Accept only web media URLs; never allow scripts or protocol-relative URLs. */
export function safePavilionURL(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return fallback;
  if (value === '' || (value.startsWith('/') && !value.startsWith('//'))) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? value : fallback; } catch { return fallback; }
}

export function normalizePavilionSettings(input: unknown): PavilionSettings {
  const visit = (fallback: unknown, raw: unknown, key: string, path: string): unknown => {
    if (Array.isArray(fallback)) return fallback.map((entry, index) => visit(entry, Array.isArray(raw) ? raw[index] : undefined, key, `${path}.${index}`));
    if (fallback && typeof fallback === 'object') {
      const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
      return Object.fromEntries(Object.entries(fallback).map(([name, value]) => [name, visit(value, source[name], name, `${path}.${name}`)]));
    }
    if (typeof fallback === 'boolean') return typeof raw === 'boolean' ? raw : fallback;
    if (typeof fallback === 'number') { const bounds = pavilionNumberBounds[key]; return typeof raw === 'number' && Number.isFinite(raw) ? bounds ? Math.min(bounds[1], Math.max(bounds[0], raw)) : fallback : fallback; }
    if (typeof fallback === 'string') {
      if (key === 'id') return fallback;
      if (path.startsWith('.models.') || ['texture', 'video', 'poster', 'logo', 'model'].includes(key)) return safePavilionURL(raw, fallback);
      if (fallback.startsWith('#')) return typeof raw === 'string' && /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
      return typeof raw === 'string' ? raw.slice(0, 180) : fallback;
    }
    return fallback;
  };
  const settings = visit(pavilionDefaults, input, '', '') as PavilionSettings;
  settings.lighting.fogFar = Math.max(settings.lighting.fogNear + 5, settings.lighting.fogFar);
  settings.performance.maxScale = Math.max(settings.performance.minScale, settings.performance.maxScale);
  settings.performance.fps = Math.round(settings.performance.fps);
  settings.finale.tileSize = Math.round(settings.finale.tileSize);
  return settings;
}
