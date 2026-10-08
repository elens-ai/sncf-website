import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/**
 * THE MISSION PAGE AS A TITLE SEQUENCE. Rather than setting every block of
 * copy at once, the page plays it in chapters, as a film's titles do: One
 * Purpose (its statement assembling word by word out of a soft focus), then
 * Our Mission and Our Vision side by side (each heading rising with a glint,
 * its quotation written in like ink, its body swept into view).
 * A chapter lifts away into a blur as the next one rises. Timings live in
 * index.css (MISSION PAGE).
 *
 * The rail at the foot shows the sequence's progress and steers it: each
 * chapter's line fills while it plays, pressing a chapter's name plays it, and
 * the button pauses or resumes. Pointing at the copy, or moving through the
 * rail by keyboard, holds it too, for as long as that lasts. The last chapter
 * running out ends the page. Each chapter plays for an equal share of the
 * page's time, a few seconds, as the pages before it do; a viewer who wants
 * to read on holds it.
 *
 * The message page before it plays as a sequence of one, its own markup as
 * the chapter, so it has the same rail.
 *
 * Every chapter stays in the document, so a screen reader hears all of it in
 * order. Set still (reduced motion), the chapters are simply set one after
 * another and the page keeps its own time.
 */
/** A titled half of a chapter: its heading, a quotation and its body. */
export interface MissionPart {
  title: string;
  quote?: string;
  body: string[];
}
export interface MissionChapter {
  id: string;
  /** The chapter's name on the rail, and its heading unless it has a title or parts. */
  label: string;
  title?: string;
  /** An opening statement, assembled word by word. */
  statement?: string;
  /** A line written in, as if by hand. */
  quote?: string;
  body: string[];
  /** Two titled halves set side by side, as Our Mission and Our Vision are. */
  parts?: MissionPart[];
  /** A phrase picked out wherever the body says it, in the script. */
  highlight?: string;
  /** A chapter that brings its own markup, set as given, as the Satguru's message does. */
  content?: React.ReactNode;
}

/* The paragraph with each mention of the phrase picked out. */
const marked = (paragraph: string, phrase?: string) => {
  if (!phrase || !paragraph.includes(phrase)) return paragraph;
  return paragraph.split(phrase).map((piece, at) => (
    <React.Fragment key={at}>{at > 0 && <em className="mission-chapter-highlight">{phrase}</em>}{piece}</React.Fragment>
  ));
};

const numeral = (index: number) => String(index + 1).padStart(2, '0');
/* Focus that arrived by keyboard; browsers too old to tell never hold the sequence. */
const byKeyboard = (element: EventTarget) => {
  try { return (element as HTMLElement).matches(':focus-visible'); } catch { return false; }
};

export const MissionChapters: React.FC<{
  chapters: MissionChapter[];
  /** The whole sequence's length, shared equally among its chapters. */
  totalMs: number;
  still: boolean;
  labels: { rail: string; pause: string; play: string };
  onEnd: () => void;
}> = ({ chapters, totalMs, still, labels, onEnd }) => {
  const [active, setActive] = useState(0);
  /* The chapter lifting away as the active one rises, and a count of starts so
     that pressing a chapter's name always begins it afresh. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const [held, setHeld] = useState(false);
  const [pointing, setPointing] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const paused = held || pointing || keyboard;

  const chapterMs = Math.round(totalMs / chapters.length);
  /* Touch screens report a pointer entering on every tap and never leaving,
     so only a real hover holds the sequence. */
  const canHover = useMemo(() => window.matchMedia('(hover: hover)').matches, []);

  const play = useCallback((index: number) => {
    if (index !== active) setLeaving(active);
    setActive(index);
    setRun(count => count + 1);
  }, [active]);

  /* The active chapter's clock: it stops while the sequence is held and picks
     up where it left off. The rail's line is a CSS animation paused with it. */
  const clock = useRef({ run: -1, left: 0 });
  useEffect(() => {
    if (still) return;
    if (clock.current.run !== run) clock.current = { run, left: chapterMs };
    if (paused) return;
    const started = performance.now();
    const timer = window.setTimeout(() => (active < chapters.length - 1 ? play(active + 1) : onEnd()), clock.current.left);
    return () => {
      window.clearTimeout(timer);
      clock.current.left -= performance.now() - started;
    };
  }, [still, paused, run, active, chapterMs, chapters.length, play, onEnd]);

  if (still) {
    return (
      <div className="mission-chapters" data-still="true">
        {chapters.map(chapter => <Chapter key={chapter.id} chapter={chapter} state="active" />)}
      </div>
    );
  }

  /* Pressing the button always does what its icon shows, whatever is holding the sequence. */
  const toggle = () => {
    if (!paused) {
      setHeld(true);
      return;
    }
    setHeld(false);
    setPointing(false);
    setKeyboard(false);
  };
  return (
    <div className="mission-chapters" data-paused={paused} data-opening={leaving === null}>
      <div className="mission-chapter-stage">
        {chapters.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            state={index === active ? 'active' : index === leaving ? 'leaving' : 'waiting'}
            onPoint={canHover && index === active ? setPointing : undefined}
          />
        ))}
      </div>
      <nav
        className="mission-chapter-rail"
        aria-label={labels.rail}
        onFocus={event => setKeyboard(byKeyboard(event.target))}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboard(false); }}
      >
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            type="button"
            className="mission-chapter-step"
            aria-current={index === active ? 'step' : undefined}
            data-done={index < active}
            onClick={() => play(index)}
            style={{ '--d': `${chapterMs}ms` } as React.CSSProperties}
          >
            <span className="mission-chapter-progress" aria-hidden="true"><i key={index === active ? run : undefined} /></span>
            {/* a sequence of one is not numbered */}
            {chapters.length > 1 && <span className="mission-chapter-number" aria-hidden="true">{numeral(index)}</span>}
            <span className="mission-chapter-label">{chapter.label}</span>
          </button>
        ))}
        <button type="button" className="mission-chapter-hold" aria-label={paused ? labels.play : labels.pause} title={paused ? labels.play : labels.pause} onClick={toggle}>
          {paused ? <Play size={13} fill="currentColor" aria-hidden="true" /> : <Pause size={13} fill="currentColor" aria-hidden="true" />}
        </button>
      </nav>
    </div>
  );
};

const Chapter: React.FC<{
  chapter: MissionChapter;
  state: 'active' | 'leaving' | 'waiting';
  onPoint?: (pointing: boolean) => void;
}> = ({ chapter, state, onPoint }) => {
  const words = chapter.statement?.split(/\s+/).filter(Boolean) ?? [];
  return (
    <article
      className="mission-chapter"
      data-state={state}
      data-kind={chapter.statement ? 'statement' : 'titled'}
      style={{ '--words': words.length } as React.CSSProperties}
      onPointerEnter={onPoint && (() => onPoint(true))}
      onPointerLeave={onPoint && (() => onPoint(false))}
    >
      {chapter.content ? chapter.content : chapter.parts ? (
        <div className="mission-chapter-parts">
          {chapter.parts.map(part => (
            <section key={part.title} className="mission-chapter-part">
              <h3 className="mission-chapter-title">{part.title}</h3>
              {part.quote && <p className="mission-chapter-quote">{part.quote}</p>}
              <div className="mission-chapter-body">
                {part.body.map((paragraph, at) => <p key={at} style={{ '--p': at } as React.CSSProperties}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      ) : <>
      {chapter.title
        ? <h3 className="mission-chapter-title">{chapter.title}</h3>
        : <h3 className="mission-chapter-eyebrow">{chapter.label}</h3>}
      {chapter.statement && (
        <p className="mission-chapter-statement">
          <span className="sr-only">{chapter.statement}</span>
          <span aria-hidden="true">{words.map((word, at) => (
            <React.Fragment key={at}>{at > 0 && ' '}<span className="mission-word" style={{ '--w': at } as React.CSSProperties}>{word}</span></React.Fragment>
          ))}</span>
        </p>
      )}
      {chapter.quote && <p className="mission-chapter-quote">{chapter.quote}</p>}
      <div className="mission-chapter-body">
        {chapter.body.map((paragraph, at) => <p key={at} style={{ '--p': at } as React.CSSProperties}>{marked(paragraph, chapter.highlight)}</p>)}
      </div>
      </>}
    </article>
  );
};
