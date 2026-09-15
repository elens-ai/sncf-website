import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Heart, Sprout } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PILLARS } from '../data/pillars';
import { PillarModelCard } from './PillarModelCard';
import { createFrameClock } from '../utils/frameClock';
import './value-compass.css';

const VALUES = ['heal', 'enrich', 'empower'] as const;
type Value = typeof VALUES[number];
const ICONS = [Heart, BookOpen, Sprout];

export function ValueCompass({ choice, onChange, active }: {
  choice: Value; onChange: (value: Value) => void; active: boolean;
}) {
  useCMSRevision();
  const selected = VALUES.indexOf(choice);
  const [reduced, setReduced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const orbit = useRef<HTMLDivElement>(null);
  const angle = useRef(selected * 120);
  const reached = useRef(selected);
  const change = useRef(onChange);
  change.current = onChange;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

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
    if (!active || reduced || dragging) return;
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
  }, [active, reduced, dragging]);

  const select = (index: number, focus = false) => {
    const next = (index + VALUES.length) % VALUES.length;
    onChange(VALUES[next]);
    if (focus) buttons.current[next]?.focus();
  };
  const keys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? selected + 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? selected - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? VALUES.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next, true);
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
    <div className="service-compass-stage" data-dragging={dragging}
      onPointerDown={startDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}
      onLostPointerCapture={() => { drag.current = null; setDragging(false); }}>
      <div className="service-compass-aura" aria-hidden="true" />
      <div className="service-compass-face" aria-hidden="true">
        <div className="service-compass-ticks" />
        <div className="service-compass-track" />
        <div ref={orbit} className="service-compass-needle"><i /></div>
        <span className="service-compass-etch service-compass-etch-one" />
        <span className="service-compass-etch service-compass-etch-two" />
        <span className="service-compass-etch service-compass-etch-three" />
      </div>
      <div className="service-compass-sculpture" aria-hidden="true">
        <div className="service-compass-model" key={choice}>
          <PillarModelCard id={choice} label={PILLARS.find(p => p.id === choice)!.label} active={active} animate={active && !reduced} />
        </div>
        <div className="service-compass-shadow" />
        <div className="service-compass-signature">{getCMSCopy('copy.CoreValuesPage.d677190e0a99', 'Service')}<br /><em>{getCMSCopy('copy.CoreValuesPage.bb8643e88aae', 'with humility')}</em></div>
      </div>
      <div className="service-compass-values" role="radiogroup" aria-label={getCMSCopy('copy.CoreValuesPage.c7a3284847f9', 'Preview a core value')}>
        {VALUES.map((id, index) => {
          const pillar = PILLARS.find(p => p.id === id)!;
          const Icon = ICONS[index];
          return <button key={id} ref={node => { buttons.current[index] = node; }}
            className={`service-compass-value service-compass-value-${id}`} role="radio" aria-checked={choice === id}
            tabIndex={choice === id ? 0 : -1}
            onKeyDown={keys} onClick={() => onChange(id)}
            style={{ '--node-ink': pillar.accentA, '--node-light': pillar.accentB } as React.CSSProperties}>
            <span className="service-compass-value-symbol"><Icon size={23} strokeWidth={1.5} /></span>
            <span className="service-compass-value-name">{pillar.label}</span>
          </button>;
        })}
      </div>
    </div>
  </div>;
}
