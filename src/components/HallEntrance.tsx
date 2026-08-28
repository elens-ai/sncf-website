import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ACTIVITIES } from '../data/activities';
import { LOGO_PETALS } from './logoShapes';
import { PETAL_ART, PETAL_DOTS } from './petalArt';

const PETAL_ART_BY_ID: Record<string, (typeof PETAL_ART)[number]> = Object.fromEntries(
  PETAL_ART.map((a) => [a.id, a]),
);

/**
 * CROSSING INTO THE HALL.
 *
 * The site's journey opens with the seal flying from the welcome splash onto
 * the header. This is its second act: the same seal leaves the header, travels
 * down into the exhibition, and hands the screen over to the emblem. Without
 * it the visitor simply arrives — the fold passes and the hall is just there.
 *
 * TWO CLOCKS, and they are different things:
 *
 *   `covered` — the APPROACH. 0 when the track's top edge is at the foot of
 *   the viewport, 1 when it reaches the top: one full viewport of scroll that
 *   was previously doing nothing at all. The light opens and the seal flies
 *   across it.
 *
 *   `scrub` — the THRESHOLD, first 0.10 only. The panel leaves, the seal
 *   glides to its corner post, and the emblem takes over. The flower's own
 *   windows were moved back to make room; nothing of it begins before 0.12.
 *
 * Everything ramps against scroll rather than running on a timer, for the same
 * reason the ground's fade does: a timed transition lags the scroll by its own
 * duration, so a fast flick arrives with the last state still on screen. And
 * nothing here re-renders — every frame is a `.style` write, per the rule in
 * PillarsSection and SncfLotus3D.
 */
export interface HallEntranceHandle {
  /** `gateForm` is the gate's paint progress (0..1) from PillarsSection —
      clock-driven, not a scroll value — so the flower's dissolve can follow
      the brush that is spending it rather than the scroll bar. */
  update: (covered: number, scrub: number, gateForm?: number) => void;
}

interface HallEntranceProps {
  /** The emblem's corner container — where the seal lands and hands off. */
  postRef: React.RefObject<HTMLDivElement | null>;
  /** The pinned stage, for the centre mark. Measured live: it is still
      travelling while `covered` < 1, so the landing point cannot be cached. */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** Opens the exhibition catalogue (all rooms, all works) — the panel's
      one interactive element. */
  onBrowse?: () => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));
/** Long deceleration into the slot — the splash flight's curve, by feel. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** The threshold's share of the scrub. Must end before DISC_WINDOW opens. */
const THRESHOLD_END = 0.1;

/** WHERE THE PETALS COME FROM.
 *
 * lotus-watermark.png is 1600x900, and the artwork inside it occupies the
 * alpha box below — measured off the file, not guessed. That box is 1115x683,
 * aspect 1.6325; the union of the five LOGO_PETALS bounding boxes is
 * 197.7x120.0, aspect 1.6475. They agree to under a percent, and the emblem
 * WITH its hand is far taller (the palm runs to y~422 against the petals'
 * 306), so the watermark is these same five petals, alone, at these same
 * proportions.
 *
 * That is what makes this cheap: one similarity transform — uniform scale and
 * a translate — lays the vector petals exactly over the raster ones, with no
 * per-petal fitting and no change to the hero at all. */
const MARK_ALPHA = { x0: 249 / 1600, x1: 1364 / 1600, y0: 99 / 900, y1: 782 / 900 };
const MARK_NATURAL = { w: 1600, h: 900 };

/** The petals' union box in SVG user units — what MARK_ALPHA corresponds to.

    This is ALSO the flying SVG's viewBox, and it has to be. Using the emblem's
    own viewBox (286x310, which reserves the room the hand occupies) while
    sizing the element to the petals' 1.6475 aspect makes preserveAspectRatio
    letterbox the content to about 39% — the petals come out less than half
    size and nothing lines up. Matching the two is what lets one scale factor
    map the whole mark. */
const PETAL_UNION = { x: 150.3, y: 186.4, w: 197.7, h: 120.0 };
const PETAL_VIEWBOX = `${PETAL_UNION.x} ${PETAL_UNION.y} ${PETAL_UNION.w} ${PETAL_UNION.h}`;

/** Bloom order, so the petals leave the artwork in the order the exhibition
    will later open them. */
const LIFT_ORDER = ['welcome', 'heal', 'enrich', 'empower', 'projects'];

export const HallEntrance = forwardRef<HallEntranceHandle, HallEntranceProps>(
  ({ postRef, stageRef, onBrowse }, ref) => {
    const lightRef = useRef<HTMLDivElement | null>(null);
    const sealRef = useRef<SVGSVGElement | null>(null);
    const petalRefs = useRef<Record<string, SVGGElement | null>>({});
    /* The coloured copy stacked over each white petal — its opacity IS the
       awakening. */
    const petalColorRefs = useRef<Record<string, SVGImageElement | null>>({});
    /* The five consolidating dots, free-flying in screen space. */
    const dotSpriteRefs = useRef<Record<string, SVGCircleElement | null>>({});
    const panelRef = useRef<HTMLDivElement | null>(null);

    const reducedRef = useRef<boolean>(
      typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
    /* Whether the live (non-`done`) branch has run since the last time we
       were past the threshold. See the note beside `done` below — this is
       what replaced a single-element opacity check as the "does anything
       need zeroing" test. */
    const wasLiveRef = useRef(false);

    useImperativeHandle(ref, () => ({
      update: (covered: number, scrub: number, gateForm = 1) => {
        const seal = sealRef.current;
        const post = postRef.current;
        const stage = stageRef.current;
        if (!seal || !post || !stage) return;

        /* Past the threshold there is nothing left to do, and the layer must
           stop costing anything for the remaining 90% of the track.

           Guarded on WHETHER THE LIVE BRANCH RAN LAST TIME, not on any one
           element's opacity. That was tried twice and broke twice, for the
           same underlying reason: a single element is only a valid proxy
           for "everything is clean" if it is provably the LAST thing to
           reach zero, in every scenario — and there is always another
           scenario. Keying it on seal missed the flash (the flash decays
           slightly later). Keying it on the flash missed THIS: a page load
           that settles near scrub~0 for a moment (setting the ghost petals
           to some faint non-zero opacity, `covered` already a little into
           its own rise) and then jumps straight to a high scrub in one hop
           — skipping the flash's rise-then-decay window entirely, so the
           flash never becomes non-zero at all, and a flash-keyed guard sees
           "already 0" and never cleans up the petals that WERE touched.
           There is no single element immune to being the wrong proxy in
           some jump. Tracking "did the live branch run" sidesteps the whole
           class of bug: it is true exactly when there is something to clean,
           regardless of which element happens to hold a stray value. */
        const done = scrub > THRESHOLD_END + 0.02;
        if (done) {
          if (wasLiveRef.current) {
            seal.style.opacity = '0';
            if (panelRef.current) {
              panelRef.current.style.opacity = '0';
              panelRef.current.style.pointerEvents = 'none';
            }
            if (lightRef.current) lightRef.current.style.opacity = '0';
            Object.values(petalRefs.current).forEach((g) => {
              if (g instanceof SVGGElement) g.style.opacity = '0';
            });
            Object.values(dotSpriteRefs.current).forEach((c) => {
              if (c instanceof SVGCircleElement) c.setAttribute('opacity', '0');
            });
            wasLiveRef.current = false;
          }
          return;
        }
        wasLiveRef.current = true;

        /* --- the light: opens across the approach, holds, then goes as the
           hall's own ground comes up --- */
        if (lightRef.current) {
          const open = easeOut(ramp(covered, 0.05, 0.9));
          lightRef.current.style.opacity = (open * (1 - ramp(scrub, 0.02, THRESHOLD_END))).toFixed(3);
          lightRef.current.style.transform = `scale(${lerp(0.72, 1, open).toFixed(3)})`;
        }

        /* --- the panel: writes on across the approach, leaves UPWARD on the
           threshold, matching the rooms' own arrive-below/leave-up stream --- */
        if (panelRef.current) {
          const inK = easeOut(ramp(covered, 0.3, 0.95));
          /* Spent by the paint as well as the scroll: the gate finishes on
             its own clock once latched, and a scroll-only fade left "Our
             work" faintly double-printed behind the finished gate's motto
             for a reader paused at the latch. Same max-of-two-clocks rule
             the flower's dissolve uses. */
          const outK = Math.max(
            easeOut(ramp(scrub, 0, THRESHOLD_END * 0.8)),
            easeOut(ramp(gateForm, 0.1, 0.45)),
          );
          const panelVis = inK * (1 - outK);
          panelRef.current.style.opacity = panelVis.toFixed(3);
          /* The panel's base CSS is pointer-events:none (it overlays the
             whole stage), but its browse button must be pressable while the
             panel is actually readable — and must NOT be an invisible click
             target once it has faded. Same threshold the hero uses for its
             own fading foreground. */
          panelRef.current.style.pointerEvents = panelVis > 0.5 ? 'auto' : 'none';
          /* The -50% is part of THIS string. The panel is centred by
             `left: 50%` plus this translate, and since the handler owns
             `transform` outright, declaring the centring in CSS would have it
             overwritten on the first frame. */
          panelRef.current.style.transform =
            `translate(-50%, ${(lerp(22, 0, inK) - outK * 30).toFixed(1)}px)`;
        }

        /* --- the flower: the stage's centre mark, then the corner post ---

           The SVG itself only ever holds the ASSEMBLED flower: first at the
           entrance mark, then gliding to the corner. The scatter — each petal
           still lying on the hero's watermark — is a per-petal transform
           inside it, below. Splitting it this way means the threshold's glide
           is one transform on one element rather than five kept in step. */
        const stageBox = stage.getBoundingClientRect();
        const postBox = post.getBoundingClientRect();

        const markW = Math.min(stageBox.width * 0.42, 360);
        const markH = markW / (PETAL_UNION.w / PETAL_UNION.h);
        const markX = stageBox.left + stageBox.width / 2 - markW / 2;
        const markY = stageBox.top + stageBox.height * 0.34;

        /* THE FLOWER RISES TO MEET THE ARCH, AND DISSOLVES INTO IT.

           It used to glide to the corner and sink into the palm's moon, and
           the gate was then painted by light sent back from that corner —
           the protagonist leaving the stage and mailing in a proxy. Now the
           flower IS the gate's material: it lifts a little from its mark,
           toward the crown of the arch that is about to exist directly
           above it, and fades exactly as the ghost-white sweeps (driven in
           PillarsSection) carry its substance both ways along the band.
           The palm's moon is not abandoned — it earns its petals room by
           room through the bloom, as it always did. */
        const rise = easeOut(ramp(scrub, 0, 0.06));
        /* Colour returns WITH the rise and is complete before the brushes
           leave — the petal must know its ink before it can paint with it.
           Floored by gateForm so a fast flick can never launch a still-white
           brush. */
        const awaken = Math.max(rise, ramp(gateForm, 0, 0.18));
        Object.values(petalColorRefs.current).forEach((img) => {
          if (img instanceof SVGImageElement) img.style.opacity = awaken.toFixed(3);
        });
        /* Spent BY THE PAINT, not by the scroll: the gate draws itself on a
           clock once latched, and a scroll-driven fade left the flower
           standing at full strength beside an already-finished gate when
           the reader paused. The scroll term stays as a floor so rolling
           back still restores the flower. */
        const dissolve = Math.max(ramp(scrub, 0.05, 0.1), ramp(gateForm, 0.08, 0.6));
        const gs = lerp(1, 1.08, rise);
        const gx = markX - (markW * (gs - 1)) / 2;
        const gy = markY - rise * stageBox.height * 0.09 - (markH * (gs - 1)) / 2;

        /* THE ORBIT. The four heads do not simply pool into a blob and
           drop — they leave the flower and begin to CIRCLE a common centre,
           the way the emblem's own figures stand around its moon, and the
           circle travels toward the palm while it tightens: about one and
           three-quarter revolutions, radius decaying with each, until the
           four close into one sphere just as they arrive — and the disc
           swells out of the touch-down underneath them (SncfLotus3D's disc
           window sits right there on the scrub). People revolving around a
           shared centre becoming a world: that is the emblem read aloud.

             lift    0.004..0.012  mask holes open, sprites take over
             orbit   0.010..0.048  circling, tightening, travelling
             rest    0.046..       the disc is born under the seated head
             fade    0.058..0.070  the head melts into the grown world

           Each dot's starting angle and radius are taken from its OWN live
           position around the group's centroid every frame — so the orbit
           begins exactly where the dots stand (no jump at lift-off, even
           while the flower is still rising under them) and the spin is just
           an angle added on top. */
        const unitAll = (markW / PETAL_UNION.w) * gs;
        const toScreen = (ux: number, uy: number) => ({
          x: gx + (ux - PETAL_UNION.x) * unitAll,
          y: gy + (uy - PETAL_UNION.y) * unitAll,
        });
        const postUnit = postBox.width / 286.22;
        const moonC = {
          x: postBox.left + (249.3 - 106) * postUnit,
          y: postBox.top + (246.9 - 122) * postUnit,
        };
        const moonRpx = 115 * postUnit;

        const dotsAway = reducedRef.current ? 1 : ramp(scrub, 0.004, 0.012);
        seal.style.setProperty('--dots-away', dotsAway.toFixed(3));
        const orbitRaw = ramp(scrub, 0.01, 0.048);
        /* smoothstep: eases both ends, so the circling starts gently and
           the arrival does not slam */
        const orbitT = orbitRaw * orbitRaw * (3 - 2 * orbitRaw);
        /* GROW FIRST, HIDE AFTER. The disc is born at 0.046 — the moment
           the head seats — and by 0.058 has visibly outgrown it; only then
           does the head fade, absorbed by the world it started. Fading it
           earlier (it was 0.05-0.06 against a 0.055 disc) put the hide
           BEFORE the growth and the handover read as a swap, not a birth. */
        const land = ramp(scrub, 0.058, 0.07);

        const dotIds = LOGO_PETALS.filter((pp) => PETAL_DOTS[pp.id]).map((pp) => pp.id);
        const homes = dotIds.map((id) => toScreen(PETAL_DOTS[id].cx, PETAL_DOTS[id].cy));
        const c0 = {
          x: homes.reduce((a, h) => a + h.x, 0) / Math.max(1, homes.length),
          y: homes.reduce((a, h) => a + h.y, 0) / Math.max(1, homes.length),
        };
        /* The circle's centre travels to the palm on a slight upward arc —
           thrown, not dropped. */
        const cx = lerp(c0.x, moonC.x, orbitT);
        const cy = lerp(c0.y, moonC.y, orbitT) - Math.sin(orbitT * Math.PI) * 46;
        const SPINS = 1.75;

        dotIds.forEach((id, i) => {
          const el = dotSpriteRefs.current[id];
          const dot = PETAL_DOTS[id];
          if (!el || !dot) return;
          const home = homes[i];
          const offX = home.x - c0.x;
          const offY = home.y - c0.y;
          const phase = Math.atan2(offY, offX);
          const radius0 = Math.hypot(offX, offY);
          /* tightening: each revolution smaller, closed by arrival */
          const radius = radius0 * Math.pow(1 - orbitT, 1.35);
          const ang = phase + SPINS * orbitT * Math.PI * 2;
          const px = cx + Math.cos(ang) * radius;
          const py = cy + Math.sin(ang) * radius;
          /* Ends at ~the newborn disc's own visual radius (it is born at
             half scale), so the seed and the first frame of the world are
             the same size — the growth continues from the head, not from a
             different, larger thing. */
          const rr = lerp(dot.r * unitAll, Math.max(dot.r * unitAll, moonRpx * 0.45), orbitT);
          el.setAttribute('cx', px.toFixed(1));
          el.setAttribute('cy', py.toFixed(1));
          el.setAttribute('r', Math.max(0.5, rr).toFixed(1));
          el.setAttribute('opacity', (reducedRef.current ? 0 : dotsAway * (1 - land)).toFixed(3));
        });

        seal.style.width = `${markW.toFixed(1)}px`;
        seal.style.height = `${markH.toFixed(1)}px`;
        seal.style.transform = `translate(${gx.toFixed(1)}px, ${gy.toFixed(1)}px) scale(${gs.toFixed(4)})`;

        /* --- each petal: still on the watermark, or home ---

           The hero's watermark is measured live because the hero is scrolling
           up and out while this runs: its rect moves every frame. Undo
           `object-contain` first (the box is 75vw x 75vh but the image is
           1600x900, so the painted area is letterboxed inside it), then step
           in by MARK_ALPHA to reach the artwork itself. */
        const wm = document.getElementById('hero-lotus-watermark')?.querySelector('img');
        if (wm) {
          const box = wm.getBoundingClientRect();
          const contain = Math.min(box.width / MARK_NATURAL.w, box.height / MARK_NATURAL.h);
          const paintedW = MARK_NATURAL.w * contain;
          const paintedH = MARK_NATURAL.h * contain;
          const px = box.left + (box.width - paintedW) / 2;
          const py = box.top + (box.height - paintedH) / 2;

          const srcX = px + MARK_ALPHA.x0 * paintedW;
          const srcY = py + MARK_ALPHA.y0 * paintedH;
          const srcW = (MARK_ALPHA.x1 - MARK_ALPHA.x0) * paintedW;

          /* ONE SIMILARITY FOR ALL FIVE.

             The pivot is USER-SPACE (0,0), not the union box's own corner.
             With `transform-box: view-box`, `transform-origin: 0 0` resolves
             to the viewBox's coordinate origin — and this viewBox starts at
             (150.3, 186.4), so the scale pivots about a point well outside
             the mark. That shows up as a constant offset (measured: 39px
             across, 48px down at this size), which is why the corner delta
             alone is not enough: the `- x * (scale - 1)` term is what pulls
             the pivot back onto the union's own corner.

             A point P therefore maps to `scale * P + translate`, and landing
             the union's corner on the artwork's corner solves to the below.
             Verified by measurement, not by reading the spec — the two
             disagreed, and the browser is what ships. */
          const unitPx = (markW * gs) / PETAL_UNION.w; // screen px per user unit
          const scatterScale = srcW / (PETAL_UNION.w * unitPx);
          const dx = (srcX - gx) / unitPx - PETAL_UNION.x * (scatterScale - 1);
          const dy = (srcY - gy) / unitPx - PETAL_UNION.y * (scatterScale - 1);

          /* THE SWAP. Nothing of this layer exists on the hero: at covered 0
             the vectors are fully transparent and the artwork is untouched,
             which is how the hero is supposed to look.

             They trade places over one short window, and the two sides are
             THE SAME RAMP on purpose — the vectors come up to exactly the
             0.09 the artwork renders at as the artwork goes to nothing, so
             the sum across the swap is constant and there is no frame where
             the hero's lotus is brighter or dimmer than it was. Painting the
             vectors at 0.09 from the start, over an artwork also at 0.09,
             is what doubled it. */
          const swap = reducedRef.current ? 1 : ramp(covered, 0.015, 0.09);

          LOGO_PETALS.forEach((petal) => {
            const g = petalRefs.current[petal.id];
            if (!g) return;
            const i = LIFT_ORDER.indexOf(petal.id);
            /* Staggered lift-off, in bloom order. Each petal owns its own
               slice of the approach, so no petal ever overtakes the one
               before it and the artwork empties in the order the exhibition
               will refill it. */
            const t = reducedRef.current
              ? 1
              : easeOut(ramp(covered, 0.04 + i * 0.075, 0.72 + i * 0.055));
            const sc = lerp(scatterScale, 1, t);
            /* A little roll on the way in, so they drift rather than slide.
               It PEAKS MID-FLIGHT and is zero at both ends: a roll that was
               largest at t=0 left the petals sitting rotated off the artwork
               they are supposed to be lying on, which is the one frame where
               registration has to be exact. Zero at t=1 for the same reason
               at the other end. */
            const roll = Math.sin(t * Math.PI) * (i % 2 ? 7 : -6);

            /* ARRIVAL IS IDENTITY. `dx, dy` collapse to (0, 0) as `t` reaches
               1 — the petal's own raw path, un-offset — and the group above
               is already registered so that path sits correctly around the
               moon at true scale. Nothing further to add: the artwork's own
               drawing is what wraps the disc, the same way it wraps
               LOGO_DISC in the assembled emblem. */
            g.style.transform =
              `translate(${lerp(dx, 0, t).toFixed(2)}px, ${lerp(dy, 0, t).toFixed(2)}px) ` +
              `rotate(${roll.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
            /* STARTS AT THE ARTWORK'S OWN GHOST STRENGTH. The watermark
               renders at opacity 0.09, so a vector copy at full strength
               would flash bright on the frame it takes over — the whole
               point of laying them on top is that the substitution cannot be
               seen. They brighten as they leave, which is also the only
               thing that makes them read as lifting off rather than sliding
               across.

               THEY DO NOT DIM AGAIN ON THE BLOOM: once they have taken over
               from the artwork there is nothing further to be a ghost of, so
               opacity simply holds at full through the threshold while colour
               is what carries the rest of the change. */
            g.style.opacity = (swap * (reducedRef.current ? 0.92 : lerp(0.09, 0.92, t))).toFixed(3);
          });

          /* THE ARTWORK HANDS OVER, on the same ramp the vectors arrive on.
             Written straight to the DOM by id rather than through React: this
             is the hero's own element and routing it through state would
             re-render that whole tree mid flight, which is the stall the
             splash documented. Restored on the way back up because `covered`
             runs backwards too — scroll up and the hero has its lotus again. */
          const host = wm.parentElement as HTMLElement | null;
          if (host) host.style.opacity = (1 - swap).toFixed(3);
        }

        /* Fades on the SAME window the gate sweeps open across — the
           flower is not leaving, it is being spent: its substance runs out
           along the band as the brush carries it. */
        seal.style.opacity = (1 - dissolve).toFixed(3);

      },
    }));

    return (
      <>
        <div ref={lightRef} className="hall-light" aria-hidden="true" style={{ opacity: 0 }} />

        {/* The petals are FIXED and sit under the header (z-40 against its
            z-50): they should read as crossing in front of the page but
            behind the site's own chrome.

            Unfiltered on purpose. The emblem's bevel lives in ITS OWN <defs>
            inside SncfLotus3D, and filter ids are document-scoped — pointing
            at it across components is exactly the kind of invisible coupling
            that breaks when either side is edited. A drop-shadow gives these
            their depth instead. */}
        <svg
          ref={sealRef}
          className="hall-petals"
          viewBox={PETAL_VIEWBOX}
          aria-hidden="true"
          style={{ opacity: 0 }}
        >
          <defs>
            {/* SOLID WHITE OUTLINE for the awakened petals: the alpha is
                dilated and flooded white, then the artwork is drawn back
                over it — a true silhouette contour, not a stroke on every
                internal band. The ghost needed no outline (white on any
                ground carries itself); colour does, or its soft raster edge
                dissolves into whatever ground it crosses — which is exactly
                what the assembled emblem's own artwork solves with the
                baked white rim around its palm. One unit here is about
                1.8px at the entrance mark. */}
            <filter id="hall-petal-outline" x="-12%" y="-12%" width="124%" height="124%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="fat" />
              <feFlood floodColor="#ffffff" result="white" />
              <feComposite in="white" in2="fat" operator="in" result="rim" />
              <feMerge>
                <feMergeNode in="rim" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* One mask per petal: a hole that opens over the baked dot as
                the free sprite lifts off it. The hole's own opacity rides
                --dots-away, so before the consolidation the images are
                untouched, and scrolling back re-seats the dots into the
                flower. */}
            {LOGO_PETALS.map((petal) => {
              const dot = PETAL_DOTS[petal.id];
              if (!dot) return null;
              return (
                <mask key={petal.id} id={`hall-dotless-${petal.id}`}>
                  <rect
                    x={PETAL_UNION.x - 10}
                    y={PETAL_UNION.y - 10}
                    width={PETAL_UNION.w + 20}
                    height={PETAL_UNION.h + 20}
                    fill="#fff"
                  />
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r={dot.r + 2.6}
                    fill="#000"
                    style={{ opacity: 'var(--dots-away, 0)' }}
                  />
                </mask>
              );
            })}
          </defs>
          {LOGO_PETALS.map((petal) => (
            <g
              key={petal.id}
              ref={(el) => {
                petalRefs.current[petal.id] = el;
              }}
              style={{ opacity: 0 }}
            >
              {/* WHITE, because that is what they are while they are in the
                  air. They leave a white ghost on the hero and they merge
                  into a white moon; carrying the artwork's own saturated
                  colours across the gap made them arrive as five finished
                  brand marks and land on something that could not absorb
                  them. The colour is what the globe GIVES BACK, one petal
                  per room, once the exhibition starts opening them.

                  Forced white via filter, not by swapping in a plain fill:
                  this is the SAME raster silhouette that lands in the
                  assembled emblem (see SncfLotus3D, petalArt.ts), so the
                  shape a visitor sees mid-flight is the shape it settles
                  into — only the colour is suppressed here and given back
                  there. brightness(0) flattens every pixel to black while
                  leaving alpha alone; invert(1) turns that black white. */}
              {(() => {
                const art = PETAL_ART_BY_ID[petal.id];
                if (!art) return null;
                return (
                  <g mask={PETAL_DOTS[petal.id] ? `url(#hall-dotless-${petal.id})` : undefined}>
                    <image
                      href={art.src}
                      x={art.x}
                      y={art.y}
                      width={art.w}
                      height={art.h}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    {/* THE AWAKENING. The same artwork again, unfiltered —
                        its own inks — stacked exactly over the white copy
                        and faded in as the flower rises to paint the gate.
                        The ghost that crossed from the hero remembers what
                        colour it is at the moment it goes to work: each
                        petal recovers ITS OWN ink, and then lays exactly
                        that ink into the band (the gate's gradient is the
                        record of who painted where). Same silhouette above
                        and below, so the crossfade never shows an edge. */}
                    <image
                      ref={(el) => {
                        petalColorRefs.current[petal.id] = el;
                      }}
                      href={art.src}
                      x={art.x}
                      y={art.y}
                      width={art.w}
                      height={art.h}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ opacity: 0, filter: 'url(#hall-petal-outline)' }}
                    />
                  </g>
                );
              })()}
            </g>
          ))}
        </svg>

        {/* THE FIVE DOTS, free of the flower — screen-space sprites that
            orbit a common centre and close into the globe. Fixed like
            the petals, because they travel from the flower's box to the
            emblem's corner, which scroll differently. White with the same
            soft glow the petals carry. */}
        <svg className="hall-dots" aria-hidden="true">
          {LOGO_PETALS.map((petal) =>
            PETAL_DOTS[petal.id] ? (
              <circle
                key={petal.id}
                ref={(el) => {
                  dotSpriteRefs.current[petal.id] = el;
                }}
                fill="#ffffff"
                opacity="0"
              />
            ) : null,
          )}
        </svg>

        <div ref={panelRef} className="hall-panel" style={{ opacity: 0 }}>
          <p className="font-dancing-script pillar-script-name font-bold text-white leading-none drop-shadow-md select-none">
            Our work
          </p>
          <span className="hall-panel-rule" aria-hidden="true" />
          <p className="font-artistic-display text-white text-[11px] sm:text-[12.5px] tracking-[0.22em] uppercase">
            Four rooms · {ACTIVITIES.length} works
          </p>
          <p className="font-artistic-serif text-white/65 text-[11.5px] mt-1.5">
            Figures as reported · March 2026
          </p>
          {/* The second door in. Scrolling on walks the rooms in sequence —
              this opens the catalogue and lets a visitor browse all of them
              at once, stepping up to any piece directly. */}
          {onBrowse && (
            <button
              type="button"
              onClick={onBrowse}
              className="hall-panel-browse font-artistic-display uppercase tracking-[0.2em] text-[10.5px] sm:text-[11.5px]"
            >
              Browse the catalogue
              <span aria-hidden="true" className="hall-panel-browse-count">
                {ACTIVITIES.length} works
              </span>
            </button>
          )}
        </div>
      </>
    );
  },
);

HallEntrance.displayName = 'HallEntrance';
