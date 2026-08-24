import React, { useRef } from 'react';
import { PillarState } from '../types';
import { SncfLotus3D } from './SncfLotus3D';

/**
 * The screen below the hero: the SNCF lotus alone, blooming.
 *
 * The section is a TALL TRACK holding a STICKY stage. Arriving at it, the
 * stage pins to the viewport with the flower centred and every petal still
 * hidden; the scrolling that follows does not move the flower at all — it
 * runs the bloom, one petal at a time, left to right. Once the last petal
 * has opened and the flower has held for a beat, the track runs out and the
 * page carries on to the next screen. So the reader spends their scroll on
 * the flower opening rather than on the flower sliding past.
 *
 * The track's height (.lotus-track) is what buys that scroll: 360vh leaves
 * 260vh of pinned travel, about 40vh per petal. Under prefers-reduced-motion
 * the track collapses to a single screen and the flower is simply open.
 *
 * It paints no background of its own; the page-wide .accent-canvas carries
 * the gradient through, as on every screen.
 */

interface PillarsSectionProps {
  pillars: PillarState[];
  activeIndex: number;
  onOpenDetails: (pillar: PillarState) => void;
}

export const PillarsSection: React.FC<PillarsSectionProps> = () => {
  const trackRef = useRef<HTMLElement | null>(null);

  return (
    <section
      id="pillars-section"
      ref={trackRef}
      aria-label="Our work"
      className="snap-screen lotus-track relative z-10 w-full"
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[96px] pb-10 overflow-hidden">
        <SncfLotus3D trackRef={trackRef} className="w-[min(78vw,600px)]" />
      </div>
    </section>
  );
};
