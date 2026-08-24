import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  onOpenDonate: () => void;
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
  onOpenDonate,
  hideLogo = false,
}) => {
  /* The search control stays a single glass orb; scrolling no longer opens it.
     It expands only when there is a query to show, which comes back from the
     search modal the orb opens — so the field appears because the visitor
     searched, never because the page moved under them. */
  const isExpanded = Boolean(searchQuery);

  /* True once the page has scrolled off the hero's top. Drives ONLY the
     header's ground — a blur-and-tint underlay so content sliding beneath the
     fixed header stops mixing with the nav. Deliberately not reused for the
     search control, which stays collapsed on scroll by explicit request. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Track line 2 out until it spans exactly the width of line 1.
     Computed rather than hand-tuned: the tracking that matches depends on the
     rendered font, and the display face loads asynchronously — a fixed value
     would be wrong until it arrives, then wrong again at the lg size step.
     letter-spacing adds a gap AFTER every character including the last, so the
     divisor is (n - 1) and the trailing gap is pulled back with a negative
     margin; otherwise the visible right edge overshoots line 1. */
  const line1Ref = useRef<HTMLSpanElement | null>(null);
  const line2Ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    if (!l1 || !l2) return;

    const fit = () => {
      l2.style.letterSpacing = 'normal';
      l2.style.marginRight = '0px';
      const target = l1.offsetWidth;
      const natural = l2.offsetWidth;
      const n = (l2.textContent ?? '').length;
      if (n < 2 || target <= natural) return;
      const spacing = (target - natural) / (n - 1);
      l2.style.letterSpacing = `${spacing}px`;
      l2.style.marginRight = `${-spacing}px`;
    };

    fit();
    // Re-fit once webfonts land, and whenever the lockup is re-laid out.
    document.fonts?.ready.then(fit).catch(() => undefined);
    const ro = new ResizeObserver(fit);
    ro.observe(l1);
    return () => ro.disconnect();
  }, []);

  /* Reveal: each line slides out from behind the logo inside its own clipping
     row. Pure transform, so it stays cheap, and it only runs once the splash
     has handed off — hideLogo is still true while the flying logo is in the
     air, so the wordmark cannot appear mid-flight. */
  const revealRow = 'block overflow-hidden';
  const revealInner = (delayMs: number): React.CSSProperties => ({
    /* inline-block, NOT block: a block child fills its parent, so both lines
       would measure as the container width and the tracking calculation would
       compare a box against itself. Shrink-wrapping makes offsetWidth the real
       text width. */
    display: 'inline-block',
    transform: hideLogo ? 'translateX(-102%)' : 'translateX(0)',
    opacity: hideLogo ? 0 : 1,
    transition: hideLogo
      ? 'none'
      : `transform 760ms cubic-bezier(0.22, 1, 0.3, 1) ${delayMs}ms, opacity 420ms ease-out ${delayMs}ms`,
  });

  return (
    <header
      id="site-header"
      className="fixed top-0 left-0 right-0 z-50 h-[72px] px-4 md:px-8 flex items-center justify-between bg-transparent pointer-events-none"
    >
      {/* Ground that appears on scroll. The blur is constant and only OPACITY
          animates: backdrop-filter itself is expensive to transition, and an
          invisible (opacity 0) layer simply skips its backdrop work. Negative
          z keeps it under every header control while the header's own
          stacking context (fixed, z-50) stops it escaping underneath. */}
      <div
        aria-hidden="true"
        className={`chrome-scrim absolute inset-0 -z-10 bg-neutral-950/40 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-opacity duration-500 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* LEFT: Logo + wordmark */}
      <div className="flex items-center gap-3 pointer-events-auto flex-none">
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

        {/* Wordmark. Hidden below md, where the nav's hamburger and the right-hand
            controls already claim the row — the logo alone carries the identity
            there. It also fades out with the logo during the splash hand-off so
            the two never separate. */}
        <button
          id="site-wordmark"
          onClick={onOpenDetails}
          title="Sant Nirankari Charitable Foundation"
          className="hidden md:block text-left leading-[1.08] cursor-pointer bg-transparent border-none p-0"
        >
          <span className={revealRow}>
            <span
              ref={line1Ref}
              style={revealInner(120)}
              className="font-artistic-display text-white text-[19px] lg:text-[22px] font-extrabold tracking-[0.13em] uppercase drop-shadow-sm whitespace-nowrap"
            >
              Sant Nirankari
            </span>
          </span>
          <span className={revealRow}>
            <span
              ref={line2Ref}
              style={revealInner(240)}
              className="font-artistic-display text-white/85 text-[11px] lg:text-[12.5px] font-semibold uppercase drop-shadow-sm whitespace-nowrap"
            >
              Charitable Foundation
            </span>
          </span>
        </button>
      </div>

      {/* CENTRE: main navigation (Gallery is the icon button on the right) */}
      <div className="flex-1 flex justify-center min-w-0 px-2">
        <MainNav />
      </div>

      {/* RIGHT: Anthem toggle + search + Gallery + Donate ribbon */}
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

        {/* Gallery — icon only. It used to own the ribbon; the ribbon is now the
            donation call to action, and the main nav deliberately has no Gallery
            entry, so without this button the gallery would have no way in. */}
        <button
          id="gallery-icon-btn"
          onClick={onOpenGallery}
          title="Open the gallery"
          aria-label="Open the gallery"
          className="grid place-items-center w-11 h-11 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl text-white/90 hover:bg-white/20 hover:text-white transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex-none"
        >
          <svg
            className="w-[18px] h-[18px]"
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
        </button>

        {/* Donation ribbon — the header's one call to action.

            The flag shape is a clip-path, but the WAVE is pure transform. An
            animated clip-path would repaint the element every frame; the same
            lesson the splash iris taught. Instead the ribbon is rotated a
            couple of degrees around its left edge, where a real flag is
            fastened, so the free end travels and the mast end stays put. */}
        <button
          id="donate-ribbon-btn"
          onClick={onOpenDonate}
          className="donate-ribbon relative h-[40px] w-[124px] flex items-center justify-start pl-2.5 pr-5 shadow-md select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
          style={{
            /* Follows the stage mood via the shared variable rather than the
               front pillar, so it stays in step on the devotional slide too. */
            backgroundColor: 'var(--accent-a)',
            clipPath: 'polygon(0 0, 100% 0, 84% 50%, 100% 100%, 0 100%)',
          }}
          title="Support the foundation"
          aria-label="Support the foundation — ways to contribute"
        >
          <span className="donate-ribbon-sheen" aria-hidden="true" />

          {/* Heart glyph */}
          <span className="mr-1.5 text-white flex-shrink-0 donate-ribbon-heart">
            <svg
              className="w-[16px] h-[16px]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 20.7l-1.4-1.3C5.4 14.8 2 11.7 2 8.1 2 5.4 4.1 3.3 6.8 3.3c1.5 0 3 .7 3.9 1.9l1.3 1.6 1.3-1.6c.9-1.2 2.4-1.9 3.9-1.9 2.7 0 4.8 2.1 4.8 4.8 0 3.6-3.4 6.7-8.6 11.3L12 20.7z" />
            </svg>
          </span>

          <span className="text-[11px] uppercase font-bold text-white tracking-wider">
            Donate
          </span>
        </button>
      </div>
    </header>
  );
};
