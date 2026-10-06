/* THE DOVES over the Who We Are page's growing tree (RoadTree.tsx). Now and
   then a white dove, sometimes a pair, crosses the section, dropping a seed or
   two over the ground about the tree; the first, as the section comes into
   view, carries the seed the tree grows from and drops it at the tree's foot.
   They have a canvas of their own over the section, drawn only while a dove
   or a seed is in the air and the section is on screen; where motion is
   reduced there are none. */
import { rng } from './growthTree';

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** The doves' canvas: its size; the tree's foot, where the first seed lands, and how far its ground reaches either
    side; and the band they fly across. */
export interface Sky {
  width: number; height: number; dpr: number; k: number;
  foot: { x: number; y: number; reach: number };
  band: [number, number];
}

interface Dove {
  x: number; y: number; vx: number; dir: number; size: number;
  /** its flight's level, and its gentle rise and fall about it */
  level: number; swell: number; swellAt: number;
  /** its wings: the stroke's phase, where they are (1 up, -1 down), and the glides between strokes */
  stroke: number; lift: number; glide: number; flapFor: number;
  /** where it lets its seeds go (the first dove: the tree's own, timed to land at its foot) */
  drops: number[]; carries: boolean;
}
interface Seed { x: number; y: number; vx: number; vy: number; turn: number; spin: number; age: number; landed: number; size: number; home?: number }

/** A dove, facing `dir` (1 right, -1 left), its wings at `lift` (1 up, -1 down), `size` about 1 at the drawing's
    own scale: white, shaded grey beneath, outlined softly so it reads on a pale ground. */
export function drawDove(c: CanvasRenderingContext2D, x: number, y: number, size: number, dir: number, lift: number, glide = 0) {
  const s = size * 1.25;
  c.save();
  c.translate(x, y); c.scale(dir * s, s); c.rotate(-0.07 + glide * 0.05);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = 0.75; c.strokeStyle = 'rgba(78, 96, 104, 0.55)';
  wing(c, lift * 0.9, true);
  /* the tail, fanned */
  c.beginPath(); c.moveTo(-10, -1.6); c.lineTo(-20.6, -4.8); c.quadraticCurveTo(-22.8, -0.4, -21, 3.6); c.lineTo(-10, 2.1); c.closePath();
  c.fillStyle = '#e6ebee'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-14, -1.8); c.lineTo(-20.4, -3.2); c.moveTo(-14, 0.4); c.lineTo(-21, 0.6); c.moveTo(-14, 2.2); c.lineTo(-20.4, 2.6);
  c.strokeStyle = 'rgba(78, 96, 104, 0.25)'; c.stroke(); c.strokeStyle = 'rgba(78, 96, 104, 0.55)';
  /* the body, white over a grey breast */
  const body = c.createLinearGradient(0, -6.5, 0, 5.6);
  body.addColorStop(0, '#ffffff'); body.addColorStop(0.5, '#f5f7f8'); body.addColorStop(1, '#c9d2d7');
  c.beginPath(); c.moveTo(12.6, -4.2); c.bezierCurveTo(7, -7.2, -5, -6.2, -11.6, -1.9); c.lineTo(-11.6, 2.3);
  c.bezierCurveTo(-4, 5.8, 8.4, 5.6, 13.6, 1.3); c.closePath();
  c.fillStyle = body; c.fill(); c.stroke();
  /* the head, its beak and eye */
  c.beginPath(); c.arc(14.3, -2.7, 4.3, 0, TAU); c.fillStyle = '#fbfcfc'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(18.2, -3.3); c.lineTo(22, -2); c.lineTo(18.3, -0.9); c.closePath(); c.fillStyle = '#d58f72'; c.fill();
  c.beginPath(); c.arc(15.4, -3.6, 0.9, 0, TAU); c.fillStyle = '#263036'; c.fill();
  wing(c, lift, false);
  c.restore();
}
/* a wing from the shoulder, drawn raised and flattened towards the stroke's place (so it folds edge-on mid-stroke
   and turns down under the body below it): broad, its flight feathers fanned at the tip; the far one smaller and
   greyer */
const FEATHERS: [number, number][] = [[-5.2, -21], [-9.4, -19.8], [-12.9, -17], [-14.9, -13.3], [-15.3, -9.4], [-13.7, -5.6], [-10.6, -2.2], [-6.5, 0.6]];
function wing(c: CanvasRenderingContext2D, lift: number, far: boolean) {
  c.save();
  if (far) { c.translate(1.2, -3.6); c.scale(0.86, 0.86); } else c.translate(2.6, -2.4);
  c.scale(1, lift || 0.02);
  c.lineWidth = 0.75 / Math.max(0.35, Math.abs(lift));
  c.beginPath();
  c.moveTo(2.6, 0);
  c.bezierCurveTo(3.2, -5, 1.6, -10, -1, -13);                       // the leading edge, out to the wrist
  c.lineTo(FEATHERS[0][0], FEATHERS[0][1]);
  /* the trailing edge: feather tips, a notch between each */
  for (let i = 1; i < FEATHERS.length; i++) {
    const [ax, ay] = FEATHERS[i - 1], [bx, by] = FEATHERS[i];
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    c.quadraticCurveTo(mx + (-7 - mx) * 0.14, my + (-9 - my) * 0.14, bx, by);
  }
  c.closePath();
  const g = c.createLinearGradient(0, 0, -11, -18);
  g.addColorStop(0, far ? '#dfe5e9' : '#ffffff'); g.addColorStop(0.55, far ? '#cfd8dd' : '#f2f5f6'); g.addColorStop(1, far ? '#a9b6bd' : '#cfd8dd');
  c.fillStyle = g; c.fill(); c.stroke();
  /* the feathers' shafts, from the wrist */
  c.beginPath();
  for (let i = 0; i < 6; i++) { c.moveTo(-1.5 - i * 0.7, -11 + i * 1.6); c.lineTo(FEATHERS[i][0] * 0.82 - 1, FEATHERS[i][1] * 0.86); }
  c.strokeStyle = 'rgba(78, 96, 104, 0.24)'; c.stroke();
  c.restore();
}

export class Doves {
  private ctx: CanvasRenderingContext2D;
  private sky: Sky | null = null;
  private doves: Dove[] = [];
  private seeds: Seed[] = [];
  /** last frame's boxes, cleared before the next */
  private drawn: number[][] = [];
  private raf = 0;
  private timer = 0;
  private last = 0;
  private live = false;
  private sown = false;
  private random = rng(23);

  constructor(private canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')!; }

  size(sky: Sky) {
    this.sky = sky;
    this.canvas.width = Math.round(sky.width * sky.dpr);
    this.canvas.height = Math.round(sky.height * sky.dpr);
    this.drawn = [];
  }

  /** Flies while the section is on screen, and rests while it is not. */
  run(on: boolean) {
    if (on === this.live) return;
    this.live = on;
    if (!on) { this.rest(); return; }
    if (this.doves.length || this.seeds.length) this.wake();
    else this.plan(1800 + this.random() * 2600);
  }

  /** The first dove: carrying the tree's seed to its foot (once). */
  sow() {
    if (this.sown || !this.sky) return;
    this.sown = true;
    this.launch(true);
    this.wake();
  }

  stop() { this.live = false; this.rest(); }

  private rest() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    window.clearTimeout(this.timer); this.timer = 0;
  }

  /* the next dove, after a while */
  private plan(ms: number) {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => { this.timer = 0; if (!this.live) return; this.launch(false); this.wake(); }, ms);
  }

  private wake() { if (!this.raf && this.live) { this.last = 0; this.raf = requestAnimationFrame(this.tick); } }

  private tick = (now: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.step(dt);
    this.draw();
    if (this.doves.length || this.seeds.length) this.raf = requestAnimationFrame(this.tick);
    else if (!this.timer) this.plan(2600 + this.random() * 5200);
  };

  private launch(carries: boolean) {
    const sky = this.sky;
    if (!sky) return;
    if (!carries && this.doves.length >= 2) { this.plan(2500); return; }
    const r = this.random;
    const dir = carries ? 1 : r() < 0.5 ? 1 : -1;
    const speed = clamp(sky.width * 0.2, 120, 250) * (0.9 + r() * 0.2);
    const [top, bottom] = sky.band;
    const level = carries ? lerp(top, bottom, 0.3) : lerp(top, bottom, r());
    const size = sky.k * (carries ? 1.05 : 0.82 + r() * 0.3);
    const make = (behind: number, dy: number, s: number): Dove => ({
      x: (dir > 0 ? -34 * s : sky.width + 34 * s) - dir * behind, y: level + dy, vx: dir * speed, dir, size: s,
      level: level + dy, swell: (3 + r() * 5) * sky.k, swellAt: r() * TAU,
      stroke: r() * TAU, lift: 0, glide: 0, flapFor: 0.9 + r() * 1.2, drops: [], carries: false,
    });
    const lead = make(0, 0, size);
    if (carries) lead.carries = true;
    else for (let i = 0, n = 1 + Math.floor(r() * 3); i < n; i++) lead.drops.push(sky.foot.x + (r() * 2 - 1) * sky.foot.reach * 1.05);
    lead.drops.sort((a, b) => (a - b) * dir);
    this.doves.push(lead);
    if (!carries && r() < 0.35) this.doves.push(make(50 * size + r() * 50, (r() - 0.5) * 44 * sky.k, size * (0.85 + r() * 0.15)));
  }

  private release(d: Dove, home?: number) {
    const sky = this.sky!;
    this.seeds.push({
      x: d.x - d.dir * 1.5 * d.size, y: d.y + 6 * d.size, vx: d.vx * 0.42, vy: 18 * sky.k,
      turn: this.random() * TAU, spin: (this.random() - 0.5) * 9, age: 0, landed: -1, size: sky.k * (0.9 + this.random() * 0.3), home,
    });
  }

  private step(dt: number) {
    const sky = this.sky!;
    const G = 520 * sky.k;
    for (const d of this.doves) {
      d.x += d.vx * dt;
      /* the wings: a run of strokes, then a short glide with them raised */
      if (d.glide > 0) {
        d.glide -= dt;
        d.lift += (0.42 - d.lift) * Math.min(1, dt * 10);
        d.level += 7 * sky.k * dt;
      } else {
        d.stroke += dt * TAU * 3.1;
        d.lift = Math.sin(d.stroke);
        d.flapFor -= dt;
        d.level -= 4 * sky.k * dt;
        if (d.flapFor <= 0 && d.lift > 0.3) { d.glide = 0.45 + this.random() * 0.45; d.flapFor = 1 + this.random() * 1.4; }
      }
      d.y = d.level + d.swell * Math.sin(d.swellAt + d.x * 0.006) - (d.glide > 0 ? 0 : 1.4 * d.size * Math.sin(d.stroke));
      /* its seeds */
      if (d.carries) {
        /* let go where, drifting as it falls, the seed comes down at the tree's foot */
        const fall = Math.sqrt((2 * Math.max(0, sky.foot.y - d.y)) / G);
        if ((sky.foot.x - d.x) * d.dir <= Math.abs(d.vx) * 0.42 * fall * 0.72) { this.release(d, sky.foot.x); d.carries = false; }
      } else if (d.drops.length && (d.x - d.drops[0]) * d.dir >= 0) {
        d.drops.shift();
        this.release(d);
      }
    }
    this.doves = this.doves.filter(d => (d.dir > 0 ? d.x < sky.width + 40 * d.size : d.x > -40 * d.size));
    for (const s of this.seeds) {
      s.age += dt;
      if (s.landed >= 0) continue;
      s.vy = Math.min(s.vy + G * dt, 300 * sky.k);
      s.vx *= 1 - 1.1 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.turn += s.spin * dt;
      /* the tree's own seed is drawn home to the foot as it falls */
      if (s.home !== undefined) s.x += (s.home - s.x) * Math.min(1, dt * 2.4 * clamp(s.age, 0, 1));
      if (s.y >= sky.foot.y - 2 * sky.k && Math.abs(s.x - sky.foot.x) < sky.foot.reach * 1.25) { s.y = sky.foot.y - 2 * sky.k; s.landed = s.age; }
    }
    /* a seed rests where it lands, then sinks into the ground; one that misses the ground fades as it falls */
    this.seeds = this.seeds.filter(s => (s.landed >= 0 ? s.age - s.landed < (s.home !== undefined ? 2.6 : 1.4) : s.age < 2.4));
  }

  private draw() {
    const c = this.ctx, sky = this.sky!;
    const { dpr } = sky;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const [x, y, w, h] of this.drawn) c.clearRect(x, y, w, h);
    this.drawn = [];
    for (const s of this.seeds) {
      const fade = s.landed >= 0
        ? 1 - clamp((s.age - s.landed - (s.home !== undefined ? 1.8 : 0.6)) / 0.8, 0, 1)
        : 1 - clamp((s.age - 1.8) / 0.6, 0, 1);
      c.save();
      c.globalAlpha = fade;
      c.translate(s.x, s.y); c.rotate(s.landed >= 0 ? 0.2 : s.turn);
      c.fillStyle = '#7a5532';
      c.beginPath(); c.ellipse(0, 0, 3.1 * s.size, 1.9 * s.size, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255, 236, 200, 0.5)';
      c.beginPath(); c.ellipse(-0.8 * s.size, -0.6 * s.size, 1.2 * s.size, 0.6 * s.size, 0, 0, TAU); c.fill();
      c.restore();
      const r = 5 * s.size;
      this.drawn.push([s.x - r, s.y - r, 2 * r, 2 * r]);
    }
    for (const d of this.doves) {
      drawDove(c, d.x, d.y, d.size, d.dir, d.lift, d.glide > 0 ? 1 : 0);
      const r = 36 * d.size;
      this.drawn.push([d.x - r, d.y - r, 2 * r, 2 * r]);
    }
  }
}
