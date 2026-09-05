import React, { useEffect, useRef, useState } from 'react';
import { onArrival } from '../utils/arrival';
import { toNumber, isTallyable } from '../utils/figures';

/** Counts a figure up once, when it first comes into view. */
export const Tally: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = toNumber(value);
    if (
      !target ||
      !isTallyable(value) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let raf = 0;
    const suffix = value.replace(/^[\d,.]+/, '');
    /* One shared, rAF-throttled driver decides when this has arrived. Each
       figure used to mount its own unthrottled scroll listener and measure on
       every event — nine layout reads per scroll with twelve figures up. */
    let settle = 0;
    const stop = onArrival(el, () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        /* easeOut for the last stretch: the number decelerates into place */
        const e = 1 - Math.pow(1 - k, 3);
        setShown(Math.round(target * e).toLocaleString('en-US') + suffix);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      /* THE FIGURE MUST END UP TRUE, whatever happens to the animation.
         A count-up walks through numbers that are all WRONG until the last
         frame, and requestAnimationFrame is suspended whenever the tab is
         backgrounded or throttled — so an interrupted tally leaves a false
         figure standing indefinitely. Seen in testing: "268 couples married"
         where the record says 5,317. A timer, which keeps running when frames
         do not, guarantees the true value is what remains. */
      settle = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        setShown(value);
      }, 1500);
    });

    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
};
