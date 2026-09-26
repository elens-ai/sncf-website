import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_ACTIVITIES } from './activities';
import { DEFAULT_PAVILION_GALLERY } from './pavilionGallery';
import { DEFAULT_ACTIVITY_IMAGERY, activityImage, activityGallery, exploreHref } from './activityImagery';

test('every reported activity borrows a photograph from its own pillar, and no two share one', () => {
  const photos = DEFAULT_PAVILION_GALLERY.flat();
  const used = new Map<string, string>();
  for (const activity of DEFAULT_ACTIVITIES) {
    const wanted = DEFAULT_ACTIVITY_IMAGERY[activity.id];
    assert.ok(wanted, `${activity.id} has no photograph`);
    assert.ok(photos.some(p => p.id === wanted), `${wanted} is not a pavilion photograph`);
    assert.ok(wanted.startsWith(`${activity.pillarId}-gallery-`), `${activity.id} borrows from another pillar`);
    assert.equal(used.get(wanted), undefined, `${wanted} is shared by ${used.get(wanted)} and ${activity.id}`);
    used.set(wanted, activity.id);
  }
});

test('illustrative tiles are labelled and backed by JPEG files; a supplied photograph wins unlabelled', async () => {
  for (const activity of DEFAULT_ACTIVITIES) {
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

test('the genuine tree plantation photograph exists on disk as WebP', async () => {
  const tree = DEFAULT_ACTIVITIES.find(a => a.id === 'tree-plantation')!;
  const image = activityImage(tree)!;
  assert.equal(image.illustrative, false);
  const bytes = await readFile(new URL(`../../public${image.src}`, import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
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
  for (const activity of DEFAULT_ACTIVITIES) {
    const gallery = activityGallery(activity);
    assert.ok(gallery.length >= 5, `${activity.id} has only ${gallery.length} photographs`);
    assert.deepEqual(gallery[0], activityImage(activity));
    assert.equal(new Set(gallery.map(image => image.src)).size, gallery.length, `${activity.id} repeats a photograph`);
    for (const image of gallery) {
      if (image.illustrative) assert.match(image.alt, /^Illustrative photograph:/);
      else assert.ok(activity.images.some(own => own.src === image.src), `${image.src} is unlabelled but not the programme's own`);
    }
  }
  const tree = activityGallery(DEFAULT_ACTIVITIES.find(a => a.id === 'tree-plantation')!);
  assert.equal(tree[0].illustrative, false);
  assert.equal(tree.filter(image => !image.illustrative).length, 1);
});
