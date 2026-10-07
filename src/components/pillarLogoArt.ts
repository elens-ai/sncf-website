import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';
import { HEAL_LOGO_OUTLINE } from './healLogoOutline';

export type MosaicPillar = 'heal' | 'enrich' | 'empower' | 'projects';

/** Rounded cover and inset pages follow the supplied Enrich GLB's front silhouette. */
export const BOOK_COVER = 'M8 24Q8 21 12 19Q14 18 14 14Q14 11 18 9C37 3 55 7 72 18C89 7 107 3 126 9Q131 10 131 14Q130 18 134 20Q136 21 136 24V96Q136 100 132 100H83C79 100 78 103 72 103C66 103 65 100 61 100H12Q8 100 8 96Z';

// Curves measured in reference-image coordinates, then uniformly scaled to the
// shared viewBox. The book's continuous spine and Empower's flat base are intentional.
export const PILLAR_LOGOS = {
  heal: { label: 'Heal', paths: HEAL_LOGO_OUTLINE, tint: '#1c9b68', edge: '#f1fff5', caption: 'Care, in every leaf.', description: 'healthcare professionals and patient care' },
  enrich: {
    label: 'Enrich',
    paths: ['M18 17Q18 14 21 13C39 7 56 12 67 20Q70 22 70 26V62Q70 65 72 67V92C67 94 61 87 43 86C33 85 27 86 21 88Q18 89 18 85Z', 'M126 17Q126 14 123 13C105 7 88 12 77 20Q74 22 74 26V62Q74 65 72 67V92C77 94 83 87 101 86C111 85 117 86 123 88Q126 89 126 85Z'],
    tint: '#2cacc0', edge: '#f8f8ff', caption: 'Possibility, on every page.', description: 'education, students and learning',
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
   figure twice more, a step behind it and lower on either side, leaning out,
   a little smaller, and faint: a pyramid of three, the one in front raised up
   by the group. In emblem units, about the figure's own middle. */
export const EMPOWER_MIDDLE = [69.4, 60] as const;
export const EMPOWER_COMPANIONS = [
  { dx: -36, dy: 18, k: 0.8 },
  { dx: 36, dy: 18, k: 0.8 },
] as const;
export const companionTransform = (mate: { dx: number; dy: number; k: number }, tilt = 0) =>
  `translate(${EMPOWER_MIDDLE[0] + mate.dx} ${EMPOWER_MIDDLE[1] + mate.dy}) rotate(${tilt}) scale(${mate.k}) translate(${-EMPOWER_MIDDLE[0]} ${-EMPOWER_MIDDLE[1]})`;
/** How far each companion leans out from the figure, in degrees (the left one to the left, the right one to the
    right), as the hero visual and the flat marks draw them. */
export const EMPOWER_TILT = 9;
/** The three together, leaning so, in emblem units: from the left companion's raised hand to the right one's, and
    from the figure's head to the companions' feet (measured). */
export const EMPOWER_TRIO_BOX = { x: -26.4, y: 5.4, w: 191.4, h: 117.7 } as const;
/** The two companions alone, leaning so, in emblem units: the span their fade runs over (measured). */
export const EMPOWER_COMPANIONS_BOX = { x: -26.4, y: 26.4, w: 191.4, h: 96.6 } as const;
/** The three fitted into the emblem box (146 × 120), for a flat mark the size of the other pillars'. */
export const EMPOWER_TRIO_MARK_FIT = (() => {
  const s = Math.min(146 / EMPOWER_TRIO_BOX.w, 120 / EMPOWER_TRIO_BOX.h);
  const cx = EMPOWER_TRIO_BOX.x + EMPOWER_TRIO_BOX.w / 2, cy = EMPOWER_TRIO_BOX.y + EMPOWER_TRIO_BOX.h / 2;
  return `translate(73 60) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})`;
})();
