/**
 * HOW MUCH THE DEVICE CAN SPARE, as one of three tiers written on the root
 * element (html[data-perf]) for the stylesheets, and handed to the components
 * that draw for themselves (usePerfTier):
 *
 *   high    everything as designed;
 *   medium  the costliest decorative motion thinned: fewer frames, fewer moving parts;
 *   low     decorative motion rests. Content, colour and the turns between
 *           the hall's pages stay; only what moves for its own sake is still.
 *
 * The first guess comes from what the browser tells of the device (its cores,
 * its memory, a data saver). Then the frames themselves are watched while the
 * page moves (scrolled, touched, or in its first seconds), in windows of about
 * two seconds: a device that keeps missing them is stepped down at once, and is
 * remembered on its next visit, so it starts where it ended. A device is never
 * stepped back up while the page is open, so the page does not keep changing
 * its mind; a remembered step lapses after a fortnight.
 *
 * ?perf=high|medium|low in the address fixes the tier for the visit (for
 * checking each tier), and stops the watching.
 */
export type PerfTier = 'high' | 'medium' | 'low';

export const PERF_TIERS: PerfTier[] = ['high', 'medium', 'low'];
const STORE = 'sncf.perf.v1';
const FORCED = 'sncf.perf.forced';
const REMEMBER_MS = 14 * 24 * 60 * 60 * 1000;
export const PERF_TIER_EVENT = 'sncf-perf-tier';

/** The guess from the device's own account of itself. */
export function hintedTier({ cores, memory, saveData }: { cores?: number; memory?: number; saveData?: boolean }): PerfTier {
  if (saveData) return 'low';
  if ((memory !== undefined && memory <= 2) || (cores !== undefined && cores <= 2)) return 'low';
  if ((memory !== undefined && memory <= 4) || (cores !== undefined && cores <= 4)) return 'medium';
  return 'high';
}

/** A frame later than this missed at least one refresh of a 60 Hz screen; a
    screen held to 30 Hz (a phone saving its battery) lands just inside it. */
export const LATE_FRAME_MS = 34;
/** A gap this long is the page put aside (a dialog of the browser's own, a
    debugger), not a frame drawn late. Frames are only watched while the page
    is being moved, so anything shorter is a frame the visitor waited for: a
    struggling device's frames can take half a second each. */
export const LOST_FRAME_MS = 1000;

/** Whether a window of frame intervals (milliseconds) was a struggle: a third
    of its frames late, or most of them slower than a steady 30 frames a
    second (which a phone saving its battery holds every page to, and which is
    not counted against it). */
export function strugglingWindow(intervals: number[]) {
  const frames = intervals.filter(ms => ms > 0 && ms < LOST_FRAME_MS);
  /* a second of frames at least, however few a slow device managed in it */
  if (frames.reduce((sum, ms) => sum + ms, 0) < 1000) return false;
  const late = frames.filter(ms => ms > LATE_FRAME_MS).length / frames.length;
  const sorted = [...frames].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return late >= 1 / 3 || median > 36;
}

export const lowerTier = (tier: PerfTier): PerfTier => PERF_TIERS[Math.min(PERF_TIERS.length - 1, PERF_TIERS.indexOf(tier) + 1)];
const lower = (a: PerfTier, b: PerfTier) => (PERF_TIERS.indexOf(a) >= PERF_TIERS.indexOf(b) ? a : b);
const isTier = (value: unknown): value is PerfTier => typeof value === 'string' && (PERF_TIERS as string[]).includes(value);

let tier: PerfTier = 'high';
let forced = false;
let started = false;

export const perfTier = () => tier;

function publish(next: PerfTier, remember: boolean) {
  if (next === tier && document.documentElement.dataset.perf === next) return;
  tier = next;
  document.documentElement.dataset.perf = next;
  if (remember) {
    try { localStorage.setItem(STORE, JSON.stringify({ tier: next, at: Date.now() })); } catch { /* storage unavailable: this visit only */ }
  }
  document.dispatchEvent(new Event(PERF_TIER_EVENT));
}

export function onPerfTier(listener: (tier: PerfTier) => void) {
  const handler = () => listener(tier);
  document.addEventListener(PERF_TIER_EVENT, handler);
  return () => document.removeEventListener(PERF_TIER_EVENT, handler);
}

/** The frames are watched only while the page moves: for a few seconds after
    it opens, and while it is scrolled or touched (and a moment after). */
function watch() {
  /* a window is two seconds of frames (however many a slow device managed in them), gathered over one or more
     spells of movement; the pauses between spells are not counted */
  const WINDOW_MS = 2000;
  const MOVING_MS = 1500;
  let intervals: number[] = [];
  let last = 0, frame = 0, movingUntil = 0, struggles = 0, gathered = 0;
  const tick = (now: number) => {
    frame = 0;
    if (document.hidden) { last = 0; return; }
    if (last && now - last < LOST_FRAME_MS) { intervals.push(now - last); gathered += now - last; }
    last = now;
    if (gathered >= WINDOW_MS) {
      struggles = strugglingWindow(intervals) ? struggles + 1 : 0;
      intervals = []; gathered = 0;
      /* two struggling windows in a row: one may be the page's own start-up, or a photograph decoding */
      if (struggles >= 2 && tier !== 'low') {
        struggles = 0;
        publish(lowerTier(tier), true);
      }
    }
    if (performance.now() < movingUntil && tier !== 'low') frame = requestAnimationFrame(tick);
    else last = 0;
  };
  const moving = () => {
    movingUntil = performance.now() + MOVING_MS;
    if (!frame && tier !== 'low') frame = requestAnimationFrame(tick);
  };
  for (const type of ['scroll', 'wheel', 'touchmove', 'keydown'] as const) window.addEventListener(type, moving, { passive: true, capture: true });
  /* the page's opening, after its first second's own work */
  window.setTimeout(() => { movingUntil = performance.now() + 4000; if (!frame) frame = requestAnimationFrame(tick); }, 1000);
}

/** Decides the tier before the page is first drawn (main.tsx), and starts watching the frames. */
export function startPerfTier() {
  if (started || typeof document === 'undefined') return;
  started = true;
  const asked = new URLSearchParams(window.location.search).get('perf');
  let pinned: string | null = null;
  try {
    if (isTier(asked)) sessionStorage.setItem(FORCED, asked);
    pinned = sessionStorage.getItem(FORCED);
  } catch { pinned = isTier(asked) ? asked : null; }
  if (isTier(pinned)) { forced = true; publish(pinned, false); return; }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  let start = hintedTier({ cores: nav.hardwareConcurrency || undefined, memory: nav.deviceMemory, saveData: nav.connection?.saveData });
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) ?? 'null') as { tier?: unknown; at?: number } | null;
    if (stored && isTier(stored.tier) && typeof stored.at === 'number' && Date.now() - stored.at < REMEMBER_MS) start = lower(start, stored.tier);
  } catch { /* nothing remembered */ }
  publish(start, false);
  if (!forced) watch();
}
