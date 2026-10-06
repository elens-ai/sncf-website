import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Award } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { resolveCMSMedia } from '../cms/media';
import type { RoadEvent } from '../data/roadEvents';
import { buildTree, makeFoliage, medalOut, medalsAt, TreePainter, type Foliage, type Tree } from './growthTree';
import { Doves } from './roadDoves';
import './road-tree.css';

/**
 * THE ROAD SO FAR, as a tree that grows (Who We Are). It starts as a seed in
 * the foundation's first year and grows with the reader's scroll into the
 * tree it is today: its trunk rising up the middle through the years, every
 * event a branch out to one side or the other, its photograph carried out at
 * the branch's tip (growthTree.ts grows and draws it). The stage stays on
 * screen while the tree grows: on a wide screen the tree stands between the
 * year it has reached and that year's events; on a narrow one they follow
 * beneath it. A photograph's button takes the tree to its year. Doves cross
 * the section now and then, dropping seeds (roadDoves.ts); the first drops
 * the seed the tree grows from.
 *
 * With reduced motion the tree is shown grown, and every event is listed
 * beneath it by year. Assistive technology is given the whole history as a
 * list; the drawing itself is decorative.
 */
let FOLIAGE: { resolution: number; foliage: Foliage } | null = null;
const foliageAt = (resolution: number) => {
  if (!FOLIAGE || FOLIAGE.resolution !== resolution) FOLIAGE = { resolution, foliage: makeFoliage(resolution) };
  return FOLIAGE.foliage;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/* the share of the pinned scroll the seed rests for before it sprouts */
const REST = 0.05;
/* the track's pinned stage, where it is now, and how far it stays pinned for */
const pinOf = (el: HTMLElement) => {
  const sticky = el.firstElementChild as HTMLElement;
  const top = parseFloat(getComputedStyle(sticky).top) || 0;
  const rect = el.getBoundingClientRect();
  return { top, rect, run: Math.max(1, rect.height - sticky.offsetHeight) };
};

export interface RoadLabels { aria: string; seed: string; year: string; moments: string; explore: string; today: string; hint: string }

export function RoadTree({ events, labels }: { events: RoadEvent[]; labels: RoadLabels }) {
  const calm = useReducedMotion() ?? false;
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sky = useRef<HTMLCanvasElement>(null);
  const painter = useRef<TreePainter | null>(null);
  const medalEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const shown = useRef(-Infinity);
  const [tree, setTree] = useState<Tree | null>(null);
  const [T, setT] = useState(0);
  const startYear = useMemo(() => Math.min(...events.map(e => e.year)), [events]);
  const endYear = useMemo(() => Math.max(new Date().getFullYear(), ...events.map(e => e.year)), [events]);
  const years = useMemo(() => [...new Set(events.map(e => e.year))].sort((a, b) => a - b), [events]);
  const byId = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);
  /* when each year arrives: as its first photograph comes out on its branch */
  const arrives = useMemo(() => new Map(years.map(y => [y, tree ? Math.min(...tree.medals.filter(m => m.year === y).map(medalOut)) : y])), [tree, years]);

  /* THE TREE, grown for the stage's size */
  useEffect(() => {
    const box = stage.current;
    if (!box) return;
    let timer = 0;
    const build = () => {
      const { width, height } = box.getBoundingClientRect();
      if (width < 40 || height < 40) return;
      /* sharp, within about a million and a half pixels: the foliage is soft, and each frame redraws the whole canvas */
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1.5e6 / (width * height)));
      const next = buildTree({ width, height, events, startYear, endYear });
      const c = canvas.current!;
      c.width = Math.round(width * dpr); c.height = Math.round(height * dpr);
      painter.current = new TreePainter(next, foliageAt(Math.round(dpr * 75) / 100), dpr);
      shown.current = -Infinity;
      setTree(next);
    };
    build();
    const observer = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(build, 120); });
    observer.observe(box);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [events, startYear, endYear]);

  /* THE TIME the tree has reached, from the scroll while the stage is pinned (the seed resting a moment first);
     each frame draws the tree and carries the photographs out on their branches */
  useEffect(() => {
    if (!tree) return;
    const draw = (at: number) => {
      if (Math.abs(at - shown.current) < 0.0005) return;
      shown.current = at;
      const ctx = canvas.current?.getContext('2d');
      if (ctx && painter.current) painter.current.draw(ctx, at);
      const places = medalsAt(tree, at);
      tree.medals.forEach((m, i) => {
        const el = medalEls.current[m.id];
        if (!el) return;
        const p = places[i];
        el.style.left = `${(p.x / tree.W) * 100}%`;
        el.style.top = `${(p.y / tree.H) * 100}%`;
        el.style.setProperty('--grow', String(p.scale));
        if (p.shown) el.dataset.shown = ''; else delete el.dataset.shown;
        el.inert = !p.shown;
      });
    };
    if (calm) { draw(tree.settle); setT(tree.settle); return; }
    let frame = 0;
    const read = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      const { top, rect, run } = pinOf(el);
      const p = clamp((top - rect.top) / run, 0, 1);
      const at = startYear + clamp((p - REST) / (1 - REST), 0, 1) * (tree.settle - startYear);
      draw(at);
      /* the years and the panel follow in eighths of a year: enough for what they show */
      setT(Math.floor(at * 8) / 8);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [tree, calm, startYear]);

  /* THE DOVES, over the section while it is on screen; the first, as the stage comes into view with the tree still a
     seed, carries that seed to the tree's foot */
  useEffect(() => {
    const el = track.current, box = stage.current, air = sky.current;
    if (calm || !tree || !el || !box || !air) return;
    const sticky = el.firstElementChild as HTMLElement;
    const flock = new Doves(air);
    /* the sky spans the window, so the doves fly in from its edges */
    const fit = () => {
      const left = sticky.getBoundingClientRect().left, width = document.documentElement.clientWidth;
      air.style.left = `${-left}px`; air.style.width = `${width}px`;
      flock.size({
        width, height: sticky.clientHeight, dpr: Math.min(window.devicePixelRatio || 1, 1.5), k: tree.k,
        foot: { x: left + box.offsetLeft + tree.base[0], y: box.offsetTop + tree.groundY, reach: tree.reach },
        band: [box.offsetTop + tree.H * 0.05, box.offsetTop + tree.H * 0.36],
      });
    };
    fit();
    window.addEventListener('resize', fit);
    const seen = new IntersectionObserver(([entry]) => {
      flock.run(entry.isIntersecting);
      if (entry.intersectionRatio >= 0.7 && shown.current < startYear + 0.3) flock.sow();
    }, { threshold: [0, 0.7] });
    seen.observe(box);
    return () => { seen.disconnect(); flock.stop(); window.removeEventListener('resize', fit); };
  }, [tree, calm, startYear]);

  /* a photograph's button takes the tree to its year (or, with reduced motion, to its card) */
  const goTo = (id: string) => {
    const medal = tree?.medals.find(m => m.id === id);
    const el = track.current;
    if (!medal || !tree || !el) return;
    if (calm) { document.getElementById(`road-card-${id}`)?.scrollIntoView({ block: 'center' }); return; }
    const { top, rect, run } = pinOf(el);
    /* far enough into the branch's growth to see it, before the next year arrives */
    const next = years.find(y => y > medal.year);
    const from = medalOut(medal) + 0.2, to = next === undefined ? tree.settle : arrives.get(next)! - 0.15;
    const when = clamp(medal.birth + medal.dur * 0.7, from, Math.max(from, to));
    const p = REST + clamp((when - startYear) / (tree.settle - startYear), 0, 1) * (1 - REST);
    window.scrollTo({ top: window.scrollY + rect.top - top + p * run, behavior: 'smooth' });
  };

  /* the year in focus: the latest whose photographs have come out */
  const focus = calm ? null : [...years].reverse().find(y => arrives.get(y)! <= T) ?? years[0];
  const focusEvents = events.filter(e => e.year === focus);
  const yearLabel = (year: number) => (year === startYear ? labels.seed : year === endYear ? labels.today : `${labels.year} ${year - startYear}`);
  const card = (e: RoadEvent) => (
    <li key={e.id} id={`road-card-${e.id}`} className="road-card">
      <span className="road-card-photo" data-logo={e.logo || undefined} data-document={e.document || undefined}><img src={resolveCMSMedia(e.photo)} alt="" loading="lazy" decoding="async" /></span>
      <div className="road-card-copy">
        <h3>{e.title}</h3>
        <p>{e.text}</p>
        {e.href && <a href={e.href}>{labels.explore}<ArrowUpRight size={13} aria-hidden="true" /></a>}
      </div>
    </li>
  );

  return (
    <div className="road" data-calm={calm || undefined}>
      {/* the whole history, for assistive technology: the tree and its panel show it a year at a time */}
      {!calm && <ol className="sr-only">{events.map(e => <li key={e.id}>{e.year}: {e.title}. {e.text}</li>)}</ol>}
      <div ref={track} className="road-track">
        <div className="road-sticky">
          <div ref={stage} className="road-stage" role="group" aria-label={labels.aria}>
            <canvas ref={canvas} className="road-canvas" aria-hidden="true" />
            {tree && tree.marks.filter(m => years.includes(m.year)).map(m => (
              <span key={m.year} className="road-mark" data-seed={m.seed || undefined} data-on={m.year === focus || undefined} data-shown={T >= m.birth || undefined}
                style={{ left: `${(m.x / tree.W) * 100}%`, top: `${(m.y / tree.H) * 100}%` }} aria-hidden="true">{m.year}</span>
            ))}
            {tree && tree.medals.map(m => {
              const e = byId.get(m.id)!;
              return (
                <button key={m.id} ref={node => { medalEls.current[m.id] = node; }} type="button" className="road-medal"
                  data-on={m.year === focus || undefined} data-logo={e.logo || undefined} data-document={e.document || undefined}
                  style={{ '--medal': `${tree.medalR * 2}px` } as React.CSSProperties}
                  onClick={() => goTo(m.id)} aria-label={`${e.year}: ${e.title}`}>
                  {e.document ? <Award size={tree.medalR * 0.95} strokeWidth={1.8} aria-hidden="true" /> : <img src={resolveCMSMedia(e.photo)} alt="" decoding="async" />}
                  <span className="road-medal-label" aria-hidden="true">{e.title}</span>
                </button>
              );
            })}
          </div>
          {/* the year the tree has reached, and its events */}
          {focus !== null && <>
            <div className="road-year">
              <p className="road-year-now" key={focus}>
                <strong>{focus}</strong>
                <span>{yearLabel(focus)}{focusEvents.length > 1 && ` · ${focusEvents.length} ${labels.moments}`}</span>
              </p>
              <p className="road-hint" data-shown={T < startYear + 0.8 || undefined} aria-hidden="true">{labels.hint}</p>
            </div>
            <ul className="road-cards" key={`cards-${focus}`} data-count={focusEvents.length}>{focusEvents.map(card)}</ul>
          </>}
          {!calm && <canvas ref={sky} className="road-sky" aria-hidden="true" />}
        </div>
      </div>
      {/* with reduced motion: every event, by year, beneath the grown tree */}
      {calm && (
        <div className="road-list">
          {years.map(year => (
            <section key={year} className="road-list-year" aria-label={String(year)}>
              <p className="road-year-now"><strong>{year}</strong><span>{yearLabel(year)}</span></p>
              <ul className="road-cards">{events.filter(e => e.year === year).map(card)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
