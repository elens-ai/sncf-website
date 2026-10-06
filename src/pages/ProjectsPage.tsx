import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, CalendarDays, Droplets, Trees, Mountain, House, Hospital } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { PageShell } from '../components/PageShell';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { PillarArtwork } from '../components/PillarArtwork';
import { SubsectionNav } from '../components/SubsectionNav';
import { PillarModelCard } from '../components/PillarModelCard';
import { ProjectAnalytics } from '../components/ProjectAnalytics';
import { ProjectOrbit } from '../components/ProjectOrbit';
import { ProgrammeDossier } from '../components/ProgrammeDossier';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { HealthCityFeature } from '../components/HealthCityFeature';
import { ExploreTabs, type ExploreTab } from '../components/ExploreTabs';
import { ReportActions } from '../components/ReportActions';
import { PillarGallery } from '../components/PillarGallery';
import { SdgTags, UnepSeal } from '../components/UnAffiliation';
import { Saying, hasSaying, type SayingId } from '../components/Saying';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ACTIVITIES, type Activity } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { subjectFor } from '../utils/waves';
import { MEDIA } from '../data/media';
import { PAVILION_GALLERY, roomPhotoFor } from '../data/pavilionGallery';
import { PROGRAMME_SDGS } from '../data/sdgs';
import { slug } from '../utils/slug';
import './projects.css';

const getProjects = () => ACTIVITIES.filter(a => a.pillarId === 'projects');
let FACES = bindCMSValue(() => ([
  { ink: '#087d8b', light: '#bce7e5', label: getCMSCopy("copy.ProjectsPage.7ca7dea90680", "Water"), scope: getCMSCopy("copy.ProjectsPage.41bcc0f77ef0", "Launched 2023 · with the Government of India"), icon: Droplets, image: 'projects-1', alt: getCMSCopy("copy.ProjectsPage.faceWaterAlt", "Project Amrit volunteers clearing a riverbank in Mantova, Italy"), line: getCMSCopy("copy.ProjectsPage.4463a32132e7", "A fresh chapter for our water.") },
  { ink: '#36744b', light: '#d2e8b7', label: getCMSCopy("copy.ProjectsPage.62d19b520233", "Forests"), scope: getCMSCopy("copy.ProjectsPage.f2371d5ab799", "Launched 2021 · indigenous micro-forests"), icon: Trees, image: 'projects-2', alt: getCMSCopy("copy.ProjectsPage.faceForestAlt", "Women planting saplings for a Oneness Vann micro-forest in Solapur"), line: getCMSCopy("copy.ProjectsPage.a13a9cf8fa7d", "Small forests. A greener future.") },
  { ink: '#98612b', light: '#f4dfb6', label: getCMSCopy("copy.ProjectsPage.b6baff9358dd", "Land"), scope: getCMSCopy("copy.ProjectsPage.c406304d0b71", "Arid-zone rejuvenation"), icon: Mountain, image: 'empower-2', illustrative: true, alt: getCMSCopy("copy.ProjectsPage.faceLandAlt", "A volunteer plants a sapling on a hillside"), line: getCMSCopy("copy.ProjectsPage.c2dc7b1fa516", "Restoring the land that sustains us.") },
  { ink: '#856098', light: '#e6d9ee', label: getCMSCopy("copy.ProjectsPage.c864f329f5dd", "Communities"), scope: getCMSCopy("copy.ProjectsPage.904eb1d10ff3", "Since 2017 · Haryana"), icon: House, image: '/images/programmes/adopted-villages-mandaura.webp', alt: getCMSCopy("copy.ProjectsPage.faceCommunitiesAlt", "A volunteer checks an elderly villager in Mandaura, an adopted village"), line: getCMSCopy("copy.ProjectsPage.c2eb86f270ec", "Growing stronger, together.") },
]), value => { FACES = value; });
const inkStyle = (i: number) => ({ '--project-ink': FACES[i % FACES.length].ink, '--project-light': FACES[i % FACES.length].light } as React.CSSProperties);

/* a project's name on the cover: Amrit, Oneness Vann, Watershed, Adopted Villages */
const shortName = (project: Activity) => project.title.replace(/^Project /, '').replace(/ Programme$/, '');

/* beneath the orbit the projects speak in short lines (their chapters below give the sayings in
   full): Project Amrit's slogan without its source, Oneness Vann's own line, the watershed's
   saying in Hindi, and the villages' line without its meaning or source */
const COVER_SAYINGS: Record<string, { id: SayingId; meaning?: boolean; byline?: boolean }> = {
  'project-amrit': { id: 'project-amrit', byline: false },
  'oneness-vann': { id: 'oneness-vann-cover', byline: false },
  watershed: { id: 'watershed-cover', meaning: false },
  'adopted-villages': { id: 'adopted-villages', meaning: false, byline: false },
};

/** The cover, on the projects' own ground as the home page showed it (the
    projects' teal under the page's deep wash, the waves the chapters swim in,
    and the projects' drawings): the words and the way on to the projects,
    beside the orbit, where every project is a moon and choosing one goes to
    its chapter. Beneath the orbit, the voice of the project in view; at the
    foot, the foundation's work with UNEP and each project's headline figure,
    opening its Stats. */
const ProjectsCover: React.FC = () => {
  useCMSRevision();
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const [choice, setChoice] = useState(0);
  const projects = getProjects();
  const ground = PILLARS.find(pillar => pillar.id === 'projects');
  const ways = [
    ...projects.map((project, i) => {
      const face = FACES[i % FACES.length];
      /* on its moon Amrit goes by its full name, Project Amrit */
      return { id: project.id, name: project.id === 'project-amrit' ? project.title : shortName(project), href: `#${slug(project.title)}`, ink: face.ink, light: face.light, icon: face.icon, photo: project.images?.[0]?.src ?? project.cardPhoto?.src };
    }),
    { id: 'health-city', name: getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City"), href: '#health-city', ink: '#0d6a8c', light: '#b8daed', icon: Hospital,
      photo: resolveCMSAsset("asset.ProjectsPage.healthCity", "/images/projects/health-city.webp") },
  ];
  const current = ways[choice] ?? ways[0];
  return <section ref={root} className="projects-cover" data-active={active} style={{ '--cover-ink': current.ink, '--cover-light': current.light, '--ground-a': ground?.accentA, '--ground-b': ground?.accentB } as React.CSSProperties} aria-labelledby="projects-heading">
    <div className="projects-cover-ground" aria-hidden="true">
      {ground && <MosaicWaves subject={subjectFor(ground)} active={active && !calm} input={waveInput} scale={3} fps={24} />}
      <PillarArtwork pillarId="projects" />
    </div>
    <div className="projects-cover-copy">
      <p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.982a72dda0d4", "Service that takes shape")}</p>
      <h1 id="projects-heading">{getCMSCopy("copy.ProjectsPage.988b94ac8a81", "Built for people,")}<br /><em>{getCMSCopy("copy.ProjectsPage.27f463b7e8ab", "Rooted in purpose.")}</em></h1>
      <p className="projects-cover-lede">{getCMSCopy("copy.ProjectsPage.d90ca7d5eb20", "From reviving water bodies to growing forests and supporting villages, discover how our values become lasting projects.")}</p>
      <div className="projects-cover-actions">
        <a href={getCMSLink("copy.Link.ProjectsPage.6a68430d8c61", "#project-amrit")} className="projects-cover-cta">{getCMSCopy("copy.ProjectsPage.1102171bd1b3", "Explore our projects ")}<ArrowDown size={15} aria-hidden="true" /></a>
      </div>
    </div>
    {/* the orbit, and beneath it the voice of the project in view */}
    <div className="projects-cover-stage">
      <ProjectOrbit projects={ways} choice={choice} onChange={setChoice} active={active} />
      <div className="projects-cover-voice">
        {hasSaying(current.id) ? <Saying key={current.id} id={current.id} className="projects-cover-saying" {...COVER_SAYINGS[current.id]} />
          : <p key={current.id} className="projects-cover-status"><i aria-hidden="true" />{getCMSCopy("copy.ProjectsPage.hcBadge", "OPD services started")} · {getCMSCopy("copy.ProjectsPage.hcChip3", "North Delhi")}</p>}
      </div>
    </div>
    <div className="projects-cover-footer">
      <span className="projects-cover-standing"><UnepSeal /></span>
      <nav className="projects-cover-impact" aria-label={getCMSCopy("copy.ProjectsPage.cover-impact", "Each project’s reported reach")}>
        {projects.map((project, i) => (
          <a key={project.id} href={`#${slug(project.title)}-stats`} data-active={choice === i} style={{ '--way-ink': FACES[i % FACES.length].ink } as React.CSSProperties}>
            {/* the rolling figure is for the eye; the figure itself is what is read */}
            <em>{shortName(project)}</em>
            <span className="projects-cover-impact-figure"><span className="sr-only">{project.headline.value}</span><span aria-hidden="true"><OdometerStatCounter value={project.headline.value} duration={1400} /></span></span>
            <span className="projects-cover-impact-unit">{project.headline.label}</span>
          </a>
        ))}
      </nav>
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

/** A project: its heading, its landscape and what it is, the UN goals it
    advances, then its Reports, Gallery and Stats as tabs. */
const ProjectChapter: React.FC<{ project: Activity; index: number }> = ({ project, index }) => {
  const face = FACES[index % FACES.length], Icon = face.icon;
  const [tab, setTab] = useState<ExploreTab>('reports');
  const id = slug(project.title);
  const modelId = project.id === 'oneness-vann' ? 'oneness' : index === 0 ? 'amrit' : null;
  /* A project without photographs of its own blooms with the foundation's
     other projects', and says they are illustrative. */
  const own = (project.images ?? []).length > 0;
  const bloomed = own ? [project] : [{ ...project, images: PAVILION_GALLERY[3].map(photo => ({ src: photo.src, alt: photo.alt })) }];
  const hung = (MEDIA[project.id] ?? []).filter(item => item.src).length;
  return <section id={id} className="project-chapter" style={inkStyle(index)} aria-labelledby={`${id}-title`}>
    <header className="project-chapter-heading"><span className="project-chapter-number">{getCMSCopy("copy.ProjectsPage.5feceb66ffc8", "0")}{index + 1}</span><div><p className="project-eyebrow">{face.label} / {face.scope}</p><h2 id={`${id}-title`}>{project.title}</h2></div><Icon size={32} strokeWidth={1.4} aria-hidden="true" /></header>
    <div className="project-story-grid">
      <figure className="project-landscape"><img src={resolveCMSMedia(face.image.startsWith('/') ? face.image : roomPhotoFor(`/images/pavilion/${face.image}.jpg`))} alt={face.illustrative ? `Illustrative photograph: ${face.alt}` : face.alt} loading="lazy" decoding="async" /><div className="project-landscape-wash" /><div className="project-landscape-title"><Icon size={30} /><h3>{face.line}</h3></div>{face.illustrative && <figcaption>{getCMSCopy("copy.ProjectsPage.9970f438a483", "Illustrative photography")}</figcaption>}</figure>
      <div className="project-report"><div className="project-report-top"><span className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.6fb73aee5b23", "The project in focus")}</span></div>
        <p className="project-blurb">{project.blurb}</p>
        <div className={modelId ? 'project-impact-row' : undefined}>
          <div className="project-impact-copy">
            <div className="project-selected-metric"><strong>{project.headline.value}</strong><span>{project.headline.label}</span></div>
            <p className="project-report-date"><CalendarDays size={14} /> {project.period}</p>
          </div>
          {modelId && <ProjectEmblem id={modelId} label={project.title} />}
        </div>
        <SdgTags goals={PROGRAMME_SDGS[project.id] ?? []} className="project-sdgs" />
      </div>
    </div>
    {hasSaying(project.id) && <Saying id={project.id} />}
    <ExploreTabs id={id} name={project.title} tab={tab} onTab={setTab}
      notes={{
        reports: `${project.dataPoints.length} ${getCMSCopy("copy.ProjectsPage.tab-measures", "reported measures")}`,
        gallery: hung ? `${hung} ${getCMSCopy("copy.ProjectsPage.tab-gallery", "photographs, and films to come")}` : getCMSCopy("copy.ProjectsPage.tab-gallery-awaited", "Photographs on their way"),
        stats: getCMSCopy("copy.ProjectsPage.tab-stats", "The figures, charted"),
      }}
      panels={{
        reports: () => (
          <div className="project-reports">
            <ReportActions id={project.id} title={project.title} ink={face.ink} programmes={[project]} />
            {/* the project as a dossier: its photographs, every figure it reports, and what they say read together */}
            <ProgrammeDossier id={`${id}-detail`} activity={project} kicker={getCMSCopy("copy.ProjectsPage.dossier-kicker", "Project in focus")} />
          </div>
        ),
        gallery: () => (
          <PillarGallery activities={bloomed} title={`${project.title} — ${getCMSCopy("copy.ProjectsPage.gallery-band", "photographs & films")}`}
            project={{
              label: `${project.title}: ${getCMSCopy("copy.ProjectsPage.gallery-label", "photographs of the project, opening on the petals of the Projects emblem")}`,
              caption: own ? getCMSCopy("copy.ProjectsPage.foundationPhotos", "From the foundation’s work, 2026") : getCMSCopy("copy.ProjectsPage.illustrative", "Illustrative photographs from the foundation’s other projects"),
              mediaSection: project.id,
            }} />
        ),
        stats: () => <ProjectAnalytics project={project} />,
      }} />
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
  return <PageShell accentPillarId="projects" eyebrow={getCMSCopy("copy.ProjectsPage.04e2a9728af7", "Projects")} title={getCMSCopy("copy.ProjectsPage.36fc0059896e", "Our projects")} standfirst={getCMSCopy("copy.ProjectsPage.995f1e05cac7", "Service with a lasting footprint.")} cover={<ProjectsCover />} rail={<SubsectionNav variant="tabs" label={getCMSCopy("copy.ProjectsPage.69c5a4506f97", "Explore projects")} links={[...getProjects().map((p, i) => ({ id: slug(p.title), label: p.title.replace(/^Project /, ''), ink: FACES[i % FACES.length].ink })), { id: 'health-city', label: getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City"), ink: '#0d6a8c' }]} />}>
    <div className="projects-editorial">
      {getProjects().map((project,index) => <ProjectChapter key={project.id} project={project} index={index} />)}
      <CMSSection id="ProjectsPage.health-city"><HealthCityFeature /></CMSSection>
      <p className="projects-report-note">{getCMSCopy("copy.ProjectsPage.4a4eb64be162", "Each project’s figures retain their own reporting period and units. Different measures are not combined into a single total.")}</p>
    </div>
  </PageShell>;
};
