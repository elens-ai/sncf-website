import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Maximize2, Pause, Play } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { AWARDS, type Award, type RecognitionCategory } from '../data/awards';
import { groupRecognitions } from '../data/recognition';
import { AwardLightbox, type LightboxTarget } from './AwardLightbox';
import './recognition-partners.css';
import './recognition-archive.css';

const ARCHIVES: { category: RecognitionCategory; id: string; title: string; intro: string; eyebrow: string }[] = [
  { category: 'tweets', id: 'tweets-section', get title() { return getCMSCopy("copy.RecognitionArchive.tweets.title", 'Tweets'); }, get eyebrow() { return getCMSCopy("copy.RecognitionArchive.tweets.eyebrow", 'Voices of appreciation'); }, get intro() { return getCMSCopy("copy.RecognitionArchive.tweets.intro", 'Words of encouragement from public figures, institutions and communities.'); } },
  { category: 'awards', id: 'awards-section', get title() { return getCMSCopy("copy.RecognitionArchive.awards.title", 'Awards & Certificates'); }, get eyebrow() { return getCMSCopy("copy.RecognitionArchive.awards.eyebrow", 'Service, recognised'); }, get intro() { return getCMSCopy("copy.RecognitionArchive.awards.intro", 'Honours, certificates and mementos that celebrate a shared commitment to humanity.'); } },
  { category: 'press', id: 'press-media-section', get title() { return getCMSCopy("copy.RecognitionArchive.press.title", 'Press & Media'); }, get eyebrow() { return getCMSCopy("copy.RecognitionArchive.press.eyebrow", 'Service in the news'); }, get intro() { return getCMSCopy("copy.RecognitionArchive.press.intro", 'Stories of the foundation’s work, as reported by the media.'); } },
];
const LEADING = ['csr-summit-most-impactful-ngo-2024', 'queens-golden-jubilee-award-2015', 'nbtc-award-of-excellence-2016', 'unep-world-environment-day-2024'];
const priority = (item: Award) => { const i = LEADING.indexOf(item.id); return i < 0 ? LEADING.length : i; };

const RecognitionArchive: React.FC<{ archive: typeof ARCHIVES[number]; items: Award[]; number: number }> = ({ archive, items, number }) => {
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
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!inView || paused || held || reduced || target || prints.length < 2) return;
    const timer = window.setInterval(() => step(1), 5000);
    return () => window.clearInterval(timer);
  }, [inView, paused, held, reduced, target, prints.length, step]);
  const close = useCallback(() => setTarget(null), []);
  const open = () => { if (current) setTarget({ award: current.award, photos: current.award.photos!, index: current.index }); };
  const title = archive.title;
  const visible = Array.from({ length: Math.min(5, prints.length) }, (_, offset) => ({ ...prints[(active + offset) % prints.length], offset, indexInArchive: (active + offset) % prints.length }));
  const years = items.map(item => parseInt(item.year, 10)).filter(Number.isFinite);

  return <section ref={root} id={`${archive.category}-archive-panel`} className="recognition-archive" data-category={archive.category} role="tabpanel" aria-labelledby={`${archive.category}-archive-tab`} tabIndex={0}>
    <div className="archive-inner">
      <header className="archive-heading">
        <div>
          <p className="archive-eyebrow"><span>{String(number).padStart(2, '0')}</span>{archive.eyebrow}</p>
          <h2 id={`${archive.id}-title`}>{title}</h2>
          <p className="archive-intro">{archive.intro}</p>
        </div>
        <div className="archive-catalogue"><span>{String(items.length).padStart(2, '0')} records</span>{years.length > 0 && <span>{Math.min(...years)} — {Math.max(...years)}</span>}</div>
      </header>
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
    <AwardLightbox target={target} onClose={close} onNavigate={index => setTarget(value => value ? { ...value, index } : null)} />
  </section>;
}

/** One archive with three distinct, keyboard-accessible collections. */
export const AwardsSection: React.FC = () => {
  const revision = useCMSRevision();
  const [tab, setTab] = useState<RecognitionCategory>('tweets');
  const tabs = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => { void revision; return groupRecognitions([...AWARDS].sort((a, b) => priority(a) - priority(b))); }, [revision]);
  const index = ARCHIVES.findIndex(archive => archive.category === tab);
  return <section id="awards-section" className="recognition-hub" aria-label="Tweets, awards and media archive">
    <div ref={tabs} className="archive-tabs" role="tablist" aria-label="Archive collections">
      {ARCHIVES.map((archive, i) => <button key={archive.category} type="button" role="tab" id={`${archive.category}-archive-tab`} aria-controls={`${archive.category}-archive-panel`} aria-selected={tab === archive.category} tabIndex={tab === archive.category ? 0 : -1}
        onClick={() => setTab(archive.category)} onKeyDown={event => {
          let next = i;
          if (event.key === 'ArrowRight') next = (i + 1) % ARCHIVES.length;
          else if (event.key === 'ArrowLeft') next = (i + ARCHIVES.length - 1) % ARCHIVES.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = ARCHIVES.length - 1;
          else return;
          event.preventDefault(); event.stopPropagation();
          setTab(ARCHIVES[next].category);
          tabs.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}><span>{String(i + 1).padStart(2, '0')}</span>{archive.title}</button>)}
    </div>
    <RecognitionArchive key={tab} archive={ARCHIVES[index]} items={groups[tab]} number={index + 1} />
  </section>;
};
