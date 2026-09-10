import React, { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Building2, Check, ChevronDown, Heart, HeartHandshake, Landmark, Mail, MapPin, Phone, Sprout, Users, X } from 'lucide-react';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSCopy } from '../cms/runtime';
import { getCMSLink } from '../cms/links';
import { getSiteSettings } from '../cms/siteSettings';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './donation.css';
import { ContributionDialog } from './ContributionDialog';

const c = (key: string, fallback: string) => getCMSCopy(`copy.DonationExperience.${key}`, fallback);
const CAUSES = ['all', 'heal', 'enrich', 'empower'] as const;
const CAUSE_ICONS = [HeartHandshake, Heart, BookOpen, Sprout];
const DONORS = ['individual', 'company', 'organisation'] as const;
const DONOR_ICONS = [Users, Building2, Landmark];

/** An enquiry planner; never presents an unconnected payment action as a checkout. */
export function DonationExperience({ page = false, onClose }: { page?: boolean; onClose?: () => void }) {
  useCMSRevision();
  const root = useRef<HTMLDivElement>(null);
  const active = useSectionActivity(root);
  const uid = useId();
  const [formOpen, setFormOpen] = useState(false);
  const [cause, setCause] = useState<typeof CAUSES[number]>('all');
  const [donor, setDonor] = useState<typeof DONORS[number]>('individual');
  const [kind, setKind] = useState<'gift' | 'time'>('gift');
  const [nonMonetary, setNonMonetary] = useState('volunteer');
  const [offer, setOffer] = useState('');
  const [step, setStep] = useState(1);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const site = getSiteSettings();
  const pillar = PILLARS.find(p => p.id === cause);
  const impact = ACTIVITIES.find(a => a.pillarId === cause);
  const ink = pillar?.accentA ?? '#256c50';
  const light = pillar?.accentB ?? '#96cbaa';
  const causeLabel = (value: typeof CAUSES[number]) => value === 'all' ? c('whereNeeded', 'Where needed most') : PILLARS.find(p => p.id === value)!.label;
  const donorLabels = [c('individual', 'Individual'), c('company', 'Corporate'), c('organisation', 'Society / foundation')];
  const nonMonetaryLabels = { volunteer: c('volunteer', 'Volunteer time'), talent: c('talent', 'Fundraise through talent'), resources: c('resources', 'Resources or equipment') };
  const contributionURL = '/contribute';
  const emailBody = [c('emailGreeting', 'Hello SNCF accounts team,'), '', c('emailIntro', 'I would like to discuss a contribution to the foundation.'), `${c('givingAs', 'Giving as')}: ${donorLabels[DONORS.indexOf(donor)]}`, `${c('preferredCause', 'Preferred cause')}: ${causeLabel(cause)}`, kind === 'gift' ? c('financialGift', 'A financial gift') : `${nonMonetaryLabels[nonMonetary as keyof typeof nonMonetaryLabels]}: ${offer.trim() || c('discussOptions', 'I would like to discuss the options.')}`, '', c('emailRequest', 'Please guide me on the next steps and any applicable documentation.'), '', c('emailThanks', 'Thank you.')].join('\n');
  const emailHref = `mailto:${site.contact.email}?subject=${encodeURIComponent(c('emailSubject', 'An enquiry about contributing to SNCF'))}&body=${encodeURIComponent(emailBody)}`;
  const changeStep = (next: number) => { setStep(next); requestAnimationFrame(() => { stepTitle.current?.focus({ preventScroll: true }); stepTitle.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' }); }); };
  const Heading = page ? 'h1' : 'h2';

  return <div ref={root} data-active={active} className="donation-experience" style={{ '--give-ink': ink, '--give-light': light } as React.CSSProperties}>
    {formOpen && <ContributionDialog onClose={() => setFormOpen(false)} />}
    {onClose && <button type="button" className="donation-close" aria-label={c('close', 'Close contribution planner')} onClick={onClose}><X size={20} /></button>}
    <div className="donation-story">
      <p className="donation-eyebrow"><span />{c('eyebrow', 'Generosity, made personal')}</p>
      <Heading>{c('headline', 'A little care.')}<br /><em>{c('headlineScript', 'A lasting difference.')}</em></Heading>
      <p className="donation-intro">{c('intro', 'There is more than one way to give. Help care reach a doorstep, open a classroom, or bring a community together.')}</p>
      <div className="donation-bloom" aria-hidden="true">
        <div className="donation-bloom-orbit" /><span className="donation-petal donation-petal-heal" data-selected={cause === 'heal' || cause === 'all'} /><span className="donation-petal donation-petal-enrich" data-selected={cause === 'enrich' || cause === 'all'} /><span className="donation-petal donation-petal-empower" data-selected={cause === 'empower' || cause === 'all'} />
        <div className="donation-bloom-heart"><HeartHandshake size={36} strokeWidth={1.2} /></div>
        <span className="donation-bloom-caption">{c('bloomCaption', 'One shared purpose.')}</span>
      </div>
      <div className="donation-impact" aria-live="polite" aria-atomic="true">
        {impact ? <div key={cause}><span className="donation-eyebrow">{c('reportedImpact', 'Reported programme impact')}</span><strong>{impact.headline.value}</strong><p>{impact.headline.label} · {impact.title}</p><small>{impact.period}</small></div>
          : <div><span className="donation-eyebrow">{c('sharedPurpose', 'Heal · Enrich · Empower')}</span><strong className="donation-impact-purpose">{c('service', 'Service with humility.')}</strong><p>{c('purposeBody', 'Your generosity. Our shared commitment to care.')}</p></div>}
      </div>
      <div className="donation-story-foot"><Heart size={14} /><span>{c('inclusive', 'For everyone. With compassion. Always.')}</span></div>
    </div>
    <div className="donation-planner">
      <div className="donation-stepper" aria-label={c('steps', 'Contribution enquiry steps')}><span aria-current={step === 1 ? 'step' : undefined}><i>{step === 2 ? <Check size={12} /> : '01'}</i>{c('personalise', 'Make it personal')}</span><b /><span aria-current={step === 2 ? 'step' : undefined}><i>02</i>{c('connect', 'Let’s connect')}</span></div>
      <div className="donation-step-content" key={step}>
        <h2 ref={stepTitle} tabIndex={-1} className="donation-planner-title">{step === 1 ? c('plannerTitle', 'How would you like to help?') : c('reviewTitle', 'A conversation starts here.')}</h2>
        <p className="donation-planner-intro">{step === 1 ? c('plannerIntro', 'Choose what feels right. We’ll help with the next step.') : c('reviewIntro', 'Review your preferences, then continue with your contribution.')}</p>
        {step === 1 ? <form onSubmit={e => { e.preventDefault(); if (kind === 'gift') { setFormOpen(true); } else changeStep(2); }}>
          <fieldset className="donation-field"><legend>{c('givingAs', 'Giving as')}</legend><div className="donation-donors">{DONORS.map((value, i) => { const Icon = DONOR_ICONS[i]; return <label key={value}><input type="radio" name={`${uid}-donor`} value={value} checked={donor === value} onChange={() => setDonor(value)} /><span><Icon size={17} />{donorLabels[i]}</span></label>; })}</div></fieldset>
          <fieldset className="donation-field"><legend>{c('causeTitle', 'What speaks to you?')}<small>{c('causeOptional', 'A preference, not a restriction')}</small></legend><div className="donation-causes">{CAUSES.map((value, i) => { const Icon = CAUSE_ICONS[i]; return <label key={value}><input type="radio" name={`${uid}-cause`} value={value} checked={cause === value} onChange={() => setCause(value)} /><span><Icon size={20} strokeWidth={1.5} /><span>{causeLabel(value)}</span><i>{cause === value && <Check size={12} />}</i></span></label>; })}</div></fieldset>
          <fieldset className="donation-field"><legend>{c('contributionTitle', 'I’d like to contribute')}</legend><div className="donation-kind">{(['gift','time'] as const).map(value => <label key={value}><input type="radio" name={`${uid}-kind`} checked={kind === value} onChange={() => setKind(value)} /><span>{value === 'gift' ? c('financialGift', 'A financial gift') : c('timeSkills', 'A non-monetary gift')}</span></label>)}</div></fieldset>
          {kind === 'time' && <><fieldset className="donation-field"><legend>{c('nonMonetaryTitle', 'Ways to give')}</legend><div className="donation-donors">{Object.entries(nonMonetaryLabels).map(([value, label]) => <label key={value}><input type="radio" name={`${uid}-nonmonetary`} checked={nonMonetary === value} onChange={() => setNonMonetary(value)} /><span>{label}</span></label>)}</div></fieldset><label className="donation-field donation-offer">{c('offerTitle', 'Tell us about your contribution')}<textarea rows={3} maxLength={500} value={offer} onChange={e => setOffer(e.target.value)} placeholder={c('offerPlaceholder', 'For example: teaching, organising events or sharing a professional skill…')} /><small>{c('optionalNote', 'Optional. Please leave personal or financial details out.')}</small></label></>}
          <button className="donation-primary" type="submit"><span>{c('reviewAction', 'CONTRIBUTE NOW')}</span><ArrowRight size={19} /></button>
          <p className="donation-disclosure">{c('enquiryNotice', 'Continue to enter your contribution details. Other gifts begin with an enquiry.')}</p>
        </form> : <div className="donation-review">
          <div className="donation-summary"><p><HeartHandshake size={22} />{c('summaryTitle', 'Your contribution, your way')}</p><dl><div><dt>{c('givingAs', 'Giving as')}</dt><dd>{donorLabels[DONORS.indexOf(donor)]}</dd></div><div><dt>{c('preferredCause', 'Preferred cause')}</dt><dd>{causeLabel(cause)}</dd></div><div><dt>{kind === 'gift' ? c('proposedGift', 'Proposed gift') : c('offering', 'Offering')}</dt><dd>{kind === 'gift' ? c('financialGift', 'A financial gift') : nonMonetaryLabels[nonMonetary as keyof typeof nonMonetaryLabels]}</dd></div></dl>{kind === 'time' && offer.trim() && <p className="donation-review-offer">{offer}</p>}</div>
          <a className="donation-primary" href={kind === 'gift' ? contributionURL : emailHref} onClick={e => { if (kind === 'gift') { e.preventDefault(); setFormOpen(true); } }}><Mail size={18} /><span>{kind === 'gift' ? c('contributeAction', 'Continue to contribute') : c('emailAction', 'Open email draft')}</span><ArrowUpRight size={19} /></a>
          <p className="donation-disclosure">{kind === 'gift' ? c('portalNotice', 'You’ll choose your amount and enter your details on the official portal. Please read its FAQs before proceeding.') : c('draftNotice', 'Opens your email app with these preferences. You can edit the message before sending.')}</p>
          <a className="donation-call" href={`tel:${site.contact.telephone.replace(/[^+\d]/g,'')}`}><Phone size={15} />{c('callInstead', 'Prefer to call?')} {site.contact.telephone}</a>
          <button type="button" className="donation-back" onClick={() => changeStep(1)}><ArrowLeft size={15} />{c('editPreferences', 'Edit my preferences')}</button>
        </div>}
      </div>
      <div className="donation-practical"><p className="donation-eyebrow">{c('practicalTitle', 'A little guidance')}</p>
        <details><summary>{c('onlineQuestion', 'How can I donate online?')}<ChevronDown size={16} /></summary><p>{c('onlineAnswer', 'The foundation lists debit and credit cards, net banking, bank transfers, e-wallets and UPI, through Razorpay (powered by HDFC Bank) and PayUmoney.')}</p><a href={contributionURL} onClick={e => { e.preventDefault(); setFormOpen(true); }}>{c('contributeAction', 'Continue to contribute')}<ArrowUpRight size={14} /></a></details>
        <details><summary>{c('taxQuestion', 'Are donations tax deductible?')}<ChevronDown size={16} /></summary><p>{c('taxAnswer', 'The foundation’s donation page states that contributions qualify for deduction under section 80G(5)(vi) of the Income Tax Act, 1961. Contact the accounts team for documentation.')}</p></details>
        <details><summary>{c('offlineQuestion', 'Can I contribute by cheque or in person?')}<ChevronDown size={16} /></summary><p>{c('offlineAnswer', 'Make cheques or demand drafts payable to Sant Nirankari Charitable Foundation at Delhi. Post them to the office below or submit them at your nearest branch.')}</p><p><MapPin size={14} />{site.contact.address}</p><p>{c('counterAnswer', 'Card contributions are accepted at the Delhi office on working days, 9:30 AM–6:00 PM, and at the SNCF counter during Sunday Satsang in Delhi.')}</p></details>
        <details><summary>{c('receiptQuestion', 'Who can help with receipts and documentation?')}<ChevronDown size={16} /></summary><p>{c('receiptAnswer', 'Our accounts team can guide you on payment options, receipts and the documentation applicable to your contribution.')}</p><a href={`mailto:${site.contact.email}`}>{site.contact.email}<ArrowUpRight size={14} /></a></details>
      </div>
      {!page && <Link className="donation-page-link" to="/donate" onClick={onClose}>{c('fullPage', 'Open the contribution page')}<ArrowUpRight size={13} /></Link>}
    </div>
  </div>;
}
