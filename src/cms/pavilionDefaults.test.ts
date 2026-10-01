import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePavilionSettings, pavilionDefaults, safePavilionURL } from './pavilionDefaults';

test('missing or partial settings keep every bundled model', () => {
  assert.deepEqual(normalizePavilionSettings(undefined), pavilionDefaults);
  assert.deepEqual(normalizePavilionSettings({ materials: { stone: {} } }), pavilionDefaults);
  const value = normalizePavilionSettings({ models: { oneness: '/media/forest.glb' } });
  assert.equal(value.models.oneness, '/media/forest.glb');
  assert.equal(value.models.enrich, pavilionDefaults.models.enrich);
});

test('unsafe model URLs keep their bundled fallback', () => {
  const value = normalizePavilionSettings({ models: { heal: '//untrusted.example/model.glb', empower: 'javascript:alert(1)', enrich: 'https://cdn.example/enrich.glb' } });
  assert.equal(value.models.heal, pavilionDefaults.models.heal);
  assert.equal(value.models.empower, pavilionDefaults.models.empower);
  assert.equal(value.models.enrich, 'https://cdn.example/enrich.glb');
  for (const invalid of ['data:image/svg+xml,evil', 'https://user:pass@example.com/x', '/\\evil', 'file:///x']) assert.equal(safePavilionURL(invalid, '/fallback'), '/fallback');
});

test('normalized settings do not mutate shared bundled defaults', () => {
  const value = normalizePavilionSettings({});
  value.models.heal = '/changed.glb';
  assert.equal(pavilionDefaults.models.heal, '/models/heal.glb');
});
