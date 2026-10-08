import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { PillarModelCard } from './PillarModelCard';
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
    chapter. The Who We Are cover sets its own emblem at the centre (the
    lotus) and the things the foundation's hands do round it, and turns the
    needle itself. */
export function ProjectOrbit({ projects, choice, onChange, active, centre, signature, label, auto = true, interval = 4800, className }: {
  projects: OrbitProject[]; choice: number; onChange: (index: number) => void; active: boolean;
  /** what stands at the centre: the Projects emblem unless given */
  centre?: React.ReactNode;
  /** the motto beneath it: the Projects one unless given, none if null */
  signature?: React.ReactNode | null;
  /** what the moons are, for assistive technology */
  label?: string;
  /** whether the needle moves on by itself while the orbit is in view */
  auto?: boolean;
  interval?: number;
  className?: string;
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
    if (!auto || !active || reduced || over || n < 2) return;
    const timer = window.setTimeout(() => onChange((choice + 1) % n), interval);
    return () => clearTimeout(timer);
  }, [auto, active, reduced, over, choice, n, onChange, interval]);
  /* the needle turns the short way round to the project in view */
  const turn = useRef(choice * 360 / n);
  turn.current += ((choice * 360 / n - turn.current) % 360 + 540) % 360 - 180;
  const current = projects[choice];

  return <div className={`service-compass project-orbit${className ? ` ${className}` : ''}`} data-resting={reduced || !active}
    style={{ '--value-color': current.ink, '--value-light': current.light } as React.CSSProperties}>
    <div className="service-compass-stage">
      <div className="service-compass-aura" aria-hidden="true" />
      <div className="service-compass-face" aria-hidden="true">
        {!centre && <svg className="project-orbit-artwork" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="85" />
          <ellipse cx="100" cy="100" rx="43" ry="79" transform="rotate(-35 100 100)" />
          <ellipse cx="100" cy="100" rx="43" ry="79" transform="rotate(35 100 100)" />
          <path d="M28 125Q67 91 100 125T172 125M32 133Q67 104 100 133T168 133" />
        </svg>}
      </div>
      <div className="service-compass-sculpture" aria-hidden="true">
        <div className="service-compass-model">{centre ?? <div className="project-orbit-bloom"><PillarModelCard id="projects" label="Projects bloom" active={active && shown} animate={active && !reduced} modelUrl="/models/projects.glb?v=sncf-bloom-balanced" /></div>}</div>
        <div className="service-compass-shadow" />
        {signature != null && <div className="service-compass-signature">{signature}</div>}
      </div>
      <ul className="project-orbit-nodes" aria-label={label ?? c('label', 'The projects')}
        onPointerEnter={() => setOver(true)} onPointerLeave={() => setOver(false)}
        onFocus={() => setOver(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}>
        {projects.map((project, i) => {
          /* evenly round the face, the first at the top, a little out beyond its rim so the large moons keep clear of the centre */
          const angle = (i / n) * Math.PI * 2;
          return <li key={project.id} style={{
            '--x': `${50 + 41 * Math.sin(angle)}%`, '--y': `${52.5 - 42.5 * Math.cos(angle)}%`,
            '--node-ink': project.ink, '--node-light': project.light,
          } as React.CSSProperties}>
            <a className="project-orbit-node" href={project.href} data-active={i === choice} aria-current={i === choice || undefined}
              onPointerEnter={() => onChange(i)} onFocus={() => onChange(i)}>
              <span className="project-orbit-moon" data-empty={!project.photo}>
                {project.photo && <img src={resolveCMSMedia(project.photo)} alt="" loading="lazy" decoding="async" />}
              </span>
              <span className="service-compass-value-name">{project.name}</span>
            </a>
          </li>;
        })}
      </ul>
    </div>
  </div>;
}
