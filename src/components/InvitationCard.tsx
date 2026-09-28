import { getCMSLink } from '../cms/links';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useState } from 'react';
import { X, CalendarPlus, ArrowUpRight, Phone, Download, Music, FileImage, QrCode, CalendarDays, BadgeCheck, Infinity as InfinityIcon } from 'lucide-react';
import { renderArtwork, eventQr, ARTWORK, type ArtworkKind } from '../utils/eventPoster';
import { ResolvedEvent, MONTHS_SHORT, countdownLabel, icsHref, wrapCalendar, vevent, nowStamp } from '../utils/events';
import { PILLARS } from '../data/pillars';
import { PillarGlyph } from './CardIllustration';
import { FoilStroke } from './FoilStroke';
import { OdometerStatCounter } from './OdometerStatCounter';
import './invitation.css';
const c = (key: string, fallback: string) => getCMSCopy(`copy.InvitationCard.${key}`, fallback);

/**
 * THE INVITATION — what a scanned pass opens.
 *
 * A phone camera pointed at a pass's QR code lands here: the moment as a
 * page on the site's own dark ground — its date on a foil plate in its
 * pillar's colour, the day rolling in, the words beside it, one-tap
 * add-to-calendar — and beneath, THE KIT: everything to take away or
 * share. The poster, banner and story are drawn on the spot (so they
 * always carry the right date), the pass is the code itself, the calendar
 * file, the foundation's anthem to play or keep, and the logo for print.
 *
 * Dismissing it clears the ?invite parameter from the URL, so a reload or a
 * share of the address afterwards is the plain site, not a stuck invitation.
 */
interface InvitationCardProps {
  item: ResolvedEvent;
  onClose: () => void;
}

const KINDS: ArtworkKind[] = ['poster', 'banner', 'story'];

export const InvitationCard: React.FC<InvitationCardProps> = ({ item, onClose }) => {
  const { event, date, days, accentA, accentB } = item;
  const pillar = PILLARS.find((p) => p.id === event.pillarId);
  /* The artwork, drawn once the invitation is open; object URLs, revoked on close. */
  const [art, setArt] = useState<Partial<Record<ArtworkKind, string>>>({});
  const [pass, setPass] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    const urls: string[] = [];
    eventQr(event.id, accentA).then(url => { if (live) setPass(url); }).catch(() => undefined);
    (async () => {
      for (const kind of KINDS) {
        try {
          const blob = await renderArtwork(item, kind);
          if (!live) return;
          const url = URL.createObjectURL(blob); urls.push(url);
          setArt(current => ({ ...current, [kind]: url }));
        } catch (error) { console.warn(kind, error); }
      }
    })();
    return () => { live = false; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const anthem = resolveCMSMedia(resolveCMSAsset("asset.AnthemPlayer.bf1bfa524baa", "/media/sncf-anthem-instrumental-v1.2.mp3"));
  const logo = resolveCMSMedia(resolveCMSAsset("asset.InvitationCard.logo", "/images/sncf-logo.webp"));
  const ics = date ? icsHref(wrapCalendar(vevent(event, date, nowStamp()))) : null;
  const artLabel: Record<ArtworkKind, [string, string]> = {
    poster: [c('poster', 'Poster'), c('posterMeta', 'Portrait · 1080 × 1350 · PNG')],
    banner: [c('banner', 'Banner'), c('bannerMeta', 'Landscape · 1600 × 900 · PNG')],
    story: [c('story', 'Story'), c('storyMeta', 'Portrait · 1080 × 1920 · PNG')],
  };

  return (
    <div
      id="invitation-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation: ${event.title}`}
      className="invite-stage"
      style={{ '--event-ink': accentA, '--event-tint': accentB } as React.CSSProperties}
      onClick={onClose}
    >
      <img src={resolveCMSAsset("asset.InvitationCard.51c5d5f403d2", "/images/lotus-watermark.png")} alt="" aria-hidden="true" className="invite-watermark" />
      <div className="invite-motes" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>

      <div id="invitation-card" className="invite-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label={c('745148ba42e1', 'Close invitation')} className="invite-close"><X size={16} /></button>

        <header className="invite-head">
          <p className="invite-foundation">{c('a01941bf3134', 'Sant Nirankari Charitable Foundation')}</p>
          <span className="invite-pillar"><PillarGlyph pillarId={event.pillarId} className="invite-pillar-glyph" />{pillar?.label ?? event.pillarId}</span>
        </header>

        <div className="invite-body">
          <div className="invite-plate" aria-hidden="true">
            <FoilStroke id="invite-plate" className="invite-plate-art" />
            <span className="invite-plate-frame" />
            <div className="invite-plate-face">
              {event.kind === 'annual' && date ? (
                <>
                  <span className="invite-plate-line">{date.toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                  <strong className="invite-plate-day"><OdometerStatCounter value={String(date.getDate())} duration={900} /></strong>
                  <span className="invite-plate-line">{MONTHS_SHORT[date.getMonth()]} {date.getFullYear()}</span>
                  <span className="invite-plate-count">{countdownLabel(days as number)}</span>
                </>
              ) : (
                <span className="invite-plate-forever"><InfinityIcon size={40} strokeWidth={1.4} /><span className="invite-plate-line">{c('f0ba2cd588e0', 'Year-round')}</span></span>
              )}
            </div>
          </div>

          <div className="invite-words">
            <p className="invite-script">{c('23eee5083ad7', 'You are warmly invited')}</p>
            <h2>{event.title}</h2>
            <p className="invite-blurb">{event.blurb}</p>
            <div className="invite-actions">
              {ics && <a href={ics} download={`${event.id}.ics`} className="invite-primary"><CalendarPlus size={16} />{c('9d60f9126db7', 'Add to my calendar')}</a>}
              {event.href && <a href={event.href} target="_blank" rel="noopener noreferrer" className="invite-secondary">{c('74fa7d10facc', 'Take part')}<ArrowUpRight size={15} /></a>}
              <a href={getCMSLink("copy.Link.InvitationCard.e3dc1a537132", "tel:+911147660380")} className="invite-phone"><Phone size={13} />{c('56a8d952ed9d', 'Venue near you: 011-47660380')}</a>
            </div>
            <p className="invite-signature font-signature">{c('56219e473693', 'Service with Humility')}</p>
          </div>
        </div>

        <section className="invite-kit" aria-labelledby="invite-kit-title">
          <div className="invite-kit-head">
            <p className="invite-kicker">{c('kitKicker', 'Take it with you')}</p>
            <h3 id="invite-kit-title">{c('kitTitle', 'Poster, banner, story, pass — and the anthem')}</h3>
            <p>{c('kitLead', "Everything to share or print, in the moment's own colours. The artwork is drawn the moment you open this, so it always carries the right date.")}</p>
          </div>
          <ul className="invite-kit-grid">
            {KINDS.map(kind => (
              <li key={kind} className={`invite-kit-item invite-kit-${kind}`} data-ready={!!art[kind]}>
                <span className="invite-kit-preview" style={{ aspectRatio: `${ARTWORK[kind].w} / ${ARTWORK[kind].h}` } as React.CSSProperties}>
                  {art[kind] ? <img src={art[kind]} alt={`${artLabel[kind][0]} — ${event.title}`} /> : <span className="invite-kit-drawing"><FileImage size={22} strokeWidth={1.5} />{c('drawing', 'Drawing…')}</span>}
                </span>
                <span className="invite-kit-name">{artLabel[kind][0]}</span>
                <span className="invite-kit-meta">{artLabel[kind][1]}</span>
                <a className="invite-kit-get" href={art[kind] ?? '#'} download={`${event.id}-${kind}.png`} aria-disabled={!art[kind]} onClick={e => { if (!art[kind]) e.preventDefault(); }}><Download size={13} />{c('download', 'Download')}</a>
              </li>
            ))}
            <li className="invite-kit-item invite-kit-pass" data-ready={!!pass}>
              <span className="invite-kit-preview invite-kit-square">{pass ? <img src={pass} alt={c('passAlt', 'The QR code of this invitation')} className="invite-kit-qr" /> : <span className="invite-kit-drawing"><QrCode size={22} strokeWidth={1.5} /></span>}</span>
              <span className="invite-kit-name">{c('pass', 'Pass')}</span>
              <span className="invite-kit-meta">{c('passMeta', 'QR code · PNG')}</span>
              <a className="invite-kit-get" href={pass ?? '#'} download={`${event.id}-pass.png`} aria-disabled={!pass} onClick={e => { if (!pass) e.preventDefault(); }}><Download size={13} />{c('download', 'Download')}</a>
            </li>
            {ics && (
              <li className="invite-kit-item invite-kit-file" data-ready="true">
                <span className="invite-kit-preview invite-kit-square invite-kit-icon"><CalendarDays size={34} strokeWidth={1.3} /></span>
                <span className="invite-kit-name">{c('calendar', 'Calendar')}</span>
                <span className="invite-kit-meta">{c('calendarMeta', 'Add the date · ICS')}</span>
                <a className="invite-kit-get" href={ics} download={`${event.id}.ics`}><Download size={13} />{c('download', 'Download')}</a>
              </li>
            )}
            <li className="invite-kit-item invite-kit-audio" data-ready="true">
              <span className="invite-kit-preview invite-kit-square invite-kit-icon"><Music size={34} strokeWidth={1.3} /></span>
              <span className="invite-kit-name">{c('anthem', 'Anthem')}</span>
              <span className="invite-kit-meta">{c('anthemMeta', 'The SNCF anthem · MP3')}</span>
              <audio className="invite-kit-player" controls preload="none" src={anthem} aria-label={c('anthemMeta', 'The SNCF anthem · MP3')} />
              <a className="invite-kit-get" href={anthem} download="sncf-anthem-instrumental-v1.2.mp3"><Download size={13} />{c('download', 'Download')}</a>
            </li>
            <li className="invite-kit-item invite-kit-file" data-ready="true">
              <span className="invite-kit-preview invite-kit-square invite-kit-icon"><img src={logo} alt="" className="invite-kit-logo" /></span>
              <span className="invite-kit-name">{c('logo', 'Logo')}</span>
              <span className="invite-kit-meta">{c('logoMeta', 'Foundation logo · WebP')}</span>
              <a className="invite-kit-get" href={logo} download="sncf-logo.webp"><Download size={13} />{c('download', 'Download')}</a>
            </li>
          </ul>
          <p className="invite-kit-note"><BadgeCheck size={13} />{c('kitNote', 'Share freely — the pass on every piece opens this same invitation.')}</p>
        </section>
      </div>
    </div>
  );
};
