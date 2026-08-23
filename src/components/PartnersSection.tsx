import React from 'react';
import { Handshake } from 'lucide-react';
import { PARTNERS } from '../data/partners';

/**
 * Supports and collaborations — the screen after awards.
 *
 * Paints no background of its own; the page-wide .accent-canvas carries the
 * gradient so the colour continues unbroken from the screens above.
 *
 * Unlike the events and awards screens this one ships full, because the
 * foundation's partners page states every organisation and what each
 * collaboration delivered — real text to carry across rather than a blank to
 * fill in.
 */

export const PartnersSection: React.FC = () => (
  <section
    id="partners-section"
    aria-label="Partners"
    className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-16 overflow-hidden"
  >
    <div className="relative z-10 w-full max-w-7xl mx-auto">
      <header className="mb-8 sm:mb-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
          Supports and collaborations
        </p>
        <h2 className="font-artistic-heading text-white text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow">
          Partners
        </h2>
        <p className="font-artistic-serif text-white/85 text-[15px] sm:text-[17px] leading-relaxed mt-3 max-w-3xl">
          SNCF has carried out humanitarian initiatives and projects alongside
          government bodies and other philanthropic organisations, for a wider and
          more effective outreach.
        </p>
      </header>

      {/* Three columns at desktop keeps all twelve on one screen without the
          panels turning into slivers. */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((partner) => (
          <li
            key={partner.id}
            className="rounded-2xl border border-white/15 bg-black/20 backdrop-blur-md p-4 transition-colors duration-300 hover:bg-black/30 hover:border-white/30"
          >
            <div className="flex items-start gap-2.5">
              <Handshake className="w-4 h-4 text-white/60 flex-none mt-1" />
              <div className="min-w-0">
                <h3 className="font-artistic-heading text-white font-bold text-[15px] leading-snug mb-1">
                  {partner.name}
                </h3>
                <p className="font-artistic-serif text-[13px] text-white/80 leading-relaxed">
                  {partner.contribution}
                </p>
                {partner.note && (
                  <p className="text-[12px] text-white/60 leading-relaxed mt-1.5">
                    {partner.note}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
