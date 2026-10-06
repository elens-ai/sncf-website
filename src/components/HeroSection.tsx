import { HeroPillarWordmark } from './PillarWordmark';
import { HeroHealWordmark } from './HealWordmark';
import { PillarHeroBackdrop } from './PillarHeroBackdrop';
import { getCMSCopy } from '../cms/runtime';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { PillarHeroVisual } from './PillarHeroVisual';
import { PillarArtwork } from './PillarArtwork';
import { MosaicWaves, type WaveInput } from './MosaicWaves';
import { subjectFor } from '../utils/waves';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { ArrowUpRight, Pause, Play } from 'lucide-react';

interface HeroSectionProps {
  activeIndex: number;
  onActiveIndexChange: (newIndex: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenDetails: (pillar: PillarState) => void;
  /** False while the welcome splash is still up; flips true when the hand-off
      lands on the header logo, which is when the content plays its entrance. */
  introActive: boolean;
  /** The page's scroll chooses the path (the hall is pinned in a track, see
      HomePage): no timer, no pause control, and the track holds the snap points. */
  scrollDriven?: boolean;
  /** A path chosen from the hall's own buttons; with a track, it scrolls there. */
  onChoosePillar?: (index: number) => void;
}

/* Browsers that can draw two states of the page at once (the View Transitions
   API) turn the hall's pages the way the explore pages turn; the others keep
   the in-place shuttle. */
type TurningDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<unknown> } };
const canTurnPages = () => typeof document !== 'undefined' && typeof (document as TurningDocument).startViewTransition === 'function';

const BACKDROP_PATHS = ['heal', 'enrich', 'empower', 'projects'] as const;

export const HeroSection: React.FC<HeroSectionProps> = ({
  activeIndex,
  onActiveIndexChange,
  isPaused,
  onTogglePause,
  onOpenDetails,
  introActive,
  scrollDriven = false,
  onChoosePillar,
}) => {
  // Exactly 4 real pillar content items
  const pillars = PILLARS;


  /* The settled look; the stylesheet's own defaults cover the stage angle and
     pillar name scale. */
  const glowIntensity = 0.85;
  const showMetrics = true;

  const currentPillar = pillars[activeIndex] || pillars[0];
  /* The backdrops stack in the order their paths were last chosen, the newest
     on top, as they did when each was mounted fresh for its turn. */
  const backdropStack = useRef<string[]>([]);
  if (backdropStack.current[backdropStack.current.length - 1] !== currentPillar.id) {
    backdropStack.current = [...backdropStack.current.filter(id => id !== currentPillar.id), currentPillar.id];
  }
  const [heroVisible, setHeroVisible] = useState(true);
  /* THE WATER UNDER THE HALL: the layered-wave artwork the chapters below
     swim in, here beneath every path's page in that path's own colours (it
     morphs with a ripple as the hall turns). It paints only while the hall
     is on screen and moving, and stays still for those who ask for less
     motion; the shore above laps down into it. */
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
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
    /* the page's shade is written on the canvas that draws it: on the page,
       every element inherited each step of it and was restyled */
    const canvas = stage?.closest<HTMLElement>('.home-page')?.querySelector<HTMLElement>(':scope > .accent-canvas');
    /* On the home page the hall is pinned in a track, one screen of scroll per
       path (HomePage): it leaves, and is finished, as the track's end passes.
       Anywhere else it is measured from where it sits on the page (top). */
    const track = stage?.parentElement?.classList.contains('hero-track') ? stage.parentElement : null;
    let raf = 0, measurementFrame = 0, extra = 0, top = 0, viewport = window.innerHeight;
    let previousHeight = -1, previousExtra = -1, wasVisible: boolean | undefined, lastExit = -1;
    const read = () => {
      raf = 0;
      let leave: number, finished: boolean, visible: boolean;
      if (track) {
        const r = track.getBoundingClientRect();
        leave = (viewport - r.bottom) / (viewport * .6);
        finished = r.bottom <= 0;
        visible = r.top < viewport && r.bottom > 0;
      } else {
        /* On tall mobile layouts, let the user reach the artwork before fading
           the hero into the next section. Finished = scrolled fully out of view;
           not yet reached = whatever is above it still fills the screen. */
        leave = (window.scrollY - top - extra) / (viewport * .6);
        finished = window.scrollY > top + extra + viewport;
        visible = !finished && window.scrollY + viewport > top;
      }
      const exit = Math.round(Math.min(1, Math.max(0, leave)) * 100) / 100;
      if (exit !== lastExit) {
        lastExit = exit;
        stage?.style.setProperty('--hero-exit', String(exit));
        // Deepen the same page surface as the hero leaves, keeping white
        // chapter copy legible without introducing another section background.
        canvas?.style.setProperty('--page-depth', String(exit));
      }
      if (visible === wasVisible) return;
      wasVisible = visible;
      setHeroVisible(visible);
      if (contentGridRef.current) contentGridRef.current.style.pointerEvents = finished ? 'none' : '';
    };
    const measure = () => {
      measurementFrame = 0;
      if (!stage) return;
      viewport = window.innerHeight;
      top = stage.getBoundingClientRect().top + window.scrollY;
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
      canvas?.style.removeProperty('--page-depth');
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
    if (scrollDriven || isPaused || !introActive || !heroVisible) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !reducedMotionRef.current) onActiveIndexChange((activeIndex + 1) % pillars.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [scrollDriven, activeIndex, isPaused, introActive, heroVisible, onActiveIndexChange, pillars.length]);

  const [displayPillar, setDisplayPillar] = useState<PillarState>(currentPillar);
  const stageAccentA = displayPillar.accentA;
  const stageAccentB = displayPillar.accentB;

  /* The single source for the page's colour. The .accent-canvas backdrop, the
     header ribbon and the donate panel all read these, so publishing them here
     is what keeps every surface on the same mood. The wipe angle rides along
     so the design studio's slider still steers the shared gradient. They are
     published on <body>, not on the root element: a custom property changed on
     the root restyles every element of the document, whatever holds it lower
     down (HomePage), which stalled each turn of the hall's pages for a frame or
     more; changed on <body>, it stops at the sections holding their colours.
     The other pages keep theirs on the root (PageShell), so the hall takes its
     own away with it. */
  useEffect(() => {
    const page = document.body.style;
    page.setProperty('--accent-a', stageAccentA);
    page.setProperty('--accent-b', stageAccentB);
  }, [stageAccentA, stageAccentB]);
  useEffect(() => () => {
    document.body.style.removeProperty('--accent-a');
    document.body.style.removeProperty('--accent-b');
  }, []);

  /* On the home page's track the hall's pages turn (homepage.css): the page in
     view leaves upwards, fading and settling back a little, while the next
     rises from below into its place, both drawn at once by a view transition;
     the new page's lines then rise in. */
  const pageTurns = scrollDriven && canTurnPages();
  const latestTurn = useRef<unknown>(null);
  /* the page the hall will show once any turn under way has landed: a turn
     sets it at once, though its page only comes when the turn's capture is
     done, so a choice made in between (back to the page still on show) is
     measured against where the hall is going, not where it is */
  const turningTo = useRef<PillarState>(displayPillar);

  // Cancel pending changes on every new selection, including returning to the
  // displayed pillar during an exit. This prevents a stale timer showing the wrong icon.
  useEffect(() => {
    const shown = pageTurns ? turningTo.current : displayPillar;
    if (currentPillar.id === shown.id) {
      setPhase('idle');
      return;
    }
    if (reducedMotionRef.current) {
      turningTo.current = currentPillar;
      setDisplayPillar(currentPillar);
      setPhase('idle');
      return;
    }
    if (pageTurns) {
      const root = document.documentElement;
      const next = currentPillar;
      turningTo.current = next;
      /* back up the page, the pages move the other way, as the explore pages do */
      root.classList.toggle('hero-turning-back', pillars.indexOf(next) < pillars.indexOf(shown));
      root.classList.add('hero-turning');
      const turn = (document as TurningDocument).startViewTransition!(() => {
        flushSync(() => {
          setDisplayPillar(next);
          setPhase('entering');
        });
      });
      latestTurn.current = turn;
      /* a turn cut short by the next one leaves the class to that one */
      turn.finished.catch(() => undefined).finally(() => { if (latestTurn.current === turn) root.classList.remove('hero-turning', 'hero-turning-back'); });
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

  /* The path tabs: a click chooses a path; on a focused tab the arrows, Home
     and End move along them, choosing as they go. */
  const choosePath = (index: number) => (onChoosePillar ?? onActiveIndexChange)(index);
  const onTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = pillars.length - 1;
    const next = event.key === 'ArrowRight' ? Math.min(last, activeIndex + 1)
      : event.key === 'ArrowLeft' ? Math.max(0, activeIndex - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : -1;
    if (next < 0) return;
    event.preventDefault();
    choosePath(next);
    (event.currentTarget.children[next] as HTMLElement | undefined)?.focus({ preventScroll: true });
  };

  return (
    <main
      id="hero-clone-stage"
      /* a door on the landing brings focus here as it leads into the hall */
      tabIndex={-1}
      data-pillar={displayPillar.id}
      /* The shared page canvas owns the color; only photography and the two
         decorative curves live here and dissolve before the section ends. */
      className={`${scrollDriven ? '' : 'snap-screen '}relative z-10 w-full min-h-[100vh] flex flex-col justify-between pt-[76px] pb-12 px-4 sm:px-8 md:px-12 lg:px-16 overflow-hidden select-none`}
      data-hero-theme={displayPillar.id}
      style={{ willChange: 'transform, opacity', transformOrigin: '50% 42%' }}
    >
      {/* Every path's backdrop stays mounted and drawn, the one on the current
          path opaque: a change of path only crossfades them, rather than
          mounting a new one (its photograph decoded, its masks, filter and
          blend painted) in the middle of a turn of the hall's pages. */}
      <div className="hero-waves" aria-hidden="true">
        <MosaicWaves subject={subjectFor(displayPillar)} active={heroVisible && !isPaused && !calm} input={waveInput} scale={4} fps={24} />
      </div>
      <div className="hero-backdrops">
        {BACKDROP_PATHS.map(id => <PillarHeroBackdrop key={id} pillar={id} shown={currentPillar.id === id} layer={backdropStack.current.indexOf(id) + 1} />)}
      </div>
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
              {(displayPillar.id === 'heal' || displayPillar.id === 'enrich' || displayPillar.id === 'empower' || displayPillar.id === 'projects') ? <><span className="sr-only">{displayPillar.label}</span>{displayPillar.id === 'heal' ? <HeroHealWordmark /> : <HeroPillarWordmark key={displayPillar.id} pillar={displayPillar.id} />}</> : getPillarScriptTitle(displayPillar)}
            </h2>

            {/* 2. Main Headline (Delay: 50ms) — under the pillar's name; the landing above carries the page's h1 */}
            <h3
              id="hero-headline"
              style={{ transitionDelay: phase === 'exiting' ? '70ms' : '60ms' }}
              className={`${getHeadingFontClass()} text-white text-[27px] sm:text-[32px] md:text-[40px] md:leading-[47px] mb-3.5 min-h-[2.4em] drop-shadow-md transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {displayPillar.headline}
            </h3>

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

            {/* 4. Action Button, under the story (Delay: 180ms, with 1000ms color transition) */}
            <div
              style={{ transitionDelay: phase === 'exiting' ? '20ms' : '180ms' }}
              className={`hero-explore flex flex-wrap items-center gap-3 mb-5 transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {/* a line of text on a hairline, with its arrow: each chapter's own Explore, below */}
              <button
                id={`hero-learn-more-${displayPillar.id}-btn`}
                type="button"
                onClick={() => onOpenDetails(displayPillar)}
                className="hero-explore-link"
              >
                <span>{getCMSCopy("copy.HeroSection.2e1ac6e9292a", "Explore ")}{getPillarScriptTitle(displayPillar)}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            </div>

            {/* 5. Impact Metrics Strip, at the foot (Delay: 240ms) */}
            {showMetrics && (
              <div
                style={{ transitionDelay: phase === 'exiting' ? '0ms' : '240ms' }}
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
          </div>
        </div>
        {/* turning pages, the emblem belongs to the page it is on: it changes with the page, inside the turn */}
        {(() => {
          const emblem = pageTurns ? displayPillar : currentPillar;
          return (emblem.id === 'heal' || emblem.id === 'enrich' || emblem.id === 'empower' || emblem.id === 'projects') && <PillarHeroVisual pillar={emblem.id} active={introActive} leavesWithPage={pageTurns} />;
        })()}
      </div>

      {/* The paths as tabs, centred at the hall's foot: each leads the page to its
          own screen of the track. They stand outside the turning page, so they
          hold still while the pages turn. */}
      <div className="hero-path-tabs">
        <div role="tablist" aria-label="Choose a path" onKeyDown={onTabKey}>
          {pillars.map((pillar, i) => (
            <button key={pillar.id} id={`hero-tab-${pillar.id}`} type="button" role="tab" aria-selected={activeIndex === i} aria-controls="hero-foreground-content"
              tabIndex={activeIndex === i ? 0 : -1} onClick={() => choosePath(i)}>
              {getPillarScriptTitle(pillar)}
            </button>
          ))}
        </div>
        {!scrollDriven && <button type="button" className="hero-path-pause" onClick={onTogglePause} aria-label={isPaused ? 'Resume theme rotation' : 'Pause theme rotation'}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button>}
      </div>
    </main>

  );
};
