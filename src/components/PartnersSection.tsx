import { resolveCMSMedia } from '../cms/media';
import { bindCMSValue, getCMSCopy } from '../cms/runtime';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ArrowRight, Plus, X, Handshake, Check } from 'lucide-react';
import { PARTNERS } from '../data/partners';
import { BRAND } from '../data/partnerBrand';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { UnSeal } from './UnAffiliation';
import { PartnerCircle } from './PartnerCircle';
import './recognition-partners.css';

interface PartnersSectionProps { onOpenDonate?: () => void; escapeSuspended?: boolean; }

function PartnerMark({ id, name }: { id: string; name: string }) {
  const brand = BRAND[id];
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [brand?.logo]);
  return <span className="collaboration-mark" style={{ '--brand-ink': brand?.color ?? '#24545a' } as React.CSSProperties} aria-hidden="true">
    {brand?.logo && !failed ? <img src={resolveCMSMedia(brand.logo)} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span>{brand?.initials ?? name.slice(0, 2)}</span>}
  </span>;
}

let PROOF = bindCMSValue(() => ([
  { value: '1.5M+', label: getCMSCopy("copy.PartnersSection.1eac70612fcd", "blood units") },
  { value: '2.6M+', label: getCMSCopy("copy.PartnersSection.5d8fee134d25", "trees planted") },
  { value: '263', label: getCMSCopy("copy.PartnersSection.34412c88d963", "stations cleaned") },
  { value: '209K+', label: getCMSCopy("copy.PartnersSection.dac4970ce624", "students") },
]), value => { PROOF = value; });

export const PartnersSection: React.FC<PartnersSectionProps> = ({ onOpenDonate, escapeSuspended = false }) => {
  useCMSRevision();
  const sectionRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLButtonElement>(null);
  const inView = useSectionActivity(sectionRef);
  const [shown, setShown] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seatOpen, setSeatOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [copied, setCopied] = useState(false);
  const selected = PARTNERS.find(p => p.id === selectedId) ?? PARTNERS[0];
  useEffect(() => { if (sectionRef.current) return onArrival(sectionRef.current, () => setShown(true)); }, []);
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
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (!q.has('partner-invite')) return;
    setOrgName((q.get('org') ?? '').slice(0, 60)); setSeatOpen(true);
    const timer = window.setTimeout(() => deskRef.current?.scrollIntoView({ block: 'center' }), 700);
    return () => clearTimeout(timer);
  }, []);
  const choose = (id: string) => {
    setSelectedId(id);
    if (matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      detailRef.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
    });
  };
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


  return <section ref={sectionRef} id="partners-section" className="collaboration-section" data-arrived={shown} data-active={inView} aria-label="Partners and CSR collaboration">
    <div className="continuity-art" aria-hidden="true"><i /><i /><span /></div>
    <div className="collaboration-heading">
      <div><p className="continuity-eyebrow"><span />{getCMSCopy('copy.PartnersSection.2e9686b783ba', 'Partnerships · CSR · Walking together')}</p>
        <h2>Together, <em>we make more possible.</em></h2>
      </div>
      <p className="collaboration-count"><strong>{String(PARTNERS.length).padStart(2, '0')}</strong><span>collaborations.{' '}<br />One shared purpose.</span></p>
    </div>
    <div className="collaboration-layout">
      <div className="collaboration-editorial">
        <p className="collaboration-intro">{getCMSCopy('copy.PartnersSection.intro', 'Working alongside organisations that share our commitment to people, communities and the planet.')}</p>
        {/* the foundation's UN standing, first among its partnerships */}
        <UnSeal variant="panel" className="collaboration-un" />
        {selected && <div ref={detailRef} className="collaboration-story">
          <div className="collaboration-story-heading"><PartnerMark id={selected.id} name={selected.name} /><span>A shared commitment</span></div>
          <div key={selected.id} className="collaboration-story-copy">
            <h3 tabIndex={-1}>{selected.name}</h3><p>{selected.contribution}</p>{selected.note && <p className="collaboration-note">{selected.note}</p>}
          </div>
          <span className="collaboration-story-index">{String(PARTNERS.indexOf(selected) + 1).padStart(2, '0')} / {String(PARTNERS.length).padStart(2, '0')}<span>Our partners in service</span></span>
        </div>}
        <button ref={joinRef} type="button" className="collaboration-join" onClick={revealDesk} aria-expanded={seatOpen} aria-controls="collaboration-desk"><Handshake size={18} />Become a partner<ArrowUpRight size={17} /></button>
        <p className="collaboration-join-note">There is a place for your organisation here.</p>
      </div>
      <div className="collaboration-directory">
        <p className="collaboration-directory-label">Walking with us<span>Select a logo to explore</span></p>
        {/* the partners around the foundation, by the field they worked in; its empty seat is the invitation */}
        <PartnerCircle partners={PARTNERS} selected={selected?.id} onChoose={choose} onJoin={revealDesk} />
        <p className="collaboration-directory-note"><span aria-hidden="true" />Many organisations. A common spirit of service.</p>
      </div>
    </div>
    {seatOpen && <div id="collaboration-desk" ref={deskRef} className="collaboration-desk">
      <button type="button" className="collaboration-close" aria-label="Close partnership invitation" onClick={closeDesk}><X size={18} /></button>
      <div><p className="continuity-eyebrow">The next chapter</p><h3>{orgName.trim() ? `An invitation to ${orgName.trim()}` : 'Let’s create something meaningful.'}</h3><p>Personalise a partnership invitation to share with your organisation.</p></div>
      <div className="collaboration-desk-form"><label htmlFor="partner-organisation">Organisation name</label><input id="partner-organisation" type="text" value={orgName} maxLength={60} onChange={e => setOrgName(e.target.value)} placeholder="Your organisation" />
        <div><button type="button" onClick={printBrochure}>Save brochure (PDF)<ArrowUpRight size={14} /></button><button type="button" onClick={copyInvite}>{copied ? <><Check size={14} />Link copied</> : <>Copy invite link<Plus size={14} /></>}</button></div>
        {onOpenDonate && <button type="button" className="continuity-text-link" onClick={onOpenDonate}>Start a conversation<ArrowRight size={16} /></button>}
      </div>
    </div>}
    <div className="collaboration-outcomes"><p>Our collective impact<span>Service that reaches further.</span></p><ul aria-label="Delivered outcomes">{PROOF.map((p, i) => <li key={p.label} data-pillar={['heal','empower','projects','enrich'][i]}><strong>{p.value}</strong><span>{p.label}</span></li>)}</ul></div>
    <p className="sr-only" role="status">{selectedId && selected ? `${selected.name}. ${selected.contribution}` : ''}{copied ? ' Partnership invitation link copied.' : ''}</p>
      {createPortal(
        <div id="partner-brochure" aria-hidden="true">
          <div className="pb-inkline">
            {['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'].map((ink) => (
              <span key={ink} style={{ background: ink }} />
            ))}
          </div>
          <p className="pb-eyebrow">{getCMSCopy("copy.PartnersSection.33760ea355b0", "Sant Nirankari Charitable Foundation · CSR Partnership")}</p>
          <h1 className="pb-title">{getCMSCopy("copy.PartnersSection.c243ca6c4682", "Walking together")}</h1>
          <p className="pb-invite">{getCMSCopy("copy.PartnersSection.9f0d1afadeed", "An invitation to ")}<strong>{orgName.trim() || 'your organisation'}</strong>
          </p>
          <p className="pb-lede">{getCMSCopy("copy.PartnersSection.b8f22d4fc6de", "Twelve organisations have put their name beside ours — governments, newsrooms, hospitals, institutes. Their CSR did not become a report. It became blood in a bank, a tree in a village, a girl in a classroom.")}</p>
          <div className="pb-proof">
            {[
              { value: '1.5M+', label: getCMSCopy("copy.PartnersSection.088d7a1f0e2d", "blood units collected") },
              { value: '2.6M+', label: getCMSCopy("copy.PartnersSection.5d8fee134d25", "trees planted") },
              { value: '263', label: getCMSCopy("copy.PartnersSection.673690e9221e", "railway stations cleaned") },
            ].map((pf) => (
              <div key={pf.label}>
                <span className="pb-proof-value">{pf.value}</span>
                <span className="pb-proof-label">{pf.label}</span>
              </div>
            ))}
          </div>
          <p className="pb-section">{getCMSCopy("copy.PartnersSection.18595f7a1a29", "Companions already walking with us")}</p>
          <ul className="pb-register">
            {PARTNERS.map((partner) => (
              <li key={partner.id} style={{ borderColor: BRAND[partner.id]?.color }}>
                <strong>{partner.name}</strong>
                <span>{partner.contribution}</span>
              </li>
            ))}
            <li className="pb-seat">
              <strong>{orgName.trim() || 'Your organisation'}</strong>
              <span>{getCMSCopy("copy.PartnersSection.fbebd4737aa7", "This space is reserved.")}</span>
            </li>
          </ul>
          <p className="pb-creds">{getCMSCopy("copy.PartnersSection.ec90341de6fc", "UN special consultative status · Registered charitable foundation, serving since 2010 · 250+ branches nationwide · Every figure from our published activity report")}</p>
          <p className="pb-contact">{getCMSCopy("copy.PartnersSection.553ce52fba22", "Sant Nirankari Charitable Foundation · Begin the conversation — the wall has room.")}</p>
        </div>,
        document.body,
      )}
  </section>;
};
