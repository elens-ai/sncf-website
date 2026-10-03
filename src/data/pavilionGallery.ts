import { bindCMSData, resolvePavilionGallery } from '../cms/data';

export const PAVILION_IDS = ['heal', 'enrich', 'empower', 'projects'] as const;
/* The foundation's own photographs, five to a pillar, chosen from its 2026
   exhibition archive (H:/For sncf exhibition 2026): each pillar's programmes
   at work. [caption, alt] — the alt says what is happening in the frame. */
const PHOTOS = [
  [
    ['Manav Ekta Diwas blood drive', 'Donors giving blood at the foundation’s Manav Ekta Diwas drive in Delhi, April 2026'],
    ['A free eye checkup camp', 'An elderly woman tries trial lenses at a free eye checkup camp in Chembur, Mumbai'],
    ['Health checkup at a school', 'A doctor examines a student at a health checkup camp in a Sant Nirankari Public School'],
    ['A health screening camp', 'A volunteer checks an elderly woman’s blood pressure at a health screening camp'],
    ['International Yoga Day', 'Participants meditating at the foundation’s International Yoga Day session in Ludhiana'],
  ],
  [
    ['In the classroom', 'Students at their desks at Sant Nirankari Public School, Tilak Nagar'],
    ['The computer lab', 'Students at work in the computer lab of Sant Nirankari Public School, Nirankari Colony'],
    ['Music at NIMA', 'Students playing harmonium and tabla at the Nirankari Institute of Music and Art, Mumbai'],
    ['Sant Nirankari Public School', 'Students of Sant Nirankari Public School, Avtar Enclave, in the school garden'],
    ['A sewing centre', 'Women learning to stitch at the foundation’s sewing centre in Yamuna Nagar'],
  ],
  [
    ['World Environment Day, Tehri', 'Volunteers clearing litter from the shore of the Tehri lake on World Environment Day 2026'],
    ['A sapling in Mussoorie', 'A volunteer plants a sapling on a hillside in Mussoorie on World Environment Day'],
    ['Youth athletics', 'Athletes racing at Jawaharlal Nehru Stadium, Delhi, April 2026'],
    ['Mass marriages', 'Couples at the foundation’s mass marriage ceremony, April 2026'],
    ['Reduce, reuse, recycle', 'Students carrying reduce, reuse and recycle placards on World Environment Day in Shimla'],
  ],
  [
    ['Project Amrit, Mantova', 'Project Amrit volunteers clearing a riverbank in Mantova, Italy'],
    ['Oneness Vann, Solapur', 'Women planting saplings for a Oneness Vann micro-forest in Solapur'],
    ['Project Amrit volunteers', 'Project Amrit volunteers in Mantova with the litter they gathered'],
    ['Planting a Oneness Vann', 'Volunteers planting beneath the Oneness Vann banner in Solapur'],
    ['Project Amrit, Christchurch', 'Project Amrit volunteers by the water in Christchurch, New Zealand'],
  ],
];
/* `source` is the photograph's credit link: the foundation's own file. */
export const DEFAULT_PAVILION_GALLERY = PAVILION_IDS.map((id, room) => PHOTOS[room].map(([caption, alt], i) => {
  const src = `/images/pavilion/${id}-${i + 1}.jpg`;
  return { id: `${id}-gallery-${i + 1}`, src, caption, alt, source: src };
}));

export let PAVILION_GALLERY = bindCMSData(DEFAULT_PAVILION_GALLERY, resolvePavilionGallery, value => { PAVILION_GALLERY = value; });

/** Photo `n` (1–5) of a pillar's set — the one place these photos are edited
    (CMS Galleries → "Pillar photos"), whether shown as tiles, emblem or collage. */
export const roomPhoto = (id: string, n: number) =>
  PAVILION_GALLERY[PAVILION_IDS.indexOf(id as typeof PAVILION_IDS[number])]?.[n - 1]?.src ?? `/images/pavilion/${id}-${n}.jpg`;

/** The farewell passage uses 40% of a full chapter's scroll distance. */
export function pavilionProgress(scrollFraction: number) {
  const distance = Math.max(0, Math.min(1, scrollFraction)) * 4.4;
  return distance <= 4 ? distance : 4 + (distance - 4) / .4;
}

export function pavilionScrollFraction(progress: number) {
  return (progress <= 4 ? progress : 4 + (progress - 4) * .4) / 4.4;
}

/** Keep the exhibit's pose continuous even after the next gallery becomes active. */
export function pavilionExhibitReveal(progress: number, room: number) {
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const local = progress - room;
  return ease(local / .1) * (1 - ease((local - .3) / .18));
}

/** Each passage gets most of the scroll distance; its exhibit then holds still. */
export function pavilionPhase(progress: number) {
  if (progress <= .03) return { room: 0, gallery: false, photo: 0, arrival: 0 };
  if (progress >= 4.8) return { room: 3, gallery: false, photo: 4, arrival: 1 };
  const room = Math.min(3, Math.floor(Math.max(0, progress - .001)));
  const part = Math.min(1, progress - room);
  return { room, gallery: part >= .3, photo: part < .5 ? 0 : Math.min(4, 1 + Math.floor((part-.5)/.11)), arrival: Math.max(0, Math.min(1, part / .1)) };
}

/** Maps a bundled room-photo path ("/images/pavilion/heal-2.jpg") to that photo's current source. */
export const roomPhotoFor = (path: string) => {
  const match = /^\/images\/pavilion\/(heal|enrich|empower|projects)-([1-5])\.jpg$/.exec(path);
  return match ? roomPhoto(match[1], Number(match[2])) : path;
};
