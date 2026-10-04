import React, { useId } from 'react';
import { ArrowUpRight, Waves } from 'lucide-react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
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
const split = (text: string): [string, string] => {
  const m = /^([₹≈]?\s?\d[\d,.]*\+?%?)\s+(.+)$/.exec(text.trim());
  return m ? [m[1], m[2]] : ['', text];
};

/** The lotus, petal by petal, in the colours of the logo's own petals. Every
    figure is read out of the record (a CMS edit flows through); a way whose
    figure has gone from the record drops out rather than printing a blank. */
export const handWays = (reach: string): HandWay[] => {
  const centre = activity('health-centre');
  const network = centre ? insightsFor(centre)[0] : undefined;
  const schools = activity('schools-colleges');
  const trees = activity('tree-plantation');
  const relief = pointOf('financial-support', 'Disaster relief & fund');
  const [reachFigure, reachUnit] = split(reach);
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

/* ---------- the bloom ---------- */

/* Drawn in a 600-wide box: five petals rising from one arc, the way the
   logo's lotus does, and the two hands of the logo cupped beneath them. */
const BASE: [number, number] = [300, 430];
const PETALS = [
  /* back to front, so the middle petal stands over the rest */
  { slot: 'outer-left', angle: -66, length: 236, width: 158, dx: -58, dy: 10 },
  { slot: 'outer-right', angle: 66, length: 236, width: 158, dx: 58, dy: 10 },
  { slot: 'inner-left', angle: -33, length: 292, width: 178, dx: -26, dy: 4 },
  { slot: 'inner-right', angle: 33, length: 292, width: 178, dx: 26, dy: 4 },
  { slot: 'centre', angle: 0, length: 340, width: 204, dx: 0, dy: 0 },
];
type Petal = (typeof PETALS)[number];
/* which way sits on which petal: the hands in the middle, the rest outwards in the lede's order */
const SLOT_OF: Record<string, string> = { hands: 'centre', hospitals: 'inner-right', classrooms: 'inner-left', forests: 'outer-left', flood: 'outer-right' };
/* the logo's figures: a dot for a head between the petals */
const HEADS = [
  { angle: -50, r: 276, color: '#f81170' }, { angle: -16, r: 330, color: '#6663b5' },
  { angle: 16, r: 330, color: '#09a6cf' }, { angle: 50, r: 276, color: '#69b947' },
];

/** a petal pointing up from (0, 0): fuller below the middle, drawn to a point */
const petal = (length: number, width: number) => {
  const h = length, w = width / 2;
  return `M0 0C${-w * 1.18} ${-h * 0.2} ${-w * 1.02} ${-h * 0.74} 0 ${-h}C${w * 1.02} ${-h * 0.74} ${w * 1.18} ${-h * 0.2} 0 0Z`;
};
/** a line of water across a square of the given side, a wavelength longer at
    each end so it can drift one wavelength and loop without a seam */
const WAVE = 64;
const wave = (side: number, y: number) => {
  const from = -side / 2 - WAVE, halves = Math.ceil((side + WAVE * 2) / (WAVE / 2));
  return `M${from} ${y}q${WAVE / 4} -7 ${WAVE / 2} 0${` t${WAVE / 2} 0`.repeat(halves)}`;
};
const polar = (r: number, deg: number): [number, number] => [BASE[0] + r * Math.sin((deg * Math.PI) / 180), BASE[1] - r * Math.cos((deg * Math.PI) / 180)];

export const HandsBloom: React.FC<{ ways: HandWay[]; current: number; onPick: (i: number) => void }> = ({ ways, current, onPick }) => {
  const id = useId().replace(/:/g, '');
  const lit = ways[current];
  const palm = resolveCMSAsset('asset.WorkingHands.palm', '/images/petals/palm.webp');
  /* one petal, its photograph upright inside the tilt (or, with none, its water) */
  const draw = (p: Petal, way: HandWay, i: number, front = false) => {
    const [x, y] = [BASE[0] + p.dx, BASE[1] + p.dy];
    const side = p.length * 1.04;
    return (
      <g key={front ? `front-${way.id}` : p.slot} className={front ? 'hands-petal hands-petal-front' : 'hands-petal'} data-on={front}
        style={{ '--way': way.color, transformOrigin: `${x}px ${y}px` } as React.CSSProperties}
        onClick={() => onPick(i)} onPointerEnter={() => onPick(i)}>
        <g transform={`translate(${x} ${y}) rotate(${p.angle})`}>
          <g clipPath={`url(#${id}-${p.slot})`}>
            <g transform={`translate(0 ${-p.length / 2}) rotate(${-p.angle})`}>
              {way.photo
                ? <image className="hands-photo" href={resolveCMSMedia(way.photo)} x={-side / 2} y={-side / 2} width={side} height={side} preserveAspectRatio="xMidYMid slice" />
                : <g className="hands-water">
                    <rect x={-side / 2} y={-side / 2} width={side} height={side} fill={`url(#${id}-water)`} />
                    {[0.2, 0.38, 0.56, 0.74].map((t, k) => (
                      <path key={t} className="hands-wave" style={{ '--k': k } as React.CSSProperties} d={wave(side, -side / 2 + side * t)} />
                    ))}
                  </g>}
            </g>
            <path className="hands-wash" d={petal(p.length, p.width)} />
          </g>
          {!way.photo && (
            <g transform={`translate(0 ${-p.length * 0.5}) rotate(${-p.angle}) translate(-21 -21)`} className="hands-water-mark">
              <Waves size={42} strokeWidth={1.5} />
            </g>
          )}
          <path className="hands-rim" d={petal(p.length, p.width)} />
        </g>
      </g>
    );
  };
  const placed = PETALS.map(p => { const i = ways.findIndex(way => SLOT_OF[way.id] === p.slot); return { p, i, way: ways[i] }; }).filter(x => x.way);
  const chosen = placed.find(x => x.i === current);
  return (
    <svg className="hands-bloom" viewBox="0 46 600 494" aria-hidden="true" style={{ '--lit': lit?.color } as React.CSSProperties}>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="var(--lit)" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="var(--lit)" stopOpacity="0.08" />
          <stop offset="1" stopColor="var(--lit)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fdcf0" />
          <stop offset="1" stopColor="#0778a8" />
        </linearGradient>
        {PETALS.map(p => <clipPath key={p.slot} id={`${id}-${p.slot}`}><path d={petal(p.length, p.width)} /></clipPath>)}
      </defs>

      <circle className="hands-halo" cx="300" cy="290" r="280" fill={`url(#${id}-halo)`} />
      {placed.map(({ p, i, way }) => draw(p, way, i))}
      {/* the petal being read comes to the front, whole */}
      {chosen && draw(chosen.p, chosen.way, chosen.i, true)}
      {HEADS.map(h => { const [x, y] = polar(h.r, h.angle); return <circle key={h.angle} className="hands-head" cx={x} cy={y} r="10" fill={h.color} />; })}

      {/* the logo's two hands, cupped: one as drawn, its twin turned to face it */}
      <g className="hands-palms">
        <image href={palm} x="300" y="408" width="296" height="112" preserveAspectRatio="none" />
        <image href={palm} x="300" y="408" width="296" height="112" preserveAspectRatio="none" transform="translate(600 0) scale(-1 1)" />
      </g>
    </svg>
  );
};
