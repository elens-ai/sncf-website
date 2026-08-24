import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PILLARS } from './data/pillars';
import { PillarState } from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PillarsSection } from './components/PillarsSection';
import { EventsSection } from './components/EventsSection';
import { AwardsSection } from './components/AwardsSection';
import { PartnersSection } from './components/PartnersSection';
import { SiteFooter } from './components/SiteFooter';
import { SocialSidebar } from './components/SocialSidebar';
import { InvitationCard } from './components/InvitationCard';
import { EVENTS } from './data/events';
import { resolveEvents } from './utils/events';
import { PillarModal } from './components/PillarModal';
import { SearchModal } from './components/SearchModal';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { GalleryModal } from './components/GalleryModal';
import { DonateModal } from './components/DonateModal';
import { DevotionalLightboxModal } from './components/DevotionalLightboxModal';
import { DevotionalLeader } from './components/DevotionalPhotoCard';

/** The invite id from the URL. Tolerates the mangled ?invite-<id> form some
    scanner apps and hand-typed addresses produce alongside the canonical
    ?invite=<id>. */
const parseInviteParam = (): string | null => {
  const clean = new URLSearchParams(window.location.search).get('invite');
  if (clean) return clean;
  const m = window.location.search.match(/[?&]invite[-=]([a-z0-9-]+)/i);
  return m ? m[1] : null;
};

export default function App() {
  /* 'showing' -> 'exiting' (logo flies to the header) -> 'done'.
     The hero is mounted underneath the whole time so the handoff is seamless.
     A visitor arriving from a scanned pass (?invite=...) skips the splash
     entirely — they came for an invitation, and 5.7s of signature animation
     between scan and invitation reads as the page not opening at all. */
  const [splashPhase, setSplashPhase] = useState<'showing' | 'exiting' | 'done'>(() =>
    parseInviteParam() ? 'done' : 'showing',
  );
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

  /* ?invite=<event-id> — the landing for a scanned event-pass QR. The param
     is read once on load and cleared on dismiss, so reloading or sharing the
     address afterwards gives the plain site, not a stuck invitation. */
  const [inviteId, setInviteId] = useState<string | null>(parseInviteParam);
  const inviteItem = useMemo(
    () => (inviteId ? resolveEvents(EVENTS).find((i) => i.event.id === inviteId) ?? null : null),
    [inviteId],
  );
  const closeInvite = useCallback(() => {
    setInviteId(null);
    const u = new URL(window.location.href);
    /* Strip the mangled ?invite-<id> key too, not just the canonical one —
       otherwise dismissing a tolerated URL leaves it behind and a reload
       reopens the invitation. */
    [...u.searchParams.keys()]
      .filter((k) => /^invite/i.test(k))
      .forEach((k) => u.searchParams.delete(k));
    window.history.replaceState({}, '', u.pathname + u.search + u.hash);
  }, []);

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

      {/* Social sidebar — a viewport fixture, so it lives at ROOT level, not
          inside the hero. Inside it sat in the hero's stacking context
          (relative z-10), where its own z-40 counted for nothing against the
          footer: a later sibling at the same z-10 paints over the entire hero
          context, fixed children included, which is exactly how the icons
          ended up sliced off behind the footer. Out here its z-40 is real —
          above the sections and footer (z-10), below the header and modals
          (z-50). */}
      <SocialSidebar />

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

      {/* 4. UPCOMING EVENTS */}
      <EventsSection />

      {/* 5. AWARDS & RECOGNITIONS */}
      <AwardsSection />

      {/* 6. PARTNERS */}
      <PartnersSection />

      {/* 7. FOOTER — closes the page. Not a snap target: it is a band, not a
             screen, and snapping to it would strand the reader on links. */}
      <SiteFooter onOpenDonate={() => setIsDonateOpen(true)} />

      {/* Detail Modal for in-depth pillar exploration */}
      <PillarModal
        pillar={selectedPillarForModal || currentPillar}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPillar={handleSelectPillarById}
        allPillars={activePillarsList}
      />

      {/* Donate + Gallery */}
      {inviteItem && <InvitationCard item={inviteItem} onClose={closeInvite} />}

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

