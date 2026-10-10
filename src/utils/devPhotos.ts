import { useEffect, useReducer } from 'react';
import { arrangePhotos } from './photoArrangement';

/* TEMPORARY, development only (scripts/dev-photo-tool.ts): the photographs added, hidden and
   chosen to lead with the developer photo tool, as the dev server holds them right now — so a
   carousel open on the page follows each change at once rather than on the next reload. In a
   build `import.meta.env.DEV` is false and this does nothing. */
type Photo = { src: string; alt: string };
export interface DevPhotoState { added: Record<string, Photo[]>; hidden: Record<string, string[]>; order: Record<string, string[]> }

let latest: DevPhotoState | null = null;
const listeners = new Set<() => void>();

export async function refreshDevPhotos() {
  if (!import.meta.env.DEV) return;
  try {
    latest = await fetch('/__dev/photos').then(response => response.json());
    listeners.forEach(listener => listener());
  } catch { /* the tool is optional; the carousels keep what they had */ }
}

function useDevState() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, []);
  return import.meta.env.DEV ? latest : null;
}

/** A carousel's photographs with the tool's current additions, hidings and order in place of those read at load. */
export function useDevPhotos(id: string, photos: Photo[]): Photo[] {
  const state = useDevState();
  if (!state) return photos;
  const added = state.added[id] ?? [];
  const kept = photos.filter(photo => !photo.src.startsWith('/images/added/'));
  return arrangePhotos(id, [...kept, ...added.filter(photo => !kept.some(other => other.src === photo.src))], state.hidden[id] ?? [], state.order[id] ?? []);
}

/** The tool's own view of one carousel: what it added and what it hid. */
export function useDevToolState(id: string, initial: { added: Photo[]; hidden: string[] }) {
  const state = useDevState();
  return state ? { added: state.added[id] ?? [], hidden: state.hidden[id] ?? [] } : initial;
}
