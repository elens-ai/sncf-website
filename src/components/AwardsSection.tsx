import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { onArrival } from '../utils/arrival';
import './recognition-partners.css';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';
import { HonourPile } from './HonourPile';

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

/** AWARDS & RECOGNITIONS, as an archive's page of fragments: a quiet heading
    (its two lines of text, and beside them the years, from the first honour
    to this one), and
    beneath it the photographs of the honours laid loosely as a pile of prints,
    some at a time, turning over (HonourPile). One brought forward stands
    beside its card; one already forward opens full size. */
export const AwardsSection: React.FC = () => {
  const revision = useCMSRevision();
  const rootRef = useRef<HTMLElement>(null);
  const inView = useSectionActivity(rootRef);
  const [calm, setCalm] = useState(false);
  const [shown, setShown] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const items: Item[] = useMemo(() => {
    void revision;
    return AWARDS.length ? AWARDS.filter(a => a.photos?.length).map(a => ({
      key: a.id, src: a.photos![0].src, alt: a.photos![0].alt,
      focal: a.photos![0].focal, ghost: a.year, award: a, photos: a.photos!,
    })) : STANDIN;
  }, [revision]);
  /* the years of the honours, for the heading's side: from the first to this one */
  const years = items.map(item => parseInt(item.award.year, 10)).filter(year => year > 0);
  const first = Math.min(...years), last = Math.max(...years, new Date().getFullYear());
  const span = years.length ? (first === last ? String(first) : `${first} – ${last}`) : '';
  useEffect(() => { if (rootRef.current) return onArrival(rootRef.current, () => setShown(true)); }, []);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(mq.matches);
    sync(); mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const open = useCallback((honour: number, photo: number) => {
    const item = items[honour];
    if (item) setTarget({ award: item.award, photos: item.photos, index: photo });
  }, [items]);
  const close = useCallback(() => setTarget(null), []);

  return <section id="awards-section" ref={rootRef} className="recognition-section" data-arrived={shown} data-active={inView}
    aria-label={getCMSCopy('copy.AwardsSection.589b32fb4660', 'Awards and recognitions')}>
    <header className="recognition-heading honour-heading">
      <div>
        <p className="continuity-eyebrow"><span />{getCMSCopy('copy.AwardsSection.22466b5a68ad', 'Recognition')}</p>
        <h2>{getCMSCopy('copy.AwardsSection.39a8c7496bcc', 'Awards & ')}<em>{getCMSCopy('copy.AwardsSection.6d628e092af8', 'Recognitions')}</em></h2>
        <div className="honour-heading-columns">
          <p>{getCMSCopy('copy.AwardsSection.146746cd2494', 'Your appreciation makes us stronger to serve humanity.')}</p>
          <p>{getCMSCopy('copy.AwardsSection.pile-how', 'Each photograph is an honour the foundation has received. Point at one, or tap it, to bring it forward and read what it honours and who gave it.')}</p>
        </div>
      </div>
      {span && <dl className="honour-meta">
        <div><dt>{getCMSCopy('copy.AwardsSection.meta-years', 'Years')}</dt><dd>{span}</dd></div>
      </dl>}
    </header>
    {items.length
      ? <HonourPile honours={items} arrived={shown} running={inView && target === null} calm={calm} onOpen={open} />
      : <p className="recognition-intro">New recognitions will appear here as they are added to our archive.</p>}
    <AwardLightbox target={target} onClose={close} onNavigate={i => setTarget(t => t ? { ...t, index: i } : null)} />
  </section>;
};
