import React, { useEffect, useId, useRef, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { SDGS, SDG_AIMS } from '../data/sdgs';
import type { SdgCubeView } from './sdgCubeRenderer';
import './sdg-row.css';

const TIP_WIDTH = 320;
const icon = (goal: number) => resolveCMSMedia(`/images/sdg/goal-${String(goal).padStart(2, '0')}.png`);

/** The UN goals a value advances: the chapters' own line ("Advancing the UN Sustainable Development Goals", the same
    CMS text as SdgTags), and in one row the UN's flat icons (public/images/sdg, from tools/sdg), each hung as a
    pennant (the whole icon, then its goal's colour running on to a point) at full opacity. The icons are keyed by
    the value, so a change of value brings its pennants in afresh.

    A pennant pointed at, focused or tapped opens a small window above the row: the goal's own box turning
    (sdgCubeRenderer), the goal as the UN states it, and the value's programmes that serve it. A tap keeps it open
    until the next tap, a tap elsewhere or Escape; `onOpenChange` lets the page hold still meanwhile. */
export function SdgRow({ goals, id, name, programmes, label: words, className = '', onOpenChange }: {
  goals: number[]; id: string; name: string; programmes: { title: string; goals: number[] }[];
  /** the line's own words, where a place gives the goals another (a report's "UN goals it advances") */
  label?: string; className?: string; onOpenChange?: (open: boolean) => void;
}) {
  useCMSRevision();
  const label = useId();
  const tipId = useId();
  const row = useRef<HTMLDivElement>(null);
  const cubeHost = useRef<HTMLDivElement>(null);
  const cube = useRef<SdgCubeView | null>(null);
  const [open, setOpen] = useState<{ goal: number; pinned: boolean; left: number; arrow: number } | null>(null);
  const [cubeGoal, setCubeGoal] = useState(0);
  const line = words ?? getCMSCopy('copy.UnAffiliation.sdg-label', 'Advancing the UN Sustainable Development Goals');

  const show = (goal: number, flag: HTMLElement, pinned: boolean) => {
    const box = row.current?.getBoundingClientRect(), at = flag.getBoundingClientRect();
    if (!box) return;
    const centre = at.left + at.width / 2 - box.left;
    const width = Math.min(TIP_WIDTH, window.innerWidth - 32);
    const left = Math.max(0, Math.min(centre - width / 2, box.width - width));
    setOpen({ goal, pinned, left, arrow: centre - left });
  };

  const isOpen = open !== null;
  useEffect(() => { onOpenChange?.(isOpen); }, [isOpen, onOpenChange]);
  useEffect(() => { setOpen(null); }, [id]);
  /* a window kept open by a tap closes on Escape or a tap anywhere else */
  useEffect(() => {
    if (!isOpen) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(null); };
    const away = (event: PointerEvent) => { if (!row.current?.contains(event.target as Node)) setOpen(null); };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', away);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', away); };
  }, [isOpen]);
  /* the box: the 3D is loaded the first time a window opens, and turns only while one is open */
  const goal = open?.goal ?? 0;
  useEffect(() => {
    if (!goal) { cube.current?.play(false); return; }
    let cancelled = false;
    void (async () => {
      if (!cube.current && cubeHost.current) {
        try {
          const { attachSdgCube } = await import('./sdgCubeRenderer');
          if (cancelled || cube.current || !cubeHost.current) return;
          cube.current = attachSdgCube(cubeHost.current, setCubeGoal);
        } catch (error) { console.warn('Unable to show the goal box', error); return; }
      }
      cube.current?.show(goal);
      cube.current?.play(true);
    })();
    return () => { cancelled = true; };
  }, [goal]);
  useEffect(() => () => { cube.current?.dispose(); cube.current = null; }, []);

  const value = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const serving = goal ? programmes.filter(programme => programme.goals.includes(goal)).map(programme => programme.title) : [];
  const listed = serving.length > 4 ? [...serving.slice(0, 4), `+${serving.length - 4} ${getCMSCopy('copy.SdgRow.more', 'more')}`] : serving;

  return <div ref={row} className={`sdg-row ${className}`.trim()}>
    <p id={label} className="sdg-row-label"><Globe2 size={14} strokeWidth={1.7} aria-hidden="true" /><span>{line}</span></p>
    <ul key={id} aria-labelledby={label}>
      {goals.map((g, i) => <li key={g} style={{ '--i': i, '--sdg': SDGS[g]?.color } as React.CSSProperties}>
        <button type="button" className="sdg-row-flag" aria-label={`${g}. ${SDGS[g]?.name ?? ''}`} aria-expanded={open?.goal === g} aria-describedby={open?.goal === g ? tipId : undefined}
          onPointerEnter={event => { if (event.pointerType === 'mouse' && !open?.pinned) show(g, event.currentTarget, false); }}
          onPointerLeave={event => { if (event.pointerType === 'mouse' && !open?.pinned) setOpen(null); }}
          onFocus={event => { if (!open) show(g, event.currentTarget, false); }}
          onBlur={() => { if (!open?.pinned) setOpen(null); }}
          onClick={event => { if (open?.goal === g && open.pinned) setOpen(null); else show(g, event.currentTarget, true); }}>
          <span className="sdg-row-pennant" aria-hidden="true">
            <span className="sdg-row-heading"><strong>{g}</strong><span>{SDGS[g]?.name}</span></span>
            <svg className="sdg-row-symbol" viewBox="0 480 1500 950" preserveAspectRatio="xMidYMid meet">
              <image href={icon(g)} width="1500" height="1500" />
            </svg>
          </span>
        </button>
      </li>)}
    </ul>
    <div id={tipId} role="tooltip" className="sdg-row-tip" data-open={isOpen} aria-hidden={!isOpen}
      style={{ left: open?.left ?? 0, '--arrow': `${open?.arrow ?? 24}px`, '--sdg': goal ? SDGS[goal]?.color : undefined } as React.CSSProperties}>
      <div ref={cubeHost} className="sdg-row-tip-cube" aria-hidden="true">
        {goal > 0 && cubeGoal !== goal && <img src={icon(goal)} alt="" />}
      </div>
      {goal > 0 && <div className="sdg-row-tip-words">
        <p className="sdg-row-tip-kicker">{getCMSCopy('copy.SdgRow.goal', 'Goal')} {goal}</p>
        <h3>{SDGS[goal]?.name}</h3>
        <p className="sdg-row-tip-aim">{SDG_AIMS[goal]}</p>
        {listed.length > 0 && <p className="sdg-row-tip-how">
          <b>{getCMSCopy('copy.SdgRow.how', 'How {value} advances it').replace('{value}', value)}</b>{listed.join(' · ')}
        </p>}
      </div>}
    </div>
  </div>;
}
