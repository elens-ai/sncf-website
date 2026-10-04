import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, BookOpen, Heart, Search, Sprout, type LucideIcon } from 'lucide-react';
import { ValueCompass } from '../components/ValueCompass';
import { ValueAnalytics } from '../components/ValueAnalytics';
import { EnrichScrapbook } from '../components/EnrichScrapbook';
import { EmblemBloom } from '../components/EmblemBloom';
import { ExploreTabs, type ExploreTab } from '../components/ExploreTabs';
import { ProgrammeDossier } from '../components/ProgrammeDossier';
import { ACTIVITY_SYMBOLS } from '../components/activitySymbols';
import { ReportActions } from '../components/ReportActions';
import { PillarGallery } from '../components/PillarGallery';
import { SdgTags, UnSeal } from '../components/UnAffiliation';
import { Saying } from '../components/Saying';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { SDGS, goalsOf } from '../data/sdgs';
import './core-values.css';

const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
type Cornerstone = typeof CORNERSTONES[number];


/** A cornerstone's emblem, alive with the foundation's photographs, at the
    heart of its masthead: Enrich's book as a scrapbook whose pages turn,
    Heal's leaves and Empower's figure in bloom, as the Projects emblem is. */
const ValueEmblem: React.FC<{ id: Cornerstone; name: string; motto: string; activities: typeof ACTIVITIES }> = ({ id, name, motto, activities }) => {
  const caption = getCMSCopy('copy.CoreValuesPage.foundationPhotos', 'From the foundation’s work, 2026');
  return id === 'enrich'
    ? <EnrichScrapbook activities={activities} name={name} motto={motto} caption={caption} />
    : <EmblemBloom emblem={id} activities={activities} caption={caption} label={galleryLabel(id)} />;
};

/* The three ways, one to each cornerstone, in the compass's order and icons. */
const WAYS: { id: Cornerstone; icon: LucideIcon; text: () => string }[] = [
  { id: 'heal', icon: Heart, text: () => getCMSCopy("copy.CoreValuesPage.way-heal", "Care that reaches further.") },
  { id: 'enrich', icon: BookOpen, text: () => getCMSCopy("copy.CoreValuesPage.way-enrich", "Learning that opens doors.") },
  { id: 'empower', icon: Sprout, text: () => getCMSCopy("copy.CoreValuesPage.way-empower", "Communities that grow stronger.") },
];

/** At the foot of the cover, beside the UN standing: the UN goals the three
    cornerstones advance, a dot in each goal's own colour. */
const CoverGoals: React.FC = () => {
  const goals = goalsOf(ACTIVITIES.filter(a => (CORNERSTONES as readonly string[]).includes(a.pillarId)).map(a => a.id));
  return (
    <span className="values-cover-goals">
      <span className="values-cover-goal-dots" aria-hidden="true">
        {goals.map(goal => <i key={goal} title={`SDG ${goal}: ${SDGS[goal].name}`} style={{ background: SDGS[goal].color }} />)}
      </span>
      <span className="values-cover-goals-words">{getCMSCopy("copy.CoreValuesPage.cover-goals", "Advancing")} <strong>{goals.length}</strong> {getCMSCopy("copy.CoreValuesPage.cover-goals-of", "UN Global Goals")}</span>
    </span>
  );
};

/** At the foot of the cover: each cornerstone's first programme's headline
    figure, rolling up into place as the cover comes into view, each opening
    that cornerstone's Stats. */
const CoverImpact: React.FC = () => (
  <nav className="values-cover-impact" aria-label={getCMSCopy("copy.CoreValuesPage.4109634bf723", "Compassion, made visible.")}>
    {CORNERSTONES.map(id => {
      const pillar = PILLARS.find(p => p.id === id)!;
      const lead = ACTIVITIES.find(a => a.pillarId === id)!;
      return (
        <a key={id} href={`#${id}-stats`} style={{ '--way-ink': pillar.accentA } as React.CSSProperties}>
          {/* the rolling figure is for the eye; the figure itself is what is read */}
          <span className="values-cover-impact-figure"><span className="sr-only">{lead.headline.value}</span><span aria-hidden="true"><OdometerStatCounter value={lead.headline.value} duration={1400} /></span></span>
          <span className="values-cover-impact-unit">{lead.headline.label}<em>{pillar.label}</em></span>
        </a>
      );
    })}
  </nav>
);

/** The cover: the three ways, set as a legend for the compass beside them.
    Pointing at a way (or moving to it by keyboard) turns the compass to its
    cornerstone and holds it there; choosing it goes to that chapter. Beneath
    the compass, the saying of the cornerstone it points to; at the foot, the
    foundation's UN standing and goals, and a headline figure for each. */
const ValueCover: React.FC = () => {
  useCMSRevision();
  const [choice, setChoice] = useState<Cornerstone>('heal');
  const [pointing, setPointing] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const pillar = PILLARS.find(p => p.id === choice)!;
  return <section ref={root} className="values-cover" data-active={active} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties} aria-labelledby="values-cover-title">
    <div className="values-cover-copy">
      <p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.bb5f4b8db550", "One purpose. Three ways to make a difference.")}</p>
      <h1 id="values-cover-title">{getCMSCopy("copy.CoreValuesPage.1872c282a338", "The three")}<br /><em>{getCMSCopy("copy.CoreValuesPage.19b476bc912f", "cornerstones.")}</em></h1>
      <ul className="values-cover-ways"
        onPointerEnter={() => setPointing(true)} onPointerLeave={() => setPointing(false)}
        onFocus={() => setFocused(true)}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
        {WAYS.map(({ id, icon: Icon, text }) => {
          const way = PILLARS.find(p => p.id === id)!;
          return <li key={id}>
            <a href={`#${id}`} data-active={choice === id}
              style={{ '--way-ink': way.accentA, '--way-light': way.accentB } as React.CSSProperties}
              onPointerEnter={() => setChoice(id)} onFocus={() => setChoice(id)}>
              <span className="values-cover-way-icon" aria-hidden="true"><Icon size={17} strokeWidth={1.7} /></span>
              <span className="values-cover-way-name">{way.label}</span>
              <span className="values-cover-way-text">{text()}</span>
              <ArrowDown className="values-cover-way-arrow" size={16} aria-hidden="true" />
            </a>
          </li>;
        })}
      </ul>
      <div className="values-cover-actions">
        <a className="values-cover-cta" href="#heal">{getCMSCopy("copy.CoreValuesPage.cover-explore", "Explore the cornerstones")}<ArrowDown size={16} aria-hidden="true" /></a>
        <a className="values-cover-link" href="#heal-reports">{getCMSCopy("copy.CoreValuesPage.cover-programmes", "Find a programme")}<ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
    </div>
    {/* the compass, and beneath it the saying of the cornerstone it points to */}
    <div className="values-cover-stage">
      <ValueCompass choice={choice} onChange={setChoice} active={active} held={pointing || focused} />
      <Saying key={choice} id={choice} className="values-cover-saying" />
    </div>
    <div className="values-cover-footer">
      <span className="values-cover-standing"><UnSeal /><CoverGoals /></span>
      <CoverImpact />
    </div>
  </section>;
};

/* What Heal's and Empower's emblems in bloom show, for screen readers (the scrapbook names itself). */
const galleryLabel = (id: 'heal' | 'empower') => ({
  heal: getCMSCopy("copy.CoreValuesPage.hero-heal", "Heal: photographs of the foundation’s healthcare, opening across the leaves of its emblem"),
  empower: getCMSCopy("copy.CoreValuesPage.hero-empower", "Empower: photographs of the foundation’s community work, opening across the rising figure of its emblem"),
}[id]);

/** A cornerstone: its masthead (its name, its emblem alive with photographs
    and its five programmes' figures round it, the same for all three), the
    UN goals it advances, then its Reports, Gallery and Stats as tabs, and the
    purpose behind it. A programme named anywhere in it (a figure, a chart)
    opens in its report. */
const ValueChapter: React.FC<{ id: Cornerstone; index: number; linkedActivity: string }> = ({ id, index, linkedActivity }) => {
  const pillar = PILLARS.find(p => p.id === id)!;
  const activities = ACTIVITIES.filter(a => a.pillarId === id);
  const name = pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase();
  const [selectedId, setSelectedId] = useState(activities[0].id);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ExploreTab>('reports');
  const matching = activities.filter(a => `${a.title} ${a.blurb}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = activities.find(a => a.id === selectedId) ?? activities[0];
  const openProgramme = (activityId: string) => { setQuery(''); setSelectedId(activityId); setTab('reports'); };
  useEffect(() => {
    if (ACTIVITIES.some(a => a.id === linkedActivity && a.pillarId === id)) { setSelectedId(linkedActivity); setTab('reports'); }
  }, [linkedActivity, id]);
  const photographs = activities.reduce((sum, activity) => sum + (activity.images?.length ?? 0), 0);
  return (
    <section id={id} className="value-chapter" aria-labelledby={`${id}-title`} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties}>
      <header className="value-hero">
        <h2 id={`${id}-title`} className="value-hero-title">{name}</h2>
        <ValueEmblem id={id} name={name} motto={pillar.headline} activities={activities} />
        {activities.slice(0, 5).map((activity, i) => (
          <a key={activity.id} href={`#${id}-reports`} className={`value-hero-stat value-hero-stat-${i + 1}`} onClick={() => openProgramme(activity.id)}>
            <span className="value-hero-stat-label">{activity.title}<ArrowUpRight size={16} aria-hidden="true" /></span>
            <strong>{activity.headline.value}</strong>
            <span className="value-hero-stat-unit">{activity.headline.label}</span>
            <small>{activity.period}</small>
          </a>
        ))}
      </header>
      {/* Heal's own line on its work, as written for it */}
      {id === 'heal' && <p className="value-standfirst">{getCMSCopy("copy.HealStory.introLead", "For decades, the Mission has been committed to preventive and curative healthcare, serving communities through diverse dimensions of healing.")}</p>}
      <Saying id={id} />
      <SdgTags goals={goalsOf(activities.map(activity => activity.id))} className="value-sdgs" />

      <ExploreTabs id={id} name={name} tab={tab} onTab={setTab}
        notes={{
          reports: `${activities.length} ${getCMSCopy("copy.CoreValuesPage.tab-programmes", "programmes, every reported figure")}`,
          gallery: `${photographs} ${getCMSCopy("copy.CoreValuesPage.tab-photographs", "photographs from the field")}`,
          stats: getCMSCopy("copy.CoreValuesPage.tab-stats", "The figures, charted"),
        }}
        panels={{
          reports: () => (
            <div className="value-explorer">
              <ReportActions id={id} title={name} ink={pillar.accentA} programmes={activities} />
              <div className="value-explorer-heading"><div><p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.e7b186e662f2", "Behind the numbers")}</p><h3>{getCMSCopy("copy.CoreValuesPage.6ae8bf36f85f", "Small actions. Lasting change.")}</h3></div><p>{getCMSCopy("copy.CoreValuesPage.92fcbaad24fc", "Choose a programme to explore its reach.")}</p></div>
              <div className="value-explorer-grid">
                <div className="value-programmes" role="group" aria-label={`${pillar.label} programmes`}>
                  <label className="value-programme-search"><Search size={16} /><input aria-label={`Find a ${id} programme`} placeholder={getCMSCopy("copy.CoreValuesPage.a3885e77e515", "Find a programme…")} value={query} onChange={e => setQuery(e.target.value)} /></label>
                  {matching.length === 0 && <p className="value-no-results">{getCMSCopy("copy.CoreValuesPage.b458f304b1f0", "No programmes match. Try another word.")}</p>}
                  {matching.map((activity) => {
                    /* each programme by its own photograph (or its symbol) and its headline figure */
                    const thumb = activity.images?.[0]?.src ?? activity.cardPhoto?.src;
                    const Symbol = activity.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined;
                    return (
                      <button key={activity.id} id={activity.id} aria-pressed={activity.id === selected.id} aria-controls={`${id}-detail`} onClick={() => setSelectedId(activity.id)}>
                        <span className="value-programme-thumb" aria-hidden="true">{thumb ? <img src={resolveCMSMedia(thumb)} alt="" loading="lazy" decoding="async" /> : Symbol && <Symbol size={20} strokeWidth={1.6} />}</span>
                        <span className="value-programme-words"><span className="value-programme-name">{activity.title}</span><small>{activity.headline.value} {activity.headline.label}</small></span>
                        <ArrowUpRight size={18} />
                      </button>
                    );
                  })}
                </div>
                <ProgrammeDossier id={`${id}-detail`} activity={selected} onNext={() => { setQuery(''); setSelectedId(activities[(activities.indexOf(selected) + 1) % activities.length].id); }} />
              </div>
            </div>
          ),
          gallery: () => (
            <PillarGallery activities={activities} title={`${name} · ${getCMSCopy("copy.CoreValuesPage.gallery-band", "every photograph")}`} />
          ),
          stats: () => <ValueAnalytics pillarId={id} activities={activities} explorerId={`${id}-reports`} onSelect={openProgramme} />,
        }} />
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
