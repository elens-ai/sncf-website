import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Pause, Play, CalendarDays } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { PillarModelCard } from '../components/PillarModelCard';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import './core-values.css';

const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
type Cornerstone = typeof CORNERSTONES[number];

const ValueChapter: React.FC<{ id: Cornerstone; index: number; linkedActivity: string }> = ({ id, index, linkedActivity }) => {
  const pillar = PILLARS.find(p => p.id === id)!;
  const activities = ACTIVITIES.filter(a => a.pillarId === id);
  const [selectedId, setSelectedId] = useState(activities[0].id);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const detailAnchorRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const transitionRotation = useRef(0);
  const visible = useSectionActivity(modelRef);
  const selected = activities.find(a => a.id === selectedId) ?? activities[0];
  useEffect(() => {
    if (ACTIVITIES.some(a => a.id === linkedActivity && a.pillarId === id)) setSelectedId(linkedActivity);
  }, [linkedActivity, id]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const showcase = showcaseRef.current, origin = originRef.current, destination = destinationRef.current, model = modelRef.current;
    if (!showcase || !origin || !destination || !model) return;
    let frame = 0;
    let x = 0, y = 0, dx = 0, dy = 0, travel = 1, finalScale = 1;
    let modelWidth = 1, modelHeight = 1, objectWidth = 255, baseLeft = 0;
    let dockX = 0, dockY = 0, dockScale = 1, dockStart = 0, dockEnd = 1;
    const paint = () => {
      frame = 0;
      const top = showcase.getBoundingClientRect().top;
      let t = Math.max(0, Math.min(1, (170 - top) / travel));
      if (reduced) t = t < .5 ? 0 : 1;
      const ease = t * t * (3 - 2 * t);
      // Rotate the actual mesh so the extruded edges and back stay three-dimensional.
      transitionRotation.current = !reduced ? ease * Math.PI * 2 : 0;
      // A single scroll-scrubbed push-in: rest at both ends, full scale midway.
      const zoom = !reduced ? Math.sin(Math.PI * t) ** 4 : 0;
      const normalX = x + dx * ease, normalY = y + dy * ease;
      const centreX = innerWidth / 2 - baseLeft - modelWidth / 2;
      const centreY = (innerHeight + 125) / 2 - top - modelHeight / 2;
      let dock = Math.max(0, Math.min(1, (-top - dockStart) / Math.max(1, dockEnd - dockStart)));
      if (reduced) dock = dock < .5 ? 0 : 1;
      const dockEase = dock * dock * dock * (dock * (dock * 6 - 15) + 10);
      const movingX = normalX + (centreX - normalX) * zoom;
      const movingY = normalY + (centreY - normalY) * zoom;
      const restingScale = 1 + (finalScale - 1) * ease;
      const fullScreenScale = Math.max(innerWidth, innerHeight) * 1.2 / (objectWidth * 1.44);
      const zoomScale = restingScale + Math.max(0, fullScreenScale - restingScale) * zoom;
      let positionX = movingX + (dockX - movingX) * dockEase;
      let positionY = movingY + (dockY - movingY) * dockEase;
      let scale = zoomScale + (dockScale - zoomScale) * dockEase;
      if (!reduced && dock > 0) {
        // A lifted Bezier arc, with a depth-like change of scale and a gentle
        // mesh turn. Both ends settle at zero velocity; reverse scrolling retraces it.
        const u = dockEase, v = 1 - u;
        const lift = Math.min(150, innerHeight * .17);
        const bend = Math.min(140, Math.abs(dockX - movingX) * .4);
        positionX = v ** 3 * movingX + 3 * v * v * u * (movingX + bend)
          + 3 * v * u * u * (dockX - bend * .35) + u ** 3 * dockX;
        positionY = v ** 3 * movingY + 3 * v * v * u * (movingY - lift)
          + 3 * v * u * u * (dockY - lift * .75) + u ** 3 * dockY;
        scale = zoomScale * Math.pow(dockScale / zoomScale, u) * (1 + .08 * Math.sin(Math.PI * u));
        transitionRotation.current += Math.PI * 2 * u;
      }
      model.style.transform = `translate3d(${positionX}px, ${positionY}px, 0)`;
      model.style.opacity = '1';
      model.style.setProperty('--value-object-scale', `${scale}`);
      showcase.style.setProperty('--value-zoom', `${zoom}`);
      model.dataset.zooming = zoom > .15 ? 'true' : 'false';
      model.dataset.docking = dock > .02 ? 'true' : 'false';
      model.style.setProperty('--value-control-shift', `${Math.max(0, finalScale - 1) * 160 * ease}px`);
    };
    const measure = () => {
      const base = showcase.getBoundingClientRect(), start = origin.getBoundingClientRect(), end = destination.getBoundingClientRect();
      x = start.left - base.left; y = start.top - base.top;
      dx = end.left + end.width / 2 - (start.left + start.width / 2);
      dy = end.top + end.height / 2 - (start.top + start.height / 2);
      travel = Math.max(1, end.top - base.top - 30);
      const object = model.querySelector<HTMLElement>('.value-model-object');
      objectWidth = object?.offsetWidth || 255;
      modelWidth = start.width; modelHeight = start.height; baseLeft = base.left;
      finalScale = Math.min(1.3, end.width * .92 / (objectWidth * 1.44));
      const anchor = detailAnchorRef.current?.getBoundingClientRect();
      const explorer = explorerRef.current?.getBoundingClientRect();
      if (anchor && explorer) {
        dockX = anchor.left - base.left + anchor.width / 2 - modelWidth / 2;
        dockY = anchor.top - base.top + anchor.height / 2 - modelHeight / 2;
        dockScale = anchor.width / (objectWidth * 1.44);
        dockStart = end.top - base.top - 60;
        dockEnd = explorer.top - base.top - 150;
      }
      model.style.width = `${start.width}px`; model.style.height = `${start.height}px`;
      paint();
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const observer = new ResizeObserver(measure); observer.observe(showcase); observer.observe(origin); observer.observe(destination);
    if (detailAnchorRef.current) observer.observe(detailAnchorRef.current);
    if (explorerRef.current) observer.observe(explorerRef.current);
    window.addEventListener('scroll', scroll, { passive: true }); measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', scroll); };
  }, [reduced, id]);
  return (
    <section id={id} className="value-chapter" aria-labelledby={`${id}-title`} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties}>
      <div className="value-showcase" ref={showcaseRef}>
        <div className="value-zoom-wash" aria-hidden="true" />
        <div className="value-model value-model-traveller" ref={modelRef}>
          <div className="value-model-orbit" aria-hidden="true" />
          <div className="value-model-object"><PillarModelCard id={id} label={pillar.label} active={visible} animate={visible && !paused && !reduced} rotationRef={transitionRotation} /></div>
          <button className="value-motion" onClick={() => setPaused(!paused)} aria-label={`${paused ? 'Play' : 'Pause'} ${pillar.label} model animation`} aria-pressed={paused} disabled={reduced}>
            {paused || reduced ? <Play size={14} /> : <Pause size={14} />} <span>{reduced ? 'Reduced motion' : '3D emblem'}</span>
          </button>
        </div>
      <header className="value-intro">
        <div className="value-model-origin" ref={originRef} aria-hidden="true" />
        <div className="value-intro-copy">
          <p className="value-kicker"><span>0{index + 1} / Our core values</span><span className="value-dot" /> Service with humility</p>
          <p className="value-name font-dancing-script">{pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase()}</p>
          <h2 id={`${id}-title`}>{pillar.headline}</h2>
          <p className="value-description">{pillar.body}</p>
          <a className="value-explore-link" href={`#${id}-explorer`}>Explore the impact <ArrowDown size={16} /></a>
        </div>
      </header>

      <div className="value-stat-heading"><span>The impact at a glance</span><span>{activities.length} programmes · Reporting dates below</span></div>
      <div className="value-stats">
        <div className="value-stat-center" ref={destinationRef} aria-hidden="true" />
        {activities.slice(0, 4).map((activity, i) => (
          <a key={activity.id} href={`#${id}-explorer`} className="value-stat" onClick={() => setSelectedId(activity.id)}>
            <span className="value-stat-top">0{i + 1} <ArrowUpRight size={17} /></span>
            <strong>{activity.headline.value}</strong>
            <span className="value-stat-unit">{activity.headline.label}</span>
            <span className="value-stat-caption">{activity.title}</span>
            <small>{activity.period}</small>
          </a>
        ))}
      </div>
      </div>

      <div className="value-explorer" id={`${id}-explorer`} ref={explorerRef}>
        <div className="value-explorer-heading"><div><p className="value-kicker">Behind the numbers</p><h3>Small actions. Lasting change.</h3></div><p>Choose a programme to explore its reach.</p></div>
        <div className="value-explorer-grid">
          <div className="value-programmes" role="group" aria-label={`${pillar.label} programmes`}>
            {activities.map((activity, i) => (
              <button key={activity.id} id={activity.id} aria-pressed={activity.id === selected.id} aria-controls={`${id}-detail`} onClick={() => setSelectedId(activity.id)}>
                <span className="value-programme-num">0{i + 1}</span><span>{activity.title}</span><ArrowUpRight size={18} />
              </button>
            ))}
          </div>
          <article className="value-detail" id={`${id}-detail`} aria-live="polite" aria-atomic="true">
            <div className="value-detail-top"><span>Programme in focus</span><span><CalendarDays size={14} />{selected.period}</span></div>
            <div className="value-detail-summary value-detail-summary-with-model">
            <div ref={detailAnchorRef} className="value-detail-model-anchor" aria-hidden="true" />
            <h4>{selected.title}</h4>
            <p>{selected.blurb}</p>
            <div className="value-featured-number"><strong>{selected.headline.value}</strong><span>{selected.headline.label}</span></div>
            </div>
            <dl className="value-data-grid">{selected.dataPoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl>
            <p className="value-source">Source: foundation activity report · Figures shown as reported.</p>
          </article>
        </div>
      </div>
      <aside className="value-purpose"><div><p className="value-kicker">The purpose behind the progress</p><h3>{pillar.subText}</h3></div><ul>{pillar.keyHighlights.map((highlight, i) => <li key={highlight}><span>0{i + 1}</span>{highlight}</li>)}</ul></aside>
    </section>
  );
}

export const CoreValuesPage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => window.clearTimeout(timer);
  }, [hash]);
  return <PageShell accentPillarId="heal" eyebrow="Core Values · Heal · Enrich · Empower" title="The three cornerstones" standfirst="Compassion in action. Discover the programmes, people and reported progress behind Heal, Enrich and Empower." rail={<SubsectionNav label="Explore our impact" links={CORNERSTONES.map(id => ({ id, label: PILLARS.find(p => p.id === id)!.label, ink: PILLARS.find(p => p.id === id)!.accentB }))} />}>
    <div className="values-dashboard">{CORNERSTONES.map((id, index) => <ValueChapter key={id} id={id} index={index} linkedActivity={hash.slice(1)} />)}<p className="value-footnote">Figures reflect each programme’s stated reporting period. Different measures and periods are presented separately; they are not combined into a total.</p></div>
  </PageShell>;
};
