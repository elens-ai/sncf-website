/**
 * Supports and collaborations.
 *
 * Transcribed from nirankarifoundation.org/our-partners/ — every organisation
 * and every stated contribution comes from that page. Nothing here is inferred,
 * because these are named third parties and a collaboration they did not agree
 * to is not ours to claim.
 */

export interface Partner {
  id: string;
  name: string;
  /** What the collaboration delivered, as the foundation describes it. */
  contribution: string;
  /** Extra context where the source page gives it. */
  note?: string;
}

export const PARTNERS: Partner[] = [
  {
    id: 'un',
    name: 'United Nations Organization',
    contribution:
      'Consistently supporting UN Millennium Development Goals through awareness drives and initiatives.',
    note: 'SNCF holds special consultative status with the UN.',
  },
  {
    id: 'railways',
    name: 'Ministry of Indian Railways',
    contribution: 'Cleanliness drives at 263 railway stations pan India.',
  },
  {
    id: 'red-cross',
    name: 'Indian Red Cross Society',
    contribution: 'Blood donation drives.',
  },
  {
    id: 'life-west',
    name: 'The Life Chiropractic College West',
    contribution:
      'Collaboration with Life West rendering free chiropractic treatment.',
  },
  {
    id: 'urban-development',
    name: 'Ministry of Urban Development (India)',
    contribution: 'Clean India Campaign for a hygienic and healthy country.',
  },
  {
    id: 'ksct',
    name: 'Kailash Satyarthi Children’s Foundation',
    contribution:
      'Supporting the nationwide Safe Childhood, Safe India campaign against the exploitation of children.',
    note: 'Founded by Kailash Satyarthi, Nobel Peace Prize laureate, 2014.',
  },
  {
    id: 'ndtv',
    name: 'NDTV',
    contribution: 'Cleanliness campaign across India for a cleaner environment.',
  },
  {
    id: 'toi',
    name: 'Times of India',
    contribution: 'Tree plantation drives across India for a green planet.',
  },
  {
    id: 'niit',
    name: 'NIIT',
    contribution: 'Computer courses for the skill development of youth.',
    note: 'National Institute of Information Technology.',
  },
  {
    id: 'singer',
    name: 'Singer India Ltd.',
    contribution: 'Vocational training for the empowerment of women.',
  },
  {
    id: 'blind-relief',
    name: 'The Blind Relief Association, Delhi',
    contribution: 'Skill development programmes for the visually challenged.',
  },
  {
    id: 'ebai',
    name: 'Eye Bank Association of India',
    contribution: 'Eye donation pledge campaign.',
  },
];
