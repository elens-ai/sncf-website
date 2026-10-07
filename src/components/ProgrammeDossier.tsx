import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Sparkles } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { Activity } from '../data/activities';
import { PROGRAMME_SDGS } from '../data/sdgs';
import { SdgTags } from './UnAffiliation';
import { insightsFor } from '../data/insights';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { OdometerStatCounter } from './OdometerStatCounter';
import { iconFor } from './figureIcons';
import './programme-dossier.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProgrammeDossier.${key}`, fallback);

/* a figure that rolls into place for the eye; the figure itself is what is read */
const Rolling: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1200 }) => (
  <><span className="sr-only">{value}</span><span className="dossier-roll" aria-hidden="true"><OdometerStatCounter value={value} duration={duration} /></span></>
);

/** A PROGRAMME IN FOCUS, as a dossier: its own photographs large (a strip to
    turn through them), its name on them; beside them what it is, its
    headline figure rolling in, what its figures say read against each other
    (each insight worked out from the reported figures, and saying so), and
    every figure it reports, each with its symbol. Choosing another
    programme rolls the figures in again. */
export const ProgrammeDossier: React.FC<{ id: string; activity: Activity; kicker?: string; onNext?: () => void }> = ({ id, activity, kicker, onNext }) => {
  const photos = activity.images ?? [];
  const [shot, setShot] = useState(0);
  useEffect(() => setShot(0), [activity.id]);
  const photo = photos[shot] ?? (activity.cardPhoto ? { src: activity.cardPhoto.src, alt: activity.cardPhoto.alt ?? '' } : null);
  const insights = insightsFor(activity);
  const Symbol = activity.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined;

  return (
    <article className="value-detail value-dossier" id={id} aria-live="polite" aria-atomic="true">
      <div className="dossier-media" data-empty={!photo}>
        {photo
          ? <img key={photo.src} className="dossier-photo" src={resolveCMSMedia(photo.src)} alt={photo.alt} decoding="async" />
          : <span className="dossier-symbol" aria-hidden="true">{Symbol && <Symbol size={72} strokeWidth={1.1} />}</span>}
        <span className="dossier-shade" aria-hidden="true" />
        <div className="dossier-media-top">
          <span>{kicker ?? getCMSCopy("copy.CoreValuesPage.ad3a80a2651a", "Programme in focus")}</span>
          <span><CalendarDays size={13} aria-hidden="true" />{activity.period}</span>
        </div>
        <div className="dossier-media-foot">
          <h4 key={activity.id}>{activity.title}</h4>
          {photo?.alt && <p className="dossier-caption">{photo.alt}</p>}
          {photos.length > 1 && (
            <div className="dossier-strip" role="group" aria-label={c('photos', 'Photographs of the programme')}>
              {photos.map((p, i) => (
                <button key={p.src} type="button" aria-pressed={i === shot} aria-label={`${c('photo', 'Photograph')} ${i + 1} ${c('of', 'of')} ${photos.length}`} onClick={() => setShot(i)}>
                  <img src={resolveCMSMedia(p.src)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dossier-data">
        <p className="dossier-blurb">{activity.blurb}</p>
        <div className="dossier-headline" key={`headline-${activity.id}`}>
          <strong><Rolling value={activity.headline.value} duration={1500} /></strong>
          <span>{activity.headline.label}</span>
        </div>
        {insights.length > 0 && (
          <div className="dossier-insights" key={`insights-${activity.id}`}>
            <p className="dossier-insights-note"><Sparkles size={12} aria-hidden="true" />{c('insights', 'What the figures say, read together')}</p>
            <ul>
              {insights.map(insight => {
                const Icon = insight.icon;
                return <li key={insight.label}><span className="dossier-insight-icon" aria-hidden="true"><Icon size={16} strokeWidth={1.8} /></span><strong>{insight.value}</strong><span>{insight.label}</span></li>;
              })}
            </ul>
          </div>
        )}
        <dl className="dossier-figures" key={`figures-${activity.id}`}>
          {activity.dataPoints.map((point, i) => {
            const Icon = iconFor(point.label);
            return <div key={point.label} style={{ '--i': i } as React.CSSProperties}><dt><Icon size={14} strokeWidth={1.8} aria-hidden="true" />{point.label}</dt><dd><Rolling value={point.value} /></dd></div>;
          })}
        </dl>

        <SdgTags goals={PROGRAMME_SDGS[activity.id] ?? []} label={getCMSCopy("copy.CoreValuesPage.programme-sdgs", "UN goals it advances")} className="value-detail-sdgs" />
        <p className="value-source">{getCMSCopy("copy.CoreValuesPage.91c1f9479c9a", "Source: foundation activity report · Figures shown as reported.")}{insights.length > 0 && ` ${c('insights-source', 'The insights are worked out from those figures; nothing is estimated.')}`}</p>
        {onNext && <button className="value-next-programme" onClick={onNext}>{getCMSCopy("copy.CoreValuesPage.cd9fb71ad9c3", "Discover the next programme ")}<ArrowUpRight size={16} /></button>}
      </div>
    </article>
  );
};
