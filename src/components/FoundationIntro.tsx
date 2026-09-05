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

/* The portrait holds the front for ~5.2s (26s per turn / 5 cards) and typing
   only starts once the copy has settled, so there are roughly 4.6s to write in.
   115 characters at 32ms = 3.7s leaves about a second for the signature to
   fade in and be read before the copy shuttles away. Slower than this and the
   sentence would still be typing as it leaves. */
const TYPE_MS = 32;

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
  /** Fires once, the moment the sentence finishes writing (or immediately,
      under reduced motion). Lets a parent hold other entrance animations —
      the orbit wheel's auto-rotation — until this line has actually been read. */
  onComplete?: () => void;
}

export const FoundationIntro: React.FC<FoundationIntroProps> = ({ active, onComplete }) => {
  const [count, setCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<number | null>(null);
  /** The sentence types out once, the first time it's shown. Every later lap
      of the wheel — the devotional portrait fronts again and this copy
      re-arrives — it should just already be there, not retype. */
  const hasTypedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* Starts the moment this copy is first settled in place. `hasTypedRef`
     guards the ANIMATION only, not the count write — every branch below sets
     `count` to something on every `active` arrival, so there is no path that
     leaves the sentence blank. That matters under StrictMode's mount →
     cleanup → remount: the second run may find `hasTypedRef` already true and
     skip straight to the instant branch, but it still writes the full length,
     it just never (further) risks a bailed-and-blank render the way an
     early-return guard would have.

     The early return when inactive must NOT reset the count: `active` drops
     as the block shuttles away, and clearing the text there would blank the
     sentence mid-fade. */
  useEffect(() => {
    if (!active) return;

    if (reducedMotion || hasTypedRef.current) {
      setCount(FULL_TEXT.length);
      return;
    }

    hasTypedRef.current = true;
    setCount(0);
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

  /* Separate from the effect above so onComplete isn't retriggered by every
     render that leaves `active`/`reducedMotion` unchanged — it should fire
     exactly once per arrival, the frame `count` actually reaches the end. */
  useEffect(() => {
    if (active && count >= FULL_TEXT.length) onComplete?.();
  }, [active, count, onComplete]);

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

      {/* The foundation's motto, signing off the introduction in Brittany
          Signature — the same face that writes it on the welcome screen, so
          arriving here reads as a callback rather than a new piece of copy.

          Sized from --pillar-name-size rather than the welcome screen's own
          clamp: that clamp peaks at 91px, which would make the sign-off larger
          than the Welcome heading above it and invert the hierarchy. At 0.55 it
          stays comfortably under the heading at every width and through any
          future rescale. */}
      <p
        className="font-signature text-white leading-none mt-6 drop-shadow-md select-none transition-opacity duration-500"
        style={{
          fontSize: 'calc(var(--pillar-name-size) * 0.55)',
          opacity: done ? 1 : 0,
        }}
      >
        Service with Humility
      </p>
    </>
  );
};
