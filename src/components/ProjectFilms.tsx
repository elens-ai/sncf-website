import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { PillarModelCard } from './PillarModelCard';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { iconFor } from './figureIcons';
import { OdometerStatCounter } from './OdometerStatCounter';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import type { Activity } from '../data/activities';
import { MEDIA } from '../data/media';
import { projectFilmSource } from '../data/projectFilms';
import { projectStory } from '../data/projectStories';
import { insightsFor } from '../data/insights';
import { PROGRAMME_SDGS } from '../data/sdgs';
import { roomPhotoFor } from '../data/pavilionGallery';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';
import { slug } from '../utils/slug';
import { youtubeId } from '../utils/youtube';
import { ProjectFilmBackdrop } from './ProjectFilmBackdrop';
import { ProjectPhotoGallery } from './ProjectPhotoGallery';
import { ProjectEmblemArt, ProjectTravellingEmblem } from './ProjectTravellingEmblem';
import { Saying, hasSaying } from './Saying';
import { SdgRow } from './SdgRow';
import './project-films.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProjectFilms.${key}`, fallback);
export interface ProjectFilmFace {
  ink: string; light: string; label: string; scope: string; image: string; alt: string; line: string; illustrative?: boolean;
}

function healthCity(): { project: Activity; face: ProjectFilmFace } {
  const points = [
    { value: getCMSCopy('copy.ProjectsPage.hcStat1Value', '1,200+'), label: getCMSCopy('copy.ProjectsPage.hcStat1Label', 'Bedded Health City') },
    { value: getCMSCopy('copy.ProjectsPage.hcStat2Value', '500+'), label: getCMSCopy('copy.ProjectsPage.hcStat2Label', 'Beds in Phase 1') },
    { value: getCMSCopy('copy.ProjectsPage.hcStat3Value', '1,500+'), label: getCMSCopy('copy.ProjectsPage.hcStat3Label', 'Staff') },
    { value: getCMSCopy('copy.ProjectsPage.hcStat4Value', '40+'), label: getCMSCopy('copy.ProjectsPage.hcStat4Label', 'Specialties') },
  ];
  return {
    project: {
      id: 'health-city', pillarId: 'projects', title: getCMSCopy('copy.ProjectsPage.hcLogoAlt', 'Sant Nirankari Health City'),
      period: getCMSCopy('copy.ProjectsPage.hcStatsSource', 'As Sant Nirankari Health City states them'),
      blurb: getCMSCopy('copy.ProjectsPage.d39d7428ab57', 'A multi-specialty charitable hospital campus in North Delhi, intended to make advanced treatment more accessible.'),
      headline: points[0], dataPoints: points,
      images: [
        { src: resolveCMSAsset('asset.ProjectsPage.hcTeam', '/images/projects/health-city/team-atrium.webp'), alt: getCMSCopy('copy.ProjectsPage.hcTeamAlt', "The Health City's team gathered in the hospital's atrium") },
        { src: resolveCMSAsset('asset.ProjectsPage.hcPlaque', '/images/projects/health-city/plaque.webp'), alt: getCMSCopy('copy.ProjectsPage.hcPlaqueAlt', 'The plaque recording that Satguru Mata Sudiksha Ji Maharaj dedicated the premises of Sant Nirankari Health City to the service of humanity on 23 February 2026') },
        { src: resolveCMSAsset('asset.ProjectsPage.hcDedication', '/images/projects/health-city/ceremony.webp'), alt: getCMSCopy('copy.ProjectsPage.hcDedicationAlt', 'A gathering at Sant Nirankari Health City, the SNHC monogram in flowers on the stage before the hospital') },
      ],
    },
    face: { ink: '#0d6a8c', light: '#b8daed', label: c('health', 'Healthcare'), scope: getCMSCopy('copy.ProjectsPage.3532c25e1c80', 'Now open / OPD services started'), image: resolveCMSAsset('asset.ProjectsPage.healthCity', '/images/projects/health-city.webp'), alt: 'Sant Nirankari Health City', line: c('healthLine', 'Advanced care. A human touch.') },
  };
}

/** Track the chapter being read and reveal its content as it enters the viewport. */
export function ProjectFilms({ projects, faces }: { projects: Activity[]; faces: ProjectFilmFace[] }) {
  useCMSRevision();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('');
  const entries = [...projects.map((project, index) => ({ project, face: faces[index % faces.length] })), healthCity()];
  const ids = entries.map(({ project }) => project.id).join('|');
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const chapters = [...container.querySelectorAll<HTMLElement>('[data-film-project]')];
    let atReadingLine = '';
    let chapterObserver: IntersectionObserver;
    const sync = () => setActive(pageIsActive(container) ? atReadingLine : '');
    const observe = () => {
      chapterObserver?.disconnect();
      const line = Math.min(innerHeight - 1, Math.max(132, Math.round(innerHeight * .45)));
      atReadingLine = chapters.find(chapter => {
        const bounds = chapter.getBoundingClientRect();
        return bounds.top <= line && bounds.bottom > line;
      })?.dataset.filmProject ?? '';
      sync();
      chapterObserver = new IntersectionObserver(entries => {
        // Process departures first so two chapters crossing together cannot
        // briefly clear the incoming film or restart its player.
        for (const entry of entries) if (!entry.isIntersecting && (entry.target as HTMLElement).dataset.filmProject === atReadingLine) atReadingLine = '';
        for (const entry of entries) if (entry.isIntersecting) atReadingLine = (entry.target as HTMLElement).dataset.filmProject ?? '';
        sync();
      }, { rootMargin: `-${line}px 0px -${Math.max(0, innerHeight - line - 1)}px 0px` });
      chapters.forEach(chapter => chapterObserver.observe(chapter));
    };
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.entered = 'true';
        revealObserver.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    container.querySelectorAll<HTMLElement>('[data-film-reveal]:not([data-entered])').forEach(piece => revealObserver.observe(piece));
    container.dataset.revealsReady = 'true';
    observe();
    window.addEventListener('resize', observe);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener(PAGE_ACTIVITY_EVENT, sync);
    return () => {
      chapterObserver.disconnect(); revealObserver.disconnect();
      window.removeEventListener('resize', observe);
      document.removeEventListener('visibilitychange', sync);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, sync);
    };
  }, [ids]);

  return <div ref={root} className="projects-films">
    {entries.map(({ project, face }) => {
      const chapter = <ProjectFilmChapter project={project} face={face} active={active === project.id} />;
      return <React.Fragment key={project.id}>{project.id === 'health-city' ? <CMSSection id="ProjectsPage.health-city">{chapter}</CMSSection> : chapter}</React.Fragment>;
    })}
    <p className="project-films-source">{getCMSCopy('copy.ProjectsPage.4a4eb64be162', 'Each project’s figures retain their own reporting period and units. Different measures are not combined into a single total.')}</p>
  </div>;
}

function ProjectFilmChapter({ project, face, active }: {
  project: Activity; face: ProjectFilmFace; active: boolean;
}) {
  const chapter = useRef<HTMLElement>(null);
  const opening = useRef<HTMLDivElement>(null);
  const openingActive = useSectionActivity(opening);
  const emblemOrigin = useRef<HTMLDivElement>(null);
  const id = project.id === 'health-city' ? 'health-city' : slug(project.title);
  const travellingEmblem = project.id === 'project-amrit';
  const isHealth = project.id === 'health-city';
  const story = projectStory(project.id);
  const Symbol = ACTIVITY_SYMBOLS[project.icon ?? (isHealth ? 'hospital' : 'heart')];
  const insights = insightsFor(project).slice(0, 2);
  const configuredGroups = story?.groups ?? [{ title: '', points: project.dataPoints.map((_, index) => index) }];
  const remaining = project.dataPoints.map((_, index) => index).filter(index => !configuredGroups.some(group => group.points.includes(index)));
  const groups = [...configuredGroups, ...(remaining.length ? [{ title: c('additional', 'Additional reported figures'), points: remaining }] : [])];
  const calm = useReducedMotion() ?? true;
  const emblem = project.id === 'project-amrit'
    ? { id: 'amrit', url: resolveCMSAsset('asset.ProjectFilms.amritModel', '/models/project-amrit-full.glb') }
    : project.id === 'oneness-vann'
      ? { id: 'oneness', url: resolveCMSAsset('asset.ProjectFilms.onenessModel', '/models/project-oneness-full.glb') }
      : isHealth ? { id: 'health-city', url: resolveCMSAsset('asset.ProjectFilms.healthCityModel', '/models/health-city-sn-logo.glb') } : null;
  const headline = <div className="project-film-headline project-film-headline-inline"><Symbol className="project-film-headline-symbol" size={27} strokeWidth={1.4} aria-hidden="true" /><strong><OdometerStatCounter value={project.headline.value} duration={950} /></strong><span>{project.headline.label}</span><small>{project.period}</small></div>;
  const goals = PROGRAMME_SDGS[project.id] ?? [];
  const films = (MEDIA[project.id] ?? []).filter(item => item.kind === 'film');
  const film = films.find(item => youtubeId(item.src));
  const filmSource = projectFilmSource(project.id) || film?.src || '';
  const video = youtubeId(filmSource);
  const videoSrc = /\.(mp4|webm)(?:[?#]|$)/i.test(filmSource) ? filmSource : undefined;
  const poster = film?.poster || (face.image.startsWith('/') ? face.image : roomPhotoFor(`/images/pavilion/${face.image}.jpg`));
  const photos = [...project.images, ...(MEDIA[project.id] ?? []).filter(item => item.kind === 'photo' && item.src).map(item => ({ src: item.src!, alt: item.alt || item.caption }))].filter((photo, i, all) => !photo.src.includes('volunteers-planning') && all.findIndex(other => other.src === photo.src) === i);
  return <section ref={chapter} id={id} data-film-project={project.id} data-active={active} className="project-film-chapter" aria-labelledby={`${id}-title`} style={{ '--film-accent': face.light, '--project-ink': face.ink, '--project-light': face.light } as React.CSSProperties}>
    {travellingEmblem && emblem && <ProjectTravellingEmblem chapter={chapter} source={emblemOrigin} reduced={calm} />}
    <div ref={opening} className="project-film-hero">
      <ProjectFilmBackdrop videoSrc={videoSrc} videoId={video} poster={poster} title={project.title} active={openingActive} illustrative={!film?.poster && face.illustrative} />
      <div className="project-film-content">
      <header className="project-film-opening" data-film-reveal={travellingEmblem ? undefined : true}>
        {travellingEmblem && <div ref={emblemOrigin} className="project-film-emblem project-film-emblem-origin" aria-hidden="true"><ProjectEmblemArt /></div>}
        {emblem && !travellingEmblem && <div className="project-film-emblem"><PillarModelCard id={emblem.id} label={project.title} modelUrl={emblem.url} fallbackUrl={isHealth ? resolveCMSAsset('asset.ProjectFilms.healthCityFallback', '/images/projects/health-city/logo.webp') : undefined} active={openingActive} animate={openingActive && !calm} /></div>}
        <h2 id={`${id}-title`}>{project.title}</h2>
        {headline}
        <div className="project-film-opening-bottom">
          <div><p className="project-film-line">{face.line}</p><p className="project-film-intro">{project.blurb}</p><a className="project-film-scroll" href={`#${id}-reports`}>{c('discover', 'Discover the story')}<ArrowDown size={17} /></a></div>
        </div>
      </header>
      </div>
    </div>
    <div className="project-film-content project-film-details">
      <div className="project-film-story" id={`${id}-reports`}>
        <div className="project-film-story-heading" data-film-reveal><p className="project-film-eyebrow">{c('purpose', 'Purpose, put into practice')}</p><h3>{story?.title ?? face.line}</h3>
          {story && <a className="project-film-link" href={story.source} target="_blank" rel="noopener noreferrer">{isHealth ? c('hospitalWebsite', 'Visit the hospital website') : c('background', 'Read the project background')}<ArrowUpRight size={17} /></a>}
          {goals.length > 0 && <SdgRow id={project.id} name={project.title} goals={goals} programmes={[{ title: project.title, goals }]} className="project-film-sdgs" />}
        </div>
        <div className="project-film-story-copy" data-film-reveal>{(story?.paragraphs ?? [project.blurb]).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {hasSaying(project.id) && <div className="project-film-voice"><Saying id={project.id} className="project-film-saying" /></div>}
        </div>
      </div>

      {story && <div className="project-film-approach" aria-label={c('approach', 'The work in practice')}>
        {story.pillars.map(({ icon: Icon, title, text }, index) => <article className="project-film-practice" key={index} data-film-reveal style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties}>
          <div className="project-film-practice-mark"><Icon size={25} strokeWidth={1.5} aria-hidden="true" /><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
          <h4>{title}</h4><p>{text}</p>
        </article>)}
      </div>}

      <div className="project-film-impact" id={`${id}-stats`} data-film-reveal={travellingEmblem ? undefined : true}>
        <div className="project-film-impact-art" aria-hidden="true"><Symbol strokeWidth={.65} /></div>
        <div className="project-film-section-heading"><div><p className="project-film-eyebrow">{c('impact', 'The work, measured')}</p><h3>{story?.impactTitle ?? c('figures', 'Every number. A shared effort.')}</h3></div><span>{project.period}</span></div>
        {story && <p className="project-film-impact-note">{story.impactNote}</p>}
        {groups.map((group, index) => <div className="project-film-metric-group" key={index}>
          {group.title && <h4>{group.title}</h4>}
          <dl className="project-film-figures" data-count={group.points.length}>{group.points.map(pointIndex => {
            const point = project.dataPoints[pointIndex];
            const Icon = iconFor(point?.label ?? '');
            return point ? <div key={pointIndex} data-primary={index === 0 && pointIndex === group.points[0] || undefined} data-wide={point.value.length > 8 || undefined}><dt><Icon size={15} strokeWidth={1.6} aria-hidden="true" />{point.label}</dt><dd>{point.value}</dd></div> : null;
          })}</dl>
        </div>)}
        {insights.length > 0 && <aside className="project-film-perspective" aria-label={c('perspective', 'The figures in perspective')}>
          <p className="project-film-perspective-label">{c('perspective', 'The figures in perspective')}</p>
          <div className="project-film-insights">{insights.map(({ icon: Icon, value, label }, index) => <div key={index}><Icon size={21} strokeWidth={1.5} aria-hidden="true" /><p><strong>{value}</strong><span>{label}</span></p></div>)}</div>
          <p className="project-film-insight-note">{c('insightMethod', 'Calculated from the reported totals above. Ratios describe overall averages, not results at each individual site.')}</p>
        </aside>}
      </div>

      {photos.length > 0 && <div className="project-film-gallery" id={`${id}-gallery`}>
        <ProjectPhotoGallery photos={photos} title={project.title} period={project.period} />
      </div>}
    </div>
  </section>;
}
