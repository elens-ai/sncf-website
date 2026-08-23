import React from 'react';
import { Award as AwardIcon, Medal } from 'lucide-react';
import { AWARDS } from '../data/awards';

/**
 * Awards and recognitions — the screen after upcoming events.
 *
 * Paints no background of its own; the page-wide .accent-canvas carries the
 * gradient so the colour continues unbroken from the screens above.
 *
 * The list is empty until real awards are supplied. The foundation's own
 * honours page presents them as photographs with no titles, awarding bodies,
 * years or alt text, so there was nothing to carry across, and award names
 * attributed to a real organisation are not something to guess at.
 */

export const AwardsSection: React.FC = () => (
  <section
    id="awards-section"
    aria-label="Awards and recognitions"
    className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-16 overflow-hidden"
  >
    <div className="relative z-10 w-full max-w-7xl mx-auto">
      <header className="mb-8 sm:mb-12">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
          Recognition
        </p>
        <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow">
          Awards &amp; recognitions
        </h2>
        <p className="font-artistic-serif text-white/80 text-[15px] sm:text-[17px] leading-relaxed mt-3 max-w-2xl">
          Your appreciation makes us stronger to serve humanity.
        </p>
      </header>

      {AWARDS.length === 0 ? (
        <div className="rounded-3xl border border-white/15 bg-black/20 backdrop-blur-md p-8 sm:p-10 max-w-2xl">
          <Medal className="w-6 h-6 text-white/70 mb-4" />
          <p className="font-artistic-serif text-white/95 text-[17px] leading-relaxed mb-2">
            The honours the foundation has received are being catalogued.
          </p>
          <p className="text-[14px] text-white/70 leading-relaxed">
            They are listed here with the conferring body and year as each is
            confirmed, so nothing appears without its source.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AWARDS.map((award) => (
            <li
              key={award.id}
              className="h-full rounded-3xl border border-white/15 bg-black/20 backdrop-blur-md p-5 transition-colors duration-300 hover:bg-black/30 hover:border-white/30"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <AwardIcon className="w-6 h-6 text-white/85 flex-none" />
                <span className="font-artistic-heading text-white/70 font-bold text-[13px] tracking-wider">
                  {award.year}
                </span>
              </div>

              <h3 className="font-artistic-heading text-white font-bold text-[17px] leading-snug mb-1.5">
                {award.title}
              </h3>

              <p className="text-[13px] text-white/75 leading-snug">{award.awardedBy}</p>

              {award.note && (
                <p className="font-artistic-serif text-[13px] text-white/65 leading-relaxed mt-2 pt-2 border-t border-white/10">
                  {award.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);
