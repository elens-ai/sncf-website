import test from 'node:test';
import assert from 'node:assert/strict';
import { ambulanceScene } from './ambulanceScene';

for (const [road, van] of [[1100, 340], [350, 250]]) {
  test(`ambulance crosses the entire ${road}px road from left to right`, () => {
    assert.equal(ambulanceScene(road, van, 0).x, -van);
    assert.equal(ambulanceScene(road, van, 1).x, road);
    let previous = ambulanceScene(road, van, 0);
    for (let step = 1; step <= 1000; step++) {
      const current = ambulanceScene(road, van, step / 1000);
      assert.ok(current.x > previous.x, 'movement never pauses or reverses');
      assert.ok(current.wheel > previous.wheel, 'wheels follow forward travel');
      previous = current;
    }
    assert.equal(ambulanceScene(road, van, .5).x, (road - van) / 2);
    assert.deepEqual(ambulanceScene(road, van, -1), ambulanceScene(road, van, 0));
    assert.deepEqual(ambulanceScene(road, van, 2), ambulanceScene(road, van, 1));
  });
}

test('wheel rotation corresponds to the distance travelled', () => {
  const road = 1100, van = 340;
  const radius = van * 23 / 480;
  const scene = ambulanceScene(road, van, .5);
  assert.ok(Math.abs(scene.wheel * Math.PI / 180 * radius - (scene.x + van)) < 1e-9);
});

test('reduced motion keeps the ambulance centred and stationary', () => {
  const still = ambulanceScene(1100, 340, 0, true);
  assert.equal(still.x, 380);
  assert.equal(still.wheel, 0);
  assert.deepEqual(still, ambulanceScene(1100, 340, 1, true));
});
