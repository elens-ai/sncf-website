/**
 * Builds the site's heading face, "SNCF Flared", from the hero's own lettering.
 *
 *   npm run font:headings     writes src/assets/fonts/sncf-flared.otf (bundled, so each build gets a fresh name)
 *
 * The capitals are the flared letters the hero and the intro already draw
 * (PillarWordmark: H, E, A and L traced from the approved hero reference, the
 * rest drawn to match). The letters those names never needed, the figures and
 * the punctuation are drawn below in the same manner: stems about 26 units
 * wide and a little waisted, corners softened, round letters overshooting the
 * cap line by 2. Lower case maps to the capitals, so a heading reads in
 * capitals while its text stays as written (for search and screen readers).
 * Anything else falls back to the next font in the CSS stack.
 *
 * Glyphs are drawn y-down on the wordmarks' 112-unit canvas: cap line 6,
 * baseline 108.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { NAME_GLYPHS, NAME_SPACE } from '../src/components/PillarWordmark';

type Drawn = { width: number; dx?: number; path: string };

const dot = (x: number, top: number) => `M${x + 4} ${top}H${x + 22}Q${x + 26} ${top} ${x + 26} ${top + 4}V${top + 22}Q${x + 26} ${top + 26} ${x + 22} ${top + 26}H${x + 4}Q${x} ${top + 26} ${x} ${top + 22}V${top + 4}Q${x} ${top} ${x + 4} ${top}Z`;
const comma = (x: number, top: number) => `M${x + 4} ${top}H${x + 22}Q${x + 26} ${top} ${x + 26} ${top + 4}V${top + 18}Q${x + 26} ${top + 24} ${x + 22} ${top + 30}L${x + 14} ${top + 42}Q${x + 12} ${top + 45} ${x + 8} ${top + 44}Q${x + 5} ${top + 43} ${x + 6} ${top + 39}L${x + 10} ${top + 26}H${x + 4}Q${x} ${top + 26} ${x} ${top + 22}V${top + 4}Q${x} ${top} ${x + 4} ${top}Z`;
const tick = (x: number) => `M${x + 4} 6H${x + 20}Q${x + 24} 6 ${x + 24} 10L${x + 22} 40Q${x + 21.5} 44 ${x + 18} 44H${x + 6}Q${x + 2.5} 44 ${x + 2} 40L${x} 10Q${x} 6 ${x + 4} 6Z`;
const bar = (width: number) => `M4 50H${width - 4}Q${width} 50 ${width} 54V68Q${width} 72 ${width - 4} 72H4Q0 72 0 68V54Q0 50 4 50Z`;
/* A quotation mark is a comma raised to the cap line; its opening twin is the same mark turned round. */
const closeQuote = (x: number) => comma(x, 6);
const openQuote = (x: number) => turn(comma(0, 6), 26, 56, x);

/** The path turned through 180° within a box of the given size, then moved right by `x`. */
function turn(path: string, width: number, height: number, x = 0) {
  return path.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, px, py) => `${+(width - +px + x).toFixed(2)} ${+(height - +py).toFixed(2)}`)
    .replace(/H(-?\d+(?:\.\d+)?)/g, (_, px) => `H${+(width - +px + x).toFixed(2)}`)
    .replace(/V(-?\d+(?:\.\d+)?)/g, (_, py) => `V${+(height - +py).toFixed(2)}`);
}
/** The path mirrored left to right within a box of the given width. */
function mirror(path: string, width: number) {
  return path.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, px, py) => `${+(width - +px).toFixed(2)} ${py}`)
    .replace(/H(-?\d+(?:\.\d+)?)/g, (_, px) => `H${+(width - +px).toFixed(2)}`);
}

const PAREN = 'M30 2Q34 2 33 7Q22 30 22 57Q22 84 33 107Q34 112 30 112H18Q14 112 12 108Q0 84 0 57Q0 30 12 6Q14 2 18 2Z';

/* The letters, figures and marks the wordmarks never needed. */
const EXTRA: Record<string, Drawn> = {
  G: { width: 94, path: 'M52 4Q76 4 88 14Q92 17 91 22L90 34Q89 40 83 36Q70 26 54 27Q29 28 29 57Q29 86 54 87Q62 87 68 83V72H56Q52 72 52 68V56Q52 52 56 52H90Q94 52 94 56V96Q94 100 90 102Q76 110 52 110Q0 110 0 57Q0 4 52 4Z' },
  /* the ring with its tail drawn as one outline: overlapping shapes can show a seam at small sizes */
  Q: { width: 104, path: 'M52 4Q104 4 104 57Q104 73.7 94.6 87.4L108 101Q113 107 108 112L100 116Q95 118 91 114L84 107Q80 104 78 102.9Q65.9 110 52 110Q0 110 0 57Q0 4 52 4ZM52 27Q29 27 29 57Q29 87 52 87Q75 87 75 57Q75 27 52 27Z' },
  V: { width: 99, path: 'M3 6H24Q30 6 32 12L50 74L68 12Q70 6 76 6H95Q100 6 98 11L66 101Q63 108 56 108H44Q37 108 34 101L1 11Q-1 6 3 6Z' },
  X: { width: 96, path: 'M4 6H26Q31 6 34 11L48 33L62 11Q65 6 70 6H92Q97 6 94 11L64 56L95 102Q98 108 92 108H70Q65 108 62 103L48 80L34 103Q31 108 26 108H4Q-2 108 1 102L32 56L2 11Q-1 6 4 6Z' },
  Y: { width: 98, path: 'M3 6H24Q30 6 32 12L49 46L66 12Q68 6 74 6H95Q100 6 97 11L62 64Q61.5 86 62 104Q62 108 58 108H40Q36 108 36 104Q36.5 86 36 64L1 11Q-1 6 3 6Z' },
  Z: { width: 90, path: 'M4 6H84Q90 6 90 12V20Q90 25 87 29L36 86H84Q88 86 88 90V104Q88 108 84 108H6Q0 108 0 102V94Q0 89 3 85L54 28H6Q2 28 2 24V10Q2 6 4 6Z' },
  '0': { width: 90, path: 'M45 4Q90 4 90 57Q90 110 45 110Q0 110 0 57Q0 4 45 4ZM45 27Q27 27 27 57Q27 87 45 87Q63 87 63 57Q63 27 45 27Z' },
  '1': { width: 50, path: 'M24 6H46Q50 6 50 10Q48.5 57 50 104Q50 108 46 108H28Q24 108 24 104Q25.5 72 24 38L8 44Q2 46 2 40V30Q2 24 8 21L20 8Q22 6 24 6Z' },
  '2': { width: 88, path: 'M14 16Q28 4 46 4Q86 4 86 34Q86 52 66 66L40 86H82Q86 86 86 90V104Q86 108 82 108H6Q2 108 2 104V94Q2 88 7 84L50 50Q58 44 58 36Q58 26 46 26Q32 26 20 34Q14 38 13 32L12 21Q12 18 14 16Z' },
  '3': { width: 88, path: 'M12 14Q28 4 46 4Q84 4 84 30Q84 46 70 53Q88 60 88 78Q88 110 46 110Q22 110 8 101Q4 98 4 93V82Q4 76 10 80Q26 89 44 89Q60 89 60 78Q60 66 44 66H34Q30 66 30 62V52Q30 48 34 48H42Q56 48 56 37Q56 26 44 26Q30 26 18 33Q12 36 12 30Z' },
  '4': { width: 88, path: 'M52 6H70Q76 6 76 12V66H84Q88 66 88 70V82Q88 86 84 86H76V104Q76 108 72 108H54Q50 108 50 104V86H6Q0 86 0 80V70Q0 66 3 62L44 10Q47 6 52 6ZM50 34L26 66H50Z' },
  '5': { width: 88, path: 'M14 6H80Q84 6 84 10V22Q84 28 78 28H36L35 42Q40 40 48 40Q88 40 88 74Q88 110 44 110Q20 110 6 100Q2 97 2 92V81Q2 75 8 79Q24 89 42 89Q60 89 60 75Q60 62 42 62Q30 62 20 67Q12 71 10 65L10 12Q10 6 14 6Z' },
  '6': { width: 90, path: 'M60 4Q76 4 84 9Q88 11 87 16L85 26Q84 32 78 30Q70 27 60 27Q34 27 30 50Q38 42 52 42Q90 42 90 76Q90 110 47 110Q0 110 0 58Q0 4 60 4ZM46 63Q30 63 30 77Q30 89 46 89Q62 89 62 76Q62 63 46 63Z' },
  '7': { width: 90, path: 'M4 6H84Q90 6 90 12V20Q90 26 86 31L48 104Q46 108 41 108H22Q16 108 19 102L58 28H6Q2 28 2 24V10Q2 6 4 6Z' },
  '8': { width: 90, path: 'M45 4Q86 4 86 32Q86 48 72 55Q90 63 90 80Q90 110 45 110Q0 110 0 80Q0 63 18 55Q4 48 4 32Q4 4 45 4ZM45 24Q31 24 31 35Q31 46 45 46Q59 46 59 35Q59 24 45 24ZM45 64Q29 64 29 76Q29 89 45 89Q61 89 61 76Q61 64 45 64Z' },
  '9': { width: 90, path: 'M30 110Q14 110 6 105Q2 103 3 98L5 88Q6 82 12 84Q20 87 30 87Q56 87 60 64Q52 72 38 72Q0 72 0 38Q0 4 43 4Q90 4 90 56Q90 110 30 110ZM44 51Q60 51 60 37Q60 25 44 25Q28 25 28 38Q28 51 44 51Z' },
  '.': { width: 26, path: dot(0, 82) },
  ',': { width: 26, path: comma(0, 82) },
  ':': { width: 26, path: dot(0, 34) + dot(0, 82) },
  ';': { width: 26, path: dot(0, 34) + comma(0, 82) },
  '!': { width: 26, path: `M4 6H22Q26 6 26 10L23 70Q22.5 74 19 74H7Q3.5 74 3 70L0 10Q0 6 4 6Z${dot(0, 82)}` },
  '?': { width: 86, path: `M10 12Q26 4 46 4Q86 4 86 32Q86 50 66 58Q58 62 58 68V70Q58 74 54 74H38Q34 74 34 70V64Q34 50 52 42Q60 38 60 32Q60 26 46 26Q32 26 18 33Q12 36 12 30V18Q12 14 10 12Z${dot(33, 82)}` },
  '-': { width: 44, path: bar(44) },
  '‐': { width: 44, path: bar(44) },
  '‑': { width: 44, path: bar(44) },
  '–': { width: 64, path: bar(64) },
  '—': { width: 100, path: bar(100) },
  '’': { width: 26, path: closeQuote(0) },
  '‘': { width: 26, path: openQuote(0) },
  '”': { width: 60, path: closeQuote(0) + closeQuote(34) },
  '“': { width: 60, path: openQuote(0) + openQuote(34) },
  "'": { width: 24, path: tick(0) },
  '"': { width: 58, path: tick(0) + tick(34) },
  '(': { width: 34, path: PAREN },
  ')': { width: 34, path: mirror(PAREN, 34) },
  '/': { width: 78, path: 'M58 2H74Q79 2 77 7L26 110Q24 114 19 114H4Q-1 114 1 109L52 6Q54 2 58 2Z' },
  '+': { width: 72, path: 'M28 26H44Q48 26 48 30V50H68Q72 50 72 54V66Q72 70 68 70H48V90Q48 94 44 94H28Q24 94 24 90V70H4Q0 70 0 66V54Q0 50 4 50H24V30Q24 26 28 26Z' },
  '·': { width: 26, path: dot(0, 45) },
  '…': { width: 94, path: dot(0, 82) + dot(34, 82) + dot(68, 82) },
};

const NAMES: Record<string, string> = {
  '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon', '!': 'exclam', '?': 'question',
  '-': 'hyphen', '‐': 'uni2010', '‑': 'uni2011', '–': 'endash', '—': 'emdash',
  '’': 'quoteright', '‘': 'quoteleft', '”': 'quotedblright', '“': 'quotedblleft', "'": 'quotesingle', '"': 'quotedbl',
  '(': 'parenleft', ')': 'parenright', '/': 'slash', '+': 'plus', '·': 'periodcentered', '…': 'ellipsis',
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
};

/* Font units: cap height 102 drawn units = 714. */
const SCALE = 7;
const BASELINE = 108;
const SIDE = 5;   // drawn units of space either side of a glyph
const GAP = 10;   // the wordmarks' spacing between letters

type Point = [number, number];
type Segment = { to: Point; control?: Point };
type Contour = { start: Point; segments: Segment[] };

/** Absolute M, L, H, V, Q and Z commands, as the drawn glyphs use, into contours. */
function contours(path: string): Contour[] {
  const tokens = path.match(/[MLHVQZ]|-?\d*\.?\d+/gi) ?? [];
  const out: Contour[] = [];
  let at: Point = [0, 0];
  let command = '';
  for (let i = 0; i < tokens.length;) {
    if (/[A-Z]/i.test(tokens[i])) command = tokens[i++].toUpperCase();
    const n = () => Number(tokens[i++]);
    if (command === 'M') { at = [n(), n()]; out.push({ start: at, segments: [] }); command = 'L'; }
    else if (command === 'L') { at = [n(), n()]; out[out.length - 1].segments.push({ to: at }); }
    else if (command === 'H') { at = [n(), at[1]]; out[out.length - 1].segments.push({ to: at }); }
    else if (command === 'V') { at = [at[0], n()]; out[out.length - 1].segments.push({ to: at }); }
    else if (command === 'Q') { const control: Point = [n(), n()]; at = [n(), n()]; out[out.length - 1].segments.push({ to: at, control }); }
    else if (command === 'Z') {
      at = out[out.length - 1].start;
      if (i < tokens.length && !/[A-Z]/i.test(tokens[i])) throw new Error('numbers after Z');
    }
    else throw new Error(`unsupported path command ${command}`);
  }
  return out;
}

/* Points along a contour, its control points standing in for its curves: close enough to judge direction and nesting. */
const outline = (contour: Contour): Point[] => [contour.start, ...contour.segments.flatMap(s => (s.control ? [s.control, s.to] : [s.to]))];
const area = (points: Point[]) => points.reduce((sum, [x, y], i) => { const [nx, ny] = points[(i + 1) % points.length]; return sum + x * ny - nx * y; }, 0) / 2;
const inside = ([x, y]: Point, points: Point[]) => {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]; const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
function reversed(contour: Contour): Contour {
  const points = [contour.start, ...contour.segments.map(s => s.to)];
  const segments = contour.segments.map((s, i) => ({ to: points[i], control: s.control })).reverse();
  return { start: points[points.length - 1], segments };
}

/** The drawn glyph as an opentype path: in font units, outer contours anticlockwise and counters clockwise, so it fills the same under the font's non-zero rule as under the SVG's even-odd one. */
function glyphPath(drawn: Drawn) {
  const shift = (drawn.dx ?? 0) + SIDE;
  const font = (contour: Contour): Contour => {
    const map = ([x, y]: Point): Point => [(x + shift) * SCALE, (BASELINE - y) * SCALE];
    return { start: map(contour.start), segments: contour.segments.map(s => ({ to: map(s.to), control: s.control && map(s.control) })) };
  };
  const all = contours(drawn.path).map(font);
  const path = new opentype.Path();
  for (const contour of all) {
    const depth = all.filter(other => other !== contour && inside(contour.start, outline(other))).length;
    const anticlockwise = area(outline(contour)) > 0;
    const shaped = (depth % 2 === 0) === anticlockwise ? contour : reversed(contour);
    path.moveTo(...shaped.start);
    for (const s of shaped.segments) {
      if (s.control) path.quadraticCurveTo(s.control[0], s.control[1], s.to[0], s.to[1]);
      else path.lineTo(...s.to);
    }
    path.close();
  }
  return path;
}

const glyphs = [
  new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 50 * SCALE, path: new opentype.Path() }),
  new opentype.Glyph({ name: 'space', unicode: 32, advanceWidth: NAME_SPACE * SCALE, path: new opentype.Path() }),
];
const DRAWN: Record<string, Drawn> = { ...NAME_GLYPHS, ...EXTRA };
for (const [char, drawn] of Object.entries(DRAWN).sort(([a], [b]) => a.localeCompare(b))) {
  const glyph = new opentype.Glyph({
    name: NAMES[char] ?? char,
    unicode: char.codePointAt(0)!,
    advanceWidth: (drawn.width + GAP) * SCALE,
    path: glyphPath(drawn),
  });
  /* lower case reads as the capital */
  if (/^[A-Z]$/.test(char)) glyph.addUnicode(char.toLowerCase().codePointAt(0)!);
  glyphs.push(glyph);
}
/* a no-break space is a space */
const space = glyphs[1];
space.addUnicode(0xa0);

const font = new opentype.Font({
  familyName: 'SNCF Flared',
  styleName: 'Regular',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  designer: 'Sant Nirankari Charitable Foundation',
  description: 'Heading capitals drawn from the SNCF hero lettering.',
  glyphs,
});
const missing = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].filter(char => !DRAWN[char]);
if (missing.length) throw new Error(`no glyph for ${missing.join(' ')}`);
const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/fonts/sncf-flared.otf');
writeFileSync(out, Buffer.from(font.toArrayBuffer()));
console.log(`SNCF Flared: ${glyphs.length} glyphs written to ${out}`);
