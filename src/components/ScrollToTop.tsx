import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A route change should start at the top of the new page. The browser only
 * restores scroll for real navigations; a client-side route swap keeps
 * whatever offset the last page was left at, which lands the visitor
 * mid-document on arrival.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
