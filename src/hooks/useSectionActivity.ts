import { useEffect, useState, type RefObject } from 'react';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';

/** Animation is useful only when its section and browser tab are visible. */
export function useSectionActivity(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const sync = () => setActive(visible && pageIsActive(element));
    /* An element only touching the screen's edge counts as intersecting: the
       hall's waves, ending exactly where the landing ends and the awards begin,
       went on drawing above and below the screen. A pixel's margin keeps it out. */
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: '-1px 0px' });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener(PAGE_ACTIVITY_EVENT, sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); document.removeEventListener(PAGE_ACTIVITY_EVENT, sync); };
  }, [ref]);
  return active;
}

/** Pause decorative CSS animation without re-rendering the page on scroll. */
export function usePageMotion(suspended = false) {
  useEffect(() => {
    const selector = '.home-page > section, .home-page > main, .hero-pavilion-sequence > main, .hero-pavilion-sequence > section, .reading-room section, .reading-room > .page-cover, .project-film-opening, .project-film-story, .project-film-approach, .project-film-impact, .project-photo-gallery';
    const sections = new Set<HTMLElement>();
    const visibility = new Map<Element, boolean>();
    const movingSVGs = new Map<SVGSVGElement, boolean>();
    let frame = 0, discover = true;
    const sync = () => {
      frame = 0;
      if (discover) {
        discover = false;
        for (const section of document.querySelectorAll<HTMLElement>(selector)) {
          if (!sections.has(section)) { sections.add(section); observer.observe(section); }
        }
        for (const svg of document.querySelectorAll<SVGSVGElement>('svg:has(animate, animateTransform, animateMotion)')) {
          if (!movingSVGs.has(svg)) { movingSVGs.set(svg, false); observer.observe(svg); }
        }
        for (const section of sections) if (!section.isConnected) {
          observer.unobserve(section); sections.delete(section); visibility.delete(section);
        }
        for (const svg of movingSVGs.keys()) if (!svg.isConnected) {
          observer.unobserve(svg); movingSVGs.delete(svg); visibility.delete(svg);
        }
      }
      const blocked = suspended || !!document.querySelector('dialog[open], [aria-modal="true"]');
      const changed = document.documentElement.dataset.backgroundPaused !== String(blocked);
      document.documentElement.dataset.backgroundPaused = String(blocked);
      for (const section of sections) {
        const state = visibility.get(section) && pageIsActive(section) ? 'running' : 'paused';
        if (section.dataset.motion !== state) section.dataset.motion = state;
      }
      for (const [svg, playing] of movingSVGs) {
        const next = !!visibility.get(svg) && pageIsActive(svg as unknown as HTMLElement) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (next !== playing) { next ? svg.unpauseAnimations() : svg.pauseAnimations(); movingSVGs.set(svg, next); }
        else if (!next && !svg.animationsPaused()) svg.pauseAnimations();
      }
      if (changed) document.dispatchEvent(new Event(PAGE_ACTIVITY_EVENT));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) visibility.set(entry.target, entry.isIntersecting);
      schedule();
    });
    sync();
    document.addEventListener('visibilitychange', schedule);
    // Batch DOM changes once per frame. Text counters and canvas relocation
    // must not rescan every section in the entire document.
    const modals = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes')) schedule();
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches(selector + ', dialog, [aria-modal], svg') || node.querySelector(selector + ', dialog, [aria-modal], svg'))) { discover = true; schedule(); return; }
      }
      if (records.some(record => [...record.removedNodes].some(node => node instanceof Element && (node.matches(selector + ', dialog, [aria-modal], svg') || node.querySelector(selector + ', dialog, [aria-modal], svg'))))) { discover = true; schedule(); }
    });
    modals.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal'] });
    return () => {
      cancelAnimationFrame(frame); modals.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      for (const section of sections) delete section.dataset.motion;
      delete document.documentElement.dataset.backgroundPaused;
      document.dispatchEvent(new Event(PAGE_ACTIVITY_EVENT));
    };
  }, [suspended]);
}
