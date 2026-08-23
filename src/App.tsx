import React, { useState, useEffect, useCallback } from 'react';
import { PILLARS } from './data/pillars';
import { PillarState } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PillarsSection } from './components/PillarsSection';
import { PillarModal } from './components/PillarModal';
import { SearchModal } from './components/SearchModal';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { GalleryModal } from './components/GalleryModal';
import { DonateModal } from './components/DonateModal';
import { DevotionalLightboxModal } from './components/DevotionalLightboxModal';
import { DevotionalLeader } from './components/DevotionalPhotoCard';

export default function App() {
  /* 'showing' -> 'exiting' (logo flies to the header) -> 'done'.
     The hero is mounted underneath the whole time so the handoff is seamless. */
  const [splashPhase, setSplashPhase] = useState<'showing' | 'exiting' | 'done'>('showing');
  const isSplashUp = splashPhase !== 'done';
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

  /* --accent-a/--accent-b are written in exactly one place: the hero section,
     which is the only thing that knows whether a pillar or the devotional
     portrait is fronting. App used to write them too and, because child
     effects run before parent effects, always won — painting the header chrome
     in the pillar's colour while the stage was devotional rose. */

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
    <div className="relative min-h-screen w-full flex flex-col bg-neutral-950 font-sans select-none">
      {/* ONE gradient for the whole page. Absolute, not fixed, so it spans the
          full document height and the ramp runs continuously from the top of
          the hero to the bottom of the last screen — the sections themselves
          paint nothing, so there is no boundary for a seam to appear at. */}
      <div className="accent-canvas absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      {/* 0. WELCOME SPLASH SCREEN — hands off to the hero via a shared-element
             logo flight into the header. */}
      {isSplashUp && (
        <WelcomeSplashScreen
          onExitStart={() => setSplashPhase('exiting')}
          onComplete={() => setSplashPhase('done')}
        />
      )}

      {/* 1. TOP HEADER NAVIGATION */}
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

      {/* 2. HERO — the site's single hero. */}
      <HeroSection
        activeIndex={activeIndex}
        onActiveIndexChange={handleActiveIndexChange}
        isPaused={isPaused || isSplashUp}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onOpenDetails={handleOpenDetails}
        introActive={!isSplashUp}
      />

      {/* 3. THE SCREEN BELOW THE HERO. It carries no colour of its own — it
             reads the same --accent-a/--accent-b the hero publishes, so the
             gradient continues across the scroll boundary and keeps changing
             with the wheel. */}
      <PillarsSection
        pillars={activePillarsList}
        activeIndex={activeIndex}
        onOpenDetails={handleOpenDetails}
      />

      {/* Detail Modal for in-depth pillar exploration */}
      <PillarModal
        pillar={selectedPillarForModal || currentPillar}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPillar={handleSelectPillarById}
        allPillars={activePillarsList}
      />

      {/* Donate + Gallery */}
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

