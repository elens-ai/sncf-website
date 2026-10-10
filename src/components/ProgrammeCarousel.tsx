import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeReport.${key}`, fallback);

type Photo = { src: string; alt: string };
type Symbol = React.ComponentType<{ size?: number; strokeWidth?: number }>;
/* TEMPORARY: the developer photo tool, loaded only under `npm run dev` (scripts/dev-photo-tool.ts); never in a build */
const DevPhotoTool = import.meta.env.DEV ? React.lazy(() => import('./DevPhotoTool')) : null;

const TURN_EVERY_MS = 4200;

/** A PROGRAMME'S PHOTOGRAPHS as a carousel: the one in view large with its caption, its neighbours small at either
    side, a strip of thumbnails beneath. Shared by a programme's report and by each part of the Nirankari Vocational
    Centre. `badge` is the second chip over the photograph (a period, or a part's place in its family); `paused`
    holds a carousel that is out of sight (an NVC tab not chosen) still. */
export function ProgrammeCarousel({ id, label, photos, kicker, badge, symbol: Symbol, paused = false }: {
  id: string; label: string; photos: Photo[]; kicker: string; badge?: React.ReactNode; symbol?: Symbol; paused?: boolean;
}) {
  const [shot, setShot] = useState(0);
  useEffect(() => setShot(0), [id]);
  /* THE THUMBNAIL STRIP pages with arrows (hidden at either end) and keeps the photograph in view in sight */
  const strip = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: true });
  const measureStrip = () => {
    const el = strip.current;
    if (el) setEnds({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };
  useEffect(() => {
    measureStrip();
    const el = strip.current;
    if (!el) return;
    const resize = new ResizeObserver(measureStrip);
    resize.observe(el);
    return () => resize.disconnect();
  }, [photos.length]);
  useEffect(() => {
    const el = strip.current;
    const thumb = el?.children[shot] as HTMLElement | undefined;
    if (!el || !thumb) return;
    el.scrollTo({ left: thumb.offsetLeft - (el.clientWidth - thumb.clientWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [shot]);
  const pageStrip = (direction: number) => strip.current?.scrollBy({ left: direction * strip.current.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  /* a photograph taken out of the carousel (developer photo tool) never leaves it pointing past its end */
  useEffect(() => { if (photos.length && shot >= photos.length) setShot(photos.length - 1); }, [photos.length, shot]);

  /* The photographs turn by themselves, a few seconds each, while the stage is on screen and nobody is pointing at
     it or working its controls; never where motion is unwelcome. */
  const stage = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: .4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !onScreen || held || photos.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setShot(s => (s + 1) % photos.length), TURN_EVERY_MS);
    return () => window.clearTimeout(timer);
  }, [paused, onScreen, held, shot, photos.length]);
  const turn = (step: number) => setShot(s => (s + step + photos.length) % photos.length);
  /* each photograph's place: the one in view at the centre, its neighbours small at either side, the rest out of sight */
  const place = (i: number) => {
    let d = (i - shot) % photos.length;
    if (d > photos.length / 2) d -= photos.length;
    if (d < -photos.length / 2) d += photos.length;
    return d === 0 ? 'centre' : d === -1 ? 'left' : d === 1 ? 'right' : d < 0 ? 'gone-left' : 'gone-right';
  };

  return (
    <div className="preport-media" data-empty={!photos.length}>
      {/* the carousel holds still while the developer photo tool is in use */}
      {DevPhotoTool && <div className="dev-photo-anchor" style={{ position: 'relative', height: 0 }} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}><React.Suspense fallback={null}><DevPhotoTool id={id} label={label} photos={photos} current={photos[shot]} onShow={setShot} /></React.Suspense></div>}
      <div ref={stage} className="preport-stage" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)} onBlur={() => setHeld(false)} aria-roledescription="carousel" aria-label={c('photos', 'Photographs of the programme')}>
        {photos.length
          ? photos.map((p, i) => {
            const where = place(i);
            const side = where === 'left' || where === 'right';
            return <figure key={p.src} className="preport-card" data-place={where} aria-hidden={where !== 'centre'} onClick={side ? () => setShot(i) : undefined}>
              <img src={resolveCMSMedia(p.src)} alt={where === 'centre' ? p.alt : ''} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
            </figure>;
          })
          : <span className="preport-symbol-large" aria-hidden="true">{Symbol && <Symbol size={72} strokeWidth={1.1} />}</span>}
        <div className="preport-lead-top">
          <span>{kicker}</span>
          {badge && <span>{badge}</span>}
        </div>
        {photos.length > 0 && <div className="preport-stage-foot">
          <div className="preport-captions">
            {photos.map((photo, index) => <p className="preport-caption" key={photo.src}
              data-active={index === shot} aria-hidden={index !== shot}>{photo.alt}</p>)}
          </div>
          {photos.length > 1 && <div className="preport-stage-turns">
            <button type="button" onClick={() => turn(-1)} aria-label={c('previous', 'Previous photograph')}><ChevronLeft size={17} aria-hidden="true" /></button>
            <span aria-live="polite">{shot + 1} / {photos.length}</span>
            <button type="button" onClick={() => turn(1)} aria-label={c('next', 'Next photograph')}><ChevronRight size={17} aria-hidden="true" /></button>
          </div>}
        </div>}
      </div>
      {photos.length > 1 && (
        <div className="preport-thumbs-wrap" data-start={ends.start} data-end={ends.end}>
        <button type="button" className="preport-thumbs-nav" data-side="start" onClick={() => pageStrip(-1)} disabled={ends.start} aria-label={c('thumbsBack', 'Show earlier photographs')}><ChevronLeft size={16} aria-hidden="true" /></button>
        <ul ref={strip} className="preport-thumbs" onScroll={measureStrip} aria-label={c('photos', 'Photographs of the programme')}>
          {photos.map((p, i) => <li key={p.src}>
            <button type="button" aria-pressed={i === shot} aria-label={`${c('photo', 'Photograph')} ${i + 1} ${c('of', 'of')} ${photos.length}: ${p.alt}`} onClick={() => setShot(i)}>
              <img src={resolveCMSMedia(p.src)} alt="" loading="lazy" decoding="async" />
            </button>
          </li>)}
        </ul>
        <button type="button" className="preport-thumbs-nav" data-side="end" onClick={() => pageStrip(1)} disabled={ends.end} aria-label={c('thumbsMore', 'Show more photographs')}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
