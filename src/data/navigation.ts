import { bindCMSData, resolveSiteList, validNavigation } from '../cms/data';

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
  /** `programmes` builds the pillar-coded mega menu from the programmes;
      `none` shows no drop-down; `links` (or absent) shows `links`. */
  menu?: 'programmes' | 'links' | 'none';
  /** Filled in from the programmes when `menu` is `programmes`. */
  groups?: PillarGroup[];
}

/* THE CORE VALUES MENU IS GENERATED FROM THE PROGRAMMES THEMSELVES.
   A hand-written index of another file's contents drifts: one had already
   lost three real activities and any renamed id became a dead anchor. Rows
   come from `activitiesFor`, so the menu cannot promise a programme the page
   does not have, or miss one it does. Each programme's `menuLabel` (editable
   in the CMS) shortens its record title for the menu. */
const roomLinks = (pillarId: 'heal' | 'enrich' | 'empower'): NavLink[] => [
  { label: `All of ${pillarId[0].toUpperCase()}${pillarId.slice(1)}`, href: `/core-values#${pillarId}` },
  ...activitiesFor(pillarId).map((a) => ({ label: a.menuLabel ?? a.title, href: `/core-values#${a.id}` })),
];

export const programmeGroups = (): PillarGroup[] => [
  { pillarId: 'heal', title: 'Heal', blurb: 'Health & medical care', links: roomLinks('heal') },
  { pillarId: 'enrich', title: 'Enrich', blurb: 'Education & skills', links: roomLinks('enrich') },
  { pillarId: 'empower', title: 'Empower', blurb: 'Upliftment & environment', links: roomLinks('empower') },
];

/** Menu items marked `programmes` get the pillar-coded mega menu, built live. */
const withProgrammes = (items: NavItem[]): NavItem[] =>
  items.map(item => item.menu === 'programmes'
    ? { ...item, links: undefined, groups: programmeGroups() }
    // A drop-down needs real links, and an item set to "none" in the CMS has none.
    : { ...item, links: item.menu !== 'none' && item.links?.length ? item.links : undefined });

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Core Values', href: '/core-values', menu: 'programmes' },
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

export let NAV_ITEMS: NavItem[] = bindCMSData(DEFAULT_NAV_ITEMS, (publication, fallback) => withProgrammes(resolveSiteList(publication, fallback, 'navigation', validNavigation)), value => { NAV_ITEMS = value; });
