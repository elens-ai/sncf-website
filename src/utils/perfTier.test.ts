import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hintedTier, lowerTier, strugglingWindow } from './perfTier';

test('the first guess follows what the device says of itself', () => {
  assert.equal(hintedTier({ cores: 8, memory: 8 }), 'high');
  /* Safari tells nothing of its memory */
  assert.equal(hintedTier({ cores: 6 }), 'high');
  assert.equal(hintedTier({ cores: 8, memory: 4 }), 'medium');
  assert.equal(hintedTier({ cores: 4, memory: 8 }), 'medium');
  assert.equal(hintedTier({ cores: 8, memory: 2 }), 'low');
  assert.equal(hintedTier({ cores: 2 }), 'low');
  assert.equal(hintedTier({ cores: 16, memory: 8, saveData: true }), 'low');
  assert.equal(hintedTier({}), 'high');
});

test('a tier steps down one at a time, and no lower than low', () => {
  assert.equal(lowerTier('high'), 'medium');
  assert.equal(lowerTier('medium'), 'low');
  assert.equal(lowerTier('low'), 'low');
});

const frames = (ms: number, count: number) => Array.from({ length: count }, () => ms);

test('smooth frames at any refresh rate are not a struggle', () => {
  assert.equal(strugglingWindow(frames(16.7, 120)), false);
  assert.equal(strugglingWindow(frames(8.3, 240)), false);
  /* a phone saving its battery holds the page to 30 frames a second, steadily */
  assert.equal(strugglingWindow(frames(33.3, 60)), false);
});

test('frames that keep coming late are a struggle', () => {
  assert.equal(strugglingWindow(frames(50, 40)), true);
  /* a third of the frames late */
  assert.equal(strugglingWindow([...frames(16.7, 60), ...frames(40, 30)]), true);
  /* a few late frames (a photograph decoding) are not */
  assert.equal(strugglingWindow([...frames(16.7, 110), ...frames(60, 6)]), false);
});

test('a device managing only a few frames a second is struggling', () => {
  assert.equal(strugglingWindow(frames(300, 7)), true);
  assert.equal(strugglingWindow(frames(600, 4)), true);
});

test('pauses are not counted as frames, and too little time decides nothing', () => {
  assert.equal(strugglingWindow([...frames(16.7, 100), 1500, 2400]), false);
  assert.equal(strugglingWindow(frames(60, 10)), false);
});
