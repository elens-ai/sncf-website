import React, { useEffect, useRef } from 'react';

/**
 * The SNCF lotus, glossy and three-dimensional, unfolding on scroll.
 *
 * Five petals and their five dots, coloured as the site's own moods —
 * welcome rose, Heal green, Enrich blue at the CENTRE, Empower pink,
 * Projects cyan — so the flower literally is the site's palette fanned out.
 *
 * THE GLOSS is real SVG lighting, not a painted highlight: a specular pass
 * (feSpecularLighting + fePointLight) over the blurred alpha of the whole
 * group, clipped back to the petals with feComposite and added onto the
 * gradient-filled shapes, then dropped onto the page with feDropShadow. The
 * filter lives on the GROUP, not per petal, so one consistent light falls
 * across the flower the way it does on the reference render.
 *
 * THE UNFOLD is scroll-driven: at progress 0 only the centre petal stands
 * (the outer four hide behind its silhouette — scaled to 0.45×0.62, upright,
 * nudged backwards, invisible); each outer petal then enters through its own
 * overlapping window with easeOutBack, fading in over the first 35% of the
 * window while it rotates about the flower's BASE (the origin) out to its
 * resting angle, the backwards nudge decaying to zero. Inner pair first,
 * outer pair after — a fan opening from behind the centre.
 *
 * THE LEVITATION is time-driven and independent: a slow sine bob (~10px over
 * ~5s) with a ±1.5deg sway, computed from performance.now() in the same
 * requestAnimationFrame loop.
 *
 * No animation libraries. No React state in the hot path — the loop writes
 * transform/opacity straight onto the nodes through refs, and reads its own
 * scroll progress from getBoundingClientRect, so scrolling never re-renders
 * the component. Under prefers-reduced-motion the flower renders fully open
 * and still, and the loop never starts.
 */

/* One petal, drawn UPRIGHT with its base at the origin — every instance is
   this path rotated about (0,0), which is what makes the unfold pivot at the
   flower's base. Swap in bespoke vectors here if the logo's exact petal
   outlines become available. */
const PETAL_D =
  'M-38 0 C -48 -66 -32 -130 0 -158 C 27 -135 38 -95 33 -54 ' +
  'L 24 -47 C 27 -88 17 -118 0 -134 C -17 -114 -26 -66 -23 -4 Z';

interface PetalSpec {
  id: string;
  /** Resting rotation about the base, degrees. 0 = the centre petal. */
  rest: number;
  /** Mirror the petal's asymmetry for the right-hand side. */
  mirror: boolean;
  /** [start, end] window of scrollProgress this petal blooms in. */
  window: [number, number];
  /** Gradient stops: [dark base, light tip]. */
  colors: [string, string];
}

/* The bloom runs LEFT TO RIGHT, one petal after another — welcome first,
   projects last — each window overlapping the next so the flower opens as a
   wave rather than a queue of separate entrances. The centre is simply the
   third petal in that wave (it still paints LAST, on top). */
const PETALS: PetalSpec[] = [
  { id: 'welcome', rest: -64, mirror: false, window: [0.05, 0.35], colors: ['#7d3f66', '#c98ab2'] },
  { id: 'heal', rest: -33, mirror: false, window: [0.2, 0.5], colors: ['#1f8a5c', '#6fd19a'] },
  { id: 'empower', rest: 33, mirror: true, window: [0.5, 0.8], colors: ['#c2185b', '#f48fb1'] },
  { id: 'projects', rest: 64, mirror: true, window: [0.65, 0.95], colors: ['#0d6a8c', '#6ac8ed'] },
  { id: 'enrich', rest: 0, mirror: false, window: [0.35, 0.65], colors: ['#1565c0', '#64b5f6'] },
];

const HIDDEN_SCALE_X = 0.45;
const HIDDEN_SCALE_Y = 0.62;
const BACK_NUDGE = 18;

const easeOutBack = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface SncfLotus3DProps {
  /** Optional external drive; when omitted the component reads its own
      position in the viewport each frame. */
  scrollProgress?: number;
  className?: string;
}

export const SncfLotus3D: React.FC<SncfLotus3DProps> = ({ scrollProgress, className }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const floatRef = useRef<SVGGElement | null>(null);
  const petalRefs = useRef<(SVGGElement | null)[]>([]);
  const progressProp = useRef<number | undefined>(scrollProgress);
  progressProp.current = scrollProgress;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pose = (progress: number, floatY: number, sway: number) => {
      if (floatRef.current) {
        floatRef.current.setAttribute(
          'transform',
          `translate(200 268) translate(0 ${floatY.toFixed(2)}) rotate(${sway.toFixed(3)})`,
        );
      }
      PETALS.forEach((petal, i) => {
        const node = petalRefs.current[i];
        if (!node) return;
        const mirror = petal.mirror ? -1 : 1;
        const [w0, w1] = petal.window as [number, number];
        const u = clamp01((progress - w0) / (w1 - w0));
        const e = easeOutBack(u);
        const opacity = clamp01(u / 0.35);
        const rot = petal.rest * e;
        const sx = (HIDDEN_SCALE_X + (1 - HIDDEN_SCALE_X) * e) * mirror;
        const sy = HIDDEN_SCALE_Y + (1 - HIDDEN_SCALE_Y) * e;
        const back = BACK_NUDGE * (1 - e);
        /* rotate first so the translate/scale happen in petal space, and the
           pivot stays at the flower's base. */
        node.setAttribute(
          'transform',
          `rotate(${rot.toFixed(2)}) translate(0 ${back.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`,
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
        const el = wrapRef.current;
        if (el) {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          /* 0 while still below the fold, 1 shortly before it settles. */
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
      <svg viewBox="0 0 400 300" className="w-full h-auto block overflow-visible">
        <defs>
          {PETALS.map((p) => (
            <linearGradient key={p.id} id={`lotus-${p.id}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={p.colors[0]} />
              <stop offset="1" stopColor={p.colors[1]} />
            </linearGradient>
          ))}
          {/* The glossy plastic: specular light over the group's alpha,
              clipped to the shapes, added onto the gradients, then given
              depth with a soft drop shadow. */}
          <filter id="lotus-gloss" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="5"
              specularConstant="0.85"
              specularExponent="16"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="140" y="-40" z="240" />
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
            <feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        <g ref={floatRef} filter="url(#lotus-gloss)">
          {PETALS.map((p, i) => (
            <g
              key={p.id}
              ref={(el) => {
                petalRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              <path d={PETAL_D} fill={`url(#lotus-${p.id})`} />
              {/* the petal's floating dot rides its own group, so it fans,
                  fades and settles with its petal */}
              <circle cx="7" cy="-180" r="12" fill={`url(#lotus-${p.id})`} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};
