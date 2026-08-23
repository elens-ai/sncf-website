import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  CalendarDays,
  Share2,
  Check,
  ArrowUpRight,
  MapPin,
  Clock,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { EVENTS, SNCFEvent } from '../data/events';
import { PILLARS } from '../data/pillars';

/**
 * Upcoming events, designed as a calendar rather than a poster wall.
 *
 * COLOUR DISCIPLINE is the whole redesign. The previous pass gave every card
 * its pillar's full gradient, and five loud cards sat on a stage that is
 * itself animating between pillar colours — two colour systems fighting. Now
 * the cards are colour-NEUTRAL: a paper-white date page and a dark glass
 * body, the two surfaces that read correctly on every hue the stage passes
 * through. Each pillar contributes exactly one thin accent line and one
 * tinted label, nothing more — the moving background is the colour, the cards
 * are the content.
 *
 * The calendar metaphor does the visual work instead:
 *  - each dated event carries a TEAR-OFF DATE PAGE (weekday, numeral, month,
 *    binding holes) like a desk calendar sheet — instantly legible as a date;
 *  - a TIMELINE RAIL spans the next 12 months with every event plotted where
 *    it falls; hovering a dot spotlights its card, so the rail is navigation,
 *    not decoration;
 *  - EXPORT: one click downloads the whole set as a single .ics file, and
 *    each card can be added individually. Built in the browser, nothing
 *    logged.
 *
 * The date engine is unchanged: annual observances store month + day only,
 * the year is computed, so the list can never advertise a date that has gone.
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const nextOccurrence = (month: number, day: number): Date => {
  const today = startOfToday();
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, month - 1, day);
};

const daysUntil = (date: Date) =>
  Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);

const pad = (n: number) => String(n).padStart(2, '0');

const countdownLabel = (days: number) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 60) return `In ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks <= 12 ? `In ${weeks} weeks` : `In ${Math.round(days / 30)} months`;
};

/* -------------------------------------------------------------------- ics */

const vevent = (event: SNCFEvent, date: Date, dtstamp: string) => {
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
const nowStamp = () => {
  const n = new Date();
  return (
    `${n.getUTCFullYear()}${pad(n.getUTCMonth() + 1)}${pad(n.getUTCDate())}` +
    `T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`
  );
};

const wrapCalendar = (events: string[]) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sant Nirankari Charitable Foundation//Events//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

const icsHref = (body: string) => `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;

/* ------------------------------------------------------------------ clock */

const clockParts = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86_400),
    h: Math.floor((s % 86_400) / 3_600),
    m: Math.floor((s % 3_600) / 60),
    s: s % 60,
  };
};

/** Ticks in isolation so one second of time repaints the clock, not the grid. */
const CountdownClock: React.FC<{ target: Date }> = ({ target }) => {
  const [left, setLeft] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setLeft(target.getTime() - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const { d, h, m, s } = clockParts(left);
  const cells: [string, string][] = [
    [String(d), 'days'],
    [pad(h), 'hrs'],
    [pad(m), 'min'],
    [pad(s), 'sec'],
  ];
  return (
    <div className="flex items-stretch gap-1.5" role="timer" aria-live="off">
      {cells.map(([value, label]) => (
        <div
          key={label}
          className="flex-1 rounded-xl bg-black/30 border border-white/15 text-center px-2 py-1.5"
        >
          <p className="font-artistic-heading font-bold text-white tabular-nums leading-none text-[17px]">
            {value}
          </p>
          <p className="uppercase tracking-[0.14em] text-white/60 leading-none mt-1 text-[8px]">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------- card */

interface Resolved {
  event: SNCFEvent;
  date: Date | null;
  days: number | null;
  accentA: string;
  accentB: string;
}

const EventCard: React.FC<{ item: Resolved; spotlight: string | null }> = ({
  item,
  spotlight,
}) => {
  const { event, date, days, accentB } = item;
  const [shared, setShared] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/#events-section`;
    const text = `${event.title} — Sant Nirankari Charitable Foundation`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      /* share sheet dismissed, or clipboard denied — nothing to report */
    }
  };

  const dimmed = spotlight !== null && spotlight !== event.id;
  const lit = spotlight === event.id;

  return (
    <article
      id={`event-card-${event.id}`}
      className={`relative flex gap-4 rounded-3xl bg-neutral-950/55 backdrop-blur-md border p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-neutral-950/70 ${
        lit
          ? 'border-white/60 shadow-2xl -translate-y-1'
          : 'border-white/[0.12] hover:border-white/30'
      } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* The pillar's entire colour budget on this card: one line. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full"
        style={{ backgroundColor: accentB }}
      />

      {/* Tear-off date page. Paper-white on purpose — paper is the surface
          that reads as itself on every colour the stage passes through. */}
      <div className="relative flex-none w-[86px] self-start rounded-2xl bg-white text-neutral-900 shadow-lg overflow-hidden">
        {/* Binding strip with punched holes, like a desk calendar sheet. */}
        <div className="h-[14px] bg-neutral-100 border-b border-neutral-200 flex items-center justify-center gap-4">
          <span className="w-[5px] h-[5px] rounded-full bg-neutral-300 shadow-inner" />
          <span className="w-[5px] h-[5px] rounded-full bg-neutral-300 shadow-inner" />
        </div>
        {event.kind === 'annual' && date ? (
          <div className="px-2 pt-1.5 pb-2 text-center">
            <p
              className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: accentB }}
            >
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="font-artistic-heading font-bold text-[34px] leading-none tabular-nums mt-0.5">
              {date.getDate()}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 mt-0.5">
              {MONTHS[date.getMonth()]} &rsquo;{String(date.getFullYear()).slice(2)}
            </p>
          </div>
        ) : (
          <div className="px-2 pt-1.5 pb-2 text-center">
            <p
              className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: accentB }}
            >
              Every day
            </p>
            <p className="font-artistic-heading font-bold text-[30px] leading-none mt-1">∞</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 mt-1">
              Year-round
            </p>
          </div>
        )}
      </div>

      <div className="min-w-0 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span
            className="text-[9px] font-extrabold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border"
            style={{
              color: accentB,
              borderColor: `${accentB}4d`,
              backgroundColor: `${accentB}14`,
            }}
          >
            {event.tag}
          </span>
          {event.kind === 'ongoing' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/70">
              <InfinityIcon className="w-3 h-3" />
              Ongoing
            </span>
          ) : (
            <span
              className={`text-[10px] font-bold tabular-nums ${
                days !== null && days <= 7
                  ? 'text-white countdown-pulse px-2 py-0.5 rounded-full bg-white/15'
                  : 'text-white/70'
              }`}
            >
              {countdownLabel(days as number)}
            </span>
          )}
        </div>

        <h3 className="font-artistic-heading font-bold text-white text-[17px] leading-tight mb-1">
          {event.title}
        </h3>

        <p className="font-artistic-serif text-white/75 text-[12.5px] leading-relaxed line-clamp-2">
          {event.blurb}
        </p>

        {(event.location || event.time) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {event.location && (
              <p className="flex items-center gap-1 text-[11px] text-white/65">
                <MapPin className="w-3 h-3 flex-none" />
                {event.location}
              </p>
            )}
            {event.time && (
              <p className="flex items-center gap-1 text-[11px] text-white/65">
                <Clock className="w-3 h-3 flex-none" />
                {event.time}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3">
          {event.kind === 'annual' && date && (
            <a
              href={icsHref(wrapCalendar(vevent(event, date, nowStamp())))}
              download={`${event.id}.ics`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-neutral-900 bg-white hover:scale-[1.05] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarPlus className="w-3 h-3" />
              Add
            </a>
          )}
          {event.href && (
            <a
              href={event.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Take part
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={share}
            aria-label={`Share ${event.title}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-white/80 bg-white/5 border border-white/15 hover:bg-white/15 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {shared ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            {shared ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ---------------------------------------------------------------- section */

export const EventsSection: React.FC = () => {
  const [spotlight, setSpotlight] = useState<string | null>(null);

  /* Only the calendar DAY matters for ordering; the seconds belong to the
     clock, which owns its own interval. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3_600_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo<Resolved[]>(() => {
    void tick;
    return EVENTS.map((event) => {
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
    }).sort((a, b) => {
      if (a.days === null && b.days === null) return 0;
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
  }, [tick]);

  const dated = items.filter((i) => i.days !== null);
  const next = dated[0];
  const currentMonth = new Date().getMonth();

  /* Every dated event in ONE file, sharing one DTSTAMP. */
  const exportAllHref = useMemo(() => {
    const stamp = nowStamp();
    return icsHref(wrapCalendar(dated.flatMap((i) => vevent(i.event, i.date as Date, stamp))));
    // dated is derived from items in the same memo pass
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <section
      id="events-section"
      aria-label="Upcoming events"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-10 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
              What&rsquo;s next
            </p>
            <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight drop-shadow">
              Show up, pitch in
            </h2>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {next?.date && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 mb-1 text-right">
                  Next · {next.event.title}
                </p>
                <div className="w-[220px]">
                  <CountdownClock target={next.date} />
                </div>
              </div>
            )}
            {/* The whole list as one .ics — into any calendar app in a tap. */}
            <a
              href={exportAllHref}
              download="sncf-events.ics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-bold text-neutral-900 bg-white shadow-lg hover:scale-[1.04] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarDays className="w-4 h-4" />
              Export calendar
            </a>
          </div>
        </header>

        {/* TIMELINE RAIL — the next 12 months as one line, every dated event
            plotted where it falls. Hovering a dot spotlights its card below:
            the rail is a navigation instrument, not a decoration. Hidden from
            assistive tech — the cards below carry the same facts in full. */}
        <div className="relative h-[58px] mb-6 select-none hidden sm:block" aria-hidden="true">
          <div className="absolute left-0 right-0 top-[22px] h-px bg-white/20" />
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute top-[18px] flex flex-col items-center"
              style={{ left: `${(i / 12) * 100}%` }}
            >
              <span className="w-px h-[9px] bg-white/25" />
              <span className="text-[9px] font-bold tracking-[0.12em] text-white/45 mt-1.5">
                {MONTHS[(currentMonth + i) % 12]}
              </span>
            </div>
          ))}
          <div className="absolute top-0 flex flex-col items-center" style={{ left: '0%' }}>
            <span className="text-[8px] font-extrabold tracking-[0.16em] text-white/80 mb-1">
              TODAY
            </span>
            <span className="w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>
          {dated.map((i) => (
            <button
              key={i.event.id}
              type="button"
              tabIndex={-1}
              title={`${i.event.title} · ${countdownLabel(i.days as number)}`}
              onMouseEnter={() => setSpotlight(i.event.id)}
              onMouseLeave={() => setSpotlight(null)}
              className="absolute top-[15px] -translate-x-1/2 w-[15px] h-[15px] rounded-full border-2 border-white/80 cursor-pointer transition-transform hover:scale-125"
              style={{
                left: `${Math.min(97, ((i.days as number) / 365) * 100)}%`,
                backgroundColor: i.accentB,
              }}
            />
          ))}
          {/* the ongoing programmes live past the end of the line */}
          <div className="absolute top-[16px] right-0 translate-x-1 text-white/50">
            <InfinityIcon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <EventCard key={item.event.id} item={item} spotlight={spotlight} />
          ))}
        </div>

        <p className="text-[11px] text-white/50 mt-4 max-w-3xl">
          Dates shown are the fixed national and international observances. Venues and
          timings vary by city — the SNCF office confirms what is running near you on{' '}
          <a
            href="tel:+911147660380"
            className="text-white/80 underline underline-offset-4 hover:text-white"
          >
            011-47660380
          </a>
          .
        </p>
      </div>
    </section>
  );
};
