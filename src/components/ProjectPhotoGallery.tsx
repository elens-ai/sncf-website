import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './programme-report.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProjectPhotoGallery.${key}`, fallback);

/** Core Values' photographic stage, enlarged for the project chapters. */
export function ProjectPhotoGallery({ photos, title, period }: {
  photos: { src: string; alt: string }[]; title: string; period: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const visible = useSectionActivity(root);
  const reduced = useReducedMotion();
  const [shot, setShot] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [announced, setAnnounced] = useState(false);
  const current = shot % photos.length;
  const running = visible && !reduced && !paused && !held && photos.length > 1;
  const choose = (index: number) => { setAnnounced(true); setShot((index + photos.length) % photos.length); };

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => { setAnnounced(false); setShot(value => (value + 1) % photos.length); }, 4200);
    return () => clearTimeout(timer);
  }, [running, shot, photos.length]);

  useEffect(() => {
    const list = strip.current;
    const thumb = list?.children[current] as HTMLElement | undefined;
    if (list && thumb) list.scrollTo({ left: thumb.offsetLeft - list.offsetLeft - (list.clientWidth - thumb.clientWidth) / 2, behavior: reduced ? 'instant' : 'smooth' });
  }, [current, reduced]);

  return <div ref={root} className="project-photo-gallery preport-media" data-visible={visible} role="region" aria-roledescription={c('carousel', 'carousel')} aria-label={`${title}: ${c('photos', 'Photographs')}`}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHeld(true); }} onPointerLeave={() => setHeld(false)}
    onFocus={() => setHeld(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false); }}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); choose(current + (event.key === 'ArrowRight' ? 1 : -1)); }
    }}>
    <div className="preport-stage"
      onPointerDown={event => {
        swiped.current = false;
        if (event.pointerType === 'mouse' || !event.isPrimary || (event.target as HTMLElement).closest('button, a')) return;
        gesture.current = { x: event.clientX, y: event.clientY };
        setHeld(true);
      }}
      onPointerUp={event => {
        const start = gesture.current;
        gesture.current = null;
        if (!start) return;
        setHeld(false);
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        // Leave vertical gestures to native scrolling and ignore small taps.
        if (photos.length > 1 && Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          swiped.current = true;
          choose(current + (dx < 0 ? 1 : -1));
        }
      }}
      onPointerCancel={() => { gesture.current = null; setHeld(false); }}
      onClickCapture={event => { if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; } }}>
      {photos.map((photo, index) => {
        let distance = (index - current + photos.length) % photos.length;
        if (distance > photos.length / 2) distance -= photos.length;
        const place = distance === 0 ? 'centre' : distance === -1 ? 'left' : distance === 1 ? 'right' : distance < 0 ? 'gone-left' : 'gone-right';
        return <figure className="preport-card" key={photo.src} data-place={place} aria-hidden={index !== current} onClick={Math.abs(distance) === 1 ? () => choose(index) : undefined}>
          <img src={resolveCMSMedia(photo.src)} alt={index === current ? photo.alt : ''} loading="lazy" decoding="async" draggable={false} />
        </figure>;
      })}
      <div className="preport-lead-top"><span>{title}</span><span><CalendarDays size={13} aria-hidden="true" />{period}</span></div>
      <div className="preport-stage-foot">
        <p className="preport-caption" key={current}>{photos[current]?.alt}</p>
        {photos.length > 1 && <div className="preport-stage-turns">
          <button type="button" onClick={() => choose(current - 1)} aria-label={c('previous', 'Previous photograph')}><ChevronLeft size={19} /></button>
          <span aria-live={announced ? 'polite' : 'off'}>{current + 1} / {photos.length}</span>
          <button type="button" onClick={() => choose(current + 1)} aria-label={c('next', 'Next photograph')}><ChevronRight size={19} /></button>
          {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? c('play', 'Play slideshow') : c('pause', 'Pause slideshow')}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
        </div>}
      </div>
    </div>
    {photos.length > 1 && <ul ref={strip} className="preport-thumbs" aria-label={c('choose', 'Choose a photograph')}>
      {photos.map((photo, index) => <li key={photo.src}><button type="button" aria-pressed={index === current} aria-label={`${index + 1} / ${photos.length}: ${photo.alt}`} onClick={() => choose(index)}><img src={resolveCMSMedia(photo.src)} alt="" loading="lazy" decoding="async" /></button></li>)}
    </ul>}
  </div>;
}
