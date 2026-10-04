import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import type { MosaicPillar } from './pillarLogoArt';

/* When the pillar changes, the emblems dissolve into one another in place:
   the outgoing one lifts away, a touch larger, as the incoming one settles in
   from just below. Opacity and transform only, so the change stays on the
   compositor and smooth at any size; under reduced motion it is a plain fade. */
const SETTLE = [0.22, 1, 0.36, 1] as const;
const LIFT = [0.4, 0, 0.9, 0.6] as const;

/** leavesWithPage: the emblem sits on a page that turns as a whole (the home
    page's hall, HeroSection), which carries the outgoing emblem away itself; so
    it leaves at once here, and only the incoming one settles in. */
export const PillarHeroVisual = React.memo(function PillarHeroVisual({ pillar, active, caption = true, leavesWithPage = false }: { pillar: MosaicPillar; active: boolean; caption?: boolean; leavesWithPage?: boolean }) {
  const calm = useReducedMotion();
  return (
    <div className="hero-heal-art" data-ready={active}>
      <div className="pillar-art-contact-shadow" aria-hidden="true" />
      <div className="pillar-art-panel">
        <AnimatePresence initial={false}>
          <motion.div
            key={pillar}
            className="pillar-art-face"
            /* on a turning page the incoming emblem rides in with the page rather than settling on its own */
            initial={leavesWithPage ? false : calm ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.93, rotate: -2.5 }}
            animate={calm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={leavesWithPage ? { opacity: 0, transition: { duration: 0 } } : calm ? { opacity: 0, transition: { duration: 0.2 } } : { opacity: 0, y: -18, scale: 1.05, rotate: 1.5, transition: { duration: 0.55, ease: LIFT } }}
            transition={{ duration: calm ? 0.2 : 1.05, ease: SETTLE }}
          >
            <PillarPhotoMosaic pillar={pillar} heroArt caption={caption} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});
