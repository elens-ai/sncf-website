import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, SlidersHorizontal, X } from 'lucide-react';

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

const HOLD_MS = 3600; // signature finishes ~2.95s, then a beat to read it
const EXIT_MS = 1050;
/* The hand-off starts this long BEFORE touchdown: the header logo is revealed
   and the flying copy begins fading while still gliding its last few pixels.
   Blending the fade into the motion reads far smoother than landing first and
   fading afterwards, and it hides any sub-pixel misregistration between the
   GPU-scaled flying copy and the native header logo. */
const HANDOFF_BEFORE_MS = 180;
const FADE_MS = 300;
/* Gentler tail than the old symmetric bezier — long deceleration into the slot. */
const EXIT_EASE = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
/* The clip-path transition only starts after a double rAF, so it actually
   finishes ~2 frames after EXIT_MS. Completion is driven by transitionend;
   this timer is only a fallback and must clear that overhang, otherwise the
   splash unmounts mid-animation and the half-closed veil pops. */
/* Layout size of the veil circle; the covering size is reached via transform
   scale so the rasterised texture stays small on every display. */
const VEIL_LAYOUT_PX = 800;

/** Defaults mirror the shipped design exactly, so nothing moves until you tune it. */
const DEFAULT_LOGO_SIZE = 280; // clamp() ceiling
const DEFAULT_GAP = 59; // clamp() ceiling
const DEFAULT_TAGLINE_SIZE = 91; // clamp() ceiling
const DEFAULT_WORD_SPACING = 0.26; // em
const DEFAULT_COLOR = '#043793'; // deep navy, from the logo's outer ring
/* Off by default so the tagline rests on its brand colour. The palette
   sweep is still one click away in the splash tuner. */
const DEFAULT_AUTO_CYCLE = false;
const DEFAULT_CYCLE_SECONDS = 14;
const DEFAULT_SIGN_SECONDS = 2.6;
const DEFAULT_SIGNING = true;

/* Palette sampled directly from sncf-logo-only.webp — one representative per hue
   family present in the mark, picked by peak saturation x value within that family. */
export const LOGO_PALETTE: { name: string; hex: string }[] = [
  { name: 'Leaf green', hex: '#6cb33f' },
  { name: 'Logo green', hex: '#5fb934' },
  { name: 'Sky blue', hex: '#1eb7ea' },
  { name: 'Deep navy', hex: '#043793' },
  { name: 'Orchid', hex: '#d25aab' },
  { name: 'Magenta', hex: '#f52388' },
  { name: 'Violet', hex: '#b359c5' },
];

/* The hold and the tuned values persist in localStorage. Without this the splash
   would need to be caught inside its own 3s window on every single reload, which
   makes it impossible to iterate on with hot reload. Hold once, tune freely,
   press Resume when done. */
const HOLD_KEY = 'sncf:splash-hold';
const TUNE_KEY = 'sncf:splash-tune-v2'; // v2: retires persisted green/auto-cycle

const readHold = (): boolean => {
  try {
    // ?hold in the URL starts the splash already held, so the very first hold
    // doesn't have to be clicked inside the 3s window.
    if (new URLSearchParams(window.location.search).has('hold')) return true;
    return localStorage.getItem(HOLD_KEY) === '1';
  } catch {
    return false;
  }
};

interface TuneState {
  logoSize: number;
  gap: number;
  taglineSize: number;
  wordSpacing: number;
  color: string;
  autoCycle: boolean;
  cycleSeconds: number;
  isSigning: boolean;
  signSeconds: number;
}

const DEFAULT_TUNE: TuneState = {
  logoSize: DEFAULT_LOGO_SIZE,
  gap: DEFAULT_GAP,
  taglineSize: DEFAULT_TAGLINE_SIZE,
  wordSpacing: DEFAULT_WORD_SPACING,
  color: DEFAULT_COLOR,
  autoCycle: DEFAULT_AUTO_CYCLE,
  cycleSeconds: DEFAULT_CYCLE_SECONDS,
  isSigning: DEFAULT_SIGNING,
  signSeconds: DEFAULT_SIGN_SECONDS,
};

const readTune = (): TuneState => {
  try {
    const raw = localStorage.getItem(TUNE_KEY);
    return raw ? { ...DEFAULT_TUNE, ...JSON.parse(raw) } : DEFAULT_TUNE;
  } catch {
    return DEFAULT_TUNE;
  }
};

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

  // Design-time hold: freezes the auto-dismiss so the splash can be tuned in place.
  const [isHeld, setIsHeld] = useState<boolean>(readHold);
  const [showTuner, setShowTuner] = useState<boolean>(readHold);
  const [tune, setTune] = useState<TuneState>(readTune);
  const {
    logoSize,
    gap,
    taglineSize,
    wordSpacing,
    color,
    autoCycle,
    cycleSeconds,
    isSigning,
    signSeconds,
  } = tune;

  /* Bumping this remounts the wrapper, which restarts the CSS animation from
     zero — the only reliable way to replay a keyframe animation on demand. */
  const [signRunId, setSignRunId] = useState<number>(0);

  const setLogoSize = (v: number) => setTune((t) => ({ ...t, logoSize: v }));
  const setGap = (v: number) => setTune((t) => ({ ...t, gap: v }));
  const setTaglineSize = (v: number) => setTune((t) => ({ ...t, taglineSize: v }));
  const setWordSpacing = (v: number) => setTune((t) => ({ ...t, wordSpacing: v }));
  const setColor = (v: string) => setTune((t) => ({ ...t, color: v, autoCycle: false }));
  const setAutoCycle = (v: boolean) => setTune((t) => ({ ...t, autoCycle: v }));
  const setCycleSeconds = (v: number) => setTune((t) => ({ ...t, cycleSeconds: v }));
  const setIsSigning = (v: boolean) => setTune((t) => ({ ...t, isSigning: v }));
  const setSignSeconds = (v: number) => setTune((t) => ({ ...t, signSeconds: v }));
  const replaySignature = () => setSignRunId((n) => n + 1);

  // Persist so the hold and the tuned values survive reloads / hot reload.
  useEffect(() => {
    try {
      localStorage.setItem(HOLD_KEY, isHeld ? '1' : '0');
    } catch {
      /* storage unavailable — hold simply won't persist */
    }
  }, [isHeld]);

  useEffect(() => {
    try {
      localStorage.setItem(TUNE_KEY, JSON.stringify(tune));
    } catch {
      /* storage unavailable — values simply won't persist */
    }
  }, [tune]);

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

    const geom: ExitGeometry = {
      dx: cx - (s.left + s.width / 2),
      dy: cy - (s.top + s.height / 2),
      scale: d.width / s.width,
      cx,
      cy,
      radius,
    };

    setExitGeom(geom);
    // Mount the circle at full size, then collapse it on a later frame so the
    // transition has two distinct states to animate between.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setVeilCollapsed(true)),
    );

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
  }, []);

  useEffect(() => {
    // While held, no timers run at all — the splash stays put indefinitely.
    if (isHeld) return;

    const exitTimer = setTimeout(beginExit, HOLD_MS);
    // Distant last resort only — the real fallback is scheduled inside
    // beginExit, anchored to when the exit actually starts.
    const finishTimer = setTimeout(completeOnce, HOLD_MS + EXIT_MS + 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [isHeld, beginExit, completeOnce]);

  // Spacebar toggles the hold, so the splash can be caught before it fades.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsHeld((prev) => !prev);
        hasExitedRef.current = false;
        hasCompletedRef.current = false;
        veilDoneRef.current = false;
        fadeDoneRef.current = false;
        setLogoLanded(false);
        setExitGeom(null);
        setVeilCollapsed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tuned values apply only while held; the normal splash keeps its responsive classes.
  const isTuning = isHeld;

  return (
    <div
      id="welcome-splash-screen"
      role="dialog"
      aria-label="Sant Nirankari Charitable Foundation — Service with Humility"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden ${
        exitGeom ? 'pointer-events-none' : 'pointer-events-auto'
      } ${
        /* Lift the artwork clear of the tuner so it stays fully visible while adjusting */
        isHeld && showTuner ? 'pb-[300px]' : ''
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
           its final frame in some compositors. */
        /* key forces a REMOUNT when the rect swaps to the circle. Without it,
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
            ...(isTuning
              ? { width: logoSize, height: logoSize }
              : { width: 'clamp(140px, 22vw, 280px)', height: 'clamp(140px, 22vw, 280px)' }),
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

        {/* Tagline in Brittany Signature — written on like a signature, then
            colour-cycled through the logo palette.

            The reveal lives on this wrapper and the colour cycle on the <p>:
            both are `animation` shorthand, so on one element the second would
            clobber the first. The pen dot sits outside the clipped wrapper,
            otherwise the clip would hide the very tip it is meant to trace. */}
        <div
          key={signRunId}
          className="relative"
          style={{
            marginTop: isTuning ? gap : 'clamp(24px, 4.6vw, 59px)',
            ['--sign-duration' as string]: `${signSeconds}s`,
            ...(exitGeom
              ? {
                  opacity: 0,
                  transform: 'translateY(-14px)',
                  transition: `opacity 320ms ease-out, transform 320ms ease-out`,
                }
              : {}),
          }}
        >
          <div className={isSigning ? 'tagline-write' : ''}>
            <p
              id="splash-tagline"
              className={`font-signature pb-4 leading-[1.15] whitespace-nowrap ${
                // A running animation outranks inline styles in the cascade, so
                // the class is only applied when the cycle is actually wanted —
                // otherwise the picked colour would never show.
                /* Gate on autoCycle ALONE. The old `!isTuning || autoCycle`
                   meant production (isTuning === false) always got the cycle
                   class, and a running animation outranks the inline colour —
                   so the tagline swept the palette from its green first
                   keyframe no matter what the default colour was set to. */
                autoCycle ? 'tagline-color-cycle' : ''
              }`}
              style={
                isTuning
                  ? {
                      color,
                      fontSize: taglineSize,
                      wordSpacing: `${wordSpacing}em`,
                      animationDuration: `${cycleSeconds}s`,
                    }
                  : {
                      color: 'var(--sncf-tagline)',
                      fontSize: 'clamp(1.75rem, 7.1vw, 91px)',
                      wordSpacing: '0.26em',
                    }
              }
            >
              Service with Humility
            </p>
          </div>

        </div>
      </div>

      {/* ---------- Design-time controls ---------- */}

      {/* Hold / Resume */}
      <div
        className={`absolute top-4 right-4 z-20 flex items-center gap-2 transition-opacity duration-200 ${
          exitGeom ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {isHeld && (
          <button
            id="splash-tuner-toggle"
            onClick={() => setShowTuner((prev) => !prev)}
            title="Adjust logo and text"
            aria-label="Adjust logo and text"
            className={`grid place-items-center w-9 h-9 rounded-full border transition-all cursor-pointer active:scale-95 ${
              showTuner
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-500 border-neutral-300 hover:text-neutral-900 hover:border-neutral-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        <button
          id="splash-hold-btn"
          onClick={() => {
            setIsHeld((prev) => !prev);
            hasExitedRef.current = false;
            hasCompletedRef.current = false;
            setExitGeom(null);
            setVeilCollapsed(false);
          }}
          title={isHeld ? 'Resume — splash will fade out' : 'Hold the splash screen (Space)'}
          aria-label={isHeld ? 'Resume splash' : 'Hold splash'}
          aria-pressed={isHeld}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
            isHeld
              ? 'bg-amber-400 text-neutral-950 border-amber-400'
              : 'bg-white/80 text-neutral-400 border-neutral-200 hover:text-neutral-900 hover:border-neutral-400 opacity-40 hover:opacity-100'
          }`}
        >
          {isHeld ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isHeld ? 'Resume' : 'Hold'}</span>
        </button>
      </div>

      {/* Live tuning panel */}
      {isHeld && showTuner && (
        <div
          id="splash-tuner-panel"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[min(560px,92vw)] rounded-2xl bg-white border border-neutral-200 shadow-2xl p-5 text-left animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
            <h3 className="text-sm font-bold text-neutral-900 tracking-wide">
              Splash Layout — live preview
            </h3>
            <button
              onClick={() => setShowTuner(false)}
              aria-label="Close tuner"
              className="grid place-items-center w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between">
                Logo size <span className="text-neutral-900 tabular-nums">{logoSize}px</span>
              </span>
              <input
                type="range"
                min="64"
                max="320"
                step="2"
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between">
                Gap below logo <span className="text-neutral-900 tabular-nums">{gap}px</span>
              </span>
              <input
                type="range"
                min="0"
                max="120"
                step="1"
                value={gap}
                onChange={(e) => setGap(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between">
                Tagline size <span className="text-neutral-900 tabular-nums">{taglineSize}px</span>
              </span>
              <input
                type="range"
                min="20"
                max="160"
                step="1"
                value={taglineSize}
                onChange={(e) => setTaglineSize(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between">
                Word spacing{' '}
                <span className="text-neutral-900 tabular-nums">{wordSpacing.toFixed(2)}em</span>
              </span>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.01"
                value={wordSpacing}
                onChange={(e) => setWordSpacing(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </label>
          </div>

          {/* Signature write-on */}
          <div className="mt-4 pt-3 border-t border-neutral-200">
            <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between mb-2">
              Signature write-on
              <button
                id="splash-replay-btn"
                onClick={replaySignature}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
              >
                Replay
              </button>
            </span>
            <div className="flex items-center gap-3">
              <button
                id="splash-signing-toggle"
                onClick={() => {
                  setIsSigning(!isSigning);
                  replaySignature();
                }}
                aria-pressed={isSigning}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSigning
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-500 border-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                }`}
              >
                Write-on {isSigning ? 'ON' : 'OFF'}
              </button>

              <label className="flex-1 flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">
                  {signSeconds.toFixed(1)}s
                </span>
                <input
                  type="range"
                  min="0.6"
                  max="6"
                  step="0.1"
                  value={signSeconds}
                  disabled={!isSigning}
                  onChange={(e) => {
                    setSignSeconds(Number(e.target.value));
                    replaySignature();
                  }}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          {/* Tagline colour — every hue present in the logo mark */}
          <div className="mt-4 pt-3 border-t border-neutral-200">
            <span className="text-xs font-semibold text-neutral-600 flex items-center justify-between mb-2">
              Tagline colour
              <span className="text-neutral-900 font-mono uppercase">
                {autoCycle ? 'auto cycle' : color}
              </span>
            </span>

            {/* Auto-cycle through the whole palette */}
            <div className="flex items-center gap-3 mb-3">
              <button
                id="splash-autocycle-toggle"
                onClick={() => setAutoCycle(!autoCycle)}
                aria-pressed={autoCycle}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  autoCycle
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-500 border-neutral-300 hover:border-neutral-400 hover:text-neutral-900'
                }`}
              >
                Auto cycle {autoCycle ? 'ON' : 'OFF'}
              </button>

              <label className="flex-1 flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">
                  {cycleSeconds}s sweep
                </span>
                <input
                  type="range"
                  min="4"
                  max="40"
                  step="1"
                  value={cycleSeconds}
                  disabled={!autoCycle}
                  onChange={(e) => setCycleSeconds(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {LOGO_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  title={`${c.name} — ${c.hex}`}
                  aria-label={`${c.name} ${c.hex}`}
                  aria-pressed={!autoCycle && color.toLowerCase() === c.hex.toLowerCase()}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-all active:scale-90 ${
                    !autoCycle && color.toLowerCase() === c.hex.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                      : 'ring-1 ring-black/10 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}

              {/* Free-form picker for anything not in the mark */}
              <label
                title="Custom colour"
                className="relative w-8 h-8 rounded-full cursor-pointer ring-1 ring-black/10 hover:scale-110 transition-all grid place-items-center overflow-hidden"
                style={{
                  background:
                    'conic-gradient(#f52388, #d25aab, #b359c5, #043793, #1eb7ea, #5fb934, #f52388)',
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Custom tagline colour"
                />
              </label>
            </div>
          </div>

          {/* Copyable summary — read these back to bake the values in permanently */}
          <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
            <code
              id="splash-tuner-values"
              className="text-[11px] text-neutral-600 font-mono truncate"
            >
              logo {logoSize}px · gap {gap}px · tagline {taglineSize}px · space{' '}
              {wordSpacing.toFixed(2)}em · {autoCycle ? `sweep ${cycleSeconds}s` : color} ·{' '}
              {isSigning ? `sign ${signSeconds.toFixed(1)}s` : 'no write-on'}
            </code>
            <button
              onClick={() => setTune(DEFAULT_TUNE)}
              className="flex-shrink-0 text-xs font-semibold text-neutral-500 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
