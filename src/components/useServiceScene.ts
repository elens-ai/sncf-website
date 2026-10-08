import { useEffect, useRef, useState } from 'react';
import { onArrival } from '../utils/arrival';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';

export function useServiceScene() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const root = useRef<HTMLElement>(null);
  const [arrived, setArrived] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => root.current ? onArrival(root.current, () => setArrived(true)) : undefined, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const visible = bounds.top < window.innerHeight && bounds.bottom > 0 && pageIsActive(element);
      element.dataset.active = String(visible);
      setActive(visible);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener(PAGE_ACTIVITY_EVENT, schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, schedule);
    };
  }, []);

  return { root, arrived, compact, active };
}
