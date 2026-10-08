import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import './humanity-slogan.css';

export function HumanitySlogan({ lines, active }: { lines: [string, string]; active: boolean }) {
  const reduced = useReducedMotion();
  const surface = useRef<HTMLButtonElement>(null);
  const [replay, setReplay] = useState(0);
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType === 'touch') return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--slogan-x', `${((event.clientX - box.left) / box.width - .5) * 10}px`);
    event.currentTarget.style.setProperty('--slogan-y', `${((event.clientY - box.top) / box.height - .5) * 6}px`);
  };
  const reset = () => {
    surface.current?.style.setProperty('--slogan-x', '0px');
    surface.current?.style.setProperty('--slogan-y', '0px');
  };
  return <button ref={surface} type="button" className="humanity-slogan" data-active={active}
    aria-label={`${lines.join('। ')}। — Replay animation`}
    onPointerMove={move} onPointerLeave={reset} onBlur={reset} onClick={() => setReplay(count => count + 1)}>
    <span key={replay} className="humanity-slogan-composition">
      <span className="humanity-slogan-words" lang="hi" aria-hidden="true">
        {lines.map((line, row) => <span className="humanity-slogan-line" key={row} style={{ '--line': row } as CSSProperties}>
          <span className="humanity-slogan-metal">{line}</span>
        </span>)}
      </span>
    </span>
  </button>;
}
