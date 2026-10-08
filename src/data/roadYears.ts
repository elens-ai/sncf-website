import { getCMSCopy } from '../cms/runtime';
import { ROAD_EVENTS } from './roadEvents';
import { AWARDS } from './awards';

const c = (key: string, fallback: string) => getCMSCopy(`copy.RoadWall.${key}`, fallback);

/**
 * THE ROAD SO FAR, A YEAR AT A TIME — what the Who We Are page's wall
 * (RoadWall) brings in at each year: the year's moments and their
 * photographs. Drawn from the foundation's own records only: the road's
 * events (roadEvents.ts) and the dated honours of the awards register
 * (awards.ts), an honour whose picture an event already shows left out as
 * the same moment. An undated honour has no year to stand at, so it is not
 * here. A range ('2024–25') stands at its first year.
 */
export const ROAD_FIRST = 2010;
export const ROAD_LAST = 2026;

export interface RoadPhoto { src: string; alt: string; focal?: string; document?: boolean }
export interface RoadMoment { id: string; title: string; text: string; href?: string; photo?: RoadPhoto }
export interface RoadYear { year: number; moments: RoadMoment[]; photos: RoadPhoto[] }

/** Photographs of a moment beyond the one its record carries, from the same place on the site. */
const MORE_PHOTOS = (): Record<string, RoadPhoto[]> => ({
  'health-city-dedicated': [
    { src: '/images/projects/health-city/plaque.webp', alt: c('hc-plaque', 'The plaque recording the dedication of Sant Nirankari Health City to the service of humanity') },
    { src: '/images/projects/health-city/ceremony.webp', alt: c('hc-ceremony', 'The ceremony at Sant Nirankari Health City') },
  ],
  'health-city-opd': [
    { src: '/images/projects/health-city/team-atrium.webp', alt: c('hc-atrium', 'The Health City’s team in the hospital’s atrium') },
  ],
});

export function roadYears(): RoadYear[] {
  const byYear = new Map<number, { moments: RoadMoment[]; photos: RoadPhoto[] }>();
  const at = (year: number) => {
    if (!byYear.has(year)) byYear.set(year, { moments: [], photos: [] });
    return byYear.get(year)!;
  };
  const shown = new Set<string>();
  for (const event of ROAD_EVENTS) {
    const photo = event.logo ? undefined : { src: event.photo, alt: event.alt, document: event.document };
    const entry = at(event.year);
    entry.moments.push({ id: event.id, title: event.title, text: event.text, href: event.href, photo });
    for (const p of [...(photo ? [photo] : []), ...(MORE_PHOTOS()[event.id] ?? [])]) { entry.photos.push(p); shown.add(p.src); }
  }
  for (const award of AWARDS) {
    const year = Number(/\d{4}/.exec(award.year ?? '')?.[0]);
    if (!year || year < ROAD_FIRST || year > ROAD_LAST) continue;
    const photos = (award.photos ?? []).map(p => ({ src: p.src, alt: p.alt, focal: p.focal }));
    if (photos[0] && shown.has(photos[0].src)) continue;
    const entry = at(year);
    entry.moments.push({ id: award.id, title: award.title, text: award.awardedBy, href: '/#awards-section', photo: photos[0] });
    for (const p of photos) if (!shown.has(p.src)) { entry.photos.push(p); shown.add(p.src); }
  }
  return [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, entry]) => ({ year, ...entry }));
}
