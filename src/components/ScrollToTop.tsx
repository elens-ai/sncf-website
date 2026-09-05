import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A route change should start at the top of the new page — unless the address
 * names a place on it.
 *
 * The browser only restores scroll for real navigations; a client-side route
 * swap keeps whatever offset the last page was left at, which lands the
 * visitor mid-document on arrival.
 *
 * But '/core-values#heal' is a request for a specific chapter, and PageShell
 * emits exactly that when a pillar is chosen from the search or gallery
 * overlay. Scrolling to 0 on those would silently discard the hash, so the
 * hash is honoured instead — after a frame, because the destination section
 * has to exist before it can be scrolled to.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    /* The target has to exist and be laid out before it can be scrolled to,
       and it may still be waiting on an image's height. So: try immediately,
       then retry on a short timer until it lands or the attempts run out.
       TIMERS, NOT requestAnimationFrame — rAF is suspended in a backgrounded
       or throttled tab, which is the same trap this codebase already avoids
       for its entrance animations, and a deep link that silently does
       nothing when the tab was not focused is exactly that bug again. */
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        /* one more pass to settle late-loading media above the target */
        if (++tries < 3) timer = window.setTimeout(attempt, 220);
        return;
      }
      if (++tries < 8) timer = window.setTimeout(attempt, 60);
      else window.scrollTo(0, 0);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
};
