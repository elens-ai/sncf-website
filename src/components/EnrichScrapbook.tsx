import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { Activity } from '../data/activities';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { BOOK_COVER, PILLAR_LOGOS } from './pillarLogoArt';
import './enrich-scrapbook.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.EnrichScrapbook.${key}`, fallback);

/* THE ENRICH EMBLEM AS A SCRAPBOOK. The emblem's open book, its pages and
   cover traced exactly, holds the foundation's own photographs of its
   schools, scholarships and skill centres, one to a page: each print taped
   in at a tilt, labelled by hand with its programme, with one of that
   programme's figures noted beneath. The pages turn by themselves, a leaf at
   a time; from the last page the book riffles back to the first and begins
   again.

   The leaves are 3D sheets hinged on the spine, a photograph on either side,
   stacked a fraction apart: the next leaf always lies on top on the right,
   and the last one turned on top on the left, as in a real book. Pointing at
   the book holds it, and pointing at a page lifts its top leaf a little to
   invite a click. A click on the right page turns one leaf on, on the left
   page one leaf back, as do the arrows beneath; clicked quickly, the leaves
   follow one another rather than flying together. Turning a page by hand
   stops the book turning by itself (the play button starts it again). With
   reduced motion the pages turn only when asked, and without moving. */

/* Geometry, in the emblem's own units (pillarLogoArt). Both page boxes are as
   wide as the right page, so a leaf turned over lands exactly on the left. */
const [LEFT_PAGE, RIGHT_PAGE] = PILLAR_LOGOS.enrich.paths;
const SPINE = 72;
const PAGE_W = 54;
const LEFT_X = SPINE - PAGE_W;
const PAGE_TOP = 8;
const PAGE_H = 86;
/* The whole book, its cover included. */
const VIEW = { x: 2, y: 2, w: 142, h: 108 };

const percent = (value: number, whole: number) => `${(value / whole) * 100}%`;
const pageBox = (x: number): React.CSSProperties => ({
  left: percent(x - VIEW.x, VIEW.w),
  top: percent(PAGE_TOP - VIEW.y, VIEW.h),
  width: percent(PAGE_W, VIEW.w),
  height: percent(PAGE_H, VIEW.h),
});
/* Each page is cut to the emblem's outline by a mask stretched over its box. */
const pageCut = (d: string, x: number): React.CSSProperties => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${x} ${PAGE_TOP} ${PAGE_W} ${PAGE_H}' preserveAspectRatio='none'><path d='${d}'/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { WebkitMaskImage: url, maskImage: url };
};
const SIDES = {
  left: { d: LEFT_PAGE, x: LEFT_X, cut: pageCut(LEFT_PAGE, LEFT_X) },
  right: { d: RIGHT_PAGE, x: SPINE, cut: pageCut(RIGHT_PAGE, SPINE) },
};
type Side = keyof typeof SIDES;

/* A leaf turned by hand; the look at each spread; the last spread's pause
   before the riffle; and the riffle, leaf after leaf. */
const TURN_MS = 950;
const DWELL_MS = 3000;
const END_HOLD_MS = 2400;
const RIFFLE_MS = 620;
const RIFFLE_STAGGER_MS = 70;
/* Leaves turned one after another the same way start this far into the turn
   before them, once it has lifted clear (edge-on comes at 38% of a turn). */
const FOLLOW_MS = TURN_MS * 0.45;
/* How far apart the stacked leaves lie. */
const LEAF_GAP_PX = 0.25;

interface Snap { src: string; alt: string; programme: string; value: string; label: string }
interface Move { dir: 'forward' | 'back'; key: number; delay: number; ms: number }
/* The shadow a turning leaf casts: lifting off the page it uncovers, and
   coming down on the page it covers. */
interface Cast { kind: 'reveal' | 'cover'; key: number; delay: number }

/* The programmes' photographs dealt out in turn, so that neighbouring pages
   show different programmes; each is noted with one of its programme's
   figures (a lone "1" reads oddly against a plural label, so not those). */
const dealSnaps = (activities: Activity[]): Snap[] => {
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

const PageEdge: React.FC<{ side: Side }> = ({ side }) => (
  <svg className="scrapbook-edge" viewBox={`${SIDES[side].x} ${PAGE_TOP} ${PAGE_W} ${PAGE_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d={SIDES[side].d} />
  </svg>
);

const CastShadow: React.FC<{ cast?: Cast }> = ({ cast }) =>
  cast ? <span key={cast.key} className="scrapbook-cast" data-cast={cast.kind} style={{ '--cast-delay': `${cast.delay}ms` } as React.CSSProperties} aria-hidden="true" /> : null;

/** One side of a leaf: a print taped in, its label, a note and the folio. */
const Page: React.FC<{ side: Side; face: 'front' | 'back'; snap?: Snap; folio: number; load: boolean; shade?: number; cast?: Cast }> = ({ side, face, snap, folio, load, shade, cast }) => (
  <div className={`scrapbook-page scrapbook-${face}`} data-side={side} data-look={folio % 4} style={SIDES[side].cut}>
    {snap && <>
      <div className="scrapbook-snap">
        <span className="scrapbook-tape" aria-hidden="true" />
        <span className="scrapbook-tape" aria-hidden="true" />
        <div className="scrapbook-print">{load && <img src={snap.src} alt={snap.alt} decoding="async" draggable={false} />}</div>
        <span className="scrapbook-label" data-long={snap.programme.length > 20 || undefined}>{snap.programme}</span>
      </div>
      <p className="scrapbook-note">
        <svg className="scrapbook-doodle" viewBox="0 0 24 18" aria-hidden="true" focusable="false"><path d="M3 16C5 9 10 5 19 4.5M15 1.5l4.2 3-3.4 3.6" /></svg>
        <strong>{snap.value}</strong> {snap.label}
      </p>
    </>}
    <span className="scrapbook-folio" aria-hidden="true">{folio}</span>
    <PageEdge side={side} />
    <CastShadow cast={cast} />
    {/* the side of a turning leaf that faces away from the light */}
    <span key={shade} className="scrapbook-shade" aria-hidden="true" />
  </div>
);

export const EnrichScrapbook: React.FC<{ activities: Activity[]; name: string; motto: string; caption?: string }> = ({ activities, name, motto, caption }) => {
  const snaps = dealSnaps(activities);
  const leaves = Array.from({ length: Math.ceil(snaps.length / 2) }, (_, i) => ({ front: snaps[2 * i], back: snaps[2 * i + 1] }));
  const count = leaves.length;
  const [turned, setTurned] = useState(0);
  /* The leaves in the air: each turn's entry is cleared once it lands. */
  const [moves, setMoves] = useState<Record<number, Move>>({});
  /* How many leaves lay on the left once the last turn landed: a leaf leaves
     its stack as it lifts, and joins the other as it comes down. */
  const [landed, setLanded] = useState(0);
  /* How long the last turn takes, so that the next look begins once it settles. */
  const [settling, setSettling] = useState(0);
  /* Leaves whose photographs are wanted: those showing, and the next beneath. */
  const [wanted, setWanted] = useState(2);
  const [held, setHeld] = useState(false);
  const [pointing, setPointing] = useState(false);
  /* The page the pointer is over, whose top leaf lifts to invite a click. */
  const [hover, setHover] = useState<Side | null>(null);
  /* The last leaf turned by itself (a riffle casts no shadows), counted so each turn's shadow plays afresh. */
  const [lastTurn, setLastTurn] = useState<{ leaf: number; forward: boolean; key: number; delay: number } | null>(null);
  const turns = useRef(0);
  /* When the last single turn began, and which way, so the next the same way can follow it. */
  const lastStart = useRef({ at: -Infinity, forward: true });
  const landings = useRef<number[]>([]);
  const still = useReducedMotion() ?? false;
  const root = useRef<HTMLElement>(null);
  const onScreen = useSectionActivity(root);
  const ids = useId().replace(/:/g, '');
  /* Touch screens report a pointer entering on every tap and never leaving. */
  const canHover = useMemo(() => window.matchMedia('(hover: hover)').matches, []);
  const playing = !still && !held && !pointing && onScreen && count > 0;
  const inAir = Object.keys(moves).length > 0;
  useEffect(() => () => landings.current.forEach(window.clearTimeout), []);

  const turnTo = useCallback((target: number) => {
    const to = Math.max(0, Math.min(count, target));
    if (to === turned) return;
    const forward = to > turned;
    const moving = Array.from({ length: Math.abs(to - turned) }, (_, k) => (forward ? turned + k : to + k));
    const riffle = moving.length > 1;
    /* a leaf turned the same way as one still lifting waits until that one is clear */
    const now = performance.now();
    const wait = !riffle && lastStart.current.forward === forward ? Math.max(0, Math.round(lastStart.current.at + FOLLOW_MS - now)) : 0;
    lastStart.current = riffle ? { at: -Infinity, forward } : { at: now + wait, forward };
    const delayOf = (i: number) => (riffle
      /* riffling back, the top leaf of the left stack goes first */
      ? (forward ? i - turned : turned - 1 - i) * RIFFLE_STAGGER_MS
      : wait);
    const ms = riffle ? RIFFLE_MS : TURN_MS;
    const keys: Record<number, number> = {};
    setMoves(previous => {
      const next = { ...previous };
      for (const i of moving) {
        keys[i] = (previous[i]?.key ?? 0) + 1;
        next[i] = { dir: forward ? 'forward' : 'back', key: keys[i], delay: delayOf(i), ms };
      }
      return next;
    });
    const settles = Math.max(...moving.map(delayOf)) + ms;
    /* once down, the leaves leave the air (unless turned again meanwhile) and join their stack */
    const landing = window.setTimeout(() => {
      landings.current = landings.current.filter(timer => timer !== landing);
      setMoves(previous => {
        const next = { ...previous };
        for (const i of moving) if (next[i]?.key === keys[i]) delete next[i];
        return next;
      });
      setLanded(to);
    }, settles);
    landings.current.push(landing);
    setSettling(settles);
    turns.current += 1;
    setLastTurn(riffle ? null : { leaf: moving[0], forward, key: turns.current, delay: wait });
    setTurned(to);
    setWanted(n => Math.max(n, to + 2));
  }, [count, turned]);
  /* A page turned by hand: one leaf, and the book stops turning by itself. */
  const turnBy = (step: 1 | -1) => {
    setHeld(true);
    turnTo(turned + step);
  };

  /* A leaf's front lies on the next leaf's front, its back on the previous
     leaf's back (the inside covers stand in at either end): those are the
     pages its shadow falls on. */
  const castOn = (leaf: number, face: 'front' | 'back'): Cast | undefined => {
    if (!lastTurn || leaf !== lastTurn.leaf + (face === 'front' ? 1 : -1)) return undefined;
    const uncovered = face === 'front' ? lastTurn.forward : !lastTurn.forward;
    return { kind: uncovered ? 'reveal' : 'cover', key: lastTurn.key, delay: lastTurn.delay };
  };

  /* A page after each look; from the last spread, back to the first. */
  useEffect(() => {
    if (!playing) return;
    const atEnd = turned >= count;
    const timer = window.setTimeout(() => turnTo(atEnd ? 0 : turned + 1), settling + (atEnd ? END_HOLD_MS : DWELL_MS));
    return () => window.clearTimeout(timer);
  }, [playing, turned, count, settling, turnTo]);

  /* The thickness of the leaves on either side, under the pages. */
  const stack = (side: Side, edges: number) => Array.from({ length: edges }, (_, k) => edges - k).map(depth => (
    <path key={`${side}-${depth}`} className="scrapbook-stack" d={SIDES[side].d}
      transform={`translate(0 ${0.38 * depth})`} />
  ));

  return (
    <figure ref={root} className="enrich-scrapbook" style={{ '--turn-ms': `${TURN_MS}ms`, '--sb-teal': PILLAR_LOGOS.enrich.tint, '--sb-edge': PILLAR_LOGOS.enrich.edge } as React.CSSProperties} aria-label={c('label', 'Enrich: a scrapbook of the foundation’s schools, scholarships and skill centres')}>
      <div
        className="scrapbook-book"
        data-hover={hover && !inAir ? hover : undefined}
        onPointerEnter={canHover ? () => setPointing(true) : undefined}
        onPointerLeave={canHover ? () => setPointing(false) : undefined}
      >
        <svg className="scrapbook-binding" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} aria-hidden="true" focusable="false">
          <defs>
            <filter id={`${ids}-soft`} x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="1.4" /></filter>
          </defs>
          <ellipse className="scrapbook-ground" cx={SPINE} cy="105.6" rx="64" ry="2.4" filter={`url(#${ids}-soft)`} />
          <path d={BOOK_COVER} fill="#238fa7" transform="translate(-1 1.4)" />
          <path className="scrapbook-cover" d={BOOK_COVER} fill={PILLAR_LOGOS.enrich.tint} />
          {stack('left', Math.min(4, turned, landed))}
          {stack('right', Math.min(4, count - Math.max(turned, landed)))}
        </svg>
        <div className="scrapbook-stage" style={{ '--back': `${-(count + 1) * LEAF_GAP_PX}px` } as React.CSSProperties}>
          {/* the inside covers: a bookplate before the first page, a note after the last */}
          <div className="scrapbook-endpaper" data-side="left" style={{ ...pageBox(LEFT_X), ...SIDES.left.cut }}>
            <div className="scrapbook-bookplate">
              <span className="scrapbook-tape" aria-hidden="true" />
              <span className="scrapbook-bookplate-kicker">{c('kicker', 'Our scrapbook')}</span>
              <span className="scrapbook-bookplate-name">{name}</span>
              <span className="scrapbook-bookplate-motto">{motto}</span>
            </div>
            <PageEdge side="left" />
            <CastShadow cast={castOn(-1, 'back')} />
          </div>
          <div className="scrapbook-endpaper" data-side="right" style={{ ...pageBox(SPINE), ...SIDES.right.cut }}>
            <p className="scrapbook-closing">{c('closing', 'And the next page is still being written…')}</p>
            <PageEdge side="right" />
            <CastShadow cast={castOn(count, 'front')} />
          </div>
          {leaves.map((leaf, i) => {
            const move = moves[i];
            const top = i === turned ? 'right' : i === turned - 1 ? 'left' : undefined;
            return (
              <div
                key={i}
                className="scrapbook-leaf"
                data-moving={move?.dir}
                data-top={top}
                style={{
                  ...pageBox(SPINE),
                  '--turn': i < turned ? '-180deg' : '0deg',
                  /* its height above the endpapers: the next leaf highest on the right, the last turned on the left */
                  '--z': `${(i < turned ? i + 1 : count - i) * LEAF_GAP_PX}px`,
                  '--delay': `${move?.delay ?? 0}ms`,
                  '--ms': `${move?.ms ?? TURN_MS}ms`,
                } as React.CSSProperties}
              >
                <Page side="right" face="front" snap={leaf.front} folio={2 * i + 1} load={i < wanted} shade={move?.key} cast={castOn(i, 'front')} />
                <Page side="left" face="back" snap={leaf.back} folio={2 * i + 2} load={i < wanted} shade={move?.key} cast={castOn(i, 'back')} />
              </div>
            );
          })}
        </div>
        {/* Where a click turns a page: the left page one leaf back, the right
            page one leaf on. Plain boxes laid over the pages, so a click always
            lands, whatever the leaves are doing in 3D beneath. */}
        {(['left', 'right'] as const).map(side => {
          const canTurn = side === 'left' ? turned > 0 : turned < count;
          return (
            <div
              key={side}
              className="scrapbook-turn"
              data-side={side}
              data-can={canTurn || undefined}
              aria-hidden="true"
              style={pageBox(SIDES[side].x)}
              onClick={canTurn ? () => turnBy(side === 'left' ? -1 : 1) : undefined}
              onPointerEnter={canHover ? () => setHover(side) : undefined}
              onPointerLeave={canHover ? () => setHover(current => (current === side ? null : current)) : undefined}
            />
          );
        })}
      </div>
      {caption && <figcaption className="scrapbook-caption">
        <span>{caption}</span>
      </figcaption>}
    </figure>
  );
};
