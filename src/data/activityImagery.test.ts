import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_ACTIVITIES } from './activities';
import { DEFAULT_PAVILION_GALLERY } from './pavilionGallery';
import { DEFAULT_ACTIVITY_IMAGERY, SYMBOL_ONLY, activityImage, activityGallery, exploreHref, activityImageAt } from './activityImagery';

/* a programme shown by its symbol alone has no picture, its own or borrowed */
const pictured = DEFAULT_ACTIVITIES.filter(activity => !SYMBOL_ONLY.has(activity.id));

test('a programme shown by its symbol alone borrows no photograph and renders none', () => {
  for (const id of SYMBOL_ONLY) {
    const activity = DEFAULT_ACTIVITIES.find(a => a.id === id);
    assert.ok(activity, `${id} is not a programme`);
    assert.equal(DEFAULT_ACTIVITY_IMAGERY[id], undefined, `${id} borrows a photograph`);
    if (!activity.images.length) assert.equal(activityImage(activity), null);
  }
});

test('every reported activity borrows a photograph from its own pillar, and no two share one', () => {
  const photos = DEFAULT_PAVILION_GALLERY.flat();
  const used = new Map<string, string>();
  for (const activity of pictured) {
    const wanted = DEFAULT_ACTIVITY_IMAGERY[activity.id];
    assert.ok(wanted, `${activity.id} has no photograph`);
    assert.ok(photos.some(p => p.id === wanted), `${wanted} is not a pavilion photograph`);
    assert.ok(wanted.startsWith(`${activity.pillarId}-gallery-`), `${activity.id} borrows from another pillar`);
    assert.equal(used.get(wanted), undefined, `${wanted} is shared by ${used.get(wanted)} and ${activity.id}`);
    used.set(wanted, activity.id);
  }
});

test('illustrative tiles are labelled and backed by JPEG files; a supplied photograph wins unlabelled', async () => {
  for (const activity of pictured) {
    const image = activityImage(activity);
    assert.ok(image, `${activity.id} renders no image`);
    if (activity.images.length) {
      assert.equal(image.illustrative, false);
      assert.equal(image.src, activity.images[0].src);
      assert.doesNotMatch(image.alt, /^Illustrative photograph:/);
      continue;
    }
    assert.equal(image.illustrative, true);
    assert.match(image.src, /^\/images\/pavilion\//);
    assert.match(image.alt, /^Illustrative photograph:/);
    const bytes = await readFile(new URL(`../../public${image.src}`, import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
  }
  const own = { ...DEFAULT_ACTIVITIES[0], images: [{ src: '/images/x.webp', alt: 'A real photograph' }] };
  assert.deepEqual(activityImage(own), { src: '/images/x.webp', alt: 'A real photograph', illustrative: false });
});

test('every programme photograph of the foundation\'s own exists on disk as WebP, PNG or JPEG', async () => {
  for (const activity of DEFAULT_ACTIVITIES) {
    for (const own of activity.images) {
      const image = activityImage(activity)!;
      assert.equal(image.illustrative, false);
      const bytes = await readFile(new URL(`../../public${own.src}`, import.meta.url));
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      const png = bytes[0] === 0x89 && bytes.toString('ascii', 1, 4) === 'PNG';
      const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      assert.ok(webp || png || jpeg, `${own.src} is not a WebP, PNG or JPEG`);
    }
  }
});

test('explore links land on the page that owns the activity', () => {
  const by = (id: string) => exploreHref(DEFAULT_ACTIVITIES.find(a => a.id === id)!);
  assert.equal(by('project-amrit'), '/projects#project-amrit');
  assert.equal(by('oneness-vann'), '/projects#project-oneness-vann');
  assert.equal(by('watershed'), '/projects#watershed-programme');
  assert.equal(by('adopted-villages'), '/projects#adopted-villages');
  assert.equal(by('blood-donation'), '/core-values#blood-donation');
});

test('every programme opens onto its own tile picture first, then five or more distinct labelled photographs', () => {
  for (const activity of pictured) {
    const gallery = activityGallery(activity);
    assert.ok(gallery.length >= 5, `${activity.id} has only ${gallery.length} photographs`);
    assert.deepEqual(gallery[0], activityImage(activity));
    assert.equal(new Set(gallery.map(image => image.src)).size, gallery.length, `${activity.id} repeats a photograph`);
    for (const image of gallery) {
      if (image.illustrative) assert.match(image.alt, /^Illustrative photograph:/);
      else assert.ok(activity.images.some(own => own.src === image.src), `${image.src} is unlabelled but not the programme's own`);
    }
  }
  for (const activity of DEFAULT_ACTIVITIES.filter(a => a.images.length > 0)) {
    const gallery = activityGallery(activity);
    assert.equal(gallery[0].illustrative, false);
    assert.equal(gallery.filter(image => !image.illustrative).length, activity.images.length);
  }
});

test('the album turns: step 0 is the default, every step keeps the programmes of a pillar on different photographs, genuine ones stay', () => {
  for (const pillar of ['heal', 'enrich', 'empower', 'projects']) {
    const group = DEFAULT_ACTIVITIES.filter(a => a.pillarId === pillar);
    for (const activity of group) assert.equal(activityImageAt(activity, 0)?.src, activityImage(activity)?.src);
    for (let step = 1; step < 12; step++) {
      const shown = group.map(a => activityImageAt(a, step)?.src);
      assert.equal(new Set(shown).size, shown.length, `${pillar} step ${step} repeats a photograph`);
    }
  }
  for (const activity of DEFAULT_ACTIVITIES.filter(a => a.images.length > 0)) {
    for (let step = 0; step < 6; step++) assert.equal(activityImageAt(activity, step)?.illustrative, false, `${activity.id} rotated its own photograph away`);
  }
});
