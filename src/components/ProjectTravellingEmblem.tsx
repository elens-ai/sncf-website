import { useEffect, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { resolveCMSAsset } from '../cms/runtime';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';
import { projectEmblemPose } from '../utils/projectEmblemMotion';

export type ProjectEmblemId = 'project-amrit' | 'oneness-vann' | 'health-city';

export function ProjectEmblemArt({ project }: { project: ProjectEmblemId }) {
  const src = project === 'oneness-vann'
    ? resolveCMSAsset('asset.ProjectFilms.onenessFloatingLogo', '/images/projects/oneness-floating-logo-clean.png')
    : project === 'health-city'
      ? resolveCMSAsset('asset.ProjectFilms.healthCityFloatingLogo', '/images/projects/health-city-floating-logo.png')
      : resolveCMSAsset('asset.ProjectFilms.amritFloatingLogo', '/images/projects/amrit-floating-logo.png');
  return <img className="project-emblem-art" data-project={project} src={src} alt="" width={384} height={384} decoding="async" draggable={false} />;
}

/** Scroll the journey on one fixed layer; hold its corner until the chapter fades. */
export function ProjectTravellingEmblem({ project, chapter, source, reduced }: {
  project: ProjectEmblemId;
  chapter: RefObject<HTMLElement | null>;
  source: RefObject<HTMLDivElement | null>;
  reduced: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current, section = chapter.current, origin = source.current;
    if (!element || !section || !origin) return;
    let frame = 0, disposed = false, signature = '';
    let layout: { source: { x: number; top: number; size: number }; chapterTop: number; chapterBottom: number; corner: { x: number; y: number; size: number } };
    const render = () => {
      frame = 0;
      if (!layout) return;
      const pose = projectEmblemPose({ ...layout, scroll: window.scrollY, reduced });
      const shown = pageIsActive(section) && pose.opacity > 0 && pose.y < innerHeight && pose.y + pose.size > 72
        && layout.chapterTop - window.scrollY < innerHeight;
      const next = `${pose.x.toFixed(2)}|${pose.y.toFixed(2)}|${pose.size.toFixed(2)}|${pose.opacity.toFixed(3)}|${shown}`;
      // In the pinned phase this is a no-op. The image floats entirely on
      // the compositor, independently of scrolling and the background film.
      if (next === signature) return;
      signature = next;
      element.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) scale(${pose.size / 96})`;
      element.style.opacity = String(pose.opacity);
      element.dataset.phase = pose.phase;
      element.dataset.visible = String(shown && pose.phase !== 'origin');
      origin.dataset.following = String(pose.phase !== 'origin');
    };
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(render); };
    const measure = () => {
      const from = origin.getBoundingClientRect(), bounds = section.getBoundingClientRect();
      const compact = innerWidth <= 800, size = compact ? 80 : 96;
      layout = {
        source: { x: from.left, top: from.top + window.scrollY, size: from.width },
        chapterTop: bounds.top + window.scrollY, chapterBottom: bounds.bottom + window.scrollY,
        corner: { x: document.documentElement.clientWidth - size - (compact ? 16 : 24), y: compact ? 150 : 96, size },
      };
      schedule();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(section); resize.observe(origin);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener(PAGE_ACTIVITY_EVENT, schedule);
    void document.fonts.ready.then(() => { if (!disposed) measure(); });
    return () => {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', schedule);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, schedule);
    };
  }, [chapter, source, reduced]);

  // Outside transformed/revealing content so it can never be clipped by it.
  return createPortal(<div ref={host} className="project-travelling-emblem" data-project={project} data-reduced={reduced} aria-hidden="true">
    <ProjectEmblemArt project={project} />
  </div>, document.body);
}
