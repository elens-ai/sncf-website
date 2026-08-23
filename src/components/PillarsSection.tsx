import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PillarState } from '../types';

/**
 * The screen below the hero.
 *
 * Its background is the SAME gradient the hero is showing, because both read
 * --accent-a / --accent-b from :root, which the hero rewrites as the wheel
 * turns. Nothing here holds a colour of its own, so the two screens cannot
 * drift apart — scroll down mid-rotation and the colour continues across the
 * boundary rather than cutting to a different palette.
 *
 * The 880ms transition matches the hero stage exactly. The hero animates its
 * own inline copy of the variables over 880ms while :root changes instantly;
 * without an equal transition here, this screen would snap to the new colour
 * while the hero was still easing into it.
 *
 * Content is the four pillars as they already exist in the data — label,
 * headline and the two headline stats — and each panel opens the same detail
 * modal the hero's button opens.
 */

interface PillarsSectionProps {
  pillars: PillarState[];
  /** The pillar the hero is currently on, highlighted to tie the screens together. */
  activeIndex: number;
  onOpenDetails: (pillar: PillarState) => void;
}

const SCRIPT_TITLES: Record<string, string> = {
  heal: 'Heal',
  enrich: 'Enrich',
  empower: 'Empower',
  projects: 'Projects',
};

export const PillarsSection: React.FC<PillarsSectionProps> = ({
  pillars,
  activeIndex,
  onOpenDetails,
}) => (
  <section
    id="pillars-section"
    aria-label="Our work"
    className="accent-canvas snap-screen relative w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-16 overflow-hidden"
  >
    {/* Same soft darkening the hero uses, so text contrast survives the lighter
        end of every pillar gradient. */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/45 pointer-events-none" />

    <div className="relative z-10 w-full max-w-7xl mx-auto">
      <header className="mb-8 sm:mb-12">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
          Our work
        </p>
        <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow">
          Four pillars, one intention — service offered without condition.
        </h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={pillar.id}
              onClick={() => onOpenDetails(pillar)}
              aria-current={isActive ? 'true' : 'false'}
              className={`group text-left rounded-3xl border p-5 backdrop-blur-md transition-all duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:-translate-y-1 ${
                isActive
                  ? 'bg-black/35 border-white/45 shadow-xl'
                  : 'bg-black/20 border-white/15 hover:bg-black/30 hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-dancing-script font-bold text-white text-[34px] leading-none drop-shadow">
                  {SCRIPT_TITLES[pillar.id] ?? pillar.label}
                </span>
                <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors mt-1.5 flex-none" />
              </div>

              <p className="font-artistic-serif text-white/95 text-[15px] leading-snug mb-4 min-h-[2.6em]">
                {pillar.headline}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/15">
                {pillar.stats.slice(0, 2).map((stat) => (
                  <div key={stat.label}>
                    <p className="font-artistic-heading text-white font-bold text-[19px] tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-white/70 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </section>
);
