import React, { useEffect, useRef } from 'react';
import { LOTUS_BASE, LOTUS_PETALS, LOTUS_VIEW } from './lotusGeometry';
import { PILLARS } from '../data/pillars';
import { DEVOTIONAL_ACCENT } from './DevotionalPhotoCard';

/**
 * The SNCF lotus, glossy and three-dimensional, unfolding on scroll.
 *
 * The geometry is the logo's own: each figure traced from the colour mark
 * (see lotusGeometry.ts), so the five swoosh-ribbon petals and their four
 * dots are exactly the shapes on the foundation's seal.
 *
 * THE COLOURS are the hero cards' own. Each petal is named for a card and
 * wears that card's two accents — welcome's devotional rose, Heal's green,
 * Enrich's blue, Empower's pink, Projects' cyan — read from PILLARS and
 * DEVOTIONAL_ACCENT rather than copied, so a card's palette and its petal
 * cannot drift apart (Projects' accents have already moved once).
 *
 * THE GLOSS is real SVG lighting, not a painted highlight: a specular pass
 * (feSpecularLighting + fePointLight) over the blurred alpha of the whole
 * group, clipped back to the shapes with feComposite and added onto the
 * gradient fills, then dropped onto the page with feDropShadow. The filter
 * lives on the GROUP, so one consistent light falls across the flower.
 *
 * THE UNFOLD is scroll-driven and runs left to right, one petal at a time:
 * each starts folded upright at the flower's base (rotated by -rest about
 * the convergence point, scaled down, nudged back, invisible) and blooms
 * through its own window with easeOutBack, fading in over the first 35% of
 * the window as it fans out to its baked-in resting pose. The windows do
 * not overlap, so a petal has finished and settled before the next moves.
 *
 * THE PROGRESS comes from the pinned track the flower sits in (trackRef):
 * 0 where the track's sticky stage takes hold, 1 where it lets go, so the
 * bloom is spent scrolling while the flower itself stays put on screen.
 * Without a track it falls back to reading its own approach up the
 * viewport, which is what a flower placed in an ordinary section wants.
 *
 * THE LEVITATION is time-driven and independent: a slow sine bob (~10px
 * over ~5s) with a gentle sway about the base, computed from
 * performance.now() in the same requestAnimationFrame loop.
 *
 * No animation libraries. No React state in the hot path — the loop writes
 * transform/opacity straight onto the nodes through refs, and reads its own
 * scroll progress from getBoundingClientRect, so scrolling never re-renders
 * the component. Under prefers-reduced-motion the flower renders fully open
 * and still, and the loop never starts.
 */

/** Petal id -> [dark base, light tip], straight from the hero's cards. The
    welcome petal takes the devotional portrait's accents, the other four
    their pillar's. */
const PETAL_ACCENTS: Record<string, [string, string]> = {
  welcome: [DEVOTIONAL_ACCENT.a, DEVOTIONAL_ACCENT.b],
  ...Object.fromEntries(PILLARS.map((p) => [p.id, [p.accentA, p.accentB]])),
};

const HIDDEN_SCALE_X = 0.45;
const HIDDEN_SCALE_Y = 0.62;
const BACK_NUDGE = 46;

const easeOutBack = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface SncfLotus3DProps {
  /** Optional external drive; when omitted the component works its own
      progress out each frame. */
  scrollProgress?: number;
  /** The pinned track this flower is staged in. Progress runs 0 → 1 across
      the track's travel, so the bloom is driven by scrolling that leaves the
      flower where it is. */
  trackRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const SncfLotus3D: React.FC<SncfLotus3DProps> = ({
  scrollProgress,
  trackRef,
  className,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const floatRef = useRef<SVGGElement | null>(null);
  const petalRefs = useRef<(SVGGElement | null)[]>([]);
  const progressProp = useRef<number | undefined>(scrollProgress);
  progressProp.current = scrollProgress;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { x: bx, y: by } = LOTUS_BASE;

    const pose = (progress: number, floatY: number, sway: number) => {
      if (floatRef.current) {
        floatRef.current.setAttribute(
          'transform',
          `translate(0 ${floatY.toFixed(2)}) rotate(${sway.toFixed(3)} ${bx} ${by})`,
        );
      }
      LOTUS_PETALS.forEach((petal, i) => {
        const node = petalRefs.current[i];
        if (!node) return;
        const [w0, w1] = petal.window;
        const u = clamp01((progress - w0) / (w1 - w0));
        const e = easeOutBack(u);
        const opacity = clamp01(u / 0.35);
        /* Petal geometry is baked at its resting pose, so the unfold runs
           the rotation from -rest (folded upright at the base) to 0. */
        const rot = -petal.rest * (1 - e);
        const sx = HIDDEN_SCALE_X + (1 - HIDDEN_SCALE_X) * e;
        const sy = HIDDEN_SCALE_Y + (1 - HIDDEN_SCALE_Y) * e;
        const back = BACK_NUDGE * (1 - e);
        /* rotate about the base, then scale about the base (the translate
           pair recentres the scale), with the back-nudge folded in. */
        node.setAttribute(
          'transform',
          `rotate(${rot.toFixed(2)} ${bx} ${by}) ` +
            `translate(${bx} ${(by + back).toFixed(2)}) ` +
            `scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-bx} ${-by})`,
        );
        node.style.opacity = opacity.toFixed(3);
      });
    };

    if (reduced) {
      pose(1, 0, 0);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const floatY = Math.sin((t / 5) * Math.PI * 2) * 10;
      const sway = Math.sin((t / 7.3) * Math.PI * 2) * 1.5;

      let progress = progressProp.current;
      if (progress === undefined) {
        const track = trackRef?.current;
        const vh = window.innerHeight || 1;
        if (track) {
          /* Pinned: 0 as the stage takes hold, 1 as the track runs out.
             Both terms are measured live, so a track sized in vh and a
             viewport that resizes (phone chrome collapsing, rotation) stay
             in step without hardcoding either. */
          const r = track.getBoundingClientRect();
          const span = r.height - vh;
          progress = span > 0 ? clamp01(-r.top / span) : 1;
        } else if (wrapRef.current) {
          /* Unpinned fallback: 0 while still below the fold, 1 shortly
             before the flower settles into place. */
          const r = wrapRef.current.getBoundingClientRect();
          progress = clamp01((vh - r.top) / (vh * 0.85));
        } else {
          progress = 1;
        }
      }
      pose(progress, floatY, sway);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <svg
        viewBox={`0 0 ${LOTUS_VIEW.w} ${LOTUS_VIEW.h}`}
        className="w-full h-auto block overflow-visible"
      >
        <defs>
          {LOTUS_PETALS.map((p) => {
            const [base, tip] = PETAL_ACCENTS[p.id] ?? ['#1f8a5c', '#6fd19a'];
            return (
              <linearGradient key={p.id} id={`lotus-${p.id}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={base} />
                <stop offset="1" stopColor={tip} />
              </linearGradient>
            );
          })}
          {/* The glossy plastic: specular light over the group's alpha,
              clipped to the shapes, added onto the gradients, then given
              depth with a soft drop shadow. */}
          <filter id="lotus-gloss" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="9"
              specularConstant="0.55"
              specularExponent="26"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="430" y="-80" z="640" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClip" />
            <feComposite
              in="SourceGraphic"
              in2="specClip"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lit"
            />
            <feDropShadow dx="0" dy="26" stdDeviation="26" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        <g ref={floatRef} filter="url(#lotus-gloss)">
          {LOTUS_PETALS.map((p, i) => (
            <g
              key={p.id}
              ref={(el) => {
                petalRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              <path d={p.path} fill={`url(#lotus-${p.id})`} />
              {/* the figure's floating dot rides its own group, so it fans,
                  fades and settles with its petal */}
              {p.dot && (
                <circle cx={p.dot.cx} cy={p.dot.cy} r={p.dot.r} fill={`url(#lotus-${p.id})`} />
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};
