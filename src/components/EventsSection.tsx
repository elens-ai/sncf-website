import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
  CalendarDays,
  Share2,
  Check,
  ArrowUpRight,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
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
 * Upcoming events as a 3D DECK.
 *
 * One card stands upright in the centre — the active event — while its
 * neighbours lie back toward the ground at either side, smaller and dimmer,
 * like cards resting on a table behind the one being read. Moving the deck
 * (arrows, a horizontal scroll or drag, a click on a resting card, or
 * hovering a dot on the year rail) glides the chosen card up from the side
 * into the centre while the centre card lays itself down on the other side.
 *
 * The lying-back look is transform-origin: bottom + rotateX — the card tips
 * backward from its bottom edge exactly the way a standing card falls flat,
 * so the motion between the two states reads as one physical action, not two
 * unrelated poses. All motion is transform/opacity only, GPU-composited, and
 * only the RETURN glide is transitioned — the same rules the hero wheel
 * follows.
 *
 * Vertical scrolling is never hijacked: only clearly-horizontal wheel gestures
 * turn the deck, so the page's own scroll and snap keep working over it.
 *
 * COLOUR DISCIPLINE, DATE ENGINE, RAIL and CALENDAR are unchanged from the
 * previous passes: colour-neutral paper-and-glass cards on the animating
 * stage, computed years that can never go stale, the fixed JAN–DEC rail, and
 * the month-grid calendar modal carrying the .ics exports.
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

/** Ticks in isolation so one second of time repaints the clock, not the deck. */
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

const EventCard: React.FC<{ item: ResolvedEvent; lit: boolean }> = ({ item, lit }) => {
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

  return (
    <article
      id={`event-card-${event.id}`}
      className={`relative flex gap-4 rounded-3xl bg-neutral-950/70 backdrop-blur-md border p-4 transition-colors duration-300 ${
        lit ? 'border-white/40 shadow-2xl' : 'border-white/[0.12]'
      }`}
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

/* ------------------------------------------------------------------- deck */

/** Signed shortest distance from the active card, wrapped: -2..2 for 5 cards. */
const wrapOffset = (i: number, active: number, n: number) => {
  const rel = (((i - active) % n) + n) % n;
  return rel > n / 2 ? rel - n : rel;
};

const EventDeck: React.FC<{
  items: ResolvedEvent[];
  active: number;
  onActivate: (index: number) => void;
}> = ({ items, active, onActivate }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageW, setStageW] = useState(1200);
  const stepLock = useRef(0);
  const dragX = useRef<number | null>(null);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageW(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = useCallback(
    (dir: number) => {
      const now = performance.now();
      if (now - stepLock.current < 350) return;
      stepLock.current = now;
      onActivate((((active + dir) % items.length) + items.length) % items.length);
    },
    [active, items.length, onActivate],
  );

  /* Horizontal wheel turns the deck; vertical wheel stays the page's.
     Attached natively because React registers wheel as passive, and a passive
     listener cannot preventDefault the horizontal gesture. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      step(e.deltaX > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [step]);

  const sideX = Math.min(stageW * 0.34, 380);
  const farX = Math.min(stageW * 0.55, 620);

  /* The five poses. Sides tip backward from their BOTTOM edge — the way a
     standing card lies down — which is what sells the ground. */
  const pose = (off: number) => {
    if (off === 0)
      return { x: 0, y: 0, rx: 0, ry: 0, s: 1, o: 1, z: 30, blur: 0 };
    const a = Math.abs(off);
    const sgn = Math.sign(off);
    if (a === 1)
      return { x: sgn * sideX, y: 58, rx: 32, ry: -sgn * 26, s: 0.78, o: 0.55, z: 20, blur: 0 };
    return { x: sgn * farX, y: 96, rx: 44, ry: -sgn * 36, s: 0.62, o: 0.18, z: 10, blur: 2 };
  };

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="relative h-[300px] sm:h-[290px] select-none"
        style={{ perspective: '1500px' }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Upcoming events deck"
        onPointerDown={(e) => {
          dragX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (dragX.current === null) return;
          const dx = e.clientX - dragX.current;
          dragX.current = null;
          if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragX.current = null;
        }}
      >
        {items.map((item, i) => {
          const off = wrapOffset(i, active, items.length);
          const p = pose(off);
          return (
            <div
              key={item.event.id}
              className="absolute left-1/2 top-2 w-[min(88vw,470px)]"
              style={{
                transform: `translateX(calc(-50% + ${p.x}px)) translateY(${p.y}px) rotateY(${p.ry}deg) rotateX(${p.rx}deg) scale(${p.s})`,
                transformOrigin: '50% 100%',
                transformStyle: 'preserve-3d',
                opacity: p.o,
                zIndex: p.z,
                filter: p.blur ? `blur(${p.blur}px)` : 'none',
                transition: reduced
                  ? 'none'
                  : 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, filter 500ms ease',
                pointerEvents: p.o < 0.2 ? 'none' : 'auto',
              }}
            >
              <EventCard item={item} lit={off === 0} />
              {/* A resting card's only job is to come forward: this overlay
                  catches the click so its buttons cannot fire from the side. */}
              {off !== 0 && (
                <button
                  type="button"
                  aria-label={`Bring ${item.event.title} to the front`}
                  onClick={() => onActivate(i)}
                  className="absolute inset-0 rounded-3xl cursor-pointer bg-transparent"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Deck controls: arrows and one dot per card. */}
      <div className="flex items-center justify-center gap-3 mt-1">
        <button
          onClick={() => step(-1)}
          aria-label="Previous event"
          className="w-9 h-9 grid place-items-center rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.event.id}
              onClick={() => onActivate(i)}
              aria-label={`Show ${item.event.title}`}
              aria-current={i === active ? 'true' : 'false'}
              className="p-1 cursor-pointer"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-2' : 'w-2 h-2 opacity-50 hover:opacity-90'
                }`}
                style={{ backgroundColor: item.accentB }}
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => step(1)}
          aria-label="Next event"
          className="w-9 h-9 grid place-items-center rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- section */

export const EventsSection: React.FC = () => {
  const [active, setActive] = useState(0);
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
  const todayPct = (dayOfYear(today.getMonth() + 1, today.getDate()) / 365) * 100;

  const openCalendarAt = (eventId: string | null) => {
    setCalendarEventId(eventId);
    setCalendarOpen(true);
  };

  const activateById = (id: string) => {
    const i = items.findIndex((x) => x.event.id === id);
    if (i !== -1) setActive(i);
  };

  return (
    <section
      id="events-section"
      aria-label="Upcoming events"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-10 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
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
            Hovering a dot glides that event's card to the front of the deck;
            clicking opens the calendar at its month. Hidden from assistive
            tech — the cards and the calendar dialog carry the same facts. */}
        <div className="relative h-[54px] mb-4 select-none hidden sm:block" aria-hidden="true">
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
              onMouseEnter={() => activateById(i.event.id)}
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

        <EventDeck items={items} active={active} onActivate={setActive} />

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

      <EventsCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        items={items}
        initialEventId={calendarEventId}
      />
    </section>
  );
};
