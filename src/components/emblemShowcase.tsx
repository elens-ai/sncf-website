import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { Activity } from '../data/activities';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './emblem-showcase.css';

/* WHAT THE ANIMATED EMBLEMS SHARE (EmblemBloom's Heal, Empower and Projects;
   the Enrich scrapbook keeps its own book). Each draws its emblem in the
   shared 146 × 120 emblem box of pillarLogoArt, each part of the emblem an
   HTML layer cut to its contour by a mask, so the parts can move in 3D as the
   scrapbook's pages do. Each shows the foundation's photographs of a
   pillar's (or a project's) programmes, names the programme in view beneath
   with one of its figures, and moves on by itself while on screen: not while
   pointed at or paused, and only when asked with reduced motion. */

/** A programme's photograph, with one of its figures. */
export interface Snap { src: string; alt: string; programme: string; value: string; label: string }

/* The programmes' photographs dealt out in turn, so that neighbouring frames
   show different programmes; each is noted with one of its programme's
   figures (a lone "1" reads oddly against a plural label, so not those). */
export const dealSnaps = (activities: Activity[]): Snap[] => {
  const hands = activities.map(activity => {
    const counted = (activity.dataPoints ?? []).filter(point => point.value.trim() !== '1');
    const figures = counted.length ? counted : [activity.headline];
    return (activity.images ?? []).map((image, i) => ({
      src: resolveCMSMedia(image.src),
      alt: image.alt,
      programme: activity.menuLabel ?? activity.title,
      value: figures[i % figures.length].value,
      label: figures[i % figures.length].label,
    }));
  });
  const snaps: Snap[] = [];
  for (let round = 0; hands.some(hand => round < hand.length); round++) {
    for (const hand of hands) if (round < hand.length) snaps.push(hand[round]);
  }
  return snaps;
};

/** The shared emblem box, in emblem units. */
export const EMBLEM = { w: 146, h: 120 };
const pct = (value: number, whole: number) => `${(value / whole) * 100}%`;
/** A box in emblem units, placed absolutely in % of the emblem box. */
export const place = ([x, y, w, h]: readonly number[]): React.CSSProperties => ({
  left: pct(x, EMBLEM.w), top: pct(y, EMBLEM.h), width: pct(w, EMBLEM.w), height: pct(h, EMBLEM.h),
});
/** A point in emblem units as a CSS position over the emblem box. */
export const at = (x: number, y: number) => `${pct(x, EMBLEM.w)} ${pct(y, EMBLEM.h)}`;
/** Contours as a CSS mask stretched over the whole emblem box. */
export const contourMask = (paths: readonly string[]): React.CSSProperties => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${EMBLEM.w} ${EMBLEM.h}' preserveAspectRatio='none'>${paths.map(d => `<path d='${d}'/>`).join('')}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { WebkitMaskImage: url, maskImage: url };
};

/** The emblem's thickness beneath its photographs: its contours stacked a
    little down and to the left, as the home page's emblems are. */
export const EmblemDepth: React.FC<{ paths: readonly string[]; tint: string; edge: string }> = ({ paths, tint, edge }) => (
  <svg className="showcase-depth" viewBox={`0 0 ${EMBLEM.w} ${EMBLEM.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {[6, 5, 4, 3, 2, 1].map(layer => (
      <g key={layer} transform={`translate(${-layer * 0.24} ${layer * 0.38})`} fill={layer > 4 ? '#234a4c' : tint}>
        {paths.map(d => <path key={d} d={d} />)}
      </g>
    ))}
    <g transform="translate(-0.25 0.4)" fill={edge}>{paths.map(d => <path key={d} d={d} />)}</g>
    {/* the bed each part rests in, seen while it turns */}
    <g fill={tint}>{paths.map(d => <path key={d} d={d} />)}</g>
  </svg>
);

/** A contour's own fine edge, drawn over a part so that it turns with it. */
export const ContourEdge: React.FC<{ paths: readonly string[] }> = ({ paths }) => (
  <svg className="showcase-edge" viewBox={`0 0 ${EMBLEM.w} ${EMBLEM.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {paths.map(d => <path key={d} d={d} />)}
  </svg>
);

/** Whether an emblem moves on by itself, and the hold that pointing at it gives. */
export function useShowcase(root: React.RefObject<HTMLElement | null>, count: number) {
  const still = useReducedMotion() ?? false;
  const onScreen = useSectionActivity(root);
  const [held, setHeld] = useState(false);
  const [pointing, setPointing] = useState(false);
  /* Touch screens report a pointer entering on every tap and never leaving. */
  const canHover = useMemo(() => window.matchMedia('(hover: hover)').matches, []);
  return {
    still,
    held,
    toggleHeld: () => setHeld(value => !value),
    playing: !still && !held && !pointing && onScreen && count > 1,
    hold: canHover ? { onPointerEnter: () => setPointing(true), onPointerLeave: () => setPointing(false) } : {},
  };
}

/** Calls `advance` `ms` after each change of `step`, while playing. */
export function useAutoAdvance(advance: () => void, ms: number, playing: boolean, step: unknown) {
  const latest = useRef(advance);
  latest.current = advance;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => latest.current(), ms);
    return () => window.clearTimeout(timer);
  }, [playing, ms, step]);
}

/** Beneath an emblem: the programme in view and its figure, then the line
    that credits the photographs and the controls. */
export const ShowcaseBar: React.FC<{
  snap?: Snap;
  caption: string;
  still: boolean;
  held: boolean;
  onHold: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}> = ({ snap, caption, still, held, onHold, onPrevious, onNext, canPrevious, canNext }) => {
  const c = (key: string, fallback: string) => getCMSCopy(`copy.EmblemShowcase.${key}`, fallback);
  return (
    <figcaption className="showcase-bar">
      {snap && (
        <p className="showcase-spot" key={`${snap.programme}-${snap.src}`}>
          <span className="showcase-programme">{snap.programme}</span>
          <span className="showcase-figure"><strong>{snap.value}</strong> {snap.label}</span>
        </p>
      )}
      <span className="showcase-foot">
        <span className="showcase-credit">{caption}</span>
        <span className="showcase-controls">
          <button type="button" onClick={onPrevious} disabled={!canPrevious} aria-label={c('previous', 'Previous photograph')} title={c('previous', 'Previous photograph')}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {!still && (
            <button type="button" onClick={onHold} aria-label={held ? c('play', 'Play') : c('pause', 'Pause')} title={held ? c('play', 'Play') : c('pause', 'Pause')}>
              {held ? <Play size={12} fill="currentColor" aria-hidden="true" /> : <Pause size={12} fill="currentColor" aria-hidden="true" />}
            </button>
          )}
          <button type="button" onClick={onNext} disabled={!canNext} aria-label={c('next', 'Next photograph')} title={c('next', 'Next photograph')}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </span>
      </span>
    </figcaption>
  );
};
