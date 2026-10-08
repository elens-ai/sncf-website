import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { ACTIVITIES } from '../data/activities';
import { insightsFor } from '../data/insights';
import { OdometerStatCounter } from './OdometerStatCounter';
import './working-hands.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.WorkingHands.${key}`, fallback);

/** One of the things the lede says the foundation's hands do, the photograph
    that shows it and the reported figure that counts it. */
export interface HandWay {
  id: string;
  /** the words of the lede it lights */
  phrase: string;
  photo?: string;
  alt: string;
  color: string;
  figure: string;
  unit: string;
  note?: string;
  period: string;
  href: string;
}

const activity = (id: string) => ACTIVITIES.find(a => a.id === id);
const pointOf = (id: string, label: string) => activity(id)?.dataPoints.find(p => p.label === label);
/** "250+ branches nationwide" → ["250+", "branches nationwide"]; a line with no figure up front is all unit */
export const splitFigure = (text: string): [string, string] => {
  const m = /^([₹≈]?\s?\d[\d,.]*\+?%?)\s+(.+)$/.exec(text.trim());
  return m ? [m[1], m[2]] : ['', text];
};

/** The star, leaf by leaf, in the colours of the foundation's emblem. Every
    figure is read out of the record (a CMS edit flows through); a way whose
    figure has gone from the record drops out rather than printing a blank. */
export const handWays = (reach: string): HandWay[] => {
  const centre = activity('health-centre');
  const network = centre ? insightsFor(centre)[0] : undefined;
  const schools = activity('schools-colleges');
  const trees = activity('tree-plantation');
  const relief = pointOf('financial-support', 'Disaster relief & fund');
  const [reachFigure, reachUnit] = splitFigure(reach);
  const ways: HandWay[] = [
    { id: 'hands', phrase: c('hands', 'working hands'), photo: resolveCMSAsset('asset.WorkingHands.hands', '/images/welcome-volunteers.jpg'),
      alt: c('hands-alt', 'Foundation volunteers in their blue shirts, hands folded, beneath a wall that reads Service with Humility'),
      color: '#b357ad', figure: reachFigure, unit: reachUnit, period: c('hands-period', 'Service with humility · since 2010'), href: '#account' },
    { id: 'hospitals', phrase: c('hospitals', 'builds hospitals'), photo: resolveCMSAsset('asset.WorkingHands.hospitals', '/images/projects/health-city.webp'),
      alt: c('hospitals-alt', 'Sant Nirankari Health City, the charitable hospital in North Delhi'),
      color: '#f81170', figure: network?.value ?? '', unit: network?.label ?? '', note: c('hospitals-note', 'and Sant Nirankari Health City, its OPD now open'), period: centre?.period ?? '', href: '/projects#health-city' },
    { id: 'classrooms', phrase: c('classrooms', 'funds classrooms'), photo: resolveCMSAsset('asset.WorkingHands.classrooms', '/images/programmes/schools-classroom.webp'),
      alt: c('classrooms-alt', 'Students in a classroom at Sant Nirankari Public School, Tilak Nagar'),
      color: '#6663b5', figure: schools?.headline.value ?? '', unit: schools?.headline.label ?? '', period: schools?.period ?? '', href: '/core-values#schools-colleges' },
    { id: 'forests', phrase: c('forests', 'plants forests'), photo: resolveCMSAsset('asset.WorkingHands.forests', '/images/programmes/oneness-vann-planting.webp'),
      alt: c('forests-alt', 'Women planting saplings for Oneness Vann in Solapur'),
      color: '#69b947', figure: trees?.headline.value ?? '', unit: trees?.headline.label ?? '', period: trees?.period ?? '', href: '/core-values#tree-plantation' },
    /* no photograph of a flood relief camp is in the archive yet, so this
       petal is drawn rather than borrowed from another programme */
    { id: 'flood', phrase: c('flood', 'turns up after a flood'), alt: '',
      color: '#09a6cf', figure: relief?.value ?? '', unit: relief?.label ?? '', period: activity('financial-support')?.period ?? '', href: '/core-values#financial-support' },
  ];
  return ways.filter(way => way.figure);
};

/* ---------- the lede, its phrases lit ---------- */

/** The lede as written, each phrase it shares with a petal turned into a
    switch for that petal. If an edit has dropped a phrase from the lede, the
    switches are set out under it instead, so every petal stays in reach. */
export const HandsLede: React.FC<{ text: string; ways: HandWay[]; current: number; onPick: (i: number) => void }> = ({ text, ways, current, onPick }) => {
  const chip = (i: number, words: string) => (
    <button key={`${ways[i].id}-${words}`} type="button" className="hands-chip" style={{ '--way': ways[i].color } as React.CSSProperties}
      aria-pressed={current === i} onClick={() => onPick(i)} onPointerEnter={() => onPick(i)}>{words}</button>
  );
  const found = ways.map(way => text.toLowerCase().indexOf(way.phrase.toLowerCase()));
  if (found.some(at => at < 0)) {
    return <>
      <p className="who-cover-lede">{text}</p>
      <p className="hands-chips">{ways.map((way, i) => chip(i, way.phrase))}</p>
    </>;
  }
  const order = found.map((at, i) => ({ at, i })).sort((a, b) => a.at - b.at);
  const parts: React.ReactNode[] = [];
  let from = 0;
  for (const { at, i } of order) {
    if (at < from) continue;
    parts.push(text.slice(from, at), chip(i, text.slice(at, at + ways[i].phrase.length)));
    from = at + ways[i].phrase.length;
  }
  parts.push(text.slice(from));
  return <p className="who-cover-lede">{parts}</p>;
};

/** What the lit phrase comes to: its reported figure rolling in, its date, and the way to read more. */
export const HandsProof: React.FC<{ way: HandWay; told: boolean }> = ({ way, told }) => (
  <div className="hands-proof" style={{ '--way': way.color } as React.CSSProperties} aria-live={told ? 'polite' : 'off'}>
    <div className="hands-proof-body" key={way.id}>
      <p className="hands-proof-phrase">{way.phrase}</p>
      <div className="hands-proof-figure">
        <strong><span className="sr-only">{way.figure}</span><span aria-hidden="true"><OdometerStatCounter value={way.figure} duration={1200} /></span></strong>
        <span>{way.unit}{way.note && <em> {way.note}</em>}</span>
      </div>
      <p className="hands-proof-foot"><span>{way.period}</span><a href={way.href}>{c('proof-link', 'See the work')}<ArrowUpRight size={14} aria-hidden="true" /></a></p>
    </div>
  </div>
);
