import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { projectGalleryPhotos } from './projectGalleryPhotos';

test('Watershed has a working gallery even with the old empty CMS photo slots', () => {
  const photos = projectGalleryPhotos({ id: 'watershed', images: [] }, [
    { id: 'ws-check', kind: 'photo', src: null, alt: '', caption: 'Awaiting photo' },
  ]);
  assert.equal(photos.length, 3);
  for (const photo of photos) assert.ok(existsSync(new URL(`../../public${photo.src}`, import.meta.url)));
});

test('published Watershed photos take precedence over the film stills', () => {
  const photo = { src: '/images/new-watershed.jpg', alt: 'A new project photograph' };
  assert.deepEqual(projectGalleryPhotos({ id: 'watershed', images: [photo] }, []), [photo]);
});

test('Oneness Vann excludes the removed photo from either source and deduplicates the remaining gallery', () => {
  const retained = { src: '/images/programmes/oneness-vann-group.webp', alt: 'Planting in Solapur' };
  const removed = { src: '/images/mataji-rajpita-planting.webp', alt: 'A sapling being planted' };
  assert.deepEqual(projectGalleryPhotos({ id: 'oneness-vann', images: [retained, removed] }, [
    { id: 'vann-forest', kind: 'photo', ...retained, caption: retained.alt },
    { id: 'vann-planting', kind: 'photo', ...removed, caption: removed.alt },
  ]), [retained]);
});
