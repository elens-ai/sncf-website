import { bindCMSData, resolvePartners } from '../cms/data';

/**
 * Supports and collaborations.
 *
 * The organisations and what each did with the foundation are the
 * foundation's own lists, supplied on 2026-10-05 with its "Our Partners"
 * panel. Nothing here is inferred, because these are named third parties
 * and a collaboration they did not agree to is not ours to claim. A website
 * is given only where the organisation's own could be found. They are in
 * the order the circle shows them: Heal, then Enrich, then Empower
 * (components/PartnerCircle.tsx places each).
 */

export interface Partner {
  id: string;
  name: string;
  /** What the collaboration delivered, as the foundation describes it. */
  contribution: string;
  /** Extra context where the source page gives it. */
  note?: string;
  /** The organisation's own website. */
  href?: string;
}

export const DEFAULT_PARTNERS: Partner[] = [
  {
    id: 'unep',
    name: 'UNEP',
    contribution: 'World Environment Day (United Nations Environment Programme).',
    href: 'https://www.unep.org/',
  },
  {
    id: 'aiims',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    contribution: 'Organising blood donation drives.',
    href: 'https://www.aiims.edu/',
  },
  {
    id: 'red-cross',
    name: 'Indian Red Cross Society',
    contribution: 'Blood donation drives pan India.',
    href: 'https://www.indianredcross.org/',
  },
  {
    id: 'life-west',
    name: 'The Life Chiropractic College West',
    contribution: 'Collaborated with Life West and rendered free chiropractic treatment.',
    href: 'https://www.lifewest.edu/',
  },
  {
    id: 'ebai',
    name: 'Eye Bank Association of India (EBAI)',
    contribution: 'Eye donation pledge.',
  },
  {
    id: 'niit',
    name: 'NIIT',
    contribution: 'Various computer courses for skill development of youth.',
    note: 'National Institute of Information Technology.',
    href: 'https://niitfoundation.org/',
  },
  {
    id: 'singer',
    name: 'Singer India Ltd.',
    contribution: 'Vocational training for empowerment of women.',
    href: 'https://singerindia.com/',
  },
  {
    id: 'blind-relief',
    name: 'The Blind Relief Association, Delhi (India)',
    contribution: 'Skill development programmes for the visually challenged.',
    href: 'https://blindrelief.org/',
  },
  {
    id: 'pracheen-kala-kendra',
    name: 'Pracheen Kala Kendra',
    contribution: 'Securing accreditation and affiliation for specialised music and performing arts programmes.',
    href: 'https://pracheenkalakendra.org/',
  },
  {
    id: 'railways',
    name: 'Ministry of Indian Railways',
    contribution: 'Cleanliness drives at 263+ railway stations pan India.',
    href: 'https://indianrailways.gov.in/',
  },
  {
    id: 'culture',
    name: 'Ministry of Culture, Government of India',
    contribution: 'Project Amrit: Swachh Jal Swachh Mann, a water conservation and cleanliness drive conducted pan India.',
    href: 'https://www.indiaculture.gov.in/',
  },
  {
    id: 'ksct',
    name: 'Kailash Satyarthi Children’s Foundation',
    contribution: 'We support the nationwide campaign Safe Childhood, Safe India against exploitation of children.',
    note: 'Founded by Kailash Satyarthi, Nobel Peace Prize laureate, 2014.',
    href: 'https://satyarthi.org.in/',
  },
  {
    id: 'ndtv',
    name: 'NDTV',
    contribution: 'Cleanliness campaign across India for a cleaner environment.',
    note: 'A leading news channel in India.',
    href: 'https://www.ndtv.com/',
  },
  {
    id: 'toi',
    name: 'Times of India',
    contribution: 'Tree plantation drives across India for a green environment.',
    href: 'https://timesofindia.indiatimes.com/',
  },
  {
    id: 'nmba',
    name: 'Nasha Mukt Bharat Abhiyaan',
    contribution: 'Collaborating with the Ministry of Social Justice & Empowerment and the Narcotics Control Bureau to drive drug-free India initiatives.',
    href: 'https://nmba.dosje.gov.in/',
  },
  {
    id: 'delhi-athletics',
    name: 'Delhi Athletics',
    contribution: 'Supporting and nurturing young athletes through grassroots development programmes.',
  },
  {
    id: 'divyang-para-sports',
    name: 'Divyang Para Sports Association of Delhi',
    contribution: 'Providing dedicated infrastructure and training to empower para-athletes.',
  },
];

export let PARTNERS: Partner[] = bindCMSData(DEFAULT_PARTNERS, resolvePartners, value => { PARTNERS = value; });
