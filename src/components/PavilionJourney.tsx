/// <reference types="vite/client" />
import { getCMSCopy, getCMSSnapshot, subscribeCMS } from '../cms/runtime';
import { getPavilionSettings } from '../cms/pavilionSettings';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Pause, Play, Plus, X } from 'lucide-react';
import { PillarModelCard } from './PillarModelCard';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES, type Activity } from '../data/activities';
import type { createPavilion } from './PavilionScene';
import { PAVILION_GALLERY, pavilionPhase, pavilionProgress, pavilionScrollFraction } from '../data/pavilionGallery';
import './pavilion.css';
import { CurtainEntrance, entranceDistance, type CurtainEntranceHandle } from './CurtainEntrance';

export const PavilionJourney: React.FC = () => {
  const track = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null);
  const entrance=useRef<CurtainEntranceHandle>(null);
  const scene = useRef<ReturnType<typeof createPavilion> | null>(null);
  const progress = useRef(0), visible = useRef(false), uncovered = useRef(false), calm = useRef(false), stopped = useRef(false);
  const [step, setStep] = useState(0), [paused, setPaused] = useState(false), [failed, setFailed] = useState(false);
  const [record, setRecord] = useState<Activity | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(-1);
  const [approachingFinale, setApproachingFinale] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = PILLARS[step - 1];
  const update = () => {
    const active = visible.current && uncovered.current && progress.current < 4.99;
    const motion = active && !calm.current && !stopped.current && !document.hidden ? 'playing' : 'paused';
    if (track.current && track.current.dataset.pavilionMotion !== motion) track.current.dataset.pavilionMotion = motion;
    // Geometry is sampled once by the scroll reader, before any style writes.
    scene.current?.update(progress.current, active, calm.current, stopped.current);
  };
  useEffect(() => {
    stopped.current = paused || !!record; update();
  }, [paused, record]);
  useEffect(() => {
    if (!record) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.showModal();
    return () => { dialog.current?.close(); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [record]);
  useEffect(() => {
    let disposed = false, loading = false, raf = 0, geometryDirty = true;
    let buildScene: typeof createPavilion | undefined;
    const sceneKey = () => JSON.stringify([getPavilionSettings(), PAVILION_GALLERY, getCMSSnapshot().assets]);
    let appliedSceneKey = sceneKey();
    const unsubscribeCMS = subscribeCMS(() => {
      const nextKey = sceneKey();
      if (nextKey === appliedSceneKey) return;
      appliedSceneKey = nextKey;
      // Rebuild only when scene inputs change, never for live-stat or copy updates.
      if (disposed || !scene.current || !host.current || !buildScene) return;
      scene.current.dispose(); scene.current = null;
      try { scene.current = buildScene(host.current); setFailed(false); update(); }
      catch { setFailed(true); }
    });
    let viewport = innerHeight, entryLength = 0;
    let previousStep = -1, previousGallery = -2, previousFinale: boolean | undefined;
    const styles = new Map<string, string>();
    const style = (el: HTMLElement, name: string, value: string) => {
      if (styles.get(name) === value) return;
      styles.set(name, value); el.style.setProperty(name, value);
    };
    // Rebuild a mounted scene after development edits; otherwise removed objects persist.
    import.meta.hot?.accept('./PavilionScene', module => {
      if (disposed || !scene.current || !host.current || !module) return;
      scene.current.dispose();
      buildScene = module.createPavilion;
      scene.current = buildScene(host.current); update();
    });
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { calm.current = query.matches; read(); };
    calm.current=query.matches; query.addEventListener('change', motion);
    const read = () => {
      raf = 0;
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (geometryDirty) {
        viewport = innerHeight; entryLength = entranceDistance(); geometryDirty = false;
      }
      visible.current = rect.top < viewport && rect.bottom > 1;
      uncovered.current = -rect.top >= entryLength * .65;
      const entryDistance = entryLength;
      entrance.current?.update(rect.top,viewport,calm.current);
      const arrival=calm.current?1:Math.max(0,Math.min(1,(-rect.top-entryDistance*.55)/(entryDistance*.45)));
      style(el, '--entrance-copy', String(arrival*arrival*(3-2*arrival)));
      const walkStart=entryDistance+viewport*.375;
      progress.current = Math.min(5, pavilionProgress((-rect.top-walkStart) / Math.max(1, rect.height - viewport-walkStart)));
      const phase = pavilionPhase(progress.current);
      const index = progress.current <= .03 ? 0 : progress.current >= 4.8 ? 5 : phase.room + 1;
      const gallery = phase.gallery ? phase.photo : -1, finale = progress.current >= 4.2;
      if (gallery !== previousGallery) { previousGallery = gallery; setGalleryIndex(gallery); }
      if (finale !== previousFinale) { previousFinale = finale; setApproachingFinale(finale); }
      const exit = Math.max(0, Math.min(1, (progress.current - 4) / .2));
      style(el, '--projects-copy-opacity', String(1 - exit * exit * (3 - 2 * exit)));
      if (index !== previousStep) { previousStep = index; setStep(index); }
      const closing=Math.max(0,Math.min(1,(progress.current-4.8)/.18));
      const closed=closing*closing*closing*(closing*(closing*6-15)+10);
      style(el, '--exit-curtain-travel', `${(1-closed)*58}vw`);
      style(el, '--exit-curtain-copy', String(Math.max(0,(closed-.85)/.15)));
      if (el.dataset.exitCurtain !== String(closing > 0)) el.dataset.exitCurtain = String(closing > 0);
      style(el, '--journey-progress', String(progress.current / 5));
      update();
    };
    const scroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    const resize = () => { geometryDirty = true; scroll(); };
    const geometry = new ResizeObserver(resize);
    if (track.current) geometry.observe(track.current);
    const hero = document.getElementById('hero-clone-stage');
    if (hero) geometry.observe(hero);
    const observer = new IntersectionObserver(async ([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio > .002; update();
      if (!visible.current || loading || !host.current) return;
      loading = true;
      try {
        const { createPavilion } = await import('./PavilionScene');
        if (disposed || !host.current) return;
        buildScene = createPavilion; appliedSceneKey = sceneKey();
        scene.current = buildScene(host.current); update();
      } catch { if (!disposed) setFailed(true); }
    }, { threshold: [0, .002] });
    observer.observe(host.current!); read();
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    return () => { disposed = true; unsubscribeCMS(); cancelAnimationFrame(raf); observer.disconnect(); geometry.disconnect(); document.removeEventListener('visibilitychange', update); query.removeEventListener('change', motion); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize); scene.current?.dispose(); scene.current = null; };
  }, []);
  const go = (index: number) => {
    const el = track.current;
    if (!el) return;
    const destination = index === 0 || index === 5 ? index : index - .8;
    const entryDistance=entranceDistance()+innerHeight*.375;
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + entryDistance + (el.offsetHeight - innerHeight-entryDistance) * pavilionScrollFraction(destination), behavior: calm.current ? 'instant' : 'smooth' });
  };
  return <section id="pillars-section" className="pavilion-track" data-pavilion="true" ref={track} aria-label={getCMSCopy("copy.PavilionJourney.388eff14452d", "Our work — an immersive journey")}>
    <CurtainEntrance ref={entrance}/>
    <div className="pavilion-stage" data-chapter={current?.id} data-exhibit-side={step === 2 || step === 4 ? 'left' : 'right'} data-gallery={galleryIndex >= 0} data-farewell={step === 5 || approachingFinale}>
      <div ref={host} className="pavilion-scene" data-failed={failed || undefined} />
      <div className="pavilion-shade" data-centred={step === 0 || step === 5} aria-hidden="true" />
      <div className="pavilion-topline"><span>{getCMSCopy("copy.PavilionJourney.720c2c4bc21b", "SNCF / The pavilion of service")}</span></div>

      {step === 0 ? <div className="pavilion-welcome" key="welcome">
        <p className="pavilion-eyebrow">{getCMSCopy("copy.PavilionJourney.269b4d29d9e2", "Compassion, given a place to grow")}</p><h2>{getCMSCopy("copy.PavilionJourney.fc967e87a6e8", "Our work")}</h2><p>{getCMSCopy("copy.PavilionJourney.3a7b474ee02a", "A walk through the lives we touch.")}<br />{getCMSCopy("copy.PavilionJourney.eee670c33892", "Four paths. One shared purpose.")}</p>
        <button className="pavilion-enter" onClick={() => {
          const el = track.current!;
          const entryDistance=entranceDistance()+innerHeight*.375;
          window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + entryDistance + (el.offsetHeight - innerHeight-entryDistance) * pavilionScrollFraction(.125), behavior: calm.current ? 'instant' : 'smooth' });
        }}><span><ArrowDown size={21} /></span>{getCMSCopy("copy.PavilionJourney.115f75f7ffd1", "Step inside")}</button>
      </div> : step === 5 ? <div className="pavilion-exit-next"><button className="pavilion-text-link" onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: calm.current ? 'instant' : 'smooth' })}>{getCMSCopy("copy.PavilionJourney.2b20284541a9", "Discover what’s next ")}<ArrowUpRight size={17}/></button></div> : approachingFinale ? null : galleryIndex >= 0 ? <div className="pavilion-gallery-caption" key={`${step}-${galleryIndex}`}>
        {step===4&&galleryIndex<2&&<div className="pavilion-project-logo"><PillarModelCard id={galleryIndex===0?'amrit':'oneness'} label={galleryIndex===0?'Project Amrit':'Oneness Vann'} animate={false} active={false} /></div>}
        <p className="pavilion-eyebrow">{getCMSCopy("copy.PavilionJourney.103c5169871d", "The ")}{current.label.toLowerCase()}{getCMSCopy("copy.PavilionJourney.e15716af068c", " gallery · ")}{galleryIndex + 1}{getCMSCopy("copy.PavilionJourney.44a0728e8c60", " / 5")}</p>
        <h2>{PAVILION_GALLERY[step - 1][galleryIndex]?.caption}</h2>
        <p>{step===4&&galleryIndex<2?'Illustrative nature film':'Illustrative photography'}{getCMSCopy("copy.PavilionJourney.97a31a8fc765", " · Scroll to walk through the gallery")}</p>
        <button className="pavilion-text-link" onClick={() => go(Math.min(5,step+1))}>{getCMSCopy("copy.PavilionJourney.09d5da25e90b", "Continue the journey ")}<ArrowUpRight size={15} /></button>
      </div> : <div className="pavilion-exhibit" key={current.id} style={current.id === 'projects' ? { opacity: 'var(--projects-copy-opacity, 1)' } : undefined}>
        <p className="pavilion-eyebrow">{getCMSCopy("copy.PavilionJourney.5feceb66ffc8", "0")}{step}{getCMSCopy("copy.PavilionJourney.db4b169d05b4", " / A cornerstone of service")}</p>
        <h2>{current.label.charAt(0) + current.label.slice(1).toLowerCase()}</h2><h3>{current.headline}</h3><p className="pavilion-body">{current.body}</p>
        <div className="pavilion-feature"><strong>{ACTIVITIES.find(a => a.pillarId === current.id)!.headline.value}</strong><div><span>{ACTIVITIES.find(a => a.pillarId === current.id)!.headline.label}</span><small>{ACTIVITIES.find(a => a.pillarId === current.id)!.period}</small></div></div>
        <div className="pavilion-hotspots" aria-label={`${current.label} activities`}>{ACTIVITIES.filter(a => a.pillarId === current.id).map(activity => <button key={activity.id} onClick={() => setRecord(activity)}><Plus size={13} /><span>{activity.title}</span></button>)}</div>
        <Link className="pavilion-text-link" to={current.id === 'projects' ? '/projects' : `/core-values#${current.id}`}>{getCMSCopy("copy.PavilionJourney.94af8c6e3737", "Explore the full story ")}<ArrowUpRight size={16} /></Link>
      </div>}

      <div className="pavilion-progress" aria-hidden="true"><span /></div>
    </div>
    {record && <dialog ref={dialog} className="pavilion-record" aria-labelledby="pavilion-record-title" onCancel={() => setRecord(null)} onClick={event => { if (event.target === event.currentTarget) setRecord(null); }}><div className="pavilion-record-inner"><button className="pavilion-record-close" onClick={() => setRecord(null)} aria-label={getCMSCopy("copy.PavilionJourney.a094532951fd", "Close activity details")}><X size={21} /></button><p className="pavilion-eyebrow">{getCMSCopy("copy.PavilionJourney.753ae72bda65", "The story behind the service")}</p><h3 id="pavilion-record-title">{record.title}</h3><p>{record.blurb}</p><p className="pavilion-record-date">{record.period}</p><dl>{record.dataPoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl><small>{getCMSCopy("copy.PavilionJourney.4fb8b288060e", "Source: SNCF activity report. Figures as reported.")}</small></div></dialog>}
  </section>;
};
