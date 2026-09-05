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

/* EVERY ENTRY GOES SOMEWHERE OF ITS OWN.
   These were all pointed at the room anchor — four Heal entries, one
   destination between them — which is a menu promising more than the page
   delivers. Each activity now links to its own record, which opens on
   arrival (CoreValuesPage watches the hash). The ids are the activity ids in
   data/activities.ts, so a renamed activity breaks the link visibly at build
   time rather than silently landing in the wrong place. */
export const CORE_VALUE_GROUPS: PillarGroup[] = [
  {
    pillarId: 'heal',
    title: 'Heal',
    blurb: 'Health & medical care',
    links: [
      { label: 'All of Heal', href: '/core-values#heal' },
      { label: 'Blood Donation', href: '/core-values#blood-donation' },
      { label: 'Eye Care', href: '/core-values#eye-checkup' },
      { label: 'Health Checkup Camps', href: '/core-values#health-checkup' },
      { label: 'Blood Bank', href: '/core-values#blood-bank' },
    ],
  },
  {
    pillarId: 'enrich',
    title: 'Enrich',
    blurb: 'Education & skills',
    links: [
      { label: 'All of Enrich', href: '/core-values#enrich' },
      { label: 'Schools & Colleges', href: '/core-values#schools-colleges' },
      { label: 'Scholarships', href: '/core-values#scholarships' },
      { label: 'Free Schools', href: '/core-values#free-schools' },
      { label: 'Skill Development', href: '/core-values#skill-nima' },
    ],
  },
  {
    pillarId: 'empower',
    title: 'Empower',
    blurb: 'Upliftment & environment',
    links: [
      { label: 'All of Empower', href: '/core-values#empower' },
      { label: 'Tree Plantation', href: '/core-values#tree-plantation' },
      { label: 'Cleanliness Drives', href: '/core-values#cleanliness' },
      { label: 'COVID-19 Relief', href: '/core-values#covid-relief' },
      { label: 'Financial Support', href: '/core-values#financial-support' },
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
