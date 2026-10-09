import React, { useEffect, useId, useRef } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ambulanceScene } from '../utils/ambulanceScene';
import './ambulance-pass.css';

/** The vehicle's position and wheel angle follow one shared scroll distance. */
export function AmbulancePass() {
  const road = useRef<HTMLDivElement>(null);
  const vehicle = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const active = useSectionActivity(road);
  useEffect(() => {
    const track = road.current;
    const van = vehicle.current;
    if (!track || !van) return;
    track.dataset.passing = 'false';
    if (!active) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, previous = 0;
    let progress: number | null = null;
    let doorway: { left: number; rise: number; scale: number } | undefined;
    let geometry = { top: 0, height: 0, roadWidth: 0, vehicleWidth: 0 };
    const update = (now: number) => {
      frame = 0;
      const target = Math.min(1, Math.max(0, (innerHeight - geometry.top + scrollY) / (innerHeight + geometry.height)));
      const elapsed = previous ? Math.min(now - previous, 64) : 16;
      previous = now;
      progress = progress === null || motion.matches ? target : progress + (target - progress) * (1 - Math.exp(-elapsed / 70));
      if (Math.abs(target - progress) < .0003) progress = target;
      const scene = ambulanceScene(geometry.roadWidth, geometry.vehicleWidth, progress, motion.matches, doorway);
      van.style.transform = `translate3d(${scene.x}px, 0, 0)`;
      van.style.setProperty('--wheel-turn', `${scene.wheel}deg`);
      track.style.setProperty('--pedestrian-left', `${scene.pedestrianLeft}px`);
      track.style.setProperty('--runner-stride', `${scene.stride}deg`);
      track.style.setProperty('--runner-counter-stride', `${-scene.stride}deg`);
      track.style.setProperty('--runner-bounce', `${-scene.bounce}px`);
      track.dataset.running = String(scene.running);
      track.dataset.noticing = String(scene.noticing || scene.thinking);
      track.dataset.thinking = String(scene.thinking);
      track.dataset.frozen = String(scene.frozen);
      track.dataset.reversing = String(scene.reversing);
      track.style.setProperty('--runner-rise', `${-scene.rise}px`);
      track.style.setProperty('--runner-scale', `${scene.scale}`);
      track.style.setProperty('--runner-opacity', `${scene.opacity}`);
      track.style.setProperty('--road-ground', `${10 + geometry.vehicleWidth * 14 / 480}px`);
      track.dataset.passing = String(!scene.frozen && !motion.matches && progress > 0 && progress < 1);
      if (progress !== target) frame = requestAnimationFrame(update);
    };
    const schedule = () => { if (!frame) { previous = 0; frame = requestAnimationFrame(update); } };
    const measure = () => {
      const bounds = track.getBoundingClientRect();
      geometry = { top: bounds.top + scrollY, height: bounds.height, roadWidth: bounds.width, vehicleWidth: van.offsetWidth };
      const ground = 10 + geometry.vehicleWidth * 14 / 480;
      const door = track.closest('.empower-service-scene')?.querySelector('[data-health-city-exit]')?.getBoundingClientRect();
      doorway = door ? { left: door.left + door.width / 2 - bounds.left - 18, rise: bounds.bottom - ground - door.bottom, scale: Math.max(.2, Math.min(.7, door.height / 90)) } : undefined;
      schedule();
    };
    // Geometry changes only on resize; scrolling moves one composited layer.
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    resize.observe(van);
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    motion.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      motion.removeEventListener('change', schedule);
      track.dataset.passing = 'false';
    };
  }, [active]);

  return <div className="ambulance-road" ref={road}>
    <div className="ambulance-road-line" aria-hidden="true" />
    <div className="ambulance-pedestrian" role="img" aria-label={getCMSCopy('copy.AmbulancePass.pedestrian', 'A man leaves Health City with his check-up report, pauses to think Tuhi Nirankar, then runs toward the ambulance as it reverses to the left.')}>
      <svg viewBox="0 0 36 90" aria-hidden="true">
        <g className="ambulance-runner-body">
          <path className="runner-leg runner-limb-back" d="M18 51L13 69 14 85 20 88H10L7 69 14 51" />
          <path className="runner-arm runner-limb-back" d="M23 25L29 39 22 48 18 44 23 37 19 28" />
          <g className="runner-head"><circle cx="18" cy="11" r="8" /><path d="M11 8Q18 2 25 8M23 11L25 14 22 15" /><circle cx="21" cy="10" r=".6" /></g>
          <g className="runner-notice"><path d="M0 6L-4 -1M-5 12H-11M3 0V-7" /></g>
          <path d="M14 20L10 25 9 49 15 53H23L27 48 25 25 21 20M14 24L18 29 22 24" />
          <path className="runner-leg runner-limb-front" d="M18 51L23 68 20 84 28 88H17L17 69 12 53" />
          <g className="runner-arm runner-limb-front"><path d="M11 25L6 39 16 44 18 40 12 36 16 28" /><g className="runner-report"><path d="M14 40L25 38 28 54 17 56ZM18 44L23 43M19 47L24 46M20 50L22 52 26 48" /></g></g>
        </g>
      </svg>
    </div>
    <div className="ambulance-thought" aria-hidden="true">
      <svg viewBox="0 0 190 90"><path d="M27 59C8 61 4 41 16 31C12 14 31 8 43 15C52 1 77 3 85 13C102 1 124 5 131 16C147 5 170 15 168 30C190 35 186 58 169 62C159 78 137 76 126 67C108 79 90 74 83 68C65 79 44 74 40 65C35 66 29 64 27 59Z"/><circle cx="158" cy="80" r="5"/><circle cx="174" cy="88" r="2"/></svg>
      <span>{getCMSCopy('copy.AmbulancePass.thought', 'Tuhi Nirankar')}</span>
    </div>
    <div className="ambulance-vehicle" ref={vehicle}>
      <svg viewBox="0 0 480 200" role="img" aria-label={getCMSCopy('copy.AmbulancePass.description', 'Sant Nirankari Mobile Dispensary Cum Ambulance, with turning wheels and illuminated roof lights.')}>
        <defs>
          <radialGradient id={`${id}-beacon`}>
            <stop stopColor="#ffbd99" stopOpacity=".7"/><stop offset="1" stopColor="#ff9d6e" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="247" cy="186" rx="211" ry="7" fill="#082f2e" opacity=".14" stroke="none" />
        <g transform="translate(480 0) scale(-1 1)">
        {/* Roof beacon and soft halo, confined to the vehicle. */}
        <g className="ambulance-beacon-halo"><ellipse cx="168" cy="31" rx="45" ry="31" fill={`url(#${id}-beacon)`} stroke="none" /></g>
        <path d="M148 44V30Q148 25 154 25H182Q188 25 188 30V44Z" fill="#f1b091" />
        <path className="ambulance-beacon" d="M151 40V30Q151 28 154 28H182Q185 28 185 30V40Z" fill="#ee6f59" />
        <path d="M145 44H191M168 28V39" />
        {/* High-roof Indian mobile-clinic van, shown from its readable side. */}
        <path d="M25 158V119Q26 110 39 107L75 98 114 51Q120 44 135 44H428Q443 44 445 61L452 151 443 165H384Q384 136 354 136Q324 136 324 165H136Q136 136 106 136Q76 136 76 165H39Q25 165 25 158Z" fill="var(--sketch-ink)" fillOpacity=".035" />
        <path d="M76 98L115 54H157V99ZM86 94H149V61H120ZM169 57H422V118H169Z" fill="var(--sketch-blue)" fillOpacity=".08" />
        <path d="M178 62H414V111H178Z" fill="none" stroke="none" />
        <path d="M36 108H69M34 117H61M25 145H76M137 153H323M385 154H451M159 48V144M421 48V151M172 118V152M28 137H55V149H28M429 126H445V145H429" />
        <path d="M33 123H50V131H33Z" fill="var(--sketch-ink)" fillOpacity=".25" />
        <path d="M432 129H443V142H432Z" fill="var(--sketch-rose)" fillOpacity=".4" />
        <path d="M52 104L66 91H77V105M52 103V113M135 113H148V117H135M402 125H413V130H402M397 136H411M397 141H409" />
        <path d="M28 152H75M140 159H318M390 160H449" stroke="var(--sketch-ink)" strokeWidth="1.5" />
        <path d="M165 124H416V134H165Z" fill="var(--sketch-ink)" stroke="none" opacity=".18" />
        <path d="M175 137H304M175 142H271" opacity=".3" />
        {/* Seated driver and window reflections. */}
        <path d="M121 79Q115 76 118 68Q122 64 128 67Q134 71 131 77L126 82M122 82L112 92H140L133 82M117 87L106 90M109 85L107 94" stroke="var(--sketch-ink)" strokeWidth="1.2" fill="none" />
        <path d="M95 91L119 64M131 62L145 62M176 53H408M445 69L449 139" stroke="var(--sketch-ink)" strokeWidth="1.5" opacity=".6" />
        <text transform="translate(592 0) scale(-1 1)" className="ambulance-name" x="296" y="78" textAnchor="middle">{getCMSCopy('copy.AmbulancePass.brand', 'Sant Nirankari')}</text>
        <text transform="translate(592 0) scale(-1 1)" className="ambulance-purpose" x="296" y="94" textAnchor="middle">{getCMSCopy('copy.AmbulancePass.purpose', 'Mobile Dispensary Cum Ambulance')}</text>
        <path d="M191 66H197V72H203V78H197V84H191V78H185V72H191Z" fill="var(--sketch-rose)" fillOpacity=".6" stroke="none" />
        {[106,354].map(x => <g key={x}>
          <circle cx={x} cy="162" r="24" fill="none" stroke="var(--sketch-ink)" strokeWidth="2" />
          <circle cx={x} cy="162" r="15" fill="none" stroke="var(--sketch-ink)" />
          <g className="ambulance-wheel" style={{ transformOrigin: `${x}px 162px` }}>
            {[0,60,120].map(deg=><path key={deg} d={`M${x-11} 162H${x+11}`} transform={`rotate(${deg} ${x} 162)`} stroke="var(--sketch-ink)" strokeWidth="2" />)}
          </g>
          <circle cx={x} cy="162" r="4" fill="var(--sketch-ink)" fillOpacity=".18" />
        </g>)}
        </g>
      </svg>
    </div>
  </div>;
}
