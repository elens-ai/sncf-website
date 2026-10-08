import test from 'node:test';
import assert from 'node:assert/strict';
import { introFocus, introSeconds } from './introSettings';

test('intro hold times read seconds and fall back on anything unusable', () => {
  assert.equal(introSeconds('11', 11), 11000);
  assert.equal(introSeconds(' 8.5 ', 11), 8500);
  assert.equal(introSeconds('7,5', 11), 7500);
  assert.equal(introSeconds('2.5', 3), 2500, 'a page of a few seconds');
  assert.equal(introSeconds('', 11), 11000);
  assert.equal(introSeconds('soon', 24), 24000);
  assert.equal(introSeconds('1', 11), 11000, 'too short to read');
  assert.equal(introSeconds('900', 24), 24000, 'too long to wait');
});

test('photo focus points read "across% down%" and fall back on anything unusable', () => {
  const fallback = { x: '47%', y: '46%' };
  assert.deepEqual(introFocus('47% 46%', fallback), { x: '47%', y: '46%' });
  assert.deepEqual(introFocus('30 60', fallback), { x: '30%', y: '60%' });
  assert.deepEqual(introFocus('50%, 20%', fallback), { x: '50%', y: '20%' });
  assert.deepEqual(introFocus('', fallback), fallback);
  assert.deepEqual(introFocus('center', fallback), fallback);
  assert.deepEqual(introFocus('120% 40%', fallback), fallback, 'outside the picture');
  assert.deepEqual(introFocus('40% 50% 60%', fallback), fallback);
  assert.deepEqual(introFocus('-5% 40%', fallback), fallback);
});
