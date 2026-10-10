import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { ACTIVITIES, type Activity } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { PROGRAMME_SDGS } from '../data/sdgs';
import { insightsFor } from '../data/insights';
import { programmeAbout } from '../data/programmeAbout';
import { programmePhotos } from '../data/programmePhotos';
import { NVC_PHOTOS, programmeGoals, withGroups } from '../data/programmeGroups';
import { SdgRow } from './SdgRow';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { OdometerStatCounter } from './OdometerStatCounter';
import { iconFor } from './figureIcons';
import { Saying } from './Saying';
import { nvcProgrammes } from '../data/nvcProgrammes';
import { NvcProgrammeSection, NVC_ICONS } from './NvcProgrammeSection';
import './programme-report.css';
import { useDevPhotos } from '../utils/devPhotos';
import { ProgrammeCarousel } from './ProgrammeCarousel';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeReport.${key}`, fallback);

/* a figure that rolls into place for the eye; the figure itself is what is read */
const Rolling: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1200 }) => (
  <><span className="sr-only">{value}</span><span className="preport-roll" aria-hidden="true"><OdometerStatCounter value={value} duration={duration} /></span></>
);

type Photo = { src: string; alt: string };

/** A PROGRAMME'S REPORT on Core Values, laid out to show as much as it can at once: its photographs turning as a
    carousel (the one in view large, its neighbours small at either side), and beside them its name, a few lines on the work (programmeAbout), its headline
    figure, every figure it reports as a tile, what those figures say read together, and the UN goals it advances. */
export const ProgrammeReport: React.FC<{ id: string; activity: Activity; photos?: Photo[]; kicker?: string }> = ({ id, activity, photos: given, kicker }) => {
  useCMSRevision();
  const own = useDevPhotos(activity.id, given ?? programmePhotos(activity));
  const photos = own.length ? own : activity.cardPhoto ? [{ src: activity.cardPhoto.src, alt: activity.cardPhoto.alt ?? '' }] : [];
  const insights = insightsFor(activity);
  const Symbol = activity.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined;
  const about = programmeAbout(activity.id);

  return (
    <article className="preport" id={id}>
      <ProgrammeCarousel id={activity.id} label={activity.title} photos={photos} kicker={kicker ?? c('kicker', 'Programme in focus')}
        badge={<><CalendarDays size={13} aria-hidden="true" />{activity.period}</>} symbol={Symbol} />

      <div className="preport-body">
        <header className="preport-head">
          {Symbol && <span className="preport-symbol" aria-hidden="true"><Symbol size={20} strokeWidth={1.7} /></span>}
          <div><h4 key={activity.id}>{activity.title}</h4><p className="preport-blurb">{activity.blurb}</p></div>
        </header>
        {activity.id === 'blood-donation' && <Saying id="blood-donation" className="dossier-saying" />}
        {about && <p className="preport-about">{about}</p>}
        <div className="preport-headline" key={`headline-${activity.id}`}>
          <strong><Rolling value={activity.headline.value} duration={1500} /></strong>
          <span>{activity.headline.label}</span>
        </div>
        <dl className="preport-figures" key={`figures-${activity.id}`}>
          {activity.dataPoints.map((point, i) => {
            const Icon = iconFor(point.label);
            /* a figure written in words ("26 years, 26 tournaments") reads, and wraps, as words; a long amount is set smaller to fit its tile */
            const words = /[a-z]{3,}/i.test(point.value);
            return <div key={point.label} style={{ '--i': i } as React.CSSProperties}><dt><Icon size={13} strokeWidth={1.8} aria-hidden="true" />{point.label}</dt><dd data-words={words || undefined} data-long={!words && point.value.length >= 12 || undefined}>{words ? point.value : <Rolling value={point.value} />}</dd></div>;
          })}
        </dl>
        {insights.length > 0 && (
          <div className="preport-insights" key={`insights-${activity.id}`}>
            <p><Sparkles size={12} aria-hidden="true" />{c('insights', 'What the figures say, read together')}</p>
            <ul>{insights.map(insight => {
              const Icon = insight.icon;
              return <li key={insight.label}><Icon size={15} strokeWidth={1.8} aria-hidden="true" /><strong>{insight.value}</strong><span>{insight.label}</span></li>;
            })}</ul>
          </div>
        )}
        {/* the goals as the cover flies them, each opening its window: the goal, and the programmes of this value that serve it */}
        {(PROGRAMME_SDGS[activity.id] ?? []).length > 0 && <SdgRow goals={[...(PROGRAMME_SDGS[activity.id] ?? [])].sort((a, b) => a - b)} id={activity.id}
          name={PILLARS.find(p => p.id === activity.pillarId)?.label ?? ''} programmes={withGroups(ACTIVITIES.filter(a => a.pillarId === activity.pillarId)).map(a => ({ title: a.title, goals: programmeGoals(a.id, id => PROGRAMME_SDGS[id] ?? []) }))}
          label={getCMSCopy('copy.CoreValuesPage.programme-sdgs', 'UN goals it advances')} className="preport-goals" />}
      </div>
    </article>
  );
};

/** NVC is the parent: one introduction, four equally weighted programme sections. */
export const NvcReport: React.FC<{ id: string; programme: Activity; part: string; onPart: (id: string) => void }> = ({ id, programme, part, onPart }) => {
  useCMSRevision();
  const programmes = nvcProgrammes();
  const selectedIndex = Math.max(0, programmes.findIndex(p => p.id === part));
  const shown = programmes[selectedIndex];
  const centre = NVC_PHOTOS()[0];
  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % programmes.length
      : event.key === 'ArrowLeft' ? (index - 1 + programmes.length) % programmes.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? programmes.length - 1 : undefined;
    if (next === undefined) return;
    event.preventDefault();
    onPart(programmes[next].id);
    document.getElementById(programmes[next].id)?.focus();
  };
  return (
    <article className="nvc-report" id={id}>
      <header className="nvc-head" style={{ '--photo': `url("${resolveCMSMedia(centre.src)}")` } as React.CSSProperties}>
        <div className="nvc-head-words">
          <p className="nvc-kicker"><span>{c('nvc-kicker', 'One centre. Many ways to grow.')}</span></p>
          <h4>{programme.title}</h4>
          <p>{programmeAbout(programme.id) ?? programme.blurb}</p>
          <p>{c('nvc-purpose', 'From independent study and free coaching to vocational training and creative expression, these four programmes share a commitment to personal growth. Explore each part of the NVC family below, with its own purpose, learning opportunities and reported reach.')}</p>
        </div>
        <div className="nvc-family" aria-label={c('nvc-family', 'Programmes within NVC')}>
          {programmes.map((p, i) => {
            const Icon = NVC_ICONS[p.id];
            return <div key={p.id}><Icon size={30} strokeWidth={1.5} aria-hidden="true" /><span><small>0{i + 1}</small>{p.title}</span></div>;
          })}
        </div>
      </header>
      <div className="nvc-tabs" role="tablist" aria-label={programme.title}>
        {programmes.map((p, i) => {
          const Icon = NVC_ICONS[p.id];
          return <button key={p.id} type="button" role="tab" id={p.id} tabIndex={p.id === shown.id ? 0 : -1} aria-selected={p.id === shown.id} aria-controls={`${id}-${p.id}`} onClick={() => onPart(p.id)} onKeyDown={event => onTabKey(event, i)}><Icon size={17} aria-hidden="true" /><span>{p.title}</span></button>;
        })}
      </div>
      <div className="nvc-panels">
        {programmes.map((p, i) => <div role="tabpanel" id={`${id}-${p.id}`} aria-labelledby={p.id} tabIndex={p.id === shown.id ? 0 : -1}
          aria-hidden={p.id !== shown.id} inert={p.id !== shown.id} data-active={p.id === shown.id} className="nvc-panel" key={p.id}>
          <NvcProgrammeSection programme={p} index={i} active={p.id === shown.id} />
        </div>)}
      </div>
    </article>
  );
};
