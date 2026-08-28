/**
 * THE RASTER PETALS AND PALM — replacing the hand-drawn vector paths in
 * `logoShapes.ts` with the foundation's own commissioned artwork
 * (`petals-and-palm.svg`, a Canva export).
 *
 * That file is not really vector: two flattened, AI-shaded raster
 * illustrations wrapped in SVG mask syntax (verified directly — the file
 * carries exactly two `<path>` elements, both plain clip rectangles, against
 * four `<image>` tags holding the actual art as base64 PNG). The five petals
 * are fused into one raster blob wherever their curves cross, so getting
 * five independently animatable pieces out of it took colour segmentation
 * (k-means, k=6, merging one small edge-shading cluster and re-matching each
 * of the four accent dots to its nearest petal by proximity) rather than a
 * straight export.
 *
 * THE TRADE-OFF, made once and worth restating here rather than only in a
 * commit message: these are fixed pixels. `logoTint.ts`'s TINTED_FILLS could
 * repaint each vector petal's shading bands to the room currently in view —
 * a raster crop cannot be repainted the same way, so the flower now wears
 * whichever colours this artwork was shaded in, not the active room's.
 * Every other behaviour carries over unchanged: each of these five images
 * sits inside the SAME per-petal `<g>` the vector paths used to, so the
 * fold/unfold pivot, the stagger, and the hero-watermark scatter are all
 * untouched — only what is drawn inside the group changed.
 *
 * ONE TRANSFORM FOR THE WHOLE COMPOSITION, and this is the important part.
 * An earlier version fitted each petal crop independently into the matching
 * VECTOR petal's bounding box. That silently destroyed the artwork's own
 * proportions: crop and vector bbox have different aspect ratios, so every
 * petal got a different shrink factor — enrich came out 50.7 units wide
 * against welcome's 88.5, a ratio of 1.75, where the artwork itself has them
 * at 1.36. The petals visibly disagreed about what size they were.
 *
 * So nothing is fitted per-petal any more. The source file already places
 * both images in one 1500-unit canvas via explicit matrices (below); that
 * placement IS the authored composition — the petals' sizes relative to each
 * other, and the palm's relative to the flower it cups. All this module does
 * is carry that whole canvas across into LOGO_VIEWBOX with a single uniform
 * scale, chosen so the petals' union lands on the vector petals' union. Every
 * relative proportion inside the artwork survives by construction, because
 * nothing inside it is ever scaled on its own.
 */
/** THE ARTWORK'S OWN FIVE INKS, in its own left-to-right order — the same
    order the flower opens in and the floor plan lists. Read off the supplied
    illustration by the segmentation that separated the petals (the cluster
    centroids), not sampled by eye or copied from the pillar accents, so these
    are literally the colours the logo is painted in.

    Kept here rather than in `pillars.ts` because they belong to the ARTWORK.
    The pillar accents are a parallel set tuned for legible cards and page
    gradients; these are the inks. Confusing the two is how a mark starts
    drifting from its own brand. */
export const LOGO_INK = [
  '#f81170', // magenta — the leftmost petal
  '#b357ad', // purple
  '#6663b5', // indigo
  '#09a6cf', // cyan
  '#69b947', // green — the rightmost
];

export interface PetalArt {
  /** Matches LOGO_PETALS' own id — welcome, heal, enrich, empower, projects. */
  id: string;
  src: string;
  /** Placement in LOGO_VIEWBOX user units. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The source file's own placement matrices, read straight out of
    `petals-and-palm.svg` — `transform="matrix(a, 0, 0, d, e, f)"` on each
    mask's image. Both map their image's pixels into the file's shared
    1500-unit canvas, and together they encode the authored composition. */
const SRC_PETALS = { sx: 0.190031, sy: 0.189941, tx: 314.196657, ty: 337.784687 };
const SRC_PALM = { sx: 2.865234, sy: 2.864583, tx: 199.71359, ty: 797.973439 };

/** Each petal's crop rectangle in the petals image's own 4148x2535 pixel
    space, from the segmentation pass. Dots are included in their petal's
    crop, which is why several boxes are wider than the petal stroke alone. */
const CROP_PX: Record<string, { x0: number; y0: number; x1: number; y1: number }> = {
  welcome: { x0: 128, y0: 1101, x1: 1926, y1: 2401 },
  heal: { x0: 704, y0: 230, x1: 2092, y1: 1839 },
  enrich: { x0: 1594, y0: 156, x1: 2917, y1: 1848 },
  empower: { x0: 2497, y0: 571, x1: 3857, y1: 2032 },
  projects: { x0: 2248, y0: 1479, x1: 4010, y1: 2526 },
};

/** The palm image is used whole — its alpha fills its full 384x144 frame. */
const PALM_PX = { w: 384, h: 144 };

/** Where the VECTOR petals sat, as a union box in LOGO_VIEWBOX units —
    measured once from LOGO_PETALS' path data (flattening every cubic and
    taking the extremes). The artwork is aimed at this box so the emblem
    keeps occupying the same place on screen as before the swap. */
const VECTOR_PETAL_UNION = { x: 150.3, y: 186.4, w: 197.7, h: 120.0 };

/* --- carry the source canvas into LOGO_VIEWBOX ------------------------- */

const toCanvas = (
  m: { sx: number; sy: number; tx: number; ty: number },
  x: number,
  y: number,
  w: number,
  h: number,
) => ({ x: m.tx + x * m.sx, y: m.ty + y * m.sy, w: w * m.sx, h: h * m.sy });

/** Every petal crop, in the shared 1500-unit canvas. */
const PETALS_ON_CANVAS = Object.fromEntries(
  Object.entries(CROP_PX).map(([id, c]) => [
    id,
    toCanvas(SRC_PETALS, c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0),
  ]),
);

/** Their union — what gets aimed at VECTOR_PETAL_UNION. */
const CANVAS_UNION = (() => {
  const boxes = Object.values(PETALS_ON_CANVAS);
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: x1 - x, h: y1 - y };
})();

/** THE single scale, and the offset that centres the result on the vector
    union. `min` keeps it uniform — a per-axis fit would stretch the artwork
    to force an exact match, which is the same mistake as before in a
    different costume. The two aspects agree to well under a percent, so the
    leftover slack is a fraction of a unit either way. */
const K = Math.min(
  VECTOR_PETAL_UNION.w / CANVAS_UNION.w,
  VECTOR_PETAL_UNION.h / CANVAS_UNION.h,
);
const OFF_X = VECTOR_PETAL_UNION.x + (VECTOR_PETAL_UNION.w - CANVAS_UNION.w * K) / 2 - CANVAS_UNION.x * K;
const OFF_Y = VECTOR_PETAL_UNION.y + (VECTOR_PETAL_UNION.h - CANVAS_UNION.h * K) / 2 - CANVAS_UNION.y * K;

const place = (b: { x: number; y: number; w: number; h: number }) => ({
  x: OFF_X + b.x * K,
  y: OFF_Y + b.y * K,
  w: b.w * K,
  h: b.h * K,
});

/** The palm rides the SAME transform — which is the whole point of going
    through the shared canvas. Its size AND its position are the artwork's
    own; nothing about the hand is adjusted. */
const PALM_PLACED = place(toCanvas(SRC_PALM, 0, 0, PALM_PX.w, PALM_PX.h));

export const PALM_ART = {
  src: '/images/petals/palm.webp',
  ...PALM_PLACED,
};

/** THE FLOWER SITS UP IN THE HAND.

    The source file authors the hand slightly overlapping the flower — about
    4% of the petals' height — so the palm's sweep cut across the lower tips
    of the outer petals and hid them. The hand is the fixed thing here (it
    holds the moon, and the moon's own geometry is what everything else is
    registered against), so the flower is what moves: every petal lifts by
    the same amount, just enough to clear the palm's top edge with a hair of
    daylight left between them.

    ONE offset for all five, applied after placement — lifting them
    individually would undo the single-uniform-transform property that the
    whole module exists to guarantee. And `max(0, ...)`, so that if the
    artwork is ever re-exported without the overlap this correction quietly
    becomes a no-op instead of pushing the flower off the hand. */
const PETAL_GAP = 1.5;
const RAW_PETALS = Object.keys(CROP_PX).map((id) => ({
  id,
  src: `/images/petals/petal-${id}.webp`,
  ...place(PETALS_ON_CANVAS[id]),
}));
const PETAL_LIFT = Math.max(
  0,
  Math.max(...RAW_PETALS.map((p) => p.y + p.h)) + PETAL_GAP - PALM_PLACED.y,
);

export const PETAL_ART: PetalArt[] = RAW_PETALS.map((p) => ({ ...p, y: p.y - PETAL_LIFT }));

/** THE DOT-FINDER. Each vector petal's shapes include its accent dot — the
    "head" above the figure — as its own small subpath. This walks a path's
    control points for a bounding box (the data is absolute M/C/z only, so
    every number pair is a coordinate) and calls a shape a dot when its box
    is small and round-ish: the petal's shading bands are also small in AREA
    but always long in one dimension, so a max-side test separates the two
    cleanly. Used to lift the dots off the flower for the consolidation
    (HallEntrance) and to strip them from the flying brushes (the petals
    paint the gate WITHOUT their heads — the heads went to the palm). */
export const shapeBBox = (d: string) => {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

export const isDotShape = (d: string) => {
  /* Measured, not guessed: the four dots are 17-19.7 units on a side and
     nearly round; every other small shape is either a sliver band (aspect
     well over 1.4) or an under-12-unit fleck. The centre petal (enrich) has
     NO dot in the artwork — four heads, not five — so a petal without a
     match is correct, not a failure. */
  const b = shapeBBox(d);
  const mx = Math.max(b.w, b.h);
  const mn = Math.min(b.w, b.h);
  return mx < 26 && mn > 12 && mx / mn < 1.4;
};

/** THE DOTS, AS THE RASTER ACTUALLY PAINTS THEM. The vector and the raster
    disagree here — the vector puts heads on welcome/heal/empower/projects,
    the AI-redrawn raster on welcome/heal/enrich/empower — and what is on
    screen is the raster, so these are the truth for masking and lifting.
    Centres and radii come from the segmentation's connected-component pass
    over the artwork's alpha (full-resolution pixel coordinates), carried
    into viewBox units through each petal's own crop-to-placement mapping —
    the same transform the images themselves render through, so the mask
    hole and the sprite land exactly on the painted dot. */
const RASTER_DOT_PX: Record<string, { x: number; y: number; r: number }> = {
  welcome: { x: 373, y: 1268, r: 158 },
  heal: { x: 1431, y: 400, r: 165 },
  enrich: { x: 2744, y: 361, r: 162 },
  empower: { x: 3683, y: 1259, r: 165 },
};

export const PETAL_DOTS: Record<string, { cx: number; cy: number; r: number }> = (() => {
  const out: Record<string, { cx: number; cy: number; r: number }> = {};
  for (const art of PETAL_ART) {
    const dot = RASTER_DOT_PX[art.id];
    const crop = CROP_PX[art.id];
    if (!dot || !crop) continue;
    const k = art.w / (crop.x1 - crop.x0);
    out[art.id] = {
      cx: art.x + (dot.x - crop.x0) * k,
      cy: art.y + (dot.y - crop.y0) * k,
      r: dot.r * k,
    };
  }
  return out;
})();
