import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { ACTIVITIES, type Activity } from '../data/activities';
import { PILLARS } from '../data/pillars';
import { PROGRAMME_SDGS } from '../data/sdgs';
import { insightsFor } from '../data/insights';
import { programmeAbout } from '../data/programmeAbout';
import { programmePhotos } from '../data/programmePhotos';
import { NVC_PHOTOS, SEWING_PHOTOS, partLabel, programmeGoals, withGroups } from '../data/programmeGroups';
import { SdgRow } from './SdgRow';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { OdometerStatCounter } from './OdometerStatCounter';
import { iconFor } from './figureIcons';
import { Saying } from './Saying';
import { NimaStory } from './NimaStory';
import './programme-report.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeReport.${key}`, fallback);

/* a figure that rolls into place for the eye; the figure itself is what is read */
const Rolling: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1200 }) => (
  <><span className="sr-only">{value}</span><span className="preport-roll" aria-hidden="true"><OdometerStatCounter value={value} duration={duration} /></span></>
);

type Photo = { src: string; alt: string };
const TURN_EVERY_MS = 4200;

/** A PROGRAMME'S REPORT on Core Values, laid out to show as much as it can at once: its photographs turning as a
    carousel (the one in view large, its neighbours small at either side), and beside them its name, a few lines on the work (programmeAbout), its headline
    figure, every figure it reports as a tile, what those figures say read together, and the UN goals it advances. */
export const ProgrammeReport: React.FC<{ id: string; activity: Activity; photos?: Photo[] }> = ({ id, activity, photos: given }) => {
  useCMSRevision();
  const own = given ?? programmePhotos(activity);
  const photos = own.length ? own : activity.cardPhoto ? [{ src: activity.cardPhoto.src, alt: activity.cardPhoto.alt ?? '' }] : [];
  const [shot, setShot] = useState(0);
  useEffect(() => setShot(0), [activity.id]);
  const insights = insightsFor(activity);
  const Symbol = activity.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined;
  const about = programmeAbout(activity.id);

  /* The photographs turn by themselves, a few seconds each, while the stage is on screen and nobody is pointing at
     it or working its controls; never where motion is unwelcome. */
  const stage = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: .4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!onScreen || held || photos.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setShot(s => (s + 1) % photos.length), TURN_EVERY_MS);
    return () => window.clearTimeout(timer);
  }, [onScreen, held, shot, photos.length]);
  const turn = (step: number) => setShot(s => (s + step + photos.length) % photos.length);
  /* each photograph's place: the one in view at the centre, its neighbours small at either side, the rest out of sight */
  const place = (i: number) => {
    let d = (i - shot) % photos.length;
    if (d > photos.length / 2) d -= photos.length;
    if (d < -photos.length / 2) d += photos.length;
    return d === 0 ? 'centre' : d === -1 ? 'left' : d === 1 ? 'right' : d < 0 ? 'gone-left' : 'gone-right';
  };

  return (
    <article className="preport" id={id}>
      <div className="preport-media" data-empty={!photos.length}>
        <div ref={stage} className="preport-stage" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)} onBlur={() => setHeld(false)} aria-roledescription="carousel" aria-label={c('photos', 'Photographs of the programme')}>
          {photos.length
            ? photos.map((p, i) => {
              const where = place(i);
              const side = where === 'left' || where === 'right';
              return <figure key={p.src} className="preport-card" data-place={where} aria-hidden={where !== 'centre'} onClick={side ? () => setShot(i) : undefined}>
                <img src={resolveCMSMedia(p.src)} alt={where === 'centre' ? p.alt : ''} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
              </figure>;
            })
            : <span className="preport-symbol-large" aria-hidden="true">{Symbol && <Symbol size={72} strokeWidth={1.1} />}</span>}
          <div className="preport-lead-top">
            <span>{c('kicker', 'Programme in focus')}</span>
            <span><CalendarDays size={13} aria-hidden="true" />{activity.period}</span>
          </div>
          {photos.length > 0 && <div className="preport-stage-foot">
            <p className="preport-caption" key={`${activity.id}-${shot}`}>{photos[shot]?.alt}</p>
            {photos.length > 1 && <div className="preport-stage-turns">
              <button type="button" onClick={() => turn(-1)} aria-label={c('previous', 'Previous photograph')}><ChevronLeft size={17} aria-hidden="true" /></button>
              <span aria-live="polite">{shot + 1} / {photos.length}</span>
              <button type="button" onClick={() => turn(1)} aria-label={c('next', 'Next photograph')}><ChevronRight size={17} aria-hidden="true" /></button>
            </div>}
          </div>}
        </div>
        {photos.length > 1 && (
          <ul className="preport-thumbs" aria-label={c('photos', 'Photographs of the programme')}>
            {photos.map((p, i) => <li key={p.src}>
              <button type="button" aria-pressed={i === shot} aria-label={`${c('photo', 'Photograph')} ${i + 1} ${c('of', 'of')} ${photos.length}: ${p.alt}`} onClick={() => setShot(i)}>
                <img src={resolveCMSMedia(p.src)} alt="" loading="lazy" decoding="async" />
              </button>
            </li>)}
          </ul>
        )}
      </div>

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
            return <div key={point.label} style={{ '--i': i } as React.CSSProperties}><dt><Icon size={13} strokeWidth={1.8} aria-hidden="true" />{point.label}</dt><dd><Rolling value={point.value} /></dd></div>;
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

/** THE NIRANKARI VOCATIONAL CENTRE'S REPORT: the centre itself (its photograph, its lines, its figures and each
    part's share of them), then a tab for each part: NIMA told in full (NimaStory), and the sewing and beautician
    centres as a programme's report with more of their photographs. */
export const NvcReport: React.FC<{ id: string; programme: Activity; parts: Activity[]; part: string; onPart: (id: string) => void }> = ({ id, programme, parts, part, onPart }) => {
  useCMSRevision();
  const shown = parts.find(p => p.id === part) ?? parts[0];
  const centre = NVC_PHOTOS()[0];
  const share = (p: Activity) => p.dataPoints.filter(point => /centres?$/i.test(point.label)).map(point => `${point.value} ${point.label.toLowerCase()}`).join(' · ');
  return (
    <article className="nvc-report" id={id}>
      <header className="nvc-head" style={{ '--photo': `url("${resolveCMSMedia(centre.src)}")` } as React.CSSProperties}>
        <div className="nvc-head-words">
          <p className="nvc-kicker"><span>{c('kicker', 'Programme in focus')}</span><span><CalendarDays size={13} aria-hidden="true" />{programme.period}</span></p>
          <h4>{programme.title}</h4>
          <p>{programmeAbout(programme.id) ?? programme.blurb}</p>
        </div>
        <dl className="nvc-head-figures">
          {programme.dataPoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd><Rolling value={point.value} /></dd></div>)}
          {parts.map(p => <div key={p.id} className="nvc-head-part"><dt>{partLabel(p.id, p.title)}</dt><dd>{p.headline.value} <small>{p.headline.label.toLowerCase()}</small></dd><dd className="nvc-head-share">{share(p)}</dd></div>)}
        </dl>
      </header>
      <div className="nvc-tabs" role="tablist" aria-label={programme.title}>
        {parts.map(p => <button key={p.id} type="button" role="tab" id={p.id} aria-selected={p.id === shown.id} aria-controls={`${id}-${p.id}`} onClick={() => onPart(p.id)}>{partLabel(p.id, p.title)}</button>)}
      </div>
      <div role="tabpanel" id={`${id}-${shown.id}`} aria-labelledby={shown.id} className="nvc-panel" key={shown.id}>
        {shown.id === 'skill-nima'
          ? <NimaStory photos={shown.images ?? []} />
          : <ProgrammeReport id={`${id}-${shown.id}-report`} activity={shown} photos={[...(shown.images ?? []), ...(shown.id === 'skill-trades' ? SEWING_PHOTOS() : [])]} />}
      </div>
    </article>
  );
};
