/**
 * Upcoming events.
 *
 * Two kinds, deliberately:
 *
 *  'annual'  — observances on a FIXED calendar date. The date is the fact; the
 *              year is computed, so 24 April rolls to next year the moment it
 *              passes and the section can never go stale or advertise a date
 *              that has already gone by.
 *
 *  'ongoing' — initiatives that run continuously and have no single date.
 *              Oneness Vann and Project Amrit are programmes, not one-day
 *              events, so they are shown as "join anytime" rather than given
 *              an invented date.
 *
 * VENUES AND TIMES ARE DELIBERATELY ABSENT. The dates below are the fixed
 * international and Mission observances; where a specific camp is held, and at
 * what hour, is decided locally and is not something to guess at — a wrong
 * address is a person turning up to nothing. Add `location` and `time` per
 * event once SNCF confirms them and the cards will show them.
 */

export type EventKind = 'annual' | 'ongoing';

export interface SNCFEvent {
  id: string;
  title: string;
  kind: EventKind;
  /** 1–12. Required for 'annual'. */
  month?: number;
  /** Day of month. Required for 'annual'. */
  day?: number;
  /** Short label above the title. */
  tag: string;
  blurb: string;
  /** Ties the card to a hero pillar so it borrows that pillar's accents. */
  pillarId: 'heal' | 'enrich' | 'empower' | 'projects';
  /** Add once confirmed. */
  location?: string;
  time?: string;
  href?: string;
}

export const EVENTS: SNCFEvent[] = [
  {
    id: 'manav-ekta-diwas',
    title: 'Manav Ekta Diwas',
    kind: 'annual',
    month: 4,
    day: 24,
    tag: 'Human Unity Day',
    blurb:
      'The Mission’s day of human oneness, marked by voluntary blood donation camps held across the country.',
    pillarId: 'heal',
  },
  {
    id: 'world-environment-day',
    title: 'World Environment Day',
    kind: 'annual',
    month: 6,
    day: 5,
    tag: 'United Nations',
    blurb:
      'Plantation drives and clean-up work marking the UN’s day for the environment.',
    pillarId: 'empower',
  },
  {
    id: 'international-yoga-day',
    title: 'International Day of Yoga',
    kind: 'annual',
    month: 6,
    day: 21,
    tag: 'United Nations',
    blurb:
      'Community yoga sessions on the UN’s day of yoga — open to every age and every level.',
    pillarId: 'heal',
  },
  {
    id: 'oneness-vann',
    title: 'Oneness Vann',
    kind: 'ongoing',
    tag: 'Plantation',
    blurb:
      'Native saplings planted and tended until they grow into community forests. Volunteers welcome year-round.',
    pillarId: 'empower',
    href: 'https://nirankarifoundation.org/oneness-vann/',
  },
  {
    id: 'project-amrit',
    title: 'Project Amrit',
    kind: 'ongoing',
    tag: 'Water bodies',
    blurb:
      'Cleaning and reviving ponds, lakes and riverbanks — one water body, one weekend at a time.',
    pillarId: 'projects',
    href: 'https://nirankarifoundation.org/project-amrit/',
  },
];
