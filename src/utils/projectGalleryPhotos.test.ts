import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { collectProjectPhotos, projectGalleryPhotos } from './projectGalleryPhotos';
import { arrangePhotos } from './photoArrangement';

/* a gallery's own photographs, without any added with the developer photo tool (src/data/addedPhotos.json) */
const own = (photos: { src: string; alt: string }[]) => photos.filter(photo => !photo.src.startsWith('/images/added/'));

test('Watershed has a working gallery even with the old empty CMS photo slots', () => {
  const photos = collectProjectPhotos({ id: 'watershed', images: [] }, [
    { id: 'ws-check', kind: 'photo', src: null, alt: '', caption: 'Awaiting photo' },
  ]);
  assert.equal(own(photos).length, 3);
  for (const photo of projectGalleryPhotos({ id: 'watershed', images: [] }, [])) assert.ok(existsSync(new URL(`../../public${photo.src}`, import.meta.url)), photo.src);
});

test('published Watershed photos take precedence over the film stills', () => {
  const photo = { src: '/images/new-watershed.jpg', alt: 'A new project photograph' };
  assert.deepEqual(own(collectProjectPhotos({ id: 'watershed', images: [photo] }, [])), [photo]);
});

test('Oneness Vann excludes the removed photo from either source and deduplicates the remaining gallery', () => {
  const retained = { src: '/images/programmes/oneness-vann-group.webp', alt: 'Planting in Solapur' };
  const removed = { src: '/images/mataji-rajpita-planting.webp', alt: 'A sapling being planted' };
  assert.deepEqual(own(collectProjectPhotos({ id: 'oneness-vann', images: [retained, removed] }, [
    { id: 'vann-forest', kind: 'photo', ...retained, caption: retained.alt },
    { id: 'vann-planting', kind: 'photo', ...removed, caption: removed.alt },
  ])), [retained]);
});

test('added photographs follow a gallery’s own, the Watershed film stills kept', () => {
  for (const id of ['watershed', 'oneness-vann', 'project-amrit', 'adopted-villages']) {
    const photos = collectProjectPhotos({ id, images: [] }, []);
    const firstAdded = photos.findIndex(photo => photo.src.startsWith('/images/added/'));
    if (firstAdded < 0) continue;
    assert.ok(photos.slice(firstAdded).every(photo => photo.src.startsWith('/images/added/')), id);
    if (id === 'watershed') assert.equal(firstAdded, 3);
  }
});

test('a gallery shows its photographs as arranged: hidden ones out, the saved order first, the rest after', () => {
  const photos = ['a', 'b', 'c', 'd'].map(name => ({ src: `/${name}.webp`, alt: name }));
  assert.deepEqual(arrangePhotos('x', photos, ['/b.webp'], ['/d.webp', '/a.webp']).map(photo => photo.alt), ['d', 'a', 'c']);
  assert.deepEqual(arrangePhotos('x', photos, [], []), photos);
});
