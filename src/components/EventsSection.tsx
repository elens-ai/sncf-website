import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, ArrowUpRight, ChevronLeft, ChevronRight, Phone, QrCode, Sparkles, Images } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { getCMSLink } from '../cms/links';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { EVENTS, isPastEvent } from '../data/events';
import { PILLARS } from '../data/pillars';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { resolveEvents, countdownLabel, icsHref, wrapCalendar, vevent, nowStamp, inviteUrl, pad, MONTHS_SHORT, MONTHS_LONG } from '../utils/events';
import { eventQr } from '../utils/eventPoster';
import { EventShare } from './EventShare';
import { EventsCalendarModal } from './EventsCalendarModal';
import { JournalIllustration } from './JournalIllustration';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import { PillarMarkShapes } from './PillarMark';
import { UnDayMark, isUnObservance } from './UnAffiliation';
import { PastEventsJournal } from './PastEventsJournal';
import './events-journal.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.EventsJournal.${key}`, fallback);
const FILTERS: ('all' | MosaicPillar)[] = ['all', 'heal', 'enrich', 'empower', 'projects'];

function JournalPillarIcon({ pillar }: { pillar: MosaicPillar }) {
  return <svg className="journal-pillar-icon" viewBox="0 0 146 120" aria-hidden="true">
    <PillarMarkShapes pillar={pillar} />
  </svg>;
}

/** Days, hours and minutes to the moment, turning over while the section is on screen. */
function Ticker({ date, live }: { date: Date; live: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [live]);
  const left = Math.max(0, date.getTime() - now);
  return <span className="journal-ticker" aria-hidden="true">
    <b>{Math.floor(left / 86400000)}</b>{c('days', 'd')}<b>{pad(Math.floor(left / 3600000) % 24)}</b>{c('hours', 'h')}<b>{pad(Math.floor(left / 60000) % 60)}</b>{c('minutes', 'm')}
  </span>;
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
  const [view, setView] = useState<'upcoming' | 'past'>(() => window.location.hash === '#past-events' ? 'past' : 'upcoming');
  useEffect(() => {
    const openArchive = () => { if (window.location.hash === '#past-events') setView('past'); };
    window.addEventListener('hashchange', openArchive);
    return () => window.removeEventListener('hashchange', openArchive);
  }, []);
  useEffect(() => {
    if (!visible) return;
    setTick(t => t + 1);
    const id = window.setInterval(() => setTick(t => t + 1), 3600000);
    return () => clearInterval(id);
  }, [visible]);
  const items = useMemo(() => { void tick; void revision; return resolveEvents(EVENTS).sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity)); }, [tick, revision]);
  const pastItems = useMemo(() => { void revision; return EVENTS.filter(isPastEvent).sort((a, b) => b.occurredOn.localeCompare(a.occurredOn)); }, [revision]);
  const filtered = items.filter(i => filter === 'all' || i.event.pillarId === filter);
  const selected = filtered.find(i => i.event.id === chosen) ?? filtered[0];
  const pillar = selected?.event.pillarId ?? (filter === 'all' ? 'projects' : filter);
  const pillarLabel = (id: string) => PILLARS.find(p => p.id === id)?.label ?? id;
  const dateLabel = selected?.date?.toLocaleDateString('en-GB', { dateStyle: 'full' }) ?? c('join', 'An ongoing initiative');
  const position = selected ? filtered.indexOf(selected) + 1 : 0;
  const qrUrl = qr?.id === selected?.event.id ? qr?.url : null;
  useEffect(() => {
    let live = true;
    if (selected) eventQr(selected.event.id, selected.accentA)
      .then(url => { if (live) setQr({ id: selected.event.id, url }); })
      .catch(() => { if (live) setQr(null); });
    return () => { live = false; };
  }, [selected?.event.id, selected?.accentA]);
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
        <p className="journal-heading-intro">{c('introduction', 'A little of your time. A world of difference. Find your next moment to care, connect and contribute.')}</p>
      </div>
      <button ref={calendarButton} className="journal-calendar-link" type="button" onClick={() => setCalendar(true)}>
        <CalendarDays size={17} aria-hidden="true" />{c('calendar', 'View calendar')}<ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </header>

    <div className="journal-view-switch" role="tablist" aria-label={c('viewLabel', 'Choose upcoming or past events')} onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'upcoming' : event.key === 'End' ? 'past' : view === 'upcoming' ? 'past' : 'upcoming';
      setView(next);
      event.currentTarget.querySelector<HTMLButtonElement>(`#journal-${next}-tab`)?.focus();
    }}>
      <button id="journal-upcoming-tab" role="tab" type="button" aria-selected={view === 'upcoming'} aria-controls="journal-upcoming-panel" tabIndex={view === 'upcoming' ? 0 : -1} onClick={() => setView('upcoming')}><CalendarDays size={16} aria-hidden="true" />{c('upcomingView', 'Upcoming & ongoing')}<span>{items.length}</span></button>
      <button id="journal-past-tab" role="tab" type="button" aria-selected={view === 'past'} aria-controls="journal-past-panel" tabIndex={view === 'past' ? 0 : -1} onClick={() => setView('past')}><Images size={16} aria-hidden="true" />{c('pastView', 'Past events')}<span>{pastItems.length}</span></button>
    </div>

    <div id="journal-past-panel" role="tabpanel" aria-labelledby="journal-past-tab" hidden={view !== 'past'}>
      <PastEventsJournal events={pastItems} />
    </div>
    <div id="journal-upcoming-panel" role="tabpanel" aria-labelledby="journal-upcoming-tab" hidden={view !== 'upcoming'}>
    <div className="journal-toolbar">
      <div className="journal-filters" role="group" aria-label={c('filter', 'Filter by value')}>
        {FILTERS.map(id => {
          const count = id === 'all' ? items.length : items.filter(i => i.event.pillarId === id).length;
          /* a value with no dates yet is shown, but cannot be chosen into an empty page */
          return <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} disabled={count === 0} title={count === 0 ? c('noDates', 'No dates announced yet') : undefined}
            style={id === 'all' ? undefined : { '--filter-tint': PILLARS.find(p => p.id === id)?.accentA } as React.CSSProperties}>
            {id === 'all' ? <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" /> : <JournalPillarIcon pillar={id} />}
            <span>{id === 'all' ? c('all', 'All moments') : PILLAR_LOGOS[id].label}</span>
            <small>{count}</small>
          </button>;
        })}
      </div>
      <p className="journal-toolbar-note">{c('invitationNote', 'Small moments. Lasting change.')}</p>
    </div>

    <div className="journal-year" role="group" aria-label={c('year', 'The year at a glance')}>
      <div className="journal-year-heading"><span>{c('yearHeading', 'A year of giving back')}</span><span>{items.length} {c('moments', 'moments')}</span></div>
      <div className="journal-months">
        {MONTHS_SHORT.map((month, index) => {
          const monthItems = items.filter(item => item.event.month === index + 1);
          const current = selected?.event.month === index + 1;
          return <button key={month} type="button" disabled={!monthItems.length} aria-pressed={current}
            aria-label={`${MONTHS_LONG[index]}: ${monthItems.length} ${monthItems.length === 1 ? c('moment', 'moment') : c('moments', 'moments')}`}
            onClick={() => { setFilter('all'); chooseEvent(monthItems[0].event.id); }}>
            <span>{month}</span><span className="journal-month-dots" aria-hidden="true">{monthItems.map(item => <i key={item.event.id} style={{ background: item.accentA }} />)}</span>
          </button>;
        })}
      </div>
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
              <JournalIllustration pillar={pillar} />
              <div className="journal-date-ticket">
                <CalendarDays size={16} strokeWidth={1.5} />
                <strong>{selected.date ? String(selected.date.getDate()).padStart(2, '0') : '∞'}</strong>
                <span>{selected.date?.toLocaleDateString('en-GB', { month: 'long' }) ?? c('yearRound', 'Year round')}<small>{selected.date?.getFullYear() ?? c('joinAnytime', 'Join anytime')}</small></span>
              </div>
            </div>
            <div className="journal-feature-copy">
              <p className="journal-tag">{isUnObservance(selected.event.tag) ? <UnDayMark /> : selected.event.tag}</p>
              <h3 id="journal-event-title" tabIndex={-1}>{selected.event.title}</h3>
              <p className="journal-when"><CalendarDays size={15} aria-hidden="true" />{dateLabel}</p>
              <span className="journal-countdown"><span aria-hidden="true" />{selected.days !== null ? countdownLabel(selected.days) : c('yearRound', 'Year round')}</span>
              {selected.date && (selected.days ?? 0) > 0 && <Ticker date={selected.date} live={visible} />}
              <p className="journal-blurb">{selected.event.blurb}{selected.event.location ? ` · ${selected.event.location}` : ''}{selected.event.time ? ` · ${selected.event.time}` : ''}</p>
              <div className="journal-actions">
                {selected.date && <a className="journal-save-date" href={icsHref(wrapCalendar(vevent(selected.event, selected.date, nowStamp())))} download={`${selected.event.id}.ics`}><CalendarPlus size={17} aria-hidden="true" />{c('save', 'Save the date')}</a>}
                <a className="journal-invitation-link" href={inviteUrl(selected.event.id)}>{c('invite', 'View invitation')}<ArrowUpRight size={16} aria-hidden="true" /></a>
                <a className="journal-venue-link" href={getCMSLink("copy.Link.InvitationCard.e3dc1a537132", "tel:+911147660380")}><Phone size={14} aria-hidden="true" />{c('venue', 'Find a venue near you')}</a>
              </div>
            </div>
          </div>
          <details className="journal-share-drawer" key={`pass-${selected.event.id}`}>
            <summary><QrCode size={18} aria-hidden="true" />{c('shareTools', 'Your invitation, ready to share')}<span>+</span></summary>
          <div className="journal-pass">
            <a className="journal-pass-code" href={inviteUrl(selected.event.id)} aria-label={c('passOpen', 'Open the invitation')}>
              {qrUrl ? <img src={qrUrl} alt="" width={80} height={80} /> : <QrCode size={35} strokeWidth={1} aria-hidden="true" />}
            </a>
            <div className="journal-pass-copy">
              <p>{c('takeMoment', 'Take this moment with you.')}</p>
              <span>{c('scanHint', 'Scan for your invitation, or share the poster.')}</span>
            </div>
            {/* send it on: the networks, a calendar, or its artwork */}
            <EventShare item={selected} when={dateLabel} artwork className="journal-share" />
          </div>
          </details>
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
            <span className="journal-mini-words"><small>{isUnObservance(item.event.tag) ? <UnDayMark compact /> : item.event.tag}</small><strong>{item.event.title}</strong></span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>)}
          {!filtered.length && <p className="journal-agenda-empty">{c('emptyAgenda', 'New dates will appear here as they are announced.')}</p>}
        </div>
      </aside>
    </div>
    <p className="journal-selection-status sr-only" role="status" aria-live="polite">{selected ? `${selected.event.title}. ${dateLabel}.` : c('empty', 'No events in this category yet.')}</p>
    </div>
    <EventsCalendarModal isOpen={calendar} onClose={closeCalendar} items={items} initialEventId={selected?.event.id ?? null} />
  </section>;
};
