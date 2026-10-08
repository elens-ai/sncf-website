import React from 'react';
import { ArrowUpRight, BookOpen, GraduationCap, Music2, Scissors } from 'lucide-react';
import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy } from '../cms/runtime';
import type { NvcProgramme, NvcPartId } from '../data/nvcProgrammes';
import './nvc-programme.css';

export const NVC_ICONS = { 'nvc-library': BookOpen, 'nvc-coaching': GraduationCap, 'skill-trades': Scissors, 'skill-nima': Music2 };

/** Original vector scenes keep library and coaching distinct without presenting
 * a school photograph as a vocational-centre photograph. */
function LearningArtwork({ programme }: { programme: NvcPartId }) {
  const coaching = programme === 'nvc-coaching';
  return <svg className="nvc-learning-art" viewBox="0 0 500 430" fill="none" aria-hidden="true">
    <circle cx="250" cy="215" r="176" fill="#d7f0ec" />
    <circle cx="397" cy="95" r="22" fill="#fff4d8" />
    <path d="M91 346h330" stroke="#76b8b6" strokeWidth="2" strokeLinecap="round" />
    {coaching ? <>
      <rect x="116" y="83" width="270" height="192" rx="20" fill="#174e5b" />
      <rect x="128" y="95" width="246" height="168" rx="12" stroke="#b7e4df" strokeWidth="2" />
      <path d="M158 133h122m-122 18h77m-77 51 27-22 29 11 31-32m-87 64h98" stroke="#dcf5e9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="320" cy="180" r="27" stroke="#edb2c8" strokeWidth="5" />
      <path d="m303 180 12 12 24-27" stroke="#edb2c8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m178 275-20 70m164-70 20 70" stroke="#174e5b" strokeWidth="8" strokeLinecap="round" />
      <path d="M102 290h134v29H102z" fill="#2dacc3" /><path d="M110 294h116v18H110z" fill="#fffaf0" />
      <path d="M88 320h164v24H88z" fill="#e999b8" /><path d="M96 325h147v12H96z" fill="#fffaf0" />
      <path d="m361 299 15-62 12 3-15 62-8 12z" fill="#e9be65" />
    </> : <>
      <rect x="118" y="91" width="270" height="224" rx="16" fill="#fffaf0" stroke="#8bc5c2" strokeWidth="3" />
      <path d="M128 198h250m-250 90h250" stroke="#8bc5c2" strokeWidth="7" />
      <rect x="144" y="114" width="28" height="80" rx="4" fill="#277b86" /><path d="M152 132h12m-12 43h12" stroke="#bee5df" strokeWidth="3" />
      <rect x="178" y="126" width="26" height="68" rx="4" fill="#e7adba" />
      <rect x="211" y="112" width="33" height="82" rx="4" fill="#2dacc3" /><path d="M218 125h19m-19 53h19" stroke="#d9f7f3" strokeWidth="3" />
      <path d="m254 128 25-8 22 66-25 8z" fill="#deb365" />
      <rect x="320" y="115" width="33" height="79" rx="4" fill="#97bfaa" />
      <path d="M146 253h89v30h-89z" fill="#2dacc3" /><path d="M154 258h80v19h-80z" fill="#fffaf0" />
      <path d="M150 229h103v23H150z" fill="#e7adba" /><path d="M157 234h94v13h-94z" fill="#fffaf0" />
      <rect x="277" y="217" width="26" height="66" rx="4" fill="#277b86" /><rect x="310" y="226" width="35" height="57" rx="4" fill="#deb365" />
      <path d="M177 320q39-17 75 0 38-17 76 0v39q-38-16-76 0-37-16-75 0z" fill="#fffaf0" stroke="#277b86" strokeWidth="3" strokeLinejoin="round" />
      <path d="M252 321v37m-60-23 43 3m34 0 44-3" stroke="#8bc5c2" strokeWidth="2" strokeLinecap="round" />
    </>}
    <path d="M88 229v19m-9-9h18m323-54v16m-8-8h16" stroke="#2dacc3" strokeWidth="3" strokeLinecap="round" />
    <circle cx="96" cy="131" r="5" fill="#e999b8" /><circle cx="405" cy="279" r="6" fill="#2dacc3" />
  </svg>;
}

export function NvcProgrammeSection({ programme, index }: { programme: NvcProgramme; index: number }) {
  const Icon = NVC_ICONS[programme.id];
  return <section className="nvc-programme" aria-labelledby={`${programme.id}-title`}>
    <div className="nvc-programme-main">
      <div className="nvc-programme-visual">
        {programme.photo ? <img src={resolveCMSMedia(programme.photo.src)} alt={programme.photo.alt} loading="lazy" decoding="async" /> : <LearningArtwork programme={programme.id} />}
        <span className="nvc-programme-seal"><Icon size={24} strokeWidth={1.5} /><span>0{index + 1}<small> / 04</small></span></span>
      </div>
      <div className="nvc-programme-copy">
        <p className="nvc-programme-eyebrow">{getCMSCopy('copy.NvcProgrammeSection.parent', 'Nirankari Vocational Centre')}</p>
        <h4 id={`${programme.id}-title`}>{programme.title}</h4>
        <p className="nvc-programme-line">{programme.line}</p>
        <p className="nvc-programme-description">{programme.description}</p>
      </div>
    </div>
    <div className="nvc-programme-features">
      {programme.features.map((feature, i) => <div key={feature.title}>
        <span className="nvc-feature-number">0{i + 1}<ArrowUpRight size={15} aria-hidden="true" /></span>
        <h5>{feature.title}</h5><p>{feature.text}</p>
      </div>)}
    </div>
    <div className="nvc-programme-reach">
      <dl>{programme.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd><dd className="nvc-fact-detail">{fact.detail}</dd></div>)}</dl>
      <p>{programme.footnote}</p>
    </div>
  </section>;
}
