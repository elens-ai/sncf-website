import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
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
   'mission' — the logo slides to its header slot with S.N.C.F beside it, the
               welcome copy gives way to Our Mission and Our Vision.
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
/* How long each page stays before moving on by itself. The copy animates in
   during the first few seconds (timings in index.css: WELCOME PAGE / MISSION
   PAGE) and then stays readable; the arrow button moves on at any time. */
const WELCOME_MS = 11000;
const MISSION_MS = 24000;
/* Logo flight to the header slot, and the splash fading to the hero. */
const FLY_MS = 1050;
const FLY_EASE = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
const LEAVE_MS = 1000;
/* The header logo is revealed under the splash copy as the page fades, so the
   swap reads as one motion rather than a cut. */
const HANDOFF_FADE_MS = 300;
/* Share of the viewport height the logo + tagline may take on the welcome
   page, and the size limits for that group (relative to the first screen). */
const BRAND_SHARE_OF_VIEWPORT = 0.3;
const BRAND_SCALE_MIN = 0.3;
const BRAND_SCALE_MAX = 0.5;
const BRAND_GAP_PX = 18;

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onExitStart,
  onComplete,
}) => {
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

  /* Sends the logo from wherever it is to the header slot, and places the
     S.N.C.F monogram exactly where the header will show it. Runs once. */
  const hasFlownRef = useRef(false);
  const flyLogoToHeader = useCallback(() => {
    if (hasFlownRef.current) return;
    hasFlownRef.current = true;
    onExitStartRef.current();

    const src = document.getElementById('splash-sncf-logo');
    const dst = document.getElementById('header-sncf-logo');
    if (src && dst) {
      /* Measure the logo where the brand group is HEADING, not where it is
         mid-glide: if the arrow is pressed while the group is still settling,
         a mid-motion reading would land the logo short of the header slot. */
      const group = brandRef.current;
      const settled = group?.style.transform;
      if (group) {
        group.style.transition = 'none';
        group.style.transform = placementRef.current ? `translateY(${placementRef.current.dy}px) scale(${placementRef.current.scale})` : 'none';
      }
      const s = src.getBoundingClientRect();
      const d = dst.getBoundingClientRect();
      /* The logo sits inside the (possibly scaled) brand group, so its own
         transform is in the group's units: divide screen offsets by that scale. */
      const groupScale = group ? group.getBoundingClientRect().width / group.offsetWidth : 1;
      if (group) {
        group.style.transform = settled ?? '';
        void group.offsetWidth;
        group.style.transition = `transform ${BRAND_MOVE_MS}ms ${BRAND_EASE}`;
      }
      setFlight({
        dx: (d.left + d.width / 2 - (s.left + s.width / 2)) / groupScale,
        dy: (d.top + d.height / 2 - (s.top + s.height / 2)) / groupScale,
        scale: d.width / s.width,
      });
    }
    /* The header wordmark is laid out (just transparent) under the splash; its
       hidden monogram measure gives the exact spot and size of S.N.C.F. */
    const measure = document.querySelector('#site-wordmark .brand-monogram-measure');
    if (measure) {
      const m = measure.getBoundingClientRect();
      setMonogram({ left: m.left, top: m.top, fontSize: parseFloat(getComputedStyle(measure).fontSize) });
    }
  }, []);

  const beginMission = useCallback(() => {
    flyLogoToHeader();
    setStage('mission');
  }, [flyLogoToHeader]);

  /* Fades the splash to the hero. The real header logo is revealed under the
     splash copy at the same moment; its opacity is set directly on the DOM,
     since routing it through app state would re-render the whole hero
     mid-animation. */
  const hasLeftRef = useRef(false);
  const beginLeave = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    const alreadyLanded = hasFlownRef.current;
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
     Rescheduled per stage, so skipping a page restarts the next one's clock. */
  useEffect(() => {
    const next = stage === 'intro' ? [beginWelcome, HOLD_MS]
      : stage === 'welcome' ? [beginMission, WELCOME_MS]
      : stage === 'mission' ? [beginLeave, MISSION_MS]
      : null;
    if (!next) return;
    const timer = setTimeout(next[0] as () => void, next[1] as number);
    return () => clearTimeout(timer);
  }, [stage, beginWelcome, beginMission, beginLeave]);

  // Distant last resort, in case a stage's timer never fires.
  useEffect(() => {
    const finishTimer = setTimeout(completeOnce, HOLD_MS + WELCOME_MS + MISSION_MS + FLY_MS + 6000);
    return () => clearTimeout(finishTimer);
  }, [completeOnce]);

  const advance = () => (stage === 'welcome' ? beginMission() : beginLeave());

  const revealed = stage !== 'intro';
  const onMission = stage === 'mission' || stage === 'leaving';
  const brandTransform = placement ? `translateY(${placement.dy}px) scale(${placement.scale})` : 'none';
  const c = (key: string, fallback: string) => getCMSCopy(`copy.WelcomeSplashScreen.${key}`, fallback);

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
      {/* Welcome and mission pages: one full-screen photo under the white first
          screen, uncovered as the white fades; on leaving it fades as a whole
          to reveal the hero. Opacity fades are GPU-composited, so they cost the
          same at any screen size. */}
      <div
        id="splash-welcome-photo"
        className={`splash-welcome-photo absolute inset-0 ${revealed ? 'is-revealed' : ''} ${onMission ? 'is-mission' : ''}`}
        style={{
          opacity: stage === 'leaving' ? 0 : 1,
          transition: `opacity ${LEAVE_MS}ms ease-in-out`,
        }}
      >
        <div
          className="splash-welcome-photo-image absolute inset-0"
          style={{ backgroundImage: `url("${resolveCMSAsset("asset.WelcomeSplashScreen.welcome-photo", "/images/welcome-volunteers.jpg")}")` }}
        />
        <div className="splash-mission-shade" aria-hidden="true" />
        {revealed && (
          <div className="splash-welcome-content" data-gone={onMission}>
            {/* Room for the logo + tagline, which glide in from the first screen. */}
            <div ref={brandSlotRef} aria-hidden="true" style={{ height: brandHeight * brandScale, marginBottom: BRAND_GAP_PX, flex: 'none' }} />
            <h1 className="splash-welcome-heading">
              <span className="splash-welcome-sncf">{c("welcome-short-name", "SNCF")}</span>
              <span className="splash-welcome-rule" aria-hidden="true" />
              <span className="splash-welcome-name">{c("welcome-full-name", "Sant Nirankari Charitable Foundation")}</span>
            </h1>
            {/* Editable in the CMS. */}
            <p className="splash-welcome-text">{c("welcome-text", "The Sant Nirankari Charitable Foundation (SNCF) goes beyond just charity. Our mission is to spread kindness and care throughout the world, building a better society for those in need. Founded in 2010 to implement the vision of Nirankari Baba Ji,“Life gets a meaning, if it is lived for others”, SNCF focuses on social and charitable work.")}</p>
          </div>
        )}
        {onMission && (
          <div className="splash-mission">
            <section className="splash-mission-block">
              <h2 className="splash-mission-title">{c("mission-title", "Our Mission")}</h2>
              <p className="splash-mission-quote">{c("mission-quote", "When we give cheerfully, and when it is accepted with gratitude to the almighty, all are blessed.")}</p>
              <p className="splash-mission-text">{c("mission-text-1", "SNCF with its holy roots is set up with an objective to provide a better body, mind and soul to all those who are deprived, with the essence of being an instrument to god’s will and purpose. We believe that happiness increases by sharing and caring.")}</p>
              <p className="splash-mission-text">{c("mission-text-2", "The mission of the SNCF thus, is to serve with humility and share our resources to heal, enrich and empower millions around the globe.")}</p>
            </section>
            <div className="splash-mission-divider" aria-hidden="true" />
            <section className="splash-mission-block">
              <h2 className="splash-mission-title">{c("vision-title", "Our Vision")}</h2>
              <p className="splash-mission-quote">{c("vision-quote", "“Living the spirit of service”")}</p>
              <p className="splash-mission-text">{c("vision-text", "The work that SNCF engages in with individuals, families and communities around the world is only made possible by the involvement of ordinary individuals with and extra ordinary spirit of service. SNCF envisions a world with smiles, a heaven where all humans are healthy, educated and self-dependent; and as such would continue to strive and achieve this very objective by utilizing all its resources for the benefit of people across the world. We see a future where our pro-active efforts along with our association with other like-minded organizations would help turn this dream into a reality.")}</p>
            </section>
          </div>
        )}
        {onMission && (
          <figure className="splash-satguru">
            <img
              src={resolveCMSAsset("asset.WelcomeSplashScreen.satguru-photo", "/images/satguru-mata-sudiksha-ji-cutout.webp")}
              alt={c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}
            />
            <figcaption>
              <blockquote>{c("satguru-quote", "“Become One with the Formless One, so that we can become One with Everyone.”")}</blockquote>
              <cite>— {c("satguru-name", "Satguru Mata Sudiksha Ji Maharaj")}</cite>
            </figcaption>
          </figure>
        )}
      </div>

      {/* White first screen. Fades slowly as the welcome page takes over. */}
      <div
        id="splash-veil"
        className="absolute inset-0 bg-white pointer-events-none"
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
        {/* SNCF logo, rendered exactly as in the header */}
        <img
          id="splash-sncf-logo"
          src={resolveCMSAsset("asset.WelcomeSplashScreen.25aa35189463", "https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp")}
          alt={getCMSCopy("copy.WelcomeSplashScreen.44e3df1518ac", "Sant Nirankari Charitable Foundation Logo")}
          className="object-contain rounded-full bg-white"
          style={{
            width: 'clamp(140px, 22vw, 280px)',
            height: 'clamp(140px, 22vw, 280px)',
            ...(flight
              ? {
                  transform: `translate(${flight.dx}px, ${flight.dy}px) scale(${flight.scale})`,
                  opacity: logoLanded ? 0 : 1,
                  transition: `transform ${FLY_MS}ms ${FLY_EASE}, opacity ${HANDOFF_FADE_MS}ms ease-out`,
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
