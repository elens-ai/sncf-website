import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PILLARS } from '../data/pillars';
import { BANDS, genome, lerpGenome, sampleEdges, hexToOklab, oklabToRgb, oklabMix } from './waves';

const POSES = [
  { time: 0, travel: .5, px: 0, py: 0, ripple: 0 },
  { time: 37.5, travel: 0, px: -1, py: -1, ripple: 1 },
  { time: 120, travel: 1, px: 1, py: 1, ripple: .4 },
  { time: 999, travel: .33, px: .5, py: -.7, ripple: 0 },
];

test('every pillar yields five ordered bands with colours that survive the round trip', () => {
  for (const pillar of DEFAULT_PILLARS) {
    const g = genome(pillar);
    assert.equal(g.base.length, BANDS);
    for (let i = 1; i < BANDS; i++) assert.ok(g.base[i] > g.base[i - 1], `${pillar.id} band ${i} is above band ${i - 1}`);
    for (const lab of g.colour) {
      const rgb = oklabToRgb(lab);
      for (const channel of rgb) assert.ok(channel >= 0 && channel <= 255 && Number.isInteger(channel));
    }
    /* the deep accent sits between the accents; the shadow band is darker than both */
    assert.ok(g.colour[4][0] < hexToOklab(pillar.accentA)[0], `${pillar.id} shadow band is not darker than accentA`);
  }
});

test('band edges never cross, for any pillar and any pose', () => {
  for (const pillar of DEFAULT_PILLARS) {
    const g = genome(pillar);
    for (const pose of POSES) {
      const edges = sampleEdges(g, 480, 300, pose);
      assert.equal(edges.length, BANDS);
      for (let i = 1; i < BANDS; i++) {
        for (let c = 0; c < edges[i].length; c++) {
          assert.ok(edges[i][c] >= edges[i - 1][c] + 6, `${pillar.id}: band ${i} crosses band ${i - 1} at column ${c}`);
        }
      }
      for (const edge of edges) for (const y of edge) assert.ok(y >= 0 && Number.isFinite(y));
    }
  }
});

test('the top crest stays under the stage label and the bottom band leaves a dark strip', () => {
  for (const pillar of DEFAULT_PILLARS) {
    for (const pose of POSES) {
      const edges = sampleEdges(genome(pillar), 480, 300, pose);
      assert.ok(Math.min(...edges[0]) > 300 * .14, `${pillar.id}: the first crest climbs into the label`);
      assert.ok(Math.min(...edges[BANDS - 1]) < 300 * .95, `${pillar.id}: the bottom band never shows`);
    }
  }
});

test('a morph starts exactly where it left off and lands exactly on its target', () => {
  const [a, b] = DEFAULT_PILLARS;
  const from = genome(a), to = genome(b);
  const close = (x: number[], y: number[]) => x.forEach((v, i) => assert.ok(Math.abs(v - y[i]) < 1e-9, `${v} ≠ ${y[i]}`));
  const started = lerpGenome(from, to, 0);
  close(started.base, from.base); close(started.tilt, from.tilt);
  started.colour.forEach((c, i) => close(c, from.colour[i]));
  const landed = lerpGenome(from, to, 1);
  close(landed.base, to.base); close(landed.tilt, to.tilt);
  landed.amp.forEach((row, i) => close(row, to.amp[i]));
  landed.colour.forEach((c, i) => close(c, to.colour[i]));
  landed.phase.forEach((row, i) => row.forEach((v, k) => {
    const wrapped = ((v - to.phase[i][k]) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    assert.ok(Math.abs(wrapped) < 1e-9, 'phase lands on the target modulo a full turn');
  }));
});

test('rose to cyan does not pass through grey', () => {
  const rose = hexToOklab('#c2185b'), cyan = hexToOklab('#6ac8ed');
  const mid = oklabMix(rose, cyan, .5);
  assert.ok(Math.hypot(mid[1], mid[2]) > .05, 'the midpoint keeps its chroma');
  assert.deepEqual(oklabToRgb(hexToOklab('#ffffff')), [255, 255, 255]);
  assert.deepEqual(oklabToRgb(hexToOklab('#000000')), [0, 0, 0]);
  const [r, g, b] = oklabToRgb(hexToOklab('#1f8a5c'));
  assert.ok(Math.abs(r - 0x1f) <= 1 && Math.abs(g - 0x8a) <= 1 && Math.abs(b - 0x5c) <= 1, 'a colour survives the round trip');
});

test('the never-cross clamp is a safety, not the silhouette: bands are rarely pinched', () => {
  for (const pillar of DEFAULT_PILLARS) {
    const g = genome(pillar);
    let longest = 0;
    for (let time = 0; time < 90; time += 7.5) {
      for (const travel of [0, .25, .5, .75, 1]) {
        const edges = sampleEdges(g, 480, 300, { time, travel, px: 0, py: 0, ripple: 0 });
        for (let i = 1; i < BANDS; i++) {
          let run = 0;
          for (let c = 0; c < edges[i].length; c++) {
            run = edges[i][c] - edges[i - 1][c] < 6.001 ? run + 1 : 0;
            longest = Math.max(longest, run);
          }
        }
      }
    }
    assert.ok(longest <= edges_len_limit(480), `${pillar.id}: a pinched run of ${longest} samples`);
  }
  function edges_len_limit(width: number) { return Math.ceil(width / 3) * .03; }
});
