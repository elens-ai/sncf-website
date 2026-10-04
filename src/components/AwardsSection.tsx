import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award as AwardIcon, Pause, Play, Maximize2 } from 'lucide-react';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { onArrival } from '../utils/arrival';
import './recognition-partners.css';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';
import { AwardsTree, type TreeOrnament } from './AwardsTree';

interface Item {
  key: string;
  src: string;
  alt: string;
  focal?: string;
  /** The word set huge behind the stage — a year where there is one. */
  ghost: string;
  award: Award;
  photos: AwardPhoto[];
}

const standIn = (
  key: string, src: string, alt: string, ghost: string,
  title: string, awardedBy: string, note: string, focal?: string,
): Item => ({
  key, src, alt, ghost, focal,
  photos: [{ src, alt, width: 1200, height: 1500, focal }],
  award: { id: key, title, awardedBy, year: '', note },
});

let STANDIN = bindCMSValue(() => ([
  standIn('satguru', resolveCMSAsset("asset.AwardsSection.56b9a5e0ea79", "/images/satguru-mata-sudiksha-ji.jpg"),
    'Portrait of Satguru Mata Sudiksha Ji Maharaj', 'Guiding',
    'Satguru Mata Sudiksha Ji Maharaj', 'Sixth spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', '50% 24%'),
  standIn('planting', resolveCMSAsset("asset.AwardsSection.4daa8ff53979", "/images/mataji-rajpita-planting.webp"),
    'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling', 'Vann',
    'Planting a sapling', 'Oneness Vann',
    'Native saplings planted and tended until they grow into community forests.', '50% 32%'),
  standIn('rajpita', resolveCMSAsset("asset.AwardsSection.b4324b25c1ce", "/images/nirankari-rajpita-ramit-ji.jpg"),
    'Portrait of Nirankari Rajpita Ramit Ji', 'Guiding',
    'Nirankari Rajpita Ramit Ji', 'Spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', '50% 14%'),
  standIn('volunteers', resolveCMSAsset("asset.AwardsSection.76f684891a21", "/images/volunteers-planning.webp"),
    'Foundation volunteers planning a service drive', 'Sewa',
    'Volunteers planning a service drive', 'Documented service',
    'From the foundation’s own library, standing in until the honours are catalogued.',
    '50% 45%'),
  standIn('heal', resolveCMSAsset("asset.AwardsSection.7144da391fb1", "/images/vertical-heal.webp"), 'Emblem for the Heal programme', 'Heal',
    'Heal', 'Health and blood donation',
    'Blood donation drives, eye-care camps and free health checkups.'),
  standIn('enrich', resolveCMSAsset("asset.AwardsSection.486823e29a83", "/images/vertical-enrich.webp"), 'Emblem for the Enrich programme', 'Enrich',
    'Enrich', 'Education and skills', 'Schools, scholarships and skill development.'),
  standIn('empower', resolveCMSAsset("asset.AwardsSection.7e886446b163", "/images/vertical-empower.webp"), 'Emblem for the Empower programme', 'Empower',
    'Empower', 'Youth and environment',
    'Youth empowerment, plantation drives and disaster relief.'),
]), value => { STANDIN = value; });

/** An archival gallery: keep every photograph whole and its citation alongside it. */
export const AwardsSection: React.FC = () => {
  const revision = useCMSRevision();
  const rootRef = useRef<HTMLElement>(null);
  const inView = useSectionActivity(rootRef);
  const [active, setActive] = useState(0);
  /* which of the honour's photographs is in view */
  const [photo, setPhoto] = useState(0);
  const [calm, setCalm] = useState(false);
  const [shown, setShown] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const [held, setHeld] = useState(false);
  const [playing, setPlaying] = useState(true);
  const items: Item[] = useMemo(() => {
    void revision;
    return AWARDS.length ? AWARDS.filter(a => a.photos?.length).map(a => ({
      key: a.id, src: a.photos![0].src, alt: a.photos![0].alt,
      focal: a.photos![0].focal, ghost: a.year, award: a, photos: a.photos!,
    })) : STANDIN;
  }, [revision]);
  const index = items.length ? active % items.length : 0;
  const current = items[index];
  const shot = current ? current.photos[Math.min(photo, current.photos.length - 1)] : null;
  /* The tree hangs every photograph by its honour's year: the undated lowest,
     then the oldest, each year a branch higher, the newest crowning it. */
  const ornaments: TreeOrnament[] = useMemo(() => items
    .map((item, i) => ({ item, i, year: parseInt(item.award.year, 10) || 0 }))
    .sort((a, b) => a.year - b.year)
    .flatMap(({ item, i }) => item.photos.map((p, k) => ({ key: `${item.key}-${k}`, award: i, photo: k, src: p.src, focal: p.focal, year: item.award.year, title: item.award.title }))), [items]);
  useEffect(() => { if (rootRef.current) return onArrival(rootRef.current, () => setShown(true)); }, []);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(mq.matches);
    sync(); mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!inView || calm || target || held || !playing || items.length < 2) return;
    const timer = window.setInterval(() => { setActive(i => (i + 1) % items.length); setPhoto(0); }, 8000);
    return () => clearInterval(timer);
  }, [inView, calm, target, held, playing, items.length]);
  const choose = (i: number, p = 0) => { setActive(i); setPhoto(p); setPlaying(false); };
  const step = (direction: number) => { if (items.length) choose((index + direction + items.length) % items.length); };
  const close = useCallback(() => setTarget(null), []);

  return <section id="awards-section" ref={rootRef} className="recognition-section" data-arrived={shown} data-active={inView}
    aria-label={getCMSCopy('copy.AwardsSection.589b32fb4660', 'Awards and recognitions')}>
    <div className="continuity-art" aria-hidden="true"><i /><i /><span /></div>
    <header className="recognition-heading">
      <div><p className="continuity-eyebrow"><span />{getCMSCopy('copy.AwardsSection.22466b5a68ad', 'Recognition')}</p>
        <h2>{getCMSCopy('copy.AwardsSection.39a8c7496bcc', 'Awards & ')}<em>{getCMSCopy('copy.AwardsSection.6d628e092af8', 'Recognitions')}</em></h2>
        <p className="recognition-intro">{getCMSCopy('copy.AwardsSection.146746cd2494', 'Your appreciation makes us stronger to serve humanity.')}</p>
      </div>
      <div className="recognition-seal" aria-hidden="true"><AwardIcon size={25} strokeWidth={1} /><span>Service, recognised.</span></div>
    </header>
    {current ? <>
      <div className="recognition-feature recognition-feature-tree" onFocusCapture={() => setHeld(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false); }}>
        <div className="recognition-tree" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}>
          <AwardsTree ornaments={ornaments} award={index} photo={photo} onChoose={choose} label={getCMSCopy('copy.AwardsTree.label', 'The tree of honours: choose one to read it')} />
          <p className="awards-tree-caption">{getCMSCopy('copy.AwardsTree.caption', 'Every honour, a shared achievement.')}<span>{getCMSCopy('copy.AwardsTree.hint', 'The oldest on the lowest branches, the newest at the crown')}</span></p>
        </div>
        <div className="recognition-story">
          {shot && <button type="button" className="recognition-detail-photo" aria-label={`${current.award.title} — view photograph`}
            onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
            onClick={() => setTarget({ award: current.award, photos: current.photos, index: Math.min(photo, current.photos.length - 1) })}>
            <img key={shot.src} src={resolveCMSMedia(shot.src)} alt={shot.alt} decoding="async" />
            <span className="recognition-photo-open"><Maximize2 size={14} />View photograph</span>
          </button>}
          <div key={current.key} className="recognition-citation">
            <p className="recognition-year"><AwardIcon size={17} strokeWidth={1.4} />{current.award.year || 'Recognition'}<span>Honour {String(index + 1).padStart(2, '0')}</span></p>
            <h3>{current.award.title}</h3>
            <p className="recognition-issuer">{current.award.awardedBy}</p>
            {current.award.note && <p className="recognition-note">{current.award.note}</p>}
          </div>
          <button type="button" className="continuity-text-link" onClick={() => setTarget({ award: current.award, photos: current.photos, index: Math.min(photo, current.photos.length - 1) })}>Explore this recognition<ArrowUpRight size={17} /></button>
          <div className="recognition-navigation">
            <span>{String(index + 1).padStart(2, '0')} <i>/ {String(items.length).padStart(2, '0')}</i></span>
            <button type="button" aria-label="Previous honour" onClick={() => step(-1)} disabled={items.length < 2}><ArrowLeft size={18} /></button>
            <button type="button" aria-label="Next honour" onClick={() => step(1)} disabled={items.length < 2}><ArrowRight size={18} /></button>
            {!calm && items.length > 1 && <button type="button" aria-label={playing ? 'Pause awards rotation' : 'Play awards rotation'} onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>}
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">{!playing ? current.award.title : ''}</p>
    </> : <p className="recognition-intro">New recognitions will appear here as they are added to our archive.</p>}
    <AwardLightbox target={target} onClose={close} onNavigate={i => setTarget(t => t ? { ...t, index: i } : null)} />
  </section>;
};
