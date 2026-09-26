import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, ArrowUpRight, Heart, Sprout, BookOpen, Waves, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { EVENTS } from '../data/events';
import { PILLARS } from '../data/pillars';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { resolveEvents, countdownLabel, icsHref, wrapCalendar, vevent, nowStamp, inviteUrl } from '../utils/events';
import { eventQr, renderPoster, downloadBlob } from '../utils/eventPoster';
import { EventsCalendarModal } from './EventsCalendarModal';
import { FoilStroke } from './FoilStroke';
import { OdometerStatCounter } from './OdometerStatCounter';
import './events-journal.css';
const c = (key: string, fallback: string) => getCMSCopy(`copy.EventsJournal.${key}`, fallback);

/**
 * THE SERVICE JOURNAL — the moments of the year, on the page's own ground.
 *
 * No card: the section sits on the same dark shade as the chapters above
 * it. The chosen moment's date stands on a foil brush stroke in its
 * pillar's colour (the hero's plates), the day rolling in on the page's
 * odometer; its words beside it in the album's typography; its pass — the
 * QR code that opens the invitation — as a small print laid on the page;
 * and the year's other moments as a column of glass rows. Everything
 * arrives in a cascade the first time the journal is on screen, and every
 * chosen moment turns the page again.
 */
export const EventsSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const visible = useSectionActivity(ref);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  const [tick, setTick] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [calendar, setCalendar] = useState(false);
  /* The pass: one code per moment, drawn when the moment is chosen. */
  const [qr, setQr] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  useEffect(() => { if (!visible) return; setTick(t => t + 1); const id = window.setInterval(() => setTick(t => t + 1), 3600000); return () => clearInterval(id); }, [visible]);
  const items = useMemo(() => { void tick; return resolveEvents(EVENTS).sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity)); }, [tick, EVENTS]);
  const filtered = items.filter(i => filter === 'all' || i.event.pillarId === filter);
  const selected = filtered.find(i => i.event.id === chosen) ?? filtered[0];
  const Mark = selected?.event.pillarId === 'heal' ? Heart : selected?.event.pillarId === 'enrich' ? BookOpen : selected?.event.pillarId === 'projects' ? Waves : Sprout;
  useEffect(() => {
    let live = true;
    setQr(null);
    if (selected) eventQr(selected.event.id, selected.accentA).then(url => { if (live) setQr(url); }).catch(() => undefined);
    return () => { live = false; };
  }, [selected?.event.id, selected?.accentA]);
  const poster = async () => {
    if (!selected || printing) return;
    setPrinting(true);
    try { downloadBlob(await renderPoster(selected), `${selected.event.id}-poster.png`); } catch (error) { console.warn('poster', error); }
    setPrinting(false);
  };
  const step = (direction: number) => { if (!selected || !filtered.length) return; const index = filtered.indexOf(selected); setChosen(filtered[(index + direction + filtered.length) % filtered.length].event.id); };
  const pillarLabel = (id: string) => PILLARS.find(p => p.id === id)?.label ?? id;
  return <section id="events-section" ref={ref} className="events-journal" data-active={visible} data-arrived={arrived} aria-label={c('label', 'Events and observances')}>
    <header className="journal-heading">
      <div><p className="journal-eyebrow">{c('eyebrow', 'The service journal')}</p><h2>{c('title', 'Make time for')} <em>{c('titleAccent', 'something meaningful.')}</em></h2></div>
      <button type="button" onClick={() => setCalendar(true)}><CalendarDays size={17} />{c('calendar', 'View calendar')}</button>
    </header>
    <div className="journal-filters" aria-label={c('filter', 'Filter by value')}>{['all', 'heal', 'enrich', 'empower', 'projects'].map(id => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === 'all' ? c('all', 'All moments') : pillarLabel(id)}</button>)}</div>
    <div className="journal-spread" style={{ '--event-ink': selected?.accentA ?? '#208765', '--event-tint': selected?.accentB ?? '#a0d9ba' } as React.CSSProperties}>
      {selected ? <article className="journal-feature" key={selected.event.id}>
        <div className="journal-plate" aria-hidden="true">
          <FoilStroke id={`journal-${selected.event.id}`} className="journal-plate-art" />
          <span className="journal-plate-frame" />
          <div className="journal-plate-face">
            <Mark className="journal-plate-mark" strokeWidth={1.2} />
            <span className="journal-plate-month">{selected.date?.toLocaleDateString('en-GB', { month: 'long' }) ?? c('ongoing', 'Every day')}</span>
            <strong className="journal-plate-day">{selected.date ? <OdometerStatCounter value={String(selected.date.getDate())} duration={900} /> : '∞'}</strong>
            <span className="journal-plate-year">{selected.date?.getFullYear() ?? c('yearRound', 'Year round')}</span>
          </div>
        </div>
        <div className="journal-feature-copy">
          <div className="journal-chapter"><span>{pillarLabel(selected.event.pillarId)}</span><span>{String(filtered.indexOf(selected) + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}</span></div>
          <p className="journal-tag">{selected.event.tag}</p>
          <h3>{selected.event.title}</h3>
          <p className="journal-when">{selected.date?.toLocaleDateString('en-GB', { dateStyle: 'full' }) ?? c('join', 'An ongoing initiative')} · {selected.days !== null ? countdownLabel(selected.days) : c('yearRound', 'Year round')}</p>
          <p className="journal-blurb">{selected.event.blurb}{selected.event.location ? ` · ${selected.event.location}` : ''}{selected.event.time ? ` · ${selected.event.time}` : ''}</p>
          <div className="journal-actions">
            {selected.date && <a href={icsHref(wrapCalendar(vevent(selected.event, selected.date, nowStamp())))} download={`${selected.event.id}.ics`}><CalendarPlus size={16} />{c('save', 'Save the date')}</a>}
            <button type="button" onClick={() => setCalendar(true)}>{c('details', 'Explore calendar')}<ArrowUpRight size={16} /></button>
          </div>
          <div className="journal-pass">
            <a className="journal-pass-print" href={inviteUrl(selected.event.id)} aria-label={c('passOpen', 'Open the invitation')}>
              <span className="journal-pass-photo">{qr ? <img src={qr} alt="" width={96} height={96} /> : <span />}</span>
              <span className="journal-pass-caption">{c('pass', 'Your pass')}</span>
              <span className="journal-pass-sub">{c('scan', 'Scan for your invitation')}</span>
            </a>
            <div className="journal-pass-copy">
              <p>{c('passHint', 'Scan the code for the invitation on your phone, or take the poster with you.')}</p>
              <div className="journal-pass-actions">
                <button type="button" onClick={poster} disabled={printing}><Download size={14} />{printing ? c('passBusy', 'Preparing…') : c('poster', 'Download poster')}</button>
                <a href={inviteUrl(selected.event.id)}>{c('invite', 'View invitation')}<ArrowUpRight size={14} /></a>
              </div>
            </div>
          </div>
          <div className="journal-navigation">
            <button type="button" aria-label={c('previous', 'Previous event')} onClick={() => step(-1)}><ChevronLeft size={18} /></button>
            <span>{c('discover', 'Find your next moment')}</span>
            <button type="button" aria-label={c('next', 'Next event')} onClick={() => step(1)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </article> : <p className="journal-empty">{c('empty', 'No events in this category yet.')}</p>}
      <aside className="journal-agenda" aria-label={c('agenda', 'Choose a moment')}>
        <p className="journal-agenda-title">{c('agenda', 'Choose a moment')}<span>{String(filtered.length).padStart(2, '0')}</span></p>
        <div className="journal-agenda-scroll">
          {filtered.map((item, i) => <button key={item.event.id} type="button" aria-pressed={item.event.id === selected?.event.id} onClick={() => setChosen(item.event.id)} style={{ '--event-ink': item.accentA, '--event-tint': item.accentB, '--i': i } as React.CSSProperties}>
            <span className="journal-mini-date"><strong>{item.date?.getDate() ?? '∞'}</strong>{item.date?.toLocaleDateString('en-GB', { month: 'short' }) ?? c('ongoingShort', 'Ongoing')}</span>
            <span className="journal-mini-words"><small>{item.event.tag}</small><strong>{item.event.title}</strong></span>
            <ArrowUpRight size={16} />
          </button>)}
        </div>
      </aside>
    </div>
    <EventsCalendarModal isOpen={calendar} onClose={() => setCalendar(false)} items={items} initialEventId={selected?.event.id ?? null} />
  </section>;
};
