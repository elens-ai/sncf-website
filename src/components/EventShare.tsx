import React, { useEffect, useState } from 'react';
import { Check, Download, Facebook, Link2, Linkedin, Mail, Send, Share2 } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { type ResolvedEvent, icsHref, inviteUrl, nowStamp, vevent, wrapCalendar } from '../utils/events';
import { googleCalendarHref, outlookCalendarHref, shareHref, shareText, type ShareNetwork } from '../utils/eventShare';
import { ARTWORK, downloadBlob, renderArtwork, type ArtworkKind } from '../utils/eventPoster';
import './event-share.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.EventShare.${key}`, fallback);

const WhatsAppGlyph = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41Z" />
  </svg>
);
const XGlyph = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
  </svg>
);

const NETWORKS: { id: ShareNetwork; name: () => string; icon: React.ReactNode }[] = [
  { id: 'whatsapp', name: () => 'WhatsApp', icon: <WhatsAppGlyph /> },
  { id: 'facebook', name: () => 'Facebook', icon: <Facebook size={15} aria-hidden="true" /> },
  { id: 'x', name: () => 'X', icon: <XGlyph /> },
  { id: 'linkedin', name: () => 'LinkedIn', icon: <Linkedin size={15} aria-hidden="true" /> },
  { id: 'telegram', name: () => 'Telegram', icon: <Send size={14} aria-hidden="true" /> },
  { id: 'email', name: () => c('email', 'Email'), icon: <Mail size={15} aria-hidden="true" /> },
];
const KINDS: ArtworkKind[] = ['poster', 'story', 'banner'];

/** SHARE A MOMENT: the invitation sent on (the device's own share sheet where
    there is one, the networks, or its link copied), its date put into a
    calendar, and, where asked for, its artwork drawn on the spot. On a phone
    the artwork goes straight into the share sheet, ready for a status or a
    story; elsewhere it downloads. */
export const EventShare: React.FC<{ item: ResolvedEvent; when: string; artwork?: boolean; calendar?: boolean; className?: string }> = ({ item, when, artwork = false, calendar = true, className }) => {
  const { event, date } = item;
  const url = inviteUrl(event.id);
  const text = shareText(item, when);
  const [native, setNative] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<ArtworkKind | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setNative(typeof navigator.share === 'function'); }, []);
  useEffect(() => { setCopied(false); setFailed(false); }, [event.id]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); }
    catch {
      const field = Object.assign(document.createElement('textarea'), { value: url });
      field.style.cssText = 'position:fixed;opacity:0';
      document.body.append(field); field.select(); document.execCommand('copy'); field.remove();
    }
    setCopied(true);
  };
  const share = () => navigator.share({ title: event.title, text, url }).catch(() => undefined);
  const take = async (kind: ArtworkKind) => {
    if (busy) return;
    setBusy(kind); setFailed(false);
    try {
      const blob = await renderArtwork(item, kind);
      const file = new File([blob], `${event.id}-${kind}.png`, { type: 'image/png' });
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: event.title, text: `${text}\n${url}` }).catch(() => undefined);
      } else downloadBlob(blob, file.name);
    } catch { setFailed(true); }
    finally { setBusy(null); }
  };
  const google = googleCalendarHref(item, url);
  const outlook = outlookCalendarHref(item, url);
  const names: Record<ArtworkKind, string> = { poster: c('poster', 'Poster'), story: c('story', 'Story'), banner: c('banner', 'Banner') };

  return (
    <div className={`event-share${className ? ` ${className}` : ''}`}>
      <div className="event-share-row" role="group" aria-label={c('shareLabel', 'Share this moment')}>
        <span className="event-share-label">{c('share', 'Share')}</span>
        <span className="event-share-icons">
          {native && <button type="button" className="event-share-icon event-share-native" onClick={share} aria-label={c('native', 'Share from this device')} title={c('native', 'Share from this device')}><Share2 size={15} aria-hidden="true" /></button>}
          {NETWORKS.map(network => (
            <a key={network.id} className="event-share-icon" data-network={network.id} href={shareHref(network.id, url, event.title, text)}
              target={network.id === 'email' ? undefined : '_blank'} rel="noopener noreferrer" aria-label={`${c('on', 'Share on')} ${network.name()}`} title={network.name()}>
              {network.icon}
            </a>
          ))}
          <button type="button" className="event-share-icon" data-copied={copied} onClick={copy} aria-label={c('copy', 'Copy the invitation link')} title={c('copy', 'Copy the invitation link')}>
            {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
          </button>
        </span>
        <span className="event-share-toast" role="status" aria-live="polite">{copied ? c('copied', 'Link copied') : ''}</span>
      </div>
      {calendar && date && google && outlook && (
        <div className="event-share-row" role="group" aria-label={c('calendarLabel', 'Add the date to a calendar')}>
          <span className="event-share-label">{c('calendar', 'Calendar')}</span>
          <span className="event-share-chips">
            <a className="event-share-chip" href={google} target="_blank" rel="noopener noreferrer">Google</a>
            <a className="event-share-chip" href={outlook} target="_blank" rel="noopener noreferrer">Outlook</a>
            <a className="event-share-chip" href={icsHref(wrapCalendar(vevent(event, date, nowStamp())))} download={`${event.id}.ics`}>{c('ics', 'Apple · ICS')}</a>
          </span>
        </div>
      )}
      {artwork && (
        <div className="event-share-row" role="group" aria-label={c('artworkLabel', 'Artwork to share or print')}>
          <span className="event-share-label">{c('artwork', 'Artwork')}</span>
          <span className="event-share-chips">
            {KINDS.map(kind => (
              <button key={kind} type="button" className="event-share-chip" onClick={() => take(kind)} disabled={busy !== null} aria-busy={busy === kind}
                title={`${ARTWORK[kind].w} × ${ARTWORK[kind].h}`}>
                <Download size={12} aria-hidden="true" />{busy === kind ? c('preparing', 'Preparing…') : names[kind]}
              </button>
            ))}
          </span>
        </div>
      )}
      {failed && <p className="event-share-error" role="status">{c('failed', 'The artwork could not be prepared. Please try again.')}</p>}
    </div>
  );
};
