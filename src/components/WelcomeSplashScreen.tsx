import React, { useCallback, useEffect, useRef, useState } from 'react';

interface WelcomeSplashScreenProps {
  /** Fired when the hand-off animation begins, so the header can clear its logo. */
  onExitStart: () => void;
  onComplete: () => void;
}

/** Geometry for the shared-element hand-off, measured at exit time. */
interface ExitGeometry {
  dx: number;
  dy: number;
  scale: number;
  cx: number;
  cy: number;
  radius: number;
}

/* Signature finishes ~3.35s (0.35s delay + 3s write); the shine sweep then
   runs 3.45s -> 4.45s. Holding to 4700ms lets the glint finish and leaves a
   beat before the hand-off — at the old 4000ms the sweep was cut mid-travel. */
const HOLD_MS = 4700;
const EXIT_MS = 1050;
/* The hand-off starts this long BEFORE touchdown: the header logo is revealed
   and the flying copy begins fading while still gliding its last few pixels.
   Blending the fade into the motion reads far smoother than landing first and
   fading afterwards, and it hides any sub-pixel misregistration between the
   GPU-scaled flying copy and the native header logo. */
const HANDOFF_BEFORE_MS = 180;
const FADE_MS = 300;
/* Gentler tail than a symmetric bezier — long deceleration into the slot. */
const EXIT_EASE = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
/* Layout size of the veil circle; the covering size is reached via transform
   scale so the rasterised texture stays small on every display. */
const VEIL_LAYOUT_PX = 800;

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({
  onExitStart,
  onComplete,
}) => {
  const [exitGeom, setExitGeom] = useState<ExitGeometry | null>(null);
  const [veilCollapsed, setVeilCollapsed] = useState<boolean>(false);

  /* The parent passes inline arrows, so these change identity on every render of
     App. Holding them in refs keeps the timer effect's deps stable — otherwise
     each re-render tears down and reschedules the hand-off, firing it twice. */
  const onExitStartRef = useRef(onExitStart);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onExitStartRef.current = onExitStart;
    onCompleteRef.current = onComplete;
  });

  /* True once the flying logo has landed on the header slot. The real header
     logo is revealed underneath at that instant and this copy fades out over it,
     so the swap is a crossfade rather than a single-frame cut. */
  const [logoLanded, setLogoLanded] = useState<boolean>(false);

  /* The hand-off must run exactly once. A second run would re-measure a logo
     that has already flown, compute scale 1 / offset 0, and snap it back to
     full size in the centre of the screen. */
  const hasExitedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  /* The splash may only unmount when BOTH the veil has finished closing AND the
     landing crossfade has finished — tearing it down after just the veil would
     cut the flying logo off mid-fade and reintroduce the pop at the header. */
  const veilDoneRef = useRef(false);
  const fadeDoneRef = useRef(false);

  const completeOnce = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onCompleteRef.current();
  }, []);

  const completeWhenSettled = useCallback(() => {
    if (veilDoneRef.current && fadeDoneRef.current) completeOnce();
  }, [completeOnce]);

  /* Measures where the header logo sits and animates this one onto it, while a
     white iris closes down to that same point. The result reads as the welcome
     screen collapsing into the site's own logo rather than a crossfade. */
  const beginExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;

    const src = document.getElementById('splash-sncf-logo');
    const dst = document.getElementById('header-sncf-logo');

    onExitStartRef.current();

    if (!src || !dst) {
      onCompleteRef.current();
      return;
    }

    const s = src.getBoundingClientRect();
    const d = dst.getBoundingClientRect();
    const cx = d.left + d.width / 2;
    const cy = d.top + d.height / 2;

    // Radius that still covers the furthest viewport corner from the landing point
    const radius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy),
    );

    setExitGeom({
      dx: cx - (s.left + s.width / 2),
      dy: cy - (s.top + s.height / 2),
      scale: d.width / s.width,
      cx,
      cy,
      radius,
    });

    // Mount the circle at full size, then collapse it on a later frame so the
    // transition has two distinct states to animate between.
    requestAnimationFrame(() => requestAnimationFrame(() => setVeilCollapsed(true)));

    /* Hand-off: reveal the header logo and start fading the flying copy while
       it is still gliding in. The header img's opacity is flipped DIRECTLY on
       the DOM rather than via app state — routing it through App re-rendered
       the entire hero tree at the most delicate moment of the animation, and
       that main-thread stall was itself a visible hitch at the end of the
       flight. The inline style stays consistent with the class the header
       computes once the splash reports done. */
    window.setTimeout(() => {
      if (!hasExitedRef.current) return;
      const headerLogo = document.getElementById('header-sncf-logo');
      if (headerLogo) headerLogo.style.opacity = '1';
      setLogoLanded(true);
    }, EXIT_MS - HANDOFF_BEFORE_MS);

    /* Completion fallback, anchored HERE rather than to HOLD_MS: if the exit
       timer fired late (throttled tab), a hold-anchored fallback lands mid-
       crossfade and cuts it short — unmounting the splash while the flying
       logo is still fading. Anchoring to the actual exit start keeps the
       fallback strictly after the natural end of every transition. */
    window.setTimeout(completeOnce, EXIT_MS + FADE_MS + 350);
  }, [completeOnce]);

  useEffect(() => {
    const exitTimer = setTimeout(beginExit, HOLD_MS);
    // Distant last resort only — the real fallback is scheduled inside
    // beginExit, anchored to when the exit actually starts.
    const finishTimer = setTimeout(completeOnce, HOLD_MS + EXIT_MS + 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [beginExit, completeOnce]);

  return (
    <div
      id="welcome-splash-screen"
      role="dialog"
      aria-label="Sant Nirankari Charitable Foundation — Service with Humility"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden ${
        exitGeom ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* White ground as its OWN layer — the logo is a sibling, so it keeps flying
          while the white collapses around it.

          The iris is a scaled circle, NOT an animated clip-path. clip-path is
          paint-driven: animating it repaints a full-viewport white layer every
          frame, so the cost grows with screen area and large displays visibly
          stutter. A transform scale is GPU-composited and costs the same at any
          size. Before the exit this is just a static rect; the swap to the circle
          is invisible because the circle already covers the furthest corner. */}
      {!exitGeom ? (
        <div key="veil-rect" id="splash-veil" className="absolute inset-0 bg-white" />
      ) : (
        /* The circle is laid out SMALL (800px) and transform-scaled up to cover
           the screen, then scaled to ~0. Laying it out at its real diameter
           (2x the corner radius — ~5800 CSS px on a large display, double that
           in device px) exceeds GPU texture limits, so the browser tiles and
           re-rasterises it mid-animation — the shimmer seen on big screens.
           A solid-white circle magnified from an 800px raster is visually
           identical, and the texture stays tiny at every viewport size.
           scale(0.001) rather than scale(0): a degenerate matrix can flash on
           its final frame in some compositors.

           key forces a REMOUNT when the rect swaps to the circle. Without it,
           React reuses the same div (same type, same position), and the browser
           then TRANSITIONS transform from identity to the initial scale — the
           circle visibly grows from 800px instead of mounting full-screen,
           flashing the hero around it for a beat. Fresh elements never run
           transitions on their first style, which is exactly what we want. */
        <div
          key="veil-circle"
          id="splash-veil"
          className="absolute bg-white rounded-full"
          style={{
            left: exitGeom.cx,
            top: exitGeom.cy,
            width: VEIL_LAYOUT_PX,
            height: VEIL_LAYOUT_PX,
            marginLeft: -VEIL_LAYOUT_PX / 2,
            marginTop: -VEIL_LAYOUT_PX / 2,
            transform: veilCollapsed
              ? 'scale(0.001)'
              : `scale(${(exitGeom.radius * 2) / VEIL_LAYOUT_PX})`,
            transition: `transform ${EXIT_MS}ms ${EXIT_EASE}`,
            willChange: 'transform',
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName === 'transform' && hasExitedRef.current) {
              veilDoneRef.current = true;
              completeWhenSettled();
            }
          }}
        />
      )}

      {/* Centered Content: logo + tagline only */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 animate-fade-in-up">
        {/* SNCF logo, rendered exactly as in the header — no disc, no ring, no glow */}
        <img
          id="splash-sncf-logo"
          src="https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp"
          alt="Sant Nirankari Charitable Foundation Logo"
          className="object-contain"
          style={{
            width: 'clamp(140px, 22vw, 280px)',
            height: 'clamp(140px, 22vw, 280px)',
            ...(exitGeom
              ? {
                  transform: `translate(${exitGeom.dx}px, ${exitGeom.dy}px) scale(${exitGeom.scale})`,
                  opacity: logoLanded ? 0 : 1,
                  transition: `transform ${EXIT_MS}ms ${EXIT_EASE}, opacity ${FADE_MS}ms ease-out`,
                  willChange: 'transform, opacity',
                }
              : {}),
          }}
          onTransitionEnd={(e) => {
            if (!hasExitedRef.current) return;
            if (e.propertyName === 'opacity') {
              fadeDoneRef.current = true;
              completeWhenSettled();
            }
          }}
          referrerPolicy="no-referrer"
        />

        {/* Tagline in Brittany Signature, written on like a signature. The reveal
            animation lives on the wrapper so it never competes with the text's
            own styles. */}
        <div
          className="relative"
          style={{
            marginTop: 'clamp(24px, 4.6vw, 59px)',
            ...(exitGeom
              ? {
                  opacity: 0,
                  transform: 'translateY(-14px)',
                  transition: 'opacity 320ms ease-out, transform 320ms ease-out',
                }
              : {}),
          }}
        >
          <div className="tagline-write">
            <p
              id="splash-tagline"
              className="font-signature pb-4 leading-[1.15] whitespace-nowrap"
              style={{
                color: 'var(--sncf-tagline)',
                fontSize: 'clamp(1.75rem, 7.1vw, 91px)',
                wordSpacing: '0.26em',
              }}
            >
              Service with Humility
            </p>

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
            >
              Service with Humility
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
