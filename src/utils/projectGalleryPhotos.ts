import type { Activity } from '../data/activities';
import type { MediaItem } from '../data/media';
import { WATERSHED_PHOTOS } from '../data/watershedPhotos';

export function projectGalleryPhotos(project: Pick<Activity, 'id' | 'images'>, media: MediaItem[]) {
  const seen = new Set<string>();
  const photos = [
    ...project.images,
    ...media.filter(item => item.kind === 'photo' && item.src).map(item => ({ src: item.src!, alt: item.alt || item.caption })),
  ].filter(photo => {
    if (photo.src.includes('volunteers-planning')) return false;
    // Older CMS publications still contain the photo removed from this gallery.
    if (project.id === 'oneness-vann' && photo.src.includes('mataji-rajpita-planting.webp')) return false;
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
  // The older Watershed CMS gallery consists of empty awaiting-photo slots.
  return photos.length || project.id !== 'watershed' ? photos : WATERSHED_PHOTOS;
}
