import React from 'react';
import { Eye } from 'lucide-react';

export type HeroView = 'hero1' | 'hero2' | 'both';

interface ViewSwitcherProps {
  activeView: HeroView;
  onSelectView: (view: HeroView) => void;
  /** Renders the section label above the buttons. */
  showLabel?: boolean;
}

const VIEWS: { id: HeroView; name: string; activeClass: string }[] = [
  { id: 'hero2', name: '★ Hero 2 (Clone)', activeClass: 'bg-amber-400 text-neutral-950 border-amber-300' },
  { id: 'hero1', name: 'Hero 1 (Original)', activeClass: 'bg-white text-neutral-950 border-white' },
  { id: 'both', name: 'Both Views', activeClass: 'bg-sky-400 text-neutral-950 border-sky-300' },
];

/**
 * Hero page selector. Previously lived in the site header; now surfaced only
 * through the discreet settings control on each hero stage.
 */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  activeView,
  onSelectView,
  showLabel = true,
}) => (
  <div className="flex flex-col gap-2">
    {showLabel && (
      <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-amber-400" /> Hero View
      </label>
    )}
    <div
      role="group"
      aria-label="Hero page selector"
      className="flex flex-wrap items-center gap-1.5"
    >
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelectView(v.id)}
          aria-pressed={activeView === v.id}
          className={`px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
            activeView === v.id
              ? `${v.activeClass} shadow-md`
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/10'
          }`}
        >
          {v.name}
        </button>
      ))}
    </div>
  </div>
);
