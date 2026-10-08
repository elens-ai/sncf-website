import React, { useEffect, useState } from 'react';
import { resolveCMSMedia } from '../cms/media';

const PHOTO_MS = 180;
const PHOTO_ENTER_MS = 600;
const REVEAL_MS = 700;

/** A brief opening montage, then the existing wave background takes over. */
export function ProjectPhotoIntro({ photos, active, reduced }: {
  photos: string[]; active: boolean; reduced: boolean;
}) {
  const sources = JSON.stringify([...new Set(photos)].slice(0, 15));
  const [loaded, setLoaded] = useState<string[]>([]);
  const [frame, setFrame] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (reduced || complete) return;
    let cancelled = false, finished = false;
    const urls: string[] = JSON.parse(sources);
    const ready = new Set<string>();
    const images = urls.map(source => {
      const image = new Image();
      image.decoding = 'async';
      return { source, image };
    });
    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      const available = urls.filter(source => ready.has(source));
      setLoaded(available);
      if (!available.length) setComplete(true);
    };
    // A missing or slow photograph must never hold the page's entrance open.
    const deadline = window.setTimeout(finish, 1800);
    let settled = 0;
    for (const { source, image } of images) {
      const done = () => {
        if (++settled === images.length) { clearTimeout(deadline); finish(); }
      };
      image.onload = () => { ready.add(source); done(); };
      image.onerror = done;
      image.src = resolveCMSMedia(source);
    }
    return () => {
      cancelled = true;
      clearTimeout(deadline);
      for (const { image } of images) { image.onload = null; image.onerror = null; }
    };
  }, [sources, reduced, complete]);

  const revealing = loaded.length > 0 && frame >= loaded.length;
  useEffect(() => {
    if (!active || reduced || complete || !loaded.length) return;
    const timer = window.setTimeout(() => {
      if (revealing) setComplete(true);
      else setFrame(value => value + 1);
    }, revealing ? REVEAL_MS : frame === loaded.length - 1 ? PHOTO_ENTER_MS + 100 : PHOTO_MS);
    return () => clearTimeout(timer);
  }, [active, reduced, complete, loaded, frame, revealing]);

  if (reduced || complete) return null;
  // Overlap arrivals, keeping at most four composited photographs alive.
  const current = Math.min(frame, loaded.length - 1);
  const directions = ['top', 'right', 'bottom', 'left'];
  return <div className="projects-photo-intro" data-phase={revealing ? 'reveal' : loaded.length ? 'photos' : 'loading'} data-frame={frame} data-active={active} aria-hidden="true">
    {loaded.slice(Math.max(0, current - 3), current + 1).map(source => {
      const index = loaded.indexOf(source);
      return <img key={source} src={resolveCMSMedia(source)} alt="" draggable={false}
        data-from={directions[index % directions.length]} style={{ '--photo-enter': `${PHOTO_ENTER_MS}ms` } as React.CSSProperties} />;
    })}
    <div className="projects-photo-intro-shade" />
  </div>;
}
