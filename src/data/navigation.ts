/**
 * Main navigation.
 *
 * The order is the foundation's own reading order: you arrive (Home), you
 * learn what it stands on (Core Values), you see what it is building
 * (Projects), you find out who it is (Who We Are), and you are told where
 * the direction comes from (Our Guiding Force).
 *
 * These are OUR routes. Nothing here points at nirankarifoundation.org: this
 * site replaces it, that domain is being decommissioned, and a link to it
 * would send visitors — and search engines — to an address that is going
 * away. The only outbound links left are to the Mission's OTHER properties,
 * which are separate live sites: the Health City, the Mission itself.
 * `external` is what the nav uses to decide between a router link and an
 * anchor; anything starting with '/' stays in the app.
 *
 * Gallery is deliberately absent — the header already carries a Gallery
 * ribbon, and duplicating it would give two controls for one thing.
 */

import { activitiesFor } from './activities';

export interface NavLink {
  label: string;
  href: string;
  /** Leaves the site. Rendered as a plain anchor, opened in a new tab. */
  external?: boolean;
}

/** A Core Values column, tied to one of the hero's pillars. */
export interface PillarGroup {
  /** Matches a pillar id, so the column borrows that pillar's accent. */
  pillarId: 'heal' | 'enrich' | 'empower';
  title: string;
  blurb: string;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  href?: string;
  badge?: string;
  external?: boolean;
  links?: NavLink[];
  /** Present only on Core Values — renders the pillar-coded mega menu. */
  groups?: PillarGroup[];
}

/* THE MENU IS GENERATED FROM THE PAGE'S OWN DATA.
   These entries were written by hand, and a hand-written index of another
   file's contents drifts: this one had already lost three real activities
   (the Health Centre, mass marriages, the sewing and beautician trades) and
   any renamed id would have become a dead anchor nobody noticed. Deriving
   the rows from `activitiesFor` means the menu cannot promise an activity
   the page does not have, or miss one it does.

   Only the LABELS are curated — an activity's own title is written for a
   record on the page ("Sant Nirankari Health Centre", "Sewing & Beautician")
   and a menu wants it shorter. Anything without an entry here falls back to
   its real title, so adding an activity surfaces it immediately rather than
   silently omitting it. */
const MENU_LABEL: Record<string, string> = {
  'blood-donation': 'Blood Donation',
  'health-checkup': 'Health Checkup Camps',
  'eye-checkup': 'Eye Care',
  'health-centre': 'Health Centre',
  'blood-bank': 'Blood Bank',
  'schools-colleges': 'Schools & Colleges',
  scholarships: 'Scholarships',
  'free-schools': 'Free Schools',
  'skill-nima': 'NIMA Skill Centres',
  'skill-trades': 'Sewing & Beautician',
  'tree-plantation': 'Tree Plantation',
  cleanliness: 'Cleanliness Drives',
  'covid-relief': 'COVID-19 Relief',
  'mass-marriages': 'Mass Marriages',
  'financial-support': 'Financial Support',
};

const roomLinks = (pillarId: 'heal' | 'enrich' | 'empower'): NavLink[] => [
  { label: `All of ${pillarId[0].toUpperCase()}${pillarId.slice(1)}`, href: `/core-values#${pillarId}` },
  ...activitiesFor(pillarId).map((a) => ({
    label: MENU_LABEL[a.id] ?? a.title,
    href: `/core-values#${a.id}`,
  })),
];

export const CORE_VALUE_GROUPS: PillarGroup[] = [
  { pillarId: 'heal', title: 'Heal', blurb: 'Health & medical care', links: roomLinks('heal') },
  { pillarId: 'enrich', title: 'Enrich', blurb: 'Education & skills', links: roomLinks('enrich') },
  {
    pillarId: 'empower',
    title: 'Empower',
    blurb: 'Upliftment & environment',
    links: roomLinks('empower'),
  },
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Core Values', href: '/core-values', groups: CORE_VALUE_GROUPS },
  {
    label: 'Projects',
    href: '/projects',
    links: [
      { label: 'All projects', href: '/projects' },
      { label: 'Project Amrit', href: '/projects#project-amrit' },
      { label: 'Oneness Vann', href: '/projects#project-oneness-vann' },
      { label: 'Watershed Programme', href: '/projects#watershed-programme' },
      { label: 'Adopted Villages', href: '/projects#adopted-villages' },
      {
        label: 'Sant Nirankari Health City',
        href: 'https://www.nirankarihealthcity.org/',
        external: true,
      },
    ],
  },
  {
    label: 'Who We Are',
    href: '/who-we-are',
    links: [
      { label: 'About the foundation', href: '/who-we-are#account' },
      { label: 'Mission & Vision', href: '/who-we-are#mission' },
      { label: 'The road so far', href: '/who-we-are#road' },
      { label: 'Our Partners', href: '/who-we-are#partners' },
      { label: 'Contact', href: '/who-we-are#contact' },
      { label: 'Honors & Recognitions', href: '/#awards' },
    ],
  },
  { label: 'Our Guiding Force', href: '/our-guiding-force' },
];
