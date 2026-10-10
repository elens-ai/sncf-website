import React, { useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './pull-to-refresh.css';

/**
 * PULL TO REFRESH, on a touch screen up to tablet size, on every page.
 *
 * The browser's own gesture is missing in the places this site is most often
 * opened on a phone (the in-app browsers of WhatsApp, Instagram and the like,
 * and a page saved to the home screen), so the site carries its own: at the
 * top of the page, a downward pull draws a disc out from under the header,
 * turning as it comes; past the mark it fills with the page's colour, and
 * letting go reloads the page. The browser's own is turned off where this
 * one runs (responsive.css), so the two never go together. It stays out of
 * the way of anything that scrolls by itself, of a dialog that is open, and
 * of sideways swipes.
 */
const THRESHOLD = 72;
const MAX = 118;

export const PullToRefresh: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const media = window.matchMedia('(max-width: 1023px) and (pointer: coarse)');
    let tracking = false, startX = 0, startY = 0, distance = 0, refreshing = false;
    const show = (px: number, state: 'idle' | 'pulling' | 'armed' | 'refreshing') => {
      el.style.setProperty('--pull', `${px}px`);
      el.style.setProperty('--pull-p', String(Math.min(1, px / THRESHOLD)));
      el.dataset.state = state;
    };
    /* not while a dialog is open, nor from inside anything that has been scrolled itself */
    const blocked = (target: EventTarget | null) => {
      if (document.querySelector('dialog[open], [aria-modal="true"]')) return true;
      if (document.documentElement.dataset.backgroundPaused === 'true') return true;
      for (let node = target as HTMLElement | null; node && node !== document.body; node = node.parentElement) {
        if (node.scrollTop > 0) return true;
        if (node.matches?.('input, textarea, select, [contenteditable="true"]')) return true;
      }
      return false;
    };
    const onStart = (event: TouchEvent) => {
      tracking = false;
      if (refreshing || !media.matches || event.touches.length !== 1 || window.scrollY > 0 || blocked(event.target)) return;
      tracking = true; distance = 0;
      startX = event.touches[0].clientX; startY = event.touches[0].clientY;
    };
    const onMove = (event: TouchEvent) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const dy = touch.clientY - startY, dx = touch.clientX - startX;
      /* a sideways swipe, or the page moving on, is not a pull */
      if (window.scrollY > 0 || dy < 0 || (distance === 0 && Math.abs(dx) > Math.abs(dy))) {
        tracking = false; distance = 0; show(0, 'idle'); return;
      }
      /* the pull gives way the further it goes */
      distance = Math.min(MAX, dy * 0.5);
      show(distance, distance >= THRESHOLD ? 'armed' : 'pulling');
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (distance >= THRESHOLD) {
        refreshing = true;
        show(THRESHOLD * 0.82, 'refreshing');
        if (status.current) status.current.textContent = getCMSCopy('copy.PullToRefresh.refreshing', 'Refreshing');
        window.setTimeout(() => window.location.reload(), 380);
      } else show(0, 'idle');
      distance = 0;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);
  return (
    <div ref={ref} className="pull-refresh" data-state="idle">
      <span className="pull-refresh-disc" aria-hidden="true"><RotateCw size={18} strokeWidth={2.2} /></span>
      <span className="sr-only" role="status" ref={status} />
    </div>
  );
};
