import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { resolveCMSMedia } from '../cms/media';
import { roomPhoto } from '../data/pavilionGallery';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';

export const PillarHeroBackdrop: React.FC<{ pillar: MosaicPillar }> = ({ pillar }) => {
  const calm = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const logo = PILLAR_LOGOS[pillar];
  return <motion.div className="heal-layered-backdrop" data-theme={pillar} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: calm ? .12 : .85, ease: 'easeInOut' }}>
    <div className="heal-background-photo" style={{ backgroundImage: `url("${resolveCMSMedia(roomPhoto(pillar, 2))}")` }} />
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
  </motion.div>;
};
