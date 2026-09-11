import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import { CMSSection } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
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

const getProjects = () => ACTIVITIES.filter(a => a.pillarId === 'projects');
let FACES = bindCMSValue(() => ([
  { ink: '#087d8b', light: '#bce7e5', label: getCMSCopy("copy.ProjectsPage.7ca7dea90680", "Water"), scope: getCMSCopy("copy.ProjectsPage.41bcc0f77ef0", "Launched 2023 · with the Government of India"), icon: Droplets, image: 'projects-1', alt: getCMSCopy("copy.ProjectsPage.5753ec312396", "A river flowing through a green forest"), line: getCMSCopy("copy.ProjectsPage.4463a32132e7", "A fresh chapter for our water.") },
  { ink: '#36744b', light: '#d2e8b7', label: getCMSCopy("copy.ProjectsPage.62d19b520233", "Forests"), scope: getCMSCopy("copy.ProjectsPage.f2371d5ab799", "Launched 2021 · indigenous micro-forests"), icon: Trees, image: 'empower-5', alt: getCMSCopy("copy.ProjectsPage.99d9cffb9d24", "Sunlight falling through a forest canopy"), line: getCMSCopy("copy.ProjectsPage.a13a9cf8fa7d", "Small forests. A greener future.") },
  { ink: '#98612b', light: '#f4dfb6', label: getCMSCopy("copy.ProjectsPage.b6baff9358dd", "Land"), scope: getCMSCopy("copy.ProjectsPage.c406304d0b71", "Arid-zone rejuvenation"), icon: Mountain, image: 'projects-4', alt: getCMSCopy("copy.ProjectsPage.7757a5c80e41", "Agricultural land in the evening light"), line: getCMSCopy("copy.ProjectsPage.c2dc7b1fa516", "Restoring the land that sustains us.") },
  { ink: '#856098', light: '#e6d9ee', label: getCMSCopy("copy.ProjectsPage.c864f329f5dd", "Communities"), scope: getCMSCopy("copy.ProjectsPage.904eb1d10ff3", "Since 2017 · Haryana"), icon: House, image: 'enrich-2', alt: getCMSCopy("copy.ProjectsPage.be0da16a46ae", "Students learning together in a classroom"), line: getCMSCopy("copy.ProjectsPage.c2eb86f270ec", "Growing stronger, together.") },
]), value => { FACES = value; });
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const inkStyle = (i: number) => ({ '--project-ink': FACES[i % FACES.length].ink, '--project-light': FACES[i % FACES.length].light } as React.CSSProperties);

const ProjectsCover: React.FC = () => {
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches); sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <section ref={root} className="projects-cover" aria-labelledby="projects-heading">
    <div className="projects-cover-copy"><p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.982a72dda0d4", "Service that takes shape")}</p>
      <h1 id="projects-heading">{getCMSCopy("copy.ProjectsPage.988b94ac8a81", "Built for people.")}<br /><em>{getCMSCopy("copy.ProjectsPage.27f463b7e8ab", "Rooted in purpose.")}</em></h1>
      <p>{getCMSCopy("copy.ProjectsPage.d90ca7d5eb20", "From reviving water bodies to growing forests and supporting villages, discover how our values become lasting projects.")}</p>
      <a href={getCMSLink("copy.Link.ProjectsPage.6a68430d8c61", "#projects-directory")} className="project-primary-link">{getCMSCopy("copy.ProjectsPage.1102171bd1b3", "Explore our projects ")}<ArrowDown size={17} /></a>
      <div className="projects-cover-index"><span><strong>{getCMSCopy("copy.ProjectsPage.6cd5b6e51936", "04")}</strong>{getCMSCopy("copy.ProjectsPage.ba61ddf6e8f7", " Named campaigns")}</span><span><strong>{getCMSCopy("copy.ProjectsPage.938db8c9f82c", "01")}</strong>{getCMSCopy("copy.ProjectsPage.c0c0d22814e2", " Healthcare campus in development")}</span></div>
    </div>
    <div className="projects-cover-art">
      <div className="projects-cover-model"><PillarModelCard id="projects" label={getCMSCopy("copy.ProjectsPage.04e2a9728af7", "Projects")} active={active} animate={active && !reduced} /></div>

    </div>
  </section>;
};

const ProjectEmblem = ({ id, label }: { id: string; label: string }) => {
  const root = useRef<HTMLDivElement>(null);
  const active = useSectionActivity(root);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <div ref={root} className="project-amrit-emblem">
    <div className="project-amrit-model"><PillarModelCard id={id} label={label} active={active} animate={active && !reduced} /></div>

  </div>;
};

const ProjectChapter: React.FC<{ project: Activity; index: number }> = ({ project, index }) => {
  const face = FACES[index % FACES.length], Icon = face.icon;
  const [metric, setMetric] = useState(project.dataPoints.findIndex(d => d.label === project.headline.label));
  const selected = project.dataPoints[metric] ?? project.headline;
  const id = slug(project.title);
  const modelId = project.id === 'oneness-vann' ? 'oneness' : index === 0 ? 'amrit' : null;
  return <section id={id} className="project-chapter" style={inkStyle(index)} aria-labelledby={`${id}-title`}>
    <header className="project-chapter-heading"><span className="project-chapter-number">{getCMSCopy("copy.ProjectsPage.5feceb66ffc8", "0")}{index + 1}</span><div><p className="project-eyebrow">{face.label} / {face.scope}</p><h2 id={`${id}-title`}>{project.title}</h2></div><Icon size={32} strokeWidth={1.4} aria-hidden="true" /></header>
    <div className="project-story-grid">
      <figure className="project-landscape"><img src={resolveCMSMedia(`/images/pavilion/${face.image}.jpg`)} alt={`Illustrative photograph: ${face.alt}`} loading="lazy" decoding="async" /><div className="project-landscape-wash" /><div className="project-landscape-title"><Icon size={30} /><h3>{face.line}</h3></div><figcaption>{getCMSCopy("copy.ProjectsPage.9970f438a483", "Illustrative photography")}</figcaption></figure>
      <div className="project-report"><div className="project-report-top"><span className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.6fb73aee5b23", "The project in focus")}</span></div>
        <p className="project-blurb">{project.blurb}</p>
        <div className={modelId ? 'project-impact-row' : undefined}>
          <div className="project-impact-copy">
            <div className="project-selected-metric" key={selected.label} aria-live="polite" aria-atomic="true"><strong>{selected.value}</strong><span>{selected.label}</span></div>
            <p className="project-report-date"><CalendarDays size={14} /> {project.period}</p>
          </div>
          {modelId && <ProjectEmblem id={modelId} label={project.title} />}
        </div>
        <p className="project-metric-hint">{getCMSCopy("copy.ProjectsPage.3bf1f1dbe9e6", "Choose a measure to bring it into focus")}</p>
        <div className="project-metric-options" role="group" aria-label={`${project.title} reported measures`}>{project.dataPoints.map((point, i) => <button key={point.label} onClick={() => setMetric(i)} aria-pressed={i === metric}><span>{point.label}</span><strong>{point.value}</strong></button>)}</div>
        <p className="project-source">{getCMSCopy("copy.ProjectsPage.7f9ff188f627", "Foundation activity report · Figures shown as reported.")}</p>
      </div>
    </div>
    {mediaReady(id) > 0 && <MediaGallery section={id} title={`${project.title} — photographs & films`} />}
    <a className="project-next" href={`#${getProjects()[index+1] ? slug(getProjects()[index + 1].title) : 'health-city'}`}><span>{getCMSCopy("copy.ProjectsPage.ba12ecefbd57", "Continue exploring")}</span><strong>{getProjects()[index+1] ? getProjects()[index + 1].title : 'Sant Nirankari Health City'}</strong><ArrowDown size={19} /></a>
  </section>;
};

export const ProjectsPage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => clearTimeout(timer);
  }, [hash]);
  return <PageShell accentPillarId="projects" eyebrow={getCMSCopy("copy.ProjectsPage.04e2a9728af7", "Projects")} title={getCMSCopy("copy.ProjectsPage.36fc0059896e", "Our projects")} standfirst={getCMSCopy("copy.ProjectsPage.995f1e05cac7", "Service with a lasting footprint.")} cover={<ProjectsCover />} rail={<SubsectionNav label={getCMSCopy("copy.ProjectsPage.69c5a4506f97", "Explore projects")} links={[...getProjects().map((p, i) => ({ id: slug(p.title), label: p.title.replace(/^Project /, ''), ink: FACES[i % FACES.length].light })), { id: 'health-city', label: getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City"), ink: '#b8daed' }]} />}>
    <div className="projects-editorial">
      <CMSSection id="ProjectsPage.projects-directory"><section className="projects-directory" id="projects-directory" aria-labelledby="projects-directory-title"><div className="projects-directory-heading"><p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.bacc0f922481", "Find your connection")}</p><h2 id="projects-directory-title">{getCMSCopy("copy.ProjectsPage.7fad847159d2", "Different paths. Shared purpose.")}</h2><p>{getCMSCopy("copy.ProjectsPage.f4f7c6cc0c7e", "Choose a project and explore its reported reach.")}</p></div><div className="projects-directory-grid">{getProjects().map((p,i) => { const Icon = FACES[i % FACES.length].icon; return <a key={p.id} href={`#${slug(p.title)}`} style={inkStyle(i)}><span><Icon size={25} strokeWidth={1.5} /><small>{getCMSCopy("copy.ProjectsPage.5feceb66ffc8", "0")}{i + 1}</small></span><h3>{p.title.replace(/^Project /,'')}</h3><p>{FACES[i % FACES.length].label}</p><ArrowUpRight size={20} /></a>; })}</div></section></CMSSection>
      {getProjects().map((project,index) => <ProjectChapter key={project.id} project={project} index={index} />)}
      <CMSSection id="ProjectsPage.health-city"><section className="project-health-city" id="health-city" aria-labelledby="health-city-title"><div className="health-city-art" aria-hidden="true"><Building2 size={140} strokeWidth={.65} /><span>{getCMSCopy("copy.ProjectsPage.4fa87dc022be", "Care, built for tomorrow.")}</span></div><div><p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.3532c25e1c80", "The next chapter / Under construction")}</p><h2 id="health-city-title">{getCMSCopy("copy.ProjectsPage.3eeeb717e545", "Sant Nirankari")}<br /><em>{getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City")}</em></h2><p>{getCMSCopy("copy.ProjectsPage.d39d7428ab57", "A multi-specialty charitable hospital campus in North Delhi, intended to make advanced treatment more accessible.")}</p><p className="project-health-note">{getCMSCopy("copy.ProjectsPage.25984a49f9a1", "Activity figures will be added when the campus opens and reporting begins.")}</p><a className="project-primary-link" href={getCMSLink("copy.Link.ProjectsPage.b03f7697e124", "https://www.nirankarihealthcity.org/")} target="_blank" rel="noopener noreferrer">{getCMSCopy("copy.ProjectsPage.5e3c06e2cdd5", "Follow its progress ")}<ArrowUpRight size={17} /></a></div></section></CMSSection>
      <p className="projects-report-note">{getCMSCopy("copy.ProjectsPage.4a4eb64be162", "Each project’s figures retain their own reporting period and units. Different measures are not combined into a single total.")}</p>
    </div>
  </PageShell>;
};
