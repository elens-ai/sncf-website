/**
 * Main navigation.
 *
 * The order is the foundation's own reading order: you arrive (Home), you
 * learn what it stands on (Core Values), you see what it is building
 * (Projects), you find out who it is (Who We Are), and you are told where
 * the direction comes from (Our Guiding Force).
 *
 * These are OUR routes now, not the official site's. Where a destination is
 * genuinely somewhere else — the Health City's own site, the careers board —
 * the link still leaves, and those are the only ones that do. `external` is
 * what the nav uses to decide between a router link and an anchor; anything
 * starting with '/' stays in the app.
 *
 * Gallery is deliberately absent — the header already carries a Gallery
 * ribbon, and duplicating it would give two controls for one thing.
 */

const SITE = 'https://nirankarifoundation.org';

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

/* The mega menu now opens our own Core Values page at the right chapter. */
export const CORE_VALUE_GROUPS: PillarGroup[] = [
  {
    pillarId: 'heal',
    title: 'Heal',
    blurb: 'Health & medical care',
    links: [
      { label: 'All of Heal', href: '/core-values#heal' },
      { label: 'Blood Donation', href: '/core-values#heal' },
      { label: 'Eye Care', href: '/core-values#heal' },
      { label: 'Health Checkup Camps', href: '/core-values#heal' },
    ],
  },
  {
    pillarId: 'enrich',
    title: 'Enrich',
    blurb: 'Education & skills',
    links: [
      { label: 'All of Enrich', href: '/core-values#enrich' },
      { label: 'Schools & Scholarships', href: '/core-values#enrich' },
      { label: 'Skill Development', href: '/core-values#enrich' },
    ],
  },
  {
    pillarId: 'empower',
    title: 'Empower',
    blurb: 'Upliftment & environment',
    links: [
      { label: 'All of Empower', href: '/core-values#empower' },
      { label: 'Tree Plantation', href: '/core-values#empower' },
      { label: 'Disaster Relief', href: '/core-values#empower' },
      { label: 'Youth Empowerment', href: '/core-values#empower' },
    ],
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
      { label: 'Project Amrit', href: '/projects' },
      { label: 'Oneness Vann', href: '/projects' },
      { label: 'Watershed Programme', href: '/projects' },
      { label: 'Adopted Villages', href: '/projects' },
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
      { label: 'About the foundation', href: '/who-we-are' },
      { label: 'Mission & Vision', href: '/who-we-are' },
      { label: 'Our Partners', href: '/who-we-are' },
      { label: 'Contact', href: '/who-we-are' },
      { label: 'Honors & Recognitions', href: `${SITE}/honors-and-recognitions/`, external: true },
    ],
  },
  { label: 'Our Guiding Force', href: '/our-guiding-force' },
  {
    label: 'Careers',
    href: 'https://www.nirankarihealthcity.org/careers/',
    badge: 'New',
    external: true,
  },
];
