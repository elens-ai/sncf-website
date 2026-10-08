import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { resolveCMSMedia } from '../cms/media';
import { getFoundationStories, markStoryFrameSeen } from '../data/stories';
import './foundation-stories.css';

const STORY_MS = 6500;

export function FoundationStories({ onClose, logo }: { onClose: () => void; logo: string }) {
  const revision = useCMSRevision();
  const allStories = useMemo(getFoundationStories, [revision]);
  const [expanded, setExpanded] = useState(false);
  const stories = useMemo(() => expanded ? allStories : allStories.slice(0, 3), [allStories, expanded]);
  const dialog = useRef<HTMLDialogElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);
  const gesture = useRef<{ x: number; time: number } | null>(null);
  const [at, setAt] = useState(0);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const story = stories[at % Math.max(1, stories.length)];
  const photo = story?.photos[frame % story.photos.length];
  const close = useRef(onClose);
  close.current = onClose;
  const next = () => {
    if (!story) return;
    if (frame + 1 < story.photos.length) setFrame(frame + 1);
    else { setAt((at + 1) % stories.length); setFrame(0); }
  };
  const previous = () => {
    if (frame > 0) setFrame(frame - 1);
    else { const prev = (at - 1 + stories.length) % stories.length; setAt(prev); setFrame(stories[prev].photos.length - 1); }
  };
  const advance = useRef(next);
  advance.current = next;

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      modal.close();
      document.body.style.overflow = overflow;
      document.removeEventListener('visibilitychange', visibility);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    elapsed.current = 0;
    if (progress.current) progress.current.style.transform = 'scaleX(0)';
    setReady(false); setFailed(false); setHeld(false);
  }, [story?.id, frame]);

  useEffect(() => {
    if (!story || !ready || !visible) return;
    const timer = window.setTimeout(() => markStoryFrameSeen(story, frame), 900);
    return () => window.clearTimeout(timer);
  }, [story, frame, ready, visible]);

  useEffect(() => {
    if (paused || held || !visible || !ready) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 100);
      last = now;
      if (progress.current) progress.current.style.transform = `scaleX(${Math.min(1, elapsed.current / STORY_MS)})`;
      if (elapsed.current >= STORY_MS) advance.current();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, held, visible, ready, story?.id, frame]);

  return createPortal(<dialog ref={dialog} className="foundation-stories" aria-modal="true" aria-labelledby="foundation-stories-title"
    onCancel={event => { event.preventDefault(); close.current(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
      if (event.key === ' ' && event.target === event.currentTarget) { event.preventDefault(); setPaused(value => !value); }
    }} onClick={event => { if (event.target === event.currentTarget) close.current(); }}>
    <div className="foundation-stories-shell">
      <header className="foundation-stories-header">
        <div className="foundation-stories-brand"><img src={logo} alt="" /><div><span>SNCF</span><h2 id="foundation-stories-title">Stories of service<span>.</span></h2></div></div>
        <button autoFocus type="button" className="stories-icon-button" onClick={onClose} aria-label="Close stories"><X size={24} /></button>
      </header>
      {story && photo ? <div className="foundation-stories-layout">
        <aside className="stories-library" aria-label="Browse stories">
          <div className="stories-library-heading"><span>FROM OUR LATEST REPORT</span><p>Small moments.<br /><em>Lasting change.</em></p><small>{expanded ? `${stories.length} stories from across the foundation` : 'The latest 3 updates'}</small></div>
          <div className="stories-library-list">{stories.map((item, index) => <button type="button" key={item.id} className="stories-library-item" aria-current={at === index ? 'true' : undefined} onClick={() => { setAt(index); setFrame(0); }} style={{ '--story-ink': item.ink } as React.CSSProperties}>
            <span className="stories-avatar"><img src={resolveCMSMedia(item.photos[0].src)} alt="" loading="lazy" /></span><span><strong>{item.title}</strong><small>{item.pillar}</small></span><ChevronRight size={15} />
          </button>)}{!expanded && allStories.length > 3 && <button type="button" className="stories-view-more" onClick={() => setExpanded(true)}>View more <span>{allStories.length - 3} more stories</span><ChevronRight size={16} /></button>}</div>
        </aside>
        <section className="stories-stage" aria-label="Story viewer">
          <div className="stories-card" style={{ '--story-ink': story.ink } as React.CSSProperties}
            onPointerDown={event => { if (!(event.target as Element).closest('button, a')) { gesture.current = { x: event.clientX, time: performance.now() }; event.currentTarget.setPointerCapture(event.pointerId); setHeld(true); } }}
            onPointerUp={event => {
              const start = gesture.current;
              gesture.current = null; setHeld(false);
              if (!start) return;
              const distance = event.clientX - start.x;
              if (Math.abs(distance) > 45) { if (distance < 0) next(); else previous(); }
              else if (performance.now() - start.time < 250) {
                const box = event.currentTarget.getBoundingClientRect();
                if (event.clientX - box.left < box.width * .35) previous(); else next();
              }
            }} onPointerCancel={() => { gesture.current = null; setHeld(false); }} onLostPointerCapture={() => setHeld(false)}>
            {!failed && <img key={`${story.id}-${frame}`} className="stories-photo" src={resolveCMSMedia(photo.src)} alt={photo.alt}
              onLoad={() => setReady(true)} onError={() => { setFailed(true); setReady(true); }} />}
            <div className="stories-card-shade" />
            <div className="stories-card-top">
              <div className="stories-progress" aria-label={`Photo ${frame + 1} of ${story.photos.length}`}>
                {story.photos.map((_, index) => <span key={index}><span ref={index === frame ? progress : undefined} style={{ transform: `scaleX(${index < frame ? 1 : 0})` }} /></span>)}
              </div>
              <div className="stories-byline"><img src={logo} alt="" /><div><strong>Sant Nirankari Charitable Foundation</strong><small>{story.pillar} · {story.period}</small></div><button type="button" className="stories-icon-button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play stories' : 'Pause stories'}>{paused ? <Play size={19} /> : <Pause size={19} />}</button></div>
            </div>
            <div className="stories-caption" key={story.id}>
              <span className="stories-pillar">{story.pillar}</span><h3>{story.title}</h3>
              <p>{frame === 0 ? story.description : photo.alt}</p>
              {frame === 0 && <div className="stories-figure"><strong>{story.figure.value}</strong><span>{story.figure.label}</span></div>}
              <Link className="stories-explore" to={story.href} onClick={onClose}>Explore the story <ArrowUpRight size={17} /></Link>
            </div>
          </div>
          <div className="stories-controls"><button className="stories-icon-button" type="button" onClick={previous} aria-label="Previous story photo"><ChevronLeft size={22} /></button><span>{String(at + 1).padStart(2, '0')} <i>/</i> {String(stories.length).padStart(2, '0')}<small>Hold a photo to pause</small></span><button className="stories-icon-button" type="button" onClick={next} aria-label="Next story photo"><ChevronRight size={22} /></button></div>
        </section>
        <div className="stories-next" aria-hidden="true"><span>UP NEXT</span><img src={resolveCMSMedia(stories[(at + 1) % stories.length].photos[0].src)} alt="" /><p>{stories[(at + 1) % stories.length].title}</p><small>Service with Humility</small></div>
      </div> : <p className="stories-empty">Stories will appear here when programme photographs are available.</p>}
    </div>
  </dialog>, document.body);
}
