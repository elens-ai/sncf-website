import { getCMSCopy } from '../cms/runtime';

const c = (key: string, fallback: string) => getCMSCopy(`copy.Nima.${key}`, fallback);

/* NIMA — the Nirankari Institute of Music & Arts, a programme of the Nirankari
   Vocational Centre — told in full in its tab of the Enrich report: its
   story, its art forms, its journey from Delhi across borders, and its
   impact. The words and figures are the foundation's own (its NIMA brief);
   every one is editable in the CMS (Nima). */

export const nimaStory = () => ({
  kicker: c('kicker', 'Service with humility'),
  name: c('name', 'NIMA'),
  fullName: c('full-name', 'Nirankari Institute of Music & Arts'),
  headline: c('headline', 'Every note. Every colour. A journey together.'),
  lede: c('lede', 'Nurturing talent. Preserving heritage. Inspiring harmony.'),
  storyKicker: c('story-kicker', 'Our story'),
  storyTitle: c('story-title', 'A small beginning. A shared purpose.'),
  storyBody: c('story-body', 'Founded on 25 May 2015 in Nirankari Colony, Delhi, NIMA brings artistic learning and human values together.'),
  storyBy: c('story-by', 'An initiative of Sant Nirankari Charitable Foundation.'),
  formsKicker: c('forms-kicker', 'Find your expression'),
  formsTitle: c('forms-title', 'Many art forms. One spirit.'),
  momentsKicker: c('moments-kicker', 'From our centres'),
  journeyKicker: c('journey-kicker', 'Our journey'),
  journeyTitle: c('journey-title', 'Rooted in Delhi. Reaching across borders.'),
  journeyFoot: c('journey-foot', 'Music connects hearts.'),
  impactKicker: c('impact-kicker', 'Our impact'),
  impactTitle: c('impact-title', 'Growing through art. Connecting through kindness.'),
  impactNote: c('impact-note', 'Structured learning, with participation in Pracheen Kala Kendra examinations.'),
  closing: c('closing', 'There is a place for your creativity.'),
  closingScript: c('closing-script', 'Let your journey find its rhythm.'),
});

/** The art forms taught, each with a photograph where the foundation has one. */
export const nimaForms = () => [
  { id: 'vocal', name: c('form-vocal', 'Vocal Music'), line: c('form-vocal-line', 'Find your voice'), photo: '/images/nima/nima-choir.webp', alt: c('form-vocal-alt', 'A NIMA choir on stage') },
  { id: 'instrumental', name: c('form-instrumental', 'Instrumental Music'), line: c('form-instrumental-line', 'Explore new horizons'), photo: '/images/nima/nima-tabla-class.webp', alt: c('form-instrumental-alt', 'Students learning tabla at a NIMA centre') },
  { id: 'dance', name: c('form-dance', 'Dance'), line: c('form-dance-line', 'Express in motion'), photo: '/images/nima/nima-dance.webp', alt: c('form-dance-alt', 'Classical dancers of NIMA in performance') },
  { id: 'painting', name: c('form-painting', 'Painting'), line: c('form-painting-line', 'Colours of a brighter you') },
  { id: 'fine-arts', name: c('form-fine-arts', 'Fine Arts'), line: c('form-fine-arts-line', 'See a deeper world') },
];

/** The way through every art form. */
export const nimaPath = () => [c('path-discover', 'Discover'), c('path-learn', 'Learn'), c('path-practise', 'Practise'), c('path-perform', 'Perform'), c('path-grow', 'Grow'), c('path-inspire', 'Inspire')];

export interface NimaPlace { name: string; at: [lon: number, lat: number] }
export interface NimaStep { year: string; place: string; title: string; lines: string[]; places: NimaPlace[]; label: string; from?: [number, number] }

const DELHI: [number, number] = [77.2, 28.7];

/** The journey, a year at a time: where NIMA opened, the places marked on the globe (each centre where it is), the
    one named on the globe, and, for a step across the ocean, where its arc sets out from. */
export const nimaJourney = (): NimaStep[] => [
  { year: '2015', place: c('j2015-place', 'Delhi'), title: c('j2015-title', 'The first note'), label: c('j2015-label', 'Delhi'),
    lines: [c('j2015-line1', 'Nirankari Colony · 25 May 2015'), c('j2015-line2', 'Blind Relief Association · later in 2015')],
    places: [{ name: 'Nirankari Colony', at: DELHI }, { name: 'Blind Relief Association', at: [77.24, 28.59] }] },
  { year: '2017', place: c('j2017-place', 'Inderlok, Delhi'), title: c('j2017-title', 'Deepening our roots'), label: c('j2017-label', 'Delhi'),
    lines: [c('j2017-line1', 'A new space for learning.'), c('j2017-line2', 'A growing community of creativity.')],
    places: [{ name: 'Inderlok', at: [77.17, 28.67] }] },
  { year: '2019', place: c('j2019-place', 'Thane, Maharashtra'), title: c('j2019-title', 'A new rhythm'), label: c('j2019-label', 'Thane'),
    lines: [c('j2019-line1', 'The journey reaches beyond Delhi.'), c('j2019-line2', 'Music and art bring more people together.')],
    places: [{ name: 'Thane', at: [72.98, 19.22] }] },
  { year: '2022', place: c('j2022-place', 'Gohar, Himachal Pradesh'), title: c('j2022-title', 'Into the hills'), label: c('j2022-label', 'Gohar'),
    lines: [c('j2022-line1', 'New opportunities for artistic learning.'), c('j2022-line2', 'The circle of expression grows.')],
    places: [{ name: 'Gohar', at: [77.03, 31.62] }] },
  { year: '2023', place: c('j2023-place', 'Six new spaces'), title: c('j2023-title', 'Across states'), label: c('j2023-label', 'North India'),
    lines: [c('j2023-line1', 'Amritsar · Subhash Nagar · Avtar Enclave'), c('j2023-line2', 'Shimla · Chandigarh · Rajpura')],
    places: [{ name: 'Amritsar', at: [74.87, 31.63] }, { name: 'Subhash Nagar', at: [77.11, 28.64] }, { name: 'Avtar Enclave', at: [77.08, 28.67] }, { name: 'Shimla', at: [77.17, 31.1] }, { name: 'Chandigarh', at: [76.78, 30.73] }, { name: 'Rajpura', at: [76.59, 30.48] }] },
  { year: '2024', place: c('j2024-place', 'A wider urban network'), title: c('j2024-title', 'Growing together'), label: c('j2024-label', 'Mumbai · Delhi · Uttar Pradesh'),
    lines: [c('j2024-line1', 'Chembur · Vile Parle · Vasant Kunj'), c('j2024-line2', 'Kanpur · Lucknow')],
    places: [{ name: 'Chembur', at: [72.9, 19.06] }, { name: 'Vile Parle', at: [72.85, 19.1] }, { name: 'Vasant Kunj', at: [77.16, 28.52] }, { name: 'Kanpur', at: [80.33, 26.45] }, { name: 'Lucknow', at: [80.95, 26.85] }] },
  { year: '2025', place: c('j2025-place', 'New York, USA'), title: c('j2025-title', 'Across oceans'), label: c('j2025-label', 'New York'), from: DELHI,
    lines: [c('j2025-line1', 'First international centre · 16 March 2025'), c('j2025-line2', 'Alongside six new centres in India.')],
    places: [{ name: 'New York', at: [-74.0, 40.71] }] },
  { year: '2026', place: c('j2026-place', 'India & the United States'), title: c('j2026-title', 'The journey continues'), label: c('j2026-label', 'Tracy'), from: DELHI,
    lines: [c('j2026-line1', 'Tracy · Rewari · Ramesh Nagar'), c('j2026-line2', 'Geeta Colony · a growing shared future.')],
    places: [{ name: 'Tracy', at: [-121.43, 37.74] }, { name: 'Rewari', at: [76.62, 28.2] }, { name: 'Ramesh Nagar', at: [77.13, 28.65] }, { name: 'Geeta Colony', at: [77.27, 28.66] }] },
];

/** The figures the foundation reports for NIMA, each with the period it covers. */
export const nimaImpact = () => [
  { value: c('impact-centres', '27'), label: c('impact-centres-label', 'Centres'), note: c('impact-centres-note', 'As of 2025') },
  { value: c('impact-enrolments', '780'), label: c('impact-enrolments-label', 'New enrolments'), note: c('impact-enrolments-note', 'Apr 2025 – Aug 2026') },
  { value: c('impact-exams', '412'), label: c('impact-exams-label', 'Examination participants'), note: c('impact-exams-note', 'Academic year 2025–2026') },
  { value: c('impact-students', '4,114'), label: c('impact-students-label', 'Students impacted'), note: c('impact-students-note', 'Till September 2026') },
];

export const NIMA_PHOTOS = () => ({
  hero: [
    { src: '/images/nima/nima-stage.webp', alt: c('photo-stage', 'Students on stage at a NIMA music and art evening') },
    { src: '/images/nima/nima-dance-solo.webp', alt: c('photo-dance-solo', 'A classical dance performance') },
    { src: '/images/nima/nima-instruments.webp', alt: c('photo-instruments', 'Tanpuras, guitars, tabla and harmoniums ready for class') },
    { src: '/images/nima/nima-tabla-class.webp', alt: c('photo-tabla', 'Students learning tabla') },
  ],
  story: [
    { src: '/images/nima/nima-group.webp', alt: c('photo-group', 'Students and teachers of a NIMA centre with their instruments') },
    { src: '/images/nima/nima-session.webp', alt: c('photo-session', 'A music session at a NIMA centre') },
    { src: '/images/nima/nima-classroom.webp', alt: c('photo-classroom', 'A NIMA classroom') },
  ],
  closing: { src: '/images/nima/nima-group.webp', alt: '' },
});
