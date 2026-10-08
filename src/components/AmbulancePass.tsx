import React, { useEffect, useId, useRef } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';
import './ambulance-pass.css';

/** The vehicle's position and wheel angle follow one shared scroll distance. */
export function AmbulancePass() {
  const road = useRef<HTMLDivElement>(null);
  const vehicle = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const track = road.current;
    const van = vehicle.current;
    if (!track || !van) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = track.getBoundingClientRect();
      const width = van.offsetWidth;
      const progress = Math.min(1, Math.max(0, (innerHeight - bounds.top) / (innerHeight + bounds.height)));
      const distance = (bounds.width + width) * progress;
      const x = motion.matches ? (bounds.width - width) / 2 : distance - width;
      van.style.transform = `translate3d(${x}px, 0, 0)`;
      van.style.setProperty('--wheel-turn', motion.matches ? '0deg' : `${-distance / (width * 23 / 480) * 180 / Math.PI}deg`);
      track.dataset.passing = String(progress > 0 && progress < 1 && pageIsActive(track));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener(PAGE_ACTIVITY_EVENT, schedule);
    motion.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, schedule);
      motion.removeEventListener('change', schedule);
    };
  }, []);

  return <div className="ambulance-road" ref={road}>
    <div className="ambulance-road-line" aria-hidden="true" />
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
