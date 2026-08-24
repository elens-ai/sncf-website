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
 * Upcoming events as a deck of EVENT PASSES.
 *
 * THE CARD is a vertical pass — the thing you'd wear on a lanyard at the
 * event itself: an accent band at the head, a punched lanyard slot, the
 * tear-off date page sitting where an ID photo would, a dashed perforation,
 * and a barcode stub carrying the event's own id. The barcode is decorative
 * and encodes nothing — it is the ticket language, not a scannable claim.
 * Colour discipline holds: dark glass and paper, with the pillar allowed one
 * gradient band and one tinted label.
 *
 * THE DECK is a LINE, not a loop: the year runs January to December (the
 * ongoing programmes close the line), everything before the active event
 * lies in the LEFT pile, everything after it in the RIGHT, and the ends are
 * honest — at the year's first event the left pile is empty, at the last
 * the right one is, and the arrows disable. A card never teleports around
 * the back. The deck opens on the next upcoming event, so the left pile is
 * this year's past observances and the right pile what is still to come.
 *
 * Drive it with the arrows, the per-event dots, a click on a pile, a
 * horizontal drag/swipe or wheel gesture, or by hovering a dot on the year
 * rail. Vertical scrolling is never hijacked — the wheel handler acts only
 * when deltaX clearly dominates, attached natively because React registers
 * wheel listeners as passive.
 *
 * DATE ENGINE, RAIL and CALENDAR are unchanged: computed years that cannot
 * go stale, the fixed JAN–DEC rail, and the month-grid modal with the .ics
 * exports.
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

/* -------------------------------------------------------------- event pass */

const EventPass: React.FC<{ item: ResolvedEvent; lit: boolean }> = ({ item, lit }) => {
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
      /* share sheet dismissed, or clipboard denied — nothing to report */
    }
  };

  return (
    <article
      id={`event-card-${event.id}`}
      className={`relative w-[min(90vw,340px)] mx-auto flex flex-col rounded-[22px] overflow-hidden bg-neutral-950/75 backdrop-blur-md border transition-colors duration-300 ${
        lit ? 'border-white/40 shadow-2xl' : 'border-white/[0.12]'
      }`}
    >
      {/* The lanyard band — the pillar's one gradient on this pass. */}
      <div
        aria-hidden="true"
        className="h-[7px] w-full flex-none"
        style={{ background: `linear-gradient(90deg, ${accentA}, ${accentB})` }}
      />

      {/* Punched slot, as on a worn badge. */}
      <div
        aria-hidden="true"
        className="mx-auto mt-2.5 h-[7px] w-12 rounded-full bg-black/70 border border-white/10 flex-none"
      />

      <p className="text-center text-[8px] font-extrabold uppercase tracking-[0.3em] text-white/40 mt-2">
        SNCF · Event pass
      </p>

      <div className="px-5 pt-3 pb-3 flex flex-col items-center text-center">
        {/* The date page sits where an ID photo would. */}
        <div className="relative w-[96px] rounded-2xl bg-white text-neutral-900 shadow-lg overflow-hidden">
          <div className="h-[13px] bg-neutral-100 border-b border-neutral-200 flex items-center justify-center gap-4">
            <span className="w-[4px] h-[4px] rounded-full bg-neutral-300 shadow-inner" />
            <span className="w-[4px] h-[4px] rounded-full bg-neutral-300 shadow-inner" />
          </div>
          {event.kind === 'annual' && date ? (
            <div className="px-2 pt-1.5 pb-2">
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
            <div className="px-2 pt-1.5 pb-2">
              <p
                className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: accentB }}
              >
                Every day
              </p>
              <p className="font-artistic-heading font-bold text-[30px] leading-none mt-0.5">∞</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 mt-0.5">
                Year-round
              </p>
            </div>
          )}
        </div>

        <span
          className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-full border"
          style={{
            color: accentB,
            borderColor: `${accentB}4d`,
            backgroundColor: `${accentB}14`,
          }}
        >
          {event.tag}
        </span>

        <h3 className="font-artistic-heading font-bold text-white text-[16px] leading-tight mt-2">
          {event.title}
        </h3>

        <p className="font-artistic-serif text-white/70 text-[11.5px] leading-relaxed mt-1 line-clamp-2">
          {event.blurb}
        </p>

        {event.kind === 'ongoing' ? (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-white/70">
            <InfinityIcon className="w-3 h-3" />
            Ongoing · join anytime
          </span>
        ) : (
          <span
            className={`mt-2 text-[10px] font-bold tabular-nums ${
              days !== null && days <= 7
                ? 'text-white countdown-pulse px-2 py-0.5 rounded-full bg-white/15'
                : 'text-white/70'
            }`}
          >
            {countdownLabel(days as number)}
          </span>
        )}

        {(event.location || event.time) && (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-1.5">
            {event.location && (
              <p className="flex items-center gap-1 text-[10px] text-white/60">
                <MapPin className="w-3 h-3 flex-none" />
                {event.location}
              </p>
            )}
            {event.time && (
              <p className="flex items-center gap-1 text-[10px] text-white/60">
                <Clock className="w-3 h-3 flex-none" />
                {event.time}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Perforation — the stub below is where the pass gets used. */}
      <div aria-hidden="true" className="mx-4 border-t border-dashed border-white/20" />

      <div className="px-5 pt-2.5 pb-3.5">
        {/* Barcode stub. Decorative: it encodes nothing, it is the ticket
            language — but it carries the event's real id as its legend. */}
        <div
          aria-hidden="true"
          className="h-6 w-full rounded-[3px] text-white/60"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px, currentColor 5px 6px, transparent 6px 8px, currentColor 8px 11px, transparent 11px 14px)',
          }}
        />
        <p
          aria-hidden="true"
          className="text-center text-[7px] font-bold uppercase tracking-[0.3em] text-white/35 mt-1"
        >
          {event.id.replace(/-/g, ' ')}
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-2.5">
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

  const atStart = active === 0;
  const atEnd = active === items.length - 1;

  /* Clamped, not wrapped: the line has ends and the deck respects them. */
  const step = useCallback(
    (dir: number) => {
      const now = performance.now();
      if (now - stepLock.current < 350) return;
      stepLock.current = now;
      onActivate(Math.min(items.length - 1, Math.max(0, active + dir)));
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

  /* Proportional to the stage with generous caps, so on a wide screen the
     piles spread OUT into the empty space flanking the pass instead of
     huddling at fixed offsets near the bottom corners. */
  const sideX = Math.min(stageW * 0.3, 430);
  const farX = Math.min(stageW * 0.37, 545);

  /* Only the centre pass stands. Everything else lies back from its bottom
     edge in one DENSE, OPAQUE pile per side: ±1 nearest, every deeper card
     fanned a few px further out and down with a slightly stronger turn, so
     ten events read as two thick stacks of passes rather than a row of
     ghosts. Solid on purpose — the cards themselves are dark glass, and
     wrapper transparency made the piles read as reflections instead of
     objects. Depth comes from z-order, the fan and a touch of blur on the
     deepest cards, not from fading them out. */
  const pose = (off: number) => {
    if (off === 0) return { x: 0, y: 0, rx: 0, ry: 0, s: 1, o: 1, z: 30, blur: 0 };
    const a = Math.abs(off);
    const sgn = Math.sign(off);
    if (a === 1)
      return { x: sgn * sideX, y: 26, rx: 56, ry: -sgn * 12, s: 0.8, o: 1, z: 20, blur: 0 };
    const d = Math.min(a - 2, 3);
    return {
      x: sgn * (farX + d * 18),
      y: 44 + d * 7,
      rx: 62,
      ry: -sgn * (16 + d * 3),
      s: 0.72 - d * 0.02,
      o: 0.95,
      z: 12 - d,
      blur: d >= 2 ? 1 : 0,
    };
  };

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="relative h-[440px] select-none"
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
          const off = i - active;
          const p = pose(off);
          return (
            <div
              key={item.event.id}
              className="absolute left-1/2 top-2 w-[min(90vw,340px)]"
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
              <EventPass item={item} lit={off === 0} />
              {/* A resting pass's only job is to stand up: this overlay catches
                  the click so its buttons cannot fire from the pile. */}
              {off !== 0 && (
                <button
                  type="button"
                  aria-label={`Bring ${item.event.title} to the front`}
                  onClick={() => onActivate(i)}
                  className="absolute inset-0 rounded-[22px] cursor-pointer bg-transparent"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Deck controls: arrows and one dot per card. */}
      <div className="relative z-30 flex items-center justify-center gap-3 mt-1">
        <button
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label="Previous event"
          className="w-9 h-9 grid place-items-center rounded-full bg-white/10 border border-white/20 text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30 disabled:cursor-default enabled:hover:bg-white/20 enabled:hover:text-white enabled:cursor-pointer"
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
          disabled={atEnd}
          aria-label="Next event"
          className="w-9 h-9 grid place-items-center rounded-full bg-white/10 border border-white/20 text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30 disabled:cursor-default enabled:hover:bg-white/20 enabled:hover:text-white enabled:cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- section */

export const EventsSection: React.FC = () => {
  /* null = "no choice made yet": the deck opens on the next upcoming event,
     which with January-first ordering is rarely index 0. */
  const [activeOverride, setActiveOverride] = useState<number | null>(null);
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
  /* Soonest by countdown — NOT dated[0], which is now January's event. */
  const next = dated.length
    ? dated.reduce((m, i) => ((i.days as number) < (m.days as number) ? i : m), dated[0])
    : undefined;
  const active =
    activeOverride ?? Math.max(0, items.findIndex((i) => i === next));
  const setActive = setActiveOverride;

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
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-8 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
              What&rsquo;s next
            </p>
            <h2 className="font-artistic-heading text-white text-[28px] sm:text-[34px] md:text-[40px] leading-tight drop-shadow">
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
            Hovering a dot stands that event's pass up at the front of the
            deck; clicking opens the calendar at its month. Hidden from
            assistive tech — the passes and the calendar dialog carry the
            same facts. */}
        <div className="relative h-[50px] mb-2 select-none hidden sm:block" aria-hidden="true">
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

        <p className="relative z-30 text-[11px] text-white/50 mt-2 max-w-3xl">
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
