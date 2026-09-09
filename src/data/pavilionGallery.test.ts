import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PAVILION_GALLERY, pavilionPhase, pavilionExhibitReveal, pavilionProgress, pavilionScrollFraction } from './pavilionGallery';

test('shortened farewell keeps all chapter navigation destinations accurate', () => {
  for (const stop of [0, .125, .92, 1.92, 2.92, 3.92, 4, 4.8, 5]) {
    assert.ok(Math.abs(pavilionProgress(pavilionScrollFraction(stop)) - stop) < 1e-10);
  }
  const finalDistance = pavilionScrollFraction(5) - pavilionScrollFraction(4);
  const galleryDistance = pavilionScrollFraction(1) - pavilionScrollFraction(0);
  assert.ok(Math.abs(finalDistance / galleryDistance - .4) < 1e-10);
});

test('exhibits retain their pose across chapter boundaries and ease away continuously', () => {
  for (let room = 0; room < 4; room++) {
    for (const boundary of [1, 1.001, 1.08, 1.4]) {
      const before = pavilionExhibitReveal(room + boundary - .00001, room);
      const after = pavilionExhibitReveal(room + boundary + .00001, room);
      assert.ok(Math.abs(after - before) < .001, 'no visible pose jump in either scroll direction');
    }
    assert.equal(pavilionExhibitReveal(room + 1.01, room), 1);
    assert.ok(pavilionExhibitReveal(room + 1.24, room) > .4);
    assert.equal(pavilionExhibitReveal(room + 1.5, room), 0);
  }
});

test('each gallery visits five photographs before revealing its exhibit', () => {
  for (let room = 0; room < 4; room++) {
    const seen = new Set<number>();
    for (let part = .04; part < .76; part += .01) {
      const phase = pavilionPhase(room + part);
      assert.equal(phase.room, room); assert.equal(phase.gallery, true); seen.add(phase.photo);
    }
    assert.equal(seen.size, 5);
    const stop = pavilionPhase(room + .93);
    assert.equal(stop.gallery, false); assert.equal(stop.arrival, 1);
  }
});

test('all 20 illustrative images exist as local JPEG assets', async () => {
  assert.equal(PAVILION_GALLERY.flat().length, 20);
  for (const photo of PAVILION_GALLERY.flat()) {
    const bytes = await readFile(new URL(`../../public${photo.src}`, import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
    assert.match(photo.alt, /^Illustrative photograph:/);
  }
});
