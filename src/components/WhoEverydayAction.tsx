import React, { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { ACTIVITIES } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { PROGRAMME_REACH, programmeReachTotal } from '../data/programmeReach';
import './who-everyday-action.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.WhoEverydayAction.${key}`, fallback);
const format = (value: number) => value.toLocaleString('en-US');

/** One explicitly labelled measure beside a photograph of the selected cornerstone's work. */
export function WhoEverydayAction() {
  const [selected, setSelected] = useState<typeof PROGRAMME_REACH[number]['id']>('heal');
  const copy = {
    heal: {
      title: c('heal-title', 'Care that makes a difference.'),
      unit: c('heal-unit', 'Patient visits recorded'),
      description: c('heal-description', 'Health checkups and eye-care camps bring accessible care closer to communities.'),
      note: c('heal-note', 'Includes health-checkup patients and eye-care OPD records. Repeat visits may be included.'),
      exclusion: c('heal-exclusion', 'Blood units, estimated lives potentially saved, surgeries and spectacles are separate measures and are not added to this figure.'),
    },
    enrich: {
      title: c('enrich-title', 'More room to learn and grow.'),
      unit: c('enrich-unit', 'Learning & support records'),
      description: c('enrich-description', 'Schooling, scholarships, creative skills and vocational learning open doors to possibility.'),
      note: c('enrich-note', 'A sum of reported programme figures. Learners may appear in more than one programme.'),
      exclusion: c('enrich-exclusion', 'The college-student subtotal is not added separately. This is not a count of unique learners.'),
    },
    empower: {
      title: c('empower-title', 'Many hands. Shared purpose.'),
      unit: c('empower-unit', 'Volunteer participations'),
      description: c('empower-description', 'People come together to care for railway stations, hospitals and our water bodies.'),
      note: c('empower-note', 'Participation in cleanliness programmes. Returning volunteers may be counted more than once.'),
      exclusion: c('empower-exclusion', 'Volunteers are participants, not a beneficiary headcount. Trees planted, service hours and other outcomes remain separate measures.'),
    },
  };
  const current = PROGRAMME_REACH.find(entry => entry.id === selected)!;
  const pillar = PILLARS.find(entry => entry.id === selected)!;
  const text = copy[selected];
  const featuredActivityId = { heal: 'health-checkup', enrich: 'schools-colleges', empower: 'cleanliness' }[selected];
  const featuredActivity = ACTIVITIES.find(activity => activity.id === featuredActivityId)
    ?? ACTIVITIES.find(activity => activity.pillarId === selected && (activity.images?.length || activity.cardPhoto));
  const photo = featuredActivity?.images?.[0] ?? featuredActivity?.cardPhoto;
  return <section id="everyday-action" className="who-impact" aria-labelledby="who-impact-title" style={{ '--impact-ink': pillar.accentA, '--impact-tint': pillar.accentB } as React.CSSProperties}>
    <header className="who-impact-heading">
      <div><p>{c('eyebrow', 'Our values, in action')}</p><h3 id="who-impact-title">{c('title', 'Every act reaches further.')}</h3></div>
      <p>{c('period', 'Cumulative programme reach')}<span>{c('date', 'Through September 2026')}</span></p>
    </header>
    <div className="who-impact-stage">
      <div className="who-impact-copy">
        <div className="who-impact-choices" role="group" aria-label={c('select', 'Choose a cornerstone')}>
          {PROGRAMME_REACH.map(entry => <button key={entry.id} type="button" aria-pressed={entry.id === selected} aria-controls="who-impact-result" onClick={() => setSelected(entry.id)}>
            <span aria-hidden="true" style={{ background: PILLARS.find(p => p.id === entry.id)?.accentA }} />{PILLARS.find(p => p.id === entry.id)?.label}
          </button>)}
        </div>
        <div id="who-impact-result" aria-live="polite" aria-atomic="true">
          <h4>{text.title}</h4>
          <p className="who-impact-number">{format(programmeReachTotal(current))}</p>
          <p className="who-impact-unit">{text.unit}</p>
          <p className="who-impact-description">{text.description}</p>
          <p className="who-impact-note">{text.note}</p>
          <a className="who-impact-link" href={`/core-values#${selected}`}>{c('explore', 'Explore ')}{pillar.label.toLowerCase()}<ArrowUpRight size={18} aria-hidden="true" /></a>
        </div>
      </div>
      {photo && <figure key={selected} className={`who-impact-photo who-impact-photo--${selected}`}>
        <img src={resolveCMSMedia(photo.src)} alt={photo.alt ?? featuredActivity?.title ?? pillar.label}
          width={1400} height={933} loading="lazy" decoding="async" />
      </figure>}
    </div>
    <details key={selected} className="who-impact-method">
      <summary>{c('method', 'What this figure includes')}<Plus size={16} aria-hidden="true" /></summary>
      <div className="who-impact-method-body">
        <ul>{current.components.map(component => <li key={component.metric}><span>{component.label}</span><strong>{format(component.value)}</strong></li>)}</ul>
        <p>{text.exclusion}<br />{c('source', 'Source: SNCF consolidated activity report, September 2026, page ')}{current.page}.</p>
      </div>
    </details>
  </section>;
}
