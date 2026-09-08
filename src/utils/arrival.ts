/**
 * ONE DRIVER FOR "HAS THIS COME INTO VIEW YET".
 *
 * Each element that wants to know when it first appears registers here, and
 * a single rAF-throttled scroll listener answers all of them. Before this,
 * every counter on Core Values mounted its OWN unthrottled scroll listener
 * and called getBoundingClientRect() on every event — measured at nine
 * layout reads per scroll event with twelve figures on the page, and scroll
 * fires far more often than once a frame.
 *
 * Deliberately NOT IntersectionObserver: the house rule, because a throttled
 * or backgrounded tab can hold its callbacks indefinitely and an entrance
 * that silently never fires is the bug this codebase has already had.
 *
 * A registration is one-shot. The element is dropped the moment it arrives,
 * so the work per frame only ever shrinks, and when the last one has arrived
 * the listener is removed entirely.
 */
type Hit = () => void;

const waiting = new Map<Element, Hit>();
let raf = 0;
let bound = false;

const read = () => {
  raf = 0;
  const vh = window.innerHeight || 1;
  waiting.forEach((hit, el) => {
    const r = el.getBoundingClientRect();
    /* "in view" is generous on purpose: a figure should have finished
       counting by the time it is comfortably readable, not start then. */
    if (r.top < vh * 0.92 && r.bottom > 0) {
      waiting.delete(el);
      hit();
    }
  });
  if (waiting.size === 0) unbind();
};

const onScroll = () => {
  if (!raf) raf = requestAnimationFrame(read);
};

const bind = () => {
  if (bound) return;
  bound = true;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
};

const unbind = () => {
  if (!bound) return;
  bound = false;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
};

/** Call `hit` once, when `el` first comes into view. Returns an unsubscribe. */
export const onArrival = (el: Element, hit: Hit): (() => void) => {
  waiting.set(el, hit);
  bind();
  /* check immediately: it may already be on screen */
  if (!raf) raf = requestAnimationFrame(read);
  return () => {
    waiting.delete(el);
    if (waiting.size === 0) unbind();
  };
};
