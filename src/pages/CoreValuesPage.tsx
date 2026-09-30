import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, CalendarDays, Search } from 'lucide-react';
import { ValueCompass } from '../components/ValueCompass';
import { ValueAnalytics } from '../components/ValueAnalytics';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import './core-values.css';

const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
type Cornerstone = typeof CORNERSTONES[number];

/** A shared, responsive photo composition for all three cornerstones. */
const ValuePhotoCollage: React.FC<{ id: Cornerstone; label: string }> = ({ id, label }) => (
  <figure className="value-photo-story" aria-label={`${label}: compassion in action`}>
    <div className="value-photo-collage">
      <span className="value-paper-shape value-paper-shape-top" aria-hidden="true" />
      <span className="value-paper-shape value-paper-shape-bottom" aria-hidden="true" />
      {[1, 2, 3, 4, 5].map((photo) => (
        <div key={photo} className={`value-photo-frame value-photo-frame-${photo}`}>
          <img
            src={resolveCMSMedia(`/images/pavilion/${id}-${photo}.jpg`)}
            alt=""
            loading="lazy"
            decoding="async"
            width={640}
            height={640}
          />
        </div>
      ))}
    </div>
    <figcaption><span>{getCMSCopy('copy.CoreValuesPage.illustrativePhotos', 'Illustrative photography')}</span></figcaption>
  </figure>
);

const ValueCover: React.FC = () => {
  useCMSRevision();
  const [choice, setChoice] = useState<Cornerstone>('heal');
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const pillar = PILLARS.find(p => p.id === choice)!;
  return <section ref={root} className="values-cover" data-active={active} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties} aria-labelledby="values-cover-title">
    <div className="values-cover-copy">
      <p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.bb5f4b8db550", "One purpose. Three ways to make a difference.")}</p>
      <h1 id="values-cover-title">{getCMSCopy("copy.CoreValuesPage.1872c282a338", "The three")}<br /><em>{getCMSCopy("copy.CoreValuesPage.19b476bc912f", "cornerstones.")}</em></h1>
      <p>{getCMSCopy("copy.CoreValuesPage.eddff23d6323", "Care that reaches further. Learning that opens doors. Communities that grow stronger.")}</p>

    </div>
    <ValueCompass choice={choice} onChange={setChoice} active={active} />
    <div className="values-cover-footer"><span>{getCMSCopy("copy.CoreValuesPage.4109634bf723", "Compassion, made visible.")}</span><span>{getCMSCopy("copy.CoreValuesPage.1cd27a19c41a", "Explore the values · Meet the programmes · Discover the impact")}</span></div>
  </section>;
};

const ValueChapter: React.FC<{ id: Cornerstone; index: number; linkedActivity: string }> = ({ id, index, linkedActivity }) => {
  const pillar = PILLARS.find(p => p.id === id)!;
  const activities = ACTIVITIES.filter(a => a.pillarId === id);
  const [selectedId, setSelectedId] = useState(activities[0].id);
  const [query, setQuery] = useState('');
  const matching = activities.filter(a => `${a.title} ${a.blurb}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = activities.find(a => a.id === selectedId) ?? activities[0];
  useEffect(() => {
    if (ACTIVITIES.some(a => a.id === linkedActivity && a.pillarId === id)) setSelectedId(linkedActivity);
  }, [linkedActivity, id]);
  return (
    <section id={id} className="value-chapter" aria-labelledby={`${id}-title`} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties}>
      <header className="value-hero">
        <h2 id={`${id}-title`} className="value-hero-title font-dancing-script">{pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase()}</h2>
        <ValuePhotoCollage id={id} label={pillar.label} />
        {activities.slice(0, 4).map((activity, i) => (
          <a key={activity.id} href={`#${id}-explorer`} className={`value-hero-stat value-hero-stat-${i + 1}`} onClick={() => setSelectedId(activity.id)}>
            <span className="value-hero-stat-label">{activity.title}<ArrowUpRight size={16} aria-hidden="true" /></span>
            <strong>{activity.headline.value}</strong>
            <span className="value-hero-stat-unit">{activity.headline.label}</span>
            <small>{activity.period}</small>
          </a>
        ))}
      </header>

      <div className="value-explorer" id={`${id}-explorer`}>
        <div className="value-explorer-heading"><div><p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.e7b186e662f2", "Behind the numbers")}</p><h3>{getCMSCopy("copy.CoreValuesPage.6ae8bf36f85f", "Small actions. Lasting change.")}</h3></div><p>{getCMSCopy("copy.CoreValuesPage.92fcbaad24fc", "Choose a programme to explore its reach.")}</p></div>
        <div className="value-explorer-grid">
          <div className="value-programmes" role="group" aria-label={`${pillar.label} programmes`}>
            <label className="value-programme-search"><Search size={16} /><input aria-label={`Find a ${id} programme`} placeholder={getCMSCopy("copy.CoreValuesPage.a3885e77e515", "Find a programme…")} value={query} onChange={e => setQuery(e.target.value)} /></label>
            {matching.length === 0 && <p className="value-no-results">{getCMSCopy("copy.CoreValuesPage.b458f304b1f0", "No programmes match. Try another word.")}</p>}
            {matching.map((activity) => (
              <button key={activity.id} id={activity.id} aria-pressed={activity.id === selected.id} aria-controls={`${id}-detail`} onClick={() => setSelectedId(activity.id)}>
                <span className="value-programme-num">{getCMSCopy("copy.CoreValuesPage.5feceb66ffc8", "0")}{activities.indexOf(activity) + 1}</span><span>{activity.title}</span><ArrowUpRight size={18} />
              </button>
            ))}
          </div>
          <article className="value-detail" id={`${id}-detail`} aria-live="polite" aria-atomic="true">
            <div className="value-detail-top"><span>{getCMSCopy("copy.CoreValuesPage.ad3a80a2651a", "Programme in focus")}</span><span><CalendarDays size={14} />{selected.period}</span></div>
            <div className="value-detail-summary">
            <h4 className="value-content-enter" key={selected.id}>{selected.title}</h4>
            <p>{selected.blurb}</p>
            <div className="value-featured-number"><strong>{selected.headline.value}</strong><span>{selected.headline.label}</span></div>
            </div>
            <dl className="value-data-grid value-content-enter" key={selected.id}>{selected.dataPoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd>{point.value}</dd></div>)}</dl>
            <p className="value-source">{getCMSCopy("copy.CoreValuesPage.91c1f9479c9a", "Source: foundation activity report · Figures shown as reported.")}</p>
            <button className="value-next-programme" onClick={() => { setQuery(''); setSelectedId(activities[(activities.indexOf(selected) + 1) % activities.length].id); }}>{getCMSCopy("copy.CoreValuesPage.cd9fb71ad9c3", "Discover the next programme ")}<ArrowUpRight size={16} /></button>
          </article>
        </div>
      </div>
      <ValueAnalytics pillarId={id} activities={activities} explorerId={`${id}-explorer`} onSelect={setSelectedId} />
      <aside className="value-purpose"><div><p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.3824d3f1b90d", "The purpose behind the progress")}</p><h3>{pillar.subText}</h3></div><ul>{pillar.keyHighlights.map((highlight, i) => <li key={highlight}><span>{getCMSCopy("copy.CoreValuesPage.5feceb66ffc8", "0")}{i + 1}</span>{highlight}</li>)}</ul></aside>
      {index < 2 && <a className="value-next-chapter" href={`#${CORNERSTONES[index + 1]}`}><span>{getCMSCopy("copy.CoreValuesPage.616fea83dd06", "Continue the journey")}</span><strong>{getCMSCopy("copy.CoreValuesPage.7ca10410b52c", "Discover ")}{CORNERSTONES[index + 1]}</strong><ArrowDown size={22} /></a>}
    </section>
  );
}

export const CoreValuesPage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => window.clearTimeout(timer);
  }, [hash]);
  return <PageShell cover={<ValueCover />} accentPillarId="heal" eyebrow={getCMSCopy("copy.CoreValuesPage.c83be5fde065", "Core Values · Heal · Enrich · Empower")} title={getCMSCopy("copy.CoreValuesPage.97ff86ab30e2", "The three cornerstones")} standfirst={getCMSCopy("copy.CoreValuesPage.1d90a9e6fdbc", "Compassion in action. Discover the programmes, people and reported progress behind Heal, Enrich and Empower.")} rail={<SubsectionNav label={getCMSCopy("copy.CoreValuesPage.64263b3319f0", "Explore our impact")} links={CORNERSTONES.map(id => ({ id, label: PILLARS.find(p => p.id === id)!.label, ink: PILLARS.find(p => p.id === id)!.accentB }))} />}>
    <div className="values-dashboard">{CORNERSTONES.map((id, index) => <ValueChapter key={id} id={id} index={index} linkedActivity={hash.slice(1)} />)}<p className="value-footnote">{getCMSCopy("copy.CoreValuesPage.9fd0ca7a7af7", "Figures reflect each programme’s stated reporting period. Different measures and periods are presented separately; they are not combined into a total.")}</p></div>
  </PageShell>;
};
