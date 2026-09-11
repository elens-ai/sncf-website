import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, ArrowUpRight, Heart, Sprout, BookOpen, Waves, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { EVENTS } from '../data/events';
import { PILLARS } from '../data/pillars';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { resolveEvents, countdownLabel, icsHref, wrapCalendar, vevent, nowStamp } from '../utils/events';
import { EventsCalendarModal } from './EventsCalendarModal';
import './events-journal.css';
const c = (key: string, fallback: string) => getCMSCopy(`copy.EventsJournal.${key}`, fallback);

export const EventsSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const visible = useSectionActivity(ref);
  const [tick, setTick] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [calendar, setCalendar] = useState(false);
  useEffect(() => { if (!visible) return; setTick(t => t + 1); const id = window.setInterval(() => setTick(t => t + 1), 3600000); return () => clearInterval(id); }, [visible]);
  const items = useMemo(() => { void tick; return resolveEvents(EVENTS).sort((a,b) => (a.days ?? Infinity) - (b.days ?? Infinity)); }, [tick, EVENTS]);
  const filtered = items.filter(i => filter === 'all' || i.event.pillarId === filter);
  const selected = filtered.find(i => i.event.id === chosen) ?? filtered[0];
  const Mark = selected?.event.pillarId === 'heal' ? Heart : selected?.event.pillarId === 'enrich' ? BookOpen : selected?.event.pillarId === 'projects' ? Waves : Sprout;
  const step = (direction: number) => { if (!selected || !filtered.length) return; const index = filtered.indexOf(selected); setChosen(filtered[(index + direction + filtered.length) % filtered.length].event.id); };
  return <section id="events-section" ref={ref} className="events-journal" data-active={visible} aria-label={c('label', 'Events and observances')}>
    <header className="journal-heading"><div><p>{c('eyebrow', 'The service journal')}</p><h2>{c('title', 'Make time for')} <em>{c('titleAccent', 'something meaningful.')}</em></h2></div><button onClick={() => setCalendar(true)}><CalendarDays size={18}/>{c('calendar', 'View calendar')}</button></header>
    <div className="journal-filters" aria-label={c('filter', 'Filter by value')}>{['all','heal','enrich','empower','projects'].map(id => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{id === 'all' ? c('all', 'All moments') : PILLARS.find(p => p.id === id)?.label ?? c('projects','Projects')}</button>)}</div>
    <div className="journal-spread" style={{'--event-ink':selected?.accentA ?? '#208765','--event-tint':selected?.accentB ?? '#a0d9ba'} as React.CSSProperties}>
      {selected ? <article className="journal-feature" key={selected.event.id} style={{'--event-ink':selected.accentA} as React.CSSProperties}>
        <div className="journal-date" aria-hidden="true"><div className="journal-date-mark"><Mark strokeWidth={1}/></div><span>{selected.date?.toLocaleDateString('en-GB',{month:'long'}) ?? c('ongoing','Every day')}</span><strong>{selected.date?.getDate() ?? '∞'}</strong><span>{selected.date?.getFullYear() ?? c('yearRound','Year round')}</span><i/><i className="journal-wave-two"/><div className="journal-sparks"><b/><b/><b/></div></div>
        <div className="journal-feature-copy"><div className="journal-chapter">{PILLARS.find(p => p.id === selected.event.pillarId)?.label ?? selected.event.pillarId}<span>{String(filtered.indexOf(selected)+1).padStart(2,'0')} / {String(filtered.length).padStart(2,'0')}</span></div><p className="journal-tag">{selected.event.tag}</p><p className="journal-when">{selected.date?.toLocaleDateString('en-GB',{dateStyle:'full'}) ?? c('join','An ongoing initiative')} · {selected.days !== null ? countdownLabel(selected.days) : c('yearRound','Year round')}</p><h3>{selected.event.title}</h3><p>{selected.event.blurb}</p>{selected.event.location && <p>{selected.event.location}</p>}{selected.event.time && <p>{selected.event.time}</p>}<div className="journal-actions">{selected.date && <a href={icsHref(wrapCalendar(vevent(selected.event,selected.date,nowStamp())))} download={`${selected.event.id}.ics`}><CalendarPlus size={18}/>{c('save','Save the date')}</a>}<button onClick={() => setCalendar(true)}>{c('details','Explore calendar')}<ArrowUpRight size={18}/></button></div><div className="journal-navigation"><button aria-label={c('previous','Previous event')} onClick={() => step(-1)}><ChevronLeft size={18}/></button><span>{c('discover','Find your next moment')}</span><button aria-label={c('next','Next event')} onClick={() => step(1)}><ChevronRight size={18}/></button></div></div>
      </article> : <p className="journal-empty">{c('empty','No events in this category yet.')}</p>}
      <aside className="journal-agenda" aria-label={c('agenda','Choose a moment')}><p className="journal-agenda-title">{c('agenda','Choose a moment')}<span>{String(filtered.length).padStart(2,'0')}</span></p><div className="journal-agenda-scroll">{filtered.map((item) => <button key={item.event.id} aria-pressed={item.event.id === selected?.event.id} onClick={() => setChosen(item.event.id)} style={{'--event-ink':item.accentA} as React.CSSProperties}><span className="journal-mini-date"><strong>{item.date?.getDate() ?? '∞'}</strong>{item.date?.toLocaleDateString('en-GB',{month:'short'}) ?? c('ongoingShort','Ongoing')}</span><span><small>{item.event.tag}</small><strong>{item.event.title}</strong></span><ArrowUpRight size={17}/></button>)}</div></aside>
    </div>
    <EventsCalendarModal isOpen={calendar} onClose={() => setCalendar(false)} items={items} initialEventId={selected?.event.id ?? null}/>
  </section>;
};
