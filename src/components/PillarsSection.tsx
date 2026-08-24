import React, { useEffect, useRef } from 'react';
import { PillarState } from '../types';
import { SncfLotus3D, SncfLotus3DHandle } from './SncfLotus3D';

/**
 * The screen below the hero: the SNCF lotus alone, assembling.
 *
 * The section is a TALL TRACK holding a STICKY stage. Arriving at it, the
 * stage pins to the viewport with the emblem standing on the foot of the
 * screen — flush to it, no gap — and every petal still folded away; the scrolling that follows does not move the flower at all —
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
 * IT PAINTS ITSELF WHITE, alone among the screens: a white wash fades in as
 * the section takes the viewport over from the hero, so the beams have
 * something to divide. The page-wide .accent-canvas still runs underneath,
 * and shows through for as long as the hero is still on screen.
 */

interface PillarsSectionProps {
  pillars: PillarState[];
  activeIndex: number;
  onOpenDetails: (pillar: PillarState) => void;
}

export const PillarsSection: React.FC<PillarsSectionProps> = () => {
  const trackRef = useRef<HTMLElement | null>(null);
  const lotusRef = useRef<SncfLotus3DHandle | null>(null);
  const washRef = useRef<HTMLDivElement | null>(null);

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
      const vh = window.innerHeight || 1;
      const r = track.getBoundingClientRect();
      const span = r.height - vh;
      lotusRef.current?.updateProgress(span > 0 ? -r.top / span : 1);

      /* The screen goes white as the section takes the viewport over from the
         hero: 0 while the section's top is still at the bottom of the screen,
         1 the moment it reaches the top and pins. The beams need it — they
         are colour laid on light, and on the hero's dark gradient the
         divisions between verticals barely read. */
      if (washRef.current) {
        const covered = Math.max(0, Math.min(1, (vh - r.top) / vh));
        washRef.current.style.opacity = (covered * covered).toFixed(3);
        /* Tell the fixed chrome it is over light ground; its own styles
           handle the rest. */
        /* Only once the ground is actually pale — switching at half cover
           deepens the scrim while the hero's dark gradient still shows. */
        const light = covered > 0.85 && r.bottom > vh * 0.5;
        if (light !== document.documentElement.hasAttribute('data-on-light')) {
          document.documentElement.toggleAttribute('data-on-light', light);
        }
      }
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
      document.documentElement.removeAttribute('data-on-light');
    };
  }, []);

  return (
    <section
      id="pillars-section"
      ref={trackRef}
      aria-label="Our work"
      className="snap-screen lotus-track relative z-10 w-full"
    >
      <div className="sticky top-0 h-screen w-full flex items-end justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[96px] pb-0 overflow-hidden">
        <div
          ref={washRef}
          aria-hidden="true"
          className="absolute inset-0 bg-white pointer-events-none"
          style={{ opacity: 0, willChange: 'opacity' }}
        />
        <SncfLotus3D ref={lotusRef} maxWidth={230} className="mx-auto" />
      </div>
    </section>
  );
};
