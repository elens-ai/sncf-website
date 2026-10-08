import React, { useId } from 'react';
import { HandHeart } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './service-portrait.css';

/** A single service icon: a heart supported by an open hand. */
export const ServicePortrait: React.FC = () => {
  const id = useId().replace(/:/g, '');
  return <div className="service-icon" role="img" aria-label={getCMSCopy('copy.ServicePortrait.icon-label', 'A hand holding a heart — service with humility')}>
    <div className="service-icon-glow" aria-hidden="true" />
    <HandHeart className="service-icon-mark" stroke={`url(#${id}-navy)`} strokeWidth={1.25} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#527aad" />
          <stop offset=".28" stopColor="#063782" />
          <stop offset=".48" stopColor="#164784" />
          <stop offset=".53" stopColor="#bfa570" />
          <stop offset=".58" stopColor="#244e86" />
          <stop offset="1" stopColor="#063782" />
        </linearGradient>
      </defs>
    </HandHeart>
  </div>;
};
