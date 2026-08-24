import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { toDataURL } from 'qrcode';
import { EVENTS } from '../data/events';
import { PILLARS } from '../data/pillars';
import { PillarGlyph } from './CardIllustration';
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
  inviteUrl,
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
 * Drive it with the year rail at the deck's floor (hovering a dot stands
 * that event's pass up; clicking opens the calendar), a click on a pile, or
 * a horizontal drag/swipe or wheel gesture. Vertical scrolling is never hijacked — the wheel handler acts only
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

/* One QR per event per session — generation is async canvas work, and the
   deck re-renders on every step. */
const qrCache = new Map<string, string>();

const EventPass: React.FC<{ item: ResolvedEvent; lit: boolean }> = ({ item, lit }) => {
  const { event, date, days, accentA, accentB } = item;
  const [shared, setShared] = useState(false);
  const pillarLabel = PILLARS.find((p) => p.id === event.pillarId)?.label ?? event.pillarId;

  const [qr, setQr] = useState<string | null>(qrCache.get(event.id) ?? null);
  useEffect(() => {
    if (qr) return;
    let dead = false;
    toDataURL(inviteUrl(event.id), {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 4,
      color: { dark: '#171717', light: '#ffffff' },
    })
      .then((url) => {
        if (!dead) {
          qrCache.set(event.id, url);
          setQr(url);
        }
      })
      .catch(() => {
        /* QR stays a placeholder; the pass is still a pass */
      });
    return () => {
      dead = true;
    };
  }, [event.id, qr]);

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
      className={`relative w-[min(90vw,320px)] mx-auto flex flex-col rounded-[22px] overflow-hidden backdrop-blur-md border transition-colors duration-300 ${
        lit ? 'border-white/40' : 'border-white/[0.14]'
      }`}
      style={{
        /* The volunteers' t-shirt blue as a graded ink — VOLUNTEER_BLUE
           (#2456c0, sampled from the uniforms) lightened at the head and
           deepened toward the stub, so the pass wears the same blue the
           people at the drive do. The standing pass also carries a faint
           halo of its own pillar colour in the shadow. */
        backgroundImage:
          'linear-gradient(172deg, rgba(42, 84, 179, 0.92) 0%, rgba(28, 62, 138, 0.93) 45%, rgba(16, 38, 92, 0.95) 100%)',
        boxShadow: lit
          ? `0 26px 55px -18px rgba(0, 0, 0, 0.65), 0 0 42px ${accentB}26`
          : '0 12px 30px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Quiet furniture the whole site speaks: the lotus watermark and a
          breath of the pillar colour bleeding down from the header. */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(90% 36% at 50% 0%, ${accentB}21 0%, transparent 70%)`,
          }}
        />
        <img
          src="/images/lotus-watermark.png"
          alt=""
          className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 w-[82%] opacity-[0.05] select-none"
        />
      </div>

      <div className="relative z-[1] flex flex-col flex-1 min-h-0">
      {/* The vertical OWNS the pass now: its gradient is the whole header,
          stamped with its mark and name, so which pillar an activity belongs
          to is the first thing the card says — matching the activity report,
          where every activity lives under its pillar. */}
      <div
        className="relative px-4 pt-1.5 pb-2 flex-none border-b border-white/20"
        style={{ background: `linear-gradient(120deg, ${accentA}, ${accentB})` }}
      >
        {/* Gloss across the band — lacquer, not flat print. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(130% 100% at 16% 0%, rgba(255,255,255,0.3) 0%, transparent 52%)',
          }}
        />
        <div
          aria-hidden="true"
          className="relative mx-auto mb-1 h-[6px] w-12 rounded-full bg-black/45 border border-white/25 shadow-inner"
        />
        <div className="relative flex items-center justify-center gap-2">
          <span className="grid place-items-center w-6 h-6 rounded-full bg-white/95 shadow-md ring-1 ring-black/10">
            <PillarGlyph pillarId={event.pillarId} className="w-3.5 h-3.5" />
          </span>
          <span className="font-artistic-display text-[11px] font-extrabold uppercase tracking-[0.22em] text-white drop-shadow">
            {pillarLabel}
          </span>
        </div>
      </div>

      <div className="px-4 pt-2.5 pb-2 text-left">
        {/* ID-card anatomy: the date page in the TOP CORNER where a badge
            carries its photo, the event's identity beside it, everything
            ranged left. The centred column spent a full row on the page;
            this layout shares it. */}
        <div className="flex items-start gap-3">
          <div
            className="relative w-[84px] flex-none rounded-2xl text-neutral-900 shadow-lg ring-1 ring-black/10 overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f4f5f8 100%)' }}
          >
            <div className="h-[11px] bg-neutral-100 border-b border-neutral-200 flex items-center justify-center gap-4">
              <span className="w-[4px] h-[4px] rounded-full bg-neutral-300 shadow-inner" />
              <span className="w-[4px] h-[4px] rounded-full bg-neutral-300 shadow-inner" />
            </div>
            {event.kind === 'annual' && date ? (
              <div className="px-2 pt-1 pb-1.5 text-center">
                <p
                  className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: accentB }}
                >
                  {date.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="font-artistic-heading font-bold text-[26px] leading-none tabular-nums mt-0.5">
                  {date.getDate()}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 mt-0.5">
                  {MONTHS_SHORT[date.getMonth()]} &rsquo;{String(date.getFullYear()).slice(2)}
                </p>
              </div>
            ) : (
              <div className="px-2 pt-1 pb-1.5 text-center">
                <p
                  className="text-[8px] font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: accentB }}
                >
                  Every day
                </p>
                <p className="font-artistic-heading font-bold text-[26px] leading-none mt-0.5">∞</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-500 mt-0.5">
                  Year-round
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 pt-0.5">
            <span
              className="inline-block text-[9px] font-extrabold uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-full border"
              style={{
                color: accentB,
                borderColor: `${accentB}4d`,
                backgroundColor: `${accentB}14`,
              }}
            >
              {event.tag}
            </span>

            <h3 className="font-artistic-heading font-bold text-white text-[16px] leading-tight mt-1.5">
              {event.title}
            </h3>

            {event.kind === 'ongoing' ? (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-white/70">
                <InfinityIcon className="w-3 h-3" />
                Ongoing · join anytime
              </span>
            ) : (
              <span
                className={`mt-1.5 inline-block text-[10px] font-bold tabular-nums ${
                  days !== null && days <= 7
                    ? 'text-white countdown-pulse px-2 py-0.5 rounded-full bg-white/15'
                    : 'text-white/70'
                }`}
              >
                {countdownLabel(days as number)}
              </span>
            )}
          </div>
        </div>

        <p className="font-artistic-serif text-white/70 text-[11.5px] leading-relaxed mt-2 line-clamp-2">
          {event.blurb}
        </p>

        {(event.location || event.time) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
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

      <div className="relative px-5 pt-2 pb-2">
        {/* The stub as a boarding-pass action bar: the QR chip anchors the
            left edge and the two actions stack beside it, stretched to the
            chip's exact height — one rectangle of controls instead of a chip
            and two pills floating at different heights. Every event has
            exactly two actions (Add + Share, or Take part + Share), so the
            stack is always balanced. */}
        <div className="flex items-stretch gap-2.5">
          <div className="flex-none self-center text-center">
            <div className="rounded-xl bg-white p-1.5 ring-1 ring-white/30 shadow-lg">
              {qr ? (
                <img
                  src={qr}
                  alt={`QR code — scan to open the ${event.title} invitation`}
                  className="w-[50px] h-[50px] rounded-md"
                />
              ) : (
                <div className="w-[50px] h-[50px] rounded-md bg-neutral-200" aria-hidden="true" />
              )}
            </div>
            <p
              className="text-[7px] font-extrabold uppercase tracking-[0.2em] mt-1"
              style={{ color: accentB }}
            >
              Scan me
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {event.kind === 'annual' && date ? (
              <a
                href={icsHref(wrapCalendar(vevent(event, date, nowStamp())))}
                download={`${event.id}.ics`}
                aria-label="Add to calendar"
                title="Add to calendar"
                className="flex-1 inline-flex items-center justify-center rounded-xl text-neutral-900 bg-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <CalendarPlus className="w-[18px] h-[18px]" />
              </a>
            ) : (
              <a
                href={event.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Take part in ${event.title}`}
                title="Take part"
                className="flex-1 inline-flex items-center justify-center rounded-xl text-neutral-900 bg-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowUpRight className="w-[18px] h-[18px]" />
              </a>
            )}
            <button
              onClick={share}
              aria-label={`Share ${event.title}`}
              title={shared ? 'Copied' : 'Share'}
              className="flex-1 inline-flex items-center justify-center rounded-xl text-white/85 bg-white/10 border border-white/20 hover:bg-white/20 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {shared ? <Check className="w-[18px] h-[18px]" /> : <Share2 className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* The planning table closes the pass — the SAME full scene the
          invitation ends on, uncropped, so the two are one object at two
          sizes. Everything above was compressed to buy it this room. */}
      <img
        src="/images/volunteers-planning.webp"
        alt=""
        aria-hidden="true"
        className="w-full h-auto block select-none flex-none mt-auto"
        draggable={false}
      />
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
  const sideX = Math.min(stageW * 0.22, 300);
  const farX = Math.min(stageW * 0.27, 360);

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
    /* Blur values are set BELOW what looks right flat, because the piles
       are tipped toward the viewer and perspective magnifies the blur with
       the card — 1px near/2px deep smeared the card bottoms and made the
       nearest title illegible. Fractional blurs render fine. */
    if (a === 1)
      return { x: sgn * sideX, y: 26, rx: 56, ry: -sgn * 12, s: 0.8, o: 1, z: 20, blur: 0.5 };
    /* The FAN caps at three steps so the pile stays compact, but the
       Z-ORDER must not cap with it: cards past the cap all carried z 9, and
       with equal z the paint order falls back to DOM order — correct by
       luck on the left pile (deeper = earlier in DOM) and inverted on the
       right, where the deepest card painted ON TOP and stuck out of the
       stack. Depth is uncapped for z, so farther is always underneath. */
    const depth = a - 2;
    const d = Math.min(depth, 3);
    return {
      x: sgn * (farX + d * 12),
      y: 44 + d * 7,
      rx: 62,
      ry: -sgn * (14 + d * 2),
      s: 0.72 - d * 0.02,
      o: 0.95,
      z: Math.max(1, 12 - depth),
      blur: 1.2,
    };
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div
        ref={stageRef}
        className="relative h-[535px] my-auto select-none"
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
          const standing = off === 0;

          /* THE ARC, and why there are three layers. A single transition
             morphs every property in lockstep, which is why the old motion
             read as a shape-tween rather than a card being picked up. Split
             instead:

               outer  — the SLIDE along the ground (X), plus z/opacity/blur,
                        on a plain ease;
               lift   — the RISE (Y + scale) and the ground shadow, delayed
                        90ms behind the slide on an overshoot curve;
               rotator— the STAND-UP (rotateX/rotateY) about the bottom edge,
                        sharing the lift's timing.

             The chosen card therefore starts travelling while still flat,
             rises as it goes, and snaps the last few degrees upright with a
             small settle as it lands — and a card headed for a pile slides
             off upright for those same 90ms, then drops flat onto the stack.
             The shadow lives on the lift layer, OUTSIDE the rotator, so it
             hugs the ground instead of tilting with the card: wide and soft
             under a lying card, a narrow strip under a standing one. */
          /* Filter is deliberately NOT in the transition list: animating
             blur re-rasterises every pile card on every frame for the whole
             tween — the hero wheel's old jank, relearned — so the blur snaps
             while the transforms glide. Longer, ease-out curves and a softer
             overshoot read calmer than the old timing. */
          const slideT = reduced
            ? 'none'
            : 'transform 760ms cubic-bezier(0.33, 1, 0.68, 1), opacity 560ms ease';
          /* The overshoot belongs ONLY to the card standing up — a settle past
             upright reads as a landing. On a card LYING DOWN the same curve
             overshot the tilt and bobbed it back up off the pile; descending
             cards get a pure deceleration, so they lie down and stay down. */
          const liftT = reduced
            ? 'none'
            : `transform 650ms ${
                standing
                  ? 'cubic-bezier(0.34, 1.28, 0.64, 1)'
                  : 'cubic-bezier(0.25, 0.8, 0.3, 1)'
              } 80ms, opacity 650ms ease 80ms`;

          return (
            <div
              key={item.event.id}
              className="absolute left-1/2 top-2 w-[min(90vw,320px)]"
              style={{
                transform: `translateX(calc(-50% + ${p.x}px))`,
                opacity: p.o,
                zIndex: p.z,
                filter: p.blur ? `blur(${p.blur}px)` : 'none',
                transition: slideT,
                pointerEvents: p.o < 0.2 ? 'none' : 'auto',
              }}
            >
              <div
                style={{
                  transform: `translateY(${p.y}px) scale(${p.s})`,
                  transformOrigin: '50% 100%',
                  transformStyle: 'preserve-3d',
                  transition: liftT,
                }}
              >
                {/* Ground shadow — the realism anchor. */}
                <div
                  aria-hidden="true"
                  className="absolute left-[6%] right-[6%] -bottom-3 h-6 rounded-[50%] pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0) 72%)',
                    transform: standing ? 'scale(0.85, 0.55)' : 'scale(1.08, 1)',
                    opacity: standing ? 0.4 : 0.6,
                    transition: liftT,
                  }}
                />
                <div
                  style={{
                    transform: `rotateY(${p.ry}deg) rotateX(${p.rx}deg)`,
                    transformOrigin: '50% 100%',
                    transformStyle: 'preserve-3d',
                    transition: liftT,
                  }}
                >
                  <EventPass item={item} lit={standing} />
                </div>
              </div>
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
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col px-4 sm:px-8 md:px-12 lg:px-16 pt-[78px] pb-2 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
        <header className="mb-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
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

        <EventDeck items={items} active={active} onActivate={setActive} />

        {/* TIMELINE RAIL — now the deck's ONLY chrome, moved to the floor
            where the arrows and dots used to sit. The calendar year, fixed
            January to December.
            Hovering a dot stands that event's pass up at the front of the
            deck; clicking opens the calendar at its month. Hidden from
            assistive tech — the passes and the calendar dialog carry the
            same facts. */}
        <div className="relative z-30 h-[50px] mt-auto pt-1 select-none hidden sm:block" aria-hidden="true">
          <div className="absolute left-0 right-0 top-[22px] h-px bg-white/20" />
          {/* The year so far: a brighter thread drawing itself from JAN to
              TODAY when the section arrives. */}
          <div
            className="rail-grow absolute left-0 top-[22px] h-px bg-white/45"
            style={{ width: `${todayPct}%` }}
          />
          {/* The deck's position, ON the rail: a spotlight ring that glides
              to whichever event is standing, the same travelling-highlight
              idea the main nav uses. It fades out when an ongoing programme
              (which has no date, so no dot) holds the deck. */}
          <span
            className="absolute top-[12px] -translate-x-1/2 w-[21px] h-[21px] rounded-full border-2 border-white pointer-events-none"
            style={{
              left: `${
                items[active]?.days !== null && items[active]?.event.month
                  ? (dayOfYear(items[active].event.month as number, items[active].event.day as number) / 365) * 100
                  : todayPct
              }%`,
              opacity: items[active]?.days !== null ? 1 : 0,
              boxShadow: '0 0 12px rgba(255,255,255,0.45)',
              transition:
                'left 550ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease',
            }}
          />
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
            <span className="relative grid place-items-center">
              <span className="rail-ping absolute w-[9px] h-[9px] rounded-full bg-white/80" aria-hidden="true" />
              <span className="relative w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </span>
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
