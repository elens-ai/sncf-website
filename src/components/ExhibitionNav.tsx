/**
 * THE EXHIBITION'S NAVIGATION TABLE — shared constants and the one glide.
 *
 * The navigator itself lives in SectionJumpButton (the single smart control
 * at the bottom-right corner); the legend rail in PillarsSection offers the
 * same four stops from the bottom of the screen. Both import their targets
 * and their motion from here, so a stop or a pace can never fork.
 */

export const STAGE_LABELS = ['Heal', 'Enrich', 'Empower', 'Projects'];

/** Where each ROOM takes the screen over — the first four entries of
    VERTICAL_SEQUENCE's `at` list in PillarsSection; keep the two in step.
    The fifth stage (the devotional rose at 0.82) is the exhibition's
    farewell, not a stop: it has no room, no legend cell — the emblem itself
    stands in that place — and while it plays, the corner control belongs to
    the page walker offering Events. */
export const STAGE_AT = [0.24, 0.385, 0.53, 0.675];

/** Where a glide should LAND for each stage: past the crossfade, with the
    room fully live and its plates still high on their parallax run. */
export const STAGE_MID = [0.31, 0.45, 0.6, 0.745];

/** The formed gate's pause — past the paint (0.05–0.13), before the
    walk-through hands over to Heal's ground at 0.2. */
export const GATE_PAUSE = 0.165;

/** Closing time — the house lights fully down (0.8–0.9), the emblem holding
    centre floor, the farewell written. The last stop inside the exhibition;
    from here the corner control is the page walker offering Events. */
export const EXIT_POINT = 0.9;

const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** The dolly curve — quartic in and out. A longer hesitation leaving, a
    faster sweep through the middle, a softer settle arriving: the profile
    of a camera move rather than a scroll. Used by the gate glides. */
export const easeCinematic = (x: number) =>
  x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;

/** Smootherstep — zero velocity AND zero acceleration at both ends, so the
    motion has no perceptible onset or stop at all: it is simply moving, and
    then simply isn't. The smoothest curve there is; the approach to the
    gate rides it. */
export const easeSmootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

export interface GlideOpts {
  /** Pace override — larger is slower. The site default is 3.2. */
  msPerPx?: number;
  minMs?: number;
  ease?: (x: number) => number;
}

/** The site's one programmatic scroll: constant pace (3.2ms/px ≈ 313px/s),
    scroll-snap suspended for the flight, and the reader's own input —
    wheel, touch, key — cancels it instantly. See SectionJumpButton for the
    original derivation of each part. */
export const glideWindowTo = (targetY: number, reduced: boolean, opts: GlideOpts = {}) => {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;
  if (reduced) {
    window.scrollTo(0, targetY);
    return;
  }
  const ease = opts.ease ?? easeInOutCubic;
  const duration = Math.max(opts.minMs ?? 1400, Math.abs(distance) * (opts.msPerPx ?? 3.2));
  const startTime = performance.now();
  const root = document.documentElement;
  const priorSnap = root.style.scrollSnapType;
  root.style.scrollSnapType = 'none';

  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  const unbind = () => {
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
  };
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);

  const finish = () => {
    root.style.scrollSnapType = priorSnap;
    unbind();
    /* One last scroll event, explicitly: the final scrollTo's own event can
       land before React has flushed, and every listener keyed to position
       deserves a read at the exact resting point. */
    window.dispatchEvent(new Event('scroll'));
  };
  const step = (now: number) => {
    if (cancelled) {
      finish();
      return;
    }
    const p = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * ease(p));
    if (p < 1) requestAnimationFrame(step);
    else finish();
  };
  requestAnimationFrame(step);
};

/** Scrub → document Y for the exhibition track. */
export const scrubToY = (track: HTMLElement, scrub: number) => {
  const r = track.getBoundingClientRect();
  const span = r.height - (window.innerHeight || 1);
  return window.scrollY + r.top + scrub * span;
};
