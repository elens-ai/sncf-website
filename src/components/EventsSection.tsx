import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
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
 * Upcoming events.
 *
 * The cards are solid pillar colour — the same accentA -> accentB ramp the
 * carousel cards use — so an event reads as belonging to Heal or Empower at a
 * glance and the screen is built from the palette the wheel already cycles
 * rather than a second one invented for it.
 *
 * Three things carry the interaction:
 *
 *  1. A DATE ENGINE. Annual observances store only month and day; the year is
 *     computed, so 24 April rolls forward the instant it passes and the list
 *     cannot rot into advertising a date that has gone.
 *
 *  2. A LIVE COUNTDOWN, ticking to the second, in the header. It owns its own
 *     interval and state so a tick repaints the clock alone, never the grid.
 *     It sits there rather than on every card because five clocks was five
 *     times the repaint for one fact, and it pushed the screen 292px past the
 *     fold; the cards carry a compact label instead.
 *
 *  3. POINTER-REACTIVE DEPTH. Cards tilt toward the cursor and carry a
 *     specular highlight that follows it. Both are written straight to the
 *     node inside one rAF, never through React state: a tilt routed through a
 *     re-render is a re-render per mousemove.
 *
 * Add-to-calendar builds a real .ics in the browser and Share uses the native
 * sheet, so interest converts in one tap.
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

/** A minimal all-day VEVENT. Built in the browser — no backend, nothing logged. */
const icsFor = (event: SNCFEvent, date: Date) => {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const escape = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

  /* DTSTAMP is when the FILE was made, not when the event is. Stamping it with
     the event date is a common slip that strict parsers object to. */
  const now = new Date();
  const dtstamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sant Nirankari Charitable Foundation//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-${stamp}@sncf.elens.in`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.blurb)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

/* ------------------------------------------------------------------ clock */

const parts = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86_400),
    h: Math.floor((s % 86_400) / 3_600),
    m: Math.floor((s % 3_600) / 60),
    s: s % 60,
  };
};

/**
 * Ticks in isolation. State lives here rather than in the section so one
 * second of time costs one card's repaint instead of the whole grid's.
 */
const CountdownClock: React.FC<{ target: Date; big?: boolean }> = ({ target, big }) => {
  const [left, setLeft] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setLeft(target.getTime() - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const { d, h, m, s } = parts(left);
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
          className={`flex-1 rounded-xl bg-black/30 border border-white/20 backdrop-blur-sm text-center ${
            big ? 'px-2.5 py-2' : 'px-1.5 py-1.5'
          }`}
        >
          <p
            className={`font-artistic-heading font-bold text-white tabular-nums leading-none ${
              big ? 'text-[26px]' : 'text-[17px]'
            }`}
          >
            {value}
          </p>
          <p
            className={`uppercase tracking-[0.14em] text-white/65 leading-none mt-1 ${
              big ? 'text-[10px]' : 'text-[8px]'
            }`}
          >
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

const EventCard: React.FC<{ item: Resolved; featured?: boolean }> = ({ item, featured }) => {
  const { event, date, days, accentA, accentB } = item;
  const [shared, setShared] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tilt + specular highlight, written straight to the node. Routing pointer
     position through state would re-render the card on every mousemove; this
     coalesces to one write per frame and React never hears about it. */
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const p = pending.current;
      const node = cardRef.current;
      if (!p || !node) return;
      node.style.transform =
        `perspective(1000px) rotateX(${((0.5 - p.y) * 7).toFixed(2)}deg) ` +
        `rotateY(${((p.x - 0.5) * 9).toFixed(2)}deg) translateY(-6px)`;
      node.style.setProperty('--mx', `${(p.x * 100).toFixed(1)}%`);
      node.style.setProperty('--my', `${(p.y * 100).toFixed(1)}%`);
    });
  };

  const onPointerLeave = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = '';
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '0%');
  };

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

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

  const soon = days !== null && days <= 7;

  return (
    <article
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`event-card group relative flex flex-col rounded-[26px] overflow-hidden border border-white/25 shadow-xl ${
        featured ? 'lg:col-span-2 p-4 sm:p-5' : 'p-4 sm:p-5'
      }`}
      style={{
        /* Solid pillar colour, the same 158deg ramp the carousel cards use. */
        background: `linear-gradient(158deg, ${accentA} 0%, ${accentB} 100%)`,
      }}
    >
      {/* Legibility scrim. White copy has to hold at the pale end of every
          pillar ramp, and Heal's light green is the worst case. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(165deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.42) 55%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Specular highlight that tracks the pointer. */}
      <div className="event-card-sheen absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-white backdrop-blur-sm">
            {event.tag}
          </span>

          {event.kind === 'ongoing' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-2.5 py-1 rounded-full bg-white/15 border border-white/30">
              <InfinityIcon className="w-3.5 h-3.5" />
              Ongoing
            </span>
          ) : (
            /* A compact label per card; the ticking clock lives once in the
               section header. Five clocks was five times the repaint for the
               same information, and it pushed the screen 292px past the fold. */
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full tabular-nums ${
                soon
                  ? 'text-neutral-900 bg-white border border-white countdown-pulse'
                  : 'text-white bg-white/15 border border-white/30'
              }`}
            >
              {countdownLabel(days as number)}
            </span>
          )}
        </div>

        {event.kind === 'annual' && date ? (
          <div className="flex items-end gap-3 mb-4">
            <span
              className={`font-artistic-heading font-bold text-white leading-[0.82] tabular-nums drop-shadow-lg ${
                featured ? 'text-[54px] sm:text-[62px]' : 'text-[48px]'
              }`}
            >
              {date.getDate()}
            </span>
            <div className="pb-1.5">
              <p
                className={`font-artistic-heading font-extrabold text-white tracking-[0.12em] leading-none ${
                  featured ? 'text-[19px]' : 'text-[15px]'
                }`}
              >
                {MONTHS[date.getMonth()]}
              </p>
              <p className="text-[12px] text-white/70 tabular-nums leading-none mt-1">
                {date.getFullYear()}
              </p>
            </div>
          </div>
        ) : (
          <p
            className={`font-dancing-script font-bold text-white leading-none mb-4 drop-shadow-lg ${
              featured ? 'text-[50px]' : 'text-[38px]'
            }`}
          >
            Join anytime
          </p>
        )}

        <h3
          className={`font-artistic-heading font-bold text-white leading-tight mb-2 drop-shadow ${
            featured ? 'text-[22px] sm:text-[25px]' : 'text-[18px]'
          }`}
        >
          {event.title}
        </h3>

        <p
          className={`font-artistic-serif text-white/90 leading-relaxed ${
            featured ? 'text-[15px] max-w-xl' : 'text-[13px]'
          }`}
        >
          {event.blurb}
        </p>

        {(event.location || event.time) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {event.location && (
              <p className="flex items-center gap-1.5 text-[12px] text-white/85">
                <MapPin className="w-3.5 h-3.5 flex-none" />
                {event.location}
              </p>
            )}
            {event.time && (
              <p className="flex items-center gap-1.5 text-[12px] text-white/85">
                <Clock className="w-3.5 h-3.5 flex-none" />
                {event.time}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto pt-5">
          {event.kind === 'annual' && date && (
            <a
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsFor(event, date))}`}
              download={`${event.id}.ics`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-neutral-900 bg-white hover:scale-[1.05] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to calendar
            </a>
          )}

          {event.href && (
            <a
              href={event.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-white bg-white/20 border border-white/35 hover:bg-white/30 transition-colors cursor-pointer"
            >
              Take part
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={share}
            aria-label={`Share ${event.title}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-white bg-white/10 border border-white/25 hover:bg-white/25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>
    </article>
  );
};

/* ---------------------------------------------------------------- section */

type Filter = 'all' | 'dated' | 'ongoing';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'dated', label: 'Save the date' },
  { id: 'ongoing', label: 'Join anytime' },
];

export const EventsSection: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');

  /* Only the calendar DAY matters for ordering, so this refreshes hourly.
     The second-by-second work belongs to the clocks, which own it themselves. */
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

  const shown = items.filter((i) =>
    filter === 'all' ? true : filter === 'dated' ? i.days !== null : i.days === null,
  );

  const next = items.find((i) => i.days !== null);

  return (
    <section
      id="events-section"
      aria-label="Upcoming events"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-10 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
              What&rsquo;s next
            </p>
            <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight drop-shadow">
              Show up, pitch in
            </h2>
          </div>

          {next?.date && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 mb-1">
                Next up · {next.event.title}
              </p>
              <div className="w-[240px] ml-auto">
                <CountdownClock target={next.date} />
              </div>
            </div>
          )}
        </header>

        {/* Filter rail. Active chip borrows the live stage accent, so the
            control belongs to whatever colour the hero is showing. */}
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter events">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-300 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  active
                    ? 'text-neutral-900 bg-white border-white shadow-lg'
                    : 'text-white/80 bg-white/10 border-white/20 hover:bg-white/20 hover:text-white'
                }`}
              >
                {f.label}
                <span className={`ml-2 tabular-nums ${active ? 'text-neutral-500' : 'text-white/50'}`}>
                  {f.id === 'all'
                    ? items.length
                    : f.id === 'dated'
                      ? items.filter((i) => i.days !== null).length
                      : items.filter((i) => i.days === null).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item, i) => (
            <EventCard
              key={item.event.id}
              item={item}
              featured={filter === 'all' && i === 0}
            />
          ))}
        </div>

        <p className="text-[11px] text-white/50 mt-3 max-w-3xl">
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
