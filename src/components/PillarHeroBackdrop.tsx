import React from 'react';
import { useReducedMotion } from 'motion/react';
import type { MosaicPillar } from './pillarLogoArt';

/** Quiet gradient grounds keep the foreground emblems in focus. */
export const PillarHeroBackdrop = React.memo(function PillarHeroBackdrop({ pillar, shown, layer }: { pillar: MosaicPillar; shown: boolean; layer: number }) {
  const calm = useReducedMotion();
  return <div className="heal-layered-backdrop" data-theme={pillar} aria-hidden="true" style={{
    opacity: shown ? 1 : 0,
    zIndex: layer,
    background: 'radial-gradient(ellipse at 78% 38%, var(--backdrop-pale), transparent 58%), linear-gradient(115deg, var(--backdrop-dark), var(--backdrop-mid) 45%, var(--backdrop-light))',
    transition: `opacity ${calm ? 120 : 850}ms ease-in-out`,
  }} />;
});
