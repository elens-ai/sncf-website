import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROGRAMME_REACH, programmeReachTotal } from './programmeReach';

const report = JSON.parse(readFileSync(new URL('../../docs/reports/sncf-september-2026-extracted.json', import.meta.url), 'utf8'));

test('programme reach uses the latest cumulative detail records, not annual additions or dashboard proxies', () => {
  for (const entry of PROGRAMME_REACH) {
    const keys = new Set<string>();
    for (const component of entry.components) {
      const key = `${component.programme}:${component.metric}`;
      assert.ok(!keys.has(key), `duplicate component ${key}`);
      keys.add(key);
      const matches = report.records.filter((row: { programme: string; metric: string; page: number; period: string; scope: string }) =>
        row.programme === component.programme && row.metric === component.metric && row.page === entry.page &&
        row.period.startsWith('As on September 2026') && row.scope.startsWith('cumulative'));
      assert.equal(matches.length, 1, `ambiguous source for ${key}`);
      assert.equal(component.value, matches[0].value, `source mismatch for ${key}`);
      assert.match(matches[0].unit, /records|volunteer participations/, `non-person activity measure included: ${key}`);
    }
  }
  assert.deepEqual(PROGRAMME_REACH.map(programmeReachTotal), [648561, 251863, 5870555]);
});

test('subtotals, estimated blood recipients and non-person outcomes stay outside programme reach', () => {
  const metrics = PROGRAMME_REACH.flatMap(entry => entry.components.map(component => component.metric));
  for (const excluded of ['College students', 'Potentially saved lives', 'Units collected', 'Cataract surgeries', 'Free spectacles', 'Total manhours', 'Trees planted']) {
    assert.ok(!metrics.includes(excluded as typeof metrics[number]), `${excluded} was added to a programme reach total`);
  }
});
