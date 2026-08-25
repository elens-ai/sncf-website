import React, { useEffect, useRef } from 'react';
import { PillarState } from '../types';
import { SncfLotus3D, SncfLotus3DHandle } from './SncfLotus3D';
import { PILLARS } from '../data/pillars';
import { DEVOTIONAL_ACCENT } from './DevotionalPhotoCard';
import { activitiesFor, Activity } from '../data/activities';
import { ActivityCase } from './ActivityCase';
import { HallEntrance, HallEntranceHandle } from './HallEntrance';

/** THE HANG. One wall per pillar, six slots each, in percentages of the wall
    box. `tilt` is degrees, `rate` how far the piece drifts across the room's
    own scroll — differing rates are what give the wall depth as you walk
    past it. `style` is the frame treatment (see .lotus-plate in index.css).

    FRAMES DO NOT OVERLAP. They used to, tilted a few degrees over each
    other, which reads as snapshots pinned to a board — the opposite of a
    gallery. Real hangs leave air between pieces and vary the size rather
    than the stacking, so these are laid out to touch nothing, and the tilt
    is down to under a degree: enough that the wall is not mechanical, not
    so much that it looks knocked.

    Each wall is arranged differently on purpose. Walking into four rooms
    hung identically is the fastest way to make an exhibition feel like a
    template, so the rhythms differ — a tall centre here, a stepped run
    there — while every wall keeps its BOTTOM RIGHT clear, because that is
    where the emblem stands.

    Shapes are noted per slot: supply a photograph that matches, or it will
    be cropped to fit by object-fit: cover. */
type Slot = {
  x: number;
  y: number;
  w: number;
  h: number;
  tilt: number;
  rate: number;
  style: 'mat' | 'frame' | 'print';
};

const WALLS: Record<string, Slot[]> = {
  /* five pieces: a stepped run led by a tall portrait */
  heal: [
    { x: 0, y: 2, w: 17, h: 47, tilt: -0.5, rate: -26, style: 'mat' },
    { x: 21, y: 10, w: 28, h: 39, tilt: 0.4, rate: -44, style: 'frame' },
    { x: 52, y: 0, w: 18, h: 49, tilt: -0.3, rate: -18, style: 'print' },
    { x: 73, y: 8, w: 27, h: 41, tilt: 0.6, rate: -36, style: 'mat' },
    { x: 2, y: 56, w: 31, h: 42, tilt: 0.35, rate: -30, style: 'frame' },
  ],
  /* five: a wide feature centred, smaller works flanking */
  enrich: [
    { x: 0, y: 6, w: 24, h: 36, tilt: 0.5, rate: -40, style: 'frame' },
    { x: 27, y: 0, w: 33, h: 47, tilt: -0.4, rate: -22, style: 'mat' },
    { x: 63, y: 3, w: 17, h: 45, tilt: 0.6, rate: -48, style: 'print' },
    { x: 83, y: 9, w: 17, h: 33, tilt: -0.5, rate: -30, style: 'mat' },
    { x: 4, y: 52, w: 29, h: 43, tilt: -0.35, rate: -34, style: 'mat' },
  ],
  /* five: two tall verticals anchoring a low run */
  empower: [
    { x: 0, y: 0, w: 18, h: 50, tilt: 0.4, rate: -32, style: 'print' },
    { x: 22, y: 7, w: 29, h: 41, tilt: -0.5, rate: -46, style: 'mat' },
    { x: 55, y: 2, w: 20, h: 46, tilt: 0.3, rate: -20, style: 'frame' },
    { x: 79, y: 6, w: 21, h: 40, tilt: -0.45, rate: -38, style: 'mat' },
    { x: 3, y: 56, w: 28, h: 41, tilt: -0.4, rate: -26, style: 'frame' },
  ],
  /* four: the big commissions get room */
  projects: [
    { x: 0, y: 3, w: 32, h: 45, tilt: -0.35, rate: -24, style: 'mat' },
    { x: 36, y: 0, w: 20, h: 48, tilt: 0.5, rate: -42, style: 'frame' },
    { x: 60, y: 5, w: 32, h: 43, tilt: -0.4, rate: -18, style: 'mat' },
    { x: 2, y: 56, w: 27, h: 41, tilt: 0.4, rate: -36, style: 'print' },
  ],
};

/** The four verticals that have a room of activities, in bloom order. The
    fifth stage is the devotional rose and closes the exhibition rather than
    exhibiting — it has no activity record in PILLARS to draw on. */
const ROOM_IDS = ['heal', 'enrich', 'empower', 'projects'];

/* THE ORDER THE SCREEN TURNS THROUGH, and the scroll point each one takes
   over at. The colours are looked up from PILLARS by id rather than written
   out here, so they cannot drift from the verticals themselves; the rose is
   the devotional accent, the same pair the hero uses when the portrait is
   fronting.

   The hand-over points are the petal windows' OPENINGS (see LOGO_PETALS),
   so the screen turns colour on the same frame a petal starts to unfold.

   EACH PETAL OPENS ONTO A SCREEN ITS OWN COLOUR. The petal windows are
   ordered by the petal's ink to match this list — green leads on Heal, then
   indigo on Enrich, magenta on Empower, cyan on Projects, purple on the rose
   — so the two are one effect, not two that happen to overlap. That pairing
   is the whole point of the timings agreeing; keep these thresholds in step
   with WINDOWS in tools/build-logo-shapes.py, which carries the mapping and
   the reason the petal keys do not match the vertical names. */
/* What each stage is CALLED. The first four come straight from PILLARS, so
   they cannot drift from the verticals; the fifth petal is the devotional
   accent the hero uses behind the Satguru portrait, which has no label in
   the data — "Sewa" is the name the Mission itself gives that service. */
const LEGEND_LABELS = ['HEAL', 'ENRICH', 'EMPOWER', 'PROJECTS', 'SEWA'];

const VERTICAL_SEQUENCE: { at: number; a: string; b: string }[] = (() => {
  const byId = Object.fromEntries(PILLARS.map((p) => [p.id, p]));
  const order = ['heal', 'enrich', 'empower', 'projects'];
  const pairs = order.map((id) => ({ a: byId[id].accentA, b: byId[id].accentB }));
  pairs.push({ a: DEVOTIONAL_ACCENT.a, b: DEVOTIONAL_ACCENT.b });
  const at = [0.24, 0.385, 0.53, 0.675, 0.82];
  return pairs.map((c, i) => ({ at: at[i], ...c }));
})();

/**
 * The screen below the hero: the SNCF lotus alone, assembling.
 *
 * The section is a TALL TRACK holding a STICKY stage. Arriving at it, the
 * stage pins to the viewport with the emblem standing on the foot of the
 * screen — flush to it, no gap — and every petal still folded away; the scrolling that follows does not move the flower at all —
 * it builds it, one petal at a time, left to right. Once the last petal has
 * landed and the flower has held for a beat, the track runs out and the page
 * carries on to the next screen.
 *
 * The track's height (.lotus-track) is what buys that scroll: 360vh leaves
 * 260vh of pinned travel, about 40vh per petal. Under prefers-reduced-motion
 * the track collapses to a single screen and the flower is simply built.
 *
 * Progress is measured here and handed to the flower through its imperative
 * handle, so the scroll path never re-renders React: a passive listener
 * marks it dirty, one frame reads the track and the flower damps towards it.
 *
 * THE COLOUR ARRIVES FROM THE HERO AND KEEPS GOING. This screen paints no
 * ground of its own while it is taking the viewport: the page-wide
 * .accent-canvas is the only layer showing, exactly as on the hero and every
 * screen below, so the colour crossing the fold is the same colour, at the
 * same angle, under the same darkening overlay. Painting a second copy of
 * that gradient here is what used to break it — two ramps stacked vertically
 * do not join, and the mismatch showed as a band across the fold.
 *
 * Only when the FIRST PETAL opens does a ground appear, faded up over 0.6s,
 * marking the turn from arriving to blooming. It is an opacity crossfade
 * rather than an animated `background`, because a gradient and a flat colour
 * cannot interpolate — transitioning between them snapped.
 *
 * That ground is .lotus-ground, built like .accent-canvas: the same two
 * layers, the same angle, the same left-to-right darkening. It was once a
 * flat #6fd19a — accent-b alone, the light end of the Heal pair — and a
 * single flat mint over the whole viewport read as a slab belonging to no
 * particular site.
 *
 * AS THE FLOWER OPENS THE SCREEN WALKS THE VERTICALS: Heal, Enrich, Empower,
 * Projects, and the devotional rose last, each taking over on the frame its
 * petal begins to unfold (VERTICAL_SEQUENCE). That order is the verticals'
 * own and is independent of the petals, which are fixed to their places in
 * the artwork and sweep left to right regardless. When the last petal has
 * landed the ground sinks away entirely and the page's own colour is showing
 * again before the fold, so the events screen below continues from it.
 *
 * THE FIXED CHROME IS NOT TOUCHED. The header scrim and the social rail are
 * painted once, globally, and this screen leaves them alone, so they read
 * identically from the hero all the way down.
 */

interface PillarsSectionProps {
  pillars: PillarState[];
  activeIndex: number;
  onOpenDetails: (pillar: PillarState) => void;
  currentPillar?: PillarState;
}

export const PillarsSection: React.FC<PillarsSectionProps> = ({ currentPillar }) => {
  const trackRef = useRef<HTMLElement | null>(null);
  const lotusRef = useRef<SncfLotus3DHandle | null>(null);
  const groundRef = useRef<HTMLDivElement | null>(null);
  /* The stage carries --lotus-a/--lotus-b, not the ground. Both the ground
     AND the emblem's globe read them, and a custom property only reaches a
     sibling by being set on their shared ancestor. */
  const stageElRef = useRef<HTMLDivElement | null>(null);
  /* Which entry of VERTICAL_SEQUENCE is currently painted, so the pair is
     written only on a change. -1 so the first read always publishes. */
  const stageRef = useRef<number>(-1);
  /* The legend lights up petal by petal. Written straight to the DOM rather
     than held in state: this runs inside the scroll path, and the whole point
     of the imperative handle is that scrolling never re-renders React. */
  const legendRefs = useRef<(HTMLLIElement | null)[]>([]);
  const enteredRef = useRef<boolean>(false);
  const roomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const entranceRef = useRef<HallEntranceHandle | null>(null);
  /* The emblem's corner container — the seal's landing point. */
  const postRef = useRef<HTMLDivElement | null>(null);
  /* Which piece the visitor has stepped up to. State, not a ref: this is a
     click, not the scroll path, so a re-render here costs nothing. */
  const [open, setOpen] = React.useState<Activity | null>(null);
  const plateRefs = useRef<(HTMLDivElement | null)[][]>([]);

  useEffect(() => {
    let raf = 0;

    const read = () => {
      raf = 0;
      const track = trackRef.current;
      if (!track) return;
      /* 0 as the sticky stage takes hold, 1 as the track runs out. Both
         terms are measured live, so a track sized in vh and a viewport that
         resizes — phone chrome collapsing, rotation — stay in step without
         hardcoding either. */
      const vh = window.innerHeight || 1;
      const r = track.getBoundingClientRect();
      const span = r.height - vh;
      const covered = Math.max(0, Math.min(1, (vh - r.top) / vh));
      const scrub = span > 0 ? -r.top / span : 1;
      lotusRef.current?.updateProgress(scrub, covered);
      /* The entrance rides the SAME read — one measurement of the track, two
         consumers, so the seal and the emblem can never disagree by a frame. */
      entranceRef.current?.update(covered, scrub);

      /* The copy rises once the screen is genuinely this section's, not the
         moment a pixel of it appears — at a third covered the reader has
         committed to it. One attribute write, CSS does the motion. */
      const entered = covered > 0.33;
      if (entered !== enteredRef.current && stageElRef.current) {
        enteredRef.current = entered;
        stageElRef.current.dataset.entered = entered ? 'true' : 'false';
      }

      /* The Heal ground is a CROSSFADE over the page, never a second copy of
         the page's gradient. Until the first petal opens it is fully
         transparent, so what shows is .accent-canvas — the one page-wide
         layer, darkening overlay and all — and the colour arriving from the
         hero simply carries on through this screen unchanged. When the first
         petal opens the ground fades up to solid Heal.

         Opacity is what animates, not `background`: a gradient and a flat
         colour are not interpolatable, so transitioning the background
         property between them snapped instead of easing. */
      if (groundRef.current) {
        /* bloom: 0 as the stage pins, 1 as the track runs out. The first
           petal's window opens at 0.09, which is the cue for the handover.

           Both ends are RAMPS, and both are scrubbed by scroll rather than
           run by a CSS transition. In: Heal rises as the first petal opens.
           Out: it sinks back before the track ends, so the page colour is
           already showing again by the time the stage unpins and the fold to
           the next screen comes into view — pinned to Heal while the screen
           below is on another pillar, a ground still at full strength ended
           dead at that boundary and drew a line across it.

           A timed transition cannot do the outgoing half: its value lags the
           scroll by its own duration, so a fast flick reaches the fold with
           Heal still up. Ramping against progress is exact at every frame. */
        const bloomProgress = span > 0 ? -r.top / span : 1;
        const ramp = (v: number, from: number, to: number) =>
          Math.max(0, Math.min(1, (v - from) / (to - from)));
        groundRef.current.style.opacity = (
          ramp(bloomProgress, 0.24, 0.3) * (1 - ramp(bloomProgress, 0.95, 1))
        ).toFixed(3);

        /* THE WALK THROUGH THE ROOMS. Each room owns the stretch between its
           own vertical taking over and the next one doing so, and the two
           crossfade across a short overlap at the handover. Driven per frame
           from the scrub rather than by a CSS transition, for the same reason
           the ground's fade is: a timed transition lags the scroll by its own
           duration, so a fast flick arrives at the next room with the last
           one still on screen.

           The plates drift as the room is crossed, each at its own rate —
           that differential IS the parallax, and it is the whole reason the
           wall reads as depth rather than as three stuck rectangles. */
        const FADE = 0.035;
        for (let i = 0; i < ROOM_IDS.length; i++) {
          const room = roomRefs.current[i];
          if (!room) continue;
          const from = VERTICAL_SEQUENCE[i].at;
          const to = VERTICAL_SEQUENCE[i + 1].at;
          const inK = ramp(bloomProgress, from - FADE, from + FADE);
          const outK = ramp(bloomProgress, to - FADE, to + FADE);
          const live = inK * (1 - outK);
          room.style.opacity = live.toFixed(3);
          /* Rooms arrive from below and leave upward — one continuous
             vertical stream, so the handover reads as walking on rather
             than as two unrelated blocks swapping. */
          room.style.transform = `translateY(${((1 - inK) * 26 - outK * 26).toFixed(1)}px)`;
          room.dataset.live = live > 0.5 ? 'true' : 'false';

          const local = (bloomProgress - from) / (to - from);
          const wall = WALLS[ROOM_IDS[i]] ?? [];
          (plateRefs.current[i] ?? []).forEach((plate, j) => {
            const slot = wall[j];
            if (!plate || !slot) return;
            plate.style.transform =
              `translateY(${(local * slot.rate).toFixed(1)}px) rotate(${slot.tilt}deg)`;
          });
        }

        /* Which vertical the screen is wearing: the last one whose petal has
           begun to open. Written only when it CHANGES — the 880ms ease on
           --lotus-a/--lotus-b is what turns each step into a fade, and
           rewriting the same pair every frame would restart that ease on
           every frame and leave the colour permanently mid-transition. */
        let stage = 0;
        for (let i = VERTICAL_SEQUENCE.length - 1; i >= 0; i--) {
          if (bloomProgress >= VERTICAL_SEQUENCE[i].at) { stage = i; break; }
        }
        if (stage !== stageRef.current && stageElRef.current) {
          stageRef.current = stage;
          const { a, b } = VERTICAL_SEQUENCE[stage];
          stageElRef.current.style.setProperty('--lotus-a', a);
          stageElRef.current.style.setProperty('--lotus-b', b);

          /* Light every vertical up to and including the one now showing, and
             darken the rest — so scrubbing BACKWARDS unlights them too. */
          legendRefs.current.forEach((li, i) => {
            if (!li) return;
            li.dataset.on = bloomProgress >= VERTICAL_SEQUENCE[i].at ? 'true' : 'false';
          });
        }
      }
    };
    const invalidate = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
    };
  }, []);

  return (
    <section
      id="pillars-section"
      ref={trackRef}
      aria-label="Our work"
      className="snap-screen lotus-track relative z-10 w-full"
    >
      <div
        ref={stageElRef}
        className="lotus-stage sticky top-0 h-screen w-full flex items-end justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[96px] pb-0 overflow-hidden"
      >
        <div
          ref={groundRef}
          aria-hidden="true"
          className="lotus-ground absolute inset-0 pointer-events-none"
          style={{
            opacity: 0,
            willChange: 'opacity',
          }}
        />

        {/* Ambient rings, borrowed verbatim from the hero's wheel
            (`border-dashed border-white/15`) so this screen sits in the same
            sky as the one above it rather than inventing its own. */}
        <HallEntrance ref={entranceRef} postRef={postRef} stageRef={stageElRef} />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 bottom-[-38vh] -translate-x-1/2 w-[96vh] h-[96vh] rounded-full border border-dashed border-white/10" />
          <div className="absolute left-1/2 bottom-[-52vh] -translate-x-1/2 w-[132vh] h-[132vh] rounded-full border border-dashed border-white/[0.07]" />
        </div>

        {/* THE SCREEN IS A PAGE, not a pause. Every other screen on this site
            opens with a script eyebrow, a headline and a line of copy; this
            one used to be an emblem alone on a colour field, which read as a
            divider or a loading state rather than as part of the site.

            The copy sits left and the emblem stands right, still flush to the
            floor of the screen — that footing is deliberate and predates this
            layout, so the two-column arrangement was built around it rather
            than over it. */}
        <div className="relative z-10 h-full w-full max-w-[1560px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-[88px] pb-0 flex flex-col">
          <div className="flex-1 min-h-0 relative">
          {/* Fills the rooms box. `self-stretch` was left over from when the
              parent was a grid; as a plain block child it does nothing, the
              box collapsed to zero height, and the rooms — absolutely placed
              inside it — had nothing to centre against and rode up under the
              header. */}
          <div className="lotus-copy absolute inset-0">
            {ROOM_IDS.map((id, i) => {
              const pillar = PILLARS.find((x) => x.id === id)!;
              const acts = activitiesFor(id);
              return (
                <div
                  key={id}
                  ref={(el) => {
                    roomRefs.current[i] = el;
                  }}
                  className="lotus-room"
                  aria-hidden={undefined}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.46fr)_minmax(0,1fr)] gap-5 md:gap-8 lg:gap-12 items-center">
                    {/* the wall label */}
                    <div className="min-w-0">
                      <p className="font-artistic-display text-[10px] sm:text-[11px] tracking-[0.2em] text-white/60 mb-1.5">
                        ROOM {i + 1} OF {VERTICAL_SEQUENCE.length}
                      </p>
                      <p className="font-dancing-script pillar-script-name font-bold text-white leading-tight sm:leading-none mb-1 drop-shadow-md select-none">
                        {pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase()}
                      </p>
                      <h3 className="font-artistic-display text-white text-[21px] sm:text-[25px] md:text-[30px] md:leading-[36px] mb-3.5 drop-shadow-md">
                        {pillar.headline}
                      </h3>

                      {/* All four plaques, not two. The wall label is the
                          other half of what a room is for, and the space
                          is there now that the emblem has left the grid. */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3.5 max-w-[420px]">
                        {pillar.stats.map((st) => (
                          <div key={st.label} className="lotus-plaque px-3 py-2">
                            <p className="font-artistic-heading text-[19px] sm:text-[22px] font-bold text-white tracking-tight leading-none mb-1">
                              {st.value}
                            </p>
                            <p className="font-artistic-serif text-[11px] text-white/75 leading-tight">
                              {st.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="font-artistic-serif text-white/90 text-[13px] sm:text-[14px] leading-relaxed max-w-[400px] drop-shadow-sm">
                        {pillar.subText}
                      </p>
                    </div>

                    {/* the wall. Hung and tilted above md; below it there is
                        no room to hang anything, so the frames become a plain
                        row and the tilt is dropped rather than squeezed. */}
                    <div className="min-w-0">
                      {/* The wall is WIDE, and capped in vh. A tall box (it was 4/3) made the
                          room taller than the screen, and since the room is
                          centred the overflow went upward — the pillar's own
                          name ended up behind the header. The cap is what
                          guarantees the label always clears it. */}
                      <div className="hidden md:block relative w-full aspect-[16/10] max-h-[58vh]">
                        {acts.map((act, j) => {
                          const slot = (WALLS[id] ?? [])[j];
                          if (!slot) return null;
                          const art = act.images[0];
                          return (
                            <figure
                              key={act.id}
                              ref={(el) => {
                                (plateRefs.current[i] ??= [])[j] = el;
                              }}
                              className="lotus-plate absolute m-0"
                              data-empty={art ? 'false' : 'true'}
                              data-style={slot.style}
                              style={{
                                left: `${slot.x}%`,
                                top: `${slot.y}%`,
                                width: `${slot.w}%`,
                                height: `${slot.h}%`,
                                transform: `rotate(${slot.tilt}deg)`,
                              }}
                            >
                              {/* The whole piece is the control. A gallery
                                  does not put a button under a painting —
                                  you walk up to the work itself. */}
                              <button
                                type="button"
                                className="lotus-plate-hit"
                                onClick={() => setOpen(act)}
                                aria-label={`${act.title} — ${act.dataPoints.length} figures`}
                              >
                                <span className="lotus-plate-art">
                                  {art ? (
                                    <img src={art.src} alt={art.alt} loading="lazy" decoding="async" />
                                  ) : null}
                                </span>
                                <span className="lotus-plate-headline">
                                  <span className="lotus-plate-value">{act.headline.value}</span>
                                  <span className="lotus-plate-metric">{act.headline.label}</span>
                                </span>
                              </button>
                              <figcaption className="lotus-plate-label">
                                {act.title}
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>

                      {/* On a phone there is no wall to hang anything on, so
                          the room becomes a gallery shelf instead: the pieces
                          keep their frames and labels and are browsed
                          sideways. Six across a 375px screen would be 50px
                          each — thumbnails, not work. */}
                      <div className="md:hidden -mx-4 px-4 overflow-x-auto">
                        <div className="flex gap-4 pb-8 w-max">
                          {acts.map((act, j) => {
                            const slot = (WALLS[id] ?? [])[j];
                            const portrait = slot ? slot.h / slot.w > 1.9 : false;
                            const art = act.images[0];
                            return (
                              <figure
                                key={act.id}
                                className={`lotus-plate relative m-0 shrink-0 ${
                                  portrait ? 'w-[124px] aspect-[3/4]' : 'w-[172px] aspect-[4/3]'
                                }`}
                                data-empty={art ? 'false' : 'true'}
                                data-style={slot?.style ?? 'mat'}
                              >
                                <button
                                  type="button"
                                  className="lotus-plate-hit"
                                  onClick={() => setOpen(act)}
                                  aria-label={`${act.title} — ${act.dataPoints.length} figures`}
                                >
                                  <span className="lotus-plate-art">
                                    {art ? (
                                      <img src={art.src} alt={art.alt} loading="lazy" decoding="async" />
                                    ) : null}
                                  </span>
                                  <span className="lotus-plate-headline">
                                    <span className="lotus-plate-value">{act.headline.value}</span>
                                    <span className="lotus-plate-metric">{act.headline.label}</span>
                                  </span>
                                </button>
                                <figcaption className="lotus-plate-label">{act.title}</figcaption>
                              </figure>
                            );
                          })}
                        </div>
                      </div>

                      {/* the gallery's own line: how many pieces, and how
                          to see one properly */}
                      <p className="font-artistic-display text-white/55 text-[10px] tracking-[0.16em] uppercase mt-4">
                        {acts.length} works · select one for its figures
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* THE CENTREPIECE STANDS IN THE CORNER. It used to own a column,
              which cost the wall a third of the screen and left the room's
              own space half empty. Out of the grid it keeps its footing on
              the floor, holds the same corner in every room, and the plates
              spread across everything it gave up — PLATE_LAYOUT simply hangs
              nothing where it stands. */}
          <div
            ref={postRef}
            className="pointer-events-none absolute right-0 bottom-0 z-20 w-[92px] sm:w-[118px] lg:w-[150px] xl:w-[172px]"
          >
            <SncfLotus3D ref={lotusRef} maxWidth={172} className="ml-auto" />
          </div>
          </div>

          {/* THE FLOOR PLAN. Where you are in the exhibition, what is ahead,
              and — because it is the same list the ground walks through — a
              legend for the colour as well. It sits outside the rooms so it
              never fades with them: the plan stays on the wall while you move
              between rooms, which is the point of a plan. */}
          <ul className="lotus-legend flex items-stretch gap-1.5 sm:gap-2 list-none p-0 m-0 pb-3 sm:pb-4 shrink-0">
            {VERTICAL_SEQUENCE.map((v, i) => (
              <li
                key={LEGEND_LABELS[i]}
                ref={(el) => {
                  legendRefs.current[i] = el;
                }}
                data-on="false"
                style={{ '--legend-accent': v.b } as React.CSSProperties}
                className="flex-1 min-w-0 pt-2"
              >
                <span className="legend-bar block h-[3px] w-full rounded-full mb-1.5" />
                <span className="block font-artistic-display text-[9px] sm:text-[10.5px] font-semibold uppercase tracking-[0.14em] truncate">
                  {LEGEND_LABELS[i]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lit in the room's own colour: the piece keeps the wall it came off. */}
      <ActivityCase
        activity={open}
        accent={
          VERTICAL_SEQUENCE[Math.max(0, ROOM_IDS.indexOf(open?.pillarId ?? 'heal'))] ?? {
            a: VERTICAL_SEQUENCE[0].a,
            b: VERTICAL_SEQUENCE[0].b,
          }
        }
        onClose={() => setOpen(null)}
      />
    </section>
  );
};
