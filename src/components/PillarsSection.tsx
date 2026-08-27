import React, { useEffect, useRef } from 'react';
import { PillarState } from '../types';
import { SncfLotus3D, SncfLotus3DHandle } from './SncfLotus3D';
import { PILLARS } from '../data/pillars';
import { DEVOTIONAL_ACCENT } from './DevotionalPhotoCard';
import { activitiesFor, Activity } from '../data/activities';
import { ActivityCase } from './ActivityCase';
import { GalleryCatalogue } from './GalleryCatalogue';
import { STAGE_MID, glideWindowTo } from './ExhibitionNav';
import { HallEntrance, HallEntranceHandle } from './HallEntrance';
import { LOGO_PETALS } from './logoShapes';
import { LOGO_INK, isDotShape } from './petalArt';

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
/* What each ROOM is CALLED on the rail — straight from PILLARS, so they
   cannot drift from the verticals. The fifth stage (the devotional rose)
   is deliberately NOT listed: it is the exhibition's farewell, not a stop,
   and the emblem itself — the hand holding the globe — stands in the
   rail's fifth place instead (see the ul's right padding below). */
const LEGEND_LABELS = ['HEAL', 'ENRICH', 'EMPOWER', 'PROJECTS'];


/** THE ARCH'S GEOMETRY, shared by the ambient ring and the lettering laid
    along it — one object so the two can never drift apart. The inscription
    only works because it sits exactly on a line already on screen, and that
    stops being true the moment either side is sized independently.

    `min(96vh, 96vw)` rather than a flat 96vh. On any landscape viewport the
    height term wins and this is identical to what it always was; on a
    portrait or mobile one, 96vh is far wider than the screen, so the arch's
    shoulders — and with them the first and last words of the name — fall off
    both edges and are clipped away by the overflow-hidden parent.

    The bottom offset then has to follow the size, or clamping just drops the
    arch to the floor. Solving `apex = H - bottom - size` for a crown that
    stays at 42% of the stage height gives `bottom = 58vh - size`, which
    reduces to the original -38vh whenever the height term wins. */
/** MONUMENTAL, not diagrammatic. The first gate was min(96vh, 96vw) with
    its crown at 42% of the stage — a drawing of an arch, comfortably inside
    the screen. A real gate is not comfortably inside your view as you reach
    it; it takes the view over. So the crown now rides just under the header
    (16vh) and the diameter runs to 190vh — on a landscape screen the
    springing falls at or below the floor and the shoulders leave both edges,
    which is exactly how an arch looks from a few steps away. The vw term
    still governs portrait screens, where the whole gate stays in frame. */
const GATE_SIZE = 'min(190vh, 118vw)';
/** The gate's floor. Sits just above the stage's foot; the floor plan that
    used to occupy this strip is hidden until the first room opens. */
const GATE_FLOOR = '34px';
/** The SPRINGING LINE — where the arch stops rising and its piers begin,
    which on a circle is its widest point. With the crown pinned at 16vh from
    the top this sits at `84vh - size/2` off the floor — on large landscape
    screens that is at or below zero, and the piers simply vanish (their
    height is clamped): the arch itself reaches the ground, as a monument's
    does when you stand this close. */
const GATE_SPRING = `calc(84vh - ${GATE_SIZE} / 2)`;

const GATE_ARCH_BOX: React.CSSProperties = {
  width: GATE_SIZE,
  height: GATE_SIZE,
  bottom: `calc(84vh - ${GATE_SIZE})`,
};

/** Piers and sill share one line: SOLID, like the band's own edges — the
    dashes belonged to the sky's ambient rings, and borrowing them made the
    built gate read as another piece of atmosphere. */
const GATE_LINE = '1px solid rgb(255 255 255 / 0.22)';

/** ALL FIVE PETALS DRAW THE GATE. When the flower dissolves, none of its
    petals simply vanish — the whole flower goes to work, in the formation
    the artwork itself suggests:

    - `heal` and `empower` LEAD, one down each side, riding the two reveal
      fronts.
    - `welcome` and `projects` — the outermost, widest petals — TRAIL their
      side's leader (`lag`), a second brush loading the stroke behind the
      first, both arriving at the springings together.
    - `enrich`, the tall centre petal, does not travel: it strikes the
      CROWN — the first touch of paint the arch receives — and dissolves
      into the band as the two teams carry the stroke away from it.

    `c` is each petal's centre in the emblem's user space (from the geometry
    pass that measured every bounding box) — the pivot the flight transform
    spins and scales about, so a petal travels centred on the band rather
    than swinging around a corner of itself. */
const GATE_BRUSHES = [
  { id: 'heal', side: -1, lag: 0, sc: 0.105, c: { x: 215.1, y: 227.9 } },
  { id: 'welcome', side: -1, lag: 0.18, sc: 0.088, c: { x: 194.6, y: 267.1 } },
  { id: 'empower', side: 1, lag: 0, sc: 0.105, c: { x: 295.9, y: 233.8 } },
  { id: 'projects', side: 1, lag: 0.18, sc: 0.088, c: { x: 303.9, y: 270.0 } },
  { id: 'enrich', side: 0, lag: 0, sc: 0.1, c: { x: 252.5, y: 229.3 } },
].map((b) => ({
  ...b,
  /* HEADLESS on purpose: the dots left the flower before the brushes did —
     they consolidated into the palm's globe (HallEntrance) — so a brush
     flying with its head still on would contradict the scene the reader
     just watched. */
  shapes: LOGO_PETALS.find((pp) => pp.id === b.id)!.shapes.filter((sh) => !isDotShape(sh.d)),
}));

/** NO ORNAMENT AT ALL. Three rounds have been tried on this band and
    removed — coloured figures, engraved buds with voussoir joints, then a
    single keystone emblem — and each was still treating the band as a
    surface to decorate. What replaced them is not a mark but an EVENT: the
    gate is drawn by the light of the merge itself (see the reveal mask
    below), and a thing whose whole character is "made of light" reads
    wrong with anything carved on it. The band is a graduated ribbon, lit
    from its crown, edged in two hairlines, and otherwise empty. */

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
  /* The doorway's shadow — see .lotus-threshold-shade. */
  const thresholdShadeRef = useRef<HTMLDivElement | null>(null);
  /* The dark of the hall between walls — see the camera block. */
  const hallVoidRef = useRef<HTMLDivElement | null>(null);
  /* The closing farewell, written under the emblem — see closing blocks. */
  const farewellRef = useRef<HTMLDivElement | null>(null);
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
  const gateTextRef = useRef<SVGSVGElement | null>(null);
  const legendListRef = useRef<HTMLUListElement | null>(null);
  /* The gate's own clock. Latched the moment the merge completes; from
     there the burst and the brushstroke run on TIME, so the reader who
     stops scrolling at the merge still watches the gate paint itself. */
  const gateAnimRef = useRef({ latched: false, start: 0 });
  const gateBrushRefs = useRef<(SVGGElement | null)[]>([]);
  const gateReducedRef = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  /* The emblem's corner container — the seal's landing point. */
  const postRef = useRef<HTMLDivElement | null>(null);
  /* Which piece the visitor has stepped up to. State, not a ref: this is a
     click, not the scroll path, so a re-render here costs nothing. */
  const [open, setOpen] = React.useState<Activity | null>(null);
  /* The catalogue — every room's works at once, browsed instead of walked.
     Stays open underneath an open ActivityCase (see GalleryCatalogue). */
  const [catalogueOpen, setCatalogueOpen] = React.useState(false);
  /* AN ACTIVITY'S OWN WALL, hung in place of the room's. Selecting a work on
     a desktop wall (or its station on the rail) no longer opens the popup
     case — the room re-hangs itself with that work's photographs and every
     figure the report gives it, and a Back control restores the room. Keyed
     by room so it only ever replaces the wall it belongs to. The popup
     ActivityCase remains for the catalogue and the phone shelf, where there
     is no wall to re-hang. */
  const [wallView, setWallView] = React.useState<{ room: number; act: Activity } | null>(null);

  useEffect(() => {
    if (!wallView) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !document.querySelector('.activity-case') &&
        !document.querySelector('.gallery-catalogue')
      )
        setWallView(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [wallView]);

  /* THE SMART NAVIGATOR'S one request arrives as a DOM event: the control
     lives at root (SectionJumpButton) while the catalogue lives here, and
     threading a callback up through App would re-render trees that must
     stay quiet on the scroll path. */
  useEffect(() => {
    const onCatalogue = () => setCatalogueOpen(true);
    window.addEventListener('sncf:open-catalogue', onCatalogue);
    return () => {
      window.removeEventListener('sncf:open-catalogue', onCatalogue);
    };
  }, []);

  /* The legend's stops: glide the scrub to a stage's mid-point — same
     targets, same pace, same interrupt rules as the navigator's arrows. */
  const glideToStage = React.useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const span = r.height - (window.innerHeight || 1);
    glideWindowTo(
      window.scrollY + r.top + STAGE_MID[i] * span,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);
  const plateRefs = useRef<(HTMLDivElement | null)[][]>([]);
  /* The hall pan is pure garnish — under reduced motion the rooms keep the
     plain crossfade. Cached once; the media query rarely changes mid-visit. */
  const reducedPanRef = useRef<boolean>(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

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
      const gClampOuter = (v: number, a: number, b: number) =>
        Math.max(0, Math.min(1, (v - a) / (b - a)));
      lotusRef.current?.updateProgress(scrub, covered);
      /* The entrance is updated AFTER the gate block below, so it can be
         handed the gate's clock-driven paint progress — the flower's
         dissolve follows the brush, and the two can never disagree. */
      let gateFormShared = 1 - Math.pow(1 - gClampOuter(scrub, 0.05, 0.13), 3);

      /* THE HERO FALLS BACK as the exhibition rises over it.

         Without this the hero simply slides away and the next screen slides
         in — two flat planes passing, no relationship between them. Easing
         it back into depth instead makes the exhibition read as arriving in
         FRONT of the hero rather than merely after it, which is the whole
         point of giving this handover a full viewport of scroll.

         Written straight to the hero's DOM by id, exactly as the entrance
         already does for the lotus watermark, and for the same reason:
         routing it through React state would re-render that entire tree on
         the scroll path. It starts at 0.12 rather than 0 so it does not
         begin while the petals are still lifting off the hero's own
         artwork — that handover finishes by 0.09, and the hero must hold
         still underneath it. Restored on the way back up because `covered`
         runs backwards too. */
      const heroStage = document.getElementById('hero-clone-stage');
      if (heroStage) {
        const t = Math.max(0, Math.min(1, (covered - 0.12) / 0.88));
        const k = 1 - Math.pow(1 - t, 3);
        heroStage.style.transform = `scale(${(1 - 0.06 * k).toFixed(4)})`;
        heroStage.style.opacity = (1 - 0.55 * k).toFixed(3);
      }

      /* THE GATE'S INSCRIPTION lives in the PAUSE — the stretch after the
         entrance panel has gone and before the first room arrives, which
         until now was dead scroll with nothing in it but the emblem.

         The window is bounded by two timings that already exist and must
         not be crowded: HallEntrance's panel is clear by scrub 0.08
         (THRESHOLD_END * 0.8), and Heal's ground begins its crossfade at
         VERTICAL_SEQUENCE[0].at - FADE = 0.205. So this opens at 0.085 and
         is gone by 0.20, holding the screen alone in between rather than
         double-printing against either neighbour — the mistake the
         foundation card made when it ran to 0.4 and sat on top of Heal's
         own headline. Inlined rather than shared with `ramp` below, which
         is declared later in this function and is not in scope yet. */
      if (gateTextRef.current) {
        const gClamp = (v: number, a: number, b: number) =>
          Math.max(0, Math.min(1, (v - a) / (b - a)));
        /* THE FLOWER PAINTS THE GATE. The rise finishes at scrub 0.05 and
           the dissolve begins (HallEntrance) — crossing 0.05 LATCHES a
           clock, and the two ghost-white sweeps run from the crown to both
           springings in one 1.6s pull, ON TIME rather than on scrub: a
           reader who stops right there still watches the flower spend
           itself into the arch. The scroll term stays underneath as a
           floor (max of the two), so a fast flick is never waiting on the
           clock; rolling back above the rise unlatches everything for a
           clean replay. While the clock runs, read() re-schedules itself —
           the one deliberate exception to "frames only on scroll", and it
           expires with the animation. */
        const anim = gateAnimRef.current;
        const now = performance.now();
        if (scrub >= 0.05 && scrub < 0.5 && !anim.latched) {
          anim.latched = true;
          anim.start = now;
        } else if (scrub < 0.03 && anim.latched) {
          anim.latched = false;
        }
        let clockForm = 0;
        if (anim.latched) {
          const t = (now - anim.start) / 1000;
          clockForm = gateReducedRef.current ? 1 : gClamp(t, 0.1, 1.7);
          if (t < 1.85 && !raf) raf = requestAnimationFrame(read);
        }
        const formRaw = Math.max(clockForm, gClamp(scrub, 0.05, 0.13));
        const gateForm = 1 - Math.pow(1 - formRaw, 3);
        gateTextRef.current.style.setProperty('--gate-form', gateForm.toFixed(4));

        /* The texts follow the BRUSH, not the scroll: they write on as the
           stroke finishes, however it got there. */
        const gateIn = gClamp(gateForm, 0.78, 1);
        const gateOut = gClamp(scrub, 0.17, 0.2);
        gateTextRef.current.style.opacity = ((anim.latched || scrub >= 0.05 ? 1 : 0) * (1 - gateOut)).toFixed(3);
        gateTextRef.current.style.setProperty('--gate-in', gateIn.toFixed(3));
        gateFormShared = gateForm;

        /* THE BRUSHES FLY THE ARC. Each petal rides its side's reveal
           front: angle from the crown = form * 90deg, position on the
           band's centreline (r 41.25), rotation keeping the petal tangent
           to the arc — upright at the crown, lying along the band by the
           springing. They appear as the flower dissolves (the petals
           leaping out of it) and are spent in the last tenth of the pull,
           exactly where the paint ends. setAttribute rather than CSS
           transform: SVG geometry attributes dodge the transform-box
           ambiguity that bit this codebase twice already. */
        GATE_BRUSHES.forEach((b, i) => {
          const el = gateBrushRefs.current[i];
          if (!el) return;
          const alive = (anim.latched || scrub >= 0.05) && scrub < 0.5 ? 1 : 0;
          const fadeIn = Math.min(1, gateForm * 14);
          if (b.side === 0) {
            /* The crown keeper: plants the first paint at the apex, then
               dissolves into the band as the teams carry the stroke away. */
            el.setAttribute(
              'transform',
              `translate(50 8.75) scale(${b.sc}) translate(${(-b.c.x).toFixed(1)} ${(-b.c.y).toFixed(1)})`,
            );
            const spendC = Math.min(1, Math.max(0, (0.62 - gateForm) * 4));
            el.setAttribute('opacity', (alive * 0.88 * fadeIn * spendC).toFixed(3));
            return;
          }
          /* Trailers run the same arc a fixed lag behind their leader and
             close the gap by the springing, so the pair lands together. */
          const eff = Math.max(0, gateForm - b.lag) / (1 - b.lag);
          const th = (eff * Math.PI) / 2;
          const bx = 50 + b.side * 41.25 * Math.sin(th);
          const by = 50 - 41.25 * Math.cos(th);
          const rot = b.side * 90 * eff;
          el.setAttribute(
            'transform',
            `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${b.sc}) translate(${(-b.c.x).toFixed(1)} ${(-b.c.y).toFixed(1)})`,
          );
          const spend = Math.min(1, Math.max(0, (1 - gateForm) * 9));
          el.setAttribute('opacity', (alive * 0.88 * fadeIn * spend).toFixed(3));
        });

        /* The floor plan arrives WITH Heal's ground (0.205), not before:
           same ramp as the room's own fade-in, so map and room read as one
           arrival. It stays for the rest of the track — a plan is no use if
           it leaves the wall between rooms. */
        if (legendListRef.current) {
          /* ...and it leaves as the exit begins: the closing floor belongs
             to the emblem and the farewell alone. */
          const legendVis = gClamp(scrub, 0.2, 0.24) * (1 - gClamp(scrub, 0.8, 0.87));
          legendListRef.current.style.opacity = legendVis.toFixed(3);
          /* The legend is clickable now (each label glides to its stage),
             but it sits inside the pointer-events-none column — so it arms
             itself only while it is actually readable, never as an
             invisible strip of click targets over the gate's floor. */
          legendListRef.current.style.pointerEvents = legendVis > 0.5 ? 'auto' : 'none';
        }

        /* THE EXIT IS NOT THE GATE AGAIN. It used to be — the same doorway
           rushed back and stood itself up with the farewell written on it —
           but a doorway met twice is a corridor, not an exhibition. Now the
           gate is walked through exactly once, and the leaving is CLOSING
           TIME instead: the rail folds away, the emblem the whole journey
           assembled steps to the centre of the floor, and the farewell is
           written beneath it — see the closing blocks below. */
        gateTextRef.current.style.setProperty('--gate-exit', '0');

        if (scrub > 0.5) {
          gateTextRef.current.style.opacity = '0';
        } else {
          /* WALKING THROUGH IT. The gate does not shrink away or simply
             fade — it GROWS past the edges of the screen, which is what
             passing under a real arch looks like from underneath.

             Two things make it read as movement rather than a zoom effect.
             It arrives slightly small (0.94) and settles to true size as it
             lights, so the reader is already closing on it before it opens;
             and the exit is cubed rather than linear, so it hangs at nearly
             full size and then rushes — the way a doorway does in the last
             stride before you are under it. By 0.2 it is transparent and by
             0.205, when Heal's ground begins, it is gone entirely. */
          const approach = 0.94 + 0.06 * gateForm;
          const through = 1 + 1.35 * Math.pow(gClamp(scrub, 0.16, 0.21), 3);
          gateTextRef.current.style.transform = `scale(${(approach * through).toFixed(4)})`;
        }
      }

      entranceRef.current?.update(covered, scrub, gateFormShared);
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

        /* THE HAND STAYS DOWN AT THE DOOR. On the "Our work" screen the
           corner post stood there from the first frame, palm already out —
           which pre-empted the sequence it belongs to. Now the post rises
           with the threshold itself: hidden at scrub 0, fully up by 0.045 —
           just before the consolidated head lands on the palm at 0.046, so
           the hand is always there to catch it. Scroll-driven both ways, so
           walking back to the door lowers it again. */
        if (postRef.current) {
          const rise = ramp(scrub, 0.004, 0.045);
          const eased = 1 - Math.pow(1 - rise, 3);
          /* CLOSING TIME: past the last room the emblem leaves its terminus
             and takes the centre of the floor, growing as it goes. Offsets
             are computed from LAYOUT geometry (offsetLeft/Top), which
             transforms don't disturb, so the glide is stable however far
             along it is. */
          const closing = 1 - Math.pow(1 - ramp(scrub, 0.8, 0.9), 3);
          if (closing > 0) {
            const el = postRef.current;
            const parent = el.offsetParent as HTMLElement | null;
            if (parent) {
              const dx = parent.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
              const dy = parent.clientHeight * 0.34 - (el.offsetTop + el.offsetHeight / 2);
              el.style.transform =
                `translate(${(dx * closing).toFixed(1)}px, ${(dy * closing).toFixed(1)}px) ` +
                `scale(${(1 + 0.85 * closing).toFixed(3)})`;
            }
            el.style.opacity = '1';
          } else {
            postRef.current.style.opacity = eased.toFixed(3);
            postRef.current.style.transform = `translateY(${((1 - eased) * 48).toFixed(1)}px)`;
          }
        }

        /* The farewell writes on beneath the emblem once it has the floor. */
        if (farewellRef.current) {
          const fw = 1 - Math.pow(1 - ramp(scrub, 0.865, 0.93), 3);
          farewellRef.current.style.opacity = fw.toFixed(3);
          farewellRef.current.style.transform = `translateY(${((1 - fw) * 26).toFixed(1)}px)`;
        }

        /* STEPPING THROUGH THE DOOR. As the scroll carries the reader under
           the arch (the gate is at full loom around 0.19-0.24, just before
           Heal takes the screen), the edges of the view fall into the
           doorway's shadow and then open again inside the room — the light
           change of walking from outside to inside. A bell over the pass:
           product of the rise and the fall, so it is dark only IN the
           doorway, and scroll-driven, so a hand-scrolled entrance gets the
           same beat as the Enter glide. */
        if (thresholdShadeRef.current) {
          const bell = ramp(scrub, 0.175, 0.215) * (1 - ramp(scrub, 0.225, 0.275));
          thresholdShadeRef.current.style.opacity = bell.toFixed(3);
        }
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
        /* NO CROSSFADE, only a hairline at the boundary. The walls are
           seam-joined now (see the corner model below): at every moment of
           the turn the screen is partitioned between the two walls at the
           corner, so there is never a frame where fading is needed — and by
           the boundary the outgoing wall has swept entirely off screen, so
           its hairline fade is invisible housekeeping, not a visual. */
        const FADE_C = 0;
        const FADE = 0.006;

        /* THE CAMERA IN THE HALL. The four rooms are no longer a stack of
           slides — they are four WALLS arrayed left to right around the
           visitor (Heal leftmost, Projects rightmost), and progress is the
           camera turning across them. `cam` is the continuous room index
           the camera faces; each wall's transform is its signed distance
           from that gaze: the wall ahead stands off to the RIGHT, angled
           in perspective, sweeps across as the camera turns to it, and
           falls away to the LEFT once passed. BASE_YAW keeps each wall's
           own set even when faced — Heal always reads as the hall's left
           wall, Projects its right — which is what makes this a room you
           stand in rather than a carousel. Clamped at Heal so stepping
           through the gate lands facing the first wall, not mid-swing. */
        /* The camera DWELLS, then TURNS: through the first 45% of a room's
           stretch it holds square on that wall (the navigator's arrows park
           inside the hold), then the turn to the next wall plays across the
           remaining 55% — a slower, longer pan than the first cut of this
           effect — smoothstepped so it gathers and settles gently. */
        /* ENTERING COUNTS AS A TURN TOO. Below Heal's threshold the camera
           sits at -1 and rises to 0 across the gate-to-Heal walk (0.205 to
           0.24) — so the FIRST wall arrives exactly like every later one:
           hinged at the corner, left edge deep, unfolding square as the
           visitor steps in. Without this, Heal alone faded in flat, the one
           wall that skipped the hall's own geometry. */
        /* ...and the FIRST unfold is the slowest of all: it spans 0.19 to
           0.275 of the scrub — two and a half times the width of an
           ordinary turn's window — so under the Enter glide Heal's wall
           spends nearly five seconds swinging from the corner to square,
           finishing exactly as the doorway's shadow lifts (the shade's
           fall ends at 0.275 too). The camera is allowed to settle AFTER
           the room's semantic threshold (0.24): dwell interaction begins
           while the wall makes its last few degrees, and the hold before
           the next turn (0.305) leaves that overhang room. */
        let cam = 0;
        for (let k = 0; k < ROOM_IDS.length; k++) {
          const f = VERTICAL_SEQUENCE[k].at;
          const t = VERTICAL_SEQUENCE[k + 1].at;
          if (bloomProgress >= f) {
            const lr = Math.max(0, Math.min(1, (bloomProgress - f) / (t - f)));
            const turn = Math.max(0, Math.min(1, (lr - 0.45) / 0.55));
            /* Smootherstep, not smoothstep: zero acceleration at both ends
               as well as zero velocity, so the pan gathers and settles with
               no perceptible kick — the slow, heavy head-turn of a person,
               not a device. */
            cam = k + turn * turn * turn * (turn * (turn * 6 - 15) + 10);
          }
        }
        /* Applied AFTER the loop, because the loop clamps cam to 0 the
           moment Heal's threshold passes — which would snap the entering
           wall square at 0.24 instead of letting it finish its long swing.
           The override hands back seamlessly: both sides read 0 at 0.275. */
        if (bloomProgress < 0.275) {
          const e = ramp(bloomProgress, 0.19, 0.275);
          cam = -1 + e * e * e * (e * (e * 6 - 15) + 10);
        }
        /* How deep into the turn we are, as a bell: 0 facing a wall, 1 at
           the corner's midpoint. Drives the fold's depth and the void.
           (Double-mod, because JS % keeps the sign and the entry camera is
           negative.) */
        const camF = ((cam % 1) + 1) % 1;
        const fold = 4 * camF * (1 - camF);

        for (let i = 0; i < ROOM_IDS.length; i++) {
          const room = roomRefs.current[i];
          if (!room) continue;
          const from = VERTICAL_SEQUENCE[i].at;
          const to = VERTICAL_SEQUENCE[i + 1].at;
          const inK = ramp(bloomProgress, from - FADE_C - FADE, from - FADE_C + FADE);
          const outK = ramp(bloomProgress, to - FADE_C - FADE, to - FADE_C + FADE);
          /* `live` is the SEMANTIC window — which wall owns interaction and
             the spotlight — and keeps its boundary edges. What the eye sees
             is decided by the camera instead: in the corner model a wall is
             simply THERE, opaque, from the moment the turn brings it toward
             the screen until it has swung fully off (|pan| past ~1.1, which
             is 108vw of travel — beyond the viewport by construction). The
             old boundary-windowed opacity left the incoming wall invisible
             for the entire swing. Reduced motion has no pan, so it keeps
             the plain crossfade. */
          const live = inK * (1 - outK);
          const apan = Math.abs(i - cam);
          /* Pan-visibility is clamped by ENTRY: before the rooms begin, the
             camera rests at 0 and Heal's pan is 0 — without this clamp its
             full-screen wall stood opaque over the door, hiding the "Our
             work" panel and the gate the reader is supposed to walk
             through. The walls exist only once Heal's ground does. */
          const roomsOn = ramp(bloomProgress, 0.205, 0.245);
          room.style.opacity = reducedPanRef.current
            ? live.toFixed(3)
            : (Math.max(0, Math.min(1, (1.18 - apan) / 0.06)) * roomsOn).toFixed(3);
          if (reducedPanRef.current) {
            room.style.transform = 'none';
          } else {
            /* THE CORNER MODEL. Real gallery walls meet at an edge, so the
               turn is built as one: the outgoing wall hinges around its
               RIGHT edge and the incoming wall around its LEFT, and both
               translate by the same d*108vw — which keeps those two hinge
               edges riding together as a single CORNER LINE that sweeps
               across the screen. At every instant the screen is split at
               that line: outgoing wall to its left, incoming to its right.
               Nothing overlaps (the seam partitions the view; the few vw of
               surface bleed tuck under the later-painted room), nothing
               fades mid-turn, and each wall shades darker the further past
               the corner it turns (--wall-shade, the ::after) — which is
               just what walls do as they fall out of the light. */
            /* THE FOLD HAS DEPTH. Besides hinging at the shared corner,
               BOTH walls ride a common translateZ that deepens with the
               fold bell — at the corner's midpoint the whole joint stands
               ~340px further from the camera than a faced wall does. The
               hinge sign makes the corner CONCAVE — each wall's OUTER edge
               swings toward the viewer while the shared seam stays deep —
               so the joint reads as the inside of the room's corner (the
               bow-tie of the sketch: tall outer edges, short far seam),
               not a ridge poking out at the reader. Outermost in the
               transform chain, so the push is in CAMERA space. */
            /* THE SEAM IS EXACT BY CONSTRUCTION. Hinges sit on the wall
               SURFACE's viewport edges — calc(50% ± 50vw) of the content
               box, i.e. the screen's own left/right lines — and the step is
               exactly 100vw. So the outgoing wall's right hinge and the
               incoming wall's left hinge are the SAME line at every pan
               value and every viewport width: out = 100vw − p·100vw,
               in = (1−p)·100vw. Identical. The old box-edge hinges plus a
               108vw step could never coincide (the content box is narrower
               than the screen and its width varies), which is where the
               overlapping double-edge came from. */
            const pan = Math.max(-1.2, Math.min(1.2, i - cam));
            room.style.transformOrigin =
              pan >= 0 ? 'calc(50% - 50vw) center' : 'calc(50% + 50vw) center';
            room.style.transform =
              `translateZ(${(-fold * 520).toFixed(1)}px) ` +
              `translateX(${(pan * 100).toFixed(2)}vw) ` +
              `rotateY(${(-pan * 64).toFixed(2)}deg)`;
            room.style.setProperty('--wall-shade', (Math.min(1, Math.abs(pan)) * 0.55).toFixed(3));
          }
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

        /* THE DARK BETWEEN WALLS. Each room is now an opaque coloured panel
           (see .lotus-room's wall surface), and while the camera is turning
           — both panels in motion, neither holding the screen — the ground
           behind them goes to black, so two lit walls visibly swing through
           a dark hall instead of dissolving into a same-coloured backdrop.
           `4f(1-f)` is a bell over the camera's fraction: zero whenever the
           camera faces a wall, full at the midpoint of a turn. */
        if (hallVoidRef.current) {
          hallVoidRef.current.style.opacity = ((reducedPanRef.current ? 0 : fold) * 0.88).toFixed(3);
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
            /* `on` is cumulative — every stage already walked stays lit.
               `current` is exclusive — the one room the reader stands in —
               and it is what unfolds that stop's works row beneath the
               label (see .legend-works). */
            const nextAt = VERTICAL_SEQUENCE[i + 1]?.at ?? 1.01;
            li.dataset.current =
              bloomProgress >= VERTICAL_SEQUENCE[i].at && bloomProgress < nextAt
                ? 'true'
                : 'false';
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
      /* NOT a snap point, unlike every other screen. `scroll-snap-align:
         start` would put a snap target where this track's top meets the
         viewport top — which is exactly `covered === 1`, the END of the
         approach. So resting anywhere mid-approach, while the petals are
         still lifting off the hero's artwork and gathering, let proximity
         snap yank the reader forward through the rest of that flight. The
         other sections are screens and snap correctly; this is a 620vh
         scrub track, not a screen, and it has to be restable at any point
         along its length. */
      className="lotus-track relative z-10 w-full"
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

        {/* The hall's dark, exposed between walls mid-turn. Above the
            ground, below every stacked layer. */}
        <div
          ref={hallVoidRef}
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: '#04060a', opacity: 0, willChange: 'opacity' }}
        />

        {/* The doorway's shadow — a vignette that closes over the view as
            the reader passes under the arch and lifts inside Heal. Above
            the ground and the gate, below nothing interactive. */}
        <div
          ref={thresholdShadeRef}
          aria-hidden="true"
          className="lotus-threshold-shade absolute inset-0 pointer-events-none z-30"
          style={{ opacity: 0, willChange: 'opacity' }}
        />

        {/* CLOSING TIME's farewell — under the emblem holding centre floor,
            above the house dimmer. */}
        <div
          ref={farewellRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[58%] -translate-x-1/2 z-40 pointer-events-none text-center w-[min(640px,88vw)]"
          style={{ opacity: 0, willChange: 'opacity, transform' }}
        >
          <p className="font-artistic-display text-white/75 text-[10.5px] sm:text-[12px] tracking-[0.26em] uppercase mb-3">
            Sant Nirankari Charitable Foundation
          </p>
          <p className="font-dancing-script text-[34px] sm:text-[44px] md:text-[52px] font-bold leading-none text-white drop-shadow-md">
            Thank You for Visiting
          </p>
        </div>

        <HallEntrance
          ref={entranceRef}
          postRef={postRef}
          stageRef={stageElRef}
          onBrowse={() => setCatalogueOpen(true)}
        />

        {/* Ambient rings, borrowed verbatim from the hero's wheel
            (`border-dashed border-white/15`) so this screen sits in the same
            sky as the one above it rather than inventing its own. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full border border-dashed border-white/10"
            style={GATE_ARCH_BOX}
          />
          <div className="absolute left-1/2 bottom-[-52vh] -translate-x-1/2 w-[132vh] h-[132vh] rounded-full border border-dashed border-white/[0.07]" />

          {/* THE GATE, lettered on the arch that is already there.

              Earlier attempts at this moment invented new geometry — a card,
              then a rainbow of arcs — and both read as something dropped on
              top of the screen. This draws on the ring the screen already
              has: same box, same centre, same radius, so the inscription
              curves along a line the reader has been looking at since the
              hero. It only has to be lettered to become a gate.

              Squared box (96vh x 96vh) against a square viewBox is what
              keeps the letterforms undistorted — a full-bleed SVG stretched
              to the stage would need preserveAspectRatio="none" and the type
              would smear with the viewport's aspect. */}
          <div
            ref={gateTextRef}
            className="absolute inset-0"
            style={{
              opacity: 0,
              willChange: 'transform, opacity',
              /* THE VANISHING POINT is the arch's own centre, not the middle
                 of the screen. `bottom: 84vh - size` puts the circle's centre
                 `84vh - size/2` above the stage floor, so measured from the
                 TOP that is `16vh + size/2`. Scaling about any other point
                 would slide the opening sideways as it grows, which reads as
                 the gate being pushed away rather than the reader moving
                 through it. */
              transformOrigin: `50% calc(16vh + ${GATE_SIZE} / 2)`,
            }}
          >

            {/* LIGHT IN THE OPENING. An arch drawn as a line is a line; an
                arch with light inside it is a doorway. Warmer at 66% down
                rather than dead centre, so the brightest part sits where a
                room beyond would actually be lit — at eye level through the
                opening, not up in the vault. */}
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                ...GATE_ARCH_BOX,
                background:
                  'radial-gradient(circle at 50% 66%, rgb(255 255 255 / 0.10) 0%, rgb(255 255 255 / 0.04) 42%, rgb(255 255 255 / 0) 68%)',
              }}
            />

            {/* LIGHT FALLING THROUGH IT, pooled on the floor between the
                piers. This is the cue that does the most work: a lit opening
                could still be a window, but light spilling out of it onto the
                ground in front is unmistakably something you walk through. */}
            <span
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: GATE_FLOOR,
                width: `calc(${GATE_SIZE} * 0.78)`,
                height: '22vh',
                background:
                  'radial-gradient(ellipse 52% 100% at 50% 100%, rgb(255 255 255 / 0.11) 0%, rgb(255 255 255 / 0.03) 45%, rgb(255 255 255 / 0) 72%)',
              }}
            />

            {/* THE PIERS. The arch used to simply stop where the ring curved
                out of frame, so it read as a circle passing behind the screen
                rather than a structure standing on it. These drop from the
                springing line to the floor and give it feet. */}
            <span
              className="absolute"
              style={{
                left: `calc(50% - ${GATE_SIZE} / 2)`,
                bottom: GATE_FLOOR,
                height: `max(0px, calc(${GATE_SPRING} - ${GATE_FLOOR}))`,
                borderLeft: GATE_LINE,
              }}
            />
            <span
              className="absolute"
              style={{
                left: `calc(50% + ${GATE_SIZE} / 2)`,
                bottom: GATE_FLOOR,
                height: `max(0px, calc(${GATE_SPRING} - ${GATE_FLOOR}))`,
                borderLeft: GATE_LINE,
              }}
            />

            {/* THE SILL — the line you cross. */}
            <span
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: GATE_FLOOR,
                width: GATE_SIZE,
                borderTop: GATE_LINE,
                opacity: 0.72,
              }}
            />

            <svg
              viewBox="0 0 100 100"
              className="absolute left-1/2 -translate-x-1/2"
              style={{ ...GATE_ARCH_BOX, overflow: 'visible' }}
            >
              <defs>
                {/* The name now runs LOW in the band, leaving the upper half
                    for the figures. Sweep flag 1, left point to right point:
                    in SVG's y-down space that is the arc over the TOP, so it
                    reads left-to-right and upright across the crown. */}
                <path id="lotus-gate-arc" d="M 9.5,50 A 40.5,40.5 0 0 1 90.5,50" fill="none" />

                {/* The band's own wash, in the artwork's inks left to right,
                    kept faint. The colour belongs to the FIGURES; if the band
                    itself carried it at strength the arch would compete with
                    the rooms it is a door to, and every room behind it is a
                    different colour. */}

                {/* A BEVEL ACROSS THE BAND'S DEPTH — bright at the outer edge,
                    shadowed at the inner. Radial, centred on the arch, so the
                    highlight follows the curve instead of running flat across
                    it. This is what stops the band reading as a flat ribbon
                    laid on the screen and makes it a moulding with a face and
                    a soffit, lit from outside the opening. */}
                <radialGradient id="lotus-gate-bevel" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                  {/* The shadow is a LIP, not a wash. At 0.20 black spread
                      across the inner third it greyed the whole band out —
                      the ink underneath stopped reading and the arch went
                      muddy instead of rich. Held to 0.09 and pulled tight
                      against the soffit (the band runs 0.72 to 1.0 in these
                      units) it does what a bevel should: turns the edge,
                      without dimming the face. */}
                  <stop offset="0.65" stopColor="#000" stopOpacity="0.09" />
                  <stop offset="0.71" stopColor="#000" stopOpacity="0.02" />
                  <stop offset="0.80" stopColor="#fff" stopOpacity="0.03" />
                  <stop offset="0.955" stopColor="#fff" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
                </radialGradient>


                {/* The same white rim the awakened flower wears (see
                    HallEntrance) — the brushes ARE those petals mid-flight,
                    and the rim is what keeps their colour crisp while they
                    cross five different inks of their own laying. This
                    viewBox maps ~17px to the unit, so the radius is small. */}
                <filter id="lotus-brush-outline" x="-15%" y="-15%" width="130%" height="130%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="0.07" result="fat" />
                  <feFlood floodColor="#ffffff" result="white" />
                  <feComposite in="white" in2="fat" operator="in" result="rim" />
                  <feMerge>
                    <feMergeNode in="rim" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* ALL FIVE INKS, SOLID, IN THE LOGO'S OWN ORDER — and the
                    order is not styling, it is PROVENANCE. The gradient runs
                    horizontally, so bent over the arch it reads: magenta at
                    the left springing, indigo at the crown, green at the
                    right springing. Which is exactly where each petal ends
                    its flight: `welcome` (magenta) finishes the left side,
                    `enrich` (indigo) strikes the crown, `projects` (green)
                    finishes the right. The band's colour at any point is
                    the ink of the petal that painted it. */}
                <linearGradient id="lotus-gate-band" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                  {LOGO_INK.map((c, i) => (
                    <stop
                      key={c}
                      offset={`${(i / (LOGO_INK.length - 1)) * 100}%`}
                      stopColor={c}
                      stopOpacity="0.96"
                    />
                  ))}
                </linearGradient>

                {/* THE BRUSHSTROKE. The mask is one stroke laid over the
                    band's full depth, drawn by dash-offset from the RIGHT
                    springing — the moon's side of the screen — across the
                    crown to the left: the gate is painted on in a single
                    pull of the brush, and the band (with the name riding
                    it) exists only where the brush has already been. The
                    round cap is the brush's own tip — a soft rounded front,
                    no glow: an earlier version pushed a blurred comet of
                    light along this edge, and it read as an effect ABOUT
                    the drawing rather than the drawing itself. A stroke
                    appearing behind a clean brush-tip edge needs no
                    announcement. pathLength=100 normalises the arc so the
                    offset arithmetic is in percent, not user units. */}
                <mask id="lotus-gate-reveal">
                  {/* TWO strokes now, not one: the flower dissolves at the
                      centre and its substance runs BOTH WAYS from the crown
                      down to the springings — the draw radiates from where
                      the flower stood, not from a corner. Each is half the
                      old sweep, so the whole gate still completes in the
                      same pull. */}
                  <path
                    d="M 50,8.75 A 41.25,41.25 0 0 0 8.75,50"
                    pathLength={100}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="19.5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: '100 102',
                      strokeDashoffset: 'calc((1 - var(--gate-form, 1)) * 101)',
                    }}
                  />
                  <path
                    d="M 50,8.75 A 41.25,41.25 0 0 1 91.25,50"
                    pathLength={100}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="19.5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: '100 102',
                      strokeDashoffset: 'calc((1 - var(--gate-form, 1)) * 101)',
                    }}
                  />
                </mask>

              </defs>

              {/* Everything the light draws — the band, its edges, and the
                  name riding it — lives under the reveal mask: none of it
                  exists until the merge's light has swept past. */}
              <g mask="url(#lotus-gate-reveal)">
                {/* THE BAND — an arch with thickness, which is the difference
                    between a drawn line and a built structure you pass under.
                    Outer edge at r=50 is exactly the ambient ring's own border,
                    so the gate grows out of the line already on screen.

                    Inner edge at 37.5 rather than a tighter 39: measured, the
                    figures occupy r 43.6-49.5 and the name's caps reach 42, so
                    a narrower band left about a third of a unit between them —
                    roughly three pixels, which is touching, not spacing. This
                    buys the inscription its own register beneath the row of
                    people instead of crowding into their feet. */}
                {/* The five-ink band (def above): solid enough to carry
                    white print, and every colour on it laid by the petal
                    that owns that colour. */}
                <path
                  d="M 0,50 A 50,50 0 0 1 100,50 L 82.5,50 A 32.5,32.5 0 0 0 17.5,50 Z"
                  fill="url(#lotus-gate-band)"
                />
                <path
                  d="M 0,50 A 50,50 0 0 1 100,50 L 82.5,50 A 32.5,32.5 0 0 0 17.5,50 Z"
                  fill="url(#lotus-gate-bevel)"
                />

                {/* BRISTLE LINES. What makes a stroke read as PAINT rather
                    than as a printed ribbon is the brush's own record: faint
                    striations running the length of the pull, heavier
                    toward the stroke's edges where a real brush deposits
                    more. Four hairline arcs, kept clear of the radii the
                    inscription occupies (35.3 to 45.7, measured per-glyph),
                    so the texture never sits under the letters. They live
                    inside the mask, so they are painted on with everything
                    else. */}
                {[
                  { r: 33.6, w: 0.5, o: 0.1 },
                  { r: 34.7, w: 0.22, o: 0.07 },
                  { r: 46.7, w: 0.26, o: 0.08 },
                  { r: 48.3, w: 0.55, o: 0.11 },
                ].map(({ r, w, o }) => (
                  <path
                    key={r}
                    d={`M ${50 - r},50 A ${r},${r} 0 0 1 ${50 + r},50`}
                    fill="none"
                    stroke={`rgb(255 255 255 / ${o})`}
                    strokeWidth={w}
                  />
                ))}

                {/* Both edges of the band, dashed to match the sky's own rings. */}
                {/* Two solid hairlines, nothing else on the edges. The dashes
                    this band used to wear belonged to the sky's ambient rings;
                    on the built gate they read as perforation, not trim. */}
                <path
                  d="M 0.4,50 A 49.6,49.6 0 0 1 99.6,50"
                  fill="none"
                  stroke="rgb(255 255 255 / 0.35)"
                  strokeWidth="0.1"
                />
                <path
                  d="M 17.5,50 A 32.5,32.5 0 0 1 82.5,50"
                  fill="none"
                  stroke="rgb(255 255 255 / 0.25)"
                  strokeWidth="0.09"
                />
                <text className="lotus-gate-text" textAnchor="middle">
                  <textPath href="#lotus-gate-arc" startOffset="50%">
                    SANT NIRANKARI CHARITABLE FOUNDATION
                  </textPath>
                </text>
              </g>

              {/* THE PETAL BRUSHES — see GATE_BRUSHES. Driven per frame
                  from the gate block (position along the arc, tangent
                  rotation, fade at the springing); nothing here but the
                  petal's own artwork in the flower's ghost white. Outside
                  the reveal mask, because the brush must be visible AHEAD
                  of the paint it is leaving behind. */}
              {GATE_BRUSHES.map((b, i) => (
                <g
                  key={b.id}
                  ref={(el) => {
                    gateBrushRefs.current[i] = el;
                  }}
                  opacity="0"
                  filter="url(#lotus-brush-outline)"
                >
                  {/* Each brush in ITS OWN ink — the artwork's original
                      fills, not a flat tint: the petal awakened into these
                      colours during the rise (HallEntrance), and paints
                      with what it is. */}
                  {b.shapes.map((sh, j) => (
                    <path key={j} d={sh.d} fill={sh.fill} />
                  ))}
                </g>
              ))}

              {/* Entrance reading, top to bottom: the motto, the journey the
                  five rooms will walk, the founding year. All suppressed by
                  --gate-exit so the same doorway can carry the farewell on
                  the way out without two readings printing over each other. */}
              <text
                x="50"
                y="28.5"
                textAnchor="middle"
                className="lotus-gate-motto font-dancing-script"
                style={{ opacity: 'clamp(0, calc((var(--gate-in, 1) - 0.45) * 4 - var(--gate-exit, 0) * 6), 1)' }}
              >
                Service with Humility
              </text>
              <text
                x="50"
                y="32.8"
                textAnchor="middle"
                className="lotus-gate-journey"
                style={{ opacity: 'clamp(0, calc((var(--gate-in, 1) - 0.5) * 4 - var(--gate-exit, 0) * 6), 1)' }}
              >
                JOURNEY BEGINS
              </text>
              <text
                x="50"
                y="36.2"
                textAnchor="middle"
                className="lotus-gate-since"
                style={{ opacity: 'clamp(0, calc((var(--gate-in, 1) - 0.55) * 4 - var(--gate-exit, 0) * 6), 1)' }}
              >
                SINCE 2010
              </text>

            </svg>
          </div>
        </div>

        {/* THE SCREEN IS A PAGE, not a pause. Every other screen on this site
            opens with a script eyebrow, a headline and a line of copy; this
            one used to be an emblem alone on a colour field, which read as a
            divider or a loading state rather than as part of the site.

            The copy sits left and the emblem stands right, still flush to the
            floor of the screen — that footing is deliberate and predates this
            layout, so the two-column arrangement was built around it rather
            than over it. */}
        {/* pointer-events-none on the column and the rooms box below it, for
            the same reason as .lotus-copy: these are full-stage sheets of
            glass at z-10, and glass must not catch clicks meant for the
            entrance panel underneath. Everything interactive inside re-arms
            itself — .lotus-room flips to auto via data-live, and explicit
            auto on a descendant beats none on its ancestors. */}
        <div className="pointer-events-none relative z-10 h-full w-full max-w-[1560px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-[88px] pb-0 flex flex-col">
          <div className="flex-1 min-h-0 relative">
          {/* Fills the rooms box. `self-stretch` was left over from when the
              parent was a grid; as a plain block child it does nothing, the
              box collapsed to zero height, and the rooms — absolutely placed
              inside it — had nothing to centre against and rode up under the
              header. */}
          {/* pointer-events-none on the BOX, not the rooms: each .lotus-room
              already flips its own pointer-events with data-live, but the
              container is a full-stage plate of glass and its background
              swallowed every click meant for layers beneath — including the
              entrance panel's browse button. A child's explicit auto still
              wins over the parent's none, so live rooms stay clickable. */}
          <div className="lotus-copy absolute inset-0 pointer-events-none">
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
                  style={{ '--wall-a': pillar.accentA, '--wall-b': pillar.accentB } as React.CSSProperties}
                >
                  {wallView?.room === i ? (
                    /* THE ACTIVITY'S WALL — the same two-column hang as the
                       room's own: wall text left, pieces right. The text is
                       the work's, the plaques are EVERY figure the report
                       gives it, and the frames hold its photographs in the
                       room's own slot layout (striped while photographs are
                       still to come). Back restores the room. */
                    <div
                      key={wallView.act.id}
                      className="activity-wall grid grid-cols-1 md:grid-cols-[minmax(0,0.46fr)_minmax(0,1fr)] gap-5 md:gap-8 lg:gap-12 items-center"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setWallView(null)}
                          className="font-artistic-display text-[10.5px] tracking-[0.18em] uppercase text-white/70 hover:text-white underline decoration-white/30 underline-offset-4 cursor-pointer mb-3"
                        >
                          &larr; {pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase()} room
                        </button>
                        <p className="font-artistic-display text-[10px] sm:text-[11px] tracking-[0.2em] text-white/60 mb-1.5">
                          ROOM {i + 1} · {pillar.label}
                        </p>
                        <h3 className="font-artistic-display text-white text-[21px] sm:text-[25px] md:text-[30px] md:leading-[36px] mb-1 drop-shadow-md">
                          {wallView.act.title}
                        </h3>
                        <p className="font-artistic-serif text-white/60 text-[11.5px] mb-3">
                          {wallView.act.period}
                        </p>
                        <p className="font-artistic-serif text-white/90 text-[13px] sm:text-[14px] leading-relaxed max-w-[420px] drop-shadow-sm mb-4">
                          {wallView.act.blurb}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-[440px]">
                          {wallView.act.dataPoints.map((dp) => (
                            <div key={dp.label} className="lotus-plaque px-3 py-2">
                              <p className="font-artistic-heading text-[17px] sm:text-[19px] font-bold text-white tracking-tight leading-none mb-1">
                                {dp.value}
                              </p>
                              <p className="font-artistic-serif text-[11px] text-white/75 leading-tight">
                                {dp.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="hidden md:block relative w-full aspect-[16/10] max-h-[58vh]">
                          {(WALLS[id] ?? [])
                            .slice(0, Math.max(3, wallView.act.images.length))
                            .map((slot, j) => {
                              const img = wallView.act.images[j];
                              return (
                                <figure
                                  key={j}
                                  className="lotus-plate absolute m-0"
                                  data-empty={img ? 'false' : 'true'}
                                  data-style={slot.style}
                                  style={{
                                    left: `${slot.x}%`,
                                    top: `${slot.y}%`,
                                    width: `${slot.w}%`,
                                    height: `${slot.h}%`,
                                    transform: `rotate(${slot.tilt}deg)`,
                                    '--plate-ink': LOGO_INK[j % LOGO_INK.length],
                                  } as React.CSSProperties}
                                >
                                  <span className="lotus-plate-art">
                                    {img ? <img src={img.src} alt={img.alt} loading="lazy" decoding="async" /> : null}
                                  </span>
                                  {img?.alt ? (
                                    <figcaption className="lotus-plate-label">{img.alt}</figcaption>
                                  ) : null}
                                </figure>
                              );
                            })}
                        </div>
                        <p className="font-artistic-display text-white/55 text-[10px] tracking-[0.16em] uppercase mt-4">
                          {wallView.act.images.length > 0
                            ? `${wallView.act.images.length} photographs`
                            : 'photographs arriving · figures on the left are current'}
                        </p>
                      </div>
                    </div>
                  ) : (
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
                              /* THE FRAME WEARS A PETAL'S INK. Each piece on
                                 the wall is moulded in one of the emblem's
                                 five colours, cycling in the artwork's own
                                 order — so a room of frames reads as the
                                 lotus taken apart and hung up. */
                              style={{
                                left: `${slot.x}%`,
                                top: `${slot.y}%`,
                                width: `${slot.w}%`,
                                height: `${slot.h}%`,
                                transform: `rotate(${slot.tilt}deg)`,
                                '--plate-ink': LOGO_INK[j % LOGO_INK.length],
                              } as React.CSSProperties}
                            >
                              {/* The whole piece is the control. A gallery
                                  does not put a button under a painting —
                                  you walk up to the work itself. */}
                              <button
                                type="button"
                                className="lotus-plate-hit"
                                onClick={() => setWallView({ room: i, act })}
                                aria-label={`${act.title} — its wall`}
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
                                style={{ '--plate-ink': LOGO_INK[j % LOGO_INK.length] } as React.CSSProperties}
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

                      {/* the gallery's own line: how many pieces, how to see
                          one properly — and the catalogue, for a visitor who
                          would rather browse the lot than walk on */}
                      <p className="font-artistic-display text-white/55 text-[10px] tracking-[0.16em] uppercase mt-4">
                        {acts.length} works · select one for its figures ·{' '}
                        <button
                          type="button"
                          onClick={() => setCatalogueOpen(true)}
                          className="text-white/80 underline decoration-white/40 underline-offset-4 hover:text-white hover:decoration-white/80 cursor-pointer uppercase tracking-[0.16em]"
                        >
                          browse all rooms
                        </button>
                      </p>
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>

          </div>

          {/* THE FLOOR PLAN. Where you are in the exhibition, what is ahead,
              and — because it is the same list the ground walks through — a
              legend for the colour as well. It sits outside the rooms so it
              never fades with them: the plan stays on the wall while you move
              between rooms, which is the point of a plan. */}
          {/* Hidden until the first room opens: while the gate holds the
              screen the strip under it belongs to the gate's own floor, and
              a five-colour rail there double-printed against the carving.
              The plan appears as Heal's ground does — you get the map when
              you are inside, not at the door. */}
          {/* Right padding reserves the rail's FIFTH place for the emblem:
              the hand-and-globe stands at the column's right edge (the
              corner post, one breakpoint-matched width away), closing the
              line the four rooms walk — the journey's terminus drawn as
              the mark itself rather than as a fifth label. */}
          <ul
            ref={legendListRef}
            style={{ opacity: 0, willChange: 'opacity' }}
            className="lotus-legend flex items-stretch gap-1.5 sm:gap-2 list-none p-0 m-0 pb-3 sm:pb-4 md:pb-[122px] shrink-0 pr-[104px] sm:pr-[134px] lg:pr-[166px] xl:pr-[188px]"
          >
            {VERTICAL_SEQUENCE.slice(0, LEGEND_LABELS.length).map((v, i) => (
              <li
                key={LEGEND_LABELS[i]}
                ref={(el) => {
                  legendRefs.current[i] = el;
                }}
                data-on="false"
                style={{ '--legend-accent': v.b } as React.CSSProperties}
                className="relative flex-1 min-w-0 pt-2"
              >
                {/* The plan is a MAP now, not just a legend: each stop is a
                    button that glides the exhibition to that stage. */}
                <button
                  type="button"
                  onClick={() => glideToStage(i)}
                  aria-label={`Go to ${LEGEND_LABELS[i]}`}
                  className="block w-full text-left cursor-pointer bg-transparent border-0 p-0 group"
                >
                  <span className="legend-bar block h-[3px] w-full rounded-full mb-1.5" />
                  <span className="block font-artistic-display text-[9px] sm:text-[10.5px] font-semibold uppercase tracking-[0.14em] truncate group-hover:text-white transition-colors duration-200">
                    {LEGEND_LABELS[i]}
                  </span>
                </button>
                {/* THE STATIONS ON THE LINE. When this stop is the one the
                    reader stands at (data-current, written by the read
                    loop), its works unfold beneath the label — the metro
                    map's own idiom: you see the stations of the line you
                    are riding. Each is a door straight to its case. */}
                {i < ROOM_IDS.length && (
                  <div className="legend-works hidden md:flex flex-wrap gap-x-3 gap-y-1">
                    {activitiesFor(ROOM_IDS[i]).map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setWallView({ room: i, act })}
                        title={`${act.title} — its wall`}
                        className="legend-work font-artistic-display uppercase tracking-[0.1em]"
                      >
                        {act.title}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* THE CENTREPIECE STANDS AT THE RAIL'S TERMINUS — anchored to the
              COLUMN's floor, not the rooms box. It used to be bottom-0 of
              the rooms box, whose height changes whenever the legend below
              it grows or shrinks, so the emblem drifted up and down as the
              works rows came and went. The column's bottom IS the stage
              floor, which never moves: the hand keeps this exact footing
              from "Our work" all the way to the farewell. */}
          <div
            ref={postRef}
            style={{ opacity: 0, willChange: 'opacity, transform' }}
            /* Nudged up-and-left off the exact corner: flush right-0/bottom-0
               the palm sat under the navigator pill, and the two collided at
               the gate ("START" printed across the hand). The offsets clear
               the pill's row (h-11 at bottom-6) and its left edge. */
            className="pointer-events-none absolute right-14 sm:right-20 bottom-12 sm:bottom-16 z-40 w-[92px] sm:w-[118px] lg:w-[150px] xl:w-[172px]"
          >
            <SncfLotus3D ref={lotusRef} maxWidth={172} className="ml-auto" />
          </div>
        </div>
      </div>

      {/* The whole collection, browsed. Selecting a piece opens the same
          case the walls open; the catalogue holds its page underneath. */}
      <GalleryCatalogue
        open={catalogueOpen}
        onClose={() => setCatalogueOpen(false)}
        onSelect={(act) => setOpen(act)}
      />

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
