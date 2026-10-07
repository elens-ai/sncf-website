import React, { useEffect, useId, useRef, useState } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PILLARS } from '../data/pillars';
import { EMPOWER_COMPANIONS, PILLAR_LOGOS, companionTransform } from './pillarLogoArt';
import { createFrameClock } from '../utils/frameClock';
import './value-compass.css';

const VALUES = ['heal', 'enrich', 'empower'] as const;
type Value = typeof VALUES[number];
/* Each value's own emblem, as the menu shows it (the leaves, the open book, the figure with arms
   raised), cut out on transparency so its disc can paint it in the value's colour or in white. */
const mark = (id: Value) => resolveCMSMedia(`/images/emblem-marks/${id}.webp`);

export function ValueCompass({ choice, onChange, active, held = false }: {
  choice: Value; onChange: (value: Value) => void; active: boolean;
  /** Stops the turning while the visitor is choosing a value from outside it (the cover's headline words). */
  held?: boolean;
}) {
  useCMSRevision();
  const companionFade = useId();
  const selected = VALUES.indexOf(choice);
  const [reduced, setReduced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const orbit = useRef<HTMLDivElement>(null);
  const angle = useRef(selected * 120);
  const reached = useRef(selected);
  const change = useRef(onChange);
  change.current = onChange;


  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // Manual selection moves the traveller to that stop; automatic arrivals do not reset it.
  useEffect(() => {
    if (selected !== reached.current) {
      reached.current = selected;
      angle.current = selected * 120;
      if (orbit.current) orbit.current.style.transform = `rotate(${angle.current}deg)`;
    }
  }, [selected]);

  useEffect(() => {
    if (!active || reduced || dragging || held) return;
    const clock = createFrameClock(delta => {
      angle.current = (angle.current + delta * 20) % 360;
      if (orbit.current) orbit.current.style.transform = `rotate(${angle.current}deg)`;
      const stop = Math.floor(angle.current / 120) % 3;
      if (stop !== reached.current) {
        reached.current = stop;
        change.current(VALUES[stop]);
      }
    }, 60);
    clock.start();
    return () => clock.stop();
  }, [active, reduced, dragging, held]);

  const select = (index: number) => {
    const next = (index + VALUES.length) % VALUES.length;
    onChange(VALUES[next]);
  };
  const keys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? selected + 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? selected - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? VALUES.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next);
  };
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest('button')) return;
    drag.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    drag.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (event.type === 'pointerup' && Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) select(selected + (dx < 0 ? 1 : -1));
  };

  return <div className="service-compass" data-resting={reduced || !active} data-value={choice}>
    <div className="service-compass-stage" data-dragging={dragging} tabIndex={0} role="group" aria-label={`${PILLARS.find(p => p.id === choice)!.label}. Use arrow keys or swipe to change the vertical.`} onKeyDown={keys}
      onPointerDown={startDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}
      onLostPointerCapture={() => { drag.current = null; setDragging(false); }}>
      <div className="service-compass-aura" aria-hidden="true" />
      <div className="service-compass-face" aria-hidden="true">
        <div className="service-compass-inner-ring" />
        <div ref={orbit} className="service-compass-needle" />
        <svg className="service-compass-flourish" viewBox="0 0 200 200" fill="none">
          <ellipse cx="100" cy="100" rx="43" ry="83" transform="rotate(-35 100 100)" />
          <ellipse cx="100" cy="100" rx="43" ry="83" transform="rotate(35 100 100)" />
        </svg>
      </div>
      <div className="service-compass-sculpture" aria-hidden="true">
        {choice === 'empower' ? <svg className="service-compass-empower-mark" viewBox="-30 0 200 132" fill="white">
          <defs><linearGradient id={companionFade} gradientUnits="userSpaceOnUse" x1="0" y1="5.365" x2="0" y2="106.375">
            <stop offset="0" stopColor="white" stopOpacity=".5" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient></defs>
          {EMPOWER_COMPANIONS.map(mate => <g key={mate.dx} transform={companionTransform(mate, Math.sign(mate.dx) * 9)} fill={`url(#${companionFade})`}>
            {PILLAR_LOGOS.empower.paths.map(d => <path key={d} d={d} />)}
          </g>)}
          {PILLAR_LOGOS.empower.paths.map(d => <path key={d} d={d} />)}
        </svg> : <i className="service-compass-centre-mark" style={{ '--mark': `url("${mark(choice)}")` } as React.CSSProperties} />}
        <p className="values-cover-vertical-name">{PILLARS.find(p => p.id === choice)!.label}</p>
        <div className="service-compass-shadow" />
      </div>
    </div>
  </div>;
}
