import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AWARDS, Award } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the deepmala.
 *
 * Not a wall of pictures. An honour is a light somebody else lit for you, so
 * the honours stand as lamps on a tiered stand, the way a deep stambh stands
 * in a temple courtyard: arcs of flames rising out of the dark.
 *
 * The stand is deliberately NOT FULL. The lamps the foundation has earned
 * burn; the places still to be filled sit unlit in brass. That is the honest
 * shape of the data — the honours are still being catalogued — and it is also
 * the whole argument of the screen, so it is drawn rather than apologised for.
 *
 * Flame is drawn on a canvas, not with CSS: fifteen independently flickering
 * lights with additive glow is a compositing job, and a stack of blurred divs
 * would cost far more for a worse flame. The canvas is decoration only —
 * every lamp is a real <button> in the DOM above it, so the stand is fully
 * keyboard operable and screen readers get the honours as a list.
 *
 * The room paints no block; the page-wide .accent-canvas runs one unbroken
 * gradient from the hero to the footer and an opaque panel here would seam it.
 */

interface Lamp {
  /** Normalised position on the stand, 0..1 within the stage. */
  x: number;
  y: number;
  /** Flame size multiplier — inner tiers burn a touch smaller. */
  scale: number;
  /** Per-lamp flicker offset, so no two flames breathe together. */
  phase: number;
  lit: boolean;
  title?: string;
  tag?: string;
  sub?: string;
  year?: string;
  award?: Award;
}

/** The stand: three arcs, 3 / 5 / 7 — odd counts, as lamp tiers are set. */
const TIERS = [
  { count: 3, radius: 0.45, scale: 0.92 },
  { count: 5, radius: 0.72, scale: 1.0 },
  { count: 7, radius: 1.0, scale: 1.08 },
];
const SPREAD = 1.15; // radians either side of vertical

/* The arcs are struck from a centre below the floor of the stage. X and Y are
   scaled differently because the stage is wide: struck as true circles the
   tiers would run off both edges long before the top one cleared the bottom. */
const ARC = { cx: 0.5, cy: 1.02, rx: 0.30, ry: 0.52 };

/**
 * What the lit lamps say while AWARDS is empty. These are the foundation's own
 * documented programmes — nothing here invents an honour or a conferring body.
 */
const STANDIN = [
  { title: 'Heal', tag: 'Pillar', sub: 'Blood donation, eye care, health camps' },
  { title: 'Enrich', tag: 'Pillar', sub: 'Education and skill development' },
  { title: 'Empower', tag: 'Pillar', sub: 'Youth, environment, disaster relief' },
  { title: 'Project Amrit', tag: 'Programme', sub: 'Reviving ponds, lakes and riverbanks' },
  { title: 'Oneness Vann', tag: 'Programme', sub: 'Native saplings tended into forests' },
  { title: 'Sant Nirankari Health City', tag: 'Project', sub: 'Charitable medical infrastructure' },
  { title: 'Manav Ekta Diwas', tag: 'Observance', sub: 'The Mission’s day of human oneness' },
];

const buildLamps = (entries: Omit<Lamp, 'x' | 'y' | 'scale' | 'phase' | 'lit'>[]): Lamp[] => {
  const lamps: Lamp[] = [];
  let placed = 0;

  TIERS.forEach((tier) => {
    for (let i = 0; i < tier.count; i++) {
      /* Spread along the arc; a single lamp on a tier sits at its crown. */
      const t = tier.count === 1 ? 0 : (i / (tier.count - 1)) * 2 - 1;
      const angle = t * SPREAD;
      const entry = entries[placed];
      lamps.push({
        x: ARC.cx + Math.sin(angle) * tier.radius * ARC.rx,
        y: ARC.cy - Math.cos(angle) * tier.radius * ARC.ry,
        scale: tier.scale,
        phase: (placed * 2.399) % (Math.PI * 2),
        lit: Boolean(entry),
        ...entry,
      });
      placed++;
    }
  });

  return lamps;
};

export const AwardsSection: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [shown, setShown] = useState(false);
  const [calm, setCalm] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [target, setTarget] = useState<LightboxTarget | null>(null);

  const hasAwards = AWARDS.length > 0;

  const lamps = useMemo(
    () =>
      buildLamps(
        hasAwards
          ? AWARDS.map((a) => ({
              title: a.title,
              tag: a.awardedBy,
              year: a.year,
              sub: a.note,
              award: a,
            }))
          : STANDIN,
      ),
    [hasAwards],
  );

  /* How many lamps are alight — animated up as the stand is lit, and read out
     beneath the plate. With no honours yet this counts the programmes. */
  const litCount = lamps.filter((l) => l.lit).length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* ---------- the flame ---------------------------------------------------
     One rAF loop for the whole stand. Lamps light in sequence once the stand
     is in view; each keeps its own flicker phase so the arcs never pulse in
     unison. Under reduced motion the loop never starts: the stand is drawn
     once, fully lit and perfectly steady.
     --------------------------------------------------------------------- */
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    const start = performance.now();
    /* Lamps take their light one after another, inner tier first. */
    const IGNITE_STEP = 190;

    /* The tier rails. Without them the lamps read as a scatter of flames in
       the dark; with them they read as a stand, which is the point. */
    const drawStand = () => {
      ctx.globalCompositeOperation = 'source-over';
      TIERS.forEach((tier) => {
        ctx.beginPath();
        ctx.ellipse(
          ARC.cx * w,
          ARC.cy * h,
          tier.radius * ARC.rx * w,
          tier.radius * ARC.ry * h,
          0,
          -SPREAD - Math.PI / 2,
          SPREAD - Math.PI / 2,
        );
        ctx.strokeStyle = 'rgba(150, 108, 62, 0.30)';
        ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.004);
        ctx.stroke();
      });
    };

    const drawLamp = (lamp: Lamp, i: number, time: number, litAmount: number) => {
      const x = lamp.x * w;
      const y = lamp.y * h;
      const unit = Math.min(w, h);
      const isActive = activeRef.current === i;

      /* The brass cup. Drawn for every position, lit or not — an empty place
         on the stand is a lamp waiting, not a hole. */
      ctx.globalCompositeOperation = 'source-over';
      const cupW = unit * 0.030 * lamp.scale;
      const cupH = cupW * 0.52;
      const cup = ctx.createLinearGradient(x - cupW, y, x + cupW, y + cupH);
      cup.addColorStop(0, 'rgba(78, 54, 34, 0.95)');
      cup.addColorStop(0.5, isActive ? 'rgba(196, 146, 74, 0.95)' : 'rgba(140, 100, 56, 0.9)');
      cup.addColorStop(1, 'rgba(52, 36, 24, 0.95)');
      ctx.fillStyle = cup;
      ctx.beginPath();
      ctx.ellipse(x, y + cupH * 0.4, cupW, cupH, 0, 0, Math.PI * 2);
      ctx.fill();

      if (litAmount <= 0.001) return;

      const flicker = calm
        ? 1
        : 0.86 +
          0.11 * Math.sin(time * 6.1 + lamp.phase) +
          0.05 * Math.sin(time * 14.7 + lamp.phase * 2.3) +
          0.03 * Math.sin(time * 23.1 + lamp.phase * 0.7);

      const boost = isActive ? 1.5 : 1;
      const power = litAmount * flicker * boost;

      /* Additive light: the pool on the brass, then the flame body. */
      ctx.globalCompositeOperation = 'lighter';

      const glowR = unit * 0.17 * lamp.scale * power;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      glow.addColorStop(0, `rgba(255, 196, 108, ${0.34 * power})`);
      glow.addColorStop(0.35, `rgba(232, 140, 60, ${0.15 * power})`);
      glow.addColorStop(1, 'rgba(180, 90, 40, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();

      const fh = unit * 0.052 * lamp.scale * power;
      const fw = fh * 0.42;
      const tipY = y - fh;

      const body = ctx.createLinearGradient(x, y, x, tipY);
      body.addColorStop(0, `rgba(255, 138, 40, ${0.9 * power})`);
      body.addColorStop(0.45, `rgba(255, 206, 120, ${0.95 * power})`);
      body.addColorStop(1, `rgba(255, 250, 235, ${0.9 * power})`);
      ctx.fillStyle = body;

      /* A teardrop that leans a little as it burns. */
      const lean = calm ? 0 : Math.sin(time * 3.4 + lamp.phase) * fw * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x - fw, y - fh * 0.34, x - fw * 0.72 + lean, y - fh * 0.72, x + lean, tipY);
      ctx.bezierCurveTo(x + fw * 0.72 + lean, y - fh * 0.72, x + fw, y - fh * 0.34, x, y);
      ctx.fill();

      /* The white heart of the flame. */
      const coreH = fh * 0.42;
      const core = ctx.createLinearGradient(x, y, x, y - coreH);
      core.addColorStop(0, `rgba(255, 240, 200, ${0.5 * power})`);
      core.addColorStop(1, `rgba(255, 255, 250, 0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(x, y - coreH * 0.45, fw * 0.34, coreH * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      const time = elapsed / 1000;
      ctx.clearRect(0, 0, w, h);
      drawStand();

      lamps.forEach((lamp, i) => {
        if (!lamp.lit) {
          drawLamp(lamp, i, time, 0);
          return;
        }
        /* Ease each lamp up as its turn comes. */
        const t = (elapsed - i * IGNITE_STEP) / 620;
        const litAmount = Math.max(0, Math.min(1, t));
        drawLamp(lamp, i, time, litAmount * litAmount * (3 - 2 * litAmount));
      });

      raf = requestAnimationFrame(frame);
    };

    if (!shown) {
      /* Before the stand is reached, show the brass only. */
      ctx.clearRect(0, 0, w, h);
      drawStand();
      lamps.forEach((lamp, i) => drawLamp(lamp, i, 0, 0));
    } else if (calm) {
      ctx.clearRect(0, 0, w, h);
      drawStand();
      lamps.forEach((lamp, i) => drawLamp(lamp, i, 0, lamp.lit ? 1 : 0));
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [lamps, shown, calm]);

  const openAward = useCallback((lamp: Lamp) => {
    if (lamp.award?.photos && lamp.award.photos.length > 0) {
      setTarget({ award: lamp.award, photos: lamp.award.photos, index: 0 });
    }
  }, []);

  const reading = active !== null ? lamps[active] : null;

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-28 pb-16 overflow-hidden"
    >
      <div className="award-room" aria-hidden="true" />

      <div ref={rootRef} className={`award-hall${shown ? ' is-in' : ''}`}>
        {/* THE READING SIDE — the plate a visitor actually reads. */}
        <div className="award-read">
          <p className="award-eyebrow">Recognition</p>
          <h2 className="award-title">
            Every honour is <em>a lamp</em> somebody lit
          </h2>
          <p className="award-standfirst">
            Your appreciation makes us stronger to serve humanity. The stand is not
            full — the honours are still being catalogued, and each will take its
            place with the body that conferred it and the year it was given.
          </p>

          {/* The label changes to whichever lamp is being looked at. */}
          <div className="award-plate" aria-live="polite">
            {reading ? (
              <>
                <p className="award-plate-tag">
                  {reading.lit ? reading.tag : 'An empty place'}
                </p>
                <p className="award-plate-title">
                  {reading.lit ? reading.title : 'Waiting to be lit'}
                </p>
                <p className="award-plate-sub">
                  {reading.lit
                    ? reading.sub ?? 'Documented service'
                    : 'An honour yet to be confirmed will stand here.'}
                </p>
                {reading.year && <p className="award-plate-year">{reading.year}</p>}
              </>
            ) : (
              <>
                <p className="award-plate-tag">The stand</p>
                <p className="award-plate-title">
                  {litCount} alight, {lamps.length - litCount} waiting
                </p>
                <p className="award-plate-sub">
                  Move across the lamps to read each one.
                </p>
              </>
            )}
          </div>
        </div>

        {/* THE STAND — canvas is decoration; the lamps themselves are buttons. */}
        <div className="award-stage" ref={stageRef}>
          <canvas ref={canvasRef} className="award-canvas" aria-hidden="true" />

          <ul className="award-lamps">
            {lamps.map((lamp, i) => (
              <li
                key={i}
                className="award-lamp"
                style={{ left: `${lamp.x * 100}%`, top: `${lamp.y * 100}%` }}
              >
                <button
                  type="button"
                  className={`award-lamp-hit${active === i ? ' is-active' : ''}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((cur) => (cur === i ? null : cur))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((cur) => (cur === i ? null : cur))}
                  onClick={() => openAward(lamp)}
                  aria-label={
                    lamp.lit
                      ? `${lamp.title}${lamp.tag ? ` — ${lamp.tag}` : ''}`
                      : 'An empty place on the stand, waiting for an honour yet to be confirmed'
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AwardLightbox
        target={target}
        onClose={() => setTarget(null)}
        onNavigate={(index) => setTarget((t) => (t ? { ...t, index } : t))}
      />
    </section>
  );
};
