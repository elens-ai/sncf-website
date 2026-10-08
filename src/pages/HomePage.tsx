import { useNavigate } from 'react-router-dom';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSSnapshot } from '../cms/runtime';
import { CMSLayout } from '../components/CMSLayout';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePageMotion } from '../hooks/useSectionActivity';
import { PILLARS } from '../data/pillars';
import { PillarState } from '../types';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { HomeLanding } from '../components/HomeLanding';
import { AwardsSection } from '../components/AwardsSection';
import { PartnersSection } from '../components/PartnersSection';
import { SiteFooter } from '../components/SiteFooter';
import { SocialSidebar } from '../components/SocialSidebar';
import { InvitationCard } from '../components/InvitationCard';
import { EVENTS } from '../data/events';
import { resolveEvents } from '../utils/events';
import { PillarModal } from '../components/PillarModal';
import { SearchModal } from '../components/SearchModal';
import { WelcomeSplashScreen } from '../components/WelcomeSplashScreen';
import { GalleryModal } from '../components/GalleryModal';
import { DonateModal } from '../components/DonateModal';
import { DevotionalLightboxModal } from '../components/DevotionalLightboxModal';
import { DevotionalLeader } from '../components/DevotionalPhotoCard';
import '../pillar-background.css';

/** The invite id from the URL. Tolerates the mangled ?invite-<id> form some
    scanner apps and hand-typed addresses produce alongside the canonical
    ?invite=<id>. */
const parseInviteParam = (): string | null => {
  const clean = new URLSearchParams(window.location.search).get('invite');
  if (clean) return clean;
  const m = window.location.search.match(/[?&]invite[-=]([a-z0-9-]+)/i);
  return m ? m[1] : null;
};

/* The sections that do not change with the hall's path, kept from re-rendering
   each time it turns (the turn has the main thread to itself). */
const AwardsSectionMemo = React.memo(AwardsSection);
const PartnersSectionMemo = React.memo(PartnersSection);
const SiteFooterMemo = React.memo(SiteFooter);
const HomeLandingMemo = React.memo(HomeLanding);
/* the header is painted from the page's CSS colours and never reads the hall's path it is handed */
const HeaderMemo = React.memo(Header, (previous, next) => (Object.keys(next) as (keyof typeof next)[]).every(key => key === 'currentPillar' || previous[key] === next[key]));

const WELCOME_SESSION_KEY = 'sncf.welcome.shown';
/* Editors can switch the whole welcome intro off under "Sections on/off". */
const introSwitchedOff = () => getCMSSnapshot().components?.['home.welcome']?.enabled === false;
let welcomeShownInMemory = false;
const welcomeWasShown = () => {
  try { return welcomeShownInMemory || sessionStorage.getItem(WELCOME_SESSION_KEY) === '1'; }
  catch { return welcomeShownInMemory; }
};

export default function HomePage() {
  const navigate = useNavigate();
  const [compactViewport, setCompactViewport] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setCompactViewport(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  /* 'showing' -> 'exiting' (logo flies to the header) -> 'done'.
     The hero is mounted underneath the whole time so the handoff is seamless.
     A visitor arriving from a scanned pass (?invite=...) skips the splash
     entirely — they came for an invitation, and 5.7s of signature animation
     between scan and invitation reads as the page not opening at all. */
  const [splashPhase, setSplashPhase] = useState<'showing' | 'exiting' | 'done'>(() =>
    /* partner-invite: the CSR desk's personalised links (PartnersSection)
       skip the splash for the same reason event passes do */
    welcomeWasShown() || introSwitchedOff() || parseInviteParam() || new URLSearchParams(window.location.search).has('partner-invite')
      ? 'done'
      : 'showing',
  );
  /* A first visit may start before the CMS publication arrives: if it turns
     out the intro is switched off, close it as soon as that is known. */
  const cmsRevision = useCMSRevision();
  useEffect(() => {
    if (splashPhase === 'showing' && introSwitchedOff()) setSplashPhase('done');
  }, [cmsRevision, splashPhase]);
  useEffect(() => {
    if (splashPhase === 'done') return;
    welcomeShownInMemory = true;
    try { sessionStorage.setItem(WELCOME_SESSION_KEY, '1'); } catch { /* In-memory fallback when storage is unavailable. */ }
  }, [splashPhase]);
  const isSplashUp = splashPhase !== 'done';
  /* the landing's emblem assembles as the welcome dissolves (or at once, without a welcome) */
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
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
  usePageMotion(isSplashUp || isModalOpen || isSearchOpen || isGalleryOpen || isDonateOpen || !!galleryLeader || !!inviteId);
  const inviteItem = useMemo(
    () => (inviteId ? resolveEvents(EVENTS).find((i) => i.event.id === inviteId) ?? null : null),
    [inviteId, EVENTS],
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

  /* THE LANDING COMES FIRST and the hall second. The hall's entrance (its
     words rising, its emblem settling, its pillars starting to turn) waits
     until the visitor reaches it: once its top has crossed the middle of the
     screen, or a landing door has led there. */
  const [heroArrived, setHeroArrived] = useState(false);
  useEffect(() => {
    if (heroArrived) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const hero = document.getElementById('hero-clone-stage');
      if (hero && hero.getBoundingClientRect().top <= window.innerHeight * 0.5) setHeroArrived(true);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroArrived, cmsRevision]);
  /* THE HALL IS A TRACK, one screen of scroll per path (homepage.css): the
     hall is pinned while the page scrolls Heal, Enrich, Empower, Projects, and
     the page's position chooses the path. Path i sits at the track's top plus,
     past the first, whatever a hall taller than the screen needs to reach its
     foot, plus i screens. */
  const heroTrack = () => {
    const track = document.getElementById('hero-track');
    const hero = document.getElementById('hero-clone-stage');
    if (!track || !hero) return null;
    const vh = window.innerHeight;
    return { track, vh, extra: Math.max(0, hero.offsetHeight - vh) };
  };
  /* While a chosen path's scroll is under way, the reader keeps out of it, or it
     would narrate every path the page passes on the way. */
  const heroClaim = useRef<number | null>(null);
  const heroClaimTimer = useRef(0);
  const heroClaimSettle = useRef<(() => void) | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  useEffect(() => {
    // Phones read the whole chapter in normal document flow; the tabs choose
    // a pillar without pinning a tall composition above the viewport.
    if (compactViewport) return;
    let raf = 0;
    /* THE TURNING RULE. A page turns 30% of the way into a scroll in the
       direction of travel (at is measured in screens along the track, 0 at
       Heal), so it answers the scroll at once. It is undone only by a clear
       reversal: going back 15% from the furthest point reached since that turn.
       A quick fling lands on the page it reaches. */
    const EARLY = 0.3, MARGIN = 0.15;
    let held = -1, observed = -1, direction = 1, furthest = 0;
    const read = () => {
      raf = 0;
      const geometry = heroTrack();
      if (!geometry || heroClaim.current !== null) return;
      const r = geometry.track.getBoundingClientRect();
      if (r.top >= geometry.vh || r.bottom <= 0) return;
      const at = (-r.top - geometry.extra) / geometry.vh;
      const last = activePillarsList.length - 1;
      /* chosen elsewhere (a door, a button, a key) or just arrived: start from here;
         a change this reader made itself is only waiting for React to catch up */
      const current = activeIndexRef.current;
      if (current !== observed) {
        observed = current;
        if (current !== held) { held = current; direction = at >= held ? 1 : -1; furthest = at; }
      }
      furthest = direction > 0 ? Math.max(furthest, at) : Math.min(furthest, at);
      const forwardAt = direction < 0 ? Math.max(held + EARLY, furthest + MARGIN) : held + EARLY;
      const backAt = direction > 0 ? Math.min(held - EARLY, furthest - MARGIN) : held - EARLY;
      let next = held;
      if (at >= forwardAt) { next = Math.min(last, Math.floor(at + 1 - EARLY)); direction = 1; furthest = at; }
      else if (at <= backAt) { next = Math.max(0, Math.ceil(at - 1 + EARLY)); direction = -1; furthest = at; }
      if (next === held) return;
      held = next;
      setActiveIndex(next);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activePillarsList.length, cmsRevision, compactViewport]);
  /* FAR SECTIONS HOLD THEIR COLOURS. The page's accent (--accent-a/-b)
     changes with each turn of the hall and each explore chapter; every element
     of the page inherits it, so each change restyled all ~3,600 of them, a
     frame or more of work. A section more than half a screen off the screen
     keeps the colours it last had, written on it, so a change stops there; it
     takes the page's own again on its way back, before it is seen. Nothing on
     the screen looks different. (Only registered properties stop there, which
     is why the ink and tint mixed from the accent are worked out where they are
     used, homepage.css, rather than held.) */
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const HELD = ['--accent-a', '--accent-b'];
    const holding = new Set<HTMLElement>();
    let raf = 0;
    const read = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const section of Array.from(page.children) as HTMLElement[]) {
        const r = section.getBoundingClientRect();
        const far = r.bottom < -vh * 0.5 || r.top > vh * 1.5;
        if (far === holding.has(section)) continue;
        if (far) {
          const now = getComputedStyle(section);
          for (const name of HELD) section.style.setProperty(name, now.getPropertyValue(name));
          holding.add(section);
        } else {
          for (const name of HELD) section.style.removeProperty(name);
          holding.delete(section);
        }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const section of holding) for (const name of HELD) section.style.removeProperty(name);
    };
  }, [cmsRevision]);
  /* THE HEADER OVER THE LANDING. The landing stands on a light ground
     (home-landing.css), where the header's and the social rail's white would
     vanish: while it is under them, each is marked data-light and takes dark
     ink on frosted white. Marked on them, not on the page, so the change
     restyles them alone. */
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let raf = 0;
    const mark = (id: string, on: boolean) => {
      const el = document.getElementById(id);
      if (el && (el.dataset.light === 'true') !== on) el.dataset.light = String(on);
    };
    const read = () => {
      raf = 0;
      /* the grey screen, and half the band below it where the grey flows into the green */
      const ground = page.querySelector<HTMLElement>('.home-landing > .mosaic-overture');
      const bottom = ground ? ground.getBoundingClientRect().bottom + Math.min(40, Math.max(20, window.innerHeight * 0.035)) : -Infinity;
      mark('site-header', bottom > (document.getElementById('site-header')?.offsetHeight ?? 72));
      mark('hero-social-sidebar', bottom > window.innerHeight * 0.72);
      const header = document.getElementById('site-header');
      const recognition = page.querySelector('#awards-section')?.getBoundingClientRect();
      if (header) {
        const overRecognition = recognition && recognition.top <= header.offsetHeight && recognition.bottom > header.offsetHeight;
        if (overRecognition) {
          if (header.dataset.section !== 'recognition') header.dataset.section = 'recognition';
        } else if (header.dataset.section === 'recognition') delete header.dataset.section;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const id of ['site-header', 'hero-social-sidebar']) delete document.getElementById(id)?.dataset.light;
      if (document.getElementById('site-header')?.dataset.section === 'recognition') delete document.getElementById('site-header')?.dataset.section;
    };
  }, [cmsRevision, isSplashUp]);
  /* Scroll the page to top (smoothly; at once under reduced motion) with the
     hall held on path index all the way, then call landed, if given. The hold
     ends once the scroll has stopped where it was going; a smooth scroll can
     stall for a moment (while a turn of the hall's pages is captured), and a
     hold let go then would hand the reader a page half-way, which it would
     turn back. Stopped short of it for longer (the visitor took the wheel),
     the hold ends all the same. */
  const scrollHolding = useCallback((top: number, index: number, landed?: () => void) => {
    /* a scroll still under way for an earlier choice gives way to this one */
    if (heroClaimSettle.current) window.removeEventListener('scroll', heroClaimSettle.current);
    heroClaim.current = index;
    const goal = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: calm ? 'instant' : 'smooth' });
    let moved = performance.now();
    const release = () => {
      if (Math.abs(window.scrollY - goal) > 2 && performance.now() - moved < 700) {
        heroClaimTimer.current = window.setTimeout(release, 120);
        return;
      }
      heroClaim.current = null;
      window.removeEventListener('scroll', settle);
      heroClaimSettle.current = null;
      landed?.();
    };
    const settle = () => {
      moved = performance.now();
      window.clearTimeout(heroClaimTimer.current);
      heroClaimTimer.current = window.setTimeout(release, 180);
    };
    heroClaimSettle.current = settle;
    window.addEventListener('scroll', settle, { passive: true });
    settle();
  }, []);
  /* Go to path i: the hall turns to it at once and the page scrolls there.
     From the landing, focus goes too. */
  const goToPillar = useCallback((index: number, takeFocus = false) => {
    const geometry = heroTrack();
    if (!geometry) return;
    const offset = compactViewport
      ? -(document.getElementById('site-header')?.offsetHeight ?? 72)
      : index === 0 ? 0 : geometry.extra + index * geometry.vh;
    setActiveIndex(index);
    setHeroArrived(true);
    scrollHolding(window.scrollY + geometry.track.getBoundingClientRect().top + offset, index);
    if (takeFocus) document.getElementById('hero-clone-stage')?.focus({ preventScroll: true });
  }, [scrollHolding, compactViewport]);
  /* Explore on a path opens that path's own page: Heal's, Enrich's and
     Empower's sections on Core Values, and the Projects page for the projects
     (each of which has its section there). */
  const explorePath = useCallback((pillar: PillarState) => {
    navigate(pillar.id === 'projects' ? '/projects' : pillar.id === 'amrit' ? '/projects#project-amrit' : pillar.id === 'oneness' ? '/projects#oneness-vann' : `/core-values#${pillar.id}`);
  }, [navigate]);
  /* A landing door leads to its own path in the hall; the landing's cue, to the first. */
  const enterPath = useCallback((id: string) => {
    goToPillar(Math.max(0, activePillarsList.findIndex(p => p.id === id)), true);
  }, [activePillarsList, goToPillar]);
  const toFirstPath = useCallback(() => goToPillar(0, true), [goToPillar]);
  const openDonate = useCallback(() => setIsDonateOpen(true), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const openGallery = useCallback(() => setIsGalleryOpen(true), []);
  const searchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim()) setIsSearchOpen(true);
  }, []);
  /* the details panel opens on whichever path the hall is on when it is asked for */
  const currentPillarRef = useRef(currentPillar);
  currentPillarRef.current = currentPillar;
  const openDetails = useCallback(() => {
    setSelectedPillarForModal(currentPillarRef.current);
    setIsModalOpen(true);
  }, []);

  /* --accent-a/--accent-b are written on <body> in exactly one place: the hero
     section, which is the only thing that knows whether a pillar or the
     devotional portrait is fronting. App used to write them too and, because
     child effects run before parent effects, always won — painting the header
     chrome in the pillar's colour while the stage was devotional rose. */

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen || isSearchOpen || isGalleryOpen || isDonateOpen || isSplashUp) return;

      /* the search chord works from anywhere, fields included */
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      /* Never hijack keys aimed at an interactive element: Space in the
         partner desk's text field must insert a space (not toggle the hero),
         arrows must move the caret (not switch the pillar), and Space/Enter
         on a focused button must activate it. */
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))
      ) {
        return;
      }

      /* Left and right step through the paths while the hall holds the screen;
         elsewhere they are left to the page. */
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const geometry = heroTrack();
        const r = geometry?.track.getBoundingClientRect();
        if (!geometry || !r || r.top > geometry.vh * 0.5 || r.bottom < geometry.vh * 0.5) return;
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        goToPillar(Math.max(0, Math.min(activePillarsList.length - 1, activeIndexRef.current + step)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSearchOpen, isGalleryOpen, isDonateOpen, isSplashUp, activePillarsList.length, goToPillar]);

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
    <div ref={pageRef} className="home-page relative min-h-screen w-full flex flex-col bg-deep-blue font-sans select-none" data-hero-theme={currentPillar.id}>
      {/* One fixed color surface beneath the hero and every following section.
          The active chapter takes over the palette as it enters view. */}
      <div className="accent-canvas absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      {/* 0. WELCOME SPLASH SCREEN — hands off to the hero via a shared-element
             logo flight into the header. */}
      {isSplashUp && (
        <WelcomeSplashScreen
          onExitStart={() => setSplashPhase('exiting')}
          onLeaveStart={() => setWelcomeLeaving(true)}
          onComplete={() => setSplashPhase('done')}
        />
      )}

      {/* 1. TOP HEADER NAVIGATION */}
      <CMSSection id="shared.Header"><HeaderMemo
        currentPillar={currentPillar}
        onSearchClick={openSearch}
        searchQuery={searchQuery}
        onSearchChange={searchChange}
        onOpenDetails={openDetails}
        onOpenGallery={openGallery}
        onOpenDonate={openDonate}
        hideLogo={isSplashUp}
      /></CMSSection>

      {/* Social sidebar — a viewport fixture, so it lives at ROOT level, not
          inside the hero. Inside it sat in the hero's stacking context
          (relative z-10), where its own z-40 counted for nothing against the
          footer: a later sibling at the same z-10 paints over the entire hero
          context, fixed children included, which is exactly how the icons
          ended up sliced off behind the footer. Out here its z-40 is real —
          above the sections and footer (z-10), below the header and modals
          (z-50). */}
      <CMSSection id="shared.SocialSidebar"><SocialSidebar /></CMSSection>

      {/* 2. LANDING — "Four paths. One purpose.", the first screen; its doors lead into the hall.
          3. HERO — the site's single hero, the hall, second. */}
      <CMSLayout sections={[
        {id:'home.landing',node:(<HomeLandingMemo play={welcomeLeaving || !isSplashUp} onEnter={enterPath} onScrollOn={toFirstPath} />)},
        {id:'home.intro',node:(<><div id="hero-track" className="hero-track" style={{ '--hero-count': activePillarsList.length } as React.CSSProperties}>
        <HeroSection
        activeIndex={activeIndex}
        onActiveIndexChange={handleActiveIndexChange}
        isPaused={isPaused || isSplashUp}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onOpenDetails={explorePath}
        introActive={!isSplashUp && heroArrived}
        scrollDriven
        onChoosePillar={goToPillar}
      /></div></>)},
        /* the projects' chapter, which followed here, is now the Projects page's cover (ProjectsPage) */
        {id:'home.awards',node:<AwardsSectionMemo />},
        {id:'home.partners',node:(<PartnersSectionMemo
        escapeSuspended={
          /* while any overlay is up, Escape belongs to the overlay — the
             desk beneath it must not collapse on the same keypress */
          isModalOpen || isSearchOpen || isGalleryOpen || isDonateOpen || galleryLeader !== null
        }
      />)},
        {id:'home.footer',node:<SiteFooterMemo onOpenDonate={openDonate} />},
      ]} />

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
