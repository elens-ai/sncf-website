import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Images, MapPin } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { PastSNCFEvent } from '../data/events';
import { PILLARS } from '../data/pillars';
import './past-events-journal.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.PastEventsJournal.${key}`, fallback);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** A dated photographic record, kept separate from the recurring invitation calendar. */
export function PastEventsJournal({ events }: { events: PastSNCFEvent[] }) {
  const featureRef = useRef<HTMLElement>(null);
  const [year, setYear] = useState('all');
  const [pillar, setPillar] = useState('all');
  const [chosen, setChosen] = useState<string | null>(null);
  const [photoChoice, setPhotoChoice] = useState<{ event: string; index: number } | null>(null);
  const years = useMemo(() => [...new Set(events.map(event => event.occurredOn.slice(0, 4)))].sort().reverse(), [events]);
  const availablePillars = PILLARS.filter(value => events.some(event => event.pillarId === value.id));
  const filtered = events.filter(event => (year === 'all' || event.occurredOn.startsWith(year)) && (pillar === 'all' || event.pillarId === pillar));
  const selected = filtered.find(event => event.id === chosen) ?? filtered[0];
  const photos = selected?.photos ?? [];
  const index = selected && photoChoice?.event === selected.id ? Math.min(photoChoice.index, photos.length - 1) : 0;
  const photo = photos[index];
  const accent = PILLARS.find(value => value.id === selected?.pillarId)?.accentA ?? '#218578';
  const choose = (event: PastSNCFEvent) => {
    setChosen(event.id);
    setPhotoChoice(null);
    requestAnimationFrame(() => {
      featureRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      featureRef.current?.querySelector<HTMLElement>('h4')?.focus({ preventScroll: true });
    });
  };

  return <div id="past-events" className="past-journal" style={{ '--past-accent': accent } as React.CSSProperties}>
    <div className="past-journal-intro">
      <div><p className="past-journal-kicker">{c('eyebrow', 'From the journal')}</p>
        <h3>{c('title', 'Moments we’ve shared.')}</h3>
        <p>{c('intro', 'Photographs, stories and recorded details from days of service.')}</p>
      </div>
      <span className="past-journal-count"><Images size={17} aria-hidden="true" />{events.length} {c('recordedEvents', 'recorded events')}</span>
    </div>

    <div className="past-journal-tools">
      <div className="past-journal-filters" role="group" aria-label={c('filter', 'Filter past events by value')}>
        <button type="button" aria-pressed={pillar === 'all'} onClick={() => setPillar('all')}>{c('all', 'All stories')}</button>
        {availablePillars.map(value => <button key={value.id} type="button" aria-pressed={pillar === value.id} onClick={() => setPillar(value.id)}>
          <i style={{ background: value.accentA }} aria-hidden="true" />{value.label}
        </button>)}
      </div>
      <label className="past-journal-year">{c('year', 'Year')}
        <select value={year} onChange={event => setYear(event.target.value)} aria-label={c('yearLabel', 'Filter past events by year')}>
          <option value="all">{c('allYears', 'All years')}</option>
          {years.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>

    {selected && photo ? <>
      <article ref={featureRef} className="past-journal-feature" aria-labelledby="past-journal-title">
        <div className="past-journal-gallery">
          <figure className="past-journal-photo">
            <img key={`${selected.id}-${index}`} src={resolveCMSMedia(photo.src)} alt={photo.alt} loading="lazy" decoding="async" />
            {photos.length > 1 && <div className="past-journal-photo-controls">
              <button type="button" onClick={() => setPhotoChoice({ event: selected.id, index: (index - 1 + photos.length) % photos.length })} aria-label={c('previousPhoto', 'Previous event photograph')}><ChevronLeft size={18} aria-hidden="true" /></button>
              <span aria-live="polite">{index + 1} / {photos.length}</span>
              <button type="button" onClick={() => setPhotoChoice({ event: selected.id, index: (index + 1) % photos.length })} aria-label={c('nextPhoto', 'Next event photograph')}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>}
          </figure>
          <div className="past-journal-gallery-footer">
            {photos.length > 1 ? <div className="past-journal-thumbnails" role="group" aria-label={c('photos', 'Event photographs')}>
              {photos.map((item, i) => <button key={item.src} type="button" aria-pressed={index === i} aria-label={`${c('showPhoto', 'Show photograph')} ${i + 1}`} onClick={() => setPhotoChoice({ event: selected.id, index: i })}>
                <img src={resolveCMSMedia(item.src)} alt="" loading="lazy" decoding="async" />
              </button>)}
            </div> : <span><Images size={15} aria-hidden="true" />{c('officialPhoto', 'From the official event record')}</span>}
            <a href={resolveCMSMedia(photo.src)} target="_blank" rel="noopener noreferrer" aria-label={`${c('openPhoto', 'Open full photograph')}: ${photo.alt}`}><ArrowUpRight size={17} aria-hidden="true" /><span>{c('viewPhoto', 'View photo')}</span></a>
          </div>
        </div>
        <div className="past-journal-story" key={selected.id}>
          <p className="past-journal-tag"><i aria-hidden="true" />{selected.tag}</p>
          <h4 id="past-journal-title" tabIndex={-1}>{selected.title}</h4>
          <div className="past-journal-meta">
            <p><CalendarDays size={15} aria-hidden="true" /><time dateTime={selected.occurredOn}>{dateLabel(selected.occurredOn)}</time></p>
            {selected.location && <p><MapPin size={15} aria-hidden="true" />{selected.location}</p>}
          </div>
          <p className="past-journal-description">{selected.blurb}</p>
          {Boolean(selected.facts?.length) && <dl className="past-journal-facts">
            {selected.facts!.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
          </dl>}
          {selected.source && <a className="past-journal-source" href={selected.source} target="_blank" rel="noopener noreferrer">{c('source', 'Read the event report')}<ArrowUpRight size={17} aria-hidden="true" /></a>}
        </div>
      </article>

      <div className="past-journal-browse-heading"><span>{c('browse', 'Explore the archive')}</span><span>{filtered.length} {filtered.length === 1 ? c('story', 'story') : c('stories', 'stories')}</span></div>
      <div className="past-journal-cards" role="group" aria-label={c('choose', 'Choose a past event')}>
        {filtered.map(event => <button key={event.id} type="button" aria-pressed={selected.id === event.id} className="past-journal-card" onClick={() => choose(event)}>
          <div className="past-journal-card-photo"><img src={resolveCMSMedia(event.photos[0].src)} alt="" loading="lazy" decoding="async" /><span>{event.occurredOn.slice(0, 4)}</span></div>
          <div className="past-journal-card-copy"><time dateTime={event.occurredOn}>{dateLabel(event.occurredOn)}</time><strong>{event.title}</strong><span>{event.location}<ArrowUpRight size={15} aria-hidden="true" /></span></div>
        </button>)}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{selected.title}. {dateLabel(selected.occurredOn)}. {filtered.length} {c('matching', 'matching past events')}.</p>
    </> : <div className="past-journal-empty"><Images size={36} strokeWidth={1.2} aria-hidden="true" /><h4>{c('empty', 'More stories are on their way.')}</h4><p>{c('emptyHint', 'Choose another year or value to explore the archive.')}</p><button type="button" onClick={() => { setYear('all'); setPillar('all'); }}>{c('reset', 'Show all past events')}</button></div>}
  </div>;
}
