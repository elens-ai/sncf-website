import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import './humanity-slogan.css';
import { typewriterLines } from '../utils/typewriter';

export function HumanitySlogan({ lines, active }: { lines: [string, string]; active: boolean }) {
  const reduced = useReducedMotion();
  const typedLines = typewriterLines(lines, 5000);
  const surface = useRef<HTMLButtonElement>(null);
  const [replay, setReplay] = useState(0);
  const textKey = lines.join('\n');
  useEffect(() => {
    if (!active) return;
    const nodes = [...(surface.current?.querySelectorAll<HTMLElement>('.humanity-slogan-letter') ?? [])];
    nodes.forEach(node => { node.style.visibility = reduced ? 'visible' : 'hidden'; });
    if (reduced) return;
    const rail = surface.current?.closest('.mission-chapters');
    let timer = 0, elapsed = 0, started = performance.now(), shown = 0, paused = false;
    const tick = () => {
      const time = elapsed + performance.now() - started;
      while (shown < nodes.length && Number.parseFloat(nodes[shown].style.getPropertyValue('--type-at')) <= time) nodes[shown++].style.visibility = 'visible';
      if (shown < nodes.length) timer = window.setTimeout(tick, Math.max(0, Number.parseFloat(nodes[shown].style.getPropertyValue('--type-at')) - time));
    };
    const sync = () => {
      const next = rail?.getAttribute('data-paused') === 'true';
      if (next === paused) return;
      paused = next;
      if (paused) { elapsed += performance.now() - started; clearTimeout(timer); }
      else { started = performance.now(); tick(); }
    };
    const observer = new MutationObserver(sync);
    if (rail) observer.observe(rail, { attributes: true, attributeFilter: ['data-paused'] });
    sync();
    if (!paused) tick();
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [active, reduced, replay, textKey]);
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
    aria-label={`${lines.join(' ')} — Replay animation`}
    onPointerMove={move} onPointerLeave={reset} onBlur={reset} onClick={() => setReplay(count => count + 1)}>
    <span key={replay} className="humanity-slogan-composition">
      <span className="humanity-slogan-words" lang="hi" aria-hidden="true">
        {typedLines.map((line, row) => <span className="humanity-slogan-line" key={row} style={{ '--line': row } as CSSProperties}>
          <span className="humanity-slogan-metal">{line.map(({ text, at }, index) => <span className="humanity-slogan-letter" key={index} style={{ '--type-at': `${at}ms` } as CSSProperties}>{text}</span>)}</span>
        </span>)}
      </span>
    </span>
  </button>;
}
