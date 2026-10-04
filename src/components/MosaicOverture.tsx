import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { PETAL_ART, PALM_ART, LOGO_COLOURS, logoInkSrc } from './petalArt';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import { ACTIVITIES } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { MOSAIC_WALL } from './mosaicWallTiles';
import { easeOut } from '../utils/waves';
import './mosaic-overture.css';

// Keep every piece in the foundation artwork's original proportions.
const pieces = [...PETAL_ART, { id: 'palm', ...PALM_ART }];
const box = {
  x: Math.min(...pieces.map(p => p.x)),
  y: Math.min(...pieces.map(p => p.y)),
  right: Math.max(...pieces.map(p => p.x + p.w)),
  bottom: Math.max(...pieces.map(p => p.y + p.h)),
};
const width = box.right - box.x, height = box.bottom - box.y;
const paths = (): { id: MosaicPillar; detail: string }[] => [
  { id: 'heal', detail: getCMSCopy('copy.MosaicOverture.heal', 'Care & wellbeing') },
  { id: 'enrich', detail: getCMSCopy('copy.MosaicOverture.enrich', 'Learning & skills') },
  { id: 'empower', detail: getCMSCopy('copy.MosaicOverture.empower', 'Community & planet') },
  { id: 'projects', detail: getCMSCopy('copy.MosaicOverture.projects', 'Lasting change') },
];

/* THE WALL: the foundation's own photographs, dense behind the overture in
   the section's green and drifting slowly in columns, the even ones against
   the odd; pointing at a path lights that pillar's photographs in its colour.
   Each column holds its tiles twice so its drift loops without a seam. The
   tiles come from one sprite (scripts/build-mosaic-wall.ts). */
const WALL_COLUMNS = 10;
const WALL_DEPTH = 12;
const wallColumns = Array.from({ length: WALL_COLUMNS }, (_, c) =>
  Array.from({ length: WALL_DEPTH }, (_, k) => (c * 5 + k * 7) % MOSAIC_WALL.tiles.length));
const tileAt = (t: number) => `${(t % MOSAIC_WALL.cols) / (MOSAIC_WALL.cols - 1) * 100}% ${Math.floor(t / MOSAIC_WALL.cols) / Math.max(1, MOSAIC_WALL.rows - 1) * 100}%`;

function MosaicWall({ lit }: { lit: MosaicPillar | null }) {
  return (
    <div className="mosaic-wall" data-lit={lit ?? undefined} aria-hidden="true"
      style={{ '--wall-sprite': `url(${resolveCMSMedia(MOSAIC_WALL.src)})`, '--sprite-cols': MOSAIC_WALL.cols, '--sprite-rows': MOSAIC_WALL.rows } as React.CSSProperties}>
      {wallColumns.map((column, c) => (
        <div key={c} className="mosaic-wall-col" style={{ '--wall-time': `${84 + (c % 4) * 17}s`, '--wall-delay': `${-c * 13}s` } as React.CSSProperties}>
          {[...column, ...column].map((t, k) => {
            const pillar = MOSAIC_WALL.tiles[t];
            return <i key={k} data-pillar={pillar} style={{ backgroundPosition: tileAt(t), '--tile-light': PILLARS.find(item => item.id === pillar)?.accentB } as React.CSSProperties} />;
          })}
        </div>
      ))}
    </div>
  );
}

/* THE ASSEMBLY, over a little more than two seconds once it is told to play:
   a cupped hand, then the centre petal, then the mirrored pairs unfolding, the
   light and orbits rising with them, then the words, then the doors. Written
   as CSS variables on the overture and each petal, which its stylesheet reads;
   under reduced motion everything is simply there. */
const ASSEMBLY_MS = 2200;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function useAssembly(root: React.RefObject<HTMLElement | null>, play: boolean) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const petals = [...el.querySelectorAll<HTMLElement>('.mosaic-petal')];
    const paint = (o: number) => {
      el.style.setProperty('--a', String(easeOut(clamp01(o / .8))));
      petals.forEach((petal, index) => {
        const palm = petal.dataset.piece === 'palm';
        const start = palm ? 0 : .13 + Math.abs(index - 2) * .085;
        const t = clamp01((o - start) / (palm ? .38 : .48));
        const bloom = t * t * t * (t * (t * 6 - 15) + 10);
        petal.style.setProperty('--bloom', String(bloom));
        petal.style.setProperty('--arc', String(Math.sin(Math.PI * bloom)));
        /* each piece opens white and its colour floods in over the rest of its unfolding */
        const ink = clamp01((bloom - .3) / .7);
        petal.style.setProperty('--veil', String(1 - ink * ink * (3 - 2 * ink)));
      });
      el.style.setProperty('--w', String(easeOut(clamp01((o - .2) / .65))));
      el.style.setProperty('--links', String(clamp01((o - .55) / .45)));
    };
    if (!play) { paint(0); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(1); return; }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const o = Math.min(1, (now - start) / ASSEMBLY_MS);
      paint(o);
      if (o < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [root, play]);
}

/** "FOUR PATHS. ONE PURPOSE." — the foundation's emblem assembling over a wall
    of its own photographs, and four doors, one for each path. It opens the
    home page: choosing a door walks the visitor into that path (onChoose is
    handed the door it was chosen from), and the cue at its foot carries on
    down the page. */
export function MosaicOverture({ onChoose, play = true, heading = 'h2', onScrollOn }: {
  onChoose: (pillar: MosaicPillar, from: HTMLElement) => void;
  /** Starts the emblem assembling and the words and doors arriving. */
  play?: boolean;
  /** h1 where the overture opens the page. */
  heading?: 'h1' | 'h2';
  /** Where "Scroll to explore" goes when it is pressed. */
  onScrollOn?: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useAssembly(root, play);
  const [lit, setLit] = useState<MosaicPillar | null>(null);
  const Title = heading;
  const title = getCMSCopy('copy.ImpactMosaic.eee670c33892', 'Four paths. One purpose.');
  const lines = title.match(/^(.+?[.!?])\s+(.+)$/);
  return (
    <header ref={root} className="mosaic-overture" data-state="active">
      <MosaicWall lit={lit} />
      <div className="mosaic-overture-composition">
        <div className="mosaic-emblem" aria-hidden="true">
          <svg className="mosaic-emblem-orbits" viewBox="0 0 560 480" fill="none">
            <ellipse className="mosaic-orbit-outer" cx="280" cy="240" rx="260" ry="200" transform="rotate(-18 280 240)" />
            <ellipse className="mosaic-orbit-inner" cx="280" cy="240" rx="235" ry="218" transform="rotate(22 280 240)" />
            <path className="mosaic-orbit-trace" pathLength="1" d="M44 299C-12 139 177 15 362 57C482 84 552 184 519 277" />
            <g className="mosaic-orbit-sparks">
              <circle cx="70" cy="138" r="3" /><circle cx="485" cy="132" r="2.5" />
              <circle cx="445" cy="410" r="2" /><circle cx="113" cy="394" r="2" />
            </g>
          </svg>
          <div className="mosaic-lotus" style={{ '--lotus-aspect': width / height } as React.CSSProperties}>
            {pieces.map((piece, index) => (
              <img key={piece.id} className="mosaic-petal" data-piece={piece.id} src={resolveCMSMedia(logoInkSrc(piece.id))} alt="" draggable={false}
                style={{
                  left: `${(piece.x - box.x) / width * 100}%`, top: `${(piece.y - box.y) / height * 100}%`, width: `${piece.w / width * 100}%`,
                  '--fan-x': (index - 2) * 24, '--fan-turn': (index - 2) * 18,
                  '--ink': piece.id === 'palm' ? LOGO_COLOURS.hand[1] : LOGO_COLOURS.petals[index],
                } as React.CSSProperties} />
            ))}
          </div>
          <span className="mosaic-emblem-light" />
        </div>
        <div className="mosaic-overture-copy">
          <p className="mosaic-overture-eyebrow"><span aria-hidden="true" />{getCMSCopy('copy.ImpactMosaic.fc967e87a6e8', 'Our work')}</p>
          <Title className="mosaic-overture-title">
            <span>{lines ? lines[1] : title}</span>
            {lines && <span className="font-dancing-script">{lines[2]}</span>}
          </Title>
          <p className="mosaic-overture-lead">{getCMSCopy('copy.MosaicOverture.purpose', 'A helping hand. An open door. A greener tomorrow. Together, we make a difference.')}</p>
        </div>
      </div>
      <nav className="mosaic-paths" aria-label="Explore our four pillars">
        {paths().map(({ id, detail }, index) => (
          <button type="button" key={id} className="mosaic-path" onClick={event => onChoose(id, event.currentTarget)} aria-label={`${getCMSCopy('copy.MosaicOverture.enter', 'Enter')} ${PILLAR_LOGOS[id].label}: ${detail}`}
            onPointerEnter={() => setLit(id)} onPointerLeave={() => setLit(null)} onFocus={() => setLit(id)} onBlur={() => setLit(null)}
            style={{ '--path-ink': PILLAR_LOGOS[id].tint, '--path-order': index } as React.CSSProperties}>
            <span className="mosaic-path-number" aria-hidden="true">0{index + 1}</span>
            <span className="mosaic-path-reach" aria-hidden="true">{ACTIVITIES.filter(activity => activity.pillarId === id).length} {id === 'projects' ? getCMSCopy('copy.MosaicOverture.count-projects', 'projects') : getCMSCopy('copy.MosaicOverture.count-programmes', 'programmes')}</span>
            <svg viewBox="0 0 146 120" className="mosaic-path-icon" aria-hidden="true">{PILLAR_LOGOS[id].paths.map(d => <path key={d} d={d} />)}</svg>
            <span className="mosaic-path-copy"><strong>{PILLAR_LOGOS[id].label}</strong><span>{detail}</span></span>
            <ArrowUpRight className="mosaic-path-arrow" size={18} aria-hidden="true" />
          </button>
        ))}
      </nav>
      <div className="mosaic-overture-foot">
        <p>{getCMSCopy('copy.ImpactMosaic.c18aacd51665', 'Every figure below is as the foundation reports it.')}</p>
        {onScrollOn
          ? <button type="button" className="mosaic-scroll-cue" onClick={onScrollOn}>{getCMSCopy('copy.MosaicOverture.scroll', 'Scroll to explore')} <ArrowDown size={14} aria-hidden="true" /></button>
          : <span className="mosaic-scroll-cue">{getCMSCopy('copy.MosaicOverture.scroll', 'Scroll to explore')} <ArrowDown size={14} aria-hidden="true" /></span>}
      </div>
    </header>
  );
}
