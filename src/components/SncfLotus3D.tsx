import React, { useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { LOTUS_ASPECT, LOTUS_PETALS, LOTUS_VIEWBOX } from './lotusPetalPaths';
import { PILLARS } from '../data/pillars';
import { DEVOTIONAL_ACCENT } from './DevotionalPhotoCard';

/**
 * The SNCF lotus, extruded and lit, assembling as the screen scrolls.
 *
 * The geometry is the foundation seal's own (see lotusPetalPaths.ts), drawn
 * about the flower's base at the origin — which is the point every petal
 * unfolds around.
 *
 * THE COLOURS are the hero cards': each petal is named for a card and wears
 * that card's two accents, read from PILLARS and DEVOTIONAL_ACCENT rather
 * than copied, so a card's palette and its petal cannot drift apart. The
 * light accent lights the top face, the deep one grounds it, and the side
 * walls and rim are shaded and tinted from the same pair.
 *
 * THE RELIEF is real: each petal is stacked DEPTH_STEPS times behind itself
 * in darkening ink to build a side wall, and the whole petal passes through
 * one specular-lighting filter so a single light falls across the flower.
 *
 * THE ASSEMBLY is scroll-driven and runs left to right, one petal at a time:
 * each starts folded upright at the base, invisible, and swings out to its
 * bearing through its own window. The windows do not overlap, so a petal has
 * finished before the next moves.
 *
 * NOTHING RUNS ON A CLOCK. Progress arrives through the imperative handle,
 * the loop damps towards it and stops on arrival, and the DOM is written
 * directly through refs — so scrolling never re-renders, and a settled
 * flower schedules no frames at all.
 */

export interface SncfLotus3DHandle {
  /** Drive the assembly. The flower eases towards the value given. */
  updateProgress: (s: number) => void;
}

export interface SncfLotus3DProps {
  /** Optional declarative drive; the handle is the hot-path route. */
  scrollProgress?: number;
  activePillarId?: string | null;
  /** Largest width the flower may take; it scales down to fit. */
  maxWidth?: number;
  className?: string;
}

/* ---------------- colour helpers ---------------- */
const hex2rgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgb2hex = (c: number[]) =>
  '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h: string, f: number) => rgb2hex(hex2rgb(h).map((v) => v * f));
const tint = (h: string, f: number) => rgb2hex(hex2rgb(h).map((v) => v + (255 - v) * f));
const mix = (a: string, b: string, t: number) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t));
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Gentle overshoot for the landing (ease-out-back, ~1.08 max) */
const easeOutBack = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c1 = 1.12;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Petal id -> the hero card's [deep, light] accents. welcome takes the
    devotional portrait's pair, the other four their pillar's. */
const PETAL_TONES: Record<string, [string, string]> = {
  welcome: [DEVOTIONAL_ACCENT.a, DEVOTIONAL_ACCENT.b],
  ...Object.fromEntries(PILLARS.map((p) => [p.id, [p.accentA, p.accentB]])),
};
const toneOf = (id: string) => PETAL_TONES[id] ?? ['#1f8a5c', '#6fd19a'];

/** depth of the extruded edge, in user units */
const DEPTH_STEPS = 4;
const DEPTH_DX = 0.85;
const DEPTH_DY = 1.15;

/** how far a folded petal is tucked back towards the base, in user units */
const BACK_NUDGE = 14;

export const SncfLotus3D = forwardRef<SncfLotus3DHandle, SncfLotus3DProps>(({
  scrollProgress,
  activePillarId,
  maxWidth = 620,
  className,
}, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const shadowRef = useRef<SVGEllipseElement | null>(null);
  const petalRefs = useRef<Record<string, SVGGElement | null>>({});

  const smoothRef = useRef(scrollProgress ?? 0);
  const targetRef = useRef(scrollProgress ?? 0);
  const rafRef = useRef<number | null>(null);

  /* Write straight to the DOM — no React state on the scroll path. */
  const updateDOM = (s: number) => {
    if (svgRef.current) {
      svgRef.current.style.transform = `rotateX(${lerp(12, 4, easeOut(s)).toFixed(2)}deg)`;
    }
    if (shadowRef.current) {
      shadowRef.current.setAttribute('rx', lerp(40, 150, easeOut(s)).toFixed(1));
      shadowRef.current.setAttribute('ry', lerp(6, 16, easeOut(s)).toFixed(1));
    }

    let maxSnap = 0;

    for (const p of LOTUS_PETALS) {
      const el = petalRefs.current[p.id];
      if (!el) continue;

      const [w0, w1] = p.window;
      const raw = clamp01((s - w0) / (w1 - w0));

      if (raw >= 0.8 && raw <= 1) {
        const snap = Math.sin(((raw - 0.8) / 0.2) * Math.PI);
        if (snap > maxSnap) maxSnap = snap;
      }

      /* Folded means upright: the petal's own bearing rotated back to
         straight up, tucked towards the base and squeezed thin. */
      const natural = (Math.atan2(p.dir.y, p.dir.x) * 180) / Math.PI;
      const eased = easeOutBack(raw);
      const fold = (-90 - natural) * (1 - eased);
      const sx = lerp(0.45, 1, eased);
      const sy = lerp(0.62, 1, eased);
      const tx = p.dir.x * (1 - eased) * -BACK_NUDGE;
      const ty = p.dir.y * (1 - eased) * -BACK_NUDGE;

      el.style.transform =
        `rotate(${fold.toFixed(2)}deg) translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) ` +
        `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      el.style.opacity = clamp01(eased / 0.35).toFixed(3);
    }

    /* The radiance behind the flower rides the page's live accent, so it
       warms whichever screen colour the hero is publishing rather than
       fighting it. */
    const g = Math.pow(clamp01(s), 2.4);
    if (glowRef.current) {
      glowRef.current.setAttribute('r', lerp(40, 210, g).toFixed(1));
      glowRef.current.setAttribute('opacity', clamp01(lerp(0.03, 0.5, g) + maxSnap * 0.08).toFixed(3));
    }
  };

  /* One damped loop, shared by the handle and the optional prop. It stops
     as soon as it lands, so an idle flower costs nothing. */
  const pump = () => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const diff = targetRef.current - smoothRef.current;
      if (Math.abs(diff) > 0.0005) {
        smoothRef.current += diff * 0.18;
        updateDOM(smoothRef.current);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        smoothRef.current = targetRef.current;
        updateDOM(smoothRef.current);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    updateProgress: (s: number) => {
      targetRef.current = clamp01(s);
      pump();
    },
  }), []);

  useEffect(() => {
    if (scrollProgress === undefined) return;
    targetRef.current = clamp01(scrollProgress);
    pump();
  }, [scrollProgress]);

  useEffect(() => {
    /* Without motion the flower is simply assembled, and the loop that would
       have carried it there never starts. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      smoothRef.current = 1;
      targetRef.current = 1;
      updateDOM(1);
      return;
    }
    updateDOM(smoothRef.current);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const tones = useMemo(
    () => Object.fromEntries(LOTUS_PETALS.map((p) => [p.id, toneOf(p.id)])),
    [],
  );

  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth,
        aspectRatio: LOTUS_ASPECT,
        perspective: 900,
        perspectiveOrigin: '50% 62%',
      }}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        viewBox={LOTUS_VIEWBOX}
        width="100%"
        height="100%"
        style={{ overflow: 'visible', transformStyle: 'preserve-3d' }}
      >
        <defs>
          {/* Lit-surface bevel — one light for the whole petal */}
          <filter id="lotusBevel" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b" />
            <feSpecularLighting
              in="b"
              surfaceScale="5.5"
              specularConstant="0.95"
              specularExponent="19"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="-300" y="-420" z="270" />
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
            />
          </filter>

          <filter id="lotusCast" x="-40%" y="-40%" width="180%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" />
            <feOffset dy="14" result="o" />
            <feComponentTransfer in="o">
              <feFuncA type="linear" slope="0.42" />
            </feComponentTransfer>
          </filter>

          <filter id="glowBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>

          {LOTUS_PETALS.map((p) => {
            const [deep, light] = tones[p.id];
            const [top, bottom] = p.span;
            return (
              <React.Fragment key={p.id}>
                <linearGradient id={`lg-${p.id}`} x1="18%" y1="0%" x2="86%" y2="100%">
                  <stop offset="0%" stopColor={tint(light, 0.34)} />
                  <stop offset="46%" stopColor={light} />
                  <stop offset="100%" stopColor={deep} />
                </linearGradient>
                {/* The same ink, pinned to the petal's own height in user
                    space: a dot drawn with it takes the tone its petal has
                    at the height it floats, instead of squeezing the whole
                    ramp into a bead and reading as another colour. */}
                <linearGradient
                  id={`lg-${p.id}-dot`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1={bottom}
                  x2="0"
                  y2={top}
                >
                  <stop offset="0%" stopColor={deep} />
                  <stop offset="54%" stopColor={light} />
                  <stop offset="100%" stopColor={tint(light, 0.34)} />
                </linearGradient>
              </React.Fragment>
            );
          })}

          <radialGradient id="lotusAmbientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-b, #6fd19a)" stopOpacity="0.95" />
            <stop offset="38%" stopColor="var(--accent-b, #6fd19a)" stopOpacity="0.55" />
            <stop offset="72%" stopColor="var(--accent-a, #1f8a5c)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-a, #1f8a5c)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* radiance behind the flower */}
        <circle
          ref={glowRef}
          cx="0"
          cy="-70"
          r="40"
          fill="url(#lotusAmbientGlow)"
          opacity="0.03"
          filter="url(#glowBlur)"
          style={{ pointerEvents: 'none' }}
        />

        {/* ground shadow */}
        <ellipse
          ref={shadowRef}
          cx="0"
          cy="62"
          rx="40"
          ry="6"
          fill="#000"
          opacity={0.32}
          filter="url(#lotusCast)"
        />

        {/* petals, painted back to front */}
        {LOTUS_PETALS.map((p) => {
          const [deep, light] = tones[p.id];
          const wall = shade(deep, 0.45);
          const isActive = activePillarId === p.id;

          return (
            <g
              key={p.id}
              ref={(el) => {
                petalRefs.current[p.id] = el;
              }}
              style={{
                willChange: 'transform, opacity',
                transformOrigin: '0px 0px',
                opacity: 0,
              }}
            >
              <g filter="url(#lotusBevel)">
                {/* extruded side walls */}
                {Array.from({ length: DEPTH_STEPS }).map((_, i) => {
                  const k = DEPTH_STEPS - i;
                  return (
                    <path
                      key={i}
                      d={p.d}
                      fill={mix(wall, shade(deep, 0.62), i / DEPTH_STEPS)}
                      transform={`translate(${(DEPTH_DX * k).toFixed(2)} ${(DEPTH_DY * k).toFixed(2)})`}
                    />
                  );
                })}

                {/* lit top face */}
                <path d={p.d} fill={`url(#lg-${p.id})`} />

                {/* the head this figure carries in the seal */}
                {p.dot && (
                  <g>
                    <circle
                      cx={p.dot.x + DEPTH_DX * DEPTH_STEPS}
                      cy={p.dot.y + DEPTH_DY * DEPTH_STEPS}
                      r={p.dot.r}
                      fill={shade(deep, 0.5)}
                    />
                    <circle cx={p.dot.x} cy={p.dot.y} r={p.dot.r} fill={`url(#lg-${p.id}-dot)`} />
                  </g>
                )}
              </g>

              {/* rim light along the upper edge */}
              <path
                d={p.d}
                fill="none"
                stroke={tint(light, 0.55)}
                strokeWidth={1.2}
                opacity={0.32 + (isActive ? 0.4 : 0)}
                transform="translate(-0.8 -1.1)"
              />

              {isActive && (
                <path
                  d={p.d}
                  fill="none"
                  stroke={tint(light, 0.6)}
                  strokeWidth={5}
                  opacity={0.3}
                  style={{ filter: 'blur(5px)' }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

SncfLotus3D.displayName = 'SncfLotus3D';
