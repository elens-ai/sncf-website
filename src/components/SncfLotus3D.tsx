import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  LOGO_ASPECT,
  LOGO_BASE,
  LOGO_DISC,
  LOGO_HAND,
  LOGO_PETALS,
  LOGO_VIEWBOX,
} from './logoShapes';

/**
 * The SNCF seal, assembling as the screen scrolls.
 *
 * THE ART IS THE LOGO'S OWN — the foundation's vector file, grouped by
 * logoShapes.ts into a hand and five petals so each can be moved. Every
 * outline and every colour comes from that file, gradients and all; nothing
 * here is traced, matched by eye, or repainted. What this component adds is
 * relief and motion.
 *
 * THE ART IS ALSO CLEANED UP on the way through. The file is itself an
 * auto-trace: its outlines carry a pixel staircase and its gradients are cut
 * into bands that meet in hairline seams — both plainly visible at the size
 * this is drawn, worst across the broad palm. So each group passes through a
 * filter that blurs the colour and re-clips it to a blurred, re-sharpened
 * alpha: the seams melt, the staircase goes, and the silhouette stays crisp.
 *
 * THE RELIEF is real SVG lighting on top of that: a specular pass
 * (feSpecularLighting + fePointLight) over the same smoothed alpha, so one
 * light falls across the whole petal rather than across each of its bands. A
 * soft cast shadow sits under the hand, and the emblem tilts from 15 to 4
 * degrees as it opens — on a wrapper layer of its own, so the turn costs a
 * composite rather than a re-render of every filter inside it.
 *
 * THE DISC CLOSES IT. Once the last petal has landed, the seal's white
 * circle grows in behind the flower — sized to the flower, so the palm still
 * carries it the way the hand carries the circle in the seal.
 *
 * THEN THE LIGHT GOES OUT. Each petal throws a beam of its own ink from the
 * flower's base to the edge of the screen, the wedges meeting halfway between
 * neighbouring petals so the whole screen is divided between the verticals —
 * a lighthouse turning its lamp on. The beams are drawn in the emblem's own
 * coordinates and simply run past the viewBox (the svg does not clip), which
 * is why they stay anchored to the flower at any size. They screen onto the
 * page rather than painting over it, and carry a wide blur so the seams
 * between wedges read as light rather than as cut paper — which is also why
 * only their opacity animates, since scaling a blurred layer would re-render
 * that blur on every frame.
 *
 * THE BLOOM runs left to right, one petal at a time. The hand arrives first
 * — the flower has to open out of something. Each petal is then wound back
 * anticlockwise of where it belongs, small and tucked into the base, and
 * swings clockwise into place as it grows and fades in: every petal turning
 * the same way, so the whole reads as one opening gesture travelling across
 * the screen rather than five separate entrances.
 *
 * ONLY TRANSFORM AND OPACITY MOVE. Every filter in here is expensive — two
 * blurs, a specular pass and a shadow per group — and a filter re-renders
 * whenever the geometry it is drawn from changes. So the glow and the ground
 * shadow keep a fixed radius and are scaled by transform instead of having
 * their radii rewritten each frame, and the tilt turns a promoted wrapper
 * rather than the <svg> itself. That is the difference between a bloom that
 * plays and one that stutters.
 *
 * NOTHING RUNS ON A CLOCK. Progress arrives through the imperative handle,
 * the loop eases towards it and stops on arrival, and the DOM is written
 * directly through refs — so scrolling never re-renders, and a settled
 * emblem schedules no frames at all. The easing is measured in SECONDS, not
 * frames: a fixed fraction per frame runs at whatever rate the display
 * happens to tick at, which is the difference between film and flicker on a
 * 120Hz screen or a throttled tab.
 */

export interface SncfLotus3DHandle {
  /** Drive the assembly. The emblem eases towards the value given. */
  updateProgress: (s: number) => void;
}

export interface SncfLotus3DProps {
  /** Optional declarative drive; the handle is the hot-path route. */
  scrollProgress?: number;
  activePillarId?: string | null;
  /** Largest width the emblem may take; it scales down to fit. */
  maxWidth?: number;
  className?: string;
}

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

/** When the white disc grows in — after the last petal has landed. */
const DISC_WINDOW: [number, number] = [0.88, 0.97];
/** When the beams sweep out, just behind the disc. */
const BEAM_WINDOW: [number, number] = [0.9, 1];
/** Far enough past the viewBox to leave any screen. */
const BEAM_REACH = 1600;

/** One wedge per petal, meeting its neighbours halfway. The petals only fan
    across the top, so the two outermost split the whole lower half between
    them — the screen ends up divided between the five, with each wedge
    starting at the petal whose colour it carries. */
const BEAMS = (() => {
  const bearing = (p: (typeof LOGO_PETALS)[number]) =>
    Math.atan2(p.dir.y, p.dir.x);
  const sorted = [...LOGO_PETALS].sort((a, b) => bearing(a) - bearing(b));
  const angles = sorted.map(bearing);
  const mid = (a: number, b: number) => a + (((b - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / 2;
  return sorted.map((p, i) => {
    const prev = angles[(i - 1 + angles.length) % angles.length];
    const next = angles[(i + 1) % angles.length];
    const from = mid(prev, angles[i]);
    const to = mid(angles[i], next);
    const arc = (((to - from) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const pt = (a: number) =>
      `${(LOGO_BASE.x + Math.cos(a) * BEAM_REACH).toFixed(1)} ` +
      `${(LOGO_BASE.y + Math.sin(a) * BEAM_REACH).toFixed(1)}`;
    return {
      id: p.id,
      tone: p.tone,
      d: `M${LOGO_BASE.x} ${LOGO_BASE.y} L${pt(from)} ` +
         `A${BEAM_REACH} ${BEAM_REACH} 0 ${arc > Math.PI ? 1 : 0} 1 ${pt(to)} Z`,
    };
  });
})();

/** Seconds for the eased value to close ~63% of its gap. Time-based, so the
    motion is identical at 60Hz, 120Hz or a throttled tab. */
const EASE_TAU = 0.16;

/** How far back each petal is wound before it opens, in degrees. Every petal
    winds the SAME way — anticlockwise of its resting bearing — so all of them
    swing clockwise into place; folding each one up to the vertical instead
    sends the left half one way and the right half the other, which reads as
    petals arriving rather than a flower opening. */
const SWEEP_DEG = 88;

/** tucked back towards the base while folded, and the hand's rise, in the
    file's own units */
const BACK_NUDGE = 11;
const HAND_RISE = 16;

/** The seal sets its hand a little below the flower, with the ring's white
    band between them. Closing that gap is what makes the flower read as
    opening OUT of the palm rather than hovering over it. */
const HAND_LIFT = -22;

const PIVOT = `${LOGO_BASE.x}px ${LOGO_BASE.y}px`;

export const SncfLotus3D = forwardRef<SncfLotus3DHandle, SncfLotus3DProps>(({
  scrollProgress,
  activePillarId,
  maxWidth = 620,
  className,
}, ref) => {
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<SVGEllipseElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const handRef = useRef<SVGGElement | null>(null);
  const discRef = useRef<SVGCircleElement | null>(null);
  const beamRef = useRef<SVGGElement | null>(null);
  const petalRefs = useRef<Record<string, SVGGElement | null>>({});

  const smoothRef = useRef(scrollProgress ?? 0);
  const targetRef = useRef(scrollProgress ?? 0);
  const rafRef = useRef<number | null>(null);

  const updateDOM = (s: number) => {
    /* The tilt rides a wrapper of its own rather than the <svg>: turning the
       SVG itself re-rasterises every filter inside it on each frame, while
       turning a promoted layer is just the compositor moving a texture. */
    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${lerp(15, 4, easeOut(s)).toFixed(2)}deg)`;
    }
    if (shadowRef.current) {
      const k = easeOut(s);
      shadowRef.current.style.transform =
        `scale(${lerp(0.34, 1, k).toFixed(3)}, ${lerp(0.4, 1, k).toFixed(3)})`;
      shadowRef.current.style.opacity = lerp(0.1, 0.3, k).toFixed(3);
    }

    if (beamRef.current) {
      const [b0, b1] = BEAM_WINDOW;
      const bu = easeOut(clamp01((s - b0) / (b1 - b0)));
      /* Opacity only. The beams carry a wide blur to soften their seams, and
         scaling a blurred layer would re-render that blur every frame. */
      beamRef.current.style.opacity = (bu * 0.46).toFixed(3);
    }

    if (discRef.current) {
      const [d0, d1] = DISC_WINDOW;
      const du = easeOut(clamp01((s - d0) / (d1 - d0)));
      discRef.current.style.transform = `scale(${lerp(0.82, 1, du).toFixed(3)})`;
      discRef.current.style.opacity = du.toFixed(3);
    }

    /* The hand arrives first: it rises the last of its own travel and
       settles, so the flower has something to open out of. */
    if (handRef.current) {
      const [h0, h1] = LOGO_HAND.window;
      const hu = clamp01((s - h0) / (h1 - h0));
      const he = easeOutBack(hu);
      handRef.current.style.transform =
        `translate(0px, ${(HAND_LIFT + HAND_RISE * (1 - he)).toFixed(2)}px) ` +
        `scale(${lerp(0.9, 1, he).toFixed(3)})`;
      handRef.current.style.opacity = clamp01(hu / 0.4).toFixed(3);
    }

    let maxSnap = 0;

    for (const p of LOGO_PETALS) {
      const el = petalRefs.current[p.id];
      if (!el) continue;

      const [w0, w1] = p.window;
      const raw = clamp01((s - w0) / (w1 - w0));
      if (raw >= 0.8 && raw <= 1) {
        const snap = Math.sin(((raw - 0.8) / 0.2) * Math.PI);
        if (snap > maxSnap) maxSnap = snap;
      }

      /* Wound back anticlockwise, then swung clockwise home. */
      const eased = easeOutBack(raw);
      const fold = -SWEEP_DEG * (1 - eased);
      const sx = lerp(0.28, 1, eased);
      const sy = lerp(0.46, 1, eased);
      const tx = p.dir.x * (1 - eased) * -BACK_NUDGE;
      const ty = p.dir.y * (1 - eased) * -BACK_NUDGE;

      el.style.transform =
        `rotate(${fold.toFixed(2)}deg) translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) ` +
        `scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      /* Faded up over the first fifth of the swing rather than the first
         third, so the petal is visible for most of its travel instead of
         arriving already half-open. */
      el.style.opacity = clamp01(eased / 0.2).toFixed(3);
    }

    /* The radiance behind the emblem rides the page's live accent, so it
       warms whichever screen colour the hero is publishing. */
    const g = Math.pow(clamp01(s), 2.4);
    if (glowRef.current) {
      glowRef.current.style.transform = `scale(${lerp(0.2, 1, g).toFixed(3)})`;
      glowRef.current.style.opacity =
        clamp01(lerp(0.03, 0.45, g) + maxSnap * 0.08).toFixed(3);
    }
  };

  const pump = () => {
    if (rafRef.current !== null) return;
    let last = performance.now();
    const tick = (now: number) => {
      /* dt is clamped so a tab that was throttled or backgrounded resumes
         smoothly instead of teleporting on its first frame back. */
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const diff = targetRef.current - smoothRef.current;
      if (Math.abs(diff) > 0.0004) {
        smoothRef.current += diff * (1 - Math.exp(-dt / EASE_TAU));
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
    /* Without motion the emblem is simply assembled, and the loop that would
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

  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth,
        aspectRatio: LOGO_ASPECT,
        perspective: 900,
        perspectiveOrigin: '50% 62%',
      }}
      aria-hidden="true"
    >
      <div
        ref={tiltRef}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(15deg)',
          willChange: 'transform',
        }}
      >
      <svg
        viewBox={LOGO_VIEWBOX}
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Lit surface: one light across a whole group, not across each of
              its gradient bands. */}
          {/* Smooth, then light. feGaussianBlur on the colour melts the
              band seams; blurring the alpha and steepening it back with
              feComponentTransfer smooths the traced staircase without
              softening the silhouette, and the specular is taken from that
              same cleaned alpha so the highlight follows the shape rather
              than the trace's wobble. */}
          <filter id="logoBevel" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="soft" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="ab" />
            <feComponentTransfer in="ab" result="mask">
              <feFuncA type="linear" slope="18" intercept="-8" />
            </feComponentTransfer>
            <feComposite in="soft" in2="mask" operator="in" result="art" />
            <feGaussianBlur in="mask" stdDeviation="2.6" result="b" />
            <feSpecularLighting
              in="b"
              surfaceScale="3.2"
              specularConstant="0.62"
              specularExponent="22"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="-160" y="-220" z="160" />
            </feSpecularLighting>
            <feComposite in="spec" in2="mask" operator="in" result="specClip" />
            <feComposite
              in="art"
              in2="specClip"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lit"
            />
            {/* a soft contact shadow, cheap enough to keep on every petal */}
            <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#000" floodOpacity="0.3" />
          </filter>

          {/* the palm is one broad surface: its banding is the coarsest and
              its light the gentlest, or the magenta washes out to pale */}
          <filter id="logoBevelSoft" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="soft" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.1" result="ab" />
            <feComponentTransfer in="ab" result="mask">
              <feFuncA type="linear" slope="20" intercept="-9" />
            </feComponentTransfer>
            <feComposite in="soft" in2="mask" operator="in" result="art" />
            <feGaussianBlur in="mask" stdDeviation="3.4" result="b" />
            <feSpecularLighting
              in="b"
              surfaceScale="2.4"
              specularConstant="0.34"
              specularExponent="26"
              lightingColor="#ffffff"
              result="spec"
            >
              <fePointLight x="-160" y="-240" z="190" />
            </feSpecularLighting>
            <feComposite in="spec" in2="mask" operator="in" result="specClip" />
            <feComposite
              in="art"
              in2="specClip"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
            />
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.3" />
          </filter>

          <filter id="logoCast" x="-40%" y="-40%" width="180%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dy="8" result="o" />
            <feComponentTransfer in="o">
              <feFuncA type="linear" slope="0.42" />
            </feComponentTransfer>
          </filter>

          <filter id="logoGlowBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" />
          </filter>

          <radialGradient id="logoAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-b, #6fd19a)" stopOpacity="0.9" />
            <stop offset="38%" stopColor="var(--accent-b, #6fd19a)" stopOpacity="0.5" />
            <stop offset="72%" stopColor="var(--accent-a, #1f8a5c)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent-a, #1f8a5c)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          ref={glowRef}
          cx={LOGO_BASE.x}
          cy={LOGO_DISC.cy}
          r="230"
          fill="url(#logoAmbient)"
          filter="url(#logoGlowBlur)"
          style={{
            pointerEvents: 'none',
            opacity: 0.03,
            transform: 'scale(0.2)',
            transformOrigin: `${LOGO_DISC.cx}px ${LOGO_DISC.cy}px`,
            willChange: 'transform, opacity',
          }}
        />

        {/* the lamp: one wedge of light per petal, out past the frame */}
        <g
          ref={beamRef}
          style={{
            opacity: 0,
            /* the seams between wedges are hard edges; light has none */
            filter: 'blur(13px)',
            mixBlendMode: 'screen',
            willChange: 'opacity',
            pointerEvents: 'none',
          }}
        >
          <defs>
            {BEAMS.map((b) => (
              <radialGradient
                key={b.id}
                id={`beam-${b.id}`}
                gradientUnits="userSpaceOnUse"
                cx={LOGO_BASE.x}
                cy={LOGO_BASE.y}
                r={BEAM_REACH}
              >
                <stop offset="0%" stopColor={b.tone} stopOpacity="0.85" />
                <stop offset="14%" stopColor={b.tone} stopOpacity="0.5" />
                <stop offset="55%" stopColor={b.tone} stopOpacity="0.12" />
                <stop offset="100%" stopColor={b.tone} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>
          {BEAMS.map((b) => (
            <path key={b.id} d={b.d} fill={`url(#beam-${b.id})`} />
          ))}
        </g>

        {/* the seal's white circle, closing the emblem */}
        <circle
          ref={discRef}
          cx={LOGO_DISC.cx}
          cy={LOGO_DISC.cy}
          r={LOGO_DISC.r}
          fill="#ffffff"
          style={{
            opacity: 0,
            transform: 'scale(0.82)',
            transformOrigin: `${LOGO_DISC.cx}px ${LOGO_DISC.cy}px`,
            willChange: 'transform, opacity',
          }}
        />

        <ellipse
          ref={shadowRef}
          cx={LOGO_BASE.x}
          cy={LOGO_BASE.y + 118}
          rx="128"
          ry="11"
          fill="#000"
          filter="url(#logoCast)"
          style={{
            opacity: 0.1,
            transform: 'scale(0.34, 0.4)',
            transformOrigin: `${LOGO_BASE.x}px ${LOGO_BASE.y + 118}px`,
            willChange: 'transform, opacity',
          }}
        />

        {/* the hand, under everything the flower does */}
        <g
          ref={handRef}
          style={{ willChange: 'transform, opacity', transformOrigin: PIVOT, opacity: 0 }}
        >
          <g filter="url(#logoBevelSoft)">
            {LOGO_HAND.palm.map((sh, i) => (
              <path key={i} d={sh.d} fill={sh.fill} />
            ))}
          </g>
          <g filter="url(#logoBevelSoft)">
            {LOGO_HAND.curl.map((sh, i) => (
              <path key={i} d={sh.d} fill={sh.fill} />
            ))}
          </g>
        </g>

        {/* petals, painted back to front */}
        {LOGO_PETALS.map((p) => (
          <g
            key={p.id}
            ref={(el) => {
              petalRefs.current[p.id] = el;
            }}
            style={{
              willChange: 'transform, opacity',
              transformOrigin: PIVOT,
              opacity: 0,
              filter: activePillarId === p.id ? 'brightness(1.08)' : undefined,
            }}
          >
            <g filter="url(#logoBevel)">
              {p.shapes.map((sh, i) => (
                <path key={i} d={sh.d} fill={sh.fill} />
              ))}
            </g>
          </g>
        ))}
      </svg>
      </div>
    </div>
  );
});

SncfLotus3D.displayName = 'SncfLotus3D';
