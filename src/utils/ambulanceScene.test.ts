import test from 'node:test';
import assert from 'node:assert/strict';
import { ambulanceScene } from './ambulanceScene';

for (const [road, van] of [[1100, 340], [350, 250]]) {
  test(`the ambulance travels completely across a ${road}px road without stopping`, () => {
    assert.equal(ambulanceScene(road, van, 0).x, -van);
    assert.equal(ambulanceScene(road, van, 1).x, road);
    let previous = ambulanceScene(road, van, 0);
    for (let step = 1; step <= 100; step++) {
      const next = ambulanceScene(road, van, step / 100);
      assert.ok(next.x > previous.x, 'continues moving through the full journey');
      assert.ok(next.wheel > previous.wheel, 'wheels keep turning until the van exits');
      previous = next;
    }
    assert.deepEqual(ambulanceScene(road, van, -1), ambulanceScene(road, van, 0));
    assert.deepEqual(ambulanceScene(road, van, 2), ambulanceScene(road, van, 1));
  });
}
test('reduced motion keeps the ambulance stationary at the centre', () => {
  const still = ambulanceScene(1100, 340, 0, true);
  assert.equal(still.x, 380);
  assert.equal(still.wheel, 0);
  assert.deepEqual(still, ambulanceScene(1100, 340, 1, true));
});
