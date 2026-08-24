import React, { useEffect, useRef } from 'react';
import { PillarState } from '../types';
import { SncfLotus3D, SncfLotus3DHandle } from './SncfLotus3D';

/**
 * The screen below the hero: the SNCF lotus alone, assembling.
 *
 * The section is a TALL TRACK holding a STICKY stage. Arriving at it, the
 * stage pins to the viewport with the flower centred and every petal still
 * folded away; the scrolling that follows does not move the flower at all —
 * it builds it, one petal at a time, left to right. Once the last petal has
 * landed and the flower has held for a beat, the track runs out and the page
 * carries on to the next screen.
 *
 * The track's height (.lotus-track) is what buys that scroll: 360vh leaves
 * 260vh of pinned travel, about 40vh per petal. Under prefers-reduced-motion
 * the track collapses to a single screen and the flower is simply built.
 *
 * Progress is measured here and handed to the flower through its imperative
 * handle, so the scroll path never re-renders React: a passive listener
 * marks it dirty, one frame reads the track and the flower damps towards it.
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
  const lotusRef = useRef<SncfLotus3DHandle | null>(null);

  useEffect(() => {
    let raf = 0;

    const read = () => {
      raf = 0;
      const track = trackRef.current;
      if (!track) return;
      /* 0 as the sticky stage takes hold, 1 as the track runs out. Both
         terms are measured live, so a track sized in vh and a viewport that
         resizes — phone chrome collapsing, rotation — stay in step without
         hardcoding either. */
      const r = track.getBoundingClientRect();
      const span = r.height - (window.innerHeight || 1);
      lotusRef.current?.updateProgress(span > 0 ? -r.top / span : 1);
    };
    const invalidate = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, []);

  return (
    <section
      id="pillars-section"
      ref={trackRef}
      aria-label="Our work"
      className="snap-screen lotus-track relative z-10 w-full"
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[96px] pb-10 overflow-hidden">
        <SncfLotus3D ref={lotusRef} maxWidth={400} className="mx-auto" />
      </div>
    </section>
  );
};
