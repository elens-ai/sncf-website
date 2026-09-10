import test from 'node:test';
import assert from 'node:assert/strict';
import { pavilionFraming } from './pavilionFraming';

for (const [width, height] of [[360,800],[390,844],[768,1024],[844,390],[1600,900],[1920,1080]]) test(`pavilion photo and finale fit ${width}×${height}`, () => {
  const frame = pavilionFraming(width, height, 48);
  const photoWidth = 2 * Math.tan(frame.photoFOV * Math.PI / 360) * (6.45 + frame.lateralStep) * width / height;
  const finaleWidth = 2 * Math.tan(48 * Math.PI / 360) * 5 * width / height;
  assert.ok(photoWidth >= 6.4, 'full frame remains in view with breathing room');
  assert.ok(frame.lateralStep < 2.325, 'visitor remains within red carpet');
  assert.ok(2.4 * frame.emblemScale < finaleWidth, 'final emblem remains inside viewport');
  const emblemViewHeight = 2 * Math.tan(48 * Math.PI / 360) * 4.5;
  const emblemTop = (.5 - (4.35 + frame.emblemOffsetY - 3.5) / emblemViewHeight - 2.4 * frame.emblemScale / (2 * emblemViewHeight)) * height;
  assert.ok(emblemTop >= 107, 'final emblem clears the header and tour controls');
  if (height <= 600 && height < width) assert.ok(frame.photoFOV >= 68, 'landscape photo has vertical breathing room');
  assert.ok(frame.finaleTextWidth / 2048 * 14.4 < finaleWidth, 'final text fits horizontal view');
});
test('desktop camera retains its path while the finale emblem leaves breathing room', () => {
  const frame = pavilionFraming(1600,900,48);
  assert.equal(frame.lateralStep, 0);
  assert.equal(frame.photoFOV, 48);
  assert.equal(frame.iconFOV, 48);
  assert.ok(frame.emblemScale < .6);
  assert.ok(frame.emblemScale > .3);
});
