import test from 'node:test';
import assert from 'node:assert/strict';
import { ambulanceScene } from './ambulanceScene';

for (const [road, van] of [[1100, 340], [350, 250]]) {
  test(`the restored patient and ambulance stay separated on a ${road}px road`, () => {
    for (let step = 0; step <= 1000; step++) {
      const scene = ambulanceScene(road, van, step / 1000);
      const bumper = scene.x + van * 455 / 480;
      assert.ok(bumper < scene.pedestrianLeft);
    }
    const pause = ambulanceScene(road, van, .46);
    assert.equal(pause.thinking, true);
    assert.equal(pause.running, false);
    assert.equal(pause.stride, 0);
    const reverse = ambulanceScene(road, van, .65);
    assert.equal(reverse.reversing, true);
    assert.equal(reverse.running, true);
    assert.ok(reverse.x < pause.x);
    assert.ok(reverse.pedestrianLeft < pause.pedestrianLeft);
    const end = ambulanceScene(road, van, 1);
    assert.ok(end.x + van < 0);
    assert.ok(end.pedestrianLeft + 36 < 0);
    assert.deepEqual(ambulanceScene(road, van, -1), ambulanceScene(road, van, 0));
    assert.deepEqual(ambulanceScene(road, van, 2), end);
  });
}

test('patient emerges from Health City, notices the ambulance, then runs', () => {
  const door = { left: 130, rise: 190, scale: .4 };
  const inside = ambulanceScene(1100, 340, 0, false, door);
  assert.equal(inside.pedestrianLeft, 130);
  assert.equal(inside.rise, 190);
  assert.equal(inside.opacity, 0);
  const leaving = ambulanceScene(1100, 340, .05, false, door);
  assert.equal(leaving.exiting, true);
  assert.ok(leaving.rise < 190 && leaving.rise > 0);
  const glance = ambulanceScene(1100, 340, .14, false, door);
  assert.equal(glance.noticing, true);
  assert.equal(glance.rise, 0);
  assert.equal(glance.running, false);
  assert.equal(ambulanceScene(1100, 340, .3, false, door).running, true);
});

test('reduced motion keeps the patient and ambulance stationary', () => {
  const still = ambulanceScene(1100, 340, 0, true);
  assert.equal(still.running, false);
  assert.equal(still.stride, 0);
  assert.equal(still.bounce, 0);
  assert.deepEqual(still, ambulanceScene(1100, 340, 1, true));
});
