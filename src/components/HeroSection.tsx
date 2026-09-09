import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { HeroCurtain } from './HeroCurtain';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { HeroOrbitWheel } from '../components/HeroOrbitWheel';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import {
  Sparkles,
  Settings,
  Palette,
  Type,
  RotateCw,
  Layout,
  Flame,
  Pause,
  Play,
} from 'lucide-react';

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

export type ArtisticFontTheme =
  | 'marcellus-editorial'
  | 'cinzel-monumental'
  | 'garamond-poetic'
  | 'syne-modern';

export type SacredAuraEffect =
  | 'sacred-mandala'
  | 'celestial-rings'
  | 'cosmic-nebula'
  | 'minimal-clean';

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


  // Live design studio controls
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [fontTheme, setFontTheme] = useState<ArtisticFontTheme>('marcellus-editorial');
  const [auraEffect, setAuraEffect] = useState<SacredAuraEffect>('sacred-mandala');
  const [gradientAngle, setGradientAngle] = useState<number>(135);
  /* Multiplies the fluid clamp on the pillar script name, so the size stays
     responsive at every setting rather than being pinned to one pixel value. */
  const [pillarNameScale, setPillarNameScale] = useState<number>(1);
  // User-adjustable icon size, based on the full editorial text block.
  const [cardScale, setCardScale] = useState<number>(1);
  const [glowIntensity, setGlowIntensity] = useState<number>(0.85);
  const [showMetrics, setShowMetrics] = useState<boolean>(true);

  /* Mirrors the .pillar-script-name clamp so the studio can report the size the
     heading is actually rendering at on this screen, not just the multiplier. */
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mirrors calc(clamp(1.725rem, 5.325vw, 4.5rem) * --pillar-name-scale)
  const pillarNamePx = Math.round(
    Math.min(72, Math.max(28, viewportWidth * 0.05325)) * pillarNameScale,
  );

  const copySizeRef = useRef<HTMLDivElement>(null);
  const [modelBaseSize, setModelBaseSize] = useState(320);
  useEffect(() => {
    const copy = copySizeRef.current;
    if (!copy) return;
    const measure = () => {
      // The model canvas and front-stage scale enlarge this slot by ~1.67x.
      // Size its silhouette against the copy while keeping narrow screens usable.
      const widthLimit = window.innerWidth >= 900 ? window.innerWidth * 0.25 : window.innerWidth * 0.48;
      setModelBaseSize(Math.round(Math.min(copy.offsetHeight * 0.8, widthLimit)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    measure();
    return () => observer.disconnect();
  }, [viewportWidth]);

  useEffect(() => {
    document.documentElement.style.setProperty('--hero-model-size', `${modelBaseSize}px`);
  }, [modelBaseSize]);

  /* Published on :root so the stylesheet's clamp can compose with it. */
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--pillar-name-scale',
      String(pillarNameScale),
    );
  }, [pillarNameScale]);

  useEffect(() => {
    document.documentElement.style.setProperty('--card-scale', String(cardScale));
  }, [cardScale]);

  const currentPillar = pillars[activeIndex] || pillars[0];
  const [heroVisible, setHeroVisible] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  // Keep the original carousel mounted while the curtain carries it away.
  const contentGridRef = useRef<HTMLDivElement | null>(null);
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onMotionChange);

    const stage = document.getElementById('hero-clone-stage');
    let raf = 0, measurementFrame = 0, extra = 0, viewport = window.innerHeight;
    let previousHeight = -1, previousExtra = -1, wasFinished: boolean | undefined;
    const read = () => {
      raf = 0;
      const finished = window.scrollY > extra + viewport * .53;
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
  const [displayPillar, setDisplayPillar] = useState<PillarState>(currentPillar);
  const stageAccentA = currentPillar.accentA;
  const stageAccentB = currentPillar.accentB;

  /* The single source for the page's colour. The .accent-canvas backdrop, the
     header ribbon and the donate panel all read these, so publishing them here
     is what keeps every surface on the same mood. The wipe angle rides along
     so the design studio's slider still steers the shared gradient. */
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent-a', stageAccentA);
    root.setProperty('--accent-b', stageAccentB);
  }, [stageAccentA, stageAccentB]);

  useEffect(() => {
    document.documentElement.style.setProperty('--stage-angle', `${gradientAngle}deg`);
  }, [gradientAngle]);

  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);

  const targetKey = `P${currentPillar.id}`;
  const displayKey = `P${displayPillar.id}`;

  useEffect(() => {
    if (targetKey !== displayKey) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

      setPhase('exiting');

      exitTimerRef.current = setTimeout(() => {
        setDisplayPillar(currentPillar);
        /* 'entering' stages the new copy BELOW its slot, invisible and with
           transitions suppressed; two frames later 'idle' releases it to rise
           up into place. Old copy left upward, new copy arrives from below —
           one continuous vertical stream instead of a direction reversal. */
        setPhase('entering');
        enterTimerRef.current = setTimeout(() => {
          setPhase('idle');
        }, 40);
      }, 380);
    }
  }, [targetKey, displayKey, currentPillar]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

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

  // Dynamic Typography Helpers
  const getHeadingFontClass = () => {
    switch (fontTheme) {
      case 'cinzel-monumental':
        return 'font-artistic-display uppercase tracking-widest font-semibold';
      case 'marcellus-editorial':
        return 'font-artistic-heading font-normal tracking-wide';
      case 'garamond-poetic':
        return 'font-artistic-serif italic font-medium tracking-wide';
      case 'syne-modern':
        return 'font-artistic-modern font-extrabold uppercase tracking-tight';
      default:
        return 'font-artistic-heading';
    }
  };

  return (
    <main
      id="hero-clone-stage"
      /* No background of its own. The page-wide .accent-canvas layer paints
         the gradient for every screen at once, so it cannot restart at the
         fold — two sections each running their own 135deg ramp meant the
         hero ended near accent-b just as the next screen began again at
         accent-a, which is the seam. */
      /* NO `transition-all` here any more. It was vestigial — this element
         has no background and no inline style, nothing on it ever changes,
         so it transitioned nothing (see the note above: the gradient moved
         out to .accent-canvas). It was not harmless, though: PillarsSection
         now writes this element's transform and opacity every frame to
         recede the hero as the exhibition rises over it, and a 700ms
         transition-all would have smeared each of those writes across
         700ms — the reader's scroll and the hero's motion permanently out
         of step. */
      className="snap-screen relative z-10 w-full min-h-[100vh] flex flex-col justify-between pt-[76px] pb-12 px-4 sm:px-8 md:px-12 lg:px-16 overflow-hidden select-none"
      style={{ willChange: 'transform, opacity', transformOrigin: '50% 42%' }}
    >
      <div className="hero-restored-ground accent-canvas" aria-hidden="true" />
      <HeroCurtain />
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

      {/* 4. FADED WHITE LOTUS HERO BACKGROUND GRAPHICS */}
      <div
        id="hero-lotus-watermark"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
      >
        <canvas className="hero-petal-transition-canvas" aria-hidden="true" />
        <img
          src={resolveCMSAsset("asset.HeroSection.51c5d5f403d2", "/images/lotus-watermark.png")}
          alt=""
          role="presentation"
          aria-hidden="true"
          className="w-[75vw] h-[75vh] object-contain opacity-[0.09]"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* DISCREET SETTINGS TRIGGER (Opens the design studio drawer) */}
      <button
        id="hero-settings-trigger"
        onClick={() => setIsStudioOpen(!isStudioOpen)}
        aria-label={isStudioOpen ? 'Close hero settings' : 'Open hero settings'}
        aria-expanded={isStudioOpen}
        title={getCMSCopy("copy.HeroSection.b4bf826ad7e8", "Hero settings")}
        className={`group absolute top-[88px] right-4 sm:right-6 md:right-8 lg:right-10 z-40 grid place-items-center w-9 h-9 rounded-full border cursor-pointer transition-all duration-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
          isStudioOpen
            ? 'opacity-100 rotate-90 bg-amber-400 text-neutral-950 border-amber-300 shadow-lg'
            : 'opacity-[0.18] hover:opacity-100 hover:rotate-45 bg-black/30 hover:bg-black/60 text-white/90 border-white/15 hover:border-white/40 backdrop-blur-md'
        }`}
      >
        <Settings className="w-4 h-4" />

        {/* Faint marker that auto-rotation is paused, surfaced only on hover */}
        {isPaused && !isStudioOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </button>

      {/* EXPANDABLE DESIGN STUDIO DRAWER */}
      {isStudioOpen && (
        <div
          id="hero-design-studio-drawer"
          className="relative z-30 mb-6 p-4 sm:p-6 rounded-3xl bg-neutral-950/80 backdrop-blur-xl border border-white/20 shadow-2xl text-white animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-4 pr-12">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-artistic-heading text-base sm:text-lg font-bold tracking-wide">{getCMSCopy("copy.HeroSection.d72fe2c6264a", "Live Style & Motion Customizer")}</h3>
            </div>
            <span className="text-xs text-neutral-400">{getCMSCopy("copy.HeroSection.9dc429d2bbc2", "Interactive design adjustments for the orbit carousel")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 1. Typography Pairings */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.5caadabe7659", " Editorial Typography")}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'marcellus-editorial', name: getCMSCopy("copy.HeroSection.c70470565292", "Marcellus") },
                    { id: 'cinzel-monumental', name: getCMSCopy("copy.HeroSection.1cc364db0d2c", "Cinzel") },
                    { id: 'garamond-poetic', name: getCMSCopy("copy.HeroSection.b28a8d4af9c3", "Garamond") },
                    { id: 'syne-modern', name: getCMSCopy("copy.HeroSection.fd293ff4e23b", "Syne Neo") },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFontTheme(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      fontTheme === t.id
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pillar name size — multiplies the fluid clamp, so it stays responsive */}
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.d63db49427e8", " Pillar Name Size")}</span>
                <span className="text-amber-300 tabular-nums normal-case tracking-normal">
                  {Math.round(pillarNameScale * 100)}% · {pillarNamePx}{getCMSCopy("copy.HeroSection.2d61b94393b8", "px here")}</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="hero-pillar-name-size"
                  type="range"
                  min="0.6"
                  max="2"
                  step="0.05"
                  value={pillarNameScale}
                  onChange={(e) => setPillarNameScale(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <button
                  onClick={() => setPillarNameScale(1)}
                  className="flex-shrink-0 text-[11px] font-semibold text-neutral-400 hover:text-white underline underline-offset-2 cursor-pointer"
                >{getCMSCopy("copy.HeroSection.daee7606b339", "Reset")}</button>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">{getCMSCopy("copy.HeroSection.618a67ebf739", "Scales the fluid size — the name still grows and shrinks with the screen at every setting.")}</p>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
              <label htmlFor="hero-icon-size" className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><Layout className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.eb84c28d0955", " 3D Icon Size")}</span>
                <span className="text-amber-300 tabular-nums">{Math.round(cardScale * 100)}%</span>
              </label>
              <div className="flex items-center gap-3">
                <button type="button" aria-label={getCMSCopy("copy.HeroSection.385ad56b7b5d", "Decrease 3D icon size")} disabled={cardScale <= 0.5}
                  onClick={() => setCardScale(value => Math.max(0.5, Math.round((value - 0.1) * 100) / 100))}
                  className="w-8 h-8 shrink-0 rounded-lg bg-white/10 text-white disabled:opacity-30">−</button>
                <input id="hero-icon-size" type="range" min="0.5" max="1.8" step="0.05"
                  value={cardScale} onChange={(e) => setCardScale(Number(e.target.value))}
                  aria-valuetext={`${Math.round(cardScale * 100)} percent`}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400" />
                <button type="button" aria-label={getCMSCopy("copy.HeroSection.1f76c27ba811", "Increase 3D icon size")} disabled={cardScale >= 1.8}
                  onClick={() => setCardScale(value => Math.min(1.8, Math.round((value + 0.1) * 100) / 100))}
                  className="w-8 h-8 shrink-0 rounded-lg bg-white/10 text-white disabled:opacity-30">+</button>
                <button type="button" onClick={() => setCardScale(1)}
                  className="shrink-0 text-[11px] font-semibold text-neutral-400 hover:text-white underline underline-offset-2">{getCMSCopy("copy.HeroSection.daee7606b339", "Reset")}</button>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">{getCMSCopy("copy.HeroSection.428325204f8f", "100% balances the featured icon with the full text block. Adjust from 50% to 180%.")}</p>
            </div>

            {/* 2. Sacred Aura Visual Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.9ddebdbc2e7e", " Background Aura")}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'sacred-mandala', name: getCMSCopy("copy.HeroSection.893b99492c3e", "Mandala") },
                    { id: 'celestial-rings', name: getCMSCopy("copy.HeroSection.bab4c75d0722", "Rings") },
                    { id: 'cosmic-nebula', name: getCMSCopy("copy.HeroSection.04b8dcba096f", "Nebula") },
                    { id: 'minimal-clean', name: getCMSCopy("copy.HeroSection.057b5de48d7b", "Minimal") },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAuraEffect(a.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                      auraEffect === a.id
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Gradient Angle & Glow Sliders */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.a2d1351cc8ee", " Gradient & Glow")}</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>{getCMSCopy("copy.HeroSection.cbe72fa83d95", "Wipe Angle: ")}{gradientAngle}°</span>
                  <button
                    onClick={() => setGradientAngle((prev) => (prev + 45) % 360)}
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <RotateCw className="w-3 h-3" />{getCMSCopy("copy.HeroSection.0213b9349f96", " +45°")}</button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex items-center justify-between text-xs text-neutral-300 mt-1">
                  <span>{getCMSCopy("copy.HeroSection.eb6170d865df", "Glow Intensity: ")}{Math.round(glowIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* 4. Content Elements & Preset Tags */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-amber-400" />{getCMSCopy("copy.HeroSection.7ad1aff3ea68", " Layout Features")}</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    showMetrics
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  <span>{getCMSCopy("copy.HeroSection.faac55222144", "Impact Metrics Bar")}</span>
                  <span>{showMetrics ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={onTogglePause}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    isPaused
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  <span>{getCMSCopy("copy.HeroSection.4f210fb57610", "Auto 3D Rotation")}</span>
                  <span>{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <p className="home-eyebrow hero-eyebrow"><span />{getCMSCopy("copy.HeroSection.d5dc0eff1e60", " Service with Humility")}</p>
          <div ref={copySizeRef} className="w-full flex flex-col">
            {/* 1. Large Script-Style Pillar Name Heading in Dancing Script (Delay: 0ms) */}
            <h2
              id="hero-script-pillar-name"
              style={{ transitionDelay: phase === 'exiting' ? '90ms' : '0ms' }}
              className={`font-dancing-script pillar-script-name font-bold text-white leading-tight sm:leading-none mb-1 sm:mb-2 drop-shadow-md select-none transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {getPillarScriptTitle(displayPillar)}
            </h2>

            {/* 2. Main Headline (Delay: 50ms) */}
            <h1
              id="hero-headline"
              style={{ transitionDelay: phase === 'exiting' ? '70ms' : '60ms' }}
              className={`${getHeadingFontClass()} text-white text-[27px] sm:text-[32px] md:text-[40px] md:leading-[47px] mb-3.5 min-h-[2.4em] drop-shadow-md transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
            >
              {displayPillar.headline}
            </h1>

            {/* 3. Body Copy (Delay: 100ms) */}
            <p
              id="hero-body-text"
              style={{ transitionDelay: phase === 'exiting' ? '45ms' : '120ms' }}
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
        </div>

        {/* Floating 3D pillar icons — blooms in just after the copy */}
        <div
          className={`hero-sculptures w-full lg:w-1/2 flex justify-center lg:justify-start ${
            introActive ? 'hero-intro-bloom' : 'hero-intro-waiting'
          }`}
        >
          <HeroOrbitWheel
            pillars={pillars}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            isPaused={isPaused || !introActive || !heroVisible}
            onCardClick={(clickedIndex) => {
              // Clicking a pillar card opens that pillar's details
              if (clickedIndex < pillars.length) {
                onActiveIndexChange(clickedIndex);
                onOpenDetails(pillars[clickedIndex]);
              }
            }}
          />
        </div>
      </div>
      <div className="hero-bottom-line">
        <span>{getCMSCopy("copy.HeroSection.f41de8da275f", "Compassion in action. Possibilities for everyone.")}</span>
        <div className="hero-playback">
          <span className="hero-chapter" aria-label={`Pillar ${activeIndex + 1} of ${pillars.length}`}>{getCMSCopy("copy.HeroSection.5feceb66ffc8", "0")}{activeIndex + 1}<i />{getCMSCopy("copy.HeroSection.5feceb66ffc8", "0")}{pillars.length}</span>
          <button onClick={onTogglePause} aria-label={isPaused ? 'Play hero animation' : 'Pause hero animation'}>
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
      </div>
    </main>

  );
};
