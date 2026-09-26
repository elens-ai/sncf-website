import React, { useEffect, useRef, type RefObject } from 'react';
import { createFrameClock } from '../utils/frameClock';
import { pageIsActive } from '../utils/pageActivity';
import { genome, lerpGenome, easeOut, paintWaves, type Genome, type Pose, type Subject, type Mote } from '../utils/waves';
import type { PillarState } from '../types';

/**
 * THE WAVES — the artwork behind the Living Mosaic.
 *
 * One <canvas> painted at a third of its CSS size and scaled up by the
 * browser: bilinear upscaling of anti-aliased flat fills is what gives the
 * matte, soft-edged ribbons of the reference, for free, and it means a
 * Retina display costs no more to paint than a laptop's. The buffer is
 * 480×300 at 1440×900 and every frame is five fills of it — under a
 * millisecond, on the house 30 fps clock, only while the section is active
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
const SCALE = 3;
const FPS = 30;
const MORPH_SECONDS = 1;

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
    m.y -= delta * (.012 + frac(i * .53) * .018);
    if (m.y < -.04) { m.y = 1.04; m.x = frac(m.x + .618034); }
    m.x += Math.sin(time * .3 + i * .7) * .0003;
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

const size = (host: HTMLElement) => ({ w: Math.max(1, Math.ceil(host.clientWidth / SCALE)), h: Math.max(1, Math.ceil(host.clientHeight / SCALE)) });

export interface WaveInput { travel: number; /** set by the album when it turns: one breath ripples through */ nudge?: boolean }

interface MosaicWavesProps {
  /** The pillar on stage, or the programme the reader is on; a change starts the morph. */
  subject: Subject;
  /** The clock runs only while this is true. */
  active: boolean;
  /** Written by the stage's reader every frame it scrolls; read by the clock. */
  input: RefObject<WaveInput>;
}

export const MosaicWaves: React.FC<MosaicWavesProps> = ({ subject, active, input }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    from: null as Genome | null, to: null as Genome | null, shown: null as Genome | null, u: 1,
    pose: { time: 0, travel: 0, px: 0, py: 0, ripple: 0 } as Pose,
    tx: 0, ty: 0, key: '', motes: seedMotes(),
    w: 0, h: 0, mask: null as CanvasGradient | null,
    ctx: null as CanvasRenderingContext2D | null,
    paint: () => {},
  });
  const clock = useRef<ReturnType<typeof createFrameClock> | null>(null);

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
      const flush = s.u < 1 ? Math.sin(Math.PI * s.u) : 0;
      paintWaves(ctx, s.shown, s.w, s.h, s.pose, s.mask, .88 + .12 * flush, 3, s.motes);
      if (canvas.dataset.ready !== 'true') canvas.dataset.ready = 'true';
    };
    const resize = () => {
      const { w, h } = size(host);
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
        s.u = Math.min(1, s.u + delta / MORPH_SECONDS);
        s.shown = lerpGenome(s.from, s.to, easeOut(s.u));
      }
      s.paint();
    }, FPS);

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
  }, [input]);

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
      s.from = s.to = s.shown = next;
      s.u = 1;
    } else {
      s.from = s.shown;
      s.to = next;
      s.u = 0;
      s.pose.ripple = 1;
    }
    /* With the clock stopped the new palette must still show: land the
       morph and paint once, with no breath baked into the still. */
    if (!active) { s.shown = next; s.u = 1; s.pose.ripple = 0; s.paint(); }
  }, [subject.id, subject.accentA, subject.accentB, active]);

  useEffect(() => {
    const s = state.current;
    if (active) { clock.current?.start(); return; }
    clock.current?.stop();
    /* Stopped mid-morph (a tile opened, the tab hidden): finish the picture
       rather than freeze it halfway, and paint it without the breath. */
    if (s.u < 1 && s.to) { s.shown = s.to; s.u = 1; }
    s.pose.ripple = 0;
    s.paint();
  }, [active]);

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
