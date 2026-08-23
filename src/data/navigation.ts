/**
 * Main navigation, mirroring nirankarifoundation.org.
 *
 * Gallery is deliberately absent — the hero already carries a Gallery ribbon
 * in the header, and duplicating it would give two controls for one thing.
 *
 * Links point at the live foundation pages, which all exist today. When this
 * site grows its own routes, only the hrefs here need to change.
 */

const SITE = 'https://nirankarifoundation.org';

export interface NavLink {
  label: string;
  href: string;
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
  links?: NavLink[];
  /** Present only on Core Values — renders the pillar-coded mega menu. */
  groups?: PillarGroup[];
}

export const CORE_VALUE_GROUPS: PillarGroup[] = [
  {
    pillarId: 'heal',
    title: 'Heal',
    blurb: 'Health & medical care',
    links: [
      { label: 'Blood Donation Drive', href: `${SITE}/blood-donation-drive/` },
      { label: 'Eye Care Activities', href: `${SITE}/eye-care-activities/` },
      { label: 'Health Checkup Camps', href: `${SITE}/health-checkup-camps/` },
      { label: 'Health Awareness Drives', href: `${SITE}/health-awareness-drives/` },
    ],
  },
  {
    pillarId: 'enrich',
    title: 'Enrich',
    blurb: 'Education & skills',
    links: [
      { label: 'Education', href: `${SITE}/education/` },
      { label: 'Skill Development', href: `${SITE}/skill-development/` },
    ],
  },
  {
    pillarId: 'empower',
    title: 'Empower',
    blurb: 'Upliftment & environment',
    links: [
      { label: 'Empower Support', href: `${SITE}/empower-support/` },
      { label: 'Preserving Nature', href: `${SITE}/preserving-nature/` },
      { label: 'Adopted Villages', href: `${SITE}/adopted-villages/` },
      { label: 'Disaster Relief', href: `${SITE}/disaster-relief-and-rehabilitation/` },
      { label: 'Youth Empowerment', href: `${SITE}/youth-empowerment/` },
      {
        label: 'Philanthropic Support',
        href: `${SITE}/philanthropic-support-to-the-society/`,
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Projects',
    links: [
      { label: 'Sant Nirankari Health City', href: 'https://www.nirankarihealthcity.org/' },
      { label: 'Watershed Program', href: `${SITE}/watershed-program/` },
      { label: 'Project Amrit', href: `${SITE}/project-amrit/` },
      { label: 'Oneness Vann', href: `${SITE}/oneness-vann/` },
    ],
  },
  { label: 'Core Values', groups: CORE_VALUE_GROUPS },
  {
    label: 'Who We Are',
    links: [
      { label: 'About Us', href: `${SITE}/about-us/` },
      { label: 'Mission & Vision', href: `${SITE}/mission-vision/` },
      { label: 'Honors & Recognitions', href: `${SITE}/honors-and-recognitions/` },
      { label: 'Our Partners', href: `${SITE}/our-partners/` },
      { label: 'Contact', href: `${SITE}/contact/` },
    ],
  },
  { label: 'Our Guiding Force', href: `${SITE}/our-guiding-force/` },
  { label: 'Careers', href: 'https://www.nirankarihealthcity.org/careers/', badge: 'New' },
];
