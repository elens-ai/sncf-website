import React, { useEffect, useRef, type RefObject } from 'react';
import { createFrameClock } from '../utils/frameClock';
import { pageIsActive } from '../utils/pageActivity';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { usePerfTier } from '../hooks/usePerfTier';
import { genome, lerpGenome, easeOut, paintWaves, type Genome, type Pose, type Subject, type Mote } from '../utils/waves';
import type { PillarState } from '../types';

/**
 * THE WAVES — the artwork behind the Living Mosaic.
 *
 * One <canvas> painted at half of its CSS size and scaled up by the
 * browser: bilinear upscaling of anti-aliased flat fills is what gives the
 * matte, soft-edged ribbons of the reference, for free, and it means a
 * Retina display costs no more to paint than a laptop's. The buffer is
 * 720×450 at 1440×900, with shaded ribbons and fine crest lines, on the house 30 fps clock, only while the section is active
 * and nothing lies over it.
 *
 * What moves, and why nothing here reads the DOM per frame:
 *  - idle drift: three slow sines on the clock's own time;
 *  - scroll travel: the reader hands its whole-stage progress through a
 *    mutable ref (`input`), and the crests slide with it, eased;
 *  - pointer parallax: the stage's pointermove writes a target into local
 *    state; near bands follow the cursor more than far ones, eased;
 *  - the turn: when `stage` changes the picture on screen becomes the start
 *    of a one-second morph to the next pillar's genome, one breath ripples
 *    out under the medallion, and the mask lifts a little so the new
 *    palette is noticed. A rail jump that lands mid-morph starts from
 *    wherever the picture is — never a snap.
 *
 * Legibility lives in the mask: the ribbons are kept faint under the
 * signature column and the rail, and full behind the photographs; the mask
 * is painted into the buffer (destination-in) rather than applied as a CSS
 * mask, so there is no full-resolution mask surface and nothing for Safari
 * to get wrong under a sticky ancestor.
 */
const SCALE = 2;
const FPS = 30;
const MORPH_SECONDS = 1.6;
const STEADY_SECONDS = .35;

/** Faint under the signature column, full behind the collage — over a wide,
    gentle ramp, so the column never reads as a seam in the picture. */
function stageMask(ctx: CanvasRenderingContext2D, width: number) {
  const mask = ctx.createLinearGradient(0, 0, width, 0);
  mask.addColorStop(0, 'rgb(0 0 0 / .14)');
  mask.addColorStop(.22, 'rgb(0 0 0 / .16)');
  mask.addColorStop(.36, 'rgb(0 0 0 / .34)');
  mask.addColorStop(.5, 'rgb(0 0 0 / .58)');
  mask.addColorStop(.9, 'rgb(0 0 0 / .58)');
  mask.addColorStop(1, 'rgb(0 0 0 / .3)');
  return mask;
}

/* The motes: a fixed constellation (golden-ratio spread, nothing random per
   render) that rises slowly, wobbles a little, and twinkles. */
const MOTE_COUNT = 22;
const frac = (v: number) => v - Math.floor(v);
const seedMotes = (): Mote[] => Array.from({ length: MOTE_COUNT }, (_, i) => ({
  x: frac(i * .618034), y: frac(i * .381966), r: .6 + frac(i * .271) * 1.1, a: .25,
}));
const driftMotes = (motes: Mote[], delta: number, time: number) => {
  motes.forEach((m, i) => {
    m.y -= delta * (.006 + frac(i * .53) * .009);
    if (m.y < -.04) { m.y = 1.04; m.x = frac(m.x + .618034); }
    m.x += Math.sin(time * .3 + i * .7) * delta * .006;
    m.a = .14 + .18 * (.5 + .5 * Math.sin(time * .9 + i * 1.3));
  });
};

/** Faint over the top, where the signature reads, fuller behind the collage,
    and soft at both ends so stacked chapters do not butt hard edges. */
function stackedMask(ctx: CanvasRenderingContext2D, height: number) {
  const mask = ctx.createLinearGradient(0, 0, 0, height);
  mask.addColorStop(0, 'rgb(0 0 0 / 0)');
  mask.addColorStop(.12, 'rgb(0 0 0 / .12)');
  mask.addColorStop(.42, 'rgb(0 0 0 / .12)');
  mask.addColorStop(.55, 'rgb(0 0 0 / .34)');
  mask.addColorStop(.85, 'rgb(0 0 0 / .34)');
  mask.addColorStop(1, 'rgb(0 0 0 / 0)');
  return mask;
}

const size = (host: HTMLElement, scale = SCALE) => ({ w: Math.max(1, Math.ceil(host.clientWidth / scale)), h: Math.max(1, Math.ceil(host.clientHeight / scale)) });

export interface WaveInput { travel: number; /** set by the album when it turns: one breath ripples through */ nudge?: boolean }

interface MosaicWavesProps {
  /** The pillar on stage, or the programme the reader is on; a change starts the morph. */
  subject: Subject;
  /** The clock runs only while this is true. */
  active: boolean;
  /** Written by the stage's reader every frame it scrolls; read by the clock. */
  input: RefObject<WaveInput>;
  /** A cheaper pass for a busy screen: CSS pixels per painted pixel, and frames a second. */
  scale?: number;
  fps?: number;
  /** Through a change of subject keep the waves' shape and motion, and let only the colours blend, with no
      breath: for a cover whose subject turns by itself every few seconds. */
  steady?: boolean;
}

export const MosaicWaves: React.FC<MosaicWavesProps> = ({ subject, active, input, scale: wantedScale = SCALE, fps: wantedFps = FPS, steady = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScreen = useSectionActivity(canvasRef);
  /* What the device can spare (utils/perfTier): a device in the middle tier
     paints fewer frames into a smaller buffer; one in the lowest keeps a still
     picture, painted once per subject and per size. */
  const tier = usePerfTier();
  const fps = tier === 'high' ? wantedFps : Math.min(wantedFps, 20);
  const scale = tier === 'high' ? wantedScale : wantedScale * 1.5;
  const running = active && onScreen && tier !== 'low';
  const runningRef = useRef(running);
  runningRef.current = running;
  const state = useRef({
    from: null as Genome | null, to: null as Genome | null, shown: null as Genome | null, u: 1,
    pose: { time: 0, travel: 0, px: 0, py: 0, ripple: 0 } as Pose,
    tx: 0, ty: 0, key: '', motes: seedMotes(), steady,
    w: 0, h: 0, mask: null as CanvasGradient | null,
    ctx: null as CanvasRenderingContext2D | null,
    paint: () => {},
  });
  const clock = useRef<ReturnType<typeof createFrameClock> | null>(null);
  useEffect(() => { state.current.steady = steady; }, [steady]);

  /* The buffer, the mask, the pointer and the clock — set up once. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !host || !ctx) return;
    const s = state.current;
    s.ctx = ctx;
    s.paint = () => {
      if (!s.shown || !s.mask) return;
      const flush = s.u < 1 && !s.steady ? Math.sin(Math.PI * s.u) : 0;
      paintWaves(ctx, s.shown, s.w, s.h, s.pose, s.mask, .88 + .12 * flush, 3, s.motes);
      if (canvas.dataset.ready !== 'true') canvas.dataset.ready = 'true';
    };
    const resize = () => {
      const { w, h } = size(host, scale);
      if (w !== s.w || h !== s.h) {
        s.w = w; s.h = h;
        canvas.width = w; canvas.height = h;
        s.mask = stageMask(ctx, w);
      }
      s.paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    clock.current = createFrameClock(delta => {
      if (!pageIsActive(canvas)) return;
      const pose = s.pose;
      pose.time += delta;
      const target = input.current?.travel ?? pose.travel;
      pose.travel += (target - pose.travel) * (1 - Math.exp(-delta / .25));
      if (input.current?.nudge) { input.current.nudge = false; pose.ripple = Math.max(pose.ripple, .55); }
      /* with no cursor over the stage the picture sways on its own, a little */
      const swayX = s.tx + Math.sin(pose.time * .11) * .28, swayY = s.ty + Math.sin(pose.time * .07 + 1) * .18;
      pose.px += (swayX - pose.px) * (1 - Math.exp(-delta / .35));
      pose.py += (swayY - pose.py) * (1 - Math.exp(-delta / .35));
      driftMotes(s.motes, delta, pose.time);
      pose.ripple = pose.ripple > .01 ? pose.ripple * Math.exp(-delta / .45) : 0;
      if (s.u < 1 && s.from && s.to) {
        /* a steady picture's colours follow its ground, which changes at once, within a breath */
        s.u = Math.min(1, s.u + delta / (s.steady ? STEADY_SECONDS : MORPH_SECONDS));
        /* a steady blend eases in as well as out, so the colours drift rather than leap */
        s.shown = lerpGenome(s.from, s.to, s.steady ? s.u * s.u * (3 - 2 * s.u) : easeOut(s.u));
      }
      s.paint();
    }, fps);
    /* set up afresh for another tier while already running: carry on */
    if (runningRef.current) clock.current.start();

    /* Only where a cursor exists: a touch is not a hover. */
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const move = (event: PointerEvent) => {
      s.tx = (event.clientX / window.innerWidth) * 2 - 1;
      s.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const leave = () => { s.tx = 0; s.ty = 0; };
    if (fine.matches) {
      host.addEventListener('pointermove', move, { passive: true });
      host.addEventListener('pointerleave', leave);
    }
    return () => {
      clock.current?.stop();
      clock.current = null;
      observer.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [input, scale, fps]);

  /* The turn: morph from whatever is on screen to the subject's genome —
     only when the subject really changed, never on a re-activation or a
     CMS republish that left the colours alone. */
  useEffect(() => {
    const s = state.current;
    const key = `${subject.id}|${subject.accentA}|${subject.accentB}`;
    if (s.key === key) return;
    s.key = key;
    const next = genome(subject);
    if (!s.shown) {
      /* a steady picture swells long and quiet: its finer ripples damped, kept so through every change */
      s.from = s.to = s.shown = steady ? { ...next, amp: next.amp.map(row => row.map((v, k) => v * [1, .55, .2][k])) } : next;
      s.u = 1;
    } else {
      s.from = s.shown;
      s.to = steady ? { ...s.shown, colour: next.colour } : next;
      s.u = 0;
      if (!steady) s.pose.ripple = 1;
    }
    /* With the clock stopped the new palette must still show: land the
       morph and paint once, with no breath baked into the still. */
    if (!active) { s.shown = s.to; s.u = 1; s.pose.ripple = 0; s.paint(); }
  }, [subject.id, subject.accentA, subject.accentB, active, steady]);

  useEffect(() => {
    const s = state.current;
    if (running) { clock.current?.start(); return; }
    clock.current?.stop();
    /* Stopped mid-morph (a tile opened, the tab hidden): finish the picture
       rather than freeze it halfway, and paint it without the breath. */
    if (s.u < 1 && s.to) { s.shown = s.to; s.u = 1; }
    s.pose.ripple = 0;
    s.paint();
  }, [running]);

  return <canvas ref={canvasRef} className="mosaic-waves" aria-hidden="true" />;
};

/** The stacked layout's picture: painted once per chapter and per resize, no clock. */
export const MosaicWavesStatic: React.FC<{ pillar: PillarState }> = ({ pillar }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !host || !ctx) return;
    const g = genome(pillar);
    const pose: Pose = { time: 0, travel: .5, px: 0, py: 0, ripple: 0 };
    const paint = () => {
      const { w, h } = size(host);
      canvas.width = w; canvas.height = h;
      paintWaves(ctx, g, w, h, pose, stackedMask(ctx, h), 1, 3, seedMotes());
      canvas.dataset.ready = 'true';
    };
    const observer = new ResizeObserver(paint);
    observer.observe(host);
    paint();
    return () => observer.disconnect();
  }, [pillar.id, pillar.accentA, pillar.accentB]);
  return <canvas ref={canvasRef} className="mosaic-waves mosaic-waves--static" aria-hidden="true" />;
};
