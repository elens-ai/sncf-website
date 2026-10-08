import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SNCFEvent } from '../data/events';
import { resolveEvents } from './events';

test('past event records never become upcoming invitations or repeat next year', () => {
  const base = { title: 'Community service', tag: 'Service', blurb: 'A local event.', pillarId: 'heal' as const };
  const events: SNCFEvent[] = [
    { ...base, id: 'report', kind: 'past', occurredOn: '2025-04-26', photos: [{ src: '/event.webp', alt: 'Volunteers at the event' }] },
    { ...base, id: 'ongoing', kind: 'ongoing' },
    { ...base, id: 'annual', kind: 'annual', month: 6, day: 21 },
  ];
  const resolved = resolveEvents(events);
  assert.deepEqual(resolved.map(({ event }) => event.id), ['annual', 'ongoing']);
  assert.ok(resolved[0].date instanceof Date);
  assert.equal(resolved[1].date, null);
  assert.deepEqual(resolveEvents([events[0]]), []);
});
