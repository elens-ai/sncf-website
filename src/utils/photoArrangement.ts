import HIDDEN from '../data/hiddenPhotos.json';
import ORDER from '../data/photoOrder.json';

type Photo = { src: string; alt: string };

/** A carousel's photographs as arranged with the developer photo tool (scripts/dev-photo-tool.ts):
    those hidden from it left out, the rest in the order saved for it, and any not in that order
    (added since) after them in their own order. With nothing hidden or ordered, the photographs are
    returned as they are. */
export function arrangePhotos<T extends Photo>(
  id: string,
  photos: T[],
  hidden: string[] = (HIDDEN as Record<string, string[]>)[id] ?? [],
  order: string[] = (ORDER as Record<string, string[]>)[id] ?? [],
): T[] {
  const shown = hidden.length ? photos.filter(photo => !hidden.includes(photo.src)) : photos;
  if (!order.length) return shown;
  const first = order.map(src => shown.find(photo => photo.src === src)).filter((photo): photo is T => Boolean(photo));
  return [...first, ...shown.filter(photo => !order.includes(photo.src))];
}
