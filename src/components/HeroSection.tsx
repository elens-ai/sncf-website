import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { HeroOrbitWheel } from '../components/HeroOrbitWheel';
import { SocialSidebar } from '../components/SocialSidebar';
import { DevotionalLightboxModal } from '../components/DevotionalLightboxModal';
import { DevotionalLeader, DEVOTIONAL_ACCENT } from '../components/DevotionalPhotoCard';
import { FoundationIntro } from '../components/FoundationIntro';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import {
  Sparkles,
  Settings,
  Palette,
  Type,
  RotateCw,
  Layout,
  Flame,
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

  // Selected spiritual leader for the photo card lightbox modal
  const [selectedPhotoLeader, setSelectedPhotoLeader] = useState<DevotionalLeader | null>(null);

  // Live design studio controls
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [fontTheme, setFontTheme] = useState<ArtisticFontTheme>('marcellus-editorial');
  const [auraEffect, setAuraEffect] = useState<SacredAuraEffect>('sacred-mandala');
  const [gradientAngle, setGradientAngle] = useState<number>(135);
  /* Multiplies the fluid clamp on the pillar script name, so the size stays
     responsive at every setting rather than being pinned to one pixel value. */
  const [pillarNameScale, setPillarNameScale] = useState<number>(1);
  /* Multiplies the responsive card bases, so the carousel resizes as a whole —
     cards and orbit radius both follow from this one value. */
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

  // Mirrors the responsive --card-*-base values so the studio can report real px
  const cardBase =
    viewportWidth <= 900 ? { w: 127, h: 163 } : viewportWidth <= 1200 ? { w: 174, h: 222 } : { w: 210, h: 270 };
  const cardPx = `${Math.round(cardBase.w * cardScale)}×${Math.round(cardBase.h * cardScale)}`;

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
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');

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
  /* The wheel opens on the Satguru Mata Sudiksha Ji portrait, so the copy
     column opens on the devotional quote. null = a pillar card is front. */
  const [devotionalIdx, setDevotionalIdx] = useState<number | null>(0);
  const [displayLeaderIdx, setDisplayLeaderIdx] = useState<number | null>(0);

  /* Serene rose stage while the devotional portrait fronts — the pillar
     gradients read as brand verticals; this slide deserves its own mood.
     Imported, not redeclared, so the stage and the portrait card cannot
     drift to different colours. */
  const stageAccentA = devotionalIdx !== null ? DEVOTIONAL_ACCENT.a : currentPillar.accentA;
  const stageAccentB = devotionalIdx !== null ? DEVOTIONAL_ACCENT.b : currentPillar.accentB;

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

  // Trigger smooth staggered fade-out and fade-in when the front content
  // changes — pillar to pillar, pillar to quote, or quote back to pillar.
  /* Both portraits show the same quote, so they collapse into one 'quote'
     state — the copy holds steady from Mata Ji through Rajpita Ji and only
     shuttles again when Heal arrives. */
  const targetKey = devotionalIdx !== null ? 'quote' : `P${currentPillar.id}`;
  const displayKey = displayLeaderIdx !== null ? 'quote' : `P${displayPillar.id}`;

  useEffect(() => {
    if (targetKey !== displayKey) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

      setPhase('exiting');

      exitTimerRef.current = setTimeout(() => {
        setDisplayPillar(currentPillar);
        setDisplayLeaderIdx(devotionalIdx);
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
  }, [targetKey, displayKey, currentPillar, devotionalIdx]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  /* NOTE: --accent-a/--accent-b are written in exactly ONE place, the effect
     above. A second effect here used to write currentPillar's accents to the
     same two variables. Both ran on every mount, the pillar one was declared
     later so it ran last and won, and the header chrome was therefore painted
     in the front PILLAR's colour even while a devotional portrait fronted and
     the stage was rose. That is the colour mismatch at the intro. Anything
     needing the current mood should read the vars or stageAccentA/B. */

  // Keyboard navigation for the 4 pillars
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoLeader) return;
      if (e.key === 'ArrowRight') {
        onActiveIndexChange((activeIndex + 1) % pillars.length);
      } else if (e.key === 'ArrowLeft') {
        onActiveIndexChange((activeIndex - 1 + pillars.length) % pillars.length);
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, onActiveIndexChange, onTogglePause, pillars.length, selectedPhotoLeader]);

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
      className="snap-screen relative z-10 w-full min-h-[100vh] flex flex-col justify-between pt-[76px] pb-12 px-4 sm:px-8 md:px-12 lg:px-16 overflow-hidden transition-all duration-700 select-none"
    >
      {/* 1. LEFT SOCIAL SIDEBAR (Fixed & Vertically Centered) */}
      <SocialSidebar />

      {/* Glow behind the wheel. The left-to-right darkening that used to be
          layered in here now lives on the page-wide .accent-canvas instead:
          being uniform down the hero's height, it stopped dead at the hero's
          bottom edge and drew a band across the fold. This radial glow can
          stay because it fades to transparent well inside its own bounds, so
          it contributes nothing at the edge. */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-0"
        style={{
          background: `radial-gradient(circle at 75% 50%, rgba(255,255,255,${glowIntensity * 0.15}) 0%, transparent 60%)`,
        }}
      />

      {/* 2. TOP-LEFT CELESTIAL RING */}
      <div
        id="hero-top-left-celestial-ring"
        className="celestial-ring absolute -left-[20%] -top-[16%] sm:-left-[12%] sm:-top-[12%] md:-left-[6%] md:-top-[8%] w-[58vh] h-[58vh] max-w-[560px] max-h-[560px] rounded-full border border-white/20 pointer-events-none z-0"
        style={{
          boxShadow: 'inset 0 0 60px rgba(255, 255, 255, 0.05), 0 0 80px rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="absolute inset-6 rounded-full border border-dashed border-white/15" />
        <div className="absolute inset-16 rounded-full border border-white/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/60 shadow-[0_0_10px_white]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/50" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white/70 shadow-[0_0_12px_white]" />
      </div>

      {/* 3. RIGHT CELESTIAL RING (Behind 6-Card Carousel) */}
      <div
        id="decorative-celestial-circle"
        className="celestial-ring absolute -right-[20%] top-1/2 -translate-y-1/2 w-[70vh] h-[70vh] max-w-[700px] max-h-[700px] rounded-full border border-white/20 pointer-events-none z-0"
        style={{
          boxShadow: 'inset 0 0 60px rgba(255, 255, 255, 0.05), 0 0 80px rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="absolute inset-6 rounded-full border border-dashed border-white/15" />
        <div className="absolute inset-16 rounded-full border border-white/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/60 shadow-[0_0_10px_white]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/50" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white/70 shadow-[0_0_12px_white]" />
      </div>

      {/* 4. FADED WHITE LOTUS HERO BACKGROUND GRAPHICS */}
      <div
        id="hero-lotus-watermark"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
      >
        <img
          src="/images/lotus-watermark.png"
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
        title="Hero settings"
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
              <h3 className="font-artistic-heading text-base sm:text-lg font-bold tracking-wide">
                Live Style &amp; Motion Customizer
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              Interactive design adjustments for the orbit carousel
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 1. Typography Pairings */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" /> Editorial Typography
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'marcellus-editorial', name: 'Marcellus' },
                    { id: 'cinzel-monumental', name: 'Cinzel' },
                    { id: 'garamond-poetic', name: 'Garamond' },
                    { id: 'syne-modern', name: 'Syne Neo' },
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
                  <Type className="w-3.5 h-3.5 text-amber-400" /> Pillar Name Size
                </span>
                <span className="text-amber-300 tabular-nums normal-case tracking-normal">
                  {Math.round(pillarNameScale * 100)}% · {pillarNamePx}px here
                </span>
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
                >
                  Reset
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Scales the fluid size — the name still grows and shrinks with the
                screen at every setting.
              </p>
            </div>

            {/* Card size — scales the whole carousel, orbit radius included */}
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-amber-400" /> Card Size
                </span>
                <span className="text-amber-300 tabular-nums normal-case tracking-normal">
                  {Math.round(cardScale * 100)}% · {cardPx}px here
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="hero-card-size"
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => setCardScale(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <button
                  onClick={() => setCardScale(1)}
                  className="flex-shrink-0 text-[11px] font-semibold text-neutral-400 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Reset
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">
                Resizes the cards and widens the orbit to match, so the carousel keeps
                its spacing. Responsive breakpoints still apply underneath.
              </p>
            </div>

            {/* 2. Sacred Aura Visual Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Background Aura
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'sacred-mandala', name: 'Mandala' },
                    { id: 'celestial-rings', name: 'Rings' },
                    { id: 'cosmic-nebula', name: 'Nebula' },
                    { id: 'minimal-clean', name: 'Minimal' },
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
                <Palette className="w-3.5 h-3.5 text-amber-400" /> Gradient & Glow
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Wipe Angle: {gradientAngle}°</span>
                  <button
                    onClick={() => setGradientAngle((prev) => (prev + 45) % 360)}
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <RotateCw className="w-3 h-3" /> +45°
                  </button>
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
                  <span>Glow Intensity: {Math.round(glowIntensity * 100)}%</span>
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
                <Layout className="w-3.5 h-3.5 text-amber-400" /> Layout Features
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    showMetrics
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  <span>Impact Metrics Bar</span>
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
                  <span>Auto 3D Rotation</span>
                  <span>{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN HERO CONTENT GRID */}
      <div
        /* Left padding clears the fixed social rail (which only shows at md+),
           so the editorial copy never crowds the icons. */
        className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 my-auto pl-0 md:pl-14 lg:pl-16 xl:pl-20"
      >
        {/* Left Editorial Copy Area */}
        {/* z-20 keeps the copy above the orbit: at this card size the outer cards
            reach back across the text column, and they are blurred/faded there
            anyway, so the text should read over them rather than under. */}
        <div
          className={`relative z-20 w-full lg:w-1/2 flex flex-col justify-center items-start max-w-xl ${
            introActive ? 'hero-intro-rise' : 'hero-intro-waiting'
          }`}
        >
          <div className="w-full flex flex-col">
            {displayLeaderIdx !== null ? (
              /* FOUNDATION INTRO — shown while the Satguru Mata Sudiksha Ji
                 portrait fronts the wheel. Same shuttle phases as the pillar
                 copy, so pillar -> intro -> pillar all move as one vertical
                 stream. The wrapper reserves the pillar block's height via
                 --pillar-copy-height so, in the centered column, Welcome lands
                 on the same line Heal occupies — without it the shorter block
                 re-centers ~100px lower and the swap visibly jumps. */
              <div className="flex flex-col md:min-h-[var(--pillar-copy-height)]">
                {/* Same class, size and margins as the pillar script names, so
                    Heal -> Welcome (and back) swap in place instead of jumping. */}
                <p
                  className={`font-dancing-script pillar-script-name font-bold text-white leading-tight sm:leading-none mb-1 sm:mb-2 drop-shadow-md select-none transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
                >
                  Welcome
                </p>
                <div
                  style={{ transitionDelay: phase === 'exiting' ? '0ms' : '60ms' }}
                  className={`transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
                >
                  {/* Typing starts only once the copy has settled into place —
                      running it during the shuttle would waste the first third
                      of the sentence behind a moving, half-faded block. */}
                  <FoundationIntro active={phase === 'idle'} />
                </div>
              </div>
            ) : (
              <>
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
                className={`grid grid-cols-2 gap-2.5 mb-5 px-3 py-2.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-[360px] shadow-lg transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${copyPhaseClass}`}
              >
                {displayPillar.stats.slice(0, 2).map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-artistic-heading text-[19px] sm:text-[23px] font-bold text-white tracking-tight">
                      <OdometerStatCounter
                        key={`${displayPillar.id}-${i}-${stat.value}`}
                        value={stat.value}
                        duration={1800}
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
                <span>Explore {displayPillar.label} Details</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200 fill-none stroke-current stroke-2"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
              </>
            )}
          </div>
        </div>

        {/* Right 3D 6-Card Orbit Carousel — blooms in just after the copy */}
        <div
          className={`w-full lg:w-1/2 flex justify-center lg:justify-start ${
            introActive ? 'hero-intro-bloom' : 'hero-intro-waiting'
          }`}
        >
          <HeroOrbitWheel
            onDevotionalFront={setDevotionalIdx}
            pillars={pillars}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
            isPaused={isPaused}
            onCardClick={(clickedIndex) => {
              // Clicking a pillar card opens that pillar's details
              if (clickedIndex < pillars.length) {
                onActiveIndexChange(clickedIndex);
                onOpenDetails(pillars[clickedIndex]);
              }
            }}
            onPhotoCardClick={(leader) => {
              // Clicking a photo card opens the devotional portrait lightbox
              setSelectedPhotoLeader(leader);
            }}
          />
        </div>
      </div>

      {/* Devotional Lightbox Modal for Photo Cards */}
      <DevotionalLightboxModal
        leader={selectedPhotoLeader}
        onClose={() => setSelectedPhotoLeader(null)}
      />
    </main>
  );
};
