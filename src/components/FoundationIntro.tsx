import React, { useEffect, useRef, useState } from 'react';

/**
 * The foundation's introduction, written out a character at a time while the
 * Satguru Mata Sudiksha Ji portrait fronts the wheel.
 *
 * Two ideas hold it together:
 *
 *  - The three verbs are set in Dancing Script — the same face the pillar
 *    headings use. So the sentence literally previews Heal, Enrich and
 *    Empower moments before the wheel turns and shows them, rather than
 *    being an unrelated block of copy sharing the slot.
 *  - The line is typed rather than faded in, echoing the signature that
 *    writes itself on the welcome screen.
 */

interface Segment {
  text: string;
  /** Rendered in Dancing Script, matching the pillar headings. */
  script?: boolean;
  strong?: boolean;
}

const SEGMENTS: Segment[] = [
  { text: 'We are the ' },
  { text: 'Sant Nirankari Charitable Foundation', strong: true },
  { text: ' — we ' },
  { text: 'heal', script: true },
  { text: ', ' },
  { text: 'enrich', script: true },
  { text: ' and ' },
  { text: 'empower', script: true },
  { text: ' communities through selfless service.' },
];

const FULL_TEXT = SEGMENTS.map((s) => s.text).join('');

/* ~3s to write the whole line, matching the welcome signature. The portrait
   holds the front for roughly 5s (26s per turn / 5 cards), so the sentence
   finishes with a beat to spare before the copy shuttles away. */
const TYPE_MS = 26;

/** Renders the first `count` characters across the segments. */
const renderSegments = (count: number) => {
  let used = 0;
  return SEGMENTS.map((seg, i) => {
    const take = Math.max(0, Math.min(seg.text.length, count - used));
    used += seg.text.length;
    if (take === 0) return null;
    const slice = seg.text.slice(0, take);
    if (seg.script) {
      return (
        <span key={i} className="font-dancing-script font-bold text-white text-[1.28em] leading-none">
          {slice}
        </span>
      );
    }
    if (seg.strong) {
      return (
        <span key={i} className="font-semibold text-white">
          {slice}
        </span>
      );
    }
    return <span key={i}>{slice}</span>;
  });
};

interface FoundationIntroProps {
  /** True while this copy is the one on screen; typing restarts on each arrival. */
  active: boolean;
}

export const FoundationIntro: React.FC<FoundationIntroProps> = ({ active }) => {
  const [count, setCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Types once, on the first frame this copy is settled in place.
     Deliberately NOT reset when `active` goes false again: that happens as the
     block starts shuttling away, and clearing the text there would blank the
     sentence mid-fade. The component unmounts when a pillar takes the front,
     so the next arrival is a fresh mount and starts from zero on its own. */
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (reducedMotion) {
      setCount(FULL_TEXT.length);
      return;
    }

    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= FULL_TEXT.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, TYPE_MS);
    timerRef.current = id;

    return () => window.clearInterval(id);
  }, [active, reducedMotion]);

  const done = count >= FULL_TEXT.length;

  return (
    <>
      {/* The typed line. The full sentence is also rendered underneath,
          invisible, so the paragraph occupies its final height from the first
          character — otherwise every wrapped line that appeared would shove
          the credit below it down the column mid-animation. Both copies share
          one grid cell, so they overlay exactly. */}
      <p className="grid font-artistic-serif text-white/95 text-[21px] sm:text-[26px] md:text-[29px] md:leading-snug mt-1 max-w-[470px] drop-shadow-sm">
        <span aria-hidden="true" className="col-start-1 row-start-1 invisible">
          {renderSegments(FULL_TEXT.length)}
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1">
          {renderSegments(count)}
          <span
            className={`intro-caret ${done ? 'intro-caret-done' : ''}`}
            aria-hidden="true"
          />
        </span>
        {/* Screen readers get the finished sentence once, not one letter at a time. */}
        <span className="sr-only">{FULL_TEXT}</span>
      </p>

      <p
        className="font-artistic-modern text-white/85 text-[13px] sm:text-[15px] tracking-wide mt-6 transition-opacity duration-700"
        style={{ opacity: done ? 1 : 0 }}
      >
        Service with Humility
      </p>
    </>
  );
};
