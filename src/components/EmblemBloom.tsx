import React, { useCallback, useRef, useState } from 'react';
import { resolveCMSMedia } from '../cms/media';
import type { Activity } from '../data/activities';
import { DEPTH_TINT, PILLAR_LOGOS, PROJECTS_CENTRE, PROJECTS_HUB_R, PROJECTS_SCALE } from './pillarLogoArt';
import { PROJECTS_FIVE_BOXES } from './projectsLogoOutline';
import { ContourEdge, EMBLEM, EmblemDepth, ShowcaseBar, at, contourMask, dealSnaps, place, useAutoAdvance, useShowcase } from './emblemShowcase';
import './emblem-bloom.css';

/* AN EMBLEM IN BLOOM. Each part of the emblem (a petal of the Projects bloom,
   a leaf of Heal's, Empower's head and body) holds a photograph of the work.
   Every few seconds the photographs move one part on: each new one opens out
   across its part from the emblem's heart (the Projects badge, the point
   where Heal's leaves meet, Empower's chest), part after part, and the part
   swells a little as it fills. A ring turns slowly about the Projects badge.
   A click on the emblem moves it on. */

export type BloomEmblem = 'heal' | 'empower' | 'projects';

interface Bloom {
  /** Each part's bounds, in emblem units, measured from its contour. */
  boxes: readonly (readonly number[])[];
  /** Where the photographs open from. */
  heart: readonly [number, number];
  /** The order the parts open in; the first names the programme beneath. */
  order: readonly number[];
  /** The foundation's badge at the heart (the Projects emblem's own), at this scale, on a pale hub of this radius
      beneath the parts (which fills the gaps between the petals' curled bases and the badge). */
  badge?: { scale: number; hub: number };
}

const BLOOMS: Record<BloomEmblem, Bloom> = {
  /* round the emblem from the large leaf, opening from where the leaves meet */
  heal: { boxes: [[63.18, 5.66, 73.74, 64.86], [5.08, 21.73, 54.25, 48.35], [63.2, 74.16, 27.7, 24.88], [20.11, 74.58, 39.19, 35.43]], heart: [61.2, 72.3], order: [0, 2, 3, 1] },
  /* the body, then the head, opening from the chest */
  empower: { boxes: [[52.35, 5.36, 34.04, 34.06], [2.4, 7.22, 133.76, 99.16]], heart: [69.4, 56], order: [1, 0] },
  /* the five petals round from the top, opening from the badge */
  projects: { boxes: PROJECTS_FIVE_BOXES, heart: PROJECTS_CENTRE, order: [0, 1, 2, 3, 4], badge: { scale: PROJECTS_SCALE, hub: PROJECTS_HUB_R } },
};
/* The badge at the bloom's heart (ProjectsMosaicArt draws the same). */
const BADGE_R = 16.8;
const OPEN_MS = 1300;
const PART_STAGGER_MS = 180;
const DWELL_MS = 2600;

/* where the heart falls in a part's photograph, as a CSS position */
const fromHeart = ([hx, hy]: readonly [number, number], [x, y, w, h]: readonly number[]) => `${((hx - x) / w) * 100}% ${((hy - y) / h) * 100}%`;

export const EmblemBloom: React.FC<{ emblem: BloomEmblem; activities: Activity[]; caption: string; label: string }> = ({ emblem, activities, caption, label }) => {
  const { boxes, heart, order, badge } = BLOOMS[emblem];
  const logo = PILLAR_LOGOS[emblem];
  const snaps = dealSnaps(activities);
  const n = snaps.length;
  const root = useRef<HTMLElement>(null);
  const { still, held, toggleHeld, playing, hold } = useShowcase(root, n);
  /* Part p shows photograph (step + its place in the order) mod n; `was` is the step before. */
  const [bloom, setBloom] = useState({ step: 0, was: -1 });
  const lastMove = useRef(0);
  const shown = (step: number, part: number) => (((step + order.indexOf(part)) % n) + n) % n;

  const move = useCallback((dir: 1 | -1) => {
    if (n < 2) return;
    const now = performance.now();
    if (now - lastMove.current < 420) return;
    lastMove.current = now;
    setBloom(b => ({ step: b.step + dir, was: b.step }));
  }, [n]);

  useAutoAdvance(() => move(1), DWELL_MS + (bloom.was >= 0 ? OPEN_MS : 0), playing, bloom.step);

  const lead = n ? snaps[shown(bloom.step, order[0])] : undefined;
  return (
    <figure ref={root} className="showcase emblem-bloom" data-emblem={emblem} aria-label={label} data-playing={playing}>
      <div className="showcase-stage" {...hold} onClick={() => move(1)} role="img" aria-label={lead?.alt ?? label}
        style={{ '--open-ms': `${OPEN_MS}ms` } as React.CSSProperties}>
        <EmblemDepth paths={logo.paths} tint={DEPTH_TINT[emblem] ?? logo.tint} edge={logo.edge} />
        {badge && (
          <svg className="bloom-hub" viewBox={`0 0 ${EMBLEM.w} ${EMBLEM.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <circle cx={heart[0]} cy={heart[1]} r={badge.hub} fill="#f4fcf8" />
          </svg>
        )}
        {logo.paths.map((d, part) => {
          const box = boxes[part], opening = bloom.was >= 0 && n > 1;
          return (
            /* keyed by the step, so that each move opens (and swells) afresh */
            <div key={`${d}-${bloom.step}`} className="bloom-part" data-opening={opening || undefined}
              style={{ ...contourMask([d]), transformOrigin: at(heart[0], heart[1]), '--delay': `${order.indexOf(part) * PART_STAGGER_MS}ms` } as React.CSSProperties}>
              {/* the photograph it showed, under the one opening over it */}
              {opening && <img className="showcase-photo" src={snaps[shown(bloom.was, part)].src} alt="" decoding="async" draggable={false} style={place(box)} />}
              {n > 0 && <img className="showcase-photo bloom-opening" src={snaps[shown(bloom.step, part)].src} alt="" decoding="async" draggable={false}
                style={{ ...place(box), '--from': fromHeart(heart, box) } as React.CSSProperties} />}
              <span className="showcase-glaze" />
              <ContourEdge paths={[d]} />
            </div>
          );
        })}
        {badge && (
          <svg className="bloom-badge" viewBox={`0 0 ${EMBLEM.w} ${EMBLEM.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <circle className="bloom-ring" cx={heart[0]} cy={heart[1]} r={(BADGE_R + 2.6) * badge.scale} pathLength="100" />
            <circle cx={heart[0]} cy={heart[1]} r={BADGE_R * badge.scale} fill="#f4fcf8" stroke="#fff" strokeWidth=".5" />
            <image href={resolveCMSMedia('/images/sncf-logo.webp')} x={heart[0] - 16.32 * badge.scale} y={heart[1] - 16.32 * badge.scale} width={32.64 * badge.scale} height={32.64 * badge.scale} preserveAspectRatio="xMidYMid meet" />
          </svg>
        )}
      </div>
      <ShowcaseBar snap={lead} caption={caption} still={still} held={held} onHold={toggleHeld}
        onPrevious={() => move(-1)} onNext={() => move(1)} canPrevious={n > 1} canNext={n > 1} />
    </figure>
  );
};
