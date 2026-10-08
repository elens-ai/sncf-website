import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const { pathname, hash, search, key } = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef<string | null>(null);
  const projectsEntryKey = useRef<string | null>(null);

  useEffect(() => {
    // Projects opens with its photo introduction; later chapter links still work.
    if (pathname === '/projects' && previousPath.current !== pathname) projectsEntryKey.current = key;
    previousPath.current = pathname;
    if (pathname === '/projects' && projectsEntryKey.current === key && hash) {
      navigate({ pathname, search, hash: '' }, { replace: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // Wait for a lazy route's target, then scroll once. Re-scrolling after
    // media loads pulls the reader backwards if they have already moved on.
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
      if (++tries < 8) timer = window.setTimeout(attempt, 60);
      else window.scrollTo(0, 0);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [pathname, hash, search, key, navigate]);

  return null;
};
