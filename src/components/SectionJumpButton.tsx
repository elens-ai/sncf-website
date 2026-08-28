import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { PILLARS } from '../data/pillars';
import {
  STAGE_LABELS,
  STAGE_AT,
  STAGE_MID,
  GATE_PAUSE,
  EXIT_POINT,
  glideWindowTo,
  scrubToY,
  easeCinematic,
  easeSmootherstep,
  GlideOpts,
} from './ExhibitionNav';

/**
 * THE SMART NAVIGATOR — one control, one corner, the whole site.
 *
 * Bottom-right, always. What it OFFERS depends on where the reader stands:
 *
 *   · On an ordinary screen: the next section's name and a down chevron —
 *     the page walker. At the very bottom it flips to "Top" and jumps home
 *     directly.
 *   · At the exhibition's door: "Explore" — glides to the gate,
 *     which paints itself on the way while the hand rises to catch the head.
 *   · At the formed gate: "Enter" — pushes through the arch into Heal.
 *   · Inside the rooms: ‹ Room › arrows stepping vertical by vertical, the
 *     room's name between them opening the catalogue. The room's own works
 *     hang as stations under the legend rail at the foot of the screen (see
 *     .legend-works in PillarsSection). The last stage's forward arrow exits
 *     to Events — the journey hands back to the page walker where it ends.
 *
 * The exhibition pieces live in PillarsSection (the case, the catalogue),
 * and this control is mounted at root — so those actions travel as DOM
 * CustomEvents ('sncf:open-catalogue') rather than
 * props threaded through App into a section that must not re-render on the
 * scroll path.
 *
 * Every move is a glide of the actual scroll bar at the site's one shared
 * pace (see ExhibitionNav.ts) — the scrubbed animations always play; this
 * control only supplies the intent.
 */

const SECTIONS: { id: string; label: string }[] = [
  { id: 'hero-clone-stage', label: 'Welcome' },
  { id: 'pillars-section', label: 'Our Work' },
  { id: 'events-section', label: 'Events' },
  { id: 'awards-section', label: 'Awards' },
  { id: 'partners-section', label: 'Partners' },
  { id: 'site-footer', label: 'Connect' },
];

const ROOM_IDS = ['heal', 'enrich', 'empower', 'projects'] as const;

type Mode =
  | { kind: 'page'; atEnd: boolean; nextLabel: string }
  | { kind: 'explore' }
  | { kind: 'start' }
  | { kind: 'rooms'; stage: number };

export const SectionJumpButton: React.FC = () => {
  const [mode, setMode] = useState<Mode>({ kind: 'page', atEnd: false, nextLabel: SECTIONS[1].label });
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onMotionChange);

    /* Unthrottled on purpose: one rect read plus a guarded setState, and an
       rAF gate would freeze the mode while the tab is backgrounded. */
    const read = () => {
      const vh = window.innerHeight || 1;

      /* The exhibition claims the control while its track is pinned. */
      const track = document.getElementById('pillars-section');
      if (track) {
        const r = track.getBoundingClientRect();
        const span = r.height - vh;
        const covered = Math.max(0, Math.min(1, (vh - r.top) / vh));
        const scrub = span > 0 ? -r.top / span : 1;
        /* The rooms end at Projects; from the rose outro on (0.785) the
           corner hands back to the page walker, which offers Events. */
        if (covered >= 0.995 && scrub <= 0.785) {
          let next: Mode;
          if (scrub < 0.145) next = { kind: 'explore' };
          else if (scrub < 0.205) next = { kind: 'start' };
          else {
            let s = 0;
            for (let i = 0; i < STAGE_AT.length; i++) {
              if (scrub >= STAGE_AT[i] - 0.035) s = i;
            }
            next = { kind: 'rooms', stage: s };
          }
          setMode((m) =>
            m.kind === next.kind && (m.kind !== 'rooms' || (m as { stage?: number }).stage === (next as { stage?: number }).stage)
              ? m
              : next,
          );
          return;
        }
      }

      /* Otherwise: the page walker. Current section = the last one whose
         top has climbed past a third of the viewport; bottom-of-document is
         its own end condition because the footer is a short band. */
      let current = 0;
      SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= vh * 0.33) current = i;
      });
      const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
      const end = atBottom || current >= SECTIONS.length - 1;
      const next: Mode = {
        kind: 'page',
        atEnd: end,
        nextLabel: end ? 'Top' : SECTIONS[current + 1].label,
      };
      setMode((m) =>
        m.kind === 'page' && m.atEnd === next.atEnd && m.nextLabel === next.nextLabel ? m : next,
      );
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      mq.removeEventListener('change', onMotionChange);
    };
  }, []);

  const glideToScrub = useCallback((scrub: number, opts?: GlideOpts) => {
    const track = document.getElementById('pillars-section');
    if (track) glideWindowTo(scrubToY(track, scrub), reducedMotionRef.current, opts);
  }, []);

  const glideToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el)
      glideWindowTo(window.scrollY + el.getBoundingClientRect().top, reducedMotionRef.current);
  }, []);

  const handlePageClick = useCallback(() => {
    if (mode.kind !== 'page') return;
    if (mode.atEnd) {
      /* The return home is DIRECT: ~9000px of ground already seen, and the
         scrubbed track would replay backwards the whole way at glide pace.
         Navigation, not choreography. */
      window.scrollTo(0, 0);
      return;
    }
    const vh = window.innerHeight || 1;
    let current = 0;
    SECTIONS.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (el && el.getBoundingClientRect().top <= vh * 0.33) current = i;
    });
    glideToSection(SECTIONS[current + 1]?.id ?? SECTIONS[0].id);
  }, [mode, glideToSection]);

  /* ----- render ----- */

  /* ONE FOOTPRINT FOR EVERY MODE. The control used to change shape and
     anchor as it changed mode — a vertical label-over-circle on ordinary
     screens, a wide pill at the door, an arrow cluster in the rooms — so
     the corner visibly rebuilt itself at each handover. Now a single pill
     of one height stands at one position, and only what it SAYS changes:
     Events / Top / Explore / Start / ‹ Room ›. */

  const roomStage = mode.kind === 'rooms' ? mode.stage : null;
  const pillar = roomStage !== null ? PILLARS.find((p) => p.id === ROOM_IDS[roomStage])! : null;
  const accentVars = (
    pillar
      ? { '--nav-a': pillar.accentA, '--nav-b': pillar.accentB }
      : mode.kind === 'explore' || mode.kind === 'start'
        ? { '--nav-a': PILLARS[0].accentA, '--nav-b': PILLARS[0].accentB }
        : undefined
  ) as React.CSSProperties | undefined;
  const lastStage = roomStage !== null && roomStage >= STAGE_MID.length - 1;

  return (
    <div
      id="section-jump-btn"
      className="section-nav fixed bottom-6 right-4 sm:right-6 md:right-8 lg:right-10 z-40 flex flex-col items-end gap-1.5"
      style={accentVars}
    >
      {/* where the forward arrow leads once the rooms run out */}
      {lastStage && (
        <span className="font-artistic-modern uppercase tracking-[0.2em] text-[9px] text-white/60 pr-2">
          Next · Exit
        </span>
      )}

      {mode.kind === 'rooms' ? (
        <div className="exhibition-nav-pill h-11 flex items-center">
          <button
            type="button"
            onClick={() =>
              mode.stage === 0
                ? glideToScrub(GATE_PAUSE)
                : glideToScrub(STAGE_MID[mode.stage - 1], { msPerPx: 8.5, minMs: 3200, ease: easeCinematic })
            }
            aria-label={mode.stage === 0 ? 'Back to the gate' : `To ${STAGE_LABELS[mode.stage - 1]}`}
            className="exhibition-nav-arrow"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('sncf:open-catalogue'))}
            title="Open the catalogue"
            className="exhibition-nav-name font-artistic-display uppercase tracking-[0.18em] text-[11px]"
          >
            {STAGE_LABELS[mode.stage]}
          </button>
          <button
            type="button"
            /* Projects' forward arrow leads to the EXIT — the closing scene:
               lights down, the emblem holding the floor, the farewell. Only
               there, with the exhibition actually left, does the corner
               offer Events (the mode flips to the page walker past 0.785).
               Leaving rides the cinematic curve; it is the closing shot. */
            onClick={() =>
              lastStage
                ? glideToScrub(EXIT_POINT, { msPerPx: 4.4, minMs: 2600, ease: easeCinematic })
                : glideToScrub(STAGE_MID[mode.stage + 1], { msPerPx: 8.5, minMs: 3200, ease: easeCinematic })
            }
            aria-label={lastStage ? 'To the exit' : `To ${STAGE_LABELS[mode.stage + 1]}`}
            className="exhibition-nav-arrow"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : mode.kind === 'explore' || mode.kind === 'start' ? (
        <button
          type="button"
          /* Both gate glides are slower than the page walker's stride, and
             ENTER is the slowest move on the whole site: it carries the
             doorway's shadow pass and Heal's wall unfolding from the
             corner — the two beats that make the arrival — and both
             deserve to be watched, not glimpsed. Explore remains the long
             establishing move up to the arch on smootherstep. */
          onClick={() =>
            mode.kind === 'explore'
              ? glideToScrub(GATE_PAUSE, { msPerPx: 8, minMs: 4600, ease: easeSmootherstep })
              : glideToScrub(STAGE_MID[0], { msPerPx: 11, minMs: 6000, ease: easeCinematic })
          }
          className="exhibition-nav-pill exhibition-nav-cta h-11 flex items-center px-6 font-artistic-display uppercase tracking-[0.2em] text-[11px]"
        >
          {mode.kind === 'explore' ? 'Explore' : 'Enter'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePageClick}
          aria-label={mode.atEnd ? 'Back to top' : `Scroll to ${mode.nextLabel}`}
          title={mode.atEnd ? 'Back to top' : `Scroll to ${mode.nextLabel}`}
          className="exhibition-nav-pill exhibition-nav-cta h-11 flex items-center gap-2.5 px-6 font-artistic-display uppercase tracking-[0.2em] text-[11px]"
        >
          <span>{mode.atEnd ? 'Top' : mode.nextLabel}</span>
          {mode.atEnd ? (
            <ChevronUp className="w-4 h-4 hero-jump-chevron-up" />
          ) : (
            <ChevronDown className="w-4 h-4 hero-jump-chevron" />
          )}
        </button>
      )}
    </div>
  );
};
