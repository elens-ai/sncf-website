import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { introFocus, introSeconds } from '../cms/introSettings';
import { FlaredWordmark } from './PillarWordmark';
import { MissionChapters, type MissionChapter } from './MissionChapters';
import { useReducedMotion } from 'motion/react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface WelcomeSplashScreenProps {
  /** Fired when the logo starts flying to the header. */
  onExitStart: () => void;
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
   'mission' — the logo lands before the foundation's name, and who we are,
               Our Mission and Our Vision play beneath it as chapters.
   'leaving' — the page fades to the hero; the splash logo and monogram
               crossfade into the real header logo and wordmark. */
type Stage = 'intro' | 'welcome' | 'mission' | 'leaving';

/* Signature finishes ~3.35s (0.35s delay + 3s write); the shine sweep then
   runs 3.45s -> 4.45s. Holding to 4700ms lets the glint finish and leaves a
   beat before the welcome page. */
const HOLD_MS = 4700;
/* The white fades slowly as the logo and tagline move up into place. */
const WHITE_FADE_MS = 2200;
const BRAND_MOVE_MS = 1600;
const BRAND_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)';
/* How long each page stays before moving on by itself, in seconds: editable in
   the CMS ("Intro · … time"). The welcome copy animates in during the first few
   seconds (index.css: WELCOME PAGE) and then stays readable; the mission page's
   time is shared out among its two chapters (MissionChapters). The arrow
   button moves on at any time. */
const WELCOME_SECONDS = 11;
const MISSION_SECONDS = 34;
/* Where the welcome photo and the Satguru portrait are centred: editable in the
   CMS as "across% down%", for when an editor swaps either picture. */
const WELCOME_PHOTO_FOCUS = { x: '47%', y: '46%' };
const PORTRAIT_FOCUS = { x: '50%', y: '20%' };
/* Logo flight to the header slot, and the splash fading to the hero. */
const FLY_MS = 1050;
const FLY_EASE = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
/* The glide onto the foundation's name, as the welcome page dissolves: slower,
   easing in and out like a camera move. */
const TITLE_FLY_MS = 1500;
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
  onComplete,
}) => {
  const c = (key: string, fallback: string) => getCMSCopy(`copy.WelcomeSplashScreen.${key}`, fallback);
  const welcomeMs = introSeconds(c("welcome-seconds", "11"), WELCOME_SECONDS);
  const missionMs = introSeconds(c("mission-seconds", "34"), MISSION_SECONDS);
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
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onExitStartRef.current = onExitStart;
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

  const beginMission = useCallback(() => setStage('mission'), []);

  /* Once the mission page is laid out, land the logo before the name; it stays
     there until the hero loads, then flies on to the header (beginLeave). */
  useLayoutEffect(() => {
    if (stage === 'mission') flyLogoToTitle();
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
    window.setTimeout(() => {
      const headerLogo = document.getElementById('header-sncf-logo');
      if (headerLogo) headerLogo.style.opacity = '1';
      setLogoLanded(true);
    }, alreadyLanded ? 0 : FLY_MS - 180);
    window.setTimeout(completeOnce, Math.max(alreadyLanded ? 0 : FLY_MS, LEAVE_MS) + HANDOFF_FADE_MS + 150);
  }, [completeOnce, flyLogoToHeader]);

  /* Each page moves on by itself after its hold; the arrow moves on early.
     Rescheduled per stage, so skipping a page restarts the next one's clock.
     The mission page's chapters keep their own time, which a viewer can pause,
     and end the page themselves; set still, the page holds like the others. */
  useEffect(() => {
    const next = stage === 'intro' ? [beginWelcome, HOLD_MS]
      : stage === 'welcome' ? [beginMission, welcomeMs]
      : stage === 'mission' && still ? [beginLeave, missionMs]
      : null;
    if (!next) return;
    const timer = setTimeout(next[0] as () => void, next[1] as number);
    return () => clearTimeout(timer);
  }, [stage, still, beginWelcome, beginMission, beginLeave, welcomeMs, missionMs]);

  /* Distant last resort, in case a stage's timer never fires: re-armed with
     each stage for the time still to come. It stands down while the chapters
     play, since a viewer may pause them for as long as they like. */
  useEffect(() => {
    const rest = stage === 'intro' ? HOLD_MS + welcomeMs + missionMs
      : stage === 'welcome' ? welcomeMs + missionMs
      : stage === 'mission' ? (still ? missionMs : null)
      : 0;
    if (rest === null) return;
    const finishTimer = setTimeout(completeOnce, rest + FLY_MS + 6000);
    return () => clearTimeout(finishTimer);
  }, [completeOnce, stage, still, welcomeMs, missionMs]);

  const advance = () => (stage === 'welcome' ? beginMission() : beginLeave());

  const revealed = stage !== 'intro';
  const onMission = stage === 'mission' || stage === 'leaving';
  const brandTransform = placement ? `translateY(${placement.dy}px) scale(${placement.scale})` : 'none';

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
          uncovered as the white fades. It dissolves away as the mission page
          arrives, leaving that page on deep green (index.css: HAND-OFF); on
          leaving, the whole layer fades to reveal the hero. Opacity fades are
          GPU-composited, so they cost the same at any screen size. */}
      <div
        id="splash-welcome-photo"
        className={`splash-welcome-photo absolute inset-0 ${revealed ? 'is-revealed' : ''} ${onMission ? 'is-mission' : ''}`}
        style={{
          opacity: stage === 'leaving' ? 0 : 1,
          transition: `opacity ${LEAVE_MS}ms ease-in-out`,
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
        {revealed && (
          <div className="splash-welcome-content" data-gone={onMission}>
            {/* Room for the logo + tagline, which glide in from the first screen. */}
            <div ref={brandSlotRef} aria-hidden="true" style={{ height: brandHeight * brandScale, marginBottom: 'calc(var(--wp-s) * 2.6)', flex: 'none' }} />
            <h1 className="splash-welcome-heading">
              <FlaredWordmark text={c("welcome-short-name", "SNCF")} className="splash-welcome-sncf" />
              <span className="splash-welcome-name"><span>{c("welcome-full-name", "Sant Nirankari Charitable Foundation")}</span></span>
            </h1>
            {/* Editable in the CMS. */}
            <p className="splash-welcome-text">{c("welcome-text", "Established in 2010, the Sant Nirankari Charitable Foundation was created to give organized direction to diverse social initiatives. Guided by the principle of oneness, we bring compassion, care, and kindness to communities worldwide. Our mission extends beyond charity. We tackle social and environmental challenges, empower the underprivileged, and safeguard our planet to build a better world for all. Staying true to our motto ‘Service with Humility,’ we strive to uplift lives with dignity and selflessness.")}</p>
          </div>
        )}
        {/* Mission page: the foundation's name at the top of the copy column,
            and beneath it who we are, Our Mission and Our Vision played one at
            a time as a title sequence, its rail at the foot (MissionChapters).
            The portrait column spans the page's height, standing on its
            quotation, whose last line meets the rail. */}
        {onMission && (
          <div className="splash-mission-page">
            <div className="splash-mission-copy">
              <header className="splash-intro">
                <h2 className="splash-intro-name">
                  {/* The flying logo lands here, and stays until the hero loads. */}
                  <span ref={titleSlotRef} className="splash-intro-logo-slot" aria-hidden="true" />
                  <FlaredWordmark text={c("mission-intro-name", "Sant Nirankari Charitable Foundation")} className="splash-intro-wordmark" />
                </h2>
              </header>
              <MissionChapters
                chapters={chapters}
                totalMs={missionMs}
                still={still}
                labels={{ rail: c("mission-chapters-label", "Chapters"), pause: c("mission-pause", "Pause"), play: c("mission-play", "Play") }}
                onEnd={beginLeave}
              />
            </div>
            <figure className="splash-satguru" style={{ '--portrait-focus': `${portraitFocus.x} ${portraitFocus.y}` } as React.CSSProperties}>
              <div className="splash-satguru-frame">
                <img
                  src={resolveCMSAsset("asset.WelcomeSplashScreen.satguru-photo", "/images/satguru-mata-sudiksha-ji-cutout.webp")}
                  alt={c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}
                />
              </div>
              <figcaption>
                <blockquote>{c("satguru-quote", "“Become One with the Formless One, so that we can become One with Everyone.”")}</blockquote>
                <cite>— {c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}</cite>
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
            opacity: onMission ? 0 : 1,
            transition: 'opacity 400ms ease-out',
          }}
        >
          <div className="tagline-write">
            <p
              id="splash-tagline"
              className="font-signature pb-4 leading-[1.15] whitespace-nowrap"
              style={{
                color: revealed ? '#fff' : 'var(--sncf-tagline)',
                textShadow: revealed ? '0 3px 24px rgb(0 0 0 / 0.45)' : 'none',
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

      {/* Next page: welcome -> mission -> the site. Shown once the white first
          screen has gone and the logo and tagline have settled (CSS delay). */}
      {revealed && <button
        type="button"
        className="splash-skip is-on-photo"
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
