import React, { useRef } from 'react';
import { MosaicOverture } from './MosaicOverture';
import type { MosaicPillar } from './pillarLogoArt';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './home-landing.css';

/** THE LANDING: "Four paths. One purpose." opens the home page, before the
    hall. Its emblem assembles once the welcome has handed over, and each of
    its four doors leads straight into the hall with that path in front of
    the visitor. */
export function HomeLanding({ play, onEnter, onScrollOn }: {
  /** Starts the emblem assembling (once the welcome is leaving or done). */
  play: boolean;
  /** Bring the hall forward on this path, and move there. */
  onEnter: (pillar: MosaicPillar) => void;
  /** "Scroll to explore", pressed. */
  onScrollOn: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  return (
    <section ref={root} id="home-landing" className="home-landing snap-screen" data-active={active}>
      <MosaicOverture onChoose={id => onEnter(id)} play={play} heading="h1" onScrollOn={onScrollOn} />
    </section>
  );
}
