import React from 'react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { PillarModelCard } from './PillarModelCard';
import './service-portrait.css';

/** The foundation's own rounded emblem, lit and floated by the shared model renderer. */
export const ServicePortrait: React.FC<{ active: boolean; reducedMotion: boolean }> = ({ active, reducedMotion }) => (
  <div className="service-emblem" data-resting={!active || reducedMotion}>
    <div className="service-emblem-aura" aria-hidden="true" />
    <div className="service-emblem-model">
      <PillarModelCard
        id="sncf-emblem"
        label={getCMSCopy('copy.ServicePortrait.icon-label', 'Sant Nirankari Charitable Foundation emblem')}
        modelUrl={resolveCMSAsset('asset.ServicePortrait.model', '/models/sncf-emblem.glb')}
        fallbackUrl={resolveCMSAsset('asset.ServicePortrait.poster', '/images/sncf-logo.webp')}
        active={active}
        animate={active && !reducedMotion}
      />
    </div>
    <div className="service-emblem-shadow" aria-hidden="true" />
  </div>
);
