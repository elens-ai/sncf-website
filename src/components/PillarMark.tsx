import React, { useId } from 'react';
import {
  EMPOWER_COMPANIONS, EMPOWER_COMPANIONS_BOX, EMPOWER_TILT, EMPOWER_TRIO_MARK_FIT, PILLAR_LOGOS, companionTransform,
  type MosaicPillar,
} from './pillarLogoArt';

/** A pillar's flat mark, drawn into a 146 × 120 emblem box (an svg's viewBox of 0 0 146 120) in the current
    fill: its logo's outline — or, for Empower, its figure among its two companions, leaning out from it as the
    hero visual has them, fading from `companionOpacity` at their top to nothing at their feet, and parted from
    it by a sliver of space so the three stay legible however small the mark. */
export function PillarMarkShapes({ pillar, companionOpacity = 0.5 }: { pillar: MosaicPillar; companionOpacity?: number }) {
  const id = useId().replace(/:/g, '');
  const paths = PILLAR_LOGOS[pillar].paths;
  const figure = paths.map(d => <path key={d} d={d} />);
  if (pillar !== 'empower') return <>{figure}</>;
  return (
    <g transform={EMPOWER_TRIO_MARK_FIT}>
      <defs>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1={EMPOWER_COMPANIONS_BOX.y} x2="0" y2={EMPOWER_COMPANIONS_BOX.y + EMPOWER_COMPANIONS_BOX.h}>
          <stop offset="0" stopColor="#fff" stopOpacity={companionOpacity} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-apart`} maskUnits="userSpaceOnUse" x="-40" y="-20" width="230" height="160">
          <rect x="-40" y="-20" width="230" height="160" fill={`url(#${id}-fade)`} />
          <g fill="#000" stroke="#000" strokeWidth="7" strokeLinejoin="round">{paths.map(d => <path key={d} d={d} />)}</g>
        </mask>
      </defs>
      <g mask={`url(#${id}-apart)`}>
        {EMPOWER_COMPANIONS.map(mate => <g key={mate.dx} transform={companionTransform(mate, Math.sign(mate.dx) * EMPOWER_TILT)}>{paths.map(d => <path key={d} d={d} />)}</g>)}
      </g>
      {figure}
    </g>
  );
}
