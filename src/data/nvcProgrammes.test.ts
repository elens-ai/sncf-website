import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ACTIVITIES } from './activities';
import { groupOf, withGroups } from './programmeGroups';
import { nvcProgrammes } from './nvcProgrammes';

test('NVC presents all four programmes in the requested order with a consistent content structure', () => {
  const programmes = nvcProgrammes();
  assert.deepEqual(programmes.map(p => p.id), ['nvc-library', 'nvc-coaching', 'skill-trades', 'skill-nima']);
  for (const programme of programmes) {
    assert.equal(groupOf(programme.id)?.id, 'nvc');
    assert.equal(programme.features.length, 3);
    assert.equal(programme.facts.length, 2);
  }
});

test('NVC keeps each reported programme count distinct and never invents a library count', () => {
  const programmes = nvcProgrammes();
  assert.deepEqual(programmes[1].facts.map(f => f.value), ['3', '1,370']);
  assert.deepEqual(programmes[2].facts.map(f => f.value), ['631', '16,500']);
  assert.deepEqual(programmes[3].facts.map(f => f.value), ['27', '4,114']);
  assert.ok(programmes[0].facts.every(f => !/\d/.test(f.value)));
});

test('grouping moves coaching display into NVC without mutating the CMS source or inflating skills totals', () => {
  const source = structuredClone(DEFAULT_ACTIVITIES.filter(a => a.pillarId === 'enrich'));
  const listed = withGroups(source);
  assert.equal(listed.find(a => a.id === 'free-schools')?.dataPoints.some(p => /coaching/i.test(p.label)), false);
  assert.equal(source.find(a => a.id === 'free-schools')?.dataPoints.some(p => /coaching/i.test(p.label)), true);
  const nvc = listed.find(a => a.id === 'nvc')!;
  assert.equal(nvc.headline.value, '21,245');
  assert.match(nvc.headline.label, /skills.*arts/i);
});
