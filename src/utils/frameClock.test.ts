import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameClock } from './frameClock';

function harness() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let id = 0;
  return {
    callbacks,
    scheduler: {
      request: (callback: FrameRequestCallback) => { callbacks.set(++id, callback); return id; },
      cancel: (key: number) => { callbacks.delete(key); },
    },
    advance(time: number) {
      const pending = [...callbacks.values()]; callbacks.clear();
      pending.forEach(callback => callback(time));
    },
  };
}
test('one clock remains bounded on a 120Hz display', () => {
  const h = harness(); let draws = 0;
  const clock = createFrameClock(() => draws++, 30, h.scheduler);
  clock.start(); clock.start();
  assert.equal(h.callbacks.size, 1);
  for (let i = 0; i < 120; i++) h.advance(i * 1000 / 120);
  assert.ok(draws >= 29 && draws <= 31, `expected about 30 draws, got ${draws}`);
  clock.stop(); assert.equal(h.callbacks.size, 0);
});
test('offscreen or paused clocks do no work and resume without a time jump', () => {
  const h = harness(); const deltas: number[] = [];
  const clock = createFrameClock(delta => deltas.push(delta), 30, h.scheduler);
  clock.start(); h.advance(100); clock.stop();
  h.advance(100000); assert.equal(deltas.length, 1);
  clock.start(); h.advance(200000);
  assert.ok(deltas[1] <= .1); clock.stop();
});
test('stopping inside a draw cannot leave another frame queued', () => {
  const h = harness();
  const clock = createFrameClock(() => clock.stop(), 30, h.scheduler);
  clock.start(); h.advance(0); assert.equal(h.callbacks.size, 0);
});
