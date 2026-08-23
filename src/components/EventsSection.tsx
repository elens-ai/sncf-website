import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Share2, Check, ArrowUpRight, MapPin, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { EVENTS, SNCFEvent } from '../data/events';
import { PILLARS } from '../data/pillars';

/**
 * Upcoming events.
 *
 * The design leans on three things that do actual work rather than decorate:
 *
 *  1. A DATE ENGINE. Annual observances store only month and day; the year is
 *     computed, so 24 April rolls forward the instant it passes. The section
 *     cannot rot into advertising a date that has gone by, which is the usual
 *     fate of a hand-maintained events list.
 *
 *  2. A LIVE COUNTDOWN. "In 43 days", "Tomorrow", "Today" — recomputed on a
 *     timer, so the page is never stale even if it is left open overnight.
 *
 *  3. ONE-TAP FOLLOW-THROUGH. Add-to-calendar generates a real .ics in the
 *     browser (no backend, no tracking), and Share uses the native share sheet
 *     where it exists. Interest converts to a calendar entry in one tap, which
 *     is the whole point of an events page.
 *
 * Cards borrow the accents of the pillar each event belongs to, so the screen
 * is colourful without inventing a palette — it is the same one the wheel
 * cycles through.
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** The next time this month/day comes round — this year if still ahead, else next. */
const nextOccurrence = (month: number, day: number): Date => {
  const today = startOfToday();
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  return thisYear >= today
    ? thisYear
    : new Date(today.getFullYear() + 1, month - 1, day);
};

const daysUntil = (date: Date) =>
  Math.round((date.getTime() - startOfToday().getTime()) / 86_400_000);

const countdownLabel = (days: number) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  if (days <= 60) return `In ${days} days`;
  const weeks = Math.round(days / 7);
  return weeks <= 12 ? `In ${weeks} weeks` : `In ${Math.round(days / 30)} months`;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** A minimal all-day VEVENT. Built in the browser — no backend, nothing logged. */
const icsFor = (event: SNCFEvent, date: Date) => {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const escape = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

  /* DTSTAMP is when the FILE was made, not when the event is. Stamping it with
     the event date is a common slip that strict parsers can object to. */
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
      /* dismissed the share sheet, or clipboard denied — nothing to report */
    }
  };

  const soon = days !== null && days <= 7;

  return (
    <article
      className={`group relative flex flex-col rounded-3xl border border-white/15 bg-black/25 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-white/35 hover:-translate-y-1 ${
        featured ? 'lg:col-span-2 p-6 sm:p-7' : 'p-5'
      }`}
    >
      {/* Pillar-tinted glow, strongest at the corner nearest the date. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(120% 90% at 0% 0%, ${accentB}2e 0%, transparent 62%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full border"
            style={{
              color: accentB,
              borderColor: `${accentB}59`,
              backgroundColor: `${accentA}33`,
            }}
          >
            {event.tag}
          </span>

          {event.kind === 'ongoing' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/80 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
              <InfinityIcon className="w-3.5 h-3.5" />
              Ongoing
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border tabular-nums ${
                soon
                  ? 'text-neutral-900 bg-white border-white countdown-pulse'
                  : 'text-white/85 bg-white/10 border-white/20'
              }`}
            >
              {countdownLabel(days as number)}
            </span>
          )}
        </div>

        {/* The date, at poster scale. */}
        {event.kind === 'annual' && date ? (
          <div className="flex items-end gap-3 mb-3">
            <span
              className={`font-artistic-heading font-bold text-white leading-[0.85] tabular-nums drop-shadow ${
                featured ? 'text-[72px] sm:text-[92px]' : 'text-[54px]'
              }`}
            >
              {date.getDate()}
            </span>
            <div className="pb-1.5">
              <p
                className={`font-artistic-heading font-extrabold tracking-[0.1em] leading-none ${
                  featured ? 'text-[22px]' : 'text-[16px]'
                }`}
                style={{ color: accentB }}
              >
                {MONTHS[date.getMonth()]}
              </p>
              <p className="text-[12px] text-white/55 tabular-nums leading-none mt-1">
                {date.getFullYear()}
              </p>
            </div>
          </div>
        ) : (
          <p
            className={`font-dancing-script font-bold text-white leading-none mb-3 drop-shadow ${
              featured ? 'text-[56px]' : 'text-[40px]'
            }`}
          >
            Join anytime
          </p>
        )}

        <h3
          className={`font-artistic-heading font-bold text-white leading-tight mb-2 ${
            featured ? 'text-[24px] sm:text-[28px]' : 'text-[18px]'
          }`}
        >
          {event.title}
        </h3>

        <p
          className={`font-artistic-serif text-white/80 leading-relaxed ${
            featured ? 'text-[15px] max-w-xl' : 'text-[13px]'
          }`}
        >
          {event.blurb}
        </p>

        {(event.location || event.time) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {event.location && (
              <p className="flex items-center gap-1.5 text-[12px] text-white/70">
                <MapPin className="w-3.5 h-3.5 flex-none" />
                {event.location}
              </p>
            )}
            {event.time && (
              <p className="flex items-center gap-1.5 text-[12px] text-white/70">
                <Clock className="w-3.5 h-3.5 flex-none" />
                {event.time}
              </p>
            )}
          </div>
        )}

        {/* Actions pinned to the bottom so cards of different heights line up. */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-5">
          {event.kind === 'annual' && date && (
            <a
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsFor(event, date))}`}
              download={`${event.id}.ics`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-neutral-900 bg-white hover:scale-[1.04] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Take part
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={share}
            aria-label={`Share ${event.title}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold text-white/85 bg-white/5 border border-white/15 hover:bg-white/15 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {shared ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>
    </article>
  );
};

export const EventsSection: React.FC = () => {
  /* Re-resolved on a timer so a page left open overnight does not keep showing
     yesterday's countdown. Hourly is plenty for a day-granular count. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3_600_000);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo<Resolved[]>(() => {
    void tick;
    const accentOf = (id: string) => PILLARS.find((p) => p.id === id);

    return EVENTS.map((event) => {
      const pillar = accentOf(event.pillarId);
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
      // Dated events first, soonest to furthest; ongoing ones close the list.
      if (a.days === null && b.days === null) return 0;
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });
  }, [tick]);

  const next = items.find((i) => i.days !== null);

  return (
    <section
      id="events-section"
      aria-label="Upcoming events"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-16 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
              What&rsquo;s next
            </p>
            <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight drop-shadow">
              Show up, pitch in
            </h2>
          </div>

          {next && next.days !== null && (
            <p className="text-[13px] text-white/75">
              Next up{' '}
              <span className="font-bold text-white">{next.event.title}</span>
              {' · '}
              <span className="tabular-nums">{countdownLabel(next.days).toLowerCase()}</span>
            </p>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <EventCard key={item.event.id} item={item} featured={i === 0} />
          ))}
        </div>

        <p className="text-[12px] text-white/55 mt-6 max-w-3xl">
          Dates shown are the fixed national and international observances. Venues and
          timings vary by city — the SNCF office confirms what is running near you on{' '}
          <a href="tel:+911147660380" className="text-white/80 underline underline-offset-4 hover:text-white">
            011-47660380
          </a>
          .
        </p>
      </div>
    </section>
  );
};
