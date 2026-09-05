import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  LOGO_ASPECT,
  LOGO_BASE,
  LOGO_DISC,
  LOGO_PETALS,
  LOGO_VIEWBOX,
} from './logoShapes';
import { PETAL_ART, PALM_ART } from './petalArt';

/** Looked up by id at render time — see petalArt.ts for why the flower is
    raster now, and what that traded away. */
const PETAL_ART_BY_ID: Record<string, (typeof PETAL_ART)[number]> = Object.fromEntries(
  PETAL_ART.map((a) => [a.id, a]),
);

/** THE GLOW IS CUT OFF AT THE PALM, and this is the box its fade is measured
    in — the glow circle's own extent (r 230 plus room for its 16-unit blur),
    centred like the circle itself. */
const GLOW_BOX = { x: LOGO_BASE.x - 260, y: LOGO_DISC.cy - 260, w: 520, h: 520 };
/** Where that fade starts and finishes, as fractions of GLOW_BOX — derived
    from the palm's own top edge rather than hardcoded, so it follows the
    artwork if the palm is ever replaced again. Full strength until a little
    above the hand, gone by just inside its top edge: the light reads as
    coming from the moon the hand is holding, not from behind the hand. */
const GLOW_FADE_FROM = (PALM_ART.y - 34 - GLOW_BOX.y) / GLOW_BOX.h;
const GLOW_FADE_TO = (PALM_ART.y + 6 - GLOW_BOX.y) / GLOW_BOX.h;
/** Spread onto both the mask and its rect — SVG wants x/y/width/height, not
    the w/h the box is defined with. */
const GLOW_BOX_ATTRS = {
  x: GLOW_BOX.x,
  y: GLOW_BOX.y,
  width: GLOW_BOX.w,
  height: GLOW_BOX.h,
};

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
 * THE DISC OPENS IT, AND THE DISC IS A WORLD. The seal's white circle grows
 * in behind the flower FIRST, straight after the palm and before any petal —
 * sized to the flower, so the palm still carries it the way the hand carries
 * the circle in the seal. It is the ground the flower is then built on.
 *
 * It is shaded as a sphere rather than filled flat: lit from the upper left
 * where the emblem's own light already is, darkened at the limb, wrapped in
 * an atmosphere that takes the colour of whichever vertical is showing, and
 * crossed by a meridian grid that turns as the page is scrubbed. It stays
 * white, because the flower has to read against it — the roundness is
 * carried by the rim and the grid, not by tinting the disc. What the emblem
 * says with it is the whole point: a flower opening out of a world, held.
 *
 * THE BLOOM runs left to right, one petal at a time, out of a palm that is
 * already standing: the hand rises as the SECTION arrives rather than on the
 * scrub, so the screen never belongs to this section without it. Each petal is then wound back
 *
 * THE BLOOM runs left to right, one petal at a time, out of a palm that is
 * already standing: the hand rises as the SECTION arrives rather than on the
 * scrub, so the screen never belongs to this section without it. Each petal is then wound back
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
  /** Drive the assembly. The emblem eases towards the value given.
      `entry` is how far the section has taken the viewport (0..1) — the hand
      rides that rather than the scrub, so it is already standing by the time
      the screen belongs to this section. */
  updateProgress: (s: number, entry?: number) => void;
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

/** When the moon grows in — ON THE SCRUB now, and late enough to be BORN
    from the landing: the flower's five dots consolidate and descend into
    the palm across scrub 0.01..0.048 (HallEntrance), handing the sprite off
    over 0.046..0.054 — and this window opens after ALL of that, at 0.055:
    the head lands, is briefly just a small white seed sitting in the palm,
    and THEN the world grows out of it. Opening at 0.048 (where this sat)
    started the growth on the exact frame of contact, with no beat between
    arrival and expansion, so the two read as one blur; opening under the
    descent — where it sat before that — was worse still, a glowing sphere
    already waiting in the palm while the head was visibly still in the air.
    The landing has to be the event — and the ORDER of the handover is the
    event's grammar: the disc is born the instant the head touches the palm
    (0.046, the same beat the orbit's `land` used to start), grows out from
    under it while the head still sits there solid, and only once the world
    has clearly outgrown its seed does the head fade away behind it (see
    HallEntrance's `land`, 0.058-0.07). Grow-then-hide; the reverse read as
    the head vanishing and a globe appearing in its place. It rode `entry`
    before, when
    the moon had to pre-exist for a whole seal to sink into; nothing
    pre-exists now — the emblem is assembled on stage, piece by piece, and
    every piece arrives from somewhere the reader watched. */
const DISC_WINDOW_SCRUB: [number, number] = [0.046, 0.086];

/** When the palm rises, on the APPROACH.

    Ordered ahead of the disc (see DISC_WINDOW_SCRUB) so the palm stands first: the disc
    is the seal's ground and sits IN the hand, so a disc arriving first would
    hang unsupported for a beat. Palm, then moon, then the petals that merge
    into it. */
const HAND_WINDOW_ENTRY: [number, number] = [0.3, 0.62];
/** The globe's grid. Parallels are placed as a fraction of the radius and
    drawn as straight chords, because an untilted globe's parallels ARE
    straight in silhouette; the curvature you read comes from the meridians
    and the limb, not from bending these. */
const EARTH_PARALLELS = [-0.66, -0.36, 0, 0.36, 0.66];
const EARTH_MERIDIANS = 5;

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

/** How far back each petal is wound before it swings home, keyed by id.

    EACH PETAL COMES OUT FROM BEHIND THE ONE BEFORE IT. Rather than winding
    every petal back by the same fixed angle, each is wound back to where its
    PREDECESSOR IN THE BLOOM ORDER rests, so it starts the swing sitting over
    that petal and emerges out of it. The bearings run monotonically left to
    right (-169, -139, -64, -55, +5), which is what makes this work at all:
    each petal's predecessor is always the one immediately anticlockwise of
    it, so winding back is always winding back INTO the flower.

    Clamped, because the raw gaps are wildly uneven — 8.8 degrees between
    empower and enrich against 74.7 between enrich and heal. Unclamped, the
    close pairs would barely travel and their emergence would not read at
    all, while the far ones would swing in from somewhere off the bloom.
    The floor is what guarantees every petal gets a visible swing.

    The first petal has no predecessor and keeps the original full sweep. */
const WIND_BACK_DEG: Record<string, number> = (() => {
  const order = [...LOGO_PETALS].sort((a, b) => a.window[0] - b.window[0]);
  const bearing = (p: (typeof LOGO_PETALS)[number]) =>
    (Math.atan2(p.dir.y, p.dir.x) * 180) / Math.PI;
  const out: Record<string, number> = {};
  order.forEach((p, i) => {
    if (i === 0) {
      out[p.id] = SWEEP_DEG;
      return;
    }
    const gap = bearing(p) - bearing(order[i - 1]);
    out[p.id] = Math.max(34, Math.min(SWEEP_DEG, gap));
  });
  return out;
})();

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
  const discRef = useRef<SVGGElement | null>(null);
  const meridianRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const swayRef = useRef<SVGGElement | null>(null);
  /* Whether the sway is currently ticking, so play-state is written on a
     change rather than every frame. */
  const swayOnRef = useRef<boolean>(false);

  const petalRefs = useRef<Record<string, SVGGElement | null>>({});

  const entryRef = useRef(1);
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

    if (discRef.current) {
      const [d0, d1] = DISC_WINDOW_SCRUB;
      const du = easeOut(clamp01((s - d0) / (d1 - d0)));
      /* STARTS AT THE HEAD'S OWN SIZE. The landing sprite is 34% of the
         disc's radius (HallEntrance sets exactly that), so the world begins
         at 0.34 and grows from there — the seed the reader watched land IS
         the first frame of the moon, not a smaller ghost of it that pops to
         a different size. It was 0.82 when the disc merely faded in behind
         a seal, and 0.5 when this beat was first rewired; both left a step
         at birth.

         Opacity leads the scale a little (cubed against du), so the seed is
         solid from the outset and only its SIZE animates — a sphere that
         fades in while growing reads as an apparition, and this one is
         meant to read as something already there, expanding. */
      discRef.current.style.transform = `scale(${lerp(0.34, 1, du).toFixed(3)})`;
      discRef.current.style.opacity = Math.min(1, du * 3).toFixed(3);

      /* THE WORLD TURNS ON THE SCRUB, not on a clock. A meridian seen from
         the side is an ellipse whose width is the cosine of how far round it
         has gone, so spinning the globe is just rewriting rx: full width
         facing you, zero — a straight line — edge on. Driving it from the
         scroll keeps the whole screen one mechanism, and means the globe is
         still whenever the reader is. */
      const spin = s * Math.PI * 1.15;
      for (let i = 0; i < EARTH_MERIDIANS; i++) {
        const el = meridianRefs.current[i];
        if (!el) continue;
        const rx = Math.abs(Math.cos(spin + (i * Math.PI) / EARTH_MERIDIANS)) * LOGO_DISC.r;
        el.setAttribute('rx', rx.toFixed(2));
      }
    }

    /* THE PALM STANDS DURING THE APPROACH, waiting.

       This has moved twice, and the reason it is back on `entry` is the
       merge. When a whole seal was flying to the corner, a palm already
       waiting there meant two emblems on screen at once, so the palm was
       held back to the threshold. Now what flies is the artwork's own petals
       and they are merging INTO the globe — so the hand and its moon have to
       be there already, holding the thing that will catch them. */
    if (handRef.current) {
      const hp = clamp01(
        (entryRef.current - HAND_WINDOW_ENTRY[0]) / (HAND_WINDOW_ENTRY[1] - HAND_WINDOW_ENTRY[0]),
      );
      const he = easeOutBack(hp);
      /* Reaches full just before the window closes, so it is solid as the
         seal vanishes rather than after it. */
      const hu = clamp01(hp / 0.85);
      handRef.current.style.transform =
        `translate(0px, ${(HAND_LIFT + HAND_RISE * (1 - he)).toFixed(2)}px) ` +
        `scale(${lerp(0.9, 1, he).toFixed(3)})`;
      handRef.current.style.opacity = hu.toFixed(3);
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

      /* Wound back anticlockwise onto the previous petal, then swung
         clockwise home — see WIND_BACK_DEG. */
      const eased = easeOutBack(raw);
      const fold = -WIND_BACK_DEG[p.id] * (1 - eased);
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

    /* THE BLOOM SWAYS ONLY ONCE IT IS WHOLE. The last petal lands at the end
       of its window, and from there to the end of the track the flower is
       complete and simply held — that beat is where the sway lives.

       It rides a WRAPPER, never the petals themselves. The petals' transform
       belongs to the scroll handler above, and an animation on them would
       take it away; rotating their common parent leaves every one of those
       writes intact and sways all five as one piece, which is what keeps
       them in sync — there is no per-petal phase to drift.

       --sway is the amplitude, ramped rather than switched, so the flower
       eases into the motion instead of snapping into it. Play-state is
       written only on a change: at amplitude 0 the animation is a no-op that
       would still tick the compositor every frame for the whole scroll. */
    if (swayRef.current) {
      const lastEnd = Math.max(...LOGO_PETALS.map((p) => p.window[1]));
      const sway = clamp01((s - lastEnd) / (1 - lastEnd));
      swayRef.current.style.setProperty('--sway', sway.toFixed(3));
      const on = sway > 0;
      if (on !== swayOnRef.current) {
        swayOnRef.current = on;
        swayRef.current.style.animationPlayState = on ? 'running' : 'paused';
      }
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
      /* entry moves on its own clock (the section arriving), so a settled
         scrub must still repaint once for it. */
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    updateProgress: (s: number, entry = 1) => {
      targetRef.current = clamp01(s);
      entryRef.current = clamp01(entry);
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
          {/* THE DISC IS A WORLD. It is still the seal's white circle — the
              flower has to read against it — but it is lit and banded as a
              sphere rather than filled flat, so the emblem becomes a flower
              opening out of a world the palm is carrying.

              Everything here is keyed to light from the UPPER LEFT, which is
              where the emblem's own fePointLight already sits (-160, -220).
              A globe lit from anywhere else would sit in the same picture as
              a flower lit from over your shoulder, and the two would read as
              cut from different images. */}
          <radialGradient id="earthBody" cx="34%" cy="30%" r="82%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#fcfeff" />
            <stop offset="100%" stopColor="#dbe7ef" />
          </radialGradient>

          {/* Limb darkening: nothing until the outer fifth, then a cool
              shade right at the rim. This is the whole difference between a
              white circle and a sphere — the eye reads a disc that is
              uniform to its edge as flat no matter how it is shaded inside. */}
          <radialGradient id="earthLimb" cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor="#6f8ea6" stopOpacity="0" />
            <stop offset="94%" stopColor="#6f8ea6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#5b7c95" stopOpacity="0.34" />
          </radialGradient>

          {/* Atmosphere, in whichever vertical is showing. --lotus-b is set
              on the stage and eased over 880ms, so the world's air changes
              colour with the screen as the flower opens on it: Heal, Enrich,
              Empower, Projects, and the rose. The fallback matters — this
              renders before the first scroll writes the pair. */}
          <radialGradient id="earthAtmo" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="var(--lotus-b, #6fd19a)" stopOpacity="0" />
            <stop offset="88%" stopColor="var(--lotus-b, #6fd19a)" stopOpacity="0.42" />
            <stop offset="96%" stopColor="var(--lotus-b, #6fd19a)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--lotus-b, #6fd19a)" stopOpacity="0" />
          </radialGradient>

          <clipPath id="earthClip">
            <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} />
          </clipPath>
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
            {/* The alpha stays blurred — that is what melts the trace's
                staircase — and the SLOPE is what decides how much of that
                blur survives as a soft edge. It maps the blurred alpha
                through 0 at 0.484 and 1 at 0.516: a 3%-wide ramp, so the
                staircase is gone but the silhouette lands hard. A shallower
                slope leaves the whole blur visible as a feathered edge,
                which is what made the emblem look out of focus up close.
                Intercept is -(slope / 2) + 0.5, which keeps the edge on the
                0.5 contour — the traced outline's true position. Change the
                slope and this must move with it or the shape gains or loses
                weight. */}
            <feComponentTransfer in="ab" result="mask">
              <feFuncA type="linear" slope="31" intercept="-15" />
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
            {/* Same tight ramp as the petals — see the note there. The palm
                blurs its alpha harder still (2.1), so without this it was
                the softest edge in the emblem by some way. */}
            <feComponentTransfer in="ab" result="mask">
              <feFuncA type="linear" slope="31" intercept="-15" />
            </feComponentTransfer>
            <feComposite in="soft" in2="mask" operator="in" result="art" />
            {/* THE PALM'S COLOUR IS THE LOGO'S, and this is what was hiding
                it. The specular is ADDED (k2/k3 arithmetic) over a blurred
                alpha, and on a petal — narrow, curved — that blur leaves a
                highlight along the rim. The palm is one broad flat surface,
                so its blurred alpha is near-solid across the middle and the
                same pass laid a sheet of white over the whole hand: the
                logo's pink (#CB5CA7..#E3AACE) came out a pale lavender.
                Tightening the blur puts the highlight back on the rim where
                it belongs, and halving the constant stops it bleaching the
                surface it sits on. The fills were never wrong. */}
            <feGaussianBlur in="mask" stdDeviation="2.2" result="b" />
            <feSpecularLighting
              in="b"
              surfaceScale="2.4"
              specularConstant="0.17"
              specularExponent="34"
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

          {/* Cuts the radiance off at the hand. The glow used to be a full
              circle, so it spilled out below the palm and the hand read as
              sitting in fog rather than holding a lit moon. A soft ramp
              rather than a hard edge — this is a 16-unit blur, and a clean
              rect cut across it shows as a visible straight line. */}
          <linearGradient id="logoGlowFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset={GLOW_FADE_FROM.toFixed(4)} stopColor="#fff" stopOpacity="1" />
            <stop offset={GLOW_FADE_TO.toFixed(4)} stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="logoGlowMask" maskUnits="userSpaceOnUse" {...GLOW_BOX_ATTRS}>
            <rect {...GLOW_BOX_ATTRS} fill="url(#logoGlowFade)" />
          </mask>
        </defs>

        {/* THE MASK SITS ON THE WRAPPER, not on the circle. The circle scales
            0.2 -> 1 as the disc opens; a mask on the circle itself would be
            resolved in that same scaled space and the fade line would ride
            up and down with it, only meeting the palm at full scale. On a
            wrapper with no transform of its own, the cut stays pinned in
            user space where the hand actually is. */}
        <g mask="url(#logoGlowMask)">
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
        </g>

        {/* the lamp: one wedge of light per petal, out past the frame */}
        {/* Multiply, not screen: the section turns white under the emblem, and
            screening onto white is a no-op — the wedges would vanish exactly
            where they are meant to be clearest. */}


        {/* the seal's white circle — a world, opening the emblem */}
        <g
          ref={discRef}
          style={{
            opacity: 0,
            transform: 'scale(0.82)',
            transformOrigin: `${LOGO_DISC.cx}px ${LOGO_DISC.cy}px`,
            willChange: 'transform, opacity',
          }}
        >
          {/* air first, so the planet's edge sits on top of its own glow */}
          <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r * 1.085} fill="url(#earthAtmo)" />
          <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} fill="url(#earthBody)" />

          {/* The grid is held DELIBERATELY FAINT. The flower has to read
              against this disc, and that is the disc's first job; a graticule
              strong enough to admire on its own competes with the petals for
              the same few hundred pixels. It is meant to be felt, not read.

              DOTTED, NOT DRAWN, because that is this site's own line. The
              hero rings the wheel in `border-dashed border-white/15`, and a
              solid meridian grid read as a stock wireframe globe against it —
              the one motif on the screen that looked bought rather than
              made. Same geometry, broken into dots, and it belongs. */}
          <g
            clipPath="url(#earthClip)"
            fill="none"
            stroke="var(--lotus-a, #1f8a5c)"
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeDasharray="0.5 6.5"
          >
            {EARTH_PARALLELS.map((f, i) => {
              const y = LOGO_DISC.cy + f * LOGO_DISC.r;
              const w = LOGO_DISC.r * Math.sqrt(1 - f * f);
              return (
                <line
                  key={`p${i}`}
                  x1={LOGO_DISC.cx - w}
                  x2={LOGO_DISC.cx + w}
                  y1={y}
                  y2={y}
                  strokeOpacity={f === 0 ? 0.17 : 0.1}
                />
              );
            })}
            {Array.from({ length: EARTH_MERIDIANS }, (_, i) => (
              <ellipse
                key={`m${i}`}
                ref={(el) => {
                  meridianRefs.current[i] = el;
                }}
                cx={LOGO_DISC.cx}
                cy={LOGO_DISC.cy}
                rx={LOGO_DISC.r}
                ry={LOGO_DISC.r}
                strokeOpacity={0.13}
              />
            ))}
          </g>

          {/* Lights on the orbit — the hero scatters small glowing nodes along
              its rings, and a few here tie the world to that same sky. Placed
              on the limb rather than the face so they never sit behind a
              petal, and carrying the vertical's own colour. */}
          {[-62, -18, 34, 118].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <circle
                key={`node${i}`}
                cx={LOGO_DISC.cx + Math.cos(rad) * LOGO_DISC.r}
                cy={LOGO_DISC.cy + Math.sin(rad) * LOGO_DISC.r}
                r={i % 2 ? 2.1 : 3.1}
                fill="var(--lotus-b, #6fd19a)"
                opacity={0.55}
              />
            );
          })}

          {/* the rim, last: it has to darken the grid too, or the lines run
              flat over a curve that is bending away from them */}
          <circle cx={LOGO_DISC.cx} cy={LOGO_DISC.cy} r={LOGO_DISC.r} fill="url(#earthLimb)" />
        </g>

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

        {/* the hand, under everything the flower does — the artwork's own
            palm, already 3D-shaded, in place of the vector palm+curl pair.
            No bevel filter: that existed to fake the shading a flat vector
            fill doesn't have, and this raster already carries its own. */}
        <g
          ref={handRef}
          style={{ willChange: 'transform, opacity', transformOrigin: PIVOT, opacity: 0 }}
        >
          <image
            href={PALM_ART.src}
            x={PALM_ART.x}
            y={PALM_ART.y}
            width={PALM_ART.w}
            height={PALM_ART.h}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* petals, painted back to front.

            EVERY PETAL IS DRIVEN BY THE SCROLL, never by a CSS animation.
            A CSS animation beats an inline style in the cascade, so an
            `animation` on these groups — even one that only meant to add
            character — overrides the transform and opacity updateProgress
            writes each frame. With `both` fill it also holds its last
            keyframe forever, which forced every petal to opacity 1 and stood
            the whole flower up the moment the section mounted, regardless of
            where the reader had scrolled to. The one-at-a-time bloom IS the
            scroll handler; nothing here may write transform or opacity. */}
        <g
          ref={swayRef}
          className="lotus-sway"
          style={{ transformOrigin: PIVOT }}
        >
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
              {(() => {
                const art = PETAL_ART_BY_ID[p.id];
                return art ? (
                  <image
                    href={art.src}
                    x={art.x}
                    y={art.y}
                    width={art.w}
                    height={art.h}
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : null;
              })()}
            </g>
          ))}
        </g>
      </svg>
      </div>
    </div>
  );
});

SncfLotus3D.displayName = 'SncfLotus3D';
