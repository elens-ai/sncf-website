import React from 'react';
import { PillarState } from '../types';
import { HealCardMark } from './HealCardMark';
import { EnrichCardMark } from './EnrichCardMark';

interface CardIllustrationProps {
  pillar: PillarState;
  index: number;
  roundedClass?: string;
  isActive?: boolean;
}

export const CardIllustration: React.FC<CardIllustrationProps> = ({
  pillar,
  roundedClass = 'rounded-[18px]',
  isActive = false,
}) => {
  // 1. DEDICATED HEAL CARD (Plain White Background, 3D Pop-Out & Tilt, Enlarged Mark, Dark Green Typography)
  if (pillar.id === 'heal') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${roundedClass} select-none bg-white flex flex-col justify-between p-3.5 sm:p-4 shadow-inner`}
      >
        {/* Upper Interactive Stage for the 3D Pop-out Heal Mark (Increased size ~154px) */}
        <div className="relative flex-1 w-full flex items-center justify-center pt-2 pb-1">
          <HealCardMark size={154} />
        </div>

        {/* Bottom Badge & Caption recolored to dark green (#1c8a5f) for high legibility on white */}
        <div className="relative text-left z-10">
          <div className="inline-block px-2.5 py-0.5 mb-1 rounded-full bg-[#1c8a5f]/15 border border-[#1c8a5f]/30 text-[10px] uppercase font-extrabold tracking-wider text-[#1c8a5f]">
            <span className="font-artistic-display tracking-widest">{pillar.label}</span>
          </div>
          <p className="font-artistic-serif text-[#1c8a5f] font-bold text-sm sm:text-base leading-snug line-clamp-2 tracking-wide">
            {pillar.headline}
          </p>
        </div>
      </div>
    );
  }

  // 2. DEDICATED EMPOWER CARD — always-visible SVG figure (arms raised) with
  //    soft halo rings, badge and headline; mirrors the Heal card's structure.
  //    Replaces the hover-only EmpowerCardMark, which rendered a nearly blank
  //    card at rest.
  if (pillar.id === 'empower') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${roundedClass} select-none bg-white flex flex-col justify-between p-3.5 sm:p-4 shadow-inner`}
      >
        <div className="relative flex-1 w-full flex items-center justify-center pt-2 pb-1">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#DE4A94]/10" />
            <div className="absolute inset-5 rounded-full bg-[#DE4A94]/15" />
            <svg
              className="relative w-20 h-20 text-[#C93E82]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Person with arms raised"
            >
              <circle cx="12" cy="4.4" r="2.1" fill="currentColor" stroke="none" />
              <path d="M12 7.6v6.6" />
              <path d="M12 8.6 6.6 5" />
              <path d="M12 8.6 17.4 5" />
              <path d="M12 14.2 8.4 20.6" />
              <path d="M12 14.2 15.6 20.6" />
            </svg>
          </div>
        </div>

        <div className="relative text-left z-10">
          <div className="inline-block px-2.5 py-0.5 mb-1 rounded-full bg-[#C93E82]/15 border border-[#C93E82]/30 text-[10px] uppercase font-extrabold tracking-wider text-[#C93E82]">
            <span className="font-artistic-display tracking-widest">{pillar.label}</span>
          </div>
          <p className="font-artistic-serif text-[#C93E82] font-bold text-sm sm:text-base leading-snug line-clamp-2 tracking-wide">
            {pillar.headline}
          </p>
        </div>
      </div>
    );
  }

  // 3. OTHER PILLARS (Sky, Sun, Clouds, Rolling Hills Backdrop & Vector Art)
  return (
    <div className={`relative w-full h-full overflow-hidden ${roundedClass} select-none pointer-events-none`}>
      {/* Sky to Grass Base Backdrop (60% sky, 40% grass landscape) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7ec8f8] via-[#a6dbf7] to-[#48a85f]">
        {/* Soft Sun Ray Glow */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-yellow-200/50 blur-xl" />
        <div className="absolute top-4 right-5 w-10 h-10 rounded-full bg-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]" />

        {/* SVG Clouds */}
        <svg
          className="absolute top-6 left-3 w-16 h-8 text-white/90 fill-current drop-shadow-sm opacity-90"
          viewBox="0 0 64 32"
        >
          <path d="M12 24h38a10 10 0 0 0 1-19.9 14 14 0 0 0-27-2.1A10 10 0 0 0 12 24z" />
        </svg>

        <svg
          className="absolute top-12 right-10 w-12 h-6 text-white/75 fill-current opacity-80"
          viewBox="0 0 64 32"
        >
          <path d="M10 22h32a8 8 0 0 0 1-15.9 11 11 0 0 0-21-1.7A8 8 0 0 0 10 22z" />
        </svg>

        {/* Rolling Hills (Grass Layers) */}
        <svg
          className="absolute bottom-10 left-0 right-0 w-full h-24 preserve-3d"
          viewBox="0 0 220 90"
          preserveAspectRatio="none"
        >
          {/* Distant hill */}
          <path
            d="M0,50 Q60,15 120,40 T220,25 L220,90 L0,90 Z"
            fill="#3da055"
            opacity="0.9"
          />
          {/* Foreground hill */}
          <path
            d="M0,40 Q80,65 150,30 T220,55 L220,90 L0,90 Z"
            fill="#2c8a42"
          />
        </svg>

        {/* Dedicated Vector Art Scene per Pillar */}
        <div className="absolute inset-0 flex items-center justify-center pt-2 pb-16">
          {pillar.id === 'enrich' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <EnrichCardMark isActive={isActive} />
            </div>
          )}

          {pillar.id === 'empower' && (
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Youth Eco Tree & Sapling */}
              <div className="absolute w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-md">
                <div className="w-14 h-14 rounded-full bg-pink-600 flex items-center justify-center shadow-inner text-white">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2a9 9 0 0 0-9 9c0 3.8 2.4 7 5.8 8.3.4.1.7-.1.7-.4v-2.3c-2.4.5-2.9-1.2-2.9-1.2-.4-1-1-1.3-1-1.3-.8-.5.1-.5.1-.5.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4.3 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.4.9.7-.2 1.5-.3 2.2-.3s1.5.1 2.2.3c1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.3-2 4.1-3.9 4.3.3.3.6.8.6 1.7v2.5c0 .3.3.5.7.4A9 9 0 0 0 21 11a9 9 0 0 0-9-9z" />
                  </svg>
                </div>
              </div>
              {/* Floating Leaf Badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5c0 1.5 1 2.5 2 2.5 1 0 1.5-.5 2-1" />
                </svg>
              </div>
            </div>
          )}

          {pillar.id === 'projects' && (
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Health City & Infrastructure */}
              <div className="absolute w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-md">
                <div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center shadow-inner text-white">
                  {/* Flagship infrastructure: skyline with a health-cross tower */}
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    role="img"
                    aria-label="City skyline with hospital"
                  >
                    <path d="M3 20V11l4-1.5V20" />
                    <path d="M10 20V6.5L15 5v15" />
                    <path d="M18 20v-9h3v9" />
                    <path d="M12.5 9.5v3M11 11h3" />
                    <path d="M2 20h20" />
                  </svg>
                </div>
              </div>
              {/* Floating Water / Hospital badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            </div>
          )}

          {pillar.id === 'amrit' && (
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Project Amrit Clean Water & Ripple */}
              <div className="absolute w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-md animate-pulse">
                <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center shadow-inner text-white">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
              </div>
              {/* Floating Wave badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-400 text-cyan-950 flex items-center justify-center shadow-lg border-2 border-white font-bold">
                ≈
              </div>
            </div>
          )}

          {pillar.id === 'oneness' && (
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Oneness Universal Globe & Brotherhood */}
              <div className="absolute w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-md">
                <div className="w-14 h-14 rounded-full bg-purple-700 flex items-center justify-center shadow-inner text-white">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M3.6 9h16.8M3.6 15h16.8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              {/* Floating Unity Heart badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                ♥
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphism subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

      {/* Caption Overlay (Bottom Third): 2-3 lines of white bold text, left-aligned, 16px padding */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 text-left z-10 transition-all duration-500 ease-out">
        <div className="inline-block px-2.5 py-0.5 mb-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase font-extrabold tracking-wider text-white border border-white/30 transition-all duration-500">
          <span className="font-artistic-display tracking-widest">{pillar.label}</span>
        </div>
        <p className="font-artistic-serif text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-md tracking-wide transition-all duration-500">
          {pillar.headline}
        </p>
      </div>
    </div>
  );
};
