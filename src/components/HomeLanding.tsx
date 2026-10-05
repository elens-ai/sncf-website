import React, { useEffect, useRef } from 'react';
import { MosaicOverture } from './MosaicOverture';
import type { MosaicPillar } from './pillarLogoArt';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './home-landing.css';

/* THE LANDING'S GROUND passes through these colours, a new one each second,
   starting from the peach: soft tints of the seal's own, and a mid grey, never
   white. The header over the landing is frosted glass, so it shows the same. */
const GROUND_COLOURS = ['#f9e2c7', '#f1dde6', '#dad8ee', '#cde6f2', '#cfe3d8', '#b3bcb7'];
const GROUND_STEP = 1000;

/** THE LANDING: "Different paths. One purpose." opens the home page, before
    the hall. Its emblem assembles once the welcome has handed over, and each
    of its four doors leads straight into the hall with that path in front of
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
  const ground = useRef<HTMLDivElement>(null);
  const active = useSectionActivity(root);
  /* Each second the ground moves on to its next colour (home-landing.css): the
     upper of its two layers either takes that colour while hidden and fades in
     over the lower, or fades out to show the lower, which took it while
     covered. So a colour is only ever painted out of sight, and only the upper
     layer's opacity moves. It moves on only while the landing is on the
     screen, and stays on the peach for those who ask for less motion. */
  const step = useRef(0);
  useEffect(() => {
    const layers = ground.current;
    if (!layers || !active || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [lower, upper] = Array.from(layers.children) as HTMLElement[];
    const timer = window.setInterval(() => {
      step.current = (step.current + 1) % GROUND_COLOURS.length;
      const colour = GROUND_COLOURS[step.current];
      if (layers.dataset.upper === 'shown') {
        lower.style.setProperty('--ground', colour);
        delete layers.dataset.upper;
      } else {
        upper.style.setProperty('--ground', colour);
        layers.dataset.upper = 'shown';
      }
    }, GROUND_STEP);
    return () => window.clearInterval(timer);
  }, [active]);
  return (
    <section ref={root} id="home-landing" className="home-landing snap-screen" data-active={active}>
      <div ref={ground} className="landing-ground" aria-hidden="true"><i /><i /></div>
      <MosaicOverture onChoose={id => onEnter(id)} play={play} heading="h1" onScrollOn={onScrollOn} />
    </section>
  );
}
