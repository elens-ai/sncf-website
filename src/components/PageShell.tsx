import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { SocialSidebar } from './SocialSidebar';
import { SearchModal } from './SearchModal';
import { GalleryModal } from './GalleryModal';
import { DonateModal } from './DonateModal';

interface PageShellProps {
  /** Which pillar's inks paint the page ground and the header chrome. */
  accentPillarId?: string;
  /** Small caps line above the title. */
  eyebrow: string;
  /** The page's name, set in the script face. */
  title: string;
  /** One paragraph under the title — what this page is for. */
  standfirst: string;
  children: React.ReactNode;
}

/**
 * THE READING ROOMS' CHROME.
 *
 * The exhibition's own furniture, reused: the page-wide accent canvas, the
 * header with its search / gallery / donate ribbons, the social rail and the
 * footer. A page passes the pillar whose inks it should wear, and the ground
 * ramps to those two colours the same way the hero's does between rooms.
 *
 * The masthead below the header is deliberately quiet — an eyebrow, the name
 * in Dancing Script, a rule that draws itself, and one paragraph. The hall
 * is where the site performs; these pages are where it answers questions.
 */
export const PageShell: React.FC<PageShellProps> = ({
  accentPillarId = 'projects',
  eyebrow,
  title,
  standfirst,
  children,
}) => {
  const pillar: PillarState =
    PILLARS.find((p) => p.id === accentPillarId) ?? PILLARS[0];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  /* Picking a pillar from the search or gallery overlay is a request to read
     that vertical — which is this site's Core Values page, anchored. */
  const goToPillar = (id: string) => {
    setIsSearchOpen(false);
    setIsGalleryOpen(false);
    navigate(`/core-values#${id}`);
  };

  /* The accent canvas reads these two variables. The hero publishes them on
     the home page; here the page itself does, once, from its own pillar. */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-a', pillar.accentA);
    root.style.setProperty('--accent-b', pillar.accentB);
  }, [pillar.accentA, pillar.accentB]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-neutral-950 font-sans">
      <div className="accent-canvas absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      <Header
        currentPillar={pillar}
        onSearchClick={() => setIsSearchOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) setIsSearchOpen(true);
        }}
        onOpenDetails={() => setIsGalleryOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
      />

      <SocialSidebar />

      <main className="relative z-10 flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 pt-[112px] pb-16">
        <div className="max-w-6xl mx-auto">
          {/* THE MASTHEAD */}
          <header className="page-masthead">
            <p className="page-eyebrow">{eyebrow}</p>
            <h1 className="page-title font-dancing-script">{title}</h1>
            <div className="page-rule" aria-hidden="true" />
            <p className="page-standfirst font-artistic-serif">{standfirst}</p>
          </header>

          {children}
        </div>
      </main>

      <SiteFooter onOpenDonate={() => setIsDonateOpen(true)} />

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
          /* the portraits belong to Our Guiding Force, which is a page here
             rather than a lightbox */
          setIsGalleryOpen(false);
          navigate('/our-guiding-force');
        }}
      />
      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
    </div>
  );
};
