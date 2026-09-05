import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PARTNERS } from '../data/partners';

/**
 * THE MEDIA WALL — the screen after awards, rebuilt as the backdrop of a
 * press conference: the foundation's own lockup headlining a white
 * step-and-repeat wall, the twelve companions' marks repeating across it
 * in offset rows, exactly the way launch events dress the stage their
 * announcements stand in front of.
 *
 * The step-and-repeat is not decoration — it is the interaction:
 *
 *   · POINT at any mark and every repetition of it lights up across the
 *     wall while the rest step back to grey — the wall answers the hand;
 *   · SELECT one and the CHYRON (the broadcast caption bar at the wall's
 *     foot) speaks its engraving: name, contribution, note;
 *   · the reserved "YOUR LOGO" tiles are woven into the pattern itself —
 *     selecting one turns the chyron into the ENDORSEMENT DESK: type a
 *     prospect's name (it appears on the wall's reserved tiles live),
 *     download the print brochure, or copy a personalised invite link;
 *   · a prospect opening that link lands here with the desk open and
 *     their name already on the wall.
 *
 * Idle, the chyron carries the proof figures — the wall never stops
 * saying what all this delivered.
 *
 * The section stands on its own fixed slate wash (the footer's sanctioned
 * translucent-tint pattern), so the white wall always reads against the
 * same considered ground whatever the hero is publishing.
 *
 * Partner data is verbatim from nirankarifoundation.org/our-partners/
 * (data/partners.ts). Marks are each organisation's own published icon,
 * used for factual attribution exactly as the foundation's own partners
 * page does; where no usable mark survives, a brand-ink monogram stands
 * in — and any mark that fails to load falls back to it live.
 */

interface PartnersSectionProps {
  /** Opens the donate/contact modal — the desk's escalation path. */
  onOpenDonate?: () => void;
  /** True while any site overlay is open. Escape then belongs to the
      overlay; the chyron must not collapse on the same keypress. */
  escapeSuspended?: boolean;
}

/** Display presentation per companion: wall wordmark (short), brand ink,
    mark, monogram fallback. KSCF, Blind Relief and EBAI publish no usable
    icon (two served CMS defaults, one's site is gone) — monograms. */
const BRAND: Record<
  string,
  { short: string; color: string; logo?: string; initials: string }
> = {
  un: { short: 'United Nations', color: '#009edb', logo: '/images/partners/un.png', initials: 'UN' },
  railways: { short: 'Indian Railways', color: '#c8102e', logo: '/images/partners/railways.png', initials: 'IR' },
  'red-cross': { short: 'Indian Red Cross', color: '#ed1b2e', logo: '/images/partners/red-cross.png', initials: 'RC' },
  'life-west': { short: 'Life West', color: '#0077c8', logo: '/images/partners/life-west.svg', initials: 'LW' },
  'urban-development': { short: 'Urban Development', color: '#2e3092', logo: '/images/partners/urban-development.png', initials: 'UD' },
  ksct: { short: 'KSCF', color: '#ee7623', initials: 'KS' },
  ndtv: { short: 'NDTV', color: '#e4002b', logo: '/images/partners/ndtv.png', initials: 'ND' },
  toi: { short: 'Times of India', color: '#bb0000', logo: '/images/partners/toi.png', initials: 'TOI' },
  niit: { short: 'NIIT', color: '#ed1c24', logo: '/images/partners/niit.png', initials: 'NT' },
  singer: { short: 'Singer India', color: '#d21f2f', logo: '/images/partners/singer.png', initials: 'SI' },
  'blind-relief': { short: 'Blind Relief Assn.', color: '#1b7a5a', initials: 'BR' },
  ebai: { short: 'Eye Bank Assn.', color: '#1273b8', initials: 'EB' },
};

/** THE PATTERN. A fixed interleaving of the twelve marks plus the reserved
    seat, stepped diagonally across offset rows the way a printed
    step-and-repeat cycles its sponsors. Deterministic — the wall must not
    reshuffle between visits. Stride 4 against a 13-long cycle guarantees
    no tile ever neighbours its own repetition horizontally or vertically.
    Every mark appears at least once; the reserved seat surfaces exactly
    once — one space on the wall, and it is spoken for or it is yours. */
const SEQ = [
  'un',
  'railways',
  'red-cross',
  'life-west',
  'urban-development',
  'ksct',
  'seat',
  'ndtv',
  'toi',
  'niit',
  'singer',
  'blind-relief',
  'ebai',
] as const;
const COLS = 6;
const ROWS = 4;
const WALL_ROWS: string[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => SEQ[(r * 4 + c) % SEQ.length]),
);

/** Each brand's FIRST cell on the wall. Only that repetition joins the tab
    order and speaks to assistive tech — 13 stops, not 24 identical ones;
    the echoes stay clickable but silent. */
const FIRST_AT: Record<string, string> = {};
WALL_ROWS.forEach((row, r) =>
  row.forEach((id, c) => {
    if (!(id in FIRST_AT)) FIRST_AT[id] = `${r}-${c}`;
  }),
);

/** Idle chyron: the proof line — what all of this delivered. */
const PROOF = [
  { value: '1.5M+', label: 'blood units' },
  { value: '2.6M+', label: 'trees planted' },
  { value: '263', label: 'stations cleaned' },
  { value: '209K+', label: 'students' },
];

export const PartnersSection: React.FC<PartnersSectionProps> = ({
  onOpenDonate,
  escapeSuspended = false,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  /** hovered brand — lights every repetition of one mark */
  const [litId, setLitId] = useState<string | null>(null);
  /** selected brand or 'seat' — owns the chyron */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [copied, setCopied] = useState(false);

  /* Entrance fires ONCE on a scroll-position check (the codebase's
     dominant idiom — IO rides the rendering pipeline and a throttled tab
     can hold it forever). Unbinds after firing. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let fired = false;
    const check = () => {
      if (fired) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.top < vh * 0.72 && r.bottom > vh * 0.28) {
        fired = true;
        el.dataset.entered = 'true';
        window.removeEventListener('scroll', check);
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  /* The personalised invitation landing: ?partner-invite=1&org=<name>.
     NOT ?invite-partner — App.tsx's tolerant event-invite regex
     ([?&]invite[-=]id) would swallow that spelling as an event id.
     Lands with the desk open and the name on the wall. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('partner-invite')) return;
    setSelectedId('seat');
    const org = q.get('org');
    if (org) setOrgName(org.slice(0, 60));
    const t = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ block: 'start' });
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  /* Releasing the chyron unmounts whatever held focus (the × button, the
     desk's input) — hand focus back to the released brand's primary wall
     tile so a keyboard user keeps their place instead of falling to body. */
  const closeChyron = () => {
    const id = selectedId;
    setSelectedId(null);
    if (!id) return;
    window.setTimeout(() => {
      sectionRef.current
        ?.querySelector<HTMLButtonElement>(`[data-brand="${id}"]`)
        ?.focus();
    }, 0);
  };
  const closeRef = useRef(closeChyron);
  closeRef.current = closeChyron;
  const suspendedRef = useRef(escapeSuspended);
  suspendedRef.current = escapeSuspended;

  /* Escape releases the chyron — unless an overlay owns the key. */
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !suspendedRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const inviteLink = () => {
    const u = new URL(window.location.origin + window.location.pathname);
    u.searchParams.set('partner-invite', '1');
    if (orgName.trim()) u.searchParams.set('org', orgName.trim());
    return u.toString();
  };
  const copyInvite = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(inviteLink());
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = inviteLink();
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    if (!ok) {
      /* both clipboard paths refused — hand the link over instead of
         claiming a copy that never happened */
      window.prompt('Copy this invite link:', inviteLink());
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };
  const printBrochure = () => window.print();

  const selected = PARTNERS.find((p) => p.id === selectedId) ?? null;
  const seatOpen = selectedId === 'seat';
  /* the wall lights the hovered brand, or holds the selected one */
  const activeId = litId ?? selectedId;

  return (
    <section
      ref={sectionRef}
      id="partners-section"
      aria-label="Partners and CSR collaboration"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-[84px] pb-6 overflow-hidden"
    >
      {/* the fixed slate ground the white wall stands against */}
      <div className="partner-backdrop" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center min-h-0">
        {/* the section's own eyebrow, above the wall */}
        <p className="font-artistic-display text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/60 mb-2 text-center">
          Partnerships · CSR · Walking together
        </p>

        {/* ==================== THE WALL ==================== */}
        <div
          className="media-wall"
          data-active={activeId ? 'true' : 'false'}
          role="group"
          aria-label="Partner media wall — select any mark to read that collaboration"
        >
          {/* the headline lockup — the wall belongs to the foundation */}
          <header className="media-wall-head">
            <div className="media-wall-inks" aria-hidden="true">
              {['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'].map((ink) => (
                <span key={ink} style={{ background: ink }} />
              ))}
            </div>
            <h2 className="media-wall-title">Sant Nirankari Charitable Foundation</h2>
            <p className="media-wall-motto font-dancing-script">Service with Humility</p>
          </header>

          {/* the step-and-repeat field */}
          <div className="media-wall-field">
            {WALL_ROWS.map((row, r) => (
              <div key={r} className="media-wall-row" data-offset={r % 2 === 1}>
                {row.map((id, c) => {
                  const isPrimary = FIRST_AT[id] === `${r}-${c}`;
                  if (id === 'seat') {
                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        className="wall-tile wall-tile-seat"
                        data-lit={activeId === 'seat'}
                        data-dim={!!activeId && activeId !== 'seat'}
                        data-brand={isPrimary ? 'seat' : undefined}
                        tabIndex={isPrimary ? 0 : -1}
                        aria-hidden={isPrimary ? undefined : true}
                        aria-label="Your organisation — reserve this space"
                        aria-pressed={seatOpen}
                        onMouseEnter={() => setLitId('seat')}
                        onMouseLeave={() => setLitId(null)}
                        onFocus={() => setLitId('seat')}
                        onBlur={() => setLitId(null)}
                        onClick={() => setSelectedId((cur) => (cur === 'seat' ? null : 'seat'))}
                      >
                        <span className="wall-tile-mark wall-tile-mark-seat" aria-hidden="true">
                          <span className="partner-seat-plus" />
                        </span>
                        <span className="wall-tile-name wall-tile-name-seat">
                          {orgName.trim() || 'Your logo'}
                        </span>
                      </button>
                    );
                  }
                  const partner = PARTNERS.find((p) => p.id === id)!;
                  const b = BRAND[id];
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className="wall-tile"
                      data-lit={activeId === id}
                      data-dim={!!activeId && activeId !== id}
                      data-brand={isPrimary ? id : undefined}
                      tabIndex={isPrimary ? 0 : -1}
                      aria-hidden={isPrimary ? undefined : true}
                      style={{ '--tile-ink': b?.color ?? '#333' } as React.CSSProperties}
                      aria-label={`${partner.name} — read this collaboration`}
                      aria-pressed={selectedId === id}
                      onMouseEnter={() => setLitId(id)}
                      onMouseLeave={() => setLitId(null)}
                      onFocus={() => setLitId(id)}
                      onBlur={() => setLitId(null)}
                      onClick={() => setSelectedId((cur) => (cur === id ? null : id))}
                    >
                      <span className="wall-tile-mark" aria-hidden="true">
                        <span className="wall-tile-initials font-artistic-display">
                          {b?.initials ?? partner.name.slice(0, 2)}
                        </span>
                        {b?.logo && (
                          <img
                            src={b.logo}
                            alt=""
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </span>
                      <span className="wall-tile-name">{b?.short ?? partner.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* the sponsor line at the wall's hem — the credentials */}
          <p className="media-wall-hem font-artistic-display">
            UN special consultative status · Serving since 2010 · 250+ branches
            nationwide · 12 collaborations, one space reserved
          </p>
        </div>

        {/* What the chyron shows, spoken once for assistive tech. A separate
            sr-only region rather than aria-live on the bar itself: the desk's
            input re-renders the bar per keystroke, and a live bar would
            narrate every letter. */}
        <div role="status" aria-live="polite" className="sr-only">
          {selected
            ? `${selected.name}. ${selected.contribution}${selected.note ? ` — ${selected.note}` : ''}`
            : seatOpen
              ? 'Endorsement desk open. Type a prospect organisation, save the brochure as PDF, or copy a personalised invite link.'
              : ''}
        </div>

        {/* ==================== THE CHYRON ==================== */}
        {/* the broadcast caption bar at the wall's foot: idle it carries the
            proof; selected it speaks the engraving; the seat turns it into
            the endorsement desk. Fixed height — the screen never grows. */}
        <div className="media-chyron" data-mode={selected ? 'partner' : seatOpen ? 'seat' : 'idle'}>
          {selected ? (
            <div key={selected.id} className="media-chyron-inner">
              <span
                className="wall-tile-mark media-chyron-mark"
                style={{ '--tile-ink': BRAND[selected.id]?.color ?? '#333' } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className="wall-tile-initials font-artistic-display">
                  {BRAND[selected.id]?.initials ?? selected.name.slice(0, 2)}
                </span>
                {BRAND[selected.id]?.logo && (
                  <img
                    src={BRAND[selected.id].logo}
                    alt=""
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="media-chyron-name font-artistic-heading">{selected.name}</p>
                <p className="media-chyron-line font-artistic-serif">
                  {selected.contribution}
                  {selected.note ? ` — ${selected.note}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="media-chyron-close"
                aria-label="Close"
                onClick={closeChyron}
              >
                ×
              </button>
            </div>
          ) : seatOpen ? (
            <div key="seat" className="media-chyron-inner">
              <div className="min-w-0 flex-1">
                <p className="media-chyron-name font-artistic-heading">
                  {orgName.trim() ? `Reserved for ${orgName.trim()}` : 'Your logo on this wall'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <input
                    type="text"
                    value={orgName}
                    maxLength={60}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Prospect organisation's name…"
                    aria-label="Prospect organisation's name"
                    className="media-chyron-input"
                  />
                  {/* honest label: this opens the print dialog, and
                      Save-as-PDF there is the download */}
                  <button type="button" onClick={printBrochure} className="partner-cta">
                    Save brochure (PDF)
                  </button>
                  <button type="button" onClick={copyInvite} className="partner-cta partner-cta-ghost">
                    {copied ? 'Link copied ✓' : 'Copy invite link'}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDonate}
                    className="font-artistic-display text-[9.5px] tracking-[0.16em] uppercase text-white/65 hover:text-white underline decoration-white/30 underline-offset-4 cursor-pointer"
                  >
                    Start a conversation
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="media-chyron-close"
                aria-label="Close"
                onClick={closeChyron}
              >
                ×
              </button>
            </div>
          ) : (
            <div key="idle" className="media-chyron-inner">
              <p className="media-chyron-live font-artistic-display" aria-hidden="true">
                <span />
                Delivered
              </p>
              <ul className="media-chyron-proof" aria-label="Delivered outcomes">
                {PROOF.map((p) => (
                  <li key={p.label}>
                    <strong className="font-artistic-heading">{p.value}</strong>
                    <span className="font-artistic-serif">{p.label}</span>
                  </li>
                ))}
              </ul>
              <p className="media-chyron-hint font-artistic-serif">
                Point at a mark — its every appearance lights. Select the
                dashed space to reserve yours.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* THE BROCHURE — print-only A4 via a body portal; "Download
          brochure" is window.print() and the browser's own Save-as-PDF. */}
      {createPortal(
        <div id="partner-brochure" aria-hidden="true">
          <div className="pb-inkline">
            {['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'].map((ink) => (
              <span key={ink} style={{ background: ink }} />
            ))}
          </div>
          <p className="pb-eyebrow">Sant Nirankari Charitable Foundation · CSR Partnership</p>
          <h1 className="pb-title">Walking together</h1>
          <p className="pb-invite">
            An invitation to <strong>{orgName.trim() || 'your organisation'}</strong>
          </p>
          <p className="pb-lede">
            Twelve organisations have put their name beside ours — governments,
            newsrooms, hospitals, institutes. Their CSR did not become a
            report. It became blood in a bank, a tree in a village, a girl in
            a classroom.
          </p>
          <div className="pb-proof">
            {[
              { value: '1.5M+', label: 'blood units collected' },
              { value: '2.6M+', label: 'trees planted' },
              { value: '263', label: 'railway stations cleaned' },
            ].map((pf) => (
              <div key={pf.label}>
                <span className="pb-proof-value">{pf.value}</span>
                <span className="pb-proof-label">{pf.label}</span>
              </div>
            ))}
          </div>
          <p className="pb-section">Companions already walking with us</p>
          <ul className="pb-register">
            {PARTNERS.map((partner) => (
              <li key={partner.id} style={{ borderColor: BRAND[partner.id]?.color }}>
                <strong>{partner.name}</strong>
                <span>{partner.contribution}</span>
              </li>
            ))}
            <li className="pb-seat">
              <strong>{orgName.trim() || 'Your organisation'}</strong>
              <span>This space is reserved.</span>
            </li>
          </ul>
          <p className="pb-creds">
            UN special consultative status · Registered charitable foundation,
            serving since 2010 · 250+ branches nationwide · Every figure from
            our published activity report
          </p>
          <p className="pb-contact">
            Sant Nirankari Charitable Foundation · Begin the conversation —
            the wall has room.
          </p>
        </div>,
        document.body,
      )}
    </section>
  );
};
