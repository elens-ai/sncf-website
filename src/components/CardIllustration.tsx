import React from 'react';
import { PillarState } from '../types';

interface CardIllustrationProps {
  pillar: PillarState;
  index: number;
  roundedClass?: string;
  isActive?: boolean;
}

/**
 * Flat colour card for the orbit carousel.
 *
 * Replaces the previous per-pillar illustration scenes (layered sky gradients,
 * sun glow, cloud and hill SVGs, animated marks — ~25 nodes each). Those made
 * every card an expensive layer to rasterise, and the wheel re-rasterises on
 * every frame while the depth blur changes. A gradient plus one line icon
 * renders in a fraction of the time and keeps each pillar instantly readable
 * by colour alone.
 */

const ICONS: Record<string, React.ReactNode> = {
  // Heal — leaf / care
  heal: (
    <>
      <path d="M12 21c0-6.5 3.2-10.4 8-11-.3 5.9-3.4 9.7-8 11Z" />
      <path d="M12 21c0-5.6-2.7-9-6.8-9.6C5.5 16.5 8.1 19.7 12 21Z" />
      <path d="M12 21v-5" />
    </>
  ),
  // Enrich — open book / learning
  enrich: (
    <>
      <path d="M3 5.5c2.8-.9 5.5-.9 8.2.6v12c-2.7-1.5-5.4-1.5-8.2-.6v-12Z" />
      <path d="M20.2 5.5c-2.8-.9-5.5-.9-8.2.6v12c2.7-1.5 5.4-1.5 8.2-.6v-12Z" />
      <path d="M11.6 6.1v12" />
    </>
  ),
  // Empower — figure with arms raised
  empower: (
    <>
      <circle cx="12" cy="4.6" r="2.1" />
      <path d="M12 7.8v6.4" />
      <path d="M12 8.8 6.7 5.2" />
      <path d="M12 8.8l5.3-3.6" />
      <path d="M12 14.2 8.5 20.6" />
      <path d="M12 14.2l3.5 6.4" />
    </>
  ),
  // Projects — skyline with a health cross
  projects: (
    <>
      <path d="M3 20v-8.6l4-1.5V20" />
      <path d="M10 20V6.2L15.2 4.6V20" />
      <path d="M18.2 20v-8.8H21V20" />
      <path d="M12.6 9.2v3.2M11 10.8h3.2" />
      <path d="M2 20h20" />
    </>
  ),
  amrit: (
    <>
      <path d="M12 3.2 17 9.4a6.4 6.4 0 1 1-10 0Z" />
      <path d="M8.6 14.4c.9 1.2 2 1.8 3.4 1.8" />
    </>
  ),
  oneness: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.8 9.6h16.4M3.8 14.4h16.4" />
      <path d="M12 3.6c2.2 2.4 3.3 5.2 3.3 8.4S14.2 18 12 20.4C9.8 18 8.7 15.2 8.7 12S9.8 6 12 3.6Z" />
    </>
  ),
};

export const CardIllustration: React.FC<CardIllustrationProps> = ({
  pillar,
  roundedClass = 'rounded-[18px]',
}) => {
  const icon = ICONS[pillar.id] ?? ICONS.oneness;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${roundedClass} select-none flex flex-col justify-between p-4 sm:p-5`}
      style={{
        background: `linear-gradient(158deg, ${pillar.accentA} 0%, ${pillar.accentB} 100%)`,
      }}
    >
      {/* Single soft highlight — one gradient, no extra layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Icon */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative grid place-items-center w-[46%] aspect-square rounded-full bg-white/15 border border-white/25">
          <svg
            className="w-1/2 h-1/2 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label={`${pillar.label} icon`}
          >
            {icon}
          </svg>
        </div>
      </div>

      {/* Label + headline */}
      <div className="relative text-left">
        <div className="inline-block px-2.5 py-0.5 mb-1.5 rounded-full bg-white/20 border border-white/30 text-[10px] uppercase font-extrabold tracking-widest text-white">
          <span className="font-artistic-display tracking-widest">{pillar.label}</span>
        </div>
        <p className="font-artistic-serif text-white font-bold text-sm sm:text-base leading-snug line-clamp-2 tracking-wide drop-shadow-sm">
          {pillar.headline}
        </p>
      </div>
    </div>
  );
};
