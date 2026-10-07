import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';
import { HEAL_LOGO_OUTLINE } from './healLogoOutline';

export type MosaicPillar = 'heal' | 'enrich' | 'empower' | 'projects';

/** The Enrich book's cover, showing past its pages at the sides and the foot. */
export const BOOK_COVER = 'M6 23L11.65 20V95C35 92 54 97 71.3 105C94 97 116 92 132.34 95V20L138 23V105H6Z';

// Curves measured in reference-image coordinates, then uniformly scaled to the
// shared viewBox. The book's continuous spine and Empower's flat base are intentional.
export const PILLAR_LOGOS = {
  heal: { label: 'Heal', paths: HEAL_LOGO_OUTLINE, tint: '#1c9b68', edge: '#f1fff5', caption: 'Care, in every leaf.', description: 'healthcare professionals and patient care' },
  enrich: {
    label: 'Enrich',
    paths: ['M11.650 10.252C32.620 3.728 55.454 6.291 71.298 20.271L71.298 102.986C52.425 94.598 31.688 90.171 11.650 95.064Z', 'M71.298 20.271C87.841 6.524 110.442 3.728 132.344 10.252L132.344 95.064C111.141 90.404 90.637 94.831 71.298 102.986Z'],
    tint: '#2cacc0', edge: '#e9faff', caption: 'Possibility, on every page.', description: 'education, students and learning',
  },
  empower: {
    label: 'Empower',
    paths: [
      'M86.395 22.385A17.02 17.02 0 1 1 52.355 22.385A17.02 17.02 0 1 1 86.395 22.385Z',
      'M9.805 7.215L57.165 39.405C65.120 44.585 72.705 44.585 81.030 39.775L128.945 8.325L136.160 17.205L94.165 45.510C87.135 50.505 85.655 56.980 85.655 65.490L85.655 106.375L51.430 106.375L51.430 65.490C51.430 56.980 49.580 50.505 44.400 46.620L2.405 17.575Z',
    ],
    tint: '#db4293', edge: '#fff0f8', caption: 'Together, we rise.', description: 'environmental care, growing plants and sustainable communities',
  },
  projects: {
    label: 'Projects', paths: PROJECTS_LOGO_OUTLINE, tint: '#78bdc3', edge: '#edfbf6',
    caption: 'One purpose. Lasting impact.', description: 'forestry, water conservation and healthcare projects surrounding the SNCF badge',
  },
} satisfies Record<MosaicPillar, { label: string; paths: string[]; tint: string; edge: string; caption: string; description: string }>;

/* EMPOWER, ONE OF A GROUP. Wherever Empower's figure is shown — its photo
   emblem, its flat marks and icons — it stands with two companions: the same
   figure twice more, a step behind it and lower on either side, a little
   smaller, and faint: a pyramid of three, the one in front raised up by the
   group. In emblem units, about the figure's own middle. */
export const EMPOWER_MIDDLE = [69.4, 60] as const;
export const EMPOWER_COMPANIONS = [
  { dx: -36, dy: 18, k: 0.8 },
  { dx: 36, dy: 18, k: 0.8 },
] as const;
export const companionTransform = (mate: { dx: number; dy: number; k: number }, tilt = 0) =>
  `translate(${EMPOWER_MIDDLE[0] + mate.dx} ${EMPOWER_MIDDLE[1] + mate.dy}) rotate(${tilt}) scale(${mate.k}) translate(${-EMPOWER_MIDDLE[0]} ${-EMPOWER_MIDDLE[1]})`;
/** The three together, in emblem units: from the left companion's raised hand to the right one's, and from the
    figure's head to the companions' feet. */
export const EMPOWER_TRIO_BOX = { x: -20.2, y: 5.4, w: 179, h: 109.7 } as const;
/** The three fitted into the emblem box (146 × 120), for a flat mark the size of the other pillars'. */
export const EMPOWER_TRIO_MARK_FIT = (() => {
  const s = Math.min(146 / EMPOWER_TRIO_BOX.w, 120 / EMPOWER_TRIO_BOX.h);
  const cx = EMPOWER_TRIO_BOX.x + EMPOWER_TRIO_BOX.w / 2, cy = EMPOWER_TRIO_BOX.y + EMPOWER_TRIO_BOX.h / 2;
  return `translate(73 60) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`;
})();
