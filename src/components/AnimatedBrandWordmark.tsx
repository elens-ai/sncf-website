import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import './animated-brand-wordmark.css';

type LetterPosition = { x: number; y: number; scale: number; shortX: number; shortY: number };

/** The four initials travel from their words into one monogram, without moving the navigation. */
export const AnimatedBrandWordmark: React.FC<{
  name: string;
  descriptor: string;
  hidden?: boolean;
}> = ({ name, descriptor, hidden = false }) => {
  const reducedMotion = useReducedMotion();
  /* Hidden behind the welcome splash, the wordmark waits as the S.N.C.F
     monogram, so it appears that way beside the landed logo; the usual
     full-name cycle follows. */
  const [compact, setCompact] = useState(hidden);
  const [engaged, setEngaged] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [positions, setPositions] = useState<LetterPosition[]>([]);
  const slot = useRef<HTMLAnchorElement>(null);
  const firstLine = useRef<HTMLSpanElement>(null);
  const secondLine = useRef<HTMLSpanElement>(null);
  const sourceLetters = useRef<(HTMLSpanElement | null)[]>([]);
  const targetLetters = useRef<(HTMLSpanElement | null)[]>([]);
  const rows = [name.trim().split(/\s+/), descriptor.trim().split(/\s+/)];
  const words = rows.flat();
  const isCompact = compact && !engaged && !reducedMotion;

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (hidden || reducedMotion || engaged || !visible) return;
    // A long reading hold, followed by a shorter monogram hold.
    const timer = window.setTimeout(() => setCompact(value => !value), compact ? 4800 : 7600);
    return () => window.clearTimeout(timer);
  }, [compact, engaged, hidden, reducedMotion, visible]);

  useLayoutEffect(() => {
    let disposed = false;
    const measure = () => {
      if (disposed || !slot.current || !firstLine.current || !secondLine.current) return;
      const line = secondLine.current;
      line.style.letterSpacing = 'normal';
      line.style.marginRight = '0px';
      const difference = firstLine.current.offsetWidth - line.offsetWidth;
      const length = descriptor.length;
      if (difference > 0 && length > 1) {
        const spacing = difference / (length - 1);
        line.style.letterSpacing = `${spacing}px`;
        line.style.marginRight = `${-spacing}px`;
      }
      const origin = slot.current.getBoundingClientRect();
      setPositions(words.map((_, i) => {
        const source = sourceLetters.current[i]!;
        const target = targetLetters.current[i]!;
        const a = source.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        return {
          x: a.left - origin.left, y: a.top - origin.top,
          scale: parseFloat(getComputedStyle(source).fontSize) / parseFloat(getComputedStyle(target).fontSize),
          shortX: b.left - origin.left, shortY: b.top - origin.top,
        };
      }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (slot.current) observer.observe(slot.current);
    document.fonts?.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [name, descriptor]);

  return <Link
    id="site-wordmark"
    ref={slot}
    to="/"
    className="animated-brand-wordmark"
    data-mode={isCompact ? 'compact' : 'full'}
    data-ready={positions.length === words.length}
    data-hidden={hidden}
    aria-label={`${name} ${descriptor} — home`}
    title={`${name} ${descriptor}`}
    onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
    onMouseEnter={() => setEngaged(true)}
    onMouseLeave={() => setEngaged(false)}
    onFocus={() => setEngaged(true)}
    onBlur={() => setEngaged(false)}
  >
    <span className="brand-full-lockup" aria-hidden="true">
      {rows.map((row, lineIndex) => <span key={lineIndex} ref={lineIndex === 0 ? firstLine : secondLine} className={`brand-word-line brand-word-line--${lineIndex}`}>
        {row.map((word, wordIndex) => {
          const index = lineIndex === 0 ? wordIndex : rows[0].length + wordIndex;
          return <React.Fragment key={`${index}-${word}`}>
            {wordIndex > 0 && ' '}
            <span className="brand-word" style={{ '--letter-index': index } as React.CSSProperties}>
              <span className="brand-source-initial" ref={element => { sourceLetters.current[index] = element; }}>{word[0]}</span><span className="brand-word-tail">{word.slice(1)}</span>
            </span>
          </React.Fragment>;
        })}
      </span>)}
    </span>
    <span className="brand-monogram-measure" aria-hidden="true">
      {words.map((word, i) => <span key={i}><span ref={element => { targetLetters.current[i] = element; }}>{word[0]}</span>{i < words.length - 1 && <span>.</span>}</span>)}
    </span>
    <span className="brand-initials" aria-hidden="true">
      {positions.slice(0, words.length).map((position, i) => <span key={i} className="brand-moving-initial" style={{
        '--full-x': `${position.x}px`, '--full-y': `${position.y}px`, '--full-scale': position.scale,
        '--short-x': `${position.shortX}px`, '--short-y': `${position.shortY}px`, '--letter-index': i,
        '--full-weight': i < rows[0].length ? 800 : 600,
      } as React.CSSProperties}>{words[i][0]}{i < words.length - 1 && <span className="brand-monogram-dot">.</span>}</span>)}
    </span>
  </Link>;
};
