import React from 'react';
import { PillarState } from '../types';
import { SncfLotus3D } from './SncfLotus3D';

/**
 * The screen below the hero: the SNCF lotus alone, blooming.
 *
 * The pillar cards and heading that used to share this screen are removed
 * for now — the section is the flower, top centre, unfolding petal by petal
 * left to right as the screen scrolls in and levitating once open. It
 * paints no background of its own; the page-wide .accent-canvas carries the
 * gradient through, as on every screen.
 */

interface PillarsSectionProps {
  pillars: PillarState[];
  activeIndex: number;
  onOpenDetails: (pillar: PillarState) => void;
}

export const PillarsSection: React.FC<PillarsSectionProps> = () => (
  <section
    id="pillars-section"
    aria-label="Our work"
    className="snap-screen relative z-10 w-full min-h-screen flex flex-col px-4 sm:px-8 md:px-12 lg:px-16 pt-[96px] pb-10 overflow-hidden"
  >
    <SncfLotus3D className="mx-auto w-[min(78vw,600px)]" />
  </section>
);
