/**
 * Paints the landing emblem's pieces in the official logo's colours.
 *
 *   npm run images:logo-ink    writes public/images/petals/ink/petal-<id>.webp and palm.webp
 *
 * The petals and the hand (public/images/petals) are the foundation's
 * commissioned artwork, in that file's own saturated inks; the official logo
 * (the round seal) paints the same lotus and hand in softer ones, petalArt.ts
 * LOGO_COLOURS. This repaints each piece in those: the petals and their heads
 * flat, as in the seal; the hand in the seal's rose, ramped along the
 * artwork's own shading, edged with a keyline as thin as the seal's (the
 * artwork's is three times as heavy). Every piece keeps
 * its file's size and its artwork's alpha, so nothing moves on the page.
 * Sharp is the backend's (the site has none).
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOGO_COLOURS, logoInkSrc } from '../src/components/petalArt';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(import.meta.url)(join(root, 'backend/node_modules/sharp'));

const PETALS = ['welcome', 'heal', 'enrich', 'empower', 'projects'];
/** The keyline, in the artwork's own pixels: the seal's is about 0.65% of a hand's width. */
const KEYLINE = 4.5;

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t) as RGB;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const file = (path: string) => join(root, 'public', path);

async function read(path: string) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: data as Buffer, w: info.width as number, h: info.height as number };
}
const write = (data: Buffer, w: number, h: number, path: string) =>
  sharp(data, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path);

/** Euclidean distance from every pixel to the nearest pixel of `mask` (Felzenszwalb & Huttenlocher). */
function distanceTo(mask: Uint8Array, w: number, h: number) {
  const INF = 1e20, n = Math.max(w, h);
  const g = new Float64Array(w * h).map((_, i) => (mask[i] ? 0 : INF));
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const pass = (length: number) => {
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < length; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < length; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    pass(h);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    pass(w);
    for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]);
  }
  return g;
}

/** The petals and their heads, flat in the seal's colours, on the artwork's own alpha. */
async function petals() {
  for (const [index, id] of PETALS.entries()) {
    const { data, w, h } = await read(file(`/images/petals/petal-${id}.webp`));
    const [r, g, b] = rgb(LOGO_COLOURS.petals[index]);
    for (let i = 0; i < data.length; i += 4) { data[i] = r; data[i + 1] = g; data[i + 2] = b; }
    await write(data, w, h, file(logoInkSrc(id)));
  }
}

/** The hand: the seal's rose along the artwork's shading, edged with a thin white keyline. */
async function palm() {
  const { data, w, h } = await read(file('/images/petals/palm.webp'));
  const N = w * h;
  /* how much of each pixel is the hand's body: the artwork's body is saturated
     pink, its keyline white, and the anti-aliasing between them in between */
  const body = new Float64Array(N), solid = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3] / 255;
    body[i] = clamp01((Math.max(r, g, b) - Math.min(r, g, b) - 30) / 30) * a;
    solid[i] = body[i] >= .5 ? 1 : 0;
  }
  const toBody = distanceTo(solid, w, h);

  /* the rose follows the artwork's own light: a plane fitted to its body's
     luminance, so the ramp runs the way the artwork's shading does, smoothly */
  let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0, n = 0, sxl = 0, syl = 0, sl = 0;
  for (let i = 0; i < N; i++) {
    if (!solid[i]) continue;
    const x = i % w, y = (i - x) / w;
    const l = .299 * data[i * 4] + .587 * data[i * 4 + 1] + .114 * data[i * 4 + 2];
    sxx += x * x; sxy += x * y; sx += x; syy += y * y; sy += y; n++; sxl += x * l; syl += y * l; sl += l;
  }
  // the normal equations for l = a*x + b*y + c, solved by Cramer's rule
  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const normal = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], rhs = [sxl, syl, sl];
  const [pa, pb, pc] = [0, 1, 2].map(col => det3(normal.map((row, r) => row.map((v, c) => (c === col ? rhs[r] : v)))) / det3(normal));
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < N; i++) {
    if (!solid[i]) continue;
    const x = i % w, y = (i - x) / w, l = pa * x + pb * y + pc;
    lo = Math.min(lo, l); hi = Math.max(hi, l);
  }
  const ramp = LOGO_COLOURS.hand.map(rgb);
  const rose = (x: number, y: number): RGB => {
    const t = clamp01((pa * x + pb * y + pc - lo) / (hi - lo)) * (ramp.length - 1);
    const k = Math.min(ramp.length - 2, Math.floor(t));
    return mix(ramp[k], ramp[k + 1], t - k);
  };

  const white: RGB = [255, 255, 255];
  const out = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const x = i % w, y = (i - x) / w;
    /* beneath the body: the thin keyline, and beyond it nothing, the thumb's gap included */
    const underAlpha = clamp01(KEYLINE + .5 - toBody[i]) * (data[i * 4 + 3] > 0 ? 1 : 0);
    const under = white;
    const cover = body[i];
    const alpha = cover + underAlpha * (1 - cover);
    const top = rose(x, y);
    for (let c = 0; c < 3; c++) out[i * 4 + c] = alpha > 0 ? Math.round((top[c] * cover + under[c] * underAlpha * (1 - cover)) / alpha) : 0;
    out[i * 4 + 3] = Math.round(alpha * 255);
  }
  await write(out, w, h, file(logoInkSrc('palm')));
  console.log(`palm: ${w}x${h}, rose from luminance ${lo.toFixed(1)} to ${hi.toFixed(1)}`);
}

mkdirSync(file('/images/petals/ink'), { recursive: true });
await petals();
await palm();
console.log('wrote public/images/petals/ink');
