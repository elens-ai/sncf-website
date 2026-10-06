import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { PillarHeroVisual } from './PillarHeroVisual';
import './value-compass.css';
import './project-orbit.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProjectOrbit.${key}`, fallback);

export interface OrbitProject {
  id: string;
  /** The short name on its node. */
  name: string;
  href: string;
  ink: string;
  light: string;
  icon: LucideIcon;
  /** A photograph of the project; without one its node shows contour lines. */
  photo?: string;
}

/** THE PROJECT ORBIT, the Projects cover's counterpart of the Core Values
    compass and drawn on the same dial: the hero's photographic Projects
    emblem at the centre, and round it every project as a moon, its
    photograph ringed in its colour. The needle travels to each in turn while
    the orbit is in view; pointing at a project (or reaching it by keyboard)
    brings it into view and holds it there, and choosing it goes to its
    chapter. */
export function ProjectOrbit({ projects, choice, onChange, active }: {
  projects: OrbitProject[]; choice: number; onChange: (index: number) => void; active: boolean;
}) {
  const n = projects.length;
  const [reduced, setReduced] = useState(false);
  const [over, setOver] = useState(false);
  /* the emblem enters the first time the orbit is in view, then stays */
  const [shown, setShown] = useState(active);
  useEffect(() => { if (active) setShown(true); }, [active]);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!active || reduced || over || n < 2) return;
    const timer = window.setTimeout(() => onChange((choice + 1) % n), 4800);
    return () => clearTimeout(timer);
  }, [active, reduced, over, choice, n, onChange]);
  /* the needle turns the short way round to the project in view */
  const turn = useRef(choice * 360 / n);
  turn.current += ((choice * 360 / n - turn.current) % 360 + 540) % 360 - 180;
  const current = projects[choice];

  return <div className="service-compass project-orbit" data-resting={reduced || !active}
    style={{ '--value-color': current.ink, '--value-light': current.light } as React.CSSProperties}>
    <div className="service-compass-stage">
      <div className="service-compass-aura" aria-hidden="true" />
      <div className="service-compass-face" aria-hidden="true">
        <div className="service-compass-ticks" />
        <div className="service-compass-track" />
        <div className="service-compass-needle project-orbit-needle" style={{ transform: `rotate(${turn.current}deg)` }}><i /></div>
        <span className="service-compass-etch service-compass-etch-one" />
        <span className="service-compass-etch service-compass-etch-two" />
        <span className="service-compass-etch service-compass-etch-three" />
      </div>
      <div className="service-compass-sculpture" aria-hidden="true">
        <div className="service-compass-model"><PillarHeroVisual pillar="projects" active={shown} caption={false} /></div>
        <div className="service-compass-shadow" />
        <div className="service-compass-signature">{c('signature', 'One purpose.')}<br /><em>{c('signature-script', 'lasting impact')}</em></div>
      </div>
      <ul className="project-orbit-nodes" aria-label={c('label', 'The projects')}
        onPointerEnter={() => setOver(true)} onPointerLeave={() => setOver(false)}
        onFocus={() => setOver(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}>
        {projects.map((project, i) => {
          /* evenly round the face, the first at the top, a little out beyond its rim so the large moons keep clear of the centre */
          const angle = (i / n) * Math.PI * 2;
          const Icon = project.icon;
          return <li key={project.id} style={{
            '--x': `${50 + 41 * Math.sin(angle)}%`, '--y': `${52.5 - 42.5 * Math.cos(angle)}%`,
            '--node-ink': project.ink, '--node-light': project.light,
          } as React.CSSProperties}>
            <a className="project-orbit-node" href={project.href} data-active={i === choice} aria-current={i === choice || undefined}
              onPointerEnter={() => onChange(i)} onFocus={() => onChange(i)}>
              <span className="project-orbit-moon" data-empty={!project.photo}>
                {project.photo && <img src={resolveCMSMedia(project.photo)} alt="" loading="lazy" decoding="async" />}
              </span>
              <span className="project-orbit-symbol" aria-hidden="true"><Icon size={13} strokeWidth={1.9} /></span>
              <span className="service-compass-value-name">{project.name}</span>
            </a>
          </li>;
        })}
      </ul>
    </div>
  </div>;
}
