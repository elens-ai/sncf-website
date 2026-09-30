import React from 'react';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import type { MosaicPillar } from './pillarLogoArt';

/** The selected pillar changes in place, without logo motion or rear copies. */
export const PillarHeroVisual: React.FC<{ pillar: MosaicPillar; active: boolean }> = ({ pillar, active }) => (
  <div className="hero-heal-art" data-ready={active}>
    <div className="pillar-art-contact-shadow" aria-hidden="true" />
    <div className="pillar-art-panel"><PillarPhotoMosaic pillar={pillar} /></div>
  </div>
);
