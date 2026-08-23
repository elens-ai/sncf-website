import React from 'react';
import { CalendarDays, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { UPCOMING_EVENTS, SNCFEvent } from '../data/events';

/**
 * Upcoming events — the screen after the four pillars.
 *
 * Like every screen below the hero it paints no background of its own; the
 * page-wide .accent-canvas carries the gradient, so the colour runs unbroken
 * through here and keeps changing with the wheel.
 *
 * Events dated before today are dropped rather than displayed, so nothing
 * sits here claiming to be upcoming after it has passed.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Upcoming only, soonest first. Invalid dates are kept so a typo is visible. */
const upcoming = (events: SNCFEvent[]) => {
  const today = startOfToday();
  return events
    .filter((e) => {
      const when = new Date(e.date);
      return Number.isNaN(when.getTime()) || when >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const DateBlock: React.FC<{ date: string }> = ({ date }) => {
  const d = new Date(date);
  const valid = !Number.isNaN(d.getTime());
  return (
    <div className="flex-none w-[62px] rounded-2xl bg-white/95 text-neutral-900 py-2 text-center shadow-md">
      <p className="font-artistic-heading text-[24px] font-bold leading-none">
        {valid ? d.getDate() : '–'}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mt-0.5">
        {valid ? MONTHS[d.getMonth()] : ''}
      </p>
      {valid && (
        <p className="text-[10px] text-neutral-500 leading-none">{d.getFullYear()}</p>
      )}
    </div>
  );
};

export const EventsSection: React.FC = () => {
  const events = upcoming(UPCOMING_EVENTS);

  return (
    <section
      id="events-section"
      aria-label="Upcoming events"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-16 overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <header className="mb-8 sm:mb-12">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
            What&rsquo;s next
          </p>
          <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow">
            Upcoming events
          </h2>
        </header>

        {events.length === 0 ? (
          /* Honest empty state. Better than inventing a camp and a date that
             someone might travel to. */
          <div className="rounded-3xl border border-white/15 bg-black/20 backdrop-blur-md p-8 sm:p-10 max-w-2xl">
            <CalendarDays className="w-6 h-6 text-white/70 mb-4" />
            <p className="font-artistic-serif text-white/95 text-[17px] leading-relaxed mb-2">
              No dates are published just yet.
            </p>
            <p className="text-[14px] text-white/70 leading-relaxed">
              Camps, drives and satsang programmes are announced here as they are
              confirmed. In the meantime, the SNCF office in Delhi can confirm what
              is running near you on{' '}
              <a href="tel:+911147660380" className="text-white underline underline-offset-4 hover:no-underline">
                011-47660380
              </a>
              .
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const Panel = event.href ? 'a' : 'div';
              return (
                <li key={event.id}>
                  <Panel
                    {...(event.href
                      ? { href: event.href, target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                    className={`h-full flex gap-4 rounded-3xl border border-white/15 bg-black/20 backdrop-blur-md p-5 transition-all duration-300 ${
                      event.href
                        ? 'group hover:bg-black/30 hover:border-white/30 hover:-translate-y-1 cursor-pointer'
                        : ''
                    }`}
                  >
                    <DateBlock date={event.date} />

                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-artistic-heading text-white font-bold text-[17px] leading-snug mb-2">
                          {event.title}
                        </h3>
                        {event.href && (
                          <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors flex-none mt-0.5" />
                        )}
                      </div>

                      <p className="flex items-center gap-1.5 text-[13px] text-white/75 mb-1">
                        <MapPin className="w-3.5 h-3.5 flex-none" />
                        <span className="truncate">{event.location}</span>
                      </p>

                      {event.time && (
                        <p className="flex items-center gap-1.5 text-[13px] text-white/75">
                          <Clock className="w-3.5 h-3.5 flex-none" />
                          {event.time}
                        </p>
                      )}

                      {event.blurb && (
                        <p className="font-artistic-serif text-[13px] text-white/70 leading-relaxed mt-2">
                          {event.blurb}
                        </p>
                      )}
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
