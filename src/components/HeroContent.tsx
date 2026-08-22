import React, { useEffect, useState, useRef } from 'react';
import { PillarState } from '../types';
import { OdometerStatCounter } from './OdometerStatCounter';

interface HeroContentProps {
  pillar: PillarState;
  onLearnMoreClick: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  pillar,
  onLearnMoreClick,
}) => {
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [displayPillar, setDisplayPillar] = useState<PillarState>(pillar);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger gentle staggered fade-out (360ms), switch content, then smooth staggered fade-in (420ms)
  useEffect(() => {
    if (pillar.id !== displayPillar.id) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);

      setPhase('exiting');

      exitTimerRef.current = setTimeout(() => {
        setDisplayPillar(pillar);
        setPhase('entering');

        enterTimerRef.current = setTimeout(() => {
          setPhase('idle');
        }, 500);
      }, 360);
    }
  }, [pillar, displayPillar.id]);

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

  const isExiting = phase === 'exiting';

  return (
    <div
      id="hero-text-block"
      className="w-full max-w-[480px] text-left z-20 py-2 sm:py-6"
      aria-live="polite"
    >
      <div className="w-full flex flex-col">
        {/* 1. Large Script-Style Pillar Name Heading in Dancing Script (Delay: 0ms) */}
        <h2
          id="hero-script-pillar-name"
          className={`font-dancing-script pillar-script-name font-bold text-white leading-tight sm:leading-none mb-1 sm:mb-2 drop-shadow-md select-none transition-[opacity,transform] duration-400 ease-in-out ${
            isExiting
              ? 'opacity-0 -translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {getPillarScriptTitle(displayPillar)}
        </h2>

        {/* 2. Main Headline (Delay: 50ms) */}
        <h1
          id="hero-headline"
          style={{ transitionDelay: isExiting ? '0ms' : '50ms' }}
          className={`text-white font-extrabold text-3xl sm:text-4xl md:text-[40px] md:leading-[48px] tracking-tight mb-3 sm:mb-4 drop-shadow-md transition-all duration-400 ease-in-out ${
            isExiting
              ? 'opacity-0 -translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {displayPillar.headline}
        </h1>

        {/* 3. Body Paragraph (Delay: 100ms) */}
        <p
          id="hero-body-text"
          style={{ transitionDelay: isExiting ? '0ms' : '100ms' }}
          className={`text-white/90 text-base sm:text-[17px] md:text-[18px] leading-relaxed font-normal mb-6 drop-shadow-sm max-w-[440px] transition-all duration-400 ease-in-out ${
            isExiting
              ? 'opacity-0 -translate-y-1.5'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {displayPillar.body}
        </p>

        {/* 4. Key Quick Impact Numbers Strip (Delay: 160ms) */}
        <div
          style={{ transitionDelay: isExiting ? '0ms' : '160ms' }}
          className={`grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 max-w-[420px] transition-all duration-400 ease-in-out ${
            isExiting
              ? 'opacity-0 -translate-y-1.5'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {displayPillar.stats.slice(0, 2).map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                <OdometerStatCounter
                  key={`${displayPillar.id}-${i}-${stat.value}`}
                  value={stat.value}
                  duration={1800}
                />
              </span>
              <span className="text-[11px] text-white/75 font-medium leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* 5. "Learn More" Button (Delay: 220ms, with 1000ms color crossfade) */}
        <div
          style={{ transitionDelay: isExiting ? '0ms' : '220ms' }}
          className={`flex items-center gap-3 transition-all duration-400 ease-in-out ${
            isExiting
              ? 'opacity-0 -translate-y-1'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <button
            id={`learn-more-${displayPillar.id}-btn`}
            onClick={onLearnMoreClick}
            className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-white font-semibold text-sm sm:text-base shadow-xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/40 overflow-hidden"
            style={{
              backgroundColor: displayPillar.accentA,
              boxShadow: `0 10px 25px -5px ${displayPillar.accentA}88`,
              transition: 'background-color 1000ms cubic-bezier(0.45, 0.05, 0.25, 1), box-shadow 1000ms cubic-bezier(0.45, 0.05, 0.25, 1), transform 200ms ease',
            }}
          >
            {/* Ripple shine highlight on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />

            <span>Learn more about {displayPillar.label}</span>

            {/* Arrow SVG Icon */}
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
