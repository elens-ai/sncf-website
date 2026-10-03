import type { Activity } from './activities';
import { PAVILION_GALLERY, PAVILION_IDS } from './pavilionGallery';
import { slug } from '../utils/slug';

/**
 * WHICH PHOTOGRAPH EACH PROGRAMME TILE SHOWS.
 *
 * activities.ts is the content of record, and an activity's `images` are
 * its own photographs. A programme with none yet (COVID-19 relief, the
 * watershed) borrows one of its pillar's photographs instead — the
 * foundation's, but of another programme — and the tile says it is
 * illustrative.
 *
 * The pairing lives HERE, not in activities.ts, for two reasons: an
 * illustrative image must never be mistaken for the activity's own record
 * (the same rule that keeps pillarMedia.ts apart from pillars.ts), and the
 * CMS slot codemod walks components and pages only, so nothing in this
 * file is rewritten into a copy slot.
 *
 * An activity's own `images[0]` — from the data or from the CMS — always
 * wins and is shown without the illustrative label.
 */
export interface ActivityImage {
  src: string;
  alt: string;
  /** True when the photograph is borrowed stock, not the programme itself. */
  illustrative: boolean;
  /** The line under the picture in the spotlight; the pavilion set's caption. */
  caption?: string;
}

/** activity id → the pillar photograph it borrows when it has none of its own.
    Each comment is that photo's caption. */
export const DEFAULT_ACTIVITY_IMAGERY: Record<string, string> = {
  /* heal */
  'blood-donation': 'heal-gallery-1',      // Manav Ekta Diwas blood drive
  'health-checkup': 'heal-gallery-4',      // A health screening camp
  'eye-checkup': 'heal-gallery-2',         // A free eye checkup camp
  'health-centre': 'heal-gallery-3',       // Health checkup at a school
  'blood-bank': 'heal-gallery-5',          // International Yoga Day
  /* enrich */
  'schools-colleges': 'enrich-gallery-1',  // In the classroom
  'scholarships': 'enrich-gallery-4',      // Sant Nirankari Public School
  'free-schools': 'enrich-gallery-2',      // The computer lab
  'skill-nima': 'enrich-gallery-3',        // Music at NIMA
  'skill-trades': 'enrich-gallery-5',      // A sewing centre
  /* empower */
  'tree-plantation': 'empower-gallery-2',  // A sapling in Mussoorie
  'cleanliness': 'empower-gallery-5',      // Reduce, reuse, recycle
  'covid-relief': 'empower-gallery-1',     // World Environment Day, Tehri
  'mass-marriages': 'empower-gallery-4',   // Mass marriages
  'financial-support': 'empower-gallery-3',// Youth athletics
  /* projects — projects-gallery-5 stays free: four projects, five photographs */
  'project-amrit': 'projects-gallery-1',   // Project Amrit, Mantova
  'oneness-vann': 'projects-gallery-2',    // Oneness Vann, Solapur
  'watershed': 'projects-gallery-4',       // Planting a Oneness Vann
  'adopted-villages': 'projects-gallery-3',// Project Amrit volunteers
};

const PHOTO_ID = /^(heal|enrich|empower|projects)-gallery-([1-5])$/;
/* A borrowed photograph is real but shows another programme: say so to a
   screen reader as well as on the tile. */
const borrowedAlt = (alt: string) => (/^Illustrative photograph:/i.test(alt) ? alt : `Illustrative photograph: ${alt}`);

export function activityImage(activity: Activity): ActivityImage | null {
  const own = activity.images[0];
  if (own) return { src: own.src, alt: own.alt, illustrative: false };
  const match = PHOTO_ID.exec(DEFAULT_ACTIVITY_IMAGERY[activity.id] ?? '');
  if (!match) return null;
  /* Found by room and slot rather than by id: an editor who replaces a
     pavilion photograph keeps its slot. And PAVILION_GALLERY is a live
     binding, reassigned on publish — read it here, never at module scope. */
  const room = PAVILION_IDS.indexOf(match[1] as (typeof PAVILION_IDS)[number]);
  const photo = PAVILION_GALLERY[room]?.[Number(match[2]) - 1];
  return photo ? { src: photo.src, alt: borrowedAlt(photo.alt), illustrative: true } : null;
}

/**
 * THE ALBUM TURNS. While a chapter rests on screen its illustrative prints
 * change every few seconds: the pillar's whole set moves one place along,
 * so at any step every programme still shows a different photograph, and
 * step 0 is exactly the default pairing above. A programme's own photograph
 * (a foundation one, labelled as such) never rotates.
 */
export function activityImageAt(activity: Activity, step: number): ActivityImage | null {
  const start = activityImage(activity);
  if (!start || !start.illustrative || step === 0) return start;
  const room = PAVILION_IDS.indexOf(activity.pillarId);
  const set = PAVILION_GALLERY[room] ?? [];
  const base = set.findIndex(photo => photo.src === start.src);
  if (base < 0 || set.length < 2) return start;
  const photo = set[(base + step) % set.length];
  return { src: photo.src, alt: borrowedAlt(photo.alt), illustrative: true };
}

/** Where "Explore" leads: the Projects page for flagship projects, Core Values otherwise. */
export const exploreHref = (activity: Activity) =>
  activity.pillarId === 'projects' ? `/projects#${slug(activity.title)}` : `/core-values#${activity.id}`;

/**
 * THE PHOTOGRAPHS A PROGRAMME OPENS ONTO — the tile's picture first, then the
 * activity's own photographs, then the rest of its pillar's photographs,
 * each labelled for what it is. This is what the spotlight browses. As the
 * foundation supplies real photographs (in the data or from the CMS) they
 * take their place ahead of the borrowed ones without any change here.
 */
export function activityGallery(activity: Activity): ActivityImage[] {
  const lead = activityImage(activity);
  const own = activity.images.map(image => ({ src: image.src, alt: image.alt, illustrative: false }));
  const room = PAVILION_IDS.indexOf(activity.pillarId);
  const borrowed = (PAVILION_GALLERY[room] ?? []).map(photo => ({ src: photo.src, alt: borrowedAlt(photo.alt), illustrative: true, caption: photo.caption }));
  const seen = new Set<string>();
  const gallery: ActivityImage[] = [];
  for (const image of [lead, ...own, ...borrowed]) {
    if (!image || seen.has(image.src)) continue;
    seen.add(image.src);
    gallery.push(image);
  }
  return gallery;
}
