import { bindCMSData, resolveGalleryGroups, validMedia } from '../cms/data';

/**
 * THE MEDIA LIBRARY — photographs and films for the four content pages.
 *
 * Written to the same contract as pillarMedia.ts, and for the same reason:
 * a slot whose `src` is null is NOT a bug and NOT a hole to be filled with a
 * stock photograph. It renders as an awaiting plate carrying its own caption,
 * so a gallery reads as a gallery being hung rather than collapsing to a
 * different layout and back again once the real file lands.
 *
 * Photographs from the foundation's 2026 exhibition archive hang where one
 * fits the slot. The rest of the archive has not been supplied yet. Every
 * entry below whose `src` is null is a real, named piece of that archive
 * that we know exists in the world and are waiting on. Nothing here is
 * invented: no stock imagery, and — this matters — no fabricated video
 * URLs. There is not one video file in this repository today, so every
 * film is an awaiting plate until somebody hands us the footage.
 *
 * NOTE ON WHAT IS HERE. The three programme emblems used to open each
 * gallery as its widest plate. They were the only "photographs" most rooms
 * had, and they are not photographs — they are the verticals' icons, which
 * already appear on each room's threshold. A gallery of the archive should
 * contain the archive.
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
export const DEFAULT_MEDIA: Record<string, MediaItem[]> = {
  /* ---- PROJECTS: keyed by the project's id, so renaming one keeps its gallery. */
  'project-amrit': [
    { id: 'amrit-ghat', kind: 'photo', src: '/images/programmes/amrit-riverbank.webp', alt: 'Project Amrit volunteers clearing a riverbank in Mantova, Italy', caption: 'Clearing a riverbank in Mantova, Italy', wide: true },
    { id: 'amrit-volunteers', kind: 'photo', src: '/images/volunteers-planning.webp', alt: 'Volunteers planning a service drive', caption: 'Volunteers plan the day’s stretch of bank' },
    { id: 'amrit-film', kind: 'film', src: null, alt: '', caption: 'Film — one river, one morning' },
  ],
  'oneness-vann': [
    { id: 'vann-forest', kind: 'photo', src: '/images/programmes/oneness-vann-group.webp', alt: 'Volunteers planting beneath the Oneness Vann banner in Solapur', caption: 'A new Oneness Vann in Solapur, August 2026', wide: true },
    { id: 'vann-planting', kind: 'photo', src: '/images/mataji-rajpita-planting.webp', alt: 'A sapling being planted', caption: 'The first sapling of a new vann' },
    { id: 'vann-film', kind: 'film', src: null, alt: '', caption: 'Film — how a vann is grown' },
  ],
  watershed: [
    { id: 'ws-check', kind: 'photo', src: null, alt: '', caption: 'A check dam holding the monsoon', wide: true },
    { id: 'ws-field', kind: 'photo', src: null, alt: '', caption: 'A field under crop where the land was arid' },
    { id: 'ws-film', kind: 'film', src: null, alt: '', caption: 'Film — the water that stayed' },
  ],
  'adopted-villages': [
    { id: 'av-school', kind: 'photo', src: '/images/programmes/adopted-villages-health-camp.webp', alt: 'Villagers at a health screening camp in Mandaura, one of the adopted villages', caption: 'A health camp in Mandaura, March 2026', wide: true },
    { id: 'av-street', kind: 'photo', src: '/images/programmes/adopted-villages-mandaura.webp', alt: 'A volunteer checks an elderly villager in Mandaura', caption: 'Care in Mandaura' },
    { id: 'av-film', kind: 'film', src: null, alt: '', caption: 'Film — four villages, eight years' },
  ],

  /* ---- WHO WE ARE ------------------------------------------------------ */
  'who-we-are': [
    {
      id: 'wwa-volunteers',
      kind: 'photo',
      src: '/images/volunteers-planning.webp',
      alt: 'Illustration of foundation volunteers planning a service drive',
      caption: 'The work starts with a plan and a room of volunteers',
      wide: true,
    },
    { id: 'wwa-sewadal', kind: 'photo', src: '/images/welcome-volunteers.jpg', alt: 'Foundation volunteers in their blue shirts, hands folded, beneath a wall that reads Service with Humility', caption: 'Volunteers of the foundation, beneath its motto' },
    { id: 'wwa-school-band', kind: 'photo', src: '/images/programmes/schools-band.webp', alt: 'The school band of Sant Nirankari Public School, Govindpuri', caption: 'The school band of Sant Nirankari Public School, Govindpuri' },
    { id: 'wwa-marriages', kind: 'photo', src: '/images/programmes/mass-marriages-hall.webp', alt: 'The mass marriage ceremony, April 2026', caption: 'The mass marriage ceremony, April 2026' },
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
    { id: 'gf-dedication', kind: 'photo', src: '/images/programmes/health-centre-dedication.jpg', alt: 'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji beside the plaque dedicating Sant Nirankari Health City to the service of humanity', caption: 'The dedication of Sant Nirankari Health City, 23 February 2026' },
    { id: 'gf-blood-donation', kind: 'photo', src: '/images/programmes/blood-donation-satguru.jpg', alt: 'Satguru Mata Sudiksha Ji Maharaj beside a donor at a blood donation camp', caption: 'Satguru Mata Sudiksha Ji Maharaj at a blood donation camp' },
    { id: 'gf-health-team', kind: 'photo', src: '/images/programmes/health-centre-team.jpg', alt: 'Satguru Mata Sudiksha Ji Maharaj with the health centre’s team', caption: 'With the health centre’s team' },
    { id: 'gf-satsang', kind: 'photo', src: null, alt: '', caption: 'Satsang — where the guidance is actually heard' },
    { id: 'gf-film', kind: 'film', src: null, alt: '', caption: 'Film — Her Holiness on service and oneness' },
  ],
};

export let MEDIA: Record<string, MediaItem[]> = bindCMSData(DEFAULT_MEDIA, (publication, fallback) => resolveGalleryGroups(publication, fallback, 'media', validMedia), value => { MEDIA = value; });

/** How many plates in a gallery are actually hung today. */
export const mediaReady = (key: string) =>
  (MEDIA[key] ?? []).filter((m) => m.src).length;
