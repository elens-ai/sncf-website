import test from 'node:test';
import assert from 'node:assert/strict';
import { projectEmblemPose } from './projectEmblemMotion';

const scene = (scroll: number, reduced = false) => projectEmblemPose({
  scroll, reduced, source: { x: 90, top: 1145, size: 112 },
  chapterTop: 1000, chapterBottom: 4600, corner: { x: 1160, y: 96, size: 96 },
});

test('starts above the title and travels into the fixed corner', () => {
  assert.deepEqual(scene(962), { x: 90, y: 183, size: 112, opacity: 1, phase: 'origin' });
  assert.equal(scene(1100).phase, 'travelling');
  assert.deepEqual(scene(1242), { x: 1160, y: 96, size: 96, opacity: 1, phase: 'pinned' });
});
test('the travelling logo never passes behind the fixed header', () => {
  for (let scroll = 962; scroll <= 1242; scroll++) assert.ok(scene(scroll).y >= 96);
});

test('the corner never drifts through the story, stats, or gallery', () => {
  for (const scroll of [1400, 2100, 3400, 4200]) assert.deepEqual(scene(scroll), scene(1242));
});
test('the end fades in place instead of pushing the logo offscreen', () => {
  const start = scene(4316), middle = scene(4386), end = scene(4456);
  assert.equal(start.opacity, 1);
  assert.equal(middle.opacity, .5);
  assert.equal(end.opacity, 0);
  for (const pose of [start, middle, end]) { assert.equal(pose.x, 1160); assert.equal(pose.y, 96); }
});
test('reverse scrolling retraces the same path; reduced motion keeps the corner', () => {
  const poses = Array.from({ length: 281 }, (_, i) => scene(962 + i));
  for (let i = 280; i >= 0; i--) assert.deepEqual(scene(962 + i), poses[i]);
  assert.equal(scene(962, true).phase, 'pinned');
});
