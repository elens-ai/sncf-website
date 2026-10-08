import React from 'react';
import { PillarMarkShapes } from './PillarMark';
import type { MosaicPillar } from './pillarLogoArt';

/** Lightweight vector illustration: people gathering around the selected value. */
export function JournalIllustration({ pillar }: { pillar: MosaicPillar }) {
  return <svg className="journal-illustration" viewBox="0 0 360 350" fill="none" aria-hidden="true">
    <path d="M45 292V158a135 135 0 0 1 270 0v134Z" fill="var(--event-tint)" opacity=".28" />
    <path d="M67 282V159a113 113 0 0 1 226 0v123" stroke="var(--event-ink)" strokeOpacity=".18" />
    <circle cx="180" cy="132" r="91" fill="#fffdf7" />
    <circle cx="180" cy="132" r="102" stroke="var(--event-ink)" strokeOpacity=".18" strokeDasharray="2 8" />
    <g transform="translate(116 80) scale(.88)" fill="var(--event-ink)"><PillarMarkShapes pillar={pillar} /></g>
    <ellipse cx="180" cy="289" rx="144" ry="12" fill="#123d5020" />
    <g className="journal-illustration-leaves" stroke="#2b8268" strokeWidth="3" strokeLinecap="round">
      <path d="M43 284v-63m0 31-14-15m14 1 15-18" />
      <path d="M42 245C22 246 20 235 20 225c16 0 24 6 22 20Z" fill="#79b895" stroke="none" />
      <path d="M44 231c0-17 6-26 23-29 2 17-7 27-23 29Z" fill="#318b6f" stroke="none" />
      <path d="M313 287v-48m0 27 14-10" />
      <path d="M314 258c0-17 6-26 23-29 2 17-7 27-23 29Z" fill="#79b895" stroke="none" />
    </g>
    <g className="journal-illustration-person-left">
      <path d="m86 222-6 62h18l14-56 14 56h18l-8-73Z" fill="#163b60" />
      <path d="M84 169c-16 5-21 21-25 43l16 5 13-26-4 41h55l-8-44 34-21-9-12-40 18Z" fill="#e6b3ca" />
      <path d="m156 155 13-9q8-3 9 3l-14 18Z" fill="#b87454" />
      <path d="m59 212-3 13q0 8 7 7l12-15Z" fill="#b87454" />
      <path d="M105 140h14v33q-8 9-17 0Z" fill="#b87454" />
      <ellipse cx="111" cy="135" rx="18" ry="24" fill="#cd916b" />
      <path d="M93 138c-11-27 14-39 29-23l8 18-13-6-13 5-7 17Z" fill="#17354b" />
      <path d="M80 284h18l1 7H75q-1-4 5-7m46 0h18l7 7h-27Z" fill="#163b60" />
    </g>
    <g className="journal-illustration-person-right">
      <path d="m231 226-4 59h16l16-51 9 51h17l-3-67Z" fill="#c49450" />
      <path d="M235 174c15-10 33-10 44 0l18 45-16 7-12-28 10 40h-54l5-42-31-15 6-15Z" fill="#3693af" />
      <path d="m205 166-16-8q-8-1-7 5l17 18Z" fill="#c88d67" />
      <path d="m297 219 3 14q-1 8-7 5l-12-12Z" fill="#c88d67" />
      <path d="M246 148h14v25q-6 8-15 0Z" fill="#c88d67" />
      <ellipse cx="254" cy="139" rx="18" ry="24" fill="#dda57c" />
      <path d="M237 138c-8-20 4-32 20-26 15-6 27 17 15 39l-7-16-15-8Z" fill="#17354b" />
      <path d="M227 283h16l1 8h-25q0-4 8-8m41 0h17l8 8h-25Z" fill="#17354b" />
    </g>
    <g stroke="var(--event-ink)" strokeWidth="2" strokeLinecap="round" opacity=".65">
      <path d="M66 95v12m-6-6h12m225-35v12m-6-6h12" />
      <circle cx="45" cy="161" r="3" /><circle cx="310" cy="132" r="3" />
    </g>
  </svg>;
}
