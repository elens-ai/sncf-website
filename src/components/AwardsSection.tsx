import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Award as AwardIcon, Maximize2, Pause, Play } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { AWARDS, type Award, type RecognitionCategory } from '../data/awards';
import { groupRecognitions } from '../data/recognition';
import { AwardLightbox, type LightboxTarget } from './AwardLightbox';
import './recognition-partners.css';
import './recognition-archive.css';

const ARCHIVES: { category: RecognitionCategory; title: string }[] = [
  { category: 'tweets', get title() { return getCMSCopy("copy.RecognitionArchive.tweets.title", 'Tweets'); } },
  { category: 'awards', get title() { return getCMSCopy("copy.RecognitionArchive.awards.title", 'Awards & Certificates'); } },
  { category: 'press', get title() { return getCMSCopy("copy.RecognitionArchive.press.title", 'Press & Media'); } },
];
const LEADING = ['csr-summit-most-impactful-ngo-2024', 'queens-golden-jubilee-award-2015', 'nbtc-award-of-excellence-2016', 'unep-world-environment-day-2024'];
const priority = (item: Award) => { const i = LEADING.indexOf(item.id); return i < 0 ? LEADING.length : i; };

const RecognitionArchive: React.FC<{ archive: typeof ARCHIVES[number]; items: Award[]; navigation: React.ReactNode }> = ({ archive, items, navigation }) => {
  const root = useRef<HTMLElement>(null);
  const inView = useSectionActivity(root);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const prints = useMemo(() => items.flatMap(award => (award.photos ?? []).map((photo, index) => ({ award, photo, index, key: `${award.id}-${index}` }))), [items]);
  const active = prints.length ? selected % prints.length : 0;
  const current = prints[active];
  const step = useCallback((direction: number) => setSelected(i => prints.length ? (i + direction + prints.length) % prints.length : 0), [prints.length]);
  useEffect(() => {
    setSelected(0);
    setTarget(null);
  }, [archive.category]);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!inView || paused || held || reduced || target || prints.length < 2) return;
    const timer = window.setInterval(() => {
      const intro = root.current?.closest<HTMLElement>('[data-recognition-intro]');
      if (!intro || intro.dataset.galleryVisible === 'true') step(1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [archive.category, inView, paused, held, reduced, target, prints.length, step]);
  const close = useCallback(() => setTarget(null), []);
  const open = () => { if (current) setTarget({ award: current.award, photos: current.award.photos!, index: current.index }); };
  const title = archive.title;
  const visible = Array.from({ length: Math.min(5, prints.length) }, (_, offset) => ({ ...prints[(active + offset) % prints.length], offset, indexInArchive: (active + offset) % prints.length }));
  const years = items.map(item => parseInt(item.year, 10)).filter(Number.isFinite);

  return <section ref={root} className="recognition-archive" data-category={archive.category} aria-labelledby={`${archive.category}-archive-tab`}>
    <div className="archive-inner">
      <div className="archive-browse">
      <aside className="archive-sidebar">
        {navigation}
        <div className="archive-record-details">
          {current && <button type="button" className="archive-featured-record" onClick={open} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
            <span className="archive-featured-icon" aria-hidden="true"><AwardIcon size={23} strokeWidth={1.4} /></span>
            <span className="archive-featured-copy">
              <span className="archive-featured-label">{getCMSCopy('copy.RecognitionArchive.featured-label', 'From the archive')}</span>
              <strong>{current.award.title}</strong>
              <span>{current.award.awardedBy}{current.award.year ? ` · ${current.award.year}` : ''}</span>
            </span>
            <Maximize2 className="archive-featured-open" size={15} aria-hidden="true" />
          </button>}
          <div className="archive-catalogue"><span>{String(items.length).padStart(2, '0')} records</span>{years.length > 0 && <span>{Math.min(...years)} — {Math.max(...years)}</span>}</div>
        </div>
      </aside>
      <div className="archive-collection" id={`${archive.category}-archive-panel`} role="tabpanel" aria-labelledby={`${archive.category}-archive-tab`} tabIndex={0}>
      {current ? <div className="archive-exhibition" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false); }}>
        <div className="archive-desk" role="group" aria-label={`${title} — select a print to bring it forward`}>
          {visible.map(print => <button key={print.key} type="button" className="archive-print" data-slot={print.offset} aria-label={`${print.offset === 0 ? 'Enlarge' : 'Select'} ${print.award.title}`} aria-pressed={print.offset === 0}
            style={{ '--print-ratio': print.photo.width / print.photo.height } as React.CSSProperties}
            onClick={() => { if (print.offset === 0) open(); else setSelected(print.indexInArchive); }}>
            <img src={resolveCMSMedia(print.photo.src)} alt={print.photo.alt} width={print.photo.width} height={print.photo.height} loading="lazy" decoding="async" draggable={false} />
            <span className="archive-print-enlarge" aria-hidden="true"><Maximize2 size={15} /></span>
          </button>)}
        </div>
          <div className="archive-controls" role="group" aria-label={`${title} controls`}>
            <button type="button" aria-label={`Previous ${title} record`} disabled={prints.length < 2} onClick={() => step(-1)}><ArrowLeft size={18} /></button>
            <span aria-live="off">{String(active + 1).padStart(2, '0')} / {String(prints.length).padStart(2, '0')}</span>
            <button type="button" aria-label={`Next ${title} record`} disabled={prints.length < 2} onClick={() => step(1)}><ArrowRight size={18} /></button>
            {!reduced && prints.length > 1 && <button type="button" aria-label={`${paused ? 'Play' : 'Pause'} ${title} slideshow`} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
          </div>
      </div> : <p className="archive-empty">Records will appear here as they are added to the archive.</p>}
      </div>
      </div>
    </div>
    <AwardLightbox target={target} onClose={close} onNavigate={index => setTarget(value => value ? { ...value, index } : null)} />
  </section>;
}

/** One archive with three distinct, keyboard-accessible collections. */
export const AwardsSection: React.FC = () => {
  const revision = useCMSRevision();
  const [tab, setTab] = useState<RecognitionCategory>('tweets');
  const [verticalTabs, setVerticalTabs] = useState(true);
  const tabs = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const section = hub.current, scene = stage.current, title = heading.current, collection = gallery.current;
    if (!section || !scene || !title || !collection) return;
    const parts = Array.from(title.children) as HTMLElement[];
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, disposed = false, dimensionsDirty = true;
    let travel = 0;
    let placements: { x: number; y: number; scale: number }[] = [];
    const measure = () => {
      dimensionsDirty = false;
      const viewport = window.innerHeight;
      section.dataset.recognitionIntro = query.matches ? 'false' : 'true';
      if (query.matches) { travel = 0; section.style.removeProperty('--recognition-travel'); return; }
      travel = Math.min(680, Math.max(320, viewport * .72));
      section.style.setProperty('--recognition-travel', `${travel}px`);
      const sceneBox = scene.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const scale = Math.min(2.4, (scene.clientWidth * .88) / Math.max(1, ...parts.map(part => part.offsetWidth)));
      const gap = Math.max(8, viewport * .014);
      const totalHeight = parts.reduce((sum, part) => sum + part.offsetHeight * scale, 0) + gap;
      let top = viewport * .46 - totalHeight / 2;
      placements = parts.map(part => {
        const x = scene.clientWidth / 2 - (titleBox.left - sceneBox.left + part.offsetLeft + part.offsetWidth / 2);
        const y = top + part.offsetHeight * scale / 2 - (titleBox.top - sceneBox.top + part.offsetTop + part.offsetHeight / 2);
        top += part.offsetHeight * scale + gap;
        return { x, y, scale };
      });
    };
    const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
    const paint = () => {
      frame = 0;
      if (disposed) return;
      if (dimensionsDirty) measure();
      const bounds = section.getBoundingClientRect();
      const reading = collection.contains(document.activeElement) && Boolean(document.activeElement?.matches(':focus-visible'));
      const progress = query.matches || reading ? 1 : smooth(-bounds.top / Math.max(1, travel));
      const reveal = smooth((progress - .42) / .58);
      parts.forEach((part, i) => {
        const place = placements[i];
        part.style.transform = query.matches || !place ? 'none' : `translate(${place.x * (1 - progress)}px, ${place.y * (1 - progress)}px) scale(${1 + (place.scale - 1) * (1 - progress)})`;
      });
      section.style.setProperty('--recognition-reveal', String(reveal));
      section.style.setProperty('--recognition-gallery-y', `${(1 - reveal) * 46}px`);
      section.style.setProperty('--recognition-description-opacity', String(smooth((progress - .82) / .18)));
      section.dataset.galleryVisible = String(reveal > .9);
      section.dataset.introResting = String(progress >= .99);

    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const resize = () => { dimensionsDirty = true; schedule(); };
    const observer = new ResizeObserver(resize);
    observer.observe(scene); observer.observe(title);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    collection.addEventListener('focusin', paint);
    collection.addEventListener('focusout', schedule);
    query.addEventListener('change', resize);
    void document.fonts.ready.then(() => { if (!disposed) resize(); });
    paint();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
      collection.removeEventListener('focusin', paint); collection.removeEventListener('focusout', schedule);
      query.removeEventListener('change', resize);
      parts.forEach(part => part.style.removeProperty('transform'));
    };
  }, []);
  useEffect(() => {
    const query = matchMedia('(min-width: 761px)');
    const sync = () => setVerticalTabs(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const groups = useMemo(() => { void revision; return groupRecognitions([...AWARDS].sort((a, b) => priority(a) - priority(b))); }, [revision]);
  const index = ARCHIVES.findIndex(archive => archive.category === tab);
  return <section ref={hub} id="awards-section" className="recognition-hub" aria-labelledby="recognition-hub-title">
    <div ref={stage} className="recognition-stage">
    <header className="recognition-hub-heading">
      <h2 ref={heading} id="recognition-hub-title">
        <span>{getCMSCopy('copy.RecognitionArchive.heading', 'Awards &')}</span>{' '}
        <em>{getCMSCopy('copy.RecognitionArchive.heading-script', 'Recognition')}</em>
      </h2>
      <p>{getCMSCopy('copy.RecognitionArchive.heading-intro', 'Celebrating service and a shared commitment to humanity.')}</p>
    </header>
    <div ref={gallery} className="recognition-gallery">
    <RecognitionArchive archive={ARCHIVES[index]} items={groups[tab]} navigation={
    <div ref={tabs} className="archive-tabs" role="tablist" aria-label="Archive collections" aria-orientation={verticalTabs ? 'vertical' : 'horizontal'}>
      {ARCHIVES.map((archive, i) => <button key={archive.category} type="button" role="tab" id={`${archive.category}-archive-tab`} aria-controls={`${archive.category}-archive-panel`} aria-selected={tab === archive.category} tabIndex={tab === archive.category ? 0 : -1}
        onClick={() => setTab(archive.category)} onKeyDown={event => {
          let next = i;
          if (event.key === 'ArrowRight' || verticalTabs && event.key === 'ArrowDown') next = (i + 1) % ARCHIVES.length;
          else if (event.key === 'ArrowLeft' || verticalTabs && event.key === 'ArrowUp') next = (i + ARCHIVES.length - 1) % ARCHIVES.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = ARCHIVES.length - 1;
          else return;
          event.preventDefault(); event.stopPropagation();
          setTab(ARCHIVES[next].category);
          tabs.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}><span className="archive-tab-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span className="archive-tab-label">{archive.title}</span><ArrowRight className="archive-tab-arrow" size={17} aria-hidden="true" /></button>)}
    </div>} />
    </div>
    </div>
  </section>;
};
