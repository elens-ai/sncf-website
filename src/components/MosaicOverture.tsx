import React, { useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { PETAL_ART, PALM_ART } from './petalArt';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import { ACTIVITIES } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { MOSAIC_WALL } from './mosaicWallTiles';
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

export function MosaicOverture({ onChoose }: { onChoose: (pillar: MosaicPillar) => void }) {
  const [lit, setLit] = useState<MosaicPillar | null>(null);
  const title = getCMSCopy('copy.ImpactMosaic.eee670c33892', 'Four paths. One purpose.');
  const lines = title.match(/^(.+?[.!?])\s+(.+)$/);
  return (
    <header className="mosaic-overture" data-state="active">
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
              <img key={piece.id} className="mosaic-petal" data-piece={piece.id} src={resolveCMSMedia(piece.src)} alt="" draggable={false}
                style={{
                  left: `${(piece.x - box.x) / width * 100}%`, top: `${(piece.y - box.y) / height * 100}%`, width: `${piece.w / width * 100}%`,
                  '--fan-x': (index - 2) * 24, '--fan-turn': (index - 2) * 18,
                } as React.CSSProperties} />
            ))}
          </div>
          <span className="mosaic-emblem-light" />
        </div>
        <div className="mosaic-overture-copy">
          <p className="mosaic-overture-eyebrow"><span aria-hidden="true" />{getCMSCopy('copy.ImpactMosaic.fc967e87a6e8', 'Our work')}</p>
          <h2 className="mosaic-overture-title">
            <span>{lines ? lines[1] : title}</span>
            {lines && <span className="font-dancing-script">{lines[2]}</span>}
          </h2>
          <p className="mosaic-overture-lead">{getCMSCopy('copy.MosaicOverture.purpose', 'A helping hand. An open door. A greener tomorrow. Together, we make a difference.')}</p>
        </div>
      </div>
      <nav className="mosaic-paths" aria-label="Explore our four pillars">
        {paths().map(({ id, detail }, index) => (
          <button type="button" key={id} className="mosaic-path" onClick={() => onChoose(id)} aria-label={`View ${PILLAR_LOGOS[id].label} programmes`}
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
        <span className="mosaic-scroll-cue">Scroll to explore <ArrowDown size={14} aria-hidden="true" /></span>
      </div>
    </header>
  );
}
