import type { Activity } from './activities';
import { PAVILION_GALLERY, PAVILION_IDS } from './pavilionGallery';
import { slug } from '../utils/slug';

/**
 * WHICH PHOTOGRAPH EACH PROGRAMME TILE SHOWS.
 *
 * activities.ts is the content of record, and an activity's `images` stay
 * empty until the foundation supplies photographs of that programme. Until
 * then the tiles borrow from the pavilion's set — user-approved illustrative
 * stock, not pictures of SNCF programmes — and say so on the tile.
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

/** activity id → pavilion photograph id. Each comment is that photo's caption. */
export const DEFAULT_ACTIVITY_IMAGERY: Record<string, string> = {
  /* heal */
  'blood-donation': 'heal-gallery-5',      // Ready to serve — a healthcare professional wearing a mask
  'health-checkup': 'heal-gallery-4',      // The person at the heart of care — a doctor speaking with a patient
  'eye-checkup': 'heal-gallery-3',         // Knowledge that supports care — an anatomical teaching model
  'health-centre': 'heal-gallery-2',       // Working together for better health — a surgical team
  'blood-bank': 'heal-gallery-1',          // Care begins with a connection — a professional holding a phone
  /* enrich */
  'schools-colleges': 'enrich-gallery-2',  // Learning, together — students in a classroom
  'scholarships': 'enrich-gallery-4',      // Ideas grow when we share them — an educational gathering
  'free-schools': 'enrich-gallery-1',      // Every beginning deserves a chance — books on a desk
  'skill-nima': 'enrich-gallery-3',        // Skills for a changing world — a learner with a laptop
  'skill-trades': 'enrich-gallery-5',      // Opening doors through education — open books and notes
  /* empower — tree plantation carries its own photograph in activities.ts */
  'tree-plantation': 'empower-gallery-4',  // A shared responsibility — hands holding a small plant
  'cleanliness': 'empower-gallery-2',      // Change starts in our hands — gardening tools and soil
  'covid-relief': 'empower-gallery-1',     // Growing a more sustainable future — a harvest of vegetables
  'mass-marriages': 'empower-gallery-5',   // Protecting what sustains us — sunlight on a forest floor
  'financial-support': 'empower-gallery-3',// Small beginnings. Lasting growth. — seedlings in pots
  /* projects — projects-gallery-5 stays free: four projects, five photographs */
  'project-amrit': 'projects-gallery-1',   // Project Amrit — Clean Water, Pure Mind — a forest river
  'oneness-vann': 'projects-gallery-2',    // Oneness Vann — a living forest — a waterfall
  'watershed': 'projects-gallery-4',       // Resilient land. Stronger communities. — farmland at sunset
  'adopted-villages': 'projects-gallery-3',// Making room for nature — a walkway through a forest
};

const PHOTO_ID = /^(heal|enrich|empower|projects)-gallery-([1-5])$/;

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
  return photo ? { src: photo.src, alt: photo.alt, illustrative: true } : null;
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
  return { src: photo.src, alt: photo.alt, illustrative: true };
}

/** Where "Explore" leads: the Projects page for flagship projects, Core Values otherwise. */
export const exploreHref = (activity: Activity) =>
  activity.pillarId === 'projects' ? `/projects#${slug(activity.title)}` : `/core-values#${activity.id}`;

/**
 * THE PHOTOGRAPHS A PROGRAMME OPENS ONTO — the tile's picture first, then the
 * activity's own photographs, then the rest of its pillar's illustrative set,
 * each labelled for what it is. This is what the spotlight browses. As the
 * foundation supplies real photographs (in the data or from the CMS) they
 * take their place ahead of the borrowed ones without any change here.
 */
export function activityGallery(activity: Activity): ActivityImage[] {
  const lead = activityImage(activity);
  const own = activity.images.map(image => ({ src: image.src, alt: image.alt, illustrative: false }));
  const room = PAVILION_IDS.indexOf(activity.pillarId);
  const borrowed = (PAVILION_GALLERY[room] ?? []).map(photo => ({ src: photo.src, alt: photo.alt, illustrative: true, caption: photo.caption }));
  const seen = new Set<string>();
  const gallery: ActivityImage[] = [];
  for (const image of [lead, ...own, ...borrowed]) {
    if (!image || seen.has(image.src)) continue;
    seen.add(image.src);
    gallery.push(image);
  }
  return gallery;
}
