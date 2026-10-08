import React, { useEffect, useRef, useState } from 'react';
import { geoGraticule10, geoInterpolate, geoOrthographic, geoPath, geoRotation, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import landTopology from 'world-atlas/land-110m.json';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { nimaJourney, nimaStory, type NimaStep } from '../data/nima';
import './nima-journey.css';
import { useSectionActivity } from '../hooks/useSectionActivity';

/**
 * NIMA'S JOURNEY, from Delhi across borders: a globe that turns to each new
 * place as the years go by (2015 to 2026), its centres lighting up where
 * they stand, a flight drawn across the ocean to New York and to Tracy, and
 * the year's words beside it. It plays on its own while it is on screen, a
 * year every few seconds and round again; a year on the timeline goes
 * straight to it. Drawn on one canvas with d3's orthographic projection over
 * the world's land (world-atlas, 1:110m). Where motion is unwelcome it turns
 * at once and does not play.
 */
const STEP_MS = 4600;
const HOLD_LAST_MS = 7000;
const TURN_MS = 1400;
const FLIGHT_MS = 1500;
const INDIA: [number, number] = [79, 23];

const land = feature(landTopology as unknown as Topology, (landTopology as unknown as Topology).objects.land as GeometryCollection);
const graticule = geoGraticule10();

/** Where the globe faces for a step: India for the years there; across the Atlantic for New York, the flight
    whole between its ends; the United States for Tracy, the flight rising over the edge from the far side. */
const facing = (step: NimaStep, index: number): [number, number] => {
  if (!step.from) return INDIA;
  if (index === nimaJourney().length - 1) return [-98, 36];
  return geoInterpolate(step.from, step.places[0].at)(.5) as [number, number];
};
const ease = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export default function NimaJourney() {
  useCMSRevision();
  const steps = nimaJourney();
  const words = nimaStory();
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = useSectionActivity(root);
  const still = useRef(false);
  const view = useRef({ rotate: [-INDIA[0], -INDIA[1]] as [number, number], from: [-INDIA[0], -INDIA[1]] as [number, number], to: [-INDIA[0], -INDIA[1]] as [number, number], turnAt: 0, stepAt: 0 });

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    still.current = query.matches;
    const sync = () => { still.current = query.matches; };
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);


  /* a new step: turn to face it, and start its flight */
  useEffect(() => {
    const v = view.current;
    const target = facing(steps[index], index);
    v.from = [...v.rotate] as [number, number];
    v.to = [-target[0], -target[1]];
    v.turnAt = performance.now();
    v.stepAt = v.turnAt;
    if (still.current) v.rotate = [...v.to] as [number, number];
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  /* playing on its own, a year at a time and round again, while on screen */
  useEffect(() => {
    if (!visible || still.current) return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % steps.length), index === steps.length - 1 ? HOLD_LAST_MS : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [visible, index, steps.length]);

  /* the globe, drawn each frame while on screen */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    const draw = (now: number) => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio, 2);
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const v = view.current;
      const turn = still.current ? 1 : Math.min(1, (now - v.turnAt) / TURN_MS);
      const t = ease(turn);
      const interpolate = geoInterpolate([-v.from[0], -v.from[1]], [-v.to[0], -v.to[1]]);
      const centre = interpolate(t);
      v.rotate = [-centre[0], -centre[1]];
      const radius = Math.min(width, height) * .42;
      const projection = geoOrthographic().scale(radius).translate([width / 2, height / 2]).rotate([v.rotate[0], v.rotate[1] * .85, 0]).clipAngle(90);
      const path = geoPath(projection, ctx);
      const [cx, cy] = [width / 2, height / 2];

      /* the sea, lit from the upper left, a rim of light round it */
      const sea = ctx.createRadialGradient(cx - radius * .35, cy - radius * .4, radius * .1, cx, cy, radius);
      sea.addColorStop(0, '#1d6b78'); sea.addColorStop(.65, '#124a58'); sea.addColorStop(1, '#0b3341');
      ctx.beginPath(); path({ type: 'Sphere' } as GeoPermissibleObjects); ctx.fillStyle = sea; ctx.fill();
      ctx.beginPath(); path(graticule); ctx.strokeStyle = 'rgb(160 230 235 / .06)'; ctx.lineWidth = .6; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = 'rgb(150 225 230 / .2)'; ctx.fill(); ctx.strokeStyle = 'rgb(180 240 245 / .22)'; ctx.lineWidth = .5; ctx.stroke();
      const halo = ctx.createRadialGradient(cx, cy, radius * .92, cx, cy, radius * 1.12);
      halo.addColorStop(0, 'rgb(140 230 235 / .28)'); halo.addColorStop(1, 'rgb(140 230 235 / 0)');
      ctx.beginPath(); ctx.arc(cx, cy, radius * 1.12, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();

      /* a point's place in the view, and whether it faces us */
      const rotation = geoRotation([v.rotate[0], v.rotate[1] * .85, 0]);
      const lift = (at: [number, number], h: number) => {
        const [lon, lat] = rotation(at).map(d => d * Math.PI / 180);
        const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
        const k = radius * (1 + h);
        return { x: cx + x * k, y: cy - y * k, front: z > 0 || (x * x + y * y) * (1 + h) ** 2 > 1 };
      };

      /* the flights so far across the ocean, the newest drawing itself out */
      const since = now - v.stepAt;
      steps.forEach((step, i) => {
        if (!step.from || i > index) return;
        const reach = i < index || still.current ? 1 : Math.min(1, since / FLIGHT_MS);
        for (const place of step.places) {
          if (Math.abs(place.at[0] - step.from[0]) < 40) continue;
          const along = geoInterpolate(step.from, place.at);
          ctx.beginPath();
          let pen = false;
          for (let s = 0; s <= 64 * reach; s++) {
            const u = s / 64;
            const p = lift(along(u) as [number, number], .32 * Math.sin(Math.PI * u));
            if (!p.front) { pen = false; continue; }
            if (pen) ctx.lineTo(p.x, p.y); else { ctx.moveTo(p.x, p.y); pen = true; }
          }
          ctx.strokeStyle = 'rgb(170 245 250 / .75)'; ctx.lineWidth = 1.4; ctx.shadowColor = 'rgb(120 230 240 / .9)'; ctx.shadowBlur = 8;
          ctx.stroke(); ctx.shadowBlur = 0;
        }
      });

      /* every centre opened so far, this year's brightest and breathing */
      const breath = still.current ? .5 : .5 + .5 * Math.sin(now / 420);
      steps.forEach((step, i) => {
        if (i > index) return;
        for (const place of step.places) {
          const p = lift(place.at, 0);
          if (!p.front) continue;
          const current = i === index;
          if (current) {
            ctx.beginPath(); ctx.arc(p.x, p.y, 7 + breath * 6, 0, Math.PI * 2); ctx.fillStyle = `rgb(150 245 250 / ${(.28 - breath * .18).toFixed(3)})`; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, current ? 3.4 : 2.4, 0, Math.PI * 2);
          ctx.fillStyle = current ? '#d8fdff' : 'rgb(160 235 240 / .7)'; ctx.shadowColor = 'rgb(140 240 245 / .9)'; ctx.shadowBlur = current ? 10 : 4; ctx.fill(); ctx.shadowBlur = 0;
        }
      });

      /* this year's place named beside its point */
      const step = steps[index];
      const named = step.places.find(place => place.name.toLowerCase().startsWith(step.label.toLowerCase())) ?? step.places[0];
      const at = lift(named.at, 0);
      if (at.front && turn > .6) {
        const text = step.label.toUpperCase();
        ctx.font = '600 10px Outfit, system-ui, sans-serif';
        const w = ctx.measureText(text).width + 12;
        ctx.globalAlpha = Math.min(1, (turn - .6) / .3);
        ctx.fillStyle = 'rgb(6 26 34 / .85)'; ctx.strokeStyle = 'rgb(160 240 245 / .45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(at.x + 8, at.y - 22, w, 18, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e9fdff'; ctx.fillText(text, at.x + 14, at.y - 9.5);
        ctx.globalAlpha = 1;
      }
      if (visible && !still.current) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [visible, index, steps]);

  const step = steps[index];
  return (
    <section ref={root} className="nima-journey" aria-roledescription="timeline" aria-label={words.journeyTitle}>
      <div className="nima-journey-words">
        <p className="nima-kicker">{words.journeyKicker}</p>
        <h4 className="nima-journey-title">{words.journeyTitle}</h4>
        <div className="nima-journey-step" key={step.year} aria-live="polite">
          <p className="nima-journey-year">{step.year}</p>
          <p className="nima-journey-place">{step.place}</p>
          <p className="nima-journey-note">{step.title}</p>
          {step.lines.map(line => <p key={line} className="nima-journey-line">{line}</p>)}
        </div>
      </div>
      <div className="nima-journey-globe"><canvas ref={canvasRef} aria-hidden="true" /></div>
      <ol className="nima-journey-years" style={{ '--reach': index / (steps.length - 1) } as React.CSSProperties}>
        {steps.map((s, i) => <li key={s.year}>
          <button type="button" aria-current={i === index ? 'step' : undefined} data-past={i < index || undefined} onClick={() => setIndex(i)}>
            <span aria-hidden="true" />{s.year}
          </button>
        </li>)}
      </ol>
      <p className="nima-journey-foot"><span>{words.fullName}</span><span>{words.journeyFoot}</span></p>
    </section>
  );
}
