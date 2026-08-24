import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  ArrowUpRight,
  Download,
  Infinity as InfinityIcon,
} from 'lucide-react';
import {
  ResolvedEvent,
  MONTHS_SHORT,
  MONTHS_LONG,
  countdownLabel,
  daysUntil,
  nextOccurrence,
  icsHref,
  wrapCalendar,
  vevent,
  nowStamp,
  startOfToday,
} from '../utils/events';

/**
 * The events, viewed as a real month calendar.
 *
 * A month grid on the left, the selected event on the right. Days that carry
 * an event are tinted with that event's pillar colour and clickable; the
 * observances recur every year, so they appear in that month of ANY year the
 * visitor pages to — the detail pane always speaks about the next real
 * occurrence, so a visitor looking at a past month is still told the truth.
 *
 * The detail pane is a BANNER CARD: behind the text sits a scene for the
 * selected event — one soft wash of its pillar colour and a drawn motif
 * (linked rings and a blood drop for Manav Ekta Diwas, a sapling for World
 * Environment Day, a meditator for Yoga Day). The motif follows the hero's
 * lotus-watermark rule: COMPLETE and very faint, never cropped by an edge —
 * a half-shape sliced off by the card boundary reads as an accident and the
 * eye keeps snagging on it. One tint direction, no ghost numerals competing
 * with the close button; the pillar's accent bar on the left edge ties the
 * card to the event cards outside. Motifs are inline SVG: crisp at any size,
 * tinted via currentColor, zero network weight.
 *
 * Quick-jump chips under the grid go straight to each event's month. Export
 * of the whole set as .ics lives here too — the calendar is where the "get
 * this into my calendar" thought happens.
 */

interface EventsCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ResolvedEvent[];
  /** Event to preselect (and open at its month), e.g. from a timeline dot. */
  initialEventId?: string | null;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ----------------------------------------------------------------- motifs */

/** Drawn per event, inherited colour via currentColor. viewBox 0 0 200 200. */
const MOTIFS: Record<string, React.ReactNode> = {
  // Unity rings above, a blood drop within — human oneness, given as blood.
  'manav-ekta-diwas': (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="7">
        <circle cx="76" cy="112" r="38" />
        <circle cx="124" cy="112" r="38" />
      </g>
      <path
        fill="currentColor"
        d="M100 34c-15 22-24 37-24 51a24 24 0 0 0 48 0c0-14-9-29-24-51z"
      />
    </>
  ),
  // A sapling — the same leaf language as the Heal mark, grown large.
  'world-environment-day': (
    <g fill="currentColor" transform="translate(8 8) scale(7.6)">
      <path d="M12 13.1c0-5.6 3.9-10 9.6-10.6.4 5.8-3.4 10.2-9.6 10.6Z" />
      <path d="M11.4 13.1c0-4.5-3.2-8-8.1-8.4-.3 4.7 3 8.1 8.1 8.4Z" />
      <path d="M11.4 13.7c-3.5 0-6.1 2.7-6.1 6.2 3.6 0 6.1-2.7 6.1-6.2Z" />
      <path d="M12.2 13.7c2.9 0 5.2 2.4 5.2 5.2-2.8 0-5.2-2.3-5.2-5.2Z" />
    </g>
  ),
  // A meditator inside an aura ring.
  'international-yoga-day': (
    <>
      <circle cx="100" cy="98" r="66" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.55" />
      <circle cx="100" cy="58" r="15" fill="currentColor" />
      <path
        fill="currentColor"
        d="M100 78c-17 0-29 12-35 30l-19 22c-5 6-1 14 7 14h94c8 0 12-8 7-14l-19-22c-6-18-18-30-35-30z"
      />
      <path
        fill="currentColor"
        d="M52 140c14 8 34 12 48 12s34-4 48-12l-6 14c-12 6-28 9-42 9s-30-3-42-9l-6-14z"
        opacity="0.7"
      />
    </>
  ),
};

/** Fallback — the lotus-adjacent ring the site already speaks in. */
const DEFAULT_MOTIF = (
  <g fill="none" stroke="currentColor" strokeWidth="6">
    <circle cx="100" cy="100" r="58" />
    <circle cx="100" cy="100" r="34" opacity="0.6" />
  </g>
);

export const EventsCalendarModal: React.FC<EventsCalendarModalProps> = ({
  isOpen,
  onClose,
  items,
  initialEventId = null,
}) => {
  const dated = useMemo(() => items.filter((i) => i.days !== null), [items]);
  const ongoing = useMemo(() => items.filter((i) => i.days === null), [items]);

  const today = startOfToday();
  const fallback = dated[0] ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  /* Re-seed selection and month each time the modal opens — to the dot the
     visitor clicked, or to the next upcoming event. */
  useEffect(() => {
    if (!isOpen) return;
    const target =
      (initialEventId && dated.find((i) => i.event.id === initialEventId)) || fallback;
    if (target?.date) {
      setSelectedId(target.event.id);
      setView({ year: target.date.getFullYear(), month: target.date.getMonth() });
    } else {
      setSelectedId(null);
      setView({ year: today.getFullYear(), month: today.getMonth() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialEventId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const selected = dated.find((i) => i.event.id === selectedId) ?? fallback;

  const exportAllHref = useMemo(() => {
    const stamp = nowStamp();
    return icsHref(wrapCalendar(dated.flatMap((i) => vevent(i.event, i.date as Date, stamp))));
  }, [dated]);

  if (!isOpen) return null;

  const { year, month } = view;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsOn = (day: number) =>
    dated.filter((i) => i.event.month === month + 1 && i.event.day === day);

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  const step = (delta: number) =>
    setView(({ year: y, month: m }) => {
      const d = new Date(y, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <div
      id="events-calendar-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Events calendar"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="events-calendar-panel"
        className="relative w-full max-w-4xl my-auto rounded-[32px] bg-neutral-950/95 border border-white/15 shadow-2xl p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close calendar"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white grid place-items-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
          {/* ------------------------------------------------ month grid */}
          <div>
            <div className="flex items-center justify-between mb-4 pr-10 md:pr-0">
              <h2 className="font-artistic-heading text-white font-bold text-[22px]">
                {MONTHS_LONG[month]}{' '}
                <span className="text-white/50 tabular-nums">{year}</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous month"
                  className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setView({ year: today.getFullYear(), month: today.getMonth() })
                  }
                  className="px-3 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next month"
                  className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d, i) => (
                <p
                  key={i}
                  className="text-center text-[10px] font-extrabold tracking-[0.14em] text-white/40 py-1"
                >
                  {d}
                </p>
              ))}
            </div>

            {/* Always 42 cells — six weeks — whatever the month needs.
                A month starting late uses six rows and one starting early
                uses four, so a grid sized to the month makes the whole panel
                change height as the visitor pages; trailing blanks pin it. */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }, (_, i) => (
                <div key={`lead-${i}`} className="h-11" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const hits = eventsOn(day);
                const hit = hits[0];
                const isSel = hit && selected && hit.event.id === selected.event.id;
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!hit}
                    onClick={() => hit && setSelectedId(hit.event.id)}
                    aria-label={
                      hit ? `${hit.event.title}, ${day} ${MONTHS_LONG[month]}` : undefined
                    }
                    className={`relative h-11 rounded-xl text-[13px] tabular-nums transition-all duration-200 ${
                      hit
                        ? 'font-bold text-white cursor-pointer hover:scale-[1.06]'
                        : 'text-white/45'
                    } ${isToday(day) ? 'ring-1 ring-white/70' : ''} ${
                      isSel ? 'ring-2 ring-white' : ''
                    }`}
                    style={
                      hit
                        ? {
                            backgroundColor: `${hit.accentB}2b`,
                            border: `1px solid ${hit.accentB}66`,
                          }
                        : undefined
                    }
                  >
                    {day}
                    {hit && (
                      <span
                        className="absolute left-1/2 -translate-x-1/2 bottom-1 w-[5px] h-[5px] rounded-full"
                        style={{ backgroundColor: hit.accentB }}
                      />
                    )}
                    {isToday(day) && (
                      <span className="absolute top-0.5 right-1 text-[7px] font-extrabold tracking-wider text-white/70">
                        NOW
                      </span>
                    )}
                  </button>
                );
              })}
              {Array.from({ length: 42 - firstWeekday - daysInMonth }, (_, i) => (
                <div key={`tail-${i}`} className="h-11" />
              ))}
            </div>

            {/* Quick jumps — nobody should page eight months to find an event. */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {dated.map((i) => {
                const d = i.date as Date;
                const active = selected && i.event.id === selected.event.id;
                return (
                  <button
                    key={i.event.id}
                    onClick={() => {
                      setSelectedId(i.event.id);
                      setView({ year: d.getFullYear(), month: d.getMonth() });
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                      active
                        ? 'text-neutral-900 bg-white border-white'
                        : 'text-white/80 bg-white/5 border-white/15 hover:bg-white/15'
                    }`}
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: i.accentB }}
                    />
                    {MONTHS_SHORT[d.getMonth()]} {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------ detail pane */}
          <div className="flex flex-col">
            {selected && selected.date ? (
              /* Banner card. key remounts it per event so the scene and copy
                 crossfade together instead of morphing in place. */
              <div
                key={selected.event.id}
                className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] p-5 pl-6 animate-fadeIn"
                style={{
                  /* ONE tint, one direction, gone by mid-card. The earlier
                     two-gradient scene lit the card from opposing corners and
                     the uneven light was itself unsettling. */
                  backgroundImage: `linear-gradient(120deg, ${selected.accentA}21 0%, transparent 55%)`,
                }}
              >
                {/* The same single accent line the event cards carry. */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full"
                  style={{ backgroundColor: selected.accentB }}
                />

                {/* The motif, watermark-style: complete, centred in the card's
                    right half, and faint — the hero's lotus rule. Cropping it
                    at an edge made it read as an accident. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 200 200"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-[150px] h-[150px] pointer-events-none"
                  style={{ color: selected.accentB, opacity: 0.09 }}
                >
                  {MOTIFS[selected.event.id] ?? DEFAULT_MOTIF}
                </svg>

                <div className="relative z-10 flex flex-col h-full">
                  <span
                    className="self-start text-[9px] font-extrabold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border mb-3"
                    style={{
                      color: selected.accentB,
                      borderColor: `${selected.accentB}4d`,
                      backgroundColor: `${selected.accentB}14`,
                    }}
                  >
                    {selected.event.tag}
                  </span>

                  <h3 className="font-artistic-heading text-white font-bold text-[22px] leading-tight mb-1">
                    {selected.event.title}
                  </h3>

                  {/* Always the NEXT real occurrence — paging back to a past
                      month must not produce a date that has already gone. */}
                  <p className="text-[13px] text-white/70 mb-3 tabular-nums">
                    {selected.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    ·{' '}
                    {countdownLabel(
                      daysUntil(
                        nextOccurrence(
                          selected.event.month as number,
                          selected.event.day as number,
                        ),
                      ),
                    )}
                    <span className="text-white/45"> · every year</span>
                  </p>

                  <p className="font-artistic-serif text-white/85 text-[14px] leading-relaxed mb-4">
                    {selected.event.blurb}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-auto">
                    <a
                      href={icsHref(
                        wrapCalendar(vevent(selected.event, selected.date, nowStamp())),
                      )}
                      download={`${selected.event.id}.ics`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold text-neutral-900 bg-white hover:scale-[1.04] active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Add to my calendar
                    </a>
                    {selected.event.href && (
                      <a
                        href={selected.event.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-[12px] font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        Take part
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-white/60">Pick a highlighted day.</p>
            )}

            {/* Programmes with no date — running whatever month is showing. */}
            <div className="pt-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/45 mb-2 flex items-center gap-1.5">
                <InfinityIcon className="w-3 h-3" />
                Running all year
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ongoing.map((i) => (
                  <a
                    key={i.event.id}
                    href={i.event.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white/80 bg-white/5 border border-white/15 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: i.accentB }}
                    />
                    {i.event.title}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                ))}
              </div>

              <a
                href={exportAllHref}
                download="sncf-events.ics"
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Export all as .ics
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
