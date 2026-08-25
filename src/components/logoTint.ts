import { LOGO_PETALS } from './logoShapes';
import { PILLARS } from '../data/pillars';
import { DEVOTIONAL_ACCENT } from './DevotionalPhotoCard';

/**
 * WHAT COLOUR EACH PETAL WEARS.
 *
 * Lifted out of SncfLotus3D so the emblem and the entrance's flying petals
 * derive their colours from ONE place. They are the same five petals arriving
 * at the same flower; deriving the ramp twice would let them drift apart on
 * any future edit, and a petal that changes colour as it lands is exactly the
 * kind of seam this screen has spent its whole life removing.
 */

/** THE FLOWER WEARS THE VERTICALS, left to right: Heal, Enrich, Empower,
    Projects, and the devotional rose last. Indexed by POSITION (petals sorted
    by dir.x), never by petal id — the ids are position labels the grouper
    assigned and do not name verticals; the petal keyed 'welcome' is simply
    the leftmost one and wears Heal. */
const POSITION_TINT: { a: string; b: string }[] = (() => {
  const byId = Object.fromEntries(PILLARS.map((p) => [p.id, p]));
  return [
    ...['heal', 'enrich', 'empower', 'projects'].map((id) => ({
      a: byId[id].accentA,
      b: byId[id].accentB,
    })),
    { a: DEVOTIONAL_ACCENT.a, b: DEVOTIONAL_ACCENT.b },
  ];
})();

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rgbToHex = (c: [number, number, number]) =>
  '#' + c.map((v) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, '0')).join('');
/** Perceptual weights: the bands differ mostly in lightness, and using a flat
    mean would collapse the greens and blues onto nearly the same rung. */
const luma = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** How far up its vertical's ramp a petal's lightest band may reach.

    Running the bands over the FULL pair puts the lightest one on accent-b, and
    those light ends are pale tints meant to sit at the far edge of a page-wide
    gradient, not to be a petal's own colour — five petals topping out there
    read as washed out, much lighter than the vivid inks the artwork used.
    Stopping the ramp partway keeps the petal in the saturated middle of its
    vertical while the darkest band still anchors on accent-a, so the shading
    spread survives and only the top end is pulled back. */
const LIGHT_CAP = 0.55;

/** Each petal repainted in its vertical's colours, WITH ITS SHADING INTACT.
    The art is an auto-trace: every petal is several paths that differ only in
    lightness — the bands of its gradient. So rather than flooding the petal
    with one flat colour, each band is placed on the vertical's own ramp at
    the rung it already occupied: the petal's darkest path becomes accent-a,
    its lightest accent-b, everything else in between.

    Keyed by petal id, and each array is indexed by POSITION IN `shapes[]` —
    any renderer must iterate `shapes` in source order or the bands land on
    the wrong paths.

    Computed once at module scope — LOGO_PETALS is static, and this must not
    run per frame or per render. */
export const TINTED_FILLS: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  /* Copied before sorting: an in-place sort of LOGO_PETALS would silently
     reorder the paint order everywhere else that renders it. */
  const leftToRight = [...LOGO_PETALS].sort((p, q) => p.dir.x - q.dir.x);
  leftToRight.forEach((petal, position) => {
    const tint = POSITION_TINT[position];
    const dark = hexToRgb(tint.a);
    const light = hexToRgb(tint.b);
    const ls = petal.shapes.map((sh) => luma(hexToRgb(sh.fill)));
    const lo = Math.min(...ls);
    const hi = Math.max(...ls);
    out[petal.id] = ls.map((l) => {
      const t = (hi > lo ? (l - lo) / (hi - lo) : 1) * LIGHT_CAP;
      return rgbToHex([0, 1, 2].map((i) => lerp(dark[i], light[i], t)) as [number, number, number]);
    });
  });
  return out;
})();
