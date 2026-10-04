import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { onArrival } from '../utils/arrival';
import './growth-rings.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.GrowthRings.${key}`, fallback);

export interface RingMilestone { year: string; label: string; text: string; href: string; photo?: string; color: string; /** the photograph is a mark, shown whole on white */ logo?: boolean }

/* Drawn in a 400 × 400 box: the founding year is the heart of the trunk,
   every year since is one ring, and this year is the bark. */
const MID = 200, HEART = 16, BARK = 176;
/* a ring is never quite round: a slow wobble, the same every time for its year */
const ringPath = (r: number, seed: number) => {
  const steps = 72, a = 0.012 + (seed % 3) * 0.004, phase = (seed * 37) % 360;
  let d = '';
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2;
    const k = 1 + a * Math.sin(3 * t + phase) + a * 0.6 * Math.sin(5 * t + phase * 1.7);
    const x = MID + r * k * Math.cos(t), y = MID + r * k * Math.sin(t);
    d += `${s ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
};
const at = (r: number, deg: number): [number, number] => [MID + r * Math.cos((deg * Math.PI) / 180), MID + r * Math.sin((deg * Math.PI) / 180)];
/* where each milestone's marker sits on its ring, spread so the labels never meet */
const ANGLES = [-90, -38, 58, 160, 228, 300];
/* the rays of a cut trunk, from the heart outwards */
const RAYS = [12, 71, 133, 197, 251, 318];

/** THE ROAD SO FAR, AS A TRUNK GROWS IT: a cross-section with one ring for
    every year since the foundation began, its milestones marked on their
    own rings, and the list beside it. Every milestone is always written out
    in the list; choosing one lights its ring. On arrival the rings grow out
    from the heart and the milestones light in turn, once. */
export const GrowthRings: React.FC<{ founded: number; milestones: RingMilestone[] }> = ({ founded, milestones }) => {
  const root = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  const [current, setCurrent] = useState(0);
  const touched = useRef(false);
  const years = milestones.map(m => Number.parseInt(m.year, 10) || founded);
  const now = Math.max(new Date().getFullYear(), ...years);
  const span = Math.max(1, now - founded);
  const radius = (year: number) => HEART + ((Math.min(Math.max(year, founded), now) - founded) / span) * (BARK - HEART);

  useEffect(() => { const el = root.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  /* once arrived, the milestones light one after another, oldest first, until someone chooses */
  useEffect(() => {
    if (!arrived || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const timer = window.setInterval(() => {
      if (touched.current || ++i >= milestones.length) { window.clearInterval(timer); return; }
      setCurrent(i);
    }, 1300);
    return () => window.clearInterval(timer);
  }, [arrived, milestones.length]);
  const choose = (i: number) => { touched.current = true; setCurrent(i); };

  const rings = Array.from({ length: span + 1 }, (_, k) => founded + k);
  const lit = milestones[current];
  return (
    <div ref={root} className="rings" data-arrived={arrived} style={{ '--lit': lit?.color } as React.CSSProperties}>
      <figure className="rings-trunk">
        <svg viewBox="0 -16 400 416" aria-hidden="true">
          <defs>
            <radialGradient id="rings-wood">
              <stop offset="0" stopColor="#fdf7ea" />
              <stop offset="0.75" stopColor="#f5e6c9" />
              <stop offset="1" stopColor="#ecd6ad" />
            </radialGradient>
          </defs>
          <path className="rings-bark" d={ringPath(BARK + 7, 3)} />
          <path className="rings-wood" d={ringPath(BARK, now)} fill="url(#rings-wood)" />
          {RAYS.map(deg => { const [x0, y0] = at(HEART + 6, deg), [x1, y1] = at(BARK - 10, deg + 4); return <path key={deg} className="rings-ray" d={`M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`} />; })}
          {rings.map((year, k) => {
            const m = years.indexOf(year);
            return <path key={year} className="rings-ring" data-milestone={m >= 0} data-on={m >= 0 && m === current} data-five={(year - founded) % 5 === 0}
              style={{ '--k': k, '--ink': m >= 0 ? milestones[m].color : undefined } as React.CSSProperties} d={ringPath(radius(year), year)} />;
          })}
          <circle className="rings-heart" cx={MID} cy={MID} r="5" />
          {milestones.map((m, i) => {
            const r = radius(years[i]);
            const deg = r <= HEART + 2 ? 0 : ANGLES[(i % (ANGLES.length - 1)) + 1];
            const [x, y] = r <= HEART + 2 ? [MID, MID] : at(r, deg);
            const [lx, ly] = r <= HEART + 2 ? [MID, MID + 26] : at(r + 22, deg);
            return (
              <g key={m.year} className="rings-mark" data-on={i === current} style={{ '--ink': m.color } as React.CSSProperties} onClick={() => choose(i)} onPointerEnter={() => choose(i)}>
                <circle cx={x} cy={y} r="7" />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">{m.year}</text>
              </g>
            );
          })}
          <text className="rings-today" x={MID} y={MID - BARK - 20} textAnchor="middle" dominantBaseline="middle">{now} · {c('today', 'today')}</text>
        </svg>
        <figcaption>{c('caption', 'One ring for every year of service since')} {founded}</figcaption>
      </figure>

      <ol className="rings-list">
        {milestones.map((m, i) => (
          <li key={m.year} data-on={i === current} style={{ '--ink': m.color } as React.CSSProperties}>
            <button type="button" className="rings-pick" aria-pressed={i === current} onClick={() => choose(i)} onFocus={() => choose(i)}>
              <span className="rings-thumb" data-logo={m.logo || undefined}>{m.photo && <img src={resolveCMSMedia(m.photo)} alt="" loading="lazy" decoding="async" />}</span>
              <span className="rings-year">{m.year}</span>
              <span className="rings-label">{m.label}{years[i] > founded && <small> · {c('year', 'year')} {years[i] - founded}</small>}</span>
            </button>
            <p>{m.text}</p>
            <a href={m.href}>{c('explore', 'Explore this chapter')}<ArrowUpRight size={14} aria-hidden="true" /></a>
          </li>
        ))}
      </ol>
    </div>
  );
};
