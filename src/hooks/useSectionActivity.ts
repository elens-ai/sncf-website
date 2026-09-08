import { useEffect, useState, type RefObject } from 'react';

/** Animation is useful only when its section and browser tab are visible. */
export function useSectionActivity(ref: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [ref]);
  return active;
}

/** Pause decorative CSS animation without re-rendering the page on scroll. */
export function usePageMotion() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('.home-page > section, .home-page > main')];
    const visibility = new Map<Element, boolean>();
    const sync = () => {
      for (const section of sections) section.dataset.motion = visibility.get(section) && !document.hidden ? 'running' : 'paused';
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) visibility.set(entry.target, entry.isIntersecting);
      sync();
    });
    for (const section of sections) observer.observe(section);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect(); document.removeEventListener('visibilitychange', sync);
      for (const section of sections) delete section.dataset.motion;
    };
  }, []);
}
