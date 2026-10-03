/**
 * THE WAVES — the artwork behind the Living Mosaic, as pure functions.
 *
 * Five flat, matte ribbons stacked top to bottom, the way the reference
 * artwork is built: each band is the space between its own top edge and the
 * next band's, filled with one opaque colour, so nothing piles up where they
 * overlap. A pillar gives the picture its "genome" — five baselines, a lean,
 * three sine components per band and five colours mixed from its accents and
 * a cream — and a chapter turn is a lerp between two genomes: baselines,
 * lean, amplitudes, phases (along the shortest arc) and colours move; the
 * wave frequencies never do, because a moving frequency slides every crest
 * sideways at a rate proportional to x and reads as the picture being
 * squeezed, not re-posed.
 *
 * Colour lives in OKLab. Mixing and lerping there keeps the pastels' chroma
 * and stops the Empower-rose → Projects-cyan turn from passing through grey.
 *
 * Nothing here touches the DOM except paintWaves, which takes a 2D context;
 * genome, lerpGenome and sampleEdges run under node for the tests.
 */
import type { PillarState } from '../types';
import type { Activity } from '../data/activities';

export const BANDS = 5;
/** Cycles per width for the three components, and per-band scale so the five
    ribbons read as different characters rather than phase-shifted copies. */
const FREQ = [.9, 1.7, 3.1];
const BAND_SCALE = [1, .85, 1.15, .95, 1.05];
/** Idle drift, rad/s — two forward, one back, periods of 31–70 s: alive, never busy. */
const DRIFT = [.24, -.17, .11];
/** A slow vertical breath on every band, as a fraction of the height. */
const BREATH = .006;
const BASE = [.28, .42, .56, .70, .84];
/* Small enough that two neighbours' full swings (×1.35 temper, ×1.32 depth) stay
   inside the .14 baseline gap: the +6 px clamp is a safety, never the silhouette. */
const AMP = [.02, .01, .005];
const TILT = [.02, -.015, .025, -.02, .01];
/** How lively and which way the picture leans, per pillar. */
const TEMPER: Record<string, number> = { heal: 1, enrich: 1.2, empower: 1.35, projects: .9 };
const SLOPE: Record<string, number> = { heal: 1, enrich: -1, empower: 1.3, projects: -.7 };
const TAU = Math.PI * 2;

export type Lab = [number, number, number];
export interface Genome {
  base: number[];
  tilt: number[];
  amp: number[][];
  phase: number[][];
  colour: Lab[];
}

/* ----- colour: sRGB hex ⇄ OKLab ----- */
const toLinear = (c: number) => (c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055);

export function hexToOklab(hex: string): Lab {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h;
  const [r, g, b] = [0, 2, 4].map(i => toLinear(parseInt(full.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
  const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
  const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  return [
    .2104542553 * l + .7936177850 * m - .0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + .4505937099 * s,
    .0259040371 * l + .7827717662 * m - .8086757660 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): [number, number, number] {
  const l = (L + .3963377774 * a + .2158037573 * b) ** 3;
  const m = (L - .1055613458 * a - .0638541728 * b) ** 3;
  const s = (L - .0894841775 * a - 1.2914855480 * b) ** 3;
  const channel = (v: number) => Math.round(Math.max(0, Math.min(1, toGamma(v))) * 255);
  return [
    channel(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s),
    channel(-1.2684380046 * l + 2.6097574011 * m - .3413193965 * s),
    channel(-.0041960863 * l - .7034186147 * m + 1.7076147010 * s),
  ];
}

export const oklabMix = (a: Lab, b: Lab, t: number): Lab => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ----- the genome ----- */
export function genome(pillar: Subject): Genome {
  const A = hexToOklab(pillar.accentA), B = hexToOklab(pillar.accentB);
  const neutral = hexToOklab('#edf8f6');
  const white = hexToOklab('#ffffff'), ink = hexToOklab('#0b1a1a');
  const temper = TEMPER[pillar.id] ?? 1, slope = SLOPE[pillar.id] ?? 1;
  return {
    /* the lean, not a stagger, gives each pillar its pose: even gaps keep the bands from pinching */
    base: BASE.map(v => v + .01 * slope),
    tilt: TILT.map(v => v * slope),
    amp: Array.from({ length: BANDS }, (_, i) => AMP.map(v => v * temper * (1 + i * .08))),
    /* a fixed table, nothing random per render — the same rule as the tiles' flight table */
    phase: Array.from({ length: BANDS }, (_, i) => FREQ.map((_, k) => (i * 1.7 + k * 2.3 + temper * 3) % TAU)),
    colour: [
      oklabMix(neutral, B, .28),                 // pearl white, tinted toward the pillar
      oklabMix(B, white, .35),                   // the pastel of the light accent
      oklabMix(oklabMix(B, A, .35), white, .18), // the mid tone
      oklabMix(A, B, .25),                       // the deep accent
      oklabMix(A, ink, .32),                     // the shadow band
    ],
  };
}

/** The shortest way round the circle from one phase to another. */
const arc = (from: number, to: number) => ((((to - from) % TAU) + 3 * Math.PI) % TAU) - Math.PI;

export function lerpGenome(from: Genome, to: Genome, u: number): Genome {
  return {
    base: from.base.map((v, i) => v + (to.base[i] - v) * u),
    tilt: from.tilt.map((v, i) => v + (to.tilt[i] - v) * u),
    amp: from.amp.map((row, i) => row.map((v, k) => v + (to.amp[i][k] - v) * u)),
    phase: from.phase.map((row, i) => row.map((v, k) => v + arc(v, to.phase[i][k]) * u)),
    colour: from.colour.map((c, i) => oklabMix(c, to.colour[i], u)),
  };
}

/** Fits --home-ease (cubic-bezier(.22,1,.36,1)) to within 1%. */
export const easeOut = (u: number) => 1 - (1 - u) ** 5;

export interface Pose {
  /** seconds on the clock — the idle drift */
  time: number;
  /** the reader's progress through the whole stage, 0..1 — crests travel with it */
  travel: number;
  /** the eased pointer, each in -1..1 */
  px: number;
  py: number;
  /** one decaying breath under the medallion after a turn, 1 → 0 */
  ripple: number;
}

/** Sample every band's top edge, in buffer pixels, `step` pixels apart.
    Bands are clamped never to cross: a crossing would self-intersect a fill. */
export function sampleEdges(g: Genome, width: number, height: number, pose: Pose, step = 3): Float64Array[] {
  const cols = Math.ceil(width / step) + 1;
  const edges: Float64Array[] = [];
  for (let i = 0; i < BANDS; i++) {
    const ys = new Float64Array(cols);
    const depth = (i + 1) / BANDS;
    const floor = edges[i - 1];
    for (let c = 0; c < cols; c++) {
      const u = (c * step) / width;
      /* a slight lateral warp so crests wander at different rates per band and read as drawn, not plotted */
      const uw = u + .01 * Math.sin(TAU * .5 * u + .3 * pose.time + 1.3 * i) + pose.px * .02 * depth;
      let y = g.base[i] + g.tilt[i] * (u - .5) - (pose.travel - .5) * .028 * depth + pose.py * .012 * depth
        + BREATH * Math.sin(pose.time * .4 + i * 1.1);
      for (let k = 0; k < 3; k++) {
        y += g.amp[i][k] * Math.sin(FREQ[k] * BAND_SCALE[i] * TAU * uw + g.phase[i][k] + DRIFT[k] * pose.time + 4.8 * pose.travel);
      }
      if (pose.ripple > .01) y += pose.ripple * .02 * Math.exp(-((u - .2) ** 2) * 40);
      ys[c] = Math.max(y * height, floor ? floor[c] + 6 : 0);
    }
    edges.push(ys);
  }
  return edges;
}

const INK = hexToOklab('#0b1a1a');

/** A speck of light in the air over the water. Normalised x/y; r in buffer px. */
export interface Mote { x: number; y: number; r: number; a: number }

/** Paint the ribbons — each shaded a little darker toward its foot, with a
    breath of light travelling along its crest — then the motes, then keep
    only `mask` × `alpha` of it all: all the translucency in one place, so the
    flat fills never pile up. */
export function paintWaves(ctx: CanvasRenderingContext2D, g: Genome, width: number, height: number, pose: Pose, mask: CanvasGradient, alpha = 1, step = 3, motes: Mote[] = []) {
  const edges = sampleEdges(g, width, height, pose, step);
  const cols = edges[0].length;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < BANDS; i++) {
    const top = edges[i], bottom = edges[i + 1];
    let y0 = Infinity, y1 = -Infinity;
    for (let c = 0; c < cols; c++) { y0 = Math.min(y0, top[c]); y1 = Math.max(y1, bottom ? bottom[c] : height); }
    ctx.beginPath();
    ctx.moveTo(-2, top[0]);
    for (let c = 0; c < cols; c++) ctx.lineTo(c * step, top[c]);
    if (bottom) for (let c = cols - 1; c >= 0; c--) ctx.lineTo(c * step, bottom[c]);
    else { ctx.lineTo(width + 2, height + 2); ctx.lineTo(-2, height + 2); }
    ctx.closePath();
    const [r, gg, b] = oklabToRgb(g.colour[i]);
    const [r2, g2, b2] = oklabToRgb(oklabMix(g.colour[i], INK, .22));
    const shade = ctx.createLinearGradient(0, y0, 0, Math.max(y0 + 1, y1));
    const [lr, lg, lb] = oklabToRgb(oklabMix(g.colour[i], hexToOklab('#ffffff'), .2));
    shade.addColorStop(0, `rgb(${lr} ${lg} ${lb})`);
    shade.addColorStop(.18, `rgb(${r} ${gg} ${b})`);
    shade.addColorStop(.62, `rgb(${r2} ${g2} ${b2})`);
    shade.addColorStop(1, `rgb(${r2} ${g2} ${b2})`);
    ctx.fillStyle = shade;
    ctx.fill();
  }
  /* the light on the crests: a soft rim, brightest where a slow highlight passes */
  for (let i = 0; i < BANDS; i++) {
    const top = edges[i];
    const centre = .5 + .38 * Math.sin(pose.time * .14 + i * 1.3);
    const light = ctx.createLinearGradient(0, 0, width, 0);
    light.addColorStop(0, 'rgb(255 255 255 / .07)');
    light.addColorStop(Math.max(0, centre - .16), 'rgb(255 255 255 / .07)');
    light.addColorStop(centre, 'rgb(255 255 255 / .58)');
    light.addColorStop(Math.min(1, centre + .16), 'rgb(255 255 255 / .07)');
    light.addColorStop(1, 'rgb(255 255 255 / .07)');
    ctx.beginPath();
    ctx.moveTo(-2, top[0]);
    for (let c = 0; c < cols; c++) ctx.lineTo(c * step, top[c]);
    for (let c = cols - 1; c >= 0; c--) ctx.lineTo(c * step, top[c] + 2.2);
    ctx.closePath();
    ctx.fillStyle = light;
    ctx.fill();
  }
  /* Fine translucent currents follow each ribbon, with a different phase
     at each depth. They never cross the neighbouring ribbon. */
  for (let i = 0; i < BANDS - 1; i++) {
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const blend = .2 + strand * .16 + .045 * Math.sin(u * TAU + pose.time * .18 + i);
        const y = edges[i][c] + (edges[i + 1][c] - edges[i][c]) * blend;
        if (c === 0) ctx.moveTo(0, y); else ctx.lineTo(c * step, y);
      }
      const glint = ctx.createLinearGradient(0, 0, width, 0);
      glint.addColorStop(0, 'rgba(255,255,255,0)');
      glint.addColorStop(.5 + .25 * Math.sin(pose.time * .12 + i), 'rgba(255,255,255,.16)');
      glint.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = glint;
      ctx.lineWidth = .55;
      ctx.stroke();
    }
  }
  /* the motes: a soft halo and a bright core each */
  for (const m of motes) {
    const x = m.x * width, y = m.y * height;
    ctx.fillStyle = `rgb(255 255 255 / ${(m.a * .2).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, m.r * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgb(255 255 255 / ${m.a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** What the waves become while a programme has the reader's attention. */
export type Subject = Pick<PillarState, 'id' | 'accentA' | 'accentB'>;

/* A programme's own mood — water, forest, harvest, clinic — as an accent pair
   the pillar's genome is re-mixed with. Nothing here is a fact about the
   programme; it is art direction, which is why it lives with the waves and
   not in activities.ts. Programmes without a line keep their pillar's. */
const MOODS: Record<string, [string, string]> = {
  'blood-donation': ['#a3243a', '#f2a0ad'],
  'eye-checkup': ['#3c7fb3', '#a9d4f2'],
  'health-centre': ['#1f8a5c', '#bfe8d2'],
  'blood-bank': ['#8a2d3f', '#f0b0bb'],
  'schools-colleges': ['#2a6fb0', '#a8d0f0'],
  'scholarships': ['#b58a1f', '#f5dc8a'],
  'skill-trades': ['#b0468a', '#f0b6dc'],
  'tree-plantation': ['#2f8f3c', '#a8e3a0'],
  'cleanliness': ['#2aa7a0', '#a8ecdf'],
  'covid-relief': ['#b0442f', '#f4b19f'],
  'mass-marriages': ['#c2185b', '#f8c1d4'],
  'financial-support': ['#a0801f', '#f2dd9a'],
  'project-amrit': ['#0b5f8a', '#7fd0f0'],
  'oneness-vann': ['#1f7a3f', '#8fd9a0'],
  'watershed': ['#8a5a1e', '#f2c56b'],
  'adopted-villages': ['#6a4a8a', '#d9b8e8'],
};

export function subjectFor(pillar: Subject, activity?: Pick<Activity, 'id'> | null): Subject {
  const mood = activity && MOODS[activity.id];
  return mood ? { id: pillar.id, accentA: mood[0], accentB: mood[1] } : pillar;
}
