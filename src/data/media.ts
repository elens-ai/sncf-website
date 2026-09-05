/**
 * THE MEDIA LIBRARY — photographs and films for the four content pages.
 *
 * Written to the same contract as pillarMedia.ts, and for the same reason:
 * a slot whose `src` is null is NOT a bug and NOT a hole to be filled with a
 * stock photograph. It renders as an awaiting plate carrying its own caption,
 * so a gallery reads as a gallery being hung rather than collapsing to a
 * different layout and back again once the real file lands.
 *
 * The foundation has not yet supplied its photo and film archive. Every
 * entry below whose `src` is null is a real, named piece of that archive
 * that we know exists in the world and are waiting on. Nothing here is
 * invented: no stock imagery, and — this matters — no fabricated video
 * URLs. There is not one video file in this repository today, so every
 * film is an awaiting plate until somebody hands us the footage.
 *
 * TO ADD A PHOTOGRAPH
 *   1. put the file in /public/images (WebP, ~1600px on the long edge)
 *   2. set `src` to '/images/your-file.webp'
 *   3. write `alt` — describe what is HAPPENING, not "photo of X"
 *
 * TO ADD A FILM
 *   1. self-hosted: put the mp4 in /public/media and set `src` to it, with
 *      `poster` pointing at a still
 *   2. hosted elsewhere (YouTube/Vimeo): set `src` to the EMBED url. The
 *      player treats anything not ending in .mp4/.webm as an iframe embed.
 */

export type MediaKind = 'photo' | 'film';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  /** null until the foundation supplies the file — renders as an awaiting plate. */
  src: string | null;
  /** Still frame for a film. Optional; the plate falls back to its ink. */
  poster?: string;
  /** What is happening in the frame. Empty for awaiting plates. */
  alt: string;
  /** The line under the plate. Always written, awaiting or not. */
  caption: string;
  /** Wider cell in the mosaic. Use sparingly — two per gallery at most. */
  wide?: boolean;
}

/** Galleries are keyed by page, then by the subsection they belong to. */
export const MEDIA: Record<string, MediaItem[]> = {
  /* ---- CORE VALUES ---------------------------------------------------- */
  heal: [
    {
      id: 'heal-vertical',
      kind: 'photo',
      src: '/images/vertical-heal.webp',
      alt: 'The emblem for the Heal programme',
      caption: 'Heal — health, blood and sight',
      wide: true,
    },
    { id: 'heal-camp', kind: 'photo', src: null, alt: '', caption: 'A blood donation camp on Manav Ekta Diwas' },
    { id: 'heal-eye', kind: 'photo', src: null, alt: '', caption: 'Cataract surgery at a free eye camp' },
    { id: 'heal-film', kind: 'film', src: null, alt: '', caption: 'Film — a day inside a mobile dispensary' },
  ],
  enrich: [
    {
      id: 'enrich-vertical',
      kind: 'photo',
      src: '/images/vertical-enrich.webp',
      alt: 'The emblem for the Enrich programme',
      caption: 'Enrich — schooling, scholarship and skill',
      wide: true,
    },
    { id: 'enrich-class', kind: 'photo', src: null, alt: '', caption: 'A classroom at a foundation free school' },
    { id: 'enrich-nima', kind: 'photo', src: null, alt: '', caption: 'A NIMA skill centre in session' },
    { id: 'enrich-film', kind: 'film', src: null, alt: '', caption: 'Film — a Rajmata scholar’s first term' },
  ],
  empower: [
    {
      id: 'empower-vertical',
      kind: 'photo',
      src: '/images/vertical-empower.webp',
      alt: 'The emblem for the Empower programme',
      caption: 'Empower — youth, environment and relief',
      wide: true,
    },
    {
      id: 'empower-planting',
      kind: 'photo',
      src: '/images/mataji-rajpita-planting.webp',
      alt: 'A sapling being planted at a plantation drive',
      caption: 'A sapling goes in at a plantation drive',
    },
    { id: 'empower-relief', kind: 'photo', src: null, alt: '', caption: 'A relief team at work after a flood' },
    { id: 'empower-film', kind: 'film', src: null, alt: '', caption: 'Film — the Nirankari Youth Symposium' },
  ],

  /* ---- PROJECTS -------------------------------------------------------- */
  'project-amrit': [
    { id: 'amrit-ghat', kind: 'photo', src: null, alt: '', caption: 'A ghat before and after a cleaning drive', wide: true },
    { id: 'amrit-volunteers', kind: 'photo', src: '/images/volunteers-planning.webp', alt: 'Volunteers planning a service drive', caption: 'Volunteers plan the day’s stretch of bank' },
    { id: 'amrit-film', kind: 'film', src: null, alt: '', caption: 'Film — one river, one morning' },
  ],
  'project-oneness-vann': [
    { id: 'vann-forest', kind: 'photo', src: null, alt: '', caption: 'A micro-forest three years on', wide: true },
    { id: 'vann-planting', kind: 'photo', src: '/images/mataji-rajpita-planting.webp', alt: 'A sapling being planted', caption: 'The first sapling of a new vann' },
    { id: 'vann-film', kind: 'film', src: null, alt: '', caption: 'Film — how a vann is grown' },
  ],
  'watershed-programme': [
    { id: 'ws-check', kind: 'photo', src: null, alt: '', caption: 'A check dam holding the monsoon', wide: true },
    { id: 'ws-field', kind: 'photo', src: null, alt: '', caption: 'A field under crop where the land was arid' },
    { id: 'ws-film', kind: 'film', src: null, alt: '', caption: 'Film — the water that stayed' },
  ],
  'adopted-villages': [
    { id: 'av-school', kind: 'photo', src: null, alt: '', caption: 'A village school after adoption', wide: true },
    { id: 'av-street', kind: 'photo', src: null, alt: '', caption: 'A paved lane in Patti Kalyana' },
    { id: 'av-film', kind: 'film', src: null, alt: '', caption: 'Film — four villages, eight years' },
  ],

  /* ---- WHO WE ARE ------------------------------------------------------ */
  'who-we-are': [
    {
      id: 'wwa-volunteers',
      kind: 'photo',
      src: '/images/volunteers-planning.webp',
      alt: 'Foundation volunteers planning a service drive',
      caption: 'The work starts with a plan and a room of volunteers',
      wide: true,
    },
    { id: 'wwa-samagam', kind: 'photo', src: null, alt: '', caption: 'The sangat gathered at a Samagam' },
    { id: 'wwa-office', kind: 'photo', src: null, alt: '', caption: 'The foundation office at Nirankari Colony' },
    { id: 'wwa-film', kind: 'film', src: null, alt: '', caption: 'Film — a year of service in six minutes' },
  ],

  /* ---- OUR GUIDING FORCE ----------------------------------------------- */
  'guiding-force': [
    {
      id: 'gf-satguru',
      kind: 'photo',
      src: '/images/satguru-mata-sudiksha-ji.jpg',
      alt: 'Portrait of Satguru Mata Sudiksha Ji Maharaj',
      caption: 'Satguru Mata Sudiksha Ji Maharaj',
      wide: true,
    },
    {
      id: 'gf-planting',
      kind: 'photo',
      src: '/images/mataji-rajpita-planting.webp',
      alt: 'A sapling being planted at a plantation drive',
      caption: 'A sapling planted at a Oneness Vann drive',
    },
    { id: 'gf-satsang', kind: 'photo', src: null, alt: '', caption: 'Satsang — where the guidance is actually heard' },
    { id: 'gf-film', kind: 'film', src: null, alt: '', caption: 'Film — Her Holiness on service and oneness' },
  ],
};

/** How many plates in a gallery are actually hung today. */
export const mediaReady = (key: string) =>
  (MEDIA[key] ?? []).filter((m) => m.src).length;
