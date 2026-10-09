import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ACTIVITIES } from './activities';
import { insightsFor } from './insights';

const values = (id: string) => insightsFor(DEFAULT_ACTIVITIES.find(activity => activity.id === id)!).map(insight => insight.value);

test('insights are worked out from the reported figures, whole numbers left whole', () => {
  assert.deepEqual(values('blood-donation'), ['≈ 164', '3']);
  assert.deepEqual(values('eye-checkup'), ['23%', '9.4%', '≈ 323']);
  assert.deepEqual(values('free-schools'), ['2,424']);
  assert.deepEqual(values('cleanliness'), ['6', '≈ 4,511']);
});

test('money is shown in rupees with Indian grouping', () => {
  assert.deepEqual(values('scholarships'), ['₹29,578']);
  assert.deepEqual(values('financial-support'), ['₹18,41,05,752']);
});

test('a sum names how many kinds it adds up, and a programme without a rule has no insights', () => {
  const [network] = insightsFor(DEFAULT_ACTIVITIES.find(activity => activity.id === 'health-centre')!);
  assert.equal(network.value, '107');
  assert.match(network.label, /9 kinds/);
  assert.deepEqual(insightsFor({ ...DEFAULT_ACTIVITIES[0], id: 'no-such-programme' }), []);
});

test('the flagship projects read their own figures together', () => {
  assert.deepEqual(values('project-amrit'), ['≈ 2,455', '6']);
  assert.deepEqual(values('oneness-vann'), ['≈ 858', '≈ 1,337']);
  assert.deepEqual(values('watershed'), ['≈ 208', '16']);
  assert.deepEqual(values('adopted-villages'), ['84%', '180', '22,875']);
});

test('a share is never more than the whole it belongs to', () => {
  for (const activity of DEFAULT_ACTIVITIES) for (const insight of insightsFor(activity)) {
    if (insight.value.endsWith('%')) assert.ok(Number.parseFloat(insight.value) <= 100, `${activity.id}: ${insight.value}`);
  }
});
