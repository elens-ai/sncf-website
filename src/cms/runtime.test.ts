import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCMSPublication, bindCMSValue, bootstrapCMS, getCMSCopy, getCMSRevision, getCMSSnapshot, resolveCMSAsset, safeCMSURL, subscribeCMS, validateCMSPublication } from './runtime';
import { ACTIVITIES, DEFAULT_ACTIVITIES } from '../data/activities';
import { DEFAULT_EVENTS } from '../data/events';
import { DEFAULT_PILLARS, PILLARS } from '../data/pillars';
import { resolveActivities, resolveAwards, resolveEvents, resolveGalleryGroups, resolvePavilionGallery, validMedia, validPlate } from './data';
import { DEFAULT_PAVILION_GALLERY } from '../data/pavilionGallery';

let sequence = 0;
const version = () => `test-${++sequence}`;

test('publications reject invalid envelopes and unsafe media URLs without poisoning object prototypes', () => {
  assert.equal(validateCMSPublication({ activities: [] }), null);
  assert.equal(safeCMSURL('javascript:alert(1)'), false);
  assert.equal(safeCMSURL('//untrusted.example/photo.jpg'), false);
  assert.equal(safeCMSURL('https://name:password@example.com/photo.jpg'), false);
  assert.equal(safeCMSURL('/images/photo.webp'), true);
  assert.equal(safeCMSURL('https://cdn.example.com/photo.webp?v=2'), true);
  assert.equal(safeCMSURL('mailto:hello@example.com', true), true);
  const parsed = validateCMSPublication(JSON.parse('{"version":"v1","copy":{"headline":"Welcome"},"assets":{"bad":"javascript:alert(1)","good":"/images/good.webp"},"site":{"__proto__":{"polluted":true}}}'))!;
  assert.deepEqual(parsed.assets, { good: '/images/good.webp' });
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.equal(Object.hasOwn(parsed.site!, '__proto__'), false);
});

test('a publication updates content and live statistics atomically, preserving records in open dialogs', () => {
  const originalActivity = ACTIVITIES[0];
  const previousArray = ACTIVITIES;
  let seenValue = '';
  const unsubscribe = subscribeCMS(() => { seenValue = ACTIVITIES[0].headline.value; });
  const initialRevision = getCMSRevision();
  const next = { version: version(), stats: { 'activity:blood-donation:metric:units-collected': { value: '1,600,000', label: 'Units collected', period: 'As on September 2026' } } };
  assert.equal(applyCMSPublication(next), true);
  assert.equal(ACTIVITIES[0], originalActivity);
  assert.notEqual(ACTIVITIES, previousArray);
  assert.equal(seenValue, '1,600,000');
  assert.equal(ACTIVITIES[0].dataPoints[0].value, '1,600,000');
  assert.equal(ACTIVITIES[0].period, 'As on September 2026');
  assert.equal(getCMSRevision(), initialRevision + 1);
  assert.equal(applyCMSPublication(next), false);
  unsubscribe();
  applyCMSPublication({ version: version() });
  assert.deepEqual(ACTIVITIES[0], DEFAULT_ACTIVITIES[0]);
});

test('module-level copy and media tables refresh on the same publication; absent slots retain their fallback', () => {
  let values = bindCMSValue(() => ({ title: getCMSCopy('test.title', 'Bundled'), image: resolveCMSAsset('test.hero', '/images/bundled.webp') }), value => { values = value; });
  applyCMSPublication({ version: version(), copy: { 'test.title': 'Published' }, assets: { '/images/bundled.webp': '/images/replacement.webp' } });
  assert.equal(values.title, 'Published');
  assert.equal(values.image, '/images/replacement.webp');
  assert.equal(getCMSCopy('missing', 'Bundled fallback'), 'Bundled fallback');
  applyCMSPublication({ version: version(), assets: { 'test.hero': '/images/bundled.webp', '/images/bundled.webp': '/images/shared.webp' } });
  assert.equal(values.image, '/images/shared.webp');
  applyCMSPublication({ version: version(), assets: { 'test.hero': '/images/local-override.webp', '/images/bundled.webp': '/images/shared.webp' } });
  assert.equal(values.image, '/images/local-override.webp');
  applyCMSPublication({ version: version(), assets: { 'test.hero': 'javascript:bad' } });
  assert.equal(values.image, '/images/bundled.webp');
});

test('editors can change fixed rooms but cannot remove camera stops or leave a room without content', () => {
  applyCMSPublication({ version: version(), pillars: [{ ...DEFAULT_PILLARS[0], headline: 'Updated care' }] });
  assert.equal(PILLARS.length, 4);
  assert.deepEqual(PILLARS.map(item => item.id), ['heal', 'enrich', 'empower', 'projects']);
  assert.equal(PILLARS[0].headline, 'Updated care');
  const activities = resolveActivities({ version: 'empty', activities: [] }, structuredClone(DEFAULT_ACTIVITIES));
  for (const room of ['heal', 'enrich', 'empower', 'projects']) assert.ok(activities.some(item => item.pillarId === room));
  const gallery = resolvePavilionGallery({ version: 'empty', gallery: [] }, structuredClone(DEFAULT_PAVILION_GALLERY));
  assert.deepEqual(gallery.map(room => room.length), [5, 5, 5, 5]);
});

test('unsafe links and impossible annual dates do not enter event cards; awards require usable image dimensions', () => {
  const badEvent = { ...DEFAULT_EVENTS[0], day: 31, month: 2, href: 'javascript:alert(1)' };
  assert.deepEqual(resolveEvents({ version: 'bad', events: [badEvent] }, DEFAULT_EVENTS), DEFAULT_EVENTS);
  const goodEvent = { ...DEFAULT_EVENTS[0], title: 'Updated event', href: '/core-values#heal' };
  assert.equal(resolveEvents({ version: 'good', events: [goodEvent] }, DEFAULT_EVENTS)[0].title, 'Updated event');
  assert.deepEqual(resolveAwards({ version: 'bad', awards: [{ id: 'award', title: 'Name', awardedBy: 'Body', year: '2026', photos: [{ src: '/photo.webp', alt: 'Ceremony', width: 0, height: 500 }] }] }, []), []);
});

test('published media supports additions and removals without replacing locked physical room layouts', () => {
  const defaults = { heal: [{ id: 'one', kind: 'photo', src: '/original.webp', alt: 'Original', caption: 'Original' }] };
  assert.deepEqual(resolveGalleryGroups({ version: 'empty', gallery: [] }, defaults, 'media', validMedia), { heal: [] });
  const published = { id: 'new', group: 'media:heal', kind: 'film', src: '/video/new.mp4', alt: 'New film', caption: 'New film' };
  const groups = resolveGalleryGroups({ version: 'new', gallery: [published] }, defaults, 'media', validMedia);
  assert.equal(groups.heal[0].src, '/video/new.mp4');
});

test('gallery source edits reach legacy photo plates even when the API omits optional null fields', () => {
  const defaults = { heal: [{ title: 'Original', alt: 'Original', image: '/original.webp', highlight: null }] };
  const published = { id: 'plate', group: 'plates:heal', src: '/replacement.webp', alt: 'Replacement photo', caption: 'New caption' };
  const groups = resolveGalleryGroups({ version: 'plate-update', gallery: [published] }, defaults, 'plates', validPlate);
  assert.equal(groups.heal[0].image, '/replacement.webp');
  assert.equal(groups.heal[0].title, 'New caption');
  assert.equal(groups.heal[0].highlight, null);
});

test('offline or HTML fallback responses do not blank previously published content', async () => {
  const before = getCMSSnapshot();
  const previousFetch = globalThis.fetch;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
  globalThis.fetch = async () => new Response('<html>Vite fallback</html>', { headers: { 'content-type': 'text/html' } });
  try { await bootstrapCMS(); assert.equal(getCMSSnapshot(), before); }
  finally {
    globalThis.fetch = previousFetch;
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
