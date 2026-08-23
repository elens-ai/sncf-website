import React, { useState, useEffect } from 'react';
import { AnthemPlayer } from './AnthemPlayer';
import { MainNav } from './MainNav';
import { PillarState } from '../types';

interface HeaderProps {
  currentPillar: PillarState;
  onSearchClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenDetails: () => void;
  onOpenGallery: () => void;
  /** Held invisible (but laid out) while the splash logo flies onto it. */
  hideLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPillar,
  onSearchClick,
  searchQuery,
  onSearchChange,
  onOpenDetails,
  onOpenGallery,
  hideLogo = false,
}) => {
  // The full search field is revealed only once the user scrolls past the hero;
  // on the hero itself the control stays collapsed to a single glass orb.
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isExpanded = isScrolled || Boolean(searchQuery);

  return (
    <header
      id="site-header"
      className="fixed top-0 left-0 right-0 z-50 h-[72px] px-4 md:px-8 flex items-center justify-between bg-transparent pointer-events-none"
    >
      {/* LEFT: Circular White Background Logo (No border/edge) */}
      <div className="flex items-center pointer-events-auto">
        <button
          id="logo-badge-btn"
          onClick={onOpenDetails}
          className="group relative w-[52px] h-[52px] rounded-full bg-white overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer p-0 border-none"
          title="Sant Nirankari Charitable Foundation"
          aria-label="Sant Nirankari Charitable Foundation logo"
        >
          <img
            id="header-sncf-logo"
            src="https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp"
            alt="Sant Nirankari Charitable Foundation Logo"
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
              hideLogo ? 'opacity-0' : 'opacity-100'
            }`}
            referrerPolicy="no-referrer"
          />
        </button>
      </div>

      {/* CENTRE: main navigation (Gallery lives in the ribbon on the right) */}
      <div className="flex-1 flex justify-center min-w-0 px-2">
        <MainNav />
      </div>

      {/* RIGHT: Anthem toggle + search + Gallery ribbon */}
      <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
        <AnthemPlayer />
        {/* Futuristic morphing search — glass orb on the hero, full field on scroll */}
          <div
            id="hero-search-morph"
            className={`search-morph ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
          >
            {/* Animated light sweep (expanded state only) */}
            <span className="search-sheen" aria-hidden="true" />

            {/* Magnifying glass — stays put as the field grows around it */}
            <div className="absolute left-0 top-0 h-full w-[44px] grid place-items-center pointer-events-none text-white/90 z-10">
              <svg
                className="w-[18px] h-[18px] drop-shadow"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <input
              id="hero-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={onSearchClick}
              placeholder="Search pillars, camps, initiatives..."
              tabIndex={isExpanded ? 0 : -1}
              aria-hidden={!isExpanded}
              className={`absolute inset-0 w-full h-full bg-transparent border-none outline-none pl-[44px] pr-[76px] text-sm font-medium text-white placeholder:text-white/55 transition-opacity duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Trailing affordance: clear button when typing, else the ⌘K hint */}
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center transition-opacity duration-300 ${
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-white/60 hover:text-white p-1 text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              ) : (
                <kbd className="search-kbd hidden sm:block" aria-hidden="true">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Collapsed state: the whole orb is one big search button */}
            {!isExpanded && (
              <button
                id="hero-search-orb-btn"
                onClick={onSearchClick}
                aria-label="Open search"
                title="Search (⌘K)"
                className="absolute inset-0 w-full h-full cursor-pointer bg-transparent border-none z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
              />
            )}
          </div>

        {/* Gallery Ribbon — jumps to the photo gallery. Keeps the accent-tinted
            flag shape, but the label is now a fixed destination, not the pillar. */}
        <button
          id="gallery-ribbon-btn"
          onClick={onOpenGallery}
          className="relative h-[40px] w-[112px] flex items-center justify-start pl-2.5 pr-5 shadow-md select-none cursor-pointer transition-transform duration-200 hover:scale-[1.04] active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{
            backgroundColor: currentPillar.accentA,
            clipPath: 'polygon(0 0, 100% 0, 84% 50%, 100% 100%, 0 100%)',
            transition: 'background-color 1000ms cubic-bezier(0.45, 0.05, 0.25, 1)',
          }}
          title="Open the gallery"
          aria-label="Open the gallery"
        >
          {/* Gallery glyph */}
          <div className="mr-1.5 text-white flex-shrink-0">
            <svg
              className="w-[16px] h-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>

          <span className="text-[11px] uppercase font-bold text-white tracking-wider">
            Gallery
          </span>
        </button>
      </div>
    </header>
  );
};
