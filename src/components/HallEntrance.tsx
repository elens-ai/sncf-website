import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { ACTIVITIES } from '../data/activities';
import { LOGO_PETALS } from './logoShapes';

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
  update: (covered: number, scrub: number) => void;
}

interface HallEntranceProps {
  /** The emblem's corner container — where the seal lands and hands off. */
  postRef: React.RefObject<HTMLDivElement | null>;
  /** The pinned stage, for the centre mark. Measured live: it is still
      travelling while `covered` < 1, so the landing point cannot be cached. */
  stageRef: React.RefObject<HTMLDivElement | null>;
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
  ({ postRef, stageRef }, ref) => {
    const lightRef = useRef<HTMLDivElement | null>(null);
    const sealRef = useRef<SVGSVGElement | null>(null);
    const petalRefs = useRef<Record<string, SVGGElement | null>>({});
    const panelRef = useRef<HTMLDivElement | null>(null);

    const reducedRef = useRef<boolean>(
      typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );

    useImperativeHandle(ref, () => ({
      update: (covered: number, scrub: number) => {
        const seal = sealRef.current;
        const post = postRef.current;
        const stage = stageRef.current;
        if (!seal || !post || !stage) return;

        /* Past the threshold there is nothing left to do, and the layer must
           stop costing anything for the remaining 90% of the track. */
        const done = scrub > THRESHOLD_END + 0.02;
        if (done) {
          if (seal.style.opacity !== '0') {
            seal.style.opacity = '0';
            if (panelRef.current) panelRef.current.style.opacity = '0';
            if (lightRef.current) lightRef.current.style.opacity = '0';
          }
          return;
        }

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
          const outK = easeOut(ramp(scrub, 0, THRESHOLD_END * 0.8));
          panelRef.current.style.opacity = (inK * (1 - outK)).toFixed(3);
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

        /* WHERE THE MOON IS. Derived from the emblem's own numbers rather
           than probed: its viewBox is `106 122 286 310` and the disc sits at
           (249.3, 246.9) r115 inside it, so the post's box is all that is
           needed. Probing the live circle would mean reaching through
           SncfLotus3D's internals for something arithmetic already gives. */
        const unit = postBox.width / 286.22;
        const moonX = postBox.left + (249.3 - 106) * unit;
        const moonY = postBox.top + (246.9 - 122) * unit;
        const moonD = 115 * 2 * unit;

        /* THE MERGE. They do not land beside the globe, they go INTO it:
           the flower shrinks past the moon's own width as it arrives, so the
           last thing that happens is five petals disappearing inside a disc
           rather than settling onto one. Ending at the moon's size exactly
           would read as a lid closing; going under it reads as absorbed. */
        const settle = easeOut(ramp(scrub, 0, THRESHOLD_END));
        const gs = lerp(1, (moonD * 0.62) / markW, settle);
        const gx = lerp(markX, moonX - (markW * gs) / 2, settle);
        const gy = lerp(markY, moonY - (markH * gs) / 2, settle);

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
            g.style.transform =
              `translate(${(lerp(dx, 0, t)).toFixed(2)}px, ${(lerp(dy, 0, t)).toFixed(2)}px) ` +
              `rotate(${roll.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
            /* STARTS AT THE ARTWORK'S OWN GHOST STRENGTH. The watermark
               renders at opacity 0.09, so a vector copy at full strength
               would flash bright on the frame it takes over — the whole
               point of laying them on top is that the substitution cannot be
               seen. They brighten as they leave, which is also the only
               thing that makes them read as lifting off rather than sliding
               across. */
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

        /* Hands off BEFORE it arrives: the fade starts while the flower is
           still gliding its last pixels, because blending the fade into the
           motion reads far smoother than landing and then fading, and it
           hides any sub-pixel misregistration against the emblem beneath. */
        /* Held almost to the end. When the flower was landing BESIDE the
           emblem this fade started early, so the motion and the fade blended.
           A merge is the opposite: they have to still be there while they
           shrink into the moon, and go out only once they are inside it. */
        const handoff = ramp(scrub, THRESHOLD_END * 0.72, THRESHOLD_END);
        seal.style.opacity = (1 - handoff).toFixed(3);
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
                  into a white moon; carrying the verticals' colours across
                  the gap made them arrive as five finished brand marks and
                  land on something that could not absorb them. The colour is
                  what the globe GIVES BACK, one petal per room, once the
                  exhibition starts opening them. */}
              {petal.shapes.map((sh, i) => (
                <path key={i} d={sh.d} fill="#ffffff" />
              ))}
            </g>
          ))}
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
        </div>
      </>
    );
  },
);

HallEntrance.displayName = 'HallEntrance';
