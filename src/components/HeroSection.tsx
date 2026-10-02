import { HeroPillarWordmark } from './PillarWordmark';
import { HeroHealWordmark } from './HealWordmark';
import { PillarHeroBackdrop } from './PillarHeroBackdrop';
import { getCMSCopy } from '../cms/runtime';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { PillarHeroVisual } from './PillarHeroVisual';
import { AnimatePresence } from 'motion/react';
import { PillarArtwork } from './PillarArtwork';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { Pause, Play } from 'lucide-react';

interface HeroSectionProps {
  activeIndex: number;
  onActiveIndexChange: (newIndex: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenDetails: (pillar: PillarState) => void;
  /** False while the welcome splash is still up; flips true when the hand-off
      lands on the header logo, which is when the content plays its entrance. */
  introActive: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeIndex,
  onActiveIndexChange,
  isPaused,
  onTogglePause,
  onOpenDetails,
  introActive,
}) => {
  // Exactly 4 real pillar content items
  const pillars = PILLARS;


  /* The settled look; the stylesheet's own defaults cover the stage angle and
     pillar name scale. */
  const glowIntensity = 0.85;
  const showMetrics = true;

  const currentPillar = pillars[activeIndex] || pillars[0];
  const [heroVisible, setHeroVisible] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  // Keep the original carousel mounted while the curtain carries it away.
  const contentGridRef = useRef<HTMLDivElement | null>(null);

  /* Every pillar reserves the height of the LONGEST body copy at the current
     width, so the stats and buttons below start at the same point on all four
     whatever length the CMS text is. Each body is measured in an invisible
     copy of the paragraph (same id, so the same styles apply). */
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const [bodyMinHeight, setBodyMinHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (!width) return;
      let tallest = 0;
      for (const pillar of pillars) {
        const probe = el.cloneNode(false) as HTMLElement;
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:${width}px;transition:none`;
        probe.textContent = pillar.body;
        parent.appendChild(probe);
        tallest = Math.max(tallest, probe.getBoundingClientRect().height);
        probe.remove();
      }
      setBodyMinHeight(Math.ceil(tallest));
    };
    measure();
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [pillars]);
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onMotionChange);

    const stage = document.getElementById('hero-clone-stage');
    const page = stage?.closest<HTMLElement>('.home-page');
    let raf = 0, measurementFrame = 0, extra = 0, viewport = window.innerHeight;
    let previousHeight = -1, previousExtra = -1, wasFinished: boolean | undefined, lastExit = -1;
    const read = () => {
      raf = 0;
      /* On tall mobile layouts, let the user reach the artwork before fading
         the hero into the next section. */
      const exit = Math.round(Math.min(1, Math.max(0, (window.scrollY - extra) / (viewport * .6))) * 100) / 100;
      if (exit !== lastExit) {
        lastExit = exit;
        stage?.style.setProperty('--hero-exit', String(exit));
        // Deepen the same page surface as the hero leaves, keeping white
        // chapter copy legible without introducing another section background.
        page?.style.setProperty('--page-depth', String(exit));
      }
      /* Finished = the hero has scrolled fully out of view. It used to fire at
         .53 of a viewport, once the copy had faded behind the curtain. */
      const finished = window.scrollY > extra + viewport;
      if (finished === wasFinished) return;
      wasFinished = finished;
      setHeroVisible(!finished);
      if (contentGridRef.current) contentGridRef.current.style.pointerEvents = finished ? 'none' : '';
    };
    const measure = () => {
      measurementFrame = 0;
      if (!stage) return;
      viewport = window.innerHeight;
      const h = stage.offsetHeight || viewport;
      extra = Math.max(0, h - viewport);
      // Sticky geometry only changes with layout, never with scroll. Rewriting
      // these values while scrolling forced the next animation to reflow.
      if (h !== previousHeight) {
        previousHeight = h;
        stage.parentElement?.style.setProperty('--hero-height', `${h}px`);
      }
      if (extra !== previousExtra) {
        previousExtra = extra;
        stage.style.setProperty('--hero-sticky-top', `${-extra}px`);
      }
      if (raf) cancelAnimationFrame(raf);
      read();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    const onResize = () => { if (!measurementFrame) measurementFrame = requestAnimationFrame(measure); };
    const geometry = new ResizeObserver(onResize);
    if (stage) geometry.observe(stage);
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', onMotionChange);
      geometry.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (measurementFrame) cancelAnimationFrame(measurementFrame);
      page?.style.removeProperty('--page-depth');
    };
  }, []);

  /* Vertical shuttle states for the pillar copy. Exit drifts up and out; enter
     is staged below (transition-suppressed) and rises into place. Distances are
     big enough to read as motion (12/16px) rather than a twitch. */
  const copyPhaseClass =
    phase === 'exiting'
      ? 'opacity-0 -translate-y-3'
      : phase === 'entering'
        ? 'opacity-0 translate-y-4 !transition-none'
        : 'opacity-100 translate-y-0';
  useEffect(() => {
    if (isPaused || !introActive || !heroVisible) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !reducedMotionRef.current) onActiveIndexChange((activeIndex + 1) % pillars.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [activeIndex, isPaused, introActive, heroVisible, onActiveIndexChange, pillars.length]);

  const [displayPillar, setDisplayPillar] = useState<PillarState>(currentPillar);
  const stageAccentA = displayPillar.accentA;
  const stageAccentB = displayPillar.accentB;

  /* The single source for the page's colour. The .accent-canvas backdrop, the
     header ribbon and the donate panel all read these, so publishing them here
     is what keeps every surface on the same mood. The wipe angle rides along
     so the design studio's slider still steers the shared gradient. */
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent-a', stageAccentA);
    root.setProperty('--accent-b', stageAccentB);
  }, [stageAccentA, stageAccentB]);

  // Cancel pending changes on every new selection, including returning to the
  // displayed pillar during an exit. This prevents a stale timer showing the wrong icon.
  useEffect(() => {
    if (currentPillar.id === displayPillar.id) {
      setPhase('idle');
      return;
    }
    if (reducedMotionRef.current) {
      setDisplayPillar(currentPillar);
      setPhase('idle');
      return;
    }
    setPhase('exiting');
    const timer = window.setTimeout(() => {
      setDisplayPillar(currentPillar);
      setPhase('entering');
    }, 280);
    return () => window.clearTimeout(timer);
  }, [currentPillar]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const timer = window.setTimeout(() => setPhase('idle'), 40);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const getPillarScriptTitle = (p: PillarState): string => {
    switch (p.id) {
      case 'heal':
        return 'Heal';
      case 'enrich':
        return 'Enrich';
      case 'empower':
        return 'Empower';
      case 'projects':
        return 'Projects';
      case 'amrit':
        return 'Project Amrit';
      case 'oneness':
        return 'Oneness Vann';
      default:
        return p.label.charAt(0).toUpperCase() + p.label.slice(1).toLowerCase();
    }
  };

  const getHeadingFontClass = () => 'font-artistic-heading font-normal tracking-wide';

  return (
    <main
      id="hero-clone-stage"
      data-pillar={displayPillar.id}
      /* The shared page canvas owns the color; only photography and the two
         decorative curves live here and dissolve before the section ends. */
      className="snap-screen relative z-10 w-full min-h-[100vh] flex flex-col justify-between pt-[76px] pb-12 px-4 sm:px-8 md:px-12 lg:px-16 overflow-hidden select-none"
      data-hero-theme={displayPillar.id}
      style={{ willChange: 'transform, opacity', transformOrigin: '50% 42%' }}
    >
      <AnimatePresence initial={false}>
        {(currentPillar.id === 'heal' || currentPillar.id === 'enrich' || currentPillar.id === 'empower' || currentPillar.id === 'projects') && <PillarHeroBackdrop key={currentPillar.id} pillar={currentPillar.id} />}
      </AnimatePresence>
      {/* A quiet studio backdrop: a broad light pool frames the white cards,
          with every overlay fading before the hero hands off to Our Work. */}
      <div
        className="hero-studio-light"
        aria-hidden="true"
        style={{ opacity: glowIntensity }}
      />
      <div className="hero-studio-ground" aria-hidden="true" />
      <div id="hero-top-left-celestial-ring" className="hero-studio-arc hero-studio-arc--corner" aria-hidden="true" />
      <div id="decorative-celestial-circle" className="hero-studio-arc hero-studio-arc--cards" aria-hidden="true">
        <div className="hero-studio-arc-inner" />
      </div>

      <div className="hero-activity-art" aria-hidden="true">
        {pillars.map(pillar => <PillarArtwork key={pillar.id} pillarId={pillar.id} visible={pillar.id === displayPillar.id} />)}
      </div>

      {/* MAIN HERO CONTENT GRID */}
      <div
        id="hero-foreground-content"
        ref={contentGridRef}
        /* Left padding clears the fixed social rail (which only shows at md+),
           so the editorial copy never crowds the icons. */
        className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 my-auto pl-0 md:pl-14 lg:pl-16 xl:pl-20"
        style={{ willChange: 'opacity, transform' }}
      >
        {/* Left Editorial Copy Area */}
        {/* z-20 keeps the copy above the orbit: at this card size the outer cards
            reach back across the text column, and they are blurred/faded there
            anyway, so the text should read over them rather than under. */}
        <div
          className={`hero-editorial relative z-20 w-full lg:w-1/2 flex flex-col justify-center items-start max-w-xl ${
            introActive ? 'hero-intro-rise' : 'hero-intro-waiting'
          }`}
        >
          <div className="hero-intro-title w-full">
          <p className="home-eyebrow hero-eyebrow">{getCMSCopy("copy.HeroSection.d5dc0eff1e60", " Service with Humility")}</p>
            {/* 1. Large Script-Style Pillar Name Heading in Dancing Script (Delay: 0ms) */}
            <h2
              id="hero-script-pillar-name"
              style={{ transitionDelay: phase === 'exiting' ? '90ms' : '0ms' }}
              className={`font-dancing-script pillar-script-name font-bold text-white leading-tight sm:leading-none mb-1 sm:mb-2 drop-shadow-md select-none transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {(displayPillar.id === 'heal' || displayPillar.id === 'enrich' || displayPillar.id === 'empower' || displayPillar.id === 'projects') ? <><span className="sr-only">{displayPillar.label}</span>{displayPillar.id === 'heal' ? <HeroHealWordmark /> : <HeroPillarWordmark pillar={displayPillar.id} />}</> : getPillarScriptTitle(displayPillar)}
            </h2>

            {/* 2. Main Headline (Delay: 50ms) */}
            <h1
              id="hero-headline"
              style={{ transitionDelay: phase === 'exiting' ? '70ms' : '60ms' }}
              className={`${getHeadingFontClass()} text-white text-[27px] sm:text-[32px] md:text-[40px] md:leading-[47px] mb-3.5 min-h-[2.4em] drop-shadow-md transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {displayPillar.headline}
            </h1>

          </div>
          <div className="hero-details w-full flex flex-col">
            {/* 3. Body Copy (Delay: 100ms) */}
            <p
              id="hero-body-text"
              ref={bodyRef}
              style={{ transitionDelay: phase === 'exiting' ? '45ms' : '120ms', minHeight: bodyMinHeight }}
              className={`font-artistic-serif text-white/95 text-[16px] sm:text-[17px] md:text-[18px] leading-relaxed mb-5 min-h-[6.6em] drop-shadow-sm max-w-[420px] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {displayPillar.body}
            </p>

            {/* 4. Impact Metrics Strip (Delay: 160ms) */}
            {showMetrics && (
              <div
                style={{ transitionDelay: phase === 'exiting' ? '20ms' : '180ms' }}
                className={`hero-impact grid grid-cols-2 gap-2.5 mb-5 px-3 py-2.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-[360px] shadow-lg transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
              >
                {displayPillar.stats.slice(0, 2).map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-artistic-heading text-[19px] sm:text-[23px] font-bold text-white tracking-tight">
                      <OdometerStatCounter
                        key={`${displayPillar.id}-${i}-${stat.value}`}
                        value={stat.value}
                        duration={1100}
                      />
                    </span>
                    <span className="font-artistic-serif text-[12px] text-white/80 font-medium leading-tight">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Action Button (Delay: 220ms, with 1000ms color transition) */}
            <div
              style={{ transitionDelay: phase === 'exiting' ? '0ms' : '240ms' }}
              className={`flex flex-wrap items-center gap-3 transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              <button
                id={`hero-learn-more-${displayPillar.id}-btn`}
                onClick={() => onOpenDetails(displayPillar)}
                className="font-artistic-modern group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white font-bold text-[13px] sm:text-[15px] shadow-xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/40 overflow-hidden uppercase tracking-wider"
                style={{
                  backgroundColor: displayPillar.accentA,
                  boxShadow: `0 10px 25px -5px ${displayPillar.accentA}88`,
                  transition: 'background-color 1000ms cubic-bezier(0.45, 0.05, 0.25, 1), box-shadow 1000ms cubic-bezier(0.45, 0.05, 0.25, 1), transform 200ms ease',
                }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
                <span>{getCMSCopy("copy.HeroSection.2e1ac6e9292a", "Explore ")}{getPillarScriptTitle(displayPillar)}</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
          <div className="hero-pillar-controls" role="group" aria-label="Choose a home theme">
            {pillars.map((pillar, i) => <button key={pillar.id} type="button" aria-pressed={activeIndex === i} data-index={i + 1} onClick={() => onActiveIndexChange(i)}>{getPillarScriptTitle(pillar)}</button>)}
            <button type="button" onClick={onTogglePause} aria-label={isPaused ? 'Resume theme rotation' : 'Pause theme rotation'}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button>
          </div>
        </div>
        {(currentPillar.id === 'heal' || currentPillar.id === 'enrich' || currentPillar.id === 'empower' || currentPillar.id === 'projects') && <PillarHeroVisual pillar={currentPillar.id} active={introActive} />}
      </div>
    </main>

  );
};
