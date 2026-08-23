/**
 * Upcoming events.
 *
 * EMPTY ON PURPOSE. The foundation's site lists no events, and inventing
 * dates for a real organisation would mean publishing a time and place people
 * could actually turn up to. Add real entries here and the section fills in;
 * until then it shows an honest placeholder.
 *
 * Entries dated before today drop out on their own, so a passed event never
 * sits on the page claiming to be upcoming.
 */

export interface SNCFEvent {
  id: string;
  title: string;
  /** ISO date, e.g. '2026-09-14'. Add `time` separately if it is known. */
  date: string;
  /** Optional clock time as written, e.g. '9:30 AM – 4:00 PM'. */
  time?: string;
  location: string;
  blurb?: string;
  /** Optional link to a registration or details page. */
  href?: string;
}

export const UPCOMING_EVENTS: SNCFEvent[] = [
  // {
  //   id: 'blood-donation-delhi',
  //   title: 'Blood Donation Camp',
  //   date: '2026-09-14',
  //   time: '9:30 AM – 4:00 PM',
  //   location: 'Sant Nirankari Colony, Delhi',
  //   blurb: 'Walk-in donors welcome; please carry photo ID.',
  // },
];
