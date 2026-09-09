import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, CalendarDays, Droplets, Trees, Mountain, House, Building2, Pause, Play } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { PillarModelCard } from '../components/PillarModelCard';
import { MediaGallery } from '../components/MediaGallery';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ACTIVITIES, type Activity } from '../data/activities';
import { mediaReady } from '../data/media';
import './projects.css';

const PROJECTS = ACTIVITIES.filter(a => a.pillarId === 'projects');
const FACES = [
  { ink: '#087d8b', light: '#bce7e5', label: 'Water', scope: 'Launched 2023 · with the Government of India', icon: Droplets, image: 'projects-1', alt: 'A river flowing through a green forest', line: 'A fresh chapter for our water.' },
  { ink: '#36744b', light: '#d2e8b7', label: 'Forests', scope: 'Launched 2021 · indigenous micro-forests', icon: Trees, image: 'empower-5', alt: 'Sunlight falling through a forest canopy', line: 'Small forests. A greener future.' },
  { ink: '#98612b', light: '#f4dfb6', label: 'Land', scope: 'Arid-zone rejuvenation', icon: Mountain, image: 'projects-4', alt: 'Agricultural land in the evening light', line: 'Restoring the land that sustains us.' },
  { ink: '#856098', light: '#e6d9ee', label: 'Communities', scope: 'Since 2017 · Haryana', icon: House, image: 'enrich-2', alt: 'Students learning together in a classroom', line: 'Growing stronger, together.' },
];
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const inkStyle = (i: number) => ({ '--project-ink': FACES[i].ink, '--project-light': FACES[i].light } as React.CSSProperties);

const ProjectsCover: React.FC = () => {
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches); sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <section ref={root} className="projects-cover" aria-labelledby="projects-heading">
    <div className="projects-cover-copy"><p className="project-eyebrow">Service that takes shape</p>
      <h1 id="projects-heading">Built for people.<br /><em>Rooted in purpose.</em></h1>
      <p>From reviving water bodies to growing forests and supporting villages, discover how our values become lasting projects.</p>
      <a href="#projects-directory" className="project-primary-link">Explore our projects <ArrowDown size={17} /></a>
      <div className="projects-cover-index"><span><strong>04</strong> Named campaigns</span><span><strong>01</strong> Healthcare campus in development</span></div>
    </div>
    <div className="projects-cover-art"><div className="projects-cover-orbit" aria-hidden="true" /><span className="project-orbit-label label-water">Water</span><span className="project-orbit-label label-nature">Nature</span><span className="project-orbit-label label-community">Community</span>
      <div className="projects-cover-model"><PillarModelCard id="projects" label="Projects" active={active} animate={active && !paused && !reduced} /></div>
      <button className="project-motion" onClick={() => setPaused(!paused)} aria-pressed={paused} disabled={reduced} aria-label={paused ? 'Resume projects emblem' : 'Pause projects emblem'}>{paused ? <Play size={13} /> : <Pause size={13} />} {reduced ? 'Reduced motion' : '3D emblem'}</button>
    </div>
  </section>;
};

const ProjectChapter: React.FC<{ project: Activity; index: number }> = ({ project, index }) => {
  const face = FACES[index], Icon = face.icon;
  const [metric, setMetric] = useState(project.dataPoints.findIndex(d => d.label === project.headline.label));
  const selected = project.dataPoints[metric] ?? project.headline;
  const id = slug(project.title);
  return <section id={id} className="project-chapter" style={inkStyle(index)} aria-labelledby={`${id}-title`}>
    <header className="project-chapter-heading"><span className="project-chapter-number">0{index + 1}</span><div><p className="project-eyebrow">{face.label} / {face.scope}</p><h2 id={`${id}-title`}>{project.title}</h2></div><Icon size={32} strokeWidth={1.4} aria-hidden="true" /></header>
    <div className="project-story-grid">
      <figure className="project-landscape"><img src={`/images/pavilion/${face.image}.jpg`} alt={`Illustrative photograph: ${face.alt}`} loading="lazy" decoding="async" /><div className="project-landscape-wash" /><div className="project-landscape-title"><Icon size={30} /><h3>{face.line}</h3></div><figcaption>Illustrative photography</figcaption></figure>
      <div className="project-report"><div className="project-report-top"><span className="project-eyebrow">The project in focus</span>{index === 0 && <img className="project-amrit-logo" src="/images/projects/amrit.webp" alt="Swachh Jal, Swachh Man — clean water, clean mind" loading="lazy" />}</div>
        <p className="project-blurb">{project.blurb}</p>
        <div className="project-selected-metric" key={selected.label} aria-live="polite" aria-atomic="true"><strong>{selected.value}</strong><span>{selected.label}</span></div>
        <p className="project-report-date"><CalendarDays size={14} /> {project.period}</p>
        <p className="project-metric-hint">Choose a measure to bring it into focus</p>
        <div className="project-metric-options" role="group" aria-label={`${project.title} reported measures`}>{project.dataPoints.map((point, i) => <button key={point.label} onClick={() => setMetric(i)} aria-pressed={i === metric}><span>{point.label}</span><strong>{point.value}</strong></button>)}</div>
        <p className="project-source">Foundation activity report · Figures shown as reported.</p>
      </div>
    </div>
    {mediaReady(id) > 0 && <MediaGallery section={id} title={`${project.title} — photographs & films`} />}
    <a className="project-next" href={`#${index < 3 ? slug(PROJECTS[index + 1].title) : 'health-city'}`}><span>Continue exploring</span><strong>{index < 3 ? PROJECTS[index + 1].title : 'Sant Nirankari Health City'}</strong><ArrowDown size={19} /></a>
  </section>;
};

export const ProjectsPage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => clearTimeout(timer);
  }, [hash]);
  return <PageShell accentPillarId="projects" eyebrow="Projects" title="Our projects" standfirst="Service with a lasting footprint." cover={<ProjectsCover />} rail={<SubsectionNav label="Explore projects" links={[...PROJECTS.map((p, i) => ({ id: slug(p.title), label: p.title.replace(/^Project /, ''), ink: FACES[i].light })), { id: 'health-city', label: 'Health City', ink: '#b8daed' }]} />}>
    <div className="projects-editorial">
      <section className="projects-directory" id="projects-directory" aria-labelledby="projects-directory-title"><div className="projects-directory-heading"><p className="project-eyebrow">Find your connection</p><h2 id="projects-directory-title">Different paths. Shared purpose.</h2><p>Choose a project and explore its reported reach.</p></div><div className="projects-directory-grid">{PROJECTS.map((p,i) => { const Icon = FACES[i].icon; return <a key={p.id} href={`#${slug(p.title)}`} style={inkStyle(i)}><span><Icon size={25} strokeWidth={1.5} /><small>0{i + 1}</small></span><h3>{p.title.replace(/^Project /,'')}</h3><p>{FACES[i].label}</p><ArrowUpRight size={20} /></a>; })}</div></section>
      {PROJECTS.map((project,index) => <ProjectChapter key={project.id} project={project} index={index} />)}
      <section className="project-health-city" id="health-city" aria-labelledby="health-city-title"><div className="health-city-art" aria-hidden="true"><Building2 size={140} strokeWidth={.65} /><span>Care, built for tomorrow.</span></div><div><p className="project-eyebrow">The next chapter / Under construction</p><h2 id="health-city-title">Sant Nirankari<br /><em>Health City</em></h2><p>A multi-specialty charitable hospital campus in North Delhi, intended to make advanced treatment more accessible.</p><p className="project-health-note">Activity figures will be added when the campus opens and reporting begins.</p><a className="project-primary-link" href="https://www.nirankarihealthcity.org/" target="_blank" rel="noopener noreferrer">Follow its progress <ArrowUpRight size={17} /></a></div></section>
      <p className="projects-report-note">Each project’s figures retain their own reporting period and units. Different measures are not combined into a single total.</p>
    </div>
  </PageShell>;
};
