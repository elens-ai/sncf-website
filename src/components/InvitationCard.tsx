import { getCMSLink } from '../cms/links';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import React, { useEffect, useState } from 'react';
import { X, CalendarPlus, ArrowUpRight, Phone, Download, Infinity as InfinityIcon } from 'lucide-react';
import { renderPoster, downloadBlob } from '../utils/eventPoster';
import { ResolvedEvent } from '../utils/events';
import {
  MONTHS_SHORT,
  countdownLabel,
  icsHref,
  wrapCalendar,
  vevent,
  nowStamp,
} from '../utils/events';
import { PILLARS } from '../data/pillars';
import { PillarGlyph } from './CardIllustration';

/**
 * The invitation a scanned pass opens.
 *
 * A phone camera pointed at a pass's QR code lands here: the same event,
 * presented as a formal invitation card sized for a phone screen — pillar
 * colours as the ground, the vertical named and stamped with its own mark,
 * the date at poster size, and one-tap add-to-calendar. It also opens for
 * anyone following an ?invite= link directly.
 *
 * Dismissing it clears the ?invite parameter from the URL, so a reload or a
 * share of the address afterwards is the plain site, not a stuck invitation.
 */

interface InvitationCardProps {
  item: ResolvedEvent;
  onClose: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({ item, onClose }) => {
  const { event, date, days, accentA, accentB } = item;
  const pillar = PILLARS.find((p) => p.id === event.pillarId);
  const [printing, setPrinting] = useState(false);
  const poster = async () => {
    if (printing) return;
    setPrinting(true);
    try { downloadBlob(await renderPoster(item), `${event.id}-poster.png`); } catch (error) { console.warn('poster', error); }
    setPrinting(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      id="invitation-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation: ${event.title}`}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      style={{ background: `linear-gradient(160deg, ${accentA} 0%, ${accentB} 100%)` }}
      onClick={onClose}
    >
      {/* The lotus the hero carries, as the invitation's watermark. */}
      <img
        src={resolveCMSAsset("asset.InvitationCard.51c5d5f403d2", "/images/lotus-watermark.png")}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain opacity-[0.08] pointer-events-none select-none"
      />

      <div
        id="invitation-card"
        className="relative w-full max-w-[380px] md:max-w-[920px] my-auto rounded-[28px] backdrop-blur-xl border border-white/25 shadow-2xl overflow-hidden text-center md:grid md:grid-cols-[0.92fr_1.08fr] md:text-left"
        style={{
          /* Same graded volunteer-blue ink as the pass it was scanned from. */
          backgroundImage:
            'linear-gradient(172deg, rgba(42, 84, 179, 0.94) 0%, rgba(28, 62, 138, 0.95) 45%, rgba(16, 38, 92, 0.96) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={getCMSCopy("copy.InvitationCard.745148ba42e1", "Close invitation")}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-white/15 text-white/80 hover:text-white grid place-items-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="w-4 h-4" />
        </button>

        {/* The left leaf on a wide screen, the top of the card on a phone: the
            pillar's banner and the date at poster size. */}
        <div className="md:flex md:flex-col md:justify-between md:min-h-[520px]">
          <div
            className="px-6 pt-5 pb-4 md:pt-7 md:pb-6 md:text-left"
            style={{ background: `linear-gradient(120deg, ${accentA}, ${accentB})` }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-white/85 mb-2.5">{getCMSCopy("copy.InvitationCard.a01941bf3134", "Sant Nirankari Charitable Foundation")}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 shadow">
              <PillarGlyph pillarId={event.pillarId} className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-800">
                {pillar?.label ?? event.pillarId}
              </span>
            </div>
          </div>

          <div className="px-6 pt-5 md:px-8 md:pt-8 md:pb-8 md:flex-1 md:flex md:flex-col md:justify-center md:text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="font-signature text-white text-[26px] md:text-[34px] leading-none mb-4">{getCMSCopy("copy.InvitationCard.23eee5083ad7", "You are warmly invited")}</p>
            {event.kind === 'annual' && date ? (
              <>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1" style={{ color: accentB }}>
                  {date.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="font-artistic-heading font-bold text-white text-[64px] md:text-[132px] leading-none tabular-nums">
                  {date.getDate()}
                </p>
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-white/70 mt-1">
                  {MONTHS_SHORT[date.getMonth()]} {date.getFullYear()}
                  <span className="text-white/45"> · {countdownLabel(days as number).toLowerCase()}</span>
                </p>
              </>
            ) : (
              <p className="inline-flex items-center justify-center gap-2 font-artistic-heading font-bold text-white text-[28px] md:text-[44px]">
                <InfinityIcon className="w-6 h-6" />{getCMSCopy("copy.InvitationCard.f0ba2cd588e0", "Year-round")}</p>
            )}
          </div>
        </div>

        {/* The right leaf: the moment in words, and what to do about it. */}
        <div className="px-6 pt-4 pb-6 md:px-9 md:pt-10 md:pb-0 md:flex md:flex-col md:min-h-full">
          <h2 className="font-artistic-heading font-bold text-white text-[24px] md:text-[32px] leading-tight mt-2 mb-2 md:mt-6">
            {event.title}
          </h2>

          <p className="font-artistic-serif text-white/85 text-[14px] md:text-[15px] leading-relaxed mb-5">
            {event.blurb}
          </p>

          <div className="flex flex-col items-stretch gap-2 md:items-start">
            {event.kind === 'annual' && date && (
              <a
                href={icsHref(wrapCalendar(vevent(event, date, nowStamp())))}
                download={`${event.id}.ics`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-neutral-900 bg-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <CalendarPlus className="w-4 h-4" />{getCMSCopy("copy.InvitationCard.9d60f9126db7", "Add to my calendar")}</a>
            )}
            <button
              type="button"
              onClick={poster}
              disabled={printing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />{printing ? getCMSCopy("copy.InvitationCard.afc75f4b0552", "Preparing the poster…") : getCMSCopy("copy.InvitationCard.676166b956d1", "Download the poster")}</button>
            {event.href && (
              <a
                href={event.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-colors cursor-pointer"
              >{getCMSCopy("copy.InvitationCard.74fa7d10facc", "Take part")}<ArrowUpRight className="w-4 h-4" />
              </a>
            )}
            <a
              href={getCMSLink("copy.Link.InvitationCard.e3dc1a537132", "tel:+911147660380")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-0 rounded-full text-[12px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />{getCMSCopy("copy.InvitationCard.56a8d952ed9d", "Venue near you: 011-47660380")}</a>
          </div>

          <p className="font-signature text-white/85 text-[21px] md:text-[24px] leading-none mt-4 md:mt-auto md:pt-6">{getCMSCopy("copy.InvitationCard.56219e473693", "Service with Humility")}</p>

          {/* The planning table closes the card, as the reference poster's
              team closes its invitation — the supplied volunteer artwork,
              background keyed out so it sits straight on the card's ink,
              full-bleed to the foot. */}
          <div className="mt-3 -mx-6 -mb-6 md:-mx-9 md:mb-0 md:mt-4">
            <img
              src={resolveCMSAsset("asset.InvitationCard.76f684891a21", "/images/volunteers-planning.webp")}
              alt=""
              aria-hidden="true"
              className="w-full h-auto block select-none md:max-h-[200px] md:object-cover md:object-top"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
