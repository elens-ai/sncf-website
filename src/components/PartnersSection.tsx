import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, getCMSCopy } from '../cms/runtime';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, X, Handshake } from 'lucide-react';
import { PARTNERS } from '../data/partners';
import { BRAND } from '../data/partnerBrand';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { PartnerCircle, partnerSectors, ringOrder, sectorOf } from './PartnerCircle';
import './recognition-partners.css';

interface PartnersSectionProps { escapeSuspended?: boolean; }

/* how long each partner is told while nobody points at one or has chosen one */
const TURN_MS = 3800;

function PartnerMark({ id, name }: { id: string; name: string }) {
  const brand = BRAND[id];
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [brand?.logo]);
  const [wide, setWide] = useState(false);
  return <span className="collaboration-mark" style={{ '--brand-ink': brand?.color ?? '#24545a' } as React.CSSProperties} aria-hidden="true">
    {brand?.logo && !failed ? <img src={resolveCMSMedia(brand.logo)} alt="" loading="lazy" decoding="async" data-wide={wide || undefined} onLoad={event => setWide(event.currentTarget.naturalWidth > event.currentTarget.naturalHeight * 1.8)} onError={() => setFailed(true)} /> : <span data-long={(brand?.initials ?? '').length > 3 || undefined}>{brand?.initials ?? name.slice(0, 2)}</span>}
  </span>;
}

let PROOF = bindCMSValue(() => ([
  { value: '1.5M+', label: getCMSCopy("copy.PartnersSection.1eac70612fcd", "blood units") },
  { value: '2.6M+', label: getCMSCopy("copy.PartnersSection.5d8fee134d25", "trees planted") },
  { value: '263', label: getCMSCopy("copy.PartnersSection.34412c88d963", "stations cleaned") },
  { value: '209K+', label: getCMSCopy("copy.PartnersSection.dac4970ce624", "students") },
]), value => { PROOF = value; });

export const PartnersSection: React.FC<PartnersSectionProps> = ({ escapeSuspended = false }) => {
  useCMSRevision();
  const sectionRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLButtonElement>(null);
  const inView = useSectionActivity(sectionRef);
  const [shown, setShown] = useState(false);
  /* The partner told beside the circle: one pointed at (or reached by
     keyboard), else the one chosen, else each in turn around the circle. */
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [turn, setTurn] = useState(0);
  /* someone is reading the card (pointing at it, or in it by keyboard): the turn waits for them */
  const [reading, setReading] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const order = ringOrder(PARTNERS);
  const told = hovered ?? pinned ?? order[turn % Math.max(1, order.length)]?.id ?? null;
  const selected = PARTNERS.find(p => p.id === told) ?? PARTNERS[0];
  const chosen = PARTNERS.find(p => p.id === pinned);
  const sectorById = Object.fromEntries(partnerSectors().map(s => [s.id, s]));
  useEffect(() => { if (sectionRef.current) return onArrival(sectionRef.current, () => setShown(true)); }, []);
  useEffect(() => {
    if (pinned || hovered || reading || !inView || order.length < 2) return;
    const timer = window.setTimeout(() => setTurn(t => (t + 1) % order.length), TURN_MS);
    return () => window.clearTimeout(timer);
  }, [turn, pinned, hovered, reading, inView, order.length]);
  const hover = (id: string | null) => {
    setHovered(id);
    /* the turn goes on from the partner last pointed at */
    const at = id ? order.findIndex(p => p.id === id) : -1;
    if (at >= 0) setTurn(at);
  };
  const revealDesk = () => {
    setSeatOpen(true);
    requestAnimationFrame(() => {
      deskRef.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      deskRef.current?.querySelector('input')?.focus({ preventScroll: true });
    });
  };
  const closeDesk = () => { setSeatOpen(false); requestAnimationFrame(() => joinRef.current?.focus({ preventScroll: true })); };
  useEffect(() => {
    if (!seatOpen || escapeSuspended) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDesk(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seatOpen, escapeSuspended]);
  /* a link made for an organisation opens the desk with its name in it */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (!q.has('partner-invite')) return;
    setOrgName((q.get('org') ?? '').slice(0, 60)); setSeatOpen(true);
    const timer = window.setTimeout(() => deskRef.current?.scrollIntoView({ block: 'center' }), 700);
    return () => clearTimeout(timer);
  }, []);
  /* choosing a partner keeps it told; choosing it again lets the turn go on from it */
  const choose = (id: string) => {
    const next = pinned === id ? null : id;
    setPinned(next);
    const at = order.findIndex(p => p.id === id);
    if (at >= 0) setTurn(at);
    if (next && matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      detailRef.current?.querySelector<HTMLElement>('[data-current="true"] h3')?.focus({ preventScroll: true });
    });
  };
  /* the conversation starts in the visitor's own email, addressed to the foundation, with their organisation's name in it */
  const email = getCMSCopy('copy.PartnersSection.partner-email', 'sncf@nirankarifoundation.org');
  const org = orgName.trim();
  const mailto = `mailto:${email}?subject=${encodeURIComponent(org ? `Partnership enquiry: ${org}` : 'Partnership enquiry')}&body=${encodeURIComponent(`Hello,\n\n${org ? `We at ${org} would` : 'We would'} like to explore a partnership with the Sant Nirankari Charitable Foundation.\n\n`)}`;

  return <section ref={sectionRef} id="partners-section" className="collaboration-section" data-arrived={shown} data-active={inView} aria-label="Partners and CSR collaboration">
    <div className="continuity-art" aria-hidden="true"><i /><i /><span /></div>
    <div className="collaboration-heading">
      <div><p className="continuity-eyebrow"><span />{getCMSCopy('copy.PartnersSection.2e9686b783ba', 'Partnerships · CSR · Walking together')}</p>
        <h2>Together, <em>we make more possible.</em></h2>
      </div>
    </div>
    <div className="collaboration-layout">
      <div className="collaboration-editorial">
        <p className="collaboration-intro">{getCMSCopy('copy.PartnersSection.intro', 'Working alongside organisations that share our commitment to people, communities and the planet.')}</p>
        {/* the partner being told: its cornerstone, what was done together, and its website. Every partner's words lie
            in the same place, unseen but the one being told, so the card is as tall as the longest and nothing around
            it moves as the partners take their turns. */}
        {selected && <aside ref={detailRef} className="collaboration-partner"
          onPointerEnter={() => setReading(true)} onPointerLeave={() => setReading(false)}
          onFocus={() => setReading(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setReading(false); }}>
          <PartnerMark id={selected.id} name={selected.name} />
          <div className="collaboration-partner-stack">
            {order.map(partner => {
              const sector = sectorById[sectorOf(partner.id)];
              const current = partner.id === selected.id;
              return <div key={partner.id} className="collaboration-partner-copy" data-current={current} aria-hidden={!current || undefined} style={{ '--sector': sector?.ink ?? '#8dd4df' } as React.CSSProperties}>
                {sector && <p className="collaboration-partner-kicker">{sector.name}</p>}
                <h3 tabIndex={-1}>{partner.name}</h3>
                <p>{partner.contribution}</p>
                {partner.note && <p className="collaboration-note">{partner.note}</p>}
                {partner.href && <a className="collaboration-partner-link" href={partner.href} target="_blank" rel="noopener noreferrer">
                  {getCMSCopy('copy.PartnersSection.visit', 'Visit their website')}<ArrowUpRight size={14} aria-hidden="true" />
                </a>}
              </div>;
            })}
          </div>
        </aside>}
        <button ref={joinRef} type="button" className="collaboration-join" onClick={revealDesk} aria-expanded={seatOpen} aria-controls="collaboration-desk"><Handshake size={18} />Become a partner<ArrowUpRight size={17} /></button>
        <p className="collaboration-join-note">There is a place for your organisation here.</p>
      </div>
      <div className="collaboration-directory">
        <p className="collaboration-directory-label"><span>Select a logo to explore</span></p>
        {/* the partners around the foundation, by the cornerstone they served; its empty seat is the invitation */}
        <PartnerCircle partners={PARTNERS} shown={selected?.id} pinned={pinned} onChoose={choose} onHover={hover} onJoin={revealDesk} />
      </div>
    </div>
    {seatOpen && <div id="collaboration-desk" ref={deskRef} className="collaboration-desk">
      <button type="button" className="collaboration-close" aria-label="Close partnership invitation" onClick={closeDesk}><X size={18} /></button>
      <div><p className="continuity-eyebrow">The next chapter</p><h3>{org ? `An invitation to ${org}` : 'Let’s create something meaningful.'}</h3><p>Tell us your organisation’s name and write to us at <a href={`mailto:${email}`}>{email}</a>. We will take it from there.</p></div>
      <div className="collaboration-desk-form"><label htmlFor="partner-organisation">Organisation name</label><input id="partner-organisation" type="text" value={orgName} maxLength={60} onChange={e => setOrgName(e.target.value)} placeholder="Your organisation" />
        <a className="continuity-text-link" href={mailto}>Start a conversation<ArrowRight size={16} /></a>
      </div>
    </div>}
    <div className="collaboration-outcomes"><p>Our collective impact<span>Service that reaches further.</span></p><ul aria-label="Delivered outcomes">{PROOF.map((p, i) => <li key={p.label} data-pillar={['heal','empower','projects','enrich'][i]}><strong>{p.value}</strong><span>{p.label}</span></li>)}</ul></div>
    <p className="sr-only" role="status">{chosen ? `${chosen.name}. ${chosen.contribution}` : ''}</p>
  </section>;
};
