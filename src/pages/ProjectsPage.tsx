import { bindCMSValue, resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { PageShell } from '../components/PageShell';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { SubsectionNav } from '../components/SubsectionNav';
import { ProjectOrbit } from '../components/ProjectOrbit';
import { Saying, hasSaying, type SayingId } from '../components/Saying';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ACTIVITIES, type Activity } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { subjectFor } from '../utils/waves';
import { slug } from '../utils/slug';
import './projects.css';
import { ProjectFilms } from '../components/ProjectFilms';
import { ProjectPhotoIntro } from '../components/ProjectPhotoIntro';
import { SdgRow } from '../components/SdgRow';
import { goalsOf, PROGRAMME_SDGS } from '../data/sdgs';

const getProjects = () => ACTIVITIES.filter(a => a.pillarId === 'projects');
let FACES = bindCMSValue(() => ([
  { ink: '#087d8b', light: '#bce7e5', label: getCMSCopy("copy.ProjectsPage.7ca7dea90680", "Water"), scope: getCMSCopy("copy.ProjectsPage.41bcc0f77ef0", "Launched 2023 · with the Government of India"), image: 'projects-1', alt: getCMSCopy("copy.ProjectsPage.faceWaterAlt", "Project Amrit volunteers clearing a riverbank in Mantova, Italy"), line: getCMSCopy("copy.ProjectsPage.4463a32132e7", "A fresh chapter for our water.") },
  { ink: '#36744b', light: '#d2e8b7', label: getCMSCopy("copy.ProjectsPage.62d19b520233", "Forests"), scope: getCMSCopy("copy.ProjectsPage.f2371d5ab799", "Launched 2021 · indigenous micro-forests"), image: 'projects-2', alt: getCMSCopy("copy.ProjectsPage.faceForestAlt", "Women planting saplings for a Oneness Vann micro-forest in Solapur"), line: getCMSCopy("copy.ProjectsPage.a13a9cf8fa7d", "Small forests. A greener future.") },
  { ink: '#98612b', light: '#f4dfb6', label: getCMSCopy("copy.ProjectsPage.b6baff9358dd", "Land"), scope: getCMSCopy("copy.ProjectsPage.c406304d0b71", "Arid-zone rejuvenation"), image: 'empower-2', illustrative: true, alt: getCMSCopy("copy.ProjectsPage.faceLandAlt", "A volunteer plants a sapling on a hillside"), line: getCMSCopy("copy.ProjectsPage.c2dc7b1fa516", "Restoring the land that sustains us.") },
  { ink: '#856098', light: '#e6d9ee', label: getCMSCopy("copy.ProjectsPage.c864f329f5dd", "Communities"), scope: getCMSCopy("copy.ProjectsPage.904eb1d10ff3", "Since 2017 · Haryana"), image: '/images/programmes/adopted-villages-mandaura.webp', alt: getCMSCopy("copy.ProjectsPage.faceCommunitiesAlt", "A volunteer checks an elderly villager in Mandaura, an adopted village"), line: getCMSCopy("copy.ProjectsPage.c2eb86f270ec", "Growing stronger, together.") },
]), value => { FACES = value; });


/* a project's name on the cover: Amrit, Oneness Vann, Watershed, Adopted Villages */
const shortName = (project: Activity) => project.title.replace(/^Project /, '').replace(/ Programme$/, '');

/* Beneath the subheading the projects speak in short lines (their chapters below give the sayings in
   full): Project Amrit's slogan without its source, Oneness Vann's own line, the watershed's
   saying in Hindi, and the villages' line without its meaning or source */
const COVER_SAYINGS: Record<string, { id: SayingId; meaning?: boolean; byline?: boolean }> = {
  'project-amrit': { id: 'project-amrit', byline: false },
  'oneness-vann': { id: 'oneness-vann-cover', byline: false },
  watershed: { id: 'watershed-cover', meaning: false },
  'adopted-villages': { id: 'adopted-villages', meaning: false, byline: false },
};

const projectIntroductions = () => ({
  'project-amrit': getCMSCopy('copy.ProjectsPage.amrit-introduction', 'Through Project Amrit, volunteers come together to care for the water that sustains us. Cleaning and reviving water bodies turns shared responsibility into lasting service for nature and the communities around them.'),
  'oneness-vann': getCMSCopy('copy.ProjectsPage.oneness-introduction', 'Oneness Vann brings people together to plant and nurture native trees. Each growing forest creates space for life, reminding us that care for the Earth begins with the small actions we take together.'),
  watershed: getCMSCopy('copy.ProjectsPage.watershed-introduction', 'The Watershed Programme helps communities care for their land and water. By conserving rainwater and restoring the landscape, it supports local agriculture and the people whose livelihoods depend on it.'),
  'adopted-villages': getCMSCopy('copy.ProjectsPage.villages-introduction', 'In our adopted villages, service grows through enduring relationships. Education, healthcare, skills and environmental care come together to support families and help communities build a stronger future.'),
  'health-city': getCMSCopy('copy.ProjectsPage.health-city-introduction', 'Sant Nirankari Health City brings compassionate care and medical expertise together. With dignity at its heart, the campus works to make advanced treatment more accessible to patients and the families who stand beside them.'),
});

/** The cover, on the projects' own ground as the home page showed it (the
    projects' teal under the page's deep wash, the waves the chapters swim in,
    and the projects' drawings): the words and the way on to the projects,
    beside the orbit, where every project is a moon and choosing one goes to
    its chapter. Beneath the left-side introduction, the voice of the project in view. */
const ProjectsCover: React.FC = () => {
  useCMSRevision();
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const [choice, setChoice] = useState(0);
  const [reading, setReading] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const projects = getProjects();
  const ground = PILLARS.find(pillar => pillar.id === 'projects');
  const ways = [
    ...projects.map((project, i) => {
      const face = FACES[i % FACES.length];
      /* on its moon Amrit goes by its full name, Project Amrit */
      return { id: project.id, name: project.id === 'project-amrit' ? project.title : shortName(project), href: `#${slug(project.title)}`, ink: face.ink, light: face.light, photo: project.images?.[0]?.src ?? project.cardPhoto?.src };
    }),
    { id: 'health-city', name: getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City"), href: '#health-city', ink: '#0d6a8c', light: '#b8daed',
      photo: resolveCMSAsset("asset.ProjectsPage.healthCity", "/images/projects/health-city.webp") },
  ];
  const current = ways[choice] ?? ways[0];
  return <section ref={root} className="projects-cover" data-active={active} style={{ '--cover-ink': current.ink, '--cover-light': current.light, '--ground-a': ground?.accentA, '--ground-b': ground?.accentB } as React.CSSProperties} aria-labelledby="projects-heading">
    <div className="projects-cover-ground" aria-hidden="true">
      {ground && <MosaicWaves subject={subjectFor(ground)} active={active && !calm} input={waveInput} scale={3} fps={24} />}
      <ProjectPhotoIntro active={active} reduced={calm} photos={[
        ...ways.flatMap(way => way.photo ? [way.photo] : []),
        ...projects.flatMap(project => project.images.slice(1).map(image => image.src)),
        resolveCMSAsset('asset.ProjectsPage.introHealthTeam', '/images/projects/health-city/team-atrium.webp'),
        resolveCMSAsset('asset.ProjectsPage.introHealthCeremony', '/images/projects/health-city/ceremony.webp'),
        resolveCMSAsset('asset.ProjectsPage.introHealthEvening', '/images/programmes/health-city-evening.webp'),
        resolveCMSAsset('asset.ProjectsPage.introHealthDedication', '/images/projects/health-city/dedication.webp'),
        resolveCMSAsset('asset.ProjectsPage.introHealthStaff', '/images/projects/health-city/team.webp'),
        resolveCMSAsset('asset.ProjectsPage.introHealthPlaque', '/images/projects/health-city/plaque.webp'),
      ]} />
    </div>
    <div className="projects-cover-copy">
      <h1 id="projects-heading">{getCMSCopy("copy.ProjectsPage.988b94ac8a81", "Built for people,")}<em>{getCMSCopy("copy.ProjectsPage.27f463b7e8ab", "Rooted in purpose.")}</em></h1>
      <div className="projects-cover-voice">
        {hasSaying(current.id) ? <Saying key={current.id} id={current.id} className="projects-cover-saying" {...COVER_SAYINGS[current.id]} />
          : <p key={current.id} className="projects-cover-status"><i aria-hidden="true" />{getCMSCopy("copy.ProjectsPage.hcBadge", "OPD services started")} · {getCMSCopy("copy.ProjectsPage.hcChip3", "North Delhi")}</p>}
      </div>
      <SdgRow
        id="projects-cover" name={getCMSCopy("copy.ProjectsPage.04e2a9728af7", "Projects")}
        goals={goalsOf(ways.map(way => way.id))}
        programmes={ways.map(way => ({ title: way.name, goals: PROGRAMME_SDGS[way.id] ?? [] }))}
        className="projects-cover-goals" onOpenChange={setPeeking}
      />
    </div>
    {/* The project orbit sits beside the copy and its saying. */}
    <div className="projects-cover-stage">
      <ProjectOrbit projects={ways} choice={choice} onChange={setChoice} active={active} auto={!reading && !peeking} interval={8000} />

    </div>

    <p className="projects-cover-introduction" onPointerEnter={() => setReading(true)} onPointerLeave={() => setReading(false)}>
      {projectIntroductions()[current.id as keyof ReturnType<typeof projectIntroductions>]}
    </p>
  </section>;
};

export const ProjectsPage: React.FC = () => {
  useCMSRevision();
  return <PageShell accentPillarId="projects" eyebrow={getCMSCopy("copy.ProjectsPage.04e2a9728af7", "Projects")} title={getCMSCopy("copy.ProjectsPage.36fc0059896e", "Our projects")} standfirst={getCMSCopy("copy.ProjectsPage.995f1e05cac7", "Service with a lasting footprint.")} cover={<ProjectsCover />} rail={<SubsectionNav floating variant="tabs" look="segmented" label={getCMSCopy("copy.ProjectsPage.69c5a4506f97", "Explore projects")} links={[...getProjects().map((p, i) => ({ id: slug(p.title), label: p.title.replace(/^Project /, ''), ink: FACES[i % FACES.length].ink })), { id: 'health-city', label: getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City"), ink: '#0d6a8c' }]} />}>
    <ProjectFilms projects={getProjects()} faces={FACES} />
  </PageShell>;
};
