import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, ArrowUpRight, ChevronLeft, ChevronRight, Download, QrCode, Sparkles } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { roomPhoto } from '../data/pavilionGallery';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { EVENTS } from '../data/events';
import { PILLARS } from '../data/pillars';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { resolveEvents, countdownLabel, icsHref, wrapCalendar, vevent, nowStamp, inviteUrl } from '../utils/events';
import { eventQr, renderPoster, downloadBlob } from '../utils/eventPoster';
import { EventsCalendarModal } from './EventsCalendarModal';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import { PillarArtwork } from './PillarArtwork';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import './events-journal.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.EventsJournal.${key}`, fallback);
const FILTERS: ('all' | MosaicPillar)[] = ['all', 'heal', 'enrich', 'empower', 'projects'];

function JournalPillarIcon({ pillar }: { pillar: MosaicPillar }) {
  return <svg className="journal-pillar-icon" viewBox="0 0 146 120" aria-hidden="true">
    {PILLAR_LOGOS[pillar].paths.map(d => <path key={d} d={d} />)}
  </svg>;
}

/** A featured invitation and a browsable agenda on the shared pillar-coloured ground. */
export const EventsSection: React.FC = () => {
  const revision = useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const calendarButton = useRef<HTMLButtonElement>(null);
  const visible = useSectionActivity(ref);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  const [tick, setTick] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | MosaicPillar>('all');
  const [calendar, setCalendar] = useState(false);
  const [qr, setQr] = useState<{ id: string; url: string } | null>(null);
  const [printing, setPrinting] = useState(false);
  const [posterError, setPosterError] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setTick(t => t + 1);
    const id = window.setInterval(() => setTick(t => t + 1), 3600000);
    return () => clearInterval(id);
  }, [visible]);
  const items = useMemo(() => { void tick; void revision; return resolveEvents(EVENTS).sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity)); }, [tick, revision]);
  const filtered = items.filter(i => filter === 'all' || i.event.pillarId === filter);
  const selected = filtered.find(i => i.event.id === chosen) ?? filtered[0];
  const pillar = selected?.event.pillarId ?? (filter === 'all' ? 'projects' : filter);
  const pillarLabel = (id: string) => PILLARS.find(p => p.id === id)?.label ?? id;
  const dateLabel = selected?.date?.toLocaleDateString('en-GB', { dateStyle: 'full' }) ?? c('join', 'An ongoing initiative');
  const position = selected ? filtered.indexOf(selected) + 1 : 0;
  const qrUrl = qr?.id === selected?.event.id ? qr?.url : null;
  useEffect(() => {
    let live = true;
    setPosterError(false);
    if (selected) eventQr(selected.event.id, selected.accentA)
      .then(url => { if (live) setQr({ id: selected.event.id, url }); })
      .catch(() => { if (live) setQr(null); });
    return () => { live = false; };
  }, [selected?.event.id, selected?.accentA]);
  const poster = async () => {
    if (!selected || printing) return;
    setPrinting(true); setPosterError(false);
    try { downloadBlob(await renderPoster(selected), `${selected.event.id}-poster.png`); }
    catch { setPosterError(true); }
    finally { setPrinting(false); }
  };
  const step = (direction: number) => {
    if (!selected || !filtered.length) return;
    setChosen(filtered[(filtered.indexOf(selected) + direction + filtered.length) % filtered.length].event.id);
  };
  const chooseEvent = (id: string) => {
    setChosen(id);
    // On a phone the agenda follows the invitation. Bring the chosen story back
    // into view and move keyboard focus with it, without remounting the controls.
    if (matchMedia('(max-width: 1050px)').matches) requestAnimationFrame(() => {
      featureRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      featureRef.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
    });
  };
  const closeCalendar = useCallback(() => {
    setCalendar(false);
    requestAnimationFrame(() => calendarButton.current?.focus({ preventScroll: true }));
  }, []);

  return <section id="events-section" ref={ref} className="events-journal" data-active={visible} data-arrived={arrived}
    data-pillar={pillar} aria-label={c('label', 'Events and observances')}
    style={{ '--event-ink': selected?.accentA ?? '#2dacc3', '--event-tint': selected?.accentB ?? '#8dd4df' } as React.CSSProperties}>
    <div className="journal-atmosphere" aria-hidden="true"><i /><i /><span /></div>
    <header className="journal-heading">
      <div><p className="journal-eyebrow"><span aria-hidden="true" />{c('eyebrow', 'The service journal')}</p>
        <h2>{c('title', 'Make time for')} <em>{c('titleAccent', 'something meaningful.')}</em></h2>
      </div>
      <button ref={calendarButton} className="journal-calendar-link" type="button" onClick={() => setCalendar(true)}>
        <CalendarDays size={17} aria-hidden="true" />{c('calendar', 'View calendar')}<ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </header>

    <div className="journal-toolbar">
      <div className="journal-filters" role="group" aria-label={c('filter', 'Filter by value')}>
        {FILTERS.map(id => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
          style={id === 'all' ? undefined : { '--filter-tint': PILLAR_LOGOS[id].edge } as React.CSSProperties}>
          {id === 'all' ? <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" /> : <JournalPillarIcon pillar={id} />}
          <span>{id === 'all' ? c('all', 'All moments') : PILLAR_LOGOS[id].label}</span>
          <small>{id === 'all' ? items.length : items.filter(i => i.event.pillarId === id).length}</small>
        </button>)}
      </div>
      <p className="journal-toolbar-note">{c('invitationNote', 'Small moments. Lasting change.')}</p>
    </div>

    <div className="journal-spread">
      <article ref={featureRef} className="journal-feature" aria-labelledby="journal-event-title">
        {selected ? <>
          <div className="journal-feature-top">
            <span className="journal-pillar-label"><JournalPillarIcon pillar={pillar} />{pillarLabel(pillar)}</span>
            <div className="journal-navigation">
              <span>{String(position).padStart(2, '0')} <i>/ {String(filtered.length).padStart(2, '0')}</i></span>
              <button type="button" aria-label={c('previous', 'Previous event')} disabled={filtered.length < 2} onClick={() => step(-1)}><ChevronLeft size={17} aria-hidden="true" /></button>
              <button type="button" aria-label={c('next', 'Next event')} disabled={filtered.length < 2} onClick={() => step(1)}><ChevronRight size={17} aria-hidden="true" /></button>
            </div>
          </div>
          <div className="journal-feature-scene" key={selected.event.id}>
            <div className="journal-emblem-stage" aria-hidden="true">
              <img className="journal-scene-photo" src={resolveCMSMedia(roomPhoto(pillar, 2))} alt="" loading="lazy" />
              <PillarArtwork pillarId={pillar} />
              <svg className="journal-emblem-orbits" viewBox="0 0 400 370" fill="none">
                <ellipse cx="200" cy="165" rx="170" ry="135" transform="rotate(-16 200 165)" />
                <ellipse cx="200" cy="165" rx="150" ry="156" transform="rotate(20 200 165)" />
                <circle cx="60" cy="82" r="3" /><circle cx="350" cy="212" r="2" />
              </svg>
              <div className="journal-emblem"><PillarPhotoMosaic pillar={pillar} caption={false} /></div>
              <div className="journal-date-ticket">
                <CalendarDays size={16} strokeWidth={1.5} />
                <strong>{selected.date ? String(selected.date.getDate()).padStart(2, '0') : '∞'}</strong>
                <span>{selected.date?.toLocaleDateString('en-GB', { month: 'long' }) ?? c('yearRound', 'Year round')}<small>{selected.date?.getFullYear() ?? c('joinAnytime', 'Join anytime')}</small></span>
              </div>
            </div>
            <div className="journal-feature-copy">
              <p className="journal-tag">{selected.event.tag}</p>
              <h3 id="journal-event-title" tabIndex={-1}>{selected.event.title}</h3>
              <p className="journal-when"><CalendarDays size={15} aria-hidden="true" />{dateLabel}</p>
              <span className="journal-countdown"><span aria-hidden="true" />{selected.days !== null ? countdownLabel(selected.days) : c('yearRound', 'Year round')}</span>
              <p className="journal-blurb">{selected.event.blurb}{selected.event.location ? ` · ${selected.event.location}` : ''}{selected.event.time ? ` · ${selected.event.time}` : ''}</p>
              <div className="journal-actions">
                {selected.date && <a className="journal-save-date" href={icsHref(wrapCalendar(vevent(selected.event, selected.date, nowStamp())))} download={`${selected.event.id}.ics`}><CalendarPlus size={17} aria-hidden="true" />{c('save', 'Save the date')}</a>}
                <a className="journal-invitation-link" href={inviteUrl(selected.event.id)}>{c('invite', 'View invitation')}<ArrowUpRight size={16} aria-hidden="true" /></a>
              </div>
            </div>
          </div>
          <div className="journal-pass">
            <a className="journal-pass-code" href={inviteUrl(selected.event.id)} aria-label={c('passOpen', 'Open the invitation')}>
              {qrUrl ? <img src={qrUrl} alt="" width={80} height={80} /> : <QrCode size={35} strokeWidth={1} aria-hidden="true" />}
            </a>
            <div className="journal-pass-copy">
              <p>{c('takeMoment', 'Take this moment with you.')}</p>
              <span>{c('scanHint', 'Scan for your invitation, or share the poster.')}</span>
            </div>
            <button className="journal-poster" type="button" onClick={poster} disabled={printing} aria-busy={printing}>
              <Download size={16} aria-hidden="true" /><span>{printing ? c('passBusy', 'Preparing…') : c('poster', 'Download poster')}</span>
            </button>
          </div>
          {posterError && <p className="journal-error" role="status">{c('posterError', 'The poster could not be prepared. Please try again.')}</p>}
        </> : <div className="journal-empty">
          <JournalPillarIcon pillar={pillar} /><p className="journal-eyebrow">{pillarLabel(pillar)}</p>
          <h3 id="journal-event-title" tabIndex={-1}>{c('empty', 'No events in this category yet.')}</h3>
          <p>{c('emptyHint', 'There are more ways to take part across our other pillars.')}</p>
          <button type="button" onClick={() => setFilter('all')}>{c('showAll', 'Explore all moments')}<ArrowUpRight size={17} aria-hidden="true" /></button>
        </div>}
      </article>

      <aside className="journal-agenda" aria-label={c('agenda', 'Choose a moment')}>
        <p className="journal-agenda-title"><span>{c('agenda', 'Choose a moment')}</span><span>{String(filtered.length).padStart(2, '0')}</span></p>
        <div className="journal-agenda-scroll">
          {filtered.map((item, i) => <button key={item.event.id} type="button" aria-pressed={item.event.id === selected?.event.id}
            onClick={() => chooseEvent(item.event.id)} style={{ '--event-ink': item.accentA, '--event-tint': item.accentB, '--i': i } as React.CSSProperties}>
            <span className="journal-mini-date"><strong>{item.date?.getDate() ?? '∞'}</strong><span>{item.date?.toLocaleDateString('en-GB', { month: 'short' }) ?? c('ongoingShort', 'Ongoing')}</span></span>
            <span className="journal-mini-words"><small>{item.event.tag}</small><strong>{item.event.title}</strong></span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>)}
          {!filtered.length && <p className="journal-agenda-empty">{c('emptyAgenda', 'New dates will appear here as they are announced.')}</p>}
        </div>
      </aside>
    </div>
    <p className="journal-selection-status sr-only" role="status" aria-live="polite">{selected ? `${selected.event.title}. ${dateLabel}.` : c('empty', 'No events in this category yet.')}</p>
    <EventsCalendarModal isOpen={calendar} onClose={closeCalendar} items={items} initialEventId={selected?.event.id ?? null} />
  </section>;
};
