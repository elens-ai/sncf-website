import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PillarState } from '../types';
import { SncfLotus3D } from './SncfLotus3D';

/**
 * The screen below the hero.
 *
 * It paints no background at all. A single .accent-canvas layer behind the
 * whole document carries the gradient for every screen, so the colour runs
 * unbroken past the fold and keeps changing with the wheel.
 *
 * It also carried its own dark overlay for a while, which the hero does not
 * have — that alone put a visible step at the boundary even before the two
 * gradients were merged. The pillar panels supply their own contrast instead.
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
    className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[84px] pb-10 overflow-hidden"
  >
    <div className="relative z-10 w-full max-w-7xl mx-auto">
      <header className="mb-3 sm:mb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
          Our work
        </p>
        <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow">
          Four pillars, one intention — service offered without condition.
        </h2>
      </header>

      {/* The lotus unfolds as this screen scrolls in — the site's own moods
          fanning open from the Enrich centre — and floats once it has. */}
      <SncfLotus3D className="mx-auto w-[min(56vw,300px)] -my-2" />

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
