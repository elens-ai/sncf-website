import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Pause, Play } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { MediaItem } from '../data/media';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './photo-carousel.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.PhotoCarousel.${key}`, fallback);

/** Seconds each photograph stays in view while the carousel plays. */
const SECONDS = 5;

/** The shortest way round the ring from the photograph in view to photograph i. */
const offsetOf = (i: number, at: number, n: number) => {
  let d = (i - at) % n;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
};

/** A GALLERY AS A CAROUSEL: one photograph large in the middle, its
    neighbours turning away at either side, a filmstrip of every photograph
    beneath. It plays on its own (the line under the photograph is its
    clock), and stops while a pointer or the keyboard is in it, while it is
    off screen, and under reduced motion; the arrows, a swipe, the arrow keys
    and the filmstrip all move it, and the photograph in the middle opens in
    the gallery's viewer. */
export const PhotoCarousel: React.FC<{ items: MediaItem[]; label: string; onOpen: (item: MediaItem, from: HTMLElement) => void }> = ({ items, label, onOpen }) => {
  const n = items.length;
  const slides = useId();
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const visible = useSectionActivity(root);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [held, setHeld] = useState(false);
  /* announced only when the visitor moves it, never on its own turns */
  const [told, setTold] = useState(false);
  const running = playing && !held && visible && n > 1;

  const go = (delta: number, by = true) => { setTold(by); setAt(current => (current + delta + n) % n); };
  const show = (index: number) => { setTold(true); setAt(index); };

  /* the filmstrip keeps the photograph in view in sight, sideways only */
  useEffect(() => {
    const el = strip.current;
    const thumb = el?.children[at] as HTMLElement | undefined;
    if (!el || !thumb) return;
    const left = thumb.offsetLeft - (el.clientWidth - thumb.clientWidth) / 2;
    el.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [at]);

  if (!n) return null;
  const current = items[at];
  const keys = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta || n < 2) return;
    event.preventDefault();
    go(delta);
    /* a key pressed on the filmstrip carries focus to the photograph it chose */
    if ((event.target as HTMLElement).closest('.pcar-strip')) {
      requestAnimationFrame(() => (strip.current?.children[(at + delta + n) % n] as HTMLElement | undefined)?.focus());
    }
  };

  return (
    <div ref={root} className="pcar" role="region" aria-roledescription={c('carousel', 'carousel')} aria-label={label}
      data-running={running} onKeyDown={keys}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHeld(true); }} onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false); }}>
      <div className="pcar-stage"
        onPointerDown={event => { if (event.isPrimary && event.button === 0) drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false }; }}
        onPointerMove={event => { const start = drag.current; if (start && start.id === event.pointerId && Math.abs(event.clientX - start.x) > 8) start.moved = true; }}
        onPointerUp={event => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          if (n > 1 && Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
          window.setTimeout(() => { drag.current = null; }, 0);
        }}
        onPointerCancel={() => { drag.current = null; }}>
        <div className="pcar-slides" id={slides} aria-live={running || !told ? 'off' : 'polite'}>
          {items.map((item, i) => {
            const offset = offsetOf(i, at, n);
            if (Math.abs(offset) > 2) return null;
            const centre = offset === 0;
            return (
              <div key={item.id} className="pcar-slide" data-offset={offset}
                role={centre ? 'group' : undefined} aria-roledescription={centre ? c('slide', 'slide') : undefined}
                aria-label={centre ? `${at + 1} ${c('of', 'of')} ${n}` : undefined} aria-hidden={centre ? undefined : true}
                onClick={centre ? undefined : () => { if (!drag.current?.moved) show(i); }}>
                {centre ? (
                  <button type="button" className="pcar-open" aria-label={`${c('open', 'Open')}: ${item.caption}`}
                    onClick={event => { if (!drag.current?.moved) onOpen(item, event.currentTarget); }}>
                    <img src={resolveCMSMedia(item.src ?? '')} alt={item.alt} decoding="async" draggable={false} />
                    <span className="pcar-expand" aria-hidden="true"><Expand size={16} strokeWidth={1.8} /></span>
                    <span className="pcar-words">
                      <span className="pcar-caption">{item.caption}</span>
                      {item.alt && <span className="pcar-alt">{item.alt}</span>}
                    </span>
                  </button>
                ) : <img src={resolveCMSMedia(item.src ?? '')} alt="" loading="lazy" decoding="async" draggable={false} />}
              </div>
            );
          })}
        </div>
        {n > 1 && <>
          <button type="button" className="pcar-arrow pcar-prev" aria-controls={slides} aria-label={c('previous', 'Previous photograph')} onClick={() => go(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
          <button type="button" className="pcar-arrow pcar-next" aria-controls={slides} aria-label={c('next', 'Next photograph')} onClick={() => go(1)}><ChevronRight size={20} aria-hidden="true" /></button>
        </>}
      </div>

      {n > 1 && (
        <div className="pcar-bar">
          <span className="pcar-count" aria-hidden="true"><strong>{String(at + 1).padStart(2, '0')}</strong> / {String(n).padStart(2, '0')}</span>
          {/* the clock: the line fills while the photograph is in view, then the next one comes */}
          <span className="pcar-clock" aria-hidden="true">
            {playing && <i key={`${current.id}-${at}`} style={{ animationDuration: `${SECONDS}s` }} onAnimationEnd={() => go(1, false)} />}
          </span>
          <button type="button" className="pcar-play" aria-pressed={!playing} onClick={() => setPlaying(on => !on)}
            aria-label={playing ? c('pause', 'Pause the slideshow') : c('play', 'Play the slideshow')}>
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
        </div>
      )}

      {n > 1 && (
        <div ref={strip} className="pcar-strip" role="group" aria-label={c('choose', 'Choose a photograph')}>
          {items.map((item, i) => (
            <button key={item.id} type="button" className="pcar-thumb" aria-current={i === at || undefined}
              aria-label={`${i + 1} ${c('of', 'of')} ${n}: ${item.caption}`} onClick={() => show(i)}>
              <img src={resolveCMSMedia(item.src ?? '')} alt="" loading="lazy" decoding="async" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
