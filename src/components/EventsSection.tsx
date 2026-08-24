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
import { EVENTS } from '../data/events';
import {
  ResolvedEvent,
  resolveEvents,
  MONTHS_SHORT,
  countdownLabel,
  dayOfYear,
  startOfToday,
  pad,
  icsHref,
  wrapCalendar,
  vevent,
  nowStamp,
} from '../utils/events';
import { EventsCalendarModal } from './EventsCalendarModal';

/**
 * Upcoming events, designed as a calendar rather than a poster wall.
 *
 * COLOUR DISCIPLINE: the cards are colour-neutral — a paper-white tear-off
 * date page on a dark glass body, the two surfaces that read correctly on
 * every hue the animating stage passes through. Each pillar contributes one
 * thin accent line and one tinted label, nothing more.
 *
 * THE RAIL is the calendar year, JANUARY to DECEMBER, fixed — not rolling
 * from the current month. TODAY is plotted where it actually falls and every
 * event sits at its calendar position, so the rail reads the way a wall
 * calendar does. Hovering a dot spotlights its card; clicking one opens the
 * full calendar at that month.
 *
 * VIEW CALENDAR opens a real month grid with the events plotted in it —
 * browsing months, picking an event day, adding it to a personal calendar.
 * The .ics export lives inside that calendar, which is where the "get this
 * into my calendar" thought happens.
 *
 * The date engine is unchanged: annual observances store month + day only,
 * the year is computed, so the list can never advertise a date that has gone.
 */

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

const EventCard: React.FC<{ item: ResolvedEvent; spotlight: string | null }> = ({
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
              {MONTHS_SHORT[date.getMonth()]} &rsquo;{String(date.getFullYear()).slice(2)}
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState<string | null>(null);

  /* Only the calendar DAY matters for ordering; the seconds belong to the
     clock, which owns its own interval. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3_600_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo<ResolvedEvent[]>(() => {
    void tick;
    return resolveEvents(EVENTS);
  }, [tick]);

  const dated = items.filter((i) => i.days !== null);
  const next = dated[0];

  const today = startOfToday();
  const todayPct =
    (dayOfYear(today.getMonth() + 1, today.getDate()) / 365) * 100;

  const openCalendarAt = (eventId: string | null) => {
    setCalendarEventId(eventId);
    setCalendarOpen(true);
  };

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
            <button
              onClick={() => openCalendarAt(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-bold text-neutral-900 bg-white shadow-lg hover:scale-[1.04] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CalendarDays className="w-4 h-4" />
              View calendar
            </button>
          </div>
        </header>

        {/* TIMELINE RAIL — the calendar year, January to December, fixed.
            TODAY is plotted where it actually falls and each event sits at its
            calendar position, the way a wall calendar reads. Hovering a dot
            spotlights its card; clicking opens the calendar at that month.
            Hidden from assistive tech — the cards and the calendar dialog
            carry the same facts accessibly. */}
        <div className="relative h-[58px] mb-6 select-none hidden sm:block" aria-hidden="true">
          <div className="absolute left-0 right-0 top-[22px] h-px bg-white/20" />
          {MONTHS_SHORT.map((label, i) => (
            <div
              key={label}
              className="absolute top-[18px] flex flex-col items-center"
              style={{ left: `${(i / 12) * 100}%` }}
            >
              <span className="w-px h-[9px] bg-white/25" />
              <span className="text-[9px] font-bold tracking-[0.12em] text-white/45 mt-1.5">
                {label}
              </span>
            </div>
          ))}
          <div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${todayPct}%` }}
          >
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
              onClick={() => openCalendarAt(i.event.id)}
              className="absolute top-[15px] -translate-x-1/2 w-[15px] h-[15px] rounded-full border-2 border-white/80 cursor-pointer transition-transform hover:scale-125"
              style={{
                left: `${
                  (dayOfYear(i.event.month as number, i.event.day as number) / 365) * 100
                }%`,
                backgroundColor: i.accentB,
              }}
            />
          ))}
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

      <EventsCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        items={items}
        initialEventId={calendarEventId}
      />
    </section>
  );
};
