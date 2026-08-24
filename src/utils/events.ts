import { SNCFEvent } from '../data/events';
import { PILLARS } from '../data/pillars';

/**
 * Date arithmetic and .ics generation for the events screen — shared by the
 * section (cards, timeline rail) and the calendar modal so the two views can
 * never disagree about when an event falls.
 */

export const MONTHS_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** The next time this month/day comes round — this year if still ahead, else next. */
export const nextOccurrence = (month: number, day: number): Date => {
  const today = startOfToday();
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, month - 1, day);
};

export const daysUntil = (date: Date): number =>
  Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);

/** 1-based day of year for a month/day in a non-leap reference year. */
export const dayOfYear = (month: number, day: number): number => {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cum[month - 1] + day;
};

export const pad = (n: number): string => String(n).padStart(2, '0');

export const countdownLabel = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 60) return `In ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks <= 12 ? `In ${weeks} weeks` : `In ${Math.round(days / 30)} months`;
};

/* -------------------------------------------------------------------- ics */

export const vevent = (event: SNCFEvent, date: Date, dtstamp: string): string[] => {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const escape = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return [
    'BEGIN:VEVENT',
    `UID:${event.id}-${stamp}@sncf.elens.in`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.blurb)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    'END:VEVENT',
  ];
};

/* DTSTAMP is when the FILE is made, not when the event is — stamping it with
   the event date is a common slip that strict parsers object to. */
export const nowStamp = (): string => {
  const n = new Date();
  return (
    `${n.getUTCFullYear()}${pad(n.getUTCMonth() + 1)}${pad(n.getUTCDate())}` +
    `T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`
  );
};

export const wrapCalendar = (events: string[]): string =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sant Nirankari Charitable Foundation//Events//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

export const icsHref = (body: string): string =>
  `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;

/* --------------------------------------------------------------- resolve */

export interface ResolvedEvent {
  event: SNCFEvent;
  /** Next occurrence for annual events; null for ongoing programmes. */
  date: Date | null;
  days: number | null;
  accentA: string;
  accentB: string;
}

/** Calendar order, January first; ongoing programmes close the line. */
export const resolveEvents = (events: SNCFEvent[]): ResolvedEvent[] =>
  events
    .map((event) => {
      const pillar = PILLARS.find((p) => p.id === event.pillarId);
      const date =
        event.kind === 'annual' && event.month && event.day
          ? nextOccurrence(event.month, event.day)
          : null;
      return {
        event,
        date,
        days: date ? daysUntil(date) : null,
        accentA: pillar?.accentA ?? '#1f8a5c',
        accentB: pillar?.accentB ?? '#6fd19a',
      };
    })
    .sort((a, b) => {
      if (a.days === null && b.days === null) return 0;
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return (
        dayOfYear(a.event.month as number, a.event.day as number) -
        dayOfYear(b.event.month as number, b.event.day as number)
      );
    });
