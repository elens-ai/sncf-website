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
