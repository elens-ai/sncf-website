import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, CalendarDays, Pause, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { PETAL_ART, PALM_ART, PALM_TOP_ART, LOGO_COLOURS, logoInkSrc } from './petalArt';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import { PillarMarkShapes } from './PillarMark';
import { PILLARS } from '../data/pillars';
import { MOSAIC_WALL } from './mosaicWallTiles';
import { easeOut } from '../utils/waves';
import { usePerfTier } from '../hooks/usePerfTier';
import './mosaic-overture.css';

// Keep every piece in the foundation artwork's original proportions.
// The flower between two hands, as in the seal: the palm beneath it, and the same hand turned over above,
// the two on one line (the hand above drawn over the same span as the one below) and the flower centred
// between them, so its petals rise from the middle of the cupped palms rather than off to one side.
const palmCentre = PALM_ART.x + PALM_ART.w / 2;
const flowerCentre = (Math.min(...PETAL_ART.map(p => p.x)) + Math.max(...PETAL_ART.map(p => p.x + p.w))) / 2;
const pieces = [
  ...PETAL_ART.map(petal => ({ ...petal, x: petal.x + palmCentre - flowerCentre })),
  { id: 'palm', ...PALM_ART },
  { id: 'palm-top', ...PALM_TOP_ART, x: PALM_ART.x },
];
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

/* The doors take turns every few seconds and the wall lights each one's photographs: only the wall's data-lit
   changes then, so its 240 tiles are made once and kept, rather than made again (and compared) at every turn. */
const MosaicWall = React.memo(function MosaicWall({ lit }: { lit: MosaicPillar | null }) {
  const columns = useMemo(() => wallColumns.map((column, c) => (
    <div key={c} className="mosaic-wall-col" style={{ '--wall-time': `${84 + (c % 4) * 17}s`, '--wall-delay': `${-c * 13}s` } as React.CSSProperties}>
      {[...column, ...column].map((t, k) => {
        const pillar = MOSAIC_WALL.tiles[t];
        return <i key={k} data-pillar={pillar} style={{ backgroundPosition: tileAt(t), '--tile-light': PILLARS.find(item => item.id === pillar)?.accentB } as React.CSSProperties} />;
      })}
    </div>
  )), [PILLARS]);
  return (
    <div className="mosaic-wall" data-lit={lit ?? undefined} aria-hidden="true"
      style={{ '--wall-sprite': `url(${resolveCMSMedia(MOSAIC_WALL.src)})`, '--sprite-cols': MOSAIC_WALL.cols, '--sprite-rows': MOSAIC_WALL.rows } as React.CSSProperties}>
      {columns}
    </div>
  );
});

/* THE ASSEMBLY, over a little more than two seconds once it is told to play:
   a cupped hand, then the centre petal, then the mirrored pairs unfolding, the
   light rising with them, then the words, then the doors. Written
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
        /* the hand above comes down last, closing over the opened flower */
        const over = petal.dataset.piece === 'palm-top';
        const start = palm ? 0 : over ? .5 : .13 + Math.abs(index - 2) * .085;
        const t = clamp01((o - start) / (palm ? .38 : over ? .42 : .48));
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
    handed the door it was chosen from), or on a phone lights that path's
    photographs, and the cue at its foot carries on down the page. */
export function MosaicOverture({ onChoose, play = true, heading = 'h2', onScrollOn, onReplayIntro }: {
  onChoose: (pillar: MosaicPillar, from: HTMLElement) => void;
  /** Starts the emblem assembling and the words and doors arriving. */
  play?: boolean;
  /** h1 where the overture opens the page. */
  heading?: 'h1' | 'h2';
  /** Where "Scroll to explore" goes when it is pressed. */
  onScrollOn?: () => void;
  /** Plays the welcome introduction again (the landing's foot, beside the cue). */
  onReplayIntro?: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useAssembly(root, play);
  const [selected, setLit] = useState<MosaicPillar | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [calm, setCalm] = useState(false);
  const lit = selected ?? paths()[autoIndex].id;
  /* A device with least to spare (utils/perfTier) is not walked through the doors: the first stays lit and the
     wall still, and a door pointed at or tapped still lights its photographs. */
  const still = usePerfTier() === 'low';
  const rotating = play && visible && !paused && !selected && !calm && !still;
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => {
      const bounds = root.current?.getBoundingClientRect();
      setVisible(!document.hidden && !!bounds && bounds.bottom > 0 && bounds.top < innerHeight);
      setCalm(query.matches);
    };
    const observer = new IntersectionObserver(read);
    if (root.current) observer.observe(root.current);
    read();
    document.addEventListener('visibilitychange', read);
    query.addEventListener('change', read);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', read); query.removeEventListener('change', read); };
  }, []);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setAutoIndex(index => (index + 1) % 4), 2750);
    return () => clearTimeout(timer);
  }, [rotating, autoIndex]);
  /* Where a cursor exists a door leads on, its photographs lit as it is pointed at; on a touch screen (a phone) a
     tap only lights them, and the visitor stays where they are. */
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setCursor(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const Title = heading;
  const title = getCMSCopy('copy.ImpactMosaic.eee670c33892', 'Different paths. One purpose.');
  const lines = title.match(/^(.+?[.!?])\s+(.+)$/);
  /* the motto in two voices: what we serve, then how, in the signature hand */
  const motto = getCMSCopy('copy.MosaicOverture.purpose', 'Service to humanity, Service with Humility').replace(/\bhumility\b/g, 'Humility');
  const mottoParts = motto.match(/^(.+?,)\s*(.+)$/);
  /* each path's colour, for the words to take when a door is pointed at
     (and, while none is, to pass through slowly) */
  const accent = (id: MosaicPillar) => PILLARS.find(item => item.id === id)?.accentA ?? PILLAR_LOGOS[id].tint;
  const inks = Object.fromEntries(paths().map(({ id }) => [`--ink-${id}`, accent(id)]));
  return (
    <header ref={root} className="mosaic-overture" data-state="active" data-lit={lit ?? undefined}
      style={{ ...inks, '--lit-accent': lit ? accent(lit) : undefined } as React.CSSProperties}>
      <MosaicWall lit={lit} />
      <div className="mosaic-overture-composition">
        <div className="mosaic-emblem" aria-hidden="true">
          <div className="mosaic-lotus" style={{ '--lotus-aspect': width / height } as React.CSSProperties}>
            {pieces.map((piece, index) => (
              <img key={piece.id} className="mosaic-petal" data-piece={piece.id} src={resolveCMSMedia(logoInkSrc(piece.id === 'palm-top' ? 'palm' : piece.id))} alt="" draggable={false}
                style={{
                  left: `${(piece.x - box.x) / width * 100}%`, top: `${(piece.y - box.y) / height * 100}%`, width: `${piece.w / width * 100}%`,
                  '--fan-x': (index - 2) * 24, '--fan-turn': (index - 2) * 18,
                  '--ink': index >= PETAL_ART.length ? LOGO_COLOURS.hand[1] : LOGO_COLOURS.petals[index],
                } as React.CSSProperties} />
            ))}
          </div>
          <span className="mosaic-emblem-light" />
        </div>
        <div className="mosaic-overture-copy">
          <Title className="mosaic-overture-title">
            <span>{lines ? lines[1] : title}</span>
            {lines && <span className="font-dancing-script">{lines[2]}</span>}
          </Title>
          <p className="mosaic-overture-lead">{mottoParts ? <>{mottoParts[1]} <span className="mosaic-overture-sign font-signature">{mottoParts[2].split(/(Humility)/).map((part, index) => part === 'Humility' ? <span key={index} className="mosaic-humility-word">{part}</span> : part)}</span></> : motto}</p>
          {/* the service journal: camps, drives and observances, on a page of its own */}
          <Link to="/events" className="mosaic-overture-events">
            <CalendarDays size={16} aria-hidden="true" />{getCMSCopy('copy.MosaicOverture.events', 'Event info')}<ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <nav className="mosaic-paths" aria-label="Explore our four pillars">
        {paths().map(({ id, detail }, index) => (
          <button type="button" key={id} className="mosaic-path" data-active={lit === id} onClick={event => (cursor ? onChoose(id, event.currentTarget) : setLit(id))}
            aria-label={`${cursor ? `${getCMSCopy('copy.MosaicOverture.enter', 'Enter')} ` : ''}${PILLAR_LOGOS[id].label}: ${detail}`} aria-pressed={cursor ? undefined : lit === id}
            onPointerEnter={event => { if (event.pointerType !== 'touch') setLit(id); }} onPointerLeave={event => { if (event.pointerType !== 'touch') setLit(null); }}
            onFocus={() => setLit(id)} onBlur={() => setLit(null)}
            style={{ '--path-ink': PILLAR_LOGOS[id].tint, '--path-accent': accent(id), '--path-order': index } as React.CSSProperties}>
            {/* Projects by the Projects page's own bloom, and Enrich by its 3D book (white pages in a teal cover), each in
                its colours; Heal and Empower by their marks */}
            {id === 'projects' || id === 'enrich'
              ? <img className="mosaic-path-icon mosaic-path-art" data-art={id} alt="" draggable={false}
                  src={id === 'projects' ? resolveCMSAsset("asset.projects.bloom", "/images/projects-bloom.png?v=balanced") : resolveCMSAsset("asset.MosaicOverture.enrich-book", "/images/emblem-marks/enrich-book.webp")} />
              : <svg viewBox="0 0 146 120" className="mosaic-path-icon" aria-hidden="true"><PillarMarkShapes pillar={id} /></svg>}
            <span className="mosaic-path-copy"><strong>{PILLAR_LOGOS[id].label}</strong><span>{detail}</span></span>
            {lit === id && <span key={`${id}-${rotating}`} className="mosaic-path-progress" data-running={rotating} aria-hidden="true"><i /></span>}
          </button>
        ))}
      </nav>
      <div className="mosaic-overture-foot">
        {onReplayIntro && <button type="button" className="mosaic-intro-replay" onClick={onReplayIntro}>{getCMSCopy('copy.MosaicOverture.replay', 'Replay introduction')} <RotateCcw size={13} aria-hidden="true" /></button>}
        {!calm && <button type="button" className="mosaic-rotation-pause" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume pillar rotation' : 'Pause pillar rotation'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>}
        {onScrollOn
          ? <button type="button" className="mosaic-scroll-cue" onClick={onScrollOn}>{getCMSCopy('copy.MosaicOverture.scroll', 'Scroll to explore')} <ArrowDown size={14} aria-hidden="true" /></button>
          : <span className="mosaic-scroll-cue">{getCMSCopy('copy.MosaicOverture.scroll', 'Scroll to explore')} <ArrowDown size={14} aria-hidden="true" /></span>}
      </div>
    </header>
  );
}
