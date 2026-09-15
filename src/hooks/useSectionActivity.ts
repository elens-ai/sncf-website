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
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
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
    const sections = new Set<HTMLElement>();
    const visibility = new Map<Element, boolean>();
    const sync = () => {
      for (const section of document.querySelectorAll<HTMLElement>('.home-page > section, .home-page > main, .hero-pavilion-sequence > main, .hero-pavilion-sequence > section, .reading-room section, .reading-room > .page-cover')) {
        if (!sections.has(section)) { sections.add(section); observer.observe(section); }
      }
      for (const section of sections) if (!section.isConnected) {
        observer.unobserve(section); sections.delete(section); visibility.delete(section);
      }
      const blocked = suspended || !!document.querySelector('dialog[open], [aria-modal="true"]');
      const changed = document.documentElement.dataset.backgroundPaused !== String(blocked);
      document.documentElement.dataset.backgroundPaused = String(blocked);
      for (const section of sections) section.dataset.motion = visibility.get(section) && pageIsActive(section) ? 'running' : 'paused';
      if (changed) document.dispatchEvent(new Event(PAGE_ACTIVITY_EVENT));
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) visibility.set(entry.target, entry.isIntersecting);
      sync();
    });
    sync();
    document.addEventListener('visibilitychange', sync);
    const modals = new MutationObserver(sync);
    modals.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal'] });
    return () => {
      modals.disconnect();
      observer.disconnect(); document.removeEventListener('visibilitychange', sync);
      for (const section of sections) delete section.dataset.motion;
      delete document.documentElement.dataset.backgroundPaused;
      document.dispatchEvent(new Event(PAGE_ACTIVITY_EVENT));
    };
  }, [suspended]);
}
