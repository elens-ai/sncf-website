import { QuoteWords } from './QuoteWords';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { introFocus, introSeconds } from '../cms/introSettings';
import { FlaredWordmark } from './PillarWordmark';
import { MissionChapters, type MissionChapter } from './MissionChapters';
import { useReducedMotion } from 'motion/react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Reserve the whole paragraph while revealing its letters, so the page never reflows. */
const WelcomeTypewriter = ({ text, delay, duration }: { text: string; delay: number; duration: number }) => {
  const letters = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const nodes = Array.from(letters.current?.children ?? []) as HTMLElement[];
    nodes.forEach(node => { node.style.visibility = reduced ? 'visible' : 'hidden'; });
    if (reduced) return;
    let shown = 0;
    let frame = 0;
    const start = performance.now() + delay;
    const type = (now: number) => {
      const count = Math.floor(Math.max(0, Math.min(1, (now - start) / duration)) * nodes.length);
      while (shown < count) nodes[shown++].style.visibility = 'visible';
      if (shown < nodes.length) frame = requestAnimationFrame(type);
    };
    frame = requestAnimationFrame(type);
    return () => cancelAnimationFrame(frame);
  }, [text, delay, duration, reduced]);
  return <>
    <span className="sr-only">{text}</span>
    <span ref={letters} className="welcome-typewriter" aria-hidden="true">
      {Array.from(text).map((letter, index) => <span key={index}>{letter}</span>)}
    </span>
  </>;
};

interface WelcomeSplashScreenProps {
  /** Fired when the logo starts flying to the header. */
  onExitStart: () => void;
  /** Fired as the welcome starts to dissolve into the page beneath it. */
  onLeaveStart?: () => void;
  onComplete: () => void;
}

/** Geometry for the shared-element flight, measured when it starts. */
interface FlightGeometry {
  dx: number;
  dy: number;
  scale: number;
  ms: number;
  ease: string;
}

/** Where the logo + tagline group settles on the welcome page. */
interface BrandPlacement {
  dy: number;
  scale: number;
}

/** Where the header's S.N.C.F monogram sits, so the splash copy can match it. */
interface MonogramPlacement {
  left: number;
  top: number;
  fontSize: number;
}

/* 'intro'   — the white first screen: logo + signature tagline.
   'welcome' — the white fades away, uncovering the welcome photo; the logo and
               tagline shrink and rise to sit above the heading and message.
   'message' — the photo gives way to a warm cream; the logo lands before
               the foundation's name, the Satguru's portrait comes in on the
               right, and her message is set beneath the name, its rail at
               the foot.
   'mission' — the same frame, on the same cream: the message lifts away,
               and who we are, Our Mission and Our Vision play beneath the
               name as chapters.
   'leaving' — the page fades to the hero; the splash logo and monogram
               crossfade into the real header logo and wordmark. */
type Stage = 'intro' | 'welcome' | 'message' | 'mission' | 'leaving';

/* Signature finishes ~3.35s (0.35s delay + 3s write); the shine sweep then
   runs 3.45s -> 4.45s. Holding to 4700ms lets the glint finish and leaves a
   beat before the welcome page. */
const HOLD_MS = 4700;
/* The white fades as the logo and tagline move up into place. */
const WHITE_FADE_MS = 1200;
const BRAND_MOVE_MS = 1100;
const BRAND_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)';
/* How long each page stays before moving on by itself, in seconds: editable in
   the CMS ("Intro · … time"). The welcome page holds long enough to read its
   paragraph (10s); the others a few seconds each: the copy animates in during
   the first one or two (index.css: WELCOME PAGE, MISSION PAGE), and the
   message and mission pages' rails let a viewer hold them to read. The mission
   page's time is shared equally among its two chapters (MissionChapters). The
   arrow button moves on at any time. */
const WELCOME_SECONDS = 10;
const MESSAGE_SECONDS = 3;
const MISSION_SECONDS = 6;
/* Where the welcome photo and the Satguru portrait are centred: editable in the
   CMS as "across% down%", for when an editor swaps either picture. */
const WELCOME_PHOTO_FOCUS = { x: '47%', y: '46%' };
const PORTRAIT_FOCUS = { x: '50%', y: '20%' };
/* Logo flight to the header slot, and the splash fading to the hero. */
const FLY_MS = 1050;
const FLY_EASE = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
/* The glide onto the foundation's name, as the welcome page dissolves: easing
   in and out like a camera move. */
const TITLE_FLY_MS = 1000;
const TITLE_FLY_EASE = 'cubic-bezier(0.65, 0, 0.25, 1)';
const LEAVE_MS = 1000;
/* The header logo is revealed under the splash copy as the page fades, so the
   swap reads as one motion rather than a cut. */
const HANDOFF_FADE_MS = 300;
/* Share of the viewport height the logo + tagline may take on the welcome
   page, and the size limits for that group (relative to the first screen). */
const BRAND_SHARE_OF_VIEWPORT = 0.24;
const BRAND_SCALE_MIN = 0.22;
const BRAND_SCALE_MAX = 0.5;

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onExitStart,
  onLeaveStart,
  onComplete,
}) => {
  const c = (key: string, fallback: string) => getCMSCopy(`copy.WelcomeSplashScreen.${key}`, fallback);
  const welcomeMs = introSeconds(c("welcome-hold-seconds", "10"), WELCOME_SECONDS);
  const messageMs = introSeconds(c("message-seconds", "3"), MESSAGE_SECONDS);
  const missionMs = introSeconds(c("mission-seconds", "6"), MISSION_SECONDS);
  const photoFocus = introFocus(c("welcome-photo-focus", "47% 46%"), WELCOME_PHOTO_FOCUS);
  const portraitFocus = introFocus(c("satguru-photo-focus", "50% 20%"), PORTRAIT_FOCUS);
  /* With reduced motion the chapters are set one after another, and the page simply holds. */
  const still = useReducedMotion() ?? false;

  const [stage, setStage] = useState<Stage>('intro');
  const [brandScale, setBrandScale] = useState(1);
  const [brandHeight, setBrandHeight] = useState(0);
  const [placement, setPlacement] = useState<BrandPlacement | null>(null);
  const [flight, setFlight] = useState<FlightGeometry | null>(null);
  const [monogram, setMonogram] = useState<MonogramPlacement | null>(null);
  const [logoLanded, setLogoLanded] = useState(false);

  const brandRef = useRef<HTMLDivElement>(null);
  const brandSlotRef = useRef<HTMLDivElement>(null);
  const placementRef = useRef<BrandPlacement | null>(null);
  placementRef.current = placement;

  /* The parent passes inline arrows, so these change identity on every render.
     Holding them in refs keeps the timer effect's deps stable — otherwise each
     re-render would tear down and reschedule the timers. */
  const onExitStartRef = useRef(onExitStart);
  const onLeaveStartRef = useRef(onLeaveStart);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onExitStartRef.current = onExitStart;
    onLeaveStartRef.current = onLeaveStart;
    onCompleteRef.current = onComplete;
  });

  const hasCompletedRef = useRef(false);
  const completeOnce = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onCompleteRef.current();
  }, []);

  const beginWelcome = useCallback(() => {
    const brand = brandRef.current;
    if (brand) {
      const fit = (window.innerHeight * BRAND_SHARE_OF_VIEWPORT) / brand.offsetHeight;
      setBrandHeight(brand.offsetHeight);
      setBrandScale(Math.min(BRAND_SCALE_MAX, Math.max(BRAND_SCALE_MIN, fit)));
    }
    setStage('welcome');
  }, []);

  /* Once the welcome content is laid out, move the (untransformed, centred)
     logo + tagline group onto the slot reserved for it above the heading. */
  useLayoutEffect(() => {
    if (stage !== 'welcome' || placement) return;
    const brand = brandRef.current;
    const slot = brandSlotRef.current;
    if (!brand || !slot) return;
    const b = brand.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    setPlacement({ dy: s.top + s.height / 2 - (b.top + b.height / 2), scale: brandScale });
  }, [stage, placement, brandScale]);

  /* The logo's own resting geometry, measured once before its first flight:
     every later flight is expressed relative to it. Measured where the brand
     group is HEADING, not mid-glide — if the arrow is pressed while the group is
     still settling, a mid-motion reading would land the logo short. */
  const baseRef = useRef<{ rect: DOMRect; groupScale: number } | null>(null);
  const measureBase = () => {
    if (baseRef.current) return baseRef.current;
    const src = document.getElementById('splash-sncf-logo');
    if (!src) return null;
    const group = brandRef.current;
    const settled = group?.style.transform;
    if (group) {
      group.style.transition = 'none';
      group.style.transform = placementRef.current ? `translateY(${placementRef.current.dy}px) scale(${placementRef.current.scale})` : 'none';
    }
    const rect = src.getBoundingClientRect();
    /* The logo sits inside the (possibly scaled) brand group, so its own
       transform is in the group's units: divide screen offsets by that scale. */
    const groupScale = group ? group.getBoundingClientRect().width / group.offsetWidth : 1;
    if (group) {
      group.style.transform = settled ?? '';
      void group.offsetWidth;
      group.style.transition = `transform ${BRAND_MOVE_MS}ms ${BRAND_EASE}`;
    }
    baseRef.current = { rect, groupScale };
    return baseRef.current;
  };
  const flyTo = (d: DOMRect, ms = FLY_MS, ease = FLY_EASE) => {
    const base = measureBase();
    if (!base) return;
    const s = base.rect;
    setFlight({
      dx: (d.left + d.width / 2 - (s.left + s.width / 2)) / base.groupScale,
      dy: (d.top + d.height / 2 - (s.top + s.height / 2)) / base.groupScale,
      scale: d.width / s.width,
      ms,
      ease,
    });
  };

  /* The logo first lands just before the foundation's name on the mission
     page, and moves on to the header slot as the hero loads. */
  const flightRef = useRef<'none' | 'title' | 'header'>('none');
  const titleSlotRef = useRef<HTMLSpanElement>(null);
  const flyLogoToTitle = useCallback(() => {
    const slot = titleSlotRef.current?.getBoundingClientRect();
    if (flightRef.current !== 'none' || !slot?.width) return;
    flightRef.current = 'title';
    onExitStartRef.current();
    flyTo(slot, TITLE_FLY_MS, TITLE_FLY_EASE);
  }, []);

  /* Sends the logo to the header slot, and places the S.N.C.F monogram exactly
     where the header will show it. Runs once. */
  const flyLogoToHeader = useCallback(() => {
    if (flightRef.current === 'header') return;
    if (flightRef.current === 'none') onExitStartRef.current();
    flightRef.current = 'header';
    const dst = document.getElementById('header-sncf-logo');
    if (dst) flyTo(dst.getBoundingClientRect());
    /* The header wordmark is laid out (just transparent) under the splash; its
       hidden monogram measure gives the exact spot and size of S.N.C.F. */
    const measure = document.querySelector('#site-wordmark .brand-monogram-measure');
    if (measure) {
      const m = measure.getBoundingClientRect();
      setMonogram({ left: m.left, top: m.top, fontSize: parseFloat(getComputedStyle(measure).fontSize) });
    }
  }, []);

  const beginMessage = useCallback(() => setStage('message'), []);
  /* Only from the message page: its rail keeps time after the arrow has moved
     on early, and running out then must not bring the mission page back. */
  const beginMission = useCallback(() => setStage(current => (current === 'message' ? 'mission' : current)), []);

  /* Once the message page is laid out, land the logo before the name; it stays
     there through the mission page until the hero loads, then flies on to the
     header (beginLeave). */
  useLayoutEffect(() => {
    if (stage === 'message' || stage === 'mission') flyLogoToTitle();
  }, [stage, flyLogoToTitle]);

  /* Fades the splash to the hero. The real header logo is revealed under the
     splash copy at the same moment; its opacity is set directly on the DOM,
     since routing it through app state would re-render the whole hero
     mid-animation. */
  const hasLeftRef = useRef(false);
  const beginLeave = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    const alreadyLanded = flightRef.current === 'header';
    flyLogoToHeader();
    setStage('leaving');
    onLeaveStartRef.current?.();
    window.setTimeout(() => {
      const headerLogo = document.getElementById('header-sncf-logo');
      if (headerLogo) headerLogo.style.opacity = '1';
      setLogoLanded(true);
    }, alreadyLanded ? 0 : FLY_MS - 180);
    window.setTimeout(completeOnce, Math.max(alreadyLanded ? 0 : FLY_MS, LEAVE_MS) + HANDOFF_FADE_MS + 150);
  }, [completeOnce, flyLogoToHeader]);

  /* Each page moves on by itself after its hold; the arrow moves on early.
     Rescheduled per stage, so skipping a page restarts the next one's clock.
     The message and mission pages keep their own time on their rails, which a
     viewer can pause, and end themselves; set still, they hold like the others. */
  useEffect(() => {
    const next = stage === 'intro' ? [beginWelcome, HOLD_MS]
      : stage === 'welcome' ? [beginMessage, welcomeMs]
      : stage === 'message' && still ? [beginMission, messageMs]
      : stage === 'mission' && still ? [beginLeave, missionMs]
      : null;
    if (!next) return;
    const timer = setTimeout(next[0] as () => void, next[1] as number);
    return () => clearTimeout(timer);
  }, [stage, still, beginWelcome, beginMessage, beginMission, beginLeave, welcomeMs, messageMs, missionMs]);

  /* Distant last resort, in case a stage's timer never fires: re-armed with
     each stage for the time still to come. It stands down while the message
     and the chapters play, since a viewer may pause them for as long as they
     like. */
  useEffect(() => {
    const rest = stage === 'intro' ? HOLD_MS + welcomeMs + messageMs + missionMs
      : stage === 'welcome' ? welcomeMs + messageMs + missionMs
      : stage === 'message' ? (still ? messageMs + missionMs : null)
      : stage === 'mission' ? (still ? missionMs : null)
      : 0;
    if (rest === null) return;
    const finishTimer = setTimeout(completeOnce, rest + FLY_MS + 6000);
    return () => clearTimeout(finishTimer);
  }, [completeOnce, stage, still, welcomeMs, messageMs, missionMs]);

  const advance = () => (stage === 'welcome' ? beginMessage() : stage === 'message' ? beginMission() : beginLeave());

  const revealed = stage !== 'intro';
  /* past the welcome page: the photograph has given way to the site's ground */
  const offPhoto = revealed && stage !== 'welcome';
  const onMission = stage === 'mission' || stage === 'leaving';
  const brandTransform = placement ? `translateY(${placement.dy}px) scale(${placement.scale})` : 'none';

  /* The message page plays as a sequence of one, so it has the mission page's
     rail: its line fills while the message stays, and a viewer can hold it to
     read. Editable in the CMS. */
  const message: MissionChapter[] = [{
    id: 'message',
    label: c("message-label", "Satguru's Message"),
    body: [],
    content: (
      <figure className="splash-message">
        <blockquote><QuoteWords>{c("message-text", "We are all part of one human family, children of the same formless Creator (Nirankar). This shared connection inspires compassion and selfless service, guiding us to stand by one another. At the heart of our Mission lies the spirit of healing, enrichment and empowerment – believing that nurturing one life uplifts the whole community. May we all be granted with the wisdom and strength to live in peace, to serve with humility and to care for our Earth and each other with a shared sense of responsibility.")}</QuoteWords></blockquote>
        <figcaption><cite>{c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}</cite></figcaption>
      </figure>
    ),
  }];

  /* The mission page's chapters, every line editable in the CMS. */
  const chapters: MissionChapter[] = [
    {
      id: 'who-we-are',
      label: c("mission-intro-label", "One Purpose"),
      statement: c("mission-intro-1", "SNCF is dedicated to serving humanity through selfless service and meaningful social initiatives."),
      /* one block: three editable sentences, run together */
      body: [[
        c("mission-intro-2", "From healthcare and community empowerment to environmental conservation, SNCF works to address vital social and ecological needs."),
        c("mission-intro-3", "With thousands of volunteers contributing across 3,500+ branches worldwide, its efforts aim to create lasting, grassroots-level transformation."),
        c("mission-intro-4", "Guided by the spirit of “Service with Humility,” SNCF continues to work towards building a healthier, greener and more compassionate society."),
      ].join(' ')],
      highlight: c("mission-intro-highlight", "Service with Humility"),
    },
    {
      /* Our Mission and Our Vision, side by side */
      id: 'mission-vision',
      label: c("mission-vision-label", "Mission & Vision"),
      body: [],
      parts: [
        {
          title: c("mission-title", "Our Mission"),
          quote: c("mission-quote", "When we give cheerfully, and when it is accepted with gratitude to the almighty, all are blessed."),
          body: [
            c("mission-text-1", "SNCF with its holy roots is set up with an objective to provide a better body, mind and soul to all those who are deprived, with the essence of being an instrument to god’s will and purpose. We believe that happiness increases by sharing and caring."),
            c("mission-text-2", "The mission of the SNCF thus, is to serve with humility and share our resources to heal, enrich and empower millions around the globe."),
          ],
        },
        {
          title: c("vision-title", "Our Vision"),
          quote: c("vision-quote", "“Living the spirit of service”"),
          body: [c("vision-text", "The work that SNCF engages in with individuals, families and communities around the world is only made possible by the involvement of ordinary individuals with and extra ordinary spirit of service. SNCF envisions a world with smiles, a heaven where all humans are healthy, educated and self-dependent; and as such would continue to strive and achieve this very objective by utilizing all its resources for the benefit of people across the world. We see a future where our pro-active efforts along with our association with other like-minded organizations would help turn this dream into a reality.")],
        },
      ],
    },
  ];

  return (
    <div
      id="welcome-splash-screen"
      role="dialog"
      aria-label={getCMSCopy("copy.WelcomeSplashScreen.da87301fca5f", "Sant Nirankari Charitable Foundation — Service with Humility")}
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden ${
        stage === 'leaving' ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Welcome page: one full-screen photo under the white first screen,
          uncovered as the white fades. It dissolves away as the message page
          arrives on its cream, which the mission page keeps (index.css:
          HAND-OFF); on leaving, the whole layer fades to reveal the hero.
          Opacity fades are
          GPU-composited, so they cost the same at any screen size. */}
      <div
        id="splash-welcome-photo"
        className={`splash-welcome-photo absolute inset-0 ${revealed ? 'is-revealed' : ''} ${offPhoto ? 'is-mission' : ''}`}
        style={{
          opacity: stage === 'leaving' ? 0 : 1,
          transition: `opacity ${LEAVE_MS}ms ease-in-out`,
          '--welcome-duration': `${welcomeMs}ms`,
          '--focus-x': photoFocus.x,
          '--focus-y': photoFocus.y,
        } as React.CSSProperties}
      >
        <div className="splash-camera absolute inset-0">
        <div
          className="splash-welcome-photo-image absolute inset-0"
          style={{ backgroundImage: `url("${resolveCMSAsset("asset.WelcomeSplashScreen.welcome-photo", "/images/welcome-volunteers.jpg")}")` }}
        />
        </div>
        <div className="splash-mission-shade" aria-hidden="true" />
        {/* the message and mission pages' ground, the logo's navy, over the site's */}
        <div className="splash-message-ground" data-shown={stage === 'message' || onMission} aria-hidden="true" />
        {revealed && (
          <div className="splash-welcome-content" data-gone={offPhoto}>
            {/* Room for the logo + tagline, which glide in from the first screen. */}
            <div ref={brandSlotRef} aria-hidden="true" style={{ height: brandHeight * brandScale, marginBottom: 'calc(var(--wp-s) * 2.6)', flex: 'none' }} />
            <h1 className="splash-welcome-heading">
              <FlaredWordmark text={c("welcome-short-name", "SNCF")} className="splash-welcome-sncf" />
              <span className="splash-welcome-name"><span><WelcomeTypewriter text={c("welcome-full-name", "Sant Nirankari Charitable Foundation")} delay={750} duration={2000} /></span></span>
            </h1>
            {/* Editable in the CMS. */}
            <p className="splash-welcome-text"><WelcomeTypewriter delay={1800} duration={Math.max(1000, welcomeMs - 2000)} text={c("welcome-text", "Established in 2010, the Sant Nirankari Charitable Foundation was created to give organized direction to diverse social initiatives. Guided by the principle of oneness, we bring compassion, care, and kindness to communities worldwide. Our mission extends beyond charity. We tackle social and environmental challenges, empower the underprivileged, and safeguard our planet to build a better world for all. Staying true to our motto ‘Service with Humility,’ we strive to uplift lives with dignity and selflessness.")} /></p>
          </div>
        )}
        {/* Message page, then mission page, in one frame: the foundation's
            name at the top of the copy column, the portrait on the right.
            Beneath the name, first the Satguru's message, then (as it lifts
            away) who we are, Our Mission and Our Vision played one at a time
            as a title sequence, each with its rail at the foot
            (MissionChapters). The portrait column spans the page's height,
            standing on its quotation, whose last line meets the rail. Both
            pages take their colours from the logo (index.css). */}
        {offPhoto && (
          <div className="splash-mission-page" data-page={onMission ? 'mission' : 'message'}>
            <div className="splash-mission-copy">
              <header className="splash-intro">
                <h2 className="splash-intro-name">
                  {/* The flying logo lands here, and stays until the hero loads. */}
                  <span ref={titleSlotRef} className="splash-intro-logo-slot" aria-hidden="true" />
                  <FlaredWordmark text={c("mission-intro-name", "Sant Nirankari Charitable Foundation")} className="splash-intro-wordmark" />
                </h2>
              </header>
              <div className="splash-copy-body">
                {/* the message, its rail with it; it lifts away as the chapters begin */}
                <div className="splash-message-sequence" data-gone={onMission} aria-hidden={onMission || undefined} inert={onMission}>
                  <MissionChapters
                    chapters={message}
                    totalMs={messageMs}
                    still={still}
                    labels={{ rail: c("message-rail-label", "Message progress"), pause: c("mission-pause", "Pause"), play: c("mission-play", "Play") }}
                    onEnd={beginMission}
                  />
                </div>
                {onMission && (
                  <MissionChapters
                    chapters={chapters}
                    totalMs={missionMs}
                    still={still}
                    labels={{ rail: c("mission-chapters-label", "Chapters"), pause: c("mission-pause", "Pause"), play: c("mission-play", "Play") }}
                    onEnd={beginLeave}
                  />
                )}
              </div>
            </div>
            <figure className="splash-satguru" style={{ '--portrait-focus': `${portraitFocus.x} ${portraitFocus.y}` } as React.CSSProperties}>
              {/* One portrait for the message and mission pages, in the same
                  frame, so it stays just as it is when the mission page begins. */}
              <div className="splash-satguru-frame">
                <img
                  src={resolveCMSAsset("asset.WelcomeSplashScreen.message-portrait", "/images/satguru-mata-sudiksha-ji-welcome.webp")}
                  alt={c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}
                />
              </div>
              {/* kept in place on the message page, so the portrait does not move
                  when it appears; there the Hindi couplet stands in its place,
                  and gives way to it on the mission page */}
              <figcaption data-shown={onMission}>
                <blockquote><QuoteWords>{c("satguru-quote", "A life lived for others is a life worth living.").replace(/^“|”$/g, '')}</QuoteWords></blockquote>
                <cite>— {c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}</cite>
                {/* Editable in the CMS. */}
                <p className="splash-couplet" lang="hi" data-gone={onMission} aria-hidden={onMission || undefined}>
                  <span>{c("message-couplet-1", "मानव को हो मानव प्यारा")}</span>
                  <span>{c("message-couplet-2", "इक दूजे का बने सहारा")}</span>
                </p>
              </figcaption>
            </figure>
          </div>
        )}
      </div>

      {/* White first screen. Fades slowly as the welcome page takes over. It sits
          above the welcome copy (so nothing shows through it while it fades)
          and below the logo, motto and arrow. */}
      <div
        id="splash-veil"
        className="absolute inset-0 z-[5] bg-white pointer-events-none"
        style={{
          opacity: revealed ? 0 : 1,
          transition: `opacity ${WHITE_FADE_MS}ms ease-in-out`,
        }}
      />

      {/* S.N.C.F beside the landed logo, matching the header monogram exactly;
          it crossfades into the real header wordmark when the splash leaves. */}
      {monogram && (
        <span
          className="splash-monogram"
          aria-hidden="true"
          data-leaving={stage === 'leaving'}
          style={{ left: monogram.left, top: monogram.top, fontSize: monogram.fontSize }}
        >S<i>.</i>N<i>.</i>C<i>.</i>F</span>
      )}

      {/* Logo + tagline: centred on the first screen, then shrunk and lifted
          above the welcome heading. */}
      <div
        ref={brandRef}
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{
          transform: brandTransform,
          transformOrigin: '50% 50%',
          transition: `transform ${BRAND_MOVE_MS}ms ${BRAND_EASE}`,
        }}
      >
        {/* SNCF logo, rendered exactly as in the header: a white disc sized to
            the emblem's outer ring (not the whole image box), so its see-through
            parts stay white over the photo without a white rim around the ring. */}
        <img
          id="splash-sncf-logo"
          src={resolveCMSAsset("asset.WelcomeSplashScreen.25aa35189463", "https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp")}
          alt={getCMSCopy("copy.WelcomeSplashScreen.44e3df1518ac", "Sant Nirankari Charitable Foundation Logo")}
          className="object-contain"
          style={{
            width: 'clamp(140px, 22vw, 280px)',
            height: 'clamp(140px, 22vw, 280px)',
            background: 'radial-gradient(circle closest-side, #fff 99%, transparent 100%) 37.2% 38.6% / 92.8% 92.8% no-repeat',
            ...(flight
              ? {
                  transform: `translate(${flight.dx}px, ${flight.dy}px) scale(${flight.scale})`,
                  opacity: logoLanded ? 0 : 1,
                  transition: `transform ${flight.ms}ms ${flight.ease}, opacity ${HANDOFF_FADE_MS}ms ease-out`,
                  willChange: 'transform, opacity',
                }
              : {}),
          }}
          referrerPolicy="no-referrer"
        />

        {/* Tagline in Brittany Signature, written on like a signature. Navy on
            the white first screen, white over the welcome photo; it fades as
            the logo leaves for the header. The reveal animation lives on the
            wrapper so it never competes with the text's own styles. */}
        <div
          className="relative"
          style={{
            marginTop: 'clamp(24px, 4.6vw, 59px)',
            opacity: offPhoto ? 0 : 1,
            transition: 'opacity 400ms ease-out',
          }}
        >
          <div className="tagline-write">
            <p
              id="splash-tagline"
              className="font-signature pb-4 leading-[1.15] whitespace-nowrap"
              style={{
                color: revealed ? '#fff' : 'var(--sncf-tagline)',
                textShadow: revealed ? '0 3px 24px rgb(6 55 130 / 0.45)' : 'none',
                transition: `color ${WHITE_FADE_MS}ms ease-in-out, text-shadow ${WHITE_FADE_MS}ms ease-in-out`,
                fontSize: 'clamp(1.75rem, 7.1vw, 91px)',
                wordSpacing: '0.26em',
              }}
            >{getCMSCopy("copy.WelcomeSplashScreen.56219e473693", "Service with Humility")}</p>

            {/* Glint layer: the same text, same metrics, sitting exactly over
                the original with the sweep clipped to the glyphs. aria-hidden
                so the tagline is not announced twice. */}
            <p
              aria-hidden="true"
              className="tagline-shine font-signature pb-4 leading-[1.15] whitespace-nowrap"
              style={{
                fontSize: 'clamp(1.75rem, 7.1vw, 91px)',
                wordSpacing: '0.26em',
              }}
            >{getCMSCopy("copy.WelcomeSplashScreen.56219e473693", "Service with Humility")}</p>
          </div>
        </div>
      </div>

      {/* Next page: welcome -> message -> mission -> the site. Shown once the white first
          screen has gone and the logo and tagline have settled (CSS delay); light on the
          welcome photograph, in the logo's navy on the message and mission pages' cream. */}
      {revealed && <button
        type="button"
        className={`splash-skip${offPhoto ? '' : ' is-on-photo'}`}
        onClick={advance}
        aria-label={c("next-label", "Next")}
        title={c("next-label", "Next")}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>}
    </div>
  );
};
