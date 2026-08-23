import React, { useState, useEffect, useCallback } from 'react';
import { PILLARS } from './data/pillars';
import { PillarState } from './types';
import { Header } from './components/Header';
import { HeroContent } from './components/HeroContent';
import { HeroWheel } from './components/HeroWheel';
import { Hero2ClonePage } from './components/Hero2ClonePage';
import { PillarModal } from './components/PillarModal';
import { SearchModal } from './components/SearchModal';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { ViewSwitcher, HeroView } from './components/ViewSwitcher';
import { GalleryModal } from './components/GalleryModal';
import { DonateModal } from './components/DonateModal';
import { DevotionalLightboxModal } from './components/DevotionalLightboxModal';
import { DevotionalLeader } from './components/DevotionalPhotoCard';
import { Settings } from 'lucide-react';

export default function App() {
  /* 'showing' -> 'exiting' (logo flies to the header) -> 'done'.
     The hero is mounted underneath the whole time so the handoff is seamless. */
  const [splashPhase, setSplashPhase] = useState<'showing' | 'exiting' | 'done'>('showing');
  const isSplashUp = splashPhase !== 'done';
  const [activeView, setActiveView] = useState<HeroView>('hero2');
  const [isHero1SettingsOpen, setIsHero1SettingsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPillarForModal, setSelectedPillarForModal] = useState<PillarState | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isDonateOpen, setIsDonateOpen] = useState<boolean>(false);
  const [galleryLeader, setGalleryLeader] = useState<DevotionalLeader | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activePillarsList = PILLARS;
  const currentPillar = activePillarsList[activeIndex] || activePillarsList[0];

  /* --accent-a/--accent-b must have exactly ONE writer at a time.

     Hero 2 owns them whenever it is mounted, because only it knows whether a
     devotional portrait or a pillar is currently fronting. This effect is the
     fallback for the Hero 1 only view, where Hero 2 is unmounted and nothing
     else would set them.

     Both used to write unconditionally. Child effects run before parent
     effects, so this one always landed last and won — and the header chrome
     was painted in the front PILLAR's colour even while Hero 2's stage was the
     devotional rose. That is the colour mismatch on the intro slide. */
  useEffect(() => {
    if (activeView !== 'hero1') return;
    document.documentElement.style.setProperty('--accent-a', currentPillar.accentA);
    document.documentElement.style.setProperty('--accent-b', currentPillar.accentB);
  }, [currentPillar, activeView]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen || isSearchOpen || isGalleryOpen || isDonateOpen || isSplashUp) return;

      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % activePillarsList.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + activePillarsList.length) % activePillarsList.length);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSearchOpen, isGalleryOpen, isDonateOpen, isSplashUp, activePillarsList.length]);

  const handleActiveIndexChange = useCallback((newIndex: number) => {
    setActiveIndex(newIndex);
  }, []);

  const handleOpenDetails = (pillar: PillarState) => {
    setSelectedPillarForModal(pillar);
    setIsModalOpen(true);
  };

  const handleSelectPillarById = (pillarId: string) => {
    const idx = activePillarsList.findIndex((p) => p.id === pillarId);
    if (idx !== -1) {
      setActiveIndex(idx);
      setSelectedPillarForModal(activePillarsList[idx]);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 0. WELCOME SPLASH SCREEN — hands off to the hero via a shared-element
             logo flight into the header. */}
      {isSplashUp && (
        <WelcomeSplashScreen
          onExitStart={() => setSplashPhase('exiting')}
          onComplete={() => setSplashPhase('done')}
        />
      )}

      {/* 1. TOP HEADER NAVIGATION WITH DIRECT CLONE / ORIGINAL SWITCHER */}
      <Header
        currentPillar={currentPillar}
        onSearchClick={() => setIsSearchOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) setIsSearchOpen(true);
        }}
        onOpenDetails={() => handleOpenDetails(currentPillar)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
        hideLogo={isSplashUp}
      />

      {/* 2. HERO 2 (CLONED PAGE - DEDICATED WORKSPACE) */}
      {(activeView === 'hero2' || activeView === 'both') && (
        <Hero2ClonePage
          activeIndex={activeIndex}
          onActiveIndexChange={handleActiveIndexChange}
          isPaused={isPaused || isSplashUp}
          onTogglePause={() => setIsPaused((prev) => !prev)}
          onOpenDetails={handleOpenDetails}
          activeView={activeView}
          onSelectView={setActiveView}
          introActive={!isSplashUp}
        />
      )}

      {/* COMPARE DIVIDER (When both views are selected) */}
      {activeView === 'both' && (
        <div className="relative z-30 w-full py-4 bg-black/95 flex items-center justify-center gap-4 border-y border-white/20">
          <div className="h-px bg-white/30 flex-1 max-w-xs" />
          <span className="font-artistic-modern text-amber-300 text-xs font-black uppercase tracking-widest px-5 py-1.5 rounded-full bg-neutral-900 border border-amber-400/40 shadow-lg">
            Original Hero 1 Below
          </span>
          <div className="h-px bg-white/30 flex-1 max-w-xs" />
        </div>
      )}

      {/* 3. HERO 1 (ORIGINAL REFERENCE PAGE) */}
      {(activeView === 'hero1' || activeView === 'both') && (
        <main
          id="hero-canvas-stage"
          className="hero-canvas-bg relative w-full min-h-[100vh] flex items-center justify-center pt-[72px] px-4 sm:px-8 md:px-12 lg:px-16 overflow-hidden"
        >
          {/* Soft radial overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/35 pointer-events-none" />

          {/* DISCREET SETTINGS TRIGGER — keeps the hero view selector reachable
              from Hero 1, which has no design studio drawer of its own. */}
          <button
            id="hero1-settings-trigger"
            onClick={() => setIsHero1SettingsOpen(!isHero1SettingsOpen)}
            aria-label={isHero1SettingsOpen ? 'Close hero settings' : 'Open hero settings'}
            aria-expanded={isHero1SettingsOpen}
            title="Hero settings"
            className={`group absolute top-[88px] right-4 sm:right-6 md:right-8 lg:right-10 z-40 grid place-items-center w-9 h-9 rounded-full border cursor-pointer transition-all duration-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
              isHero1SettingsOpen
                ? 'opacity-100 rotate-90 bg-amber-400 text-neutral-950 border-amber-300 shadow-lg'
                : 'opacity-[0.18] hover:opacity-100 hover:rotate-45 bg-black/30 hover:bg-black/60 text-white/90 border-white/15 hover:border-white/40 backdrop-blur-md'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Compact settings popover for Hero 1 */}
          {isHero1SettingsOpen && (
            <div
              id="hero1-settings-panel"
              className="absolute top-[136px] right-4 sm:right-6 md:right-8 lg:right-10 z-40 p-4 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-white/20 shadow-2xl text-white animate-fadeIn"
            >
              <ViewSwitcher activeView={activeView} onSelectView={setActiveView} />

              {/* Auto-rotation control (moved out of the site header) */}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                <label className="text-xs uppercase font-bold text-neutral-300 tracking-wider">
                  Motion
                </label>
                <button
                  id="hero1-rotation-toggle"
                  onClick={() => setIsPaused((prev) => !prev)}
                  aria-pressed={isPaused}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isPaused
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>Auto Rotation</span>
                  <span>{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Large decorative circle */}
          <div
            id="decorative-celestial-circle"
            className="celestial-ring absolute -right-[20%] top-1/2 -translate-y-1/2 w-[70vh] h-[70vh] max-w-[700px] max-h-[700px] rounded-full border border-white/20 pointer-events-none"
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

          {/* Faded White Lotus Hero Background Graphics */}
          <div
            id="hero1-lotus-watermark"
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

          {/* Main Stage Grid Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 py-6 md:py-10">
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
              <HeroContent
                pillar={currentPillar}
                onLearnMoreClick={() => handleOpenDetails(currentPillar)}
              />
            </div>

            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <HeroWheel
                pillars={PILLARS}
                activeIndex={activeIndex}
                onActiveIndexChange={handleActiveIndexChange}
                isPaused={isPaused || isSplashUp}
                onCardClick={(clickedIndex) => {
                  setActiveIndex(clickedIndex);
                  handleOpenDetails(PILLARS[clickedIndex]);
                }}
              />
            </div>
          </div>
        </main>
      )}

      {/* Detail Modal for in-depth pillar exploration */}
      <PillarModal
        pillar={selectedPillarForModal || currentPillar}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPillar={handleSelectPillarById}
        allPillars={activePillarsList}
      />

      {/* Gallery Modal */}
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        pillars={activePillarsList}
        onSelectPillar={(pillar) => {
          setIsGalleryOpen(false);
          handleSelectPillarById(pillar.id);
          handleOpenDetails(pillar);
        }}
        onSelectLeader={(leader) => setGalleryLeader(leader)}
      />

      {/* Portrait lightbox opened from the gallery */}
      <DevotionalLightboxModal
        leader={galleryLeader}
        onClose={() => setGalleryLeader(null)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        pillars={activePillarsList}
        onSelectPillar={(idx) => {
          setActiveIndex(idx);
          handleOpenDetails(activePillarsList[idx]);
          setIsSearchOpen(false);
          setSearchQuery('');
        }}
      />
    </div>
  );
}

