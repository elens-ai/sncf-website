import type { Activity } from '../data/activities';
import type { MediaItem } from '../data/media';
import { WATERSHED_PHOTOS } from '../data/watershedPhotos';
import ADDED from '../data/addedPhotos.json';
import { arrangePhotos } from './photoArrangement';

/** A project's photographs before any arranging: its own (the Watershed film stills when it has none), then any added
    with the developer photo tool. */
export function collectProjectPhotos(project: Pick<Activity, 'id' | 'images'>, media: MediaItem[]) {
  const seen = new Set<string>();
  const keep = (photo: { src: string }) => {
    if (photo.src.includes('volunteers-planning')) return false;
    // Older CMS publications still contain the photo removed from this gallery.
    if (project.id === 'oneness-vann' && photo.src.includes('mataji-rajpita-planting.webp')) return false;
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  };
  const photos = [
    ...project.images,
    ...media.filter(item => item.kind === 'photo' && item.src).map(item => ({ src: item.src!, alt: item.alt || item.caption })),
  ].filter(keep);
  /* any added with the developer photo tool (scripts/dev-photo-tool.ts) follow */
  const added = ((ADDED as Record<string, { src: string; alt: string }[]>)[project.id] ?? []).filter(keep);
  // The older Watershed CMS gallery consists of empty awaiting-photo slots.
  return [...(photos.length || project.id !== 'watershed' ? photos : WATERSHED_PHOTOS), ...added];
}

/** A project's gallery as it shows: its photographs, as arranged with the developer photo tool (hidden ones left out,
    the saved order kept). */
export function projectGalleryPhotos(project: Pick<Activity, 'id' | 'images'>, media: MediaItem[]) {
  return arrangePhotos(project.id, collectProjectPhotos(project, media));
}
