import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { Activity } from '../data/activities';
import type { PillarState } from '../types';
import { Tally } from './Tally';
import './who-everyday-action.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.WhoEverydayAction.${key}`, fallback);

/** One photographic story beside three comparable, independently labelled measures. */
export function WhoEverydayAction({ entries }: { entries: { pillar: PillarState; act: Activity }[] }) {
  const [selected, setSelected] = useState('');
  const current = entries.find(entry => entry.pillar.id === selected) ?? entries[0];
  if (!current) return null;
  return <section id="everyday-action" className="who-impact" aria-labelledby="who-impact-title">
    <header className="who-impact-heading">
      <div><p>{c('eyebrow', 'Our values, in action')}</p><h3 id="who-impact-title">{getCMSCopy('copy.WhoWeArePage.tally-title', 'Everyday action.')}</h3></div>
      <p>{c('invitation', 'Explore the care, learning and collective effort behind the figures.')}</p>
    </header>
    <div className="who-impact-stage" style={{ '--impact-ink': current.pillar.accentA, '--impact-tint': current.pillar.accentB } as React.CSSProperties}>
      <div className="who-impact-feature" id="who-impact-feature">
        {entries.map(({ pillar, act }) => {
          const photo = act.images?.[0] ?? act.cardPhoto;
          return photo && <img key={pillar.id} src={resolveCMSMedia(photo.src)} alt={pillar.id === current.pillar.id ? photo.alt : ''} aria-hidden={pillar.id !== current.pillar.id} data-selected={pillar.id === current.pillar.id} width={900} height={650} loading="lazy" decoding="async" />;
        })}
        <span className="who-impact-photo-label">{current.pillar.label}</span>
        <div className="who-impact-feature-copy" aria-live="polite" aria-atomic="true">
          <h4>{current.act.title}</h4><p>{current.act.blurb}</p>
          <a href={`/core-values#${current.pillar.id}`}>{getCMSCopy('copy.WhoWeArePage.2e1ac6e9292a', 'Explore ')}{current.pillar.label.toLowerCase()}<span><ArrowUpRight size={20} aria-hidden="true" /></span></a>
        </div>
      </div>
      <div className="who-impact-register">
        <p className="who-impact-register-label">{c('select', 'Choose a cornerstone')}</p>
        <ul>
          {entries.map(({ pillar, act }, i) => <li key={pillar.id}>
            <button type="button" aria-pressed={current.pillar.id === pillar.id} aria-controls="who-impact-feature" aria-label={`${pillar.label}: ${act.title}, ${act.headline.value} ${act.headline.label}`} onClick={() => setSelected(pillar.id)} style={{ '--entry-tint': pillar.accentB } as React.CSSProperties}>
              <span className="who-impact-entry-heading"><span>{pillar.label}</span><small aria-hidden="true">0{i + 1}</small></span>
              <span className="who-impact-number" aria-hidden="true"><Tally value={act.headline.value} /></span>
              <span className="who-impact-unit" aria-hidden="true">{act.headline.label}</span>
              <span className="who-impact-period">{act.period}</span>
            </button>
          </li>)}
        </ul>
      </div>
    </div>
  </section>;
}
