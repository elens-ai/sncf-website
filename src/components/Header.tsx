import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { siteOverride } from '../cms/siteSettings';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import React, { useEffect, useState } from 'react';
import { AnimatedBrandWordmark } from './AnimatedBrandWordmark';
import { Link } from 'react-router-dom';
import { AnthemPlayer } from './AnthemPlayer';
import { MainNav } from './MainNav';
import { PillarState } from '../types';
import './header-navigation.css';

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
  onOpenDonate,
  hideLogo = false,
}) => {
  useCMSRevision();
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

  return (
    <header
      id="site-header"
      data-compact={scrolled}
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
      <div className="site-brand flex items-center gap-3 pointer-events-auto flex-none">
        <Link
          id="logo-badge-btn"
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
          className="group relative w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer p-0 border-none"
          /* White disc sized to the emblem's outer ring rather than the whole
             badge: the logo image has transparent padding, so a full-size disc
             left a white rim around the ring. The ring spans ~93.4% of the box,
             slightly above and left of centre; the disc sits just inside it. */
          style={{ background: 'radial-gradient(circle closest-side, #fff 99%, transparent 100%) 37.2% 38.6% / 92.8% 92.8% no-repeat' }}
          title={getCMSCopy("copy.Header.a01941bf3134", "Sant Nirankari Charitable Foundation")}
          aria-label={getCMSCopy("copy.Header.b79520f8055a", "Sant Nirankari Charitable Foundation logo")}
        >
          <img
            id="header-sncf-logo"
            src={resolveCMSMedia(siteOverride("branding", "logo", resolveCMSAsset("asset.Header.25aa35189463", "https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp")))}
            alt={getCMSCopy("copy.Header.44e3df1518ac", "Sant Nirankari Charitable Foundation Logo")}
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
              hideLogo ? 'opacity-0' : 'opacity-100'
            }`}
            referrerPolicy="no-referrer"
          />
        </Link>

        <AnimatedBrandWordmark
          name={siteOverride("branding", "name", getCMSCopy("copy.Header.3eeeb717e545", "Sant Nirankari"))}
          descriptor={getCMSCopy("copy.Header.4b0937769465", "Charitable Foundation")}
          hidden={hideLogo}
        />
      </div>

      {/* CENTRE: main navigation */}
      <div className="site-navigation flex-1 flex justify-center min-w-0 px-2">
        <MainNav onOpenDonate={onOpenDonate} onSearchClick={onSearchClick} />
      </div>

      {/* RIGHT: Anthem toggle + search + Donate ribbon */}
      <div className="site-actions flex items-center gap-2 md:gap-3 pointer-events-auto">
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
              aria-label="Search the foundation"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onClick={onSearchClick}
              placeholder={getCMSCopy("copy.Header.4c1e7031859e", "Search pillars, camps, initiatives...")}
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
                  aria-label={getCMSCopy("copy.Header.3b7ea51793e9", "Clear search")}
                >
                  ✕
                </button>
              ) : (
                <kbd className="search-kbd hidden sm:block" aria-hidden="true">{getCMSCopy("copy.Header.dfe870d90b82", "⌘K")}</kbd>
              )}
            </div>

            {isExpanded && <button type="button" onClick={onSearchClick} aria-label={getCMSCopy("copy.Header.50ce48b9c623", "Open search")} className="xl:hidden absolute inset-0 w-full h-full rounded-full z-20 cursor-pointer" />}

            {/* Collapsed state: the whole orb is one big search button */}
            {!isExpanded && (
              <button
                id="hero-search-orb-btn"
                onClick={onSearchClick}
                aria-label={getCMSCopy("copy.Header.50ce48b9c623", "Open search")}
                title={getCMSCopy("copy.Header.adc4c5775cdb", "Search (⌘K)")}
                className="absolute inset-0 w-full h-full cursor-pointer bg-transparent border-none z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
              />
            )}
          </div>

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
          title={getCMSCopy("copy.Header.e26586bdf140", "Support the foundation")}
          aria-label={getCMSCopy("copy.Header.3f598427e78e", "Support the foundation — ways to contribute")}
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

          <span className="text-[11px] uppercase font-bold text-white tracking-wider">{getCMSCopy("copy.Header.c91ee0f2799d", "Donate")}</span>
        </button>
      </div>
    </header>
  );
};
