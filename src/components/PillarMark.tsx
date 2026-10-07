import React, { useId } from 'react';
import {
  EMPOWER_COMPANIONS, EMPOWER_TRIO_MARK_FIT, PILLAR_LOGOS, PROJECTS_CENTRE, PROJECTS_HUB_R, PROJECTS_SCALE,
  companionTransform, projectsOver, projectsPetalTransform, type MosaicPillar,
} from './pillarLogoArt';
import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';

/* how far apart the Projects mark's petals are kept, in emblem units, where each tucks under the next */
const PETAL_GAP = 4.5;

/** A pillar's flat mark, drawn into a 146 × 120 emblem box (an svg's viewBox of 0 0 146 120) in the current
    fill: its logo's outline — or, for Empower, its figure among its two companions, faint, and parted from it
    by a sliver of space so the three stay legible however small the mark; or, for Projects, its five petals,
    each parted from the next where it tucks under it, round a clean round centre where the badge is. */
export function PillarMarkShapes({ pillar, companionOpacity = 0.45 }: { pillar: MosaicPillar; companionOpacity?: number }) {
  const id = useId().replace(/:/g, '');
  const paths = PILLAR_LOGOS[pillar].paths;
  if (pillar === 'projects') return (
    <g>
      <defs>
        {paths.map((_, k) => <mask key={k} id={`${id}-petal-${k}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="190" height="160">
          <rect x="-20" y="-20" width="190" height="160" fill="#fff" />
          <circle cx={PROJECTS_CENTRE[0]} cy={PROJECTS_CENTRE[1]} r={PROJECTS_HUB_R} fill="#000" />
          {projectsOver(k).map(j => <path key={j} d={PROJECTS_LOGO_OUTLINE[0]} transform={projectsPetalTransform(j)} fill="none" stroke="#000" strokeWidth={(2 * PETAL_GAP) / PROJECTS_SCALE} />)}
        </mask>)}
      </defs>
      {paths.map((d, k) => <path key={d} d={d} mask={`url(#${id}-petal-${k})`} />)}
    </g>
  );
  const figure = paths.map(d => <path key={d} d={d} />);
  if (pillar !== 'empower') return <>{figure}</>;
  return (
    <g transform={EMPOWER_TRIO_MARK_FIT}>
      <defs>
        <mask id={`${id}-apart`} maskUnits="userSpaceOnUse" x="-40" y="-20" width="230" height="160">
          <rect x="-40" y="-20" width="230" height="160" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="7" strokeLinejoin="round">{paths.map(d => <path key={d} d={d} />)}</g>
        </mask>
      </defs>
      <g mask={`url(#${id}-apart)`} opacity={companionOpacity}>
        {EMPOWER_COMPANIONS.map(mate => <g key={mate.dx} transform={companionTransform(mate)}>{paths.map(d => <path key={d} d={d} />)}</g>)}
      </g>
      {figure}
    </g>
  );
}
