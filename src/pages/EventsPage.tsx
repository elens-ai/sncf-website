import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { usePageMotion } from '../hooks/useSectionActivity';
import { PILLARS } from '../data/pillars';
import { Header } from '../components/Header';
import { SocialSidebar } from '../components/SocialSidebar';
import { EventsSection } from '../components/EventsSection';
import { SiteFooter } from '../components/SiteFooter';
import { SearchModal } from '../components/SearchModal';
import { GalleryModal } from '../components/GalleryModal';
import { DonateModal } from '../components/DonateModal';

/** The standalone Service Journal shares its event data and controls with the site,
 * on a light editorial ground with cornerstone colours and a navy masthead. */
export function EventsPage() {
  useCMSRevision();
  const navigate = useNavigate();
  const heal = PILLARS.find(pillar => pillar.id === 'heal') ?? PILLARS[0];
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  usePageMotion(isSearchOpen || isGalleryOpen || isDonateOpen);

  /* the page's colour, as the hall's first path has it (the header's ink is mixed from it) */
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent-a', heal.accentA);
    root.setProperty('--accent-b', heal.accentB);
  }, [heal.accentA, heal.accentB]);

  /* a path chosen from the search or the gallery is read on Core Values */
  const goToPillar = (id: string) => {
    setIsSearchOpen(false);
    setIsGalleryOpen(false);
    navigate(`/core-values#${id}`);
  };

  return (
    <div className="home-page events-page relative min-h-screen w-full flex flex-col bg-deep-blue font-sans">
      <div className="accent-canvas absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />
      <CMSSection id="shared.Header"><Header
        currentPillar={heal}
        onSearchClick={() => setIsSearchOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) setIsSearchOpen(true);
        }}
        onOpenDetails={() => setIsGalleryOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
      /></CMSSection>
      <CMSSection id="shared.SocialSidebar"><SocialSidebar /></CMSSection>
      <main className="relative z-10 flex-1 w-full">
        <CMSSection id="home.events"><EventsSection /></CMSSection>
      </main>
      <CMSSection id="shared.SiteFooter"><SiteFooter onOpenDonate={() => setIsDonateOpen(true)} /></CMSSection>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        pillars={PILLARS}
        onSelectPillar={(i) => goToPillar(PILLARS[i]?.id ?? 'heal')}
      />
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        pillars={PILLARS}
        onSelectPillar={(p) => goToPillar(p.id)}
        onSelectLeader={() => {
          setIsGalleryOpen(false);
          navigate('/our-guiding-force');
        }}
      />
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </div>
  );
}
