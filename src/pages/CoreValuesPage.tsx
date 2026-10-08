import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { ValueCompass } from '../components/ValueCompass';
import { SdgRow } from '../components/SdgRow';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { subjectFor } from '../utils/waves';
import { ValueAnalytics } from '../components/ValueAnalytics';
import { EnrichScrapbook } from '../components/EnrichScrapbook';
import { MosaicChapter } from '../components/MosaicChapter';
import { ExploreTabs, type ExploreTab } from '../components/ExploreTabs';
import { ProgrammeReport, NvcReport } from '../components/ProgrammeReport';
import { ACTIVITY_SYMBOLS } from '../components/activitySymbols';
import { Saying } from '../components/Saying';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PageShell } from '../components/PageShell';
import { ServiceIllustration } from '../components/ServiceIllustration';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { PROGRAMME_SDGS, goalsOf } from '../data/sdgs';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES, type Activity } from '../data/activities';
import { groupById, groupOf, programmeGoals, withGroups } from '../data/programmeGroups';
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
    ? <EnrichScrapbook activities={activities} name={name} motto={pillar.headline} />
    : undefined;
  return (
    <div ref={root} className="impact-mosaic value-screen" data-mode="stacked">
      <MosaicChapter pillar={pillar} index={index} activities={activities} live={live} stacked
        openId={null} attendedId={attended?.id ?? null} onOpen={activity => onProgramme(activity.id)} onAttend={setAttended}
        emblem={emblem} inPage heading="h2" />
    </div>
  );
};

/** The cover, on the ground of the cornerstone the compass points to, as the
    home page's hall paints it (its colours in a deep wash, its waves, its
    drawings), which follows the compass round. The headline's three words
    are the cornerstones' in the compass's order — Love, Heal; Peace, Enrich;
    Kindness, Empower — the one in view risen a little larger; pointing at a word
    turns the compass to it and holds it there. Beneath the compass, the
    saying of the cornerstone it points to; at the foot, its introduction. */
const ValueCover: React.FC<{ choice: Cornerstone; onChange: (id: Cornerstone) => void }> = ({ choice, onChange: setChoice }) => {
  useCMSRevision();
  const [reading, setReading] = useState(false);
  useEffect(() => {
    const sync = () => setReading(window.scrollY > 24);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, []);
  const [pointing, setPointing] = useState(false);
  /* a goal's window open over the flags: the compass holds still until it closes */
  const [peeking, setPeeking] = useState(false);
  const root = useRef<HTMLElement>(null);
  const active = useSectionActivity(root);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const pillar = PILLARS.find(p => p.id === choice)!;
  /* the UN goals the value in view advances, as its chapter lists them, in the UN's own order */
  const goals = useMemo(() => goalsOf(ACTIVITIES.filter(a => a.pillarId === choice).map(a => a.id)).sort((a, b) => a - b), [choice]);
  /* and its programmes, each with the goals it serves, for the goals' windows */
  const programmes = useMemo(() => withGroups(ACTIVITIES.filter(a => a.pillarId === choice)).map(a => ({ title: a.title, goals: programmeGoals(a.id, id => PROGRAMME_SDGS[id] ?? []) })), [choice]);
  /* a headline written otherwise than as three comma-separated words is set as written */
  const headline = getCMSCopy("copy.CoreValuesPage.cover-headline", "Love, peace, kindness");
  const words = headline.split(',').map(word => word.trim());
  return <section ref={root} className="values-cover" data-cornerstone={choice} data-active={active} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties} aria-labelledby="values-cover-title">
    <div className="values-cover-ground" aria-hidden="true">
      <MosaicWaves subject={subjectFor(pillar)} active={active && !calm} input={waveInput} scale={1.25} fps={60} steady />
    </div>
    <div className="values-cover-copy">
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
      <Saying key={choice} id={choice} className="values-cover-saying" breakBefore="not just" closeInline />
      {/* the UN goals the value in view advances: their line, and their flags beneath it, changing with it */}
      <SdgRow goals={goals} id={choice} name={pillar.label} programmes={programmes} className="values-cover-goals" onOpenChange={setPeeking} />
    </div>
    {/* The compass follows the cornerstone described in the left column. */}
    <div className="values-cover-stage">
      <ValueCompass choice={choice} onChange={setChoice} active={active} held={pointing || reading || peeking} />
    </div>
    {choice === 'heal' && <p className="values-cover-introduction">{getCMSCopy('copy.CoreValuesPage.heal-cover-introduction', 'At SNCF, healing is a profound act of compassion. Beyond medicine, it upholds dignity, nurtures well-being and unites hearts, transforming care and compassion into a meaningful service to humanity.')}</p>}
    {choice === 'enrich' && <p className="values-cover-introduction">{getCMSCopy('copy.CoreValuesPage.enrich-cover-introduction', 'Expanding access to education across schools, colleges, and training centers. Nurturing creativity and self reliance through libraries and arts initiatives.')}</p>}
    {choice === 'empower' && <p className="values-cover-introduction">{getCMSCopy('copy.CoreValuesPage.empower-cover-introduction', 'Driving sustainable social and economic development. Creating skills and career opportunities while working for a clean and green environment.')}</p>}
  </section>;
};

/** A cornerstone: its opening screen (CornerstoneScreen), then, on a sheet
    of the page's paper over the same ground, its story: the UN goals it
    advances and its Reports, Gallery and Stats as tabs.
    A programme named anywhere in it (a figure, a chart) opens in its
    report. */
const ValueChapter: React.FC<{ id: Cornerstone; index: number; linkedActivity: string }> = ({ id, index, linkedActivity }) => {
  const pillar = PILLARS.find(p => p.id === id)!;
  const activities = ACTIVITIES.filter(a => a.pillarId === id);
  /* as the chapter lists them: a group (the Nirankari Vocational Centre) in place of its parts */
  const listed = withGroups(activities);
  const name = pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase();
  const [selectedId, setSelectedId] = useState(listed[0].id);
  const [part, setPart] = useState('');
  const [tab, setTab] = useState<ExploreTab>('reports');
  const selected = listed.find(a => a.id === selectedId) ?? listed[0];
  const group = groupById(selected.id);
  const parts = group ? activities.filter(a => group.parts.includes(a.id)) : [];
  /* a programme named by its own id opens in the report; a group's part opens in its group, on its own tab */
  const openProgramme = (activityId: string) => {
    const owner = groupOf(activityId);
    setSelectedId(owner ? owner.id : activityId);
    if (owner) setPart(activityId);
    setTab('reports');
  };
  useEffect(() => {
    if (!ACTIVITIES.some(a => a.id === linkedActivity && a.pillarId === id)) return;
    const owner = groupOf(linkedActivity);
    setSelectedId(owner ? owner.id : linkedActivity);
    if (owner) setPart(linkedActivity);
    setTab('reports');
  }, [linkedActivity, id]);
  const showProgramme = (activityId: string) => {
    openProgramme(activityId);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}-reports`);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => document.getElementById(`${id}-reports`)?.closest('.explore')?.scrollIntoView({ block: 'start', behavior: calm ? 'instant' : 'smooth' }));
  };
  return (
    <section id={id} className="value-chapter" data-cornerstone={id} aria-labelledby={`mosaic-${id}-title`} style={{ '--value-color': pillar.accentA, '--value-light': pillar.accentB } as React.CSSProperties}>
      <CornerstoneScreen id={id} index={index} name={name} activities={listed} onProgramme={showProgramme} />
      <ServiceIllustration pillar={id} />
      <div id={`${id}-story`} className="value-chapter-body">
        <Saying id={id} />


        <ExploreTabs id={id} name={name} tab={tab} onTab={setTab} look="segmented" tabs={['reports', 'stats']}
          panels={{
            reports: () => (
              <div className="value-explorer">
                <div className="value-explorer-heading"><div><p className="value-kicker">{getCMSCopy("copy.CoreValuesPage.e7b186e662f2", "Behind the numbers")}</p><h3>{getCMSCopy("copy.CoreValuesPage.6ae8bf36f85f", "Small actions. Lasting change.")}</h3></div><p>{getCMSCopy("copy.CoreValuesPage.92fcbaad24fc", "Choose a programme to explore its reach.")}</p></div>
                {/* the programmes as a row of chips, each by its photograph (or symbol) and its name */}
                <div className="programme-picker" role="group" aria-label={`${pillar.label} programmes`}>
                  {listed.map(activity => {
                    const thumb = activity.images?.[0]?.src ?? activity.cardPhoto?.src;
                    const Symbol = activity.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined;
                    return (
                      <button key={activity.id} id={activity.id} type="button" className="programme-chip" aria-pressed={activity.id === selected.id} aria-controls={`${id}-detail`} onClick={() => setSelectedId(activity.id)}>
                        <span className="programme-chip-thumb" aria-hidden="true">{thumb ? <img src={resolveCMSMedia(thumb)} alt="" loading="lazy" decoding="async" /> : Symbol && <Symbol size={20} strokeWidth={1.6} />}</span>
                        <span className="programme-chip-words"><span className="programme-chip-name">{activity.menuLabel ?? activity.title}</span></span>
                      </button>
                    );
                  })}
                </div>
                {group
                  ? <NvcReport id={`${id}-detail`} programme={selected} parts={parts} part={parts.some(p => p.id === part) ? part : parts[0].id} onPart={setPart} />
                  : <ProgrammeReport id={`${id}-detail`} activity={selected} />}
              </div>
            ),
            stats: () => <ValueAnalytics pillarId={id} activities={activities} explorerId={`${id}-reports`} onSelect={openProgramme} />,
          }} />
      </div>
    </section>
  );
}

const cornerstoneForHash = (hash: string): Cornerstone | undefined => {
  const target = hash.replace(/^#/, '');
  return CORNERSTONES.find(id => target === id || target.startsWith(`${id}-`))
    ?? CORNERSTONES.find(id => ACTIVITIES.some(activity => activity.id === target && activity.pillarId === id));
};

export const CoreValuesPage: React.FC = () => {
  const { hash } = useLocation();
  const [choice, setChoice] = useState<Cornerstone>(() => cornerstoneForHash(window.location.hash) ?? 'heal');
  const [linkedActivity, setLinkedActivity] = useState(window.location.hash.slice(1));
  useEffect(() => {
    let timer = 0;
    const follow = () => {
      const target = window.location.hash;
      const vertical = cornerstoneForHash(target);
      if (!vertical) return;
      setLinkedActivity(target.slice(1));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const element = document.getElementById(target.slice(1));
        // The tab bar is sticky; its container keeps the true panel position.
        const destination = element?.getAttribute('role') === 'tab' ? element.closest('.explore') : element;
        destination?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, 100);
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => { window.clearTimeout(timer); window.removeEventListener('hashchange', follow); };
  }, [hash]);
  const first = CORNERSTONES.indexOf(choice);
  const journey = [...CORNERSTONES.slice(first), ...CORNERSTONES.slice(0, first)];
  return <PageShell cover={<ValueCover choice={choice} onChange={setChoice} />} accentPillarId={choice} eyebrow={getCMSCopy("copy.CoreValuesPage.c83be5fde065", "Core Values · Heal · Enrich · Empower")} title={getCMSCopy("copy.CoreValuesPage.97ff86ab30e2", "The three cornerstones")} standfirst={getCMSCopy("copy.CoreValuesPage.1d90a9e6fdbc", "Compassion in action. Discover the programmes, people and reported progress behind Heal, Enrich and Empower.")}>
    <div className="values-dashboard">{journey.map((id, index) => <ValueChapter key={id} id={id} index={index} linkedActivity={linkedActivity} />)}</div>
  </PageShell>;
};
