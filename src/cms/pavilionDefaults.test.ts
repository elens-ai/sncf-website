import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePavilionSettings, pavilionDefaults, safePavilionURL } from './pavilionDefaults';

test('partial or missing settings preserve the complete existing pavilion', () => {
  assert.deepEqual(normalizePavilionSettings(undefined), pavilionDefaults);
  const value = normalizePavilionSettings({ windows: { amrit: { woodColor: '#ffffff' } }, components: { planters: false } });
  assert.equal(value.components.planters, false);
  assert.equal(value.components.pendants, true);
  assert.equal(value.windows.amrit.frost, true);
  assert.equal(value.windows.oneness.frost, false);
  assert.equal(value.models.enrich, pavilionDefaults.models.enrich);
});

test('published quality and camera limits remain safe and mutually consistent', () => {
  const value = normalizePavilionSettings({
    performance: { maxWidth: 100000, maxHeight: 20, fps: 2000, minScale: .95, maxScale: .6 },
    lighting: { fogNear: 80, fogFar: 31, exposure: -10, pictureIntensity: Infinity },
    camera: { fieldOfView: NaN, photoPause: 9 },
  });
  assert.deepEqual(value.performance, { ...pavilionDefaults.performance, maxWidth: 1920, maxHeight: 480, fps: 60, minScale: .95, maxScale: .95 });
  assert.equal(value.lighting.fogFar, 85);
  assert.equal(value.lighting.exposure, .25);
  assert.equal(value.lighting.pictureIntensity, pavilionDefaults.lighting.pictureIntensity);
  assert.equal(value.camera.fieldOfView, 48);
  assert.equal(value.camera.photoPause, .65);
});

test('invalid palette fields and unsafe media preserve their bundled fallback', () => {
  const value = normalizePavilionSettings({
    materials: { carpet: { color: 'url(evil)', texture: 'javascript:alert(1)' } },
    chapters: [{ id: 'other', wall: '#112233', led: '#gggggg' }],
    models: { heal: '//untrusted.example/model.glb', oneness: '/media/forest.glb' },
    windows: { amrit: { video: 'https://safe.example/lake.mp4' } },
  });
  assert.equal(value.materials.carpet.color, pavilionDefaults.materials.carpet.color);
  assert.equal(value.materials.carpet.texture, '');
  assert.equal(value.chapters[0].id, 'heal');
  assert.equal(value.chapters[0].wall, '#112233');
  assert.equal(value.chapters.length, 4);
  assert.equal(value.models.heal, pavilionDefaults.models.heal);
  assert.equal(value.models.oneness, '/media/forest.glb');
  assert.equal(value.windows.amrit.video, 'https://safe.example/lake.mp4');
  for (const invalid of ['data:image/svg+xml,evil', 'https://user:pass@example.com/x', '/\\evil', 'file:///x']) assert.equal(safePavilionURL(invalid, '/fallback'), '/fallback');
});

test('normalized settings do not mutate shared bundled defaults', () => {
  const value = normalizePavilionSettings({});
  value.chapters[0].wall = '#000000';
  value.materials.planterColors[0] = '#ffffff';
  assert.equal(pavilionDefaults.chapters[0].wall, '#709d83');
  assert.equal(pavilionDefaults.materials.planterColors[0], '#e3d2b8');
});
