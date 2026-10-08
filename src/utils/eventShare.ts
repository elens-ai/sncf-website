import type { ResolvedEvent } from './events';
import { pad } from './events';

/**
 * SHARING A MOMENT — where a shared event goes and what it carries.
 *
 * Every share points at the moment's invitation (?invite=<id>, the page a
 * scanned pass opens), so whoever receives it lands on the invitation with
 * its date, its calendar file and its artwork. The networks are reached
 * through their own public share pages, no scripts or tracking of theirs on
 * this site; a calendar entry is offered for Google's and Outlook's own
 * add-event pages beside the .ics file. Observances are all-day, so their
 * entries are too: the next date, ending the day after (as calendars expect).
 */

export type ShareNetwork = 'whatsapp' | 'facebook' | 'x' | 'linkedin' | 'telegram' | 'email';

/** The words a shared moment travels with: what, when, and why. */
export const shareText = (item: ResolvedEvent, when: string): string => `${item.event.title} — ${when}. ${item.event.blurb}`;

export const shareHref = (network: ShareNetwork, url: string, title: string, text: string): string => {
  const link = encodeURIComponent(url);
  switch (network) {
    case 'whatsapp': return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${link}`;
    case 'x': return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${link}`;
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${link}`;
    case 'telegram': return `https://t.me/share/url?url=${link}&text=${encodeURIComponent(text)}`;
    case 'email': return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  }
};

const compact = (date: Date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dayAfter = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
const details = (item: ResolvedEvent, url: string) => `${item.event.blurb}\n\n${url}`;
const place = (item: ResolvedEvent) => (item.event.location ? { location: item.event.location } : {});

/** Google Calendar's add-event page for the moment's next date; null for a year-round programme. */
export const googleCalendarHref = (item: ResolvedEvent, url: string): string | null => item.date
  ? `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: item.event.title, dates: `${compact(item.date)}/${compact(dayAfter(item.date))}`, details: details(item, url), ...place(item) })}`
  : null;

/** Outlook's add-event page for the moment's next date; null for a year-round programme. */
export const outlookCalendarHref = (item: ResolvedEvent, url: string): string | null => item.date
  ? `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: item.event.title, startdt: iso(item.date), enddt: iso(dayAfter(item.date)), allday: 'true', body: details(item, url), ...place(item) })}`
  : null;
