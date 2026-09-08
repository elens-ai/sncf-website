import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Plus, X } from 'lucide-react';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES, type Activity } from '../data/activities';
import type { createPavilion } from './PavilionScene';
import { PAVILION_GALLERY, pavilionPhase } from '../data/pavilionGallery';
import './pavilion.css';

const STOPS = ['Our Work', 'Heal', 'Enrich', 'Empower', 'Projects', 'Thank You'];
export const PavilionJourney: React.FC = () => {
  const track = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createPavilion> | null>(null);
  const progress = useRef(0), visible = useRef(false), calm = useRef(false), stopped = useRef(false);
  const [step, setStep] = useState(0), [paused, setPaused] = useState(false), [failed, setFailed] = useState(false);
  const [record, setRecord] = useState<Activity | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(-1);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = PILLARS[step - 1];
  const update = () => scene.current?.update(progress.current, visible.current, calm.current, stopped.current);
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
    let disposed = false, loading = false, raf = 0;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { calm.current = query.matches; update(); };
    motion(); query.addEventListener('change', motion);
    const read = () => {
      raf = 0;
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      visible.current = rect.top < innerHeight && rect.bottom > 1;
      progress.current = Math.max(0, Math.min(5, -rect.top / Math.max(1, rect.height - innerHeight) * 5));
      const phase = pavilionPhase(progress.current);
      const index = progress.current <= .03 ? 0 : progress.current >= 4.8 ? 5 : phase.room + 1;
      setGalleryIndex(phase.gallery ? phase.photo : -1);
      setStep(previous => previous === index ? previous : index);
      el.style.setProperty('--journey-progress', `${progress.current / 5 * 100}%`);
      update();
    };
    const scroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    const observer = new IntersectionObserver(async ([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio > .002; update();
      if (!visible.current || loading || !host.current) return;
      loading = true;
      try {
        const { createPavilion } = await import('./PavilionScene');
        if (disposed || !host.current) return;
        scene.current = createPavilion(host.current); update();
      } catch { if (!disposed) setFailed(true); }
    }, { threshold: [0, .002] });
    observer.observe(host.current!); read();
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll);
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); query.removeEventListener('change', motion); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); scene.current?.dispose(); scene.current = null; };
  }, []);
  const go = (index: number) => {
    const el = track.current;
    if (!el) return;
    const destination = index === 0 || index === 5 ? index : index - .08;
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + (el.offsetHeight - innerHeight) * destination / 5, behavior: calm.current ? 'instant' : 'smooth' });
  };
  return <section id="pillars-section" className="pavilion-track" data-pavilion="true" ref={track} aria-label="Our work — an immersive journey">
    <div className="pavilion-stage" data-exhibit-side={step === 2 || step === 4 ? 'left' : 'right'} data-gallery={galleryIndex >= 0}>
      <div ref={host} className="pavilion-scene" data-failed={failed || undefined} />
      <div className="pavilion-shade" data-centred={step === 0 || step === 5} aria-hidden="true" />
      <div className="pavilion-topline"><span>SNCF / The pavilion of service</span><div><span>0{step + 1} — 06</span><button onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume pavilion animation' : 'Pause pavilion animation'}>{paused ? <Play size={15} /> : <Pause size={15} />}</button><button onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'instant' })}>Skip tour <ArrowUpRight size={13} /></button></div></div>

      {step === 0 ? <div className="pavilion-welcome" key="welcome">
        <p className="pavilion-eyebrow">Compassion, given a place to grow</p><h2>Our work</h2><p>A walk through the lives we touch.<br />Four paths. One shared purpose.</p>
        <button className="pavilion-enter" onClick={() => {
          const el = track.current!;
          window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + (el.offsetHeight - innerHeight) * .025, behavior: calm.current ? 'instant' : 'smooth' });
        }}><span><ArrowDown size={21} /></span>Step inside</button>
      </div> : step === 5 ? <div className="pavilion-welcome pavilion-farewell" key="farewell">
        <img src="/images/vertical-heal.webp" alt="" /><p className="pavilion-eyebrow">Service with humility</p><h2>Thank You<br />for Visiting</h2><p>The journey continues in every act of kindness.</p><button className="pavilion-text-link" onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: calm.current ? 'instant' : 'smooth' })}>Discover what’s next <ArrowUpRight size={17} /></button>
      </div> : galleryIndex >= 0 ? <div className="pavilion-gallery-caption" key={`${step}-${galleryIndex}`}>
        <p className="pavilion-eyebrow">The {current.label.toLowerCase()} gallery · {galleryIndex + 1} / 5</p>
        <h2>{PAVILION_GALLERY[step - 1][galleryIndex]?.caption}</h2>
        <p>Illustrative photography · Scroll to walk through the gallery</p>
        <button className="pavilion-text-link" onClick={() => go(step)}>Continue to {current.label.toLowerCase()} <ArrowUpRight size={15} /></button>
      </div> : <div className="pavilion-exhibit" key={current.id}>
        <p className="pavilion-eyebrow">0{step} / A cornerstone of service</p>
        <h2>{current.label.charAt(0) + current.label.slice(1).toLowerCase()}</h2><h3>{current.headline}</h3><p className="pavilion-body">{current.body}</p>
        <div className="pavilion-feature"><strong>{ACTIVITIES.find(a => a.pillarId === current.id)!.headline.value}</strong><div><span>{ACTIVITIES.find(a => a.pillarId === current.id)!.headline.label}</span><small>{ACTIVITIES.find(a => a.pillarId === current.id)!.period}</small></div></div>
        <div className="pavilion-hotspots" aria-label={`${current.label} activities`}>{ACTIVITIES.filter(a => a.pillarId === current.id).map(activity => <button key={activity.id} onClick={() => setRecord(activity)}><Plus size={13} /><span>{activity.title}</span></button>)}</div>
        <Link className="pavilion-text-link" to={current.id === 'projects' ? '/projects' : `/core-values#${current.id}`}>Explore the full story <ArrowUpRight size={16} /></Link>
      </div>}
      {step > 0 && step < 5 && galleryIndex < 0 && <button className="pavilion-object-point" onClick={() => setRecord(ACTIVITIES.find(a => a.pillarId === current.id)!)} aria-label={`Discover ${current.label} impact`}><span><Plus size={20} /></span><small>Discover the impact</small></button>}
      <nav className="pavilion-nav" aria-label="Pavilion chapters"><button onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} aria-label="Previous pavilion chapter"><ChevronLeft size={18} /></button><div>{STOPS.map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} onClick={() => go(i)}><span>0{i + 1}</span>{label}</button>)}</div><button onClick={() => go(Math.min(5, step + 1))} disabled={step === 5} aria-label="Next pavilion chapter"><ChevronRight size={18} /></button></nav>
      <div className="pavilion-progress" aria-hidden="true"><span /></div>
    </div>
    {record && <dialog ref={dialog} className="pavilion-record" aria-labelledby="pavilion-record-title" onCancel={() => setRecord(null)} onClick={event => { if (event.target === event.currentTarget) setRecord(null); }}><div className="pavilion-record-inner"><button className="pavilion-record-close" onClick={() => setRecord(null)} aria-label="Close activity details"><X size={21} /></button><p className="pavilion-eyebrow">The story behind the service</p><h3 id="pavilion-record-title">{record.title}</h3><p>{record.blurb}</p><p className="pavilion-record-date">{record.period}</p><dl>{record.dataPoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl><small>Source: SNCF activity report. Figures as reported.</small></div></dialog>}
  </section>;
};
