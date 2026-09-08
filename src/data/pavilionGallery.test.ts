import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PAVILION_GALLERY, pavilionPhase } from './pavilionGallery';

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
