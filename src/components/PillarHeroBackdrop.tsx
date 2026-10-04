import React, { useId } from 'react';
import { useReducedMotion } from 'motion/react';
import { resolveCMSMedia } from '../cms/media';
import { resolveCMSAsset } from '../cms/runtime';
import { roomPhoto } from '../data/pavilionGallery';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';

/** shown: this path's backdrop is the one in view; the others stay mounted
    and drawn, transparent, so a change of path only fades between them (the
    hero mounts all four, HeroSection). layer: its place in the stack. */
export const PillarHeroBackdrop = React.memo(function PillarHeroBackdrop({ pillar, shown, layer }: { pillar: MosaicPillar; shown: boolean; layer: number }) {
  const calm = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const logo = PILLAR_LOGOS[pillar];
  return <div className="heal-layered-backdrop" data-theme={pillar} aria-hidden="true" style={{ opacity: shown ? 1 : 0, zIndex: layer, transition: `opacity ${calm ? 120 : 850}ms ease-in-out` }}>
    {/* Heal's background echoes its emblem: the foundation's own photographs,
        faint and tinted (CMS-editable); the other pillars use a room photo. */}
    <div className="heal-background-photo" style={{ backgroundImage: `url("${pillar === 'heal' ? resolveCMSAsset("asset.PillarHeroBackdrop.heal-background", "/images/heal-emblem/background.webp") : resolveCMSMedia(roomPhoto(pillar, 2))}")` }} />
    <i /><i />
    {pillar !== 'heal' && <>
      <svg className="pillar-backdrop-echo" viewBox="0 0 146 120">
        <defs><clipPath id={id}>{logo.paths.map(d => <path key={d} d={d} />)}</clipPath></defs>
        <g clipPath={`url(#${id})`}>
          <image href={resolveCMSMedia(roomPhoto(pillar, 4))} width="146" height="120" preserveAspectRatio="xMidYMid slice" />
          <rect width="146" height="120" fill={logo.tint} opacity=".4" />
        </g>
      </svg>
    </>}
    <div className="pillar-backdrop-dots" />
  </div>;
});
