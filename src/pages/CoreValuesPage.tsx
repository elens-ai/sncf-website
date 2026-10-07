import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Search } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { ValueCompass } from '../components/ValueCompass';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { PillarArtwork } from '../components/PillarArtwork';
import { subjectFor } from '../utils/waves';
import { ValueAnalytics } from '../components/ValueAnalytics';
import { EnrichScrapbook } from '../components/EnrichScrapbook';
import { MosaicChapter } from '../components/MosaicChapter';
import { ExploreTabs, type ExploreTab } from '../components/ExploreTabs';
import { ProgrammeDossier } from '../components/ProgrammeDossier';
import { ACTIVITY_SYMBOLS } from '../components/activitySymbols';
import { ReportActions } from '../components/ReportActions';
import { PillarGallery } from '../components/PillarGallery';
import { SdgTags, UnepSeal } from '../components/UnAffiliation';
import { Saying } from '../components/Saying';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES, type Activity } from '../data/activities';
import { goalsOf } from '../data/sdgs';
/* the chapters' own stage (the counter, the waves, the arrivals), which the home page loads with its section */
import '../components/impact-mosaic.css';
import './core-values.css';

const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
type Cornerstone = typeof CORNERSTONES[number];

/** A cornerstone's opening screen: the home page's chapter for its path
    (MosaicChapter), on its own ground, numbered among the three. Its name,
    its line, Explore (down to its story) and its Reports, Gallery and Stats
    (its tabs, below); its emblem with its programmes' figures round it, each
    opening in its report. Heal's leaves and Empower's figure are the home
    page's photographic emblems; Enrich's book is the scrapbook whose pages
    turn. Its lines and figures rise in as it comes into view. */
const CornerstoneScreen: React.FC<{ id: Cornerstone; index: number; name: string; activities: Activity[]; onProgramme: (activityId: string) => void }> = ({ id, index, name, activities, onProgramme }) => {
  const root = useRef<HTMLDivElement>(null);
  const live = useSectionActivity(root);
  const [attended, setAttended] = useState<Activity | null>(null);
  const pillar = PILLARS.find(p => p.id === id)!;
  useEffect(() => {
    const blocks: HTMLElement[] = root.current ? Array.from(root.current.querySelectorAll<HTMLElement>('[data-reveal]')) : [];
    const stops = blocks.map(block => onArrival(block, () => { block.dataset.arrived = 'true'; }));
    return () => stops.forEach(stop => stop());
  }, []);
  const emblem = id === 'enrich'
    ? <EnrichScrapbook activities={activities} name={name} motto={pillar.headline} caption={getCMSCopy('copy.CoreValuesPage.foundationPhotos', 'From the foundation’s work, 2026')} />
    : undefined;
  const count = (n: number) => String(n).padStart(2, '0');
  return (
    <div ref={root} className="impact-mosaic value-screen" data-mode="stacked">
      <p className="mosaic-stage-label" data-show="true"><span aria-hidden="true" /><span className="mosaic-stage-count">{`${count(index + 1)} / ${count(CORNERSTONES.length)}`}</span></p>
      <MosaicChapter pillar={pillar} index={index} activities={activities} live={live} stacked
        openId={null} attendedId={attended?.id ?? null} onOpen={activity => onProgramme(activity.id)} onAttend={setAttended}
        emblem={emblem} inPage heading="h2" />
    </div>
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

/** The cover, on the ground of the cornerstone the compass points to, as the
    home page's hall paints it (its colours in a deep wash, its waves, its
    drawings), which follows the compass round. The headline's three words
    are the cornerstones' in the compass's order — Love, Heal; Peace, Enrich;
    Kindness, Empower — the one in view risen a little larger; pointing at a word
    turns the compass to it and holds it there. Beneath the compass, the
    saying of the cornerstone it points to; at the foot, the foundation's work
    with UNEP, and a headline figure for each. */
const ValueCover: React.FC = () => {
  useCMSRevision();
  const [choice, setChoice] = useState<Cornerstone>('heal');
  const [pointing, setPointing] = useState(false);
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const pillar = PILLARS.find(p => p.id === choice)!;
  /* a headline written otherwise than as three comma-separated words is set as written */
  const headline = getCMSCopy("copy.CoreValuesPage.cover-headline", "Love, peace, kindness");
  const words = headline.split(',').map(word => word.trim());
  /* The copy starts a third of the way down the compass's ring, wherever the compass's size and
     centring put it, so it keeps its place against the ring on every screen: measured
     from the boxes (the ring's place in its stage by layout, so no entrance or turn can move the
     reading), on resize, and once the fonts are in. */
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cover = root.current;
    if (!cover) return;
    const place = () => {
      const stage = cover.querySelector<HTMLElement>('.service-compass-stage');
      const ring = stage?.querySelector<HTMLElement>('.service-compass-face');
      if (!stage || !ring || !copy.current) return;
      const top = stage.getBoundingClientRect().top + ring.offsetTop + ring.offsetHeight * 0.32 - copy.current.getBoundingClientRect().top;
      cover.style.setProperty('--visual-top', `${Math.max(0, Math.round(top))}px`);
    };
    place();
    let live = true;
    document.fonts?.ready.then(() => { if (live) place(); });
    window.addEventListener('resize', place, { passive: true });
    return () => { live = false; window.removeEventListener('resize', place); };
  }, []);
  return <section ref={root} className="values-cover" data-active={active} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties} aria-labelledby="values-cover-title">
    <div className="values-cover-ground" aria-hidden="true">
      <MosaicWaves subject={subjectFor(pillar)} active={active && !calm} input={waveInput} scale={3} fps={24} />
      {CORNERSTONES.map(id => <PillarArtwork key={id} pillarId={id} visible={id === choice} />)}
    </div>
    <div ref={copy} className="values-cover-copy">
      <h1 id="values-cover-title" onPointerLeave={() => setPointing(false)}>
        {words.length === CORNERSTONES.length && words.every(Boolean) ? words.map((word, i) => {
          const id = CORNERSTONES[i];
          const last = i === words.length - 1;
          /* each word carries its comma, so a word that pops up does not grow over it */
          return <React.Fragment key={id}><span className="values-cover-word" data-on={choice === id}
            onPointerEnter={() => { setPointing(true); setChoice(id); }} onClick={() => setChoice(id)}>{word}{!last && ','}</span>{!last && ' '}</React.Fragment>;
        }) : headline}
        <br /><em>{getCMSCopy("copy.CoreValuesPage.cover-headline-script", "with a purpose of giving")}</em>
      </h1>
      <div className="values-cover-actions">
        <a className="values-cover-link" href="#heal">{getCMSCopy("copy.CoreValuesPage.cover-explore-link", "Explore")}<ArrowDown size={15} aria-hidden="true" /></a>
      </div>
    </div>
    {/* the compass, and beneath it the saying of the cornerstone it points to */}
    <div className="values-cover-stage">
      <ValueCompass choice={choice} onChange={setChoice} active={active} held={pointing} />
      <Saying key={choice} id={choice} className="values-cover-saying" />
    </div>
    <div className="values-cover-footer">
      <span className="values-cover-standing"><UnepSeal /></span>
      <CoverImpact />
    </div>
  </section>;
};

/** A cornerstone: its opening screen (CornerstoneScreen), then, on a sheet
    of the page's paper over the same ground, its story: the UN goals it
    advances, its Reports, Gallery and Stats as tabs, and the purpose behind
    it. A programme named anywhere in it (a figure, a chart) opens in its
    report. */
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
  /* a programme chosen on the opening screen opens in the report below, and the page goes down to it */
  const showProgramme = (activityId: string) => {
    openProgramme(activityId);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}-reports`);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => document.getElementById(`${id}-reports`)?.scrollIntoView({ block: 'start', behavior: calm ? 'instant' : 'smooth' }));
  };
  return (
    <section id={id} className="value-chapter" data-cornerstone={id} aria-labelledby={`mosaic-${id}-title`} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties}>
      <CornerstoneScreen id={id} index={index} name={name} activities={activities} onProgramme={showProgramme} />
      <div id={`${id}-story`} className="value-chapter-body">
        {/* Heal's own line on its work, as written for it */}
        {id === 'heal' && <p className="value-standfirst">{getCMSCopy("copy.HealStory.introLead", "For decades, the Mission has been committed to preventive and curative healthcare, serving communities through diverse dimensions of healing.")}</p>}
        <Saying id={id} sideMarks />
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
      </div>
    </section>
  );
}

export const CoreValuesPage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => window.clearTimeout(timer);
  }, [hash]);
  return <PageShell cover={<ValueCover />} accentPillarId="heal" eyebrow={getCMSCopy("copy.CoreValuesPage.c83be5fde065", "Core Values · Heal · Enrich · Empower")} title={getCMSCopy("copy.CoreValuesPage.97ff86ab30e2", "The three cornerstones")} standfirst={getCMSCopy("copy.CoreValuesPage.1d90a9e6fdbc", "Compassion in action. Discover the programmes, people and reported progress behind Heal, Enrich and Empower.")} rail={<SubsectionNav variant="tabs" tinted label={getCMSCopy("copy.CoreValuesPage.64263b3319f0", "Explore our impact")} links={CORNERSTONES.map(id => ({ id, label: PILLARS.find(p => p.id === id)!.label, ink: PILLARS.find(p => p.id === id)!.accentA }))} />}>
    <div className="values-dashboard">{CORNERSTONES.map((id, index) => <ValueChapter key={id} id={id} index={index} linkedActivity={hash.slice(1)} />)}</div>
  </PageShell>;
};
