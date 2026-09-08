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
  /** Rendered under the cover, pinned — the page's own table of contents. */
  rail?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * THE READING ROOMS' CHROME.
 *
 * The hall on "/" is a dark room you walk through. These four pages are the
 * desk you sit at afterwards, and they are lit differently on purpose: the
 * colour-shifting accent canvas belongs to the home page alone, and this
 * shell paints a warm paper ground instead.
 *
 * `data-surface="light"` on the root is the switch. Everything downstream —
 * the ground, the reading-room CSS, and the header — keys off it, so the two
 * lighting states are one attribute apart and the hall is never touched.
 *
 * THE HEADER stays exactly as written: it is white type on transparency,
 * built to float over the dark hall. Rather than fork it into a light
 * variant, the light surface paints a deep brand bar UNDERNEATH it. The
 * white type then has the dark ground it was designed for, on a page that is
 * otherwise paper. `#site-header` is an id (1-0-0) and the component's own
 * `bg-transparent` is a class (0-1-0), so the bar wins without one edit to
 * Header.tsx.
 *
 * The paper is #fbfaf8, not #ffffff: pure white glares under the dark bar,
 * and it leaves cards nowhere to go. Cards sit at true white ABOVE it, which
 * is what reads as elevation.
 */
export const PageShell: React.FC<PageShellProps> = ({
  accentPillarId = 'projects',
  eyebrow,
  title,
  standfirst,
  rail,
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

  /* The page's ink. The hero publishes these on the home page; here the page
     publishes its own, once. They tint the rail, the rules and the active
     states — never the ground, which stays paper. */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-a', pillar.accentA);
    root.style.setProperty('--accent-b', pillar.accentB);
  }, [pillar.accentA, pillar.accentB]);

  return (
    <div
      className="reading-room relative min-h-screen w-full flex flex-col font-sans"
      data-surface="light"
    >
      {/* the paper, and the petal light laid on it */}
      <div className="paper-canvas absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

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

      {/* THE COVER. A band of the hall's own dark stone across the top of
          every reading room. It is what the white header was built to float
          over, it gives the masthead a ground to be set on, and it is the
          visual seam that says the daylit pages and the dark hall are one
          building. The paper starts underneath it. */}
      <div className="page-cover">
        <div className="page-cover-inks" aria-hidden="true">
          {['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'].map((ink) => (
            <span key={ink} style={{ background: ink }} />
          ))}
        </div>
        <header className="page-masthead">
          <p className="page-eyebrow">{eyebrow}</p>
          <h1 className="page-title font-dancing-script">{title}</h1>
          <div className="page-rule" aria-hidden="true" />
          <p className="page-standfirst font-artistic-serif">{standfirst}</p>
        </header>
      </div>

      {/* THE RAIL — parks under the header once the cover scrolls away */}
      {rail}

      <main className="relative z-10 flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 pb-16">
        <div className="max-w-6xl mx-auto">{children}</div>
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
