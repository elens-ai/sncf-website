import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioFocus, fadeMediaVolume, AUDIO_FADE_MS } from './audioFocus';
const media = (muted = false) => ({ muted, pauses: 0, pause() { this.pauses++; } } as unknown as HTMLMediaElement & { pauses: number });
test('project soundtracks exclude the anthem and other audible media', () => {
  const focus = createAudioFocus();
  const amrit = media(), anthem = media(), silentFilm = media(true);
  const release = focus.claim(amrit);
  assert.equal(focus.permits(amrit), true);
  assert.equal(focus.permits(anthem), false);
  assert.equal(focus.permits(silentFilm), true);
  release();
  assert.equal(focus.permits(amrit), true);
  assert.equal(focus.permits(anthem), true);
});
test('switching projects excludes the old track and an old cleanup cannot clear the new owner', () => {
  const focus = createAudioFocus();
  const amrit = media(), vann = media();
  const releaseAmrit = focus.claim(amrit);
  const releaseVann = focus.claim(vann);
  assert.equal(focus.permits(amrit), false);
  releaseAmrit();
  assert.equal(focus.active(), true);
  assert.equal(focus.permits(amrit), false);
  assert.equal(focus.permits(vann), true);
  releaseVann();
  assert.equal(focus.active(), false);
});

test('rapid re-entry does not let an old lease release the same project again', () => {
  const focus = createAudioFocus(), amrit = media();
  const oldRelease = focus.claim(amrit);
  const newRelease = focus.claim(amrit);
  oldRelease();
  assert.equal(focus.active(), true);
  assert.equal(oldRelease.current(), false);
  newRelease();
  assert.equal(focus.active(), false);
});


test('audio ramps ease over time and a replaced ramp cannot report a completed fade-out', async () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousRAF = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const previousCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } });
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; } });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: (key: number) => frames.delete(key) });
  const tick = (now: number) => {
    const batch = [...frames.values()];
    frames.clear();
    batch.forEach(callback => callback(now));
  };
  try {
    const track = { volume: .7 } as HTMLMediaElement;
    const started = performance.now();
    const outgoing = fadeMediaVolume(track, 0);
    tick(started + AUDIO_FADE_MS / 2);
    assert.ok(track.volume > .3 && track.volume < .4, 'the midpoint remains audible instead of cutting off');
    const replacement = fadeMediaVolume(track, 0);
    assert.equal(await outgoing, false, 'cancelled ramps must not trigger an early pause');
    tick(performance.now() + AUDIO_FADE_MS + 1);
    assert.equal(await replacement, true);
    assert.equal(track.volume, 0);
    const incoming = fadeMediaVolume(track, .7);
    assert.equal(track.volume, 0, 'incoming music begins silently');
    tick(performance.now() + AUDIO_FADE_MS + 1);
    assert.equal(await incoming, true);
    assert.equal(track.volume, .7);
  } finally {
    for (const [key, descriptor] of [['document', previousDocument], ['requestAnimationFrame', previousRAF], ['cancelAnimationFrame', previousCancel]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
