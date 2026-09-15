import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import '../pages/contribution.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ContributionPage.${key}`, fallback);
export function ContributionForm({ onBack }: { onBack: () => void }) {
  useCMSRevision();
  const [reviewed, setReviewed] = useState(false);
  const [summary, setSummary] = useState({ name: '', amount: '' });
  const fields = [
    { name: 'mobile', label: c('mobile', 'Mobile Number'), type: 'tel', pattern: '[0-9]{10}', maxLength: 10, prefix: '+91', autoComplete: 'tel-national', group: 0 },
    { name: 'email', label: c('email', 'Email'), type: 'email', autoComplete: 'email', group: 0 },
    { name: 'amount', label: c('amount', 'Amount'), type: 'number', prefix: '₹', group: 0 },
    { name: 'name', label: c('name', 'Name'), autoComplete: 'name', group: 1 },
    { name: 'pan', label: c('pan', 'PAN'), pattern: '[A-Za-z]{5}[0-9]{4}[A-Za-z]', maxLength: 10, group: 1 },
    { name: 'aadhaar', label: c('aadhaar', 'AADHAR Number'), type: 'tel', pattern: '[0-9]{12}', maxLength: 12, group: 1 },
    { name: 'voterId', label: c('voterId', 'Voter ID No. / Passport No.'), optional: true, group: 1 },
    { name: 'flat', label: c('flat', 'Flat / Door / Building'), autoComplete: 'address-line1', group: 2 },
    { name: 'road', label: c('road', 'Road / Street / Block / Sector'), autoComplete: 'address-line2', group: 2 },
    { name: 'area', label: c('area', 'Village / Area / Locality'), autoComplete: 'address-line3', group: 2 },
    { name: 'pincode', label: c('pincode', 'PIN Code'), type: 'tel', pattern: '[0-9]{6}', maxLength: 6, autoComplete: 'postal-code', group: 2 },
    { name: 'city', label: c('city', 'District / City'), autoComplete: 'address-level2', group: 2 },
    { name: 'state', label: c('state', 'State'), autoComplete: 'address-level1', group: 2 },
  ];
  const groups = [c('contactTitle', 'Your contribution'), c('identityTitle', 'Your details'), c('addressTitle', 'Your address')];
  return <section className="contribution-page">
    <div className="contribution-intro">
      <button type="button" onClick={onBack} className="contribution-back"><ArrowLeft size={16} />{c('back', 'Ways to contribute')}</button>
      <div className="contribution-mark"><HeartHandshake size={35} strokeWidth={1.2} /></div>
      <p className="contribution-eyebrow">{c('eyebrow', 'Contribute')}</p>
      <h1>{c('title', 'A gesture of generosity.')}<em>{c('subtitle', 'A world of difference.')}</em></h1>
      <p>{c('intro', 'Every contribution begins with care. Complete your details below to prepare for the next step.')}</p>
      <div className="contribution-note"><ShieldCheck size={22} /><p>{c('integrationNotice', 'Your contribution details stay on this page. Mobile and email verification are required before payment.')}</p></div>

    </div>
    <form className="contribution-form" onChange={() => setReviewed(false)} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setSummary({ name: String(data.get('name') || ''), amount: String(data.get('amount') || '') }); setReviewed(true); }}>
      <p className="contribution-required">{c('required', 'Fields marked * are required.')}</p>
      {groups.map((title, index) => <fieldset key={index}><legend><span>0{index + 1}</span>{title}</legend><div className="contribution-fields">
        {fields.filter(field => field.group === index).map(field => <label key={field.name} htmlFor={`contribute-${field.name}`}>{field.label}{!field.optional && <span aria-hidden="true"> *</span>}<div className="contribution-input">{field.prefix && <span>{field.prefix}</span>}<input id={`contribute-${field.name}`} name={field.name} type={field.type || 'text'} required={!field.optional} pattern={field.pattern} maxLength={field.maxLength} min={field.name === 'amount' ? 1 : undefined} step={field.name === 'amount' ? '0.01' : undefined} autoComplete={field.autoComplete || 'off'} spellCheck={false} aria-describedby={field.name === 'pan' ? 'pan-format' : undefined} /></div>{field.name === 'pan' && <small id="pan-format">{c('panFormat', '5 letters, 4 digits, then 1 letter.')}</small>}</label>)}
      </div></fieldset>)}
      <label className="contribution-remarks" htmlFor="contribute-remarks">{c('remarks', 'Remarks')}<textarea id="contribute-remarks" name="remarks" rows={3} maxLength={2000} /></label>
      <button type="submit" className="contribution-submit">{c('check', 'Review contribution')}<ArrowUpRight size={18} /></button>
      {reviewed && <div className="contribution-ready" role="status"><strong>{c('ready', 'Your contribution summary')}</strong><p>{summary.name} · {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(summary.amount))}</p><p>{c('verificationPending', 'Mobile verification, email verification and payment are not yet available. No contribution has been submitted or charged.')}</p><button className="contribution-submit" type="button" disabled>{c('paymentPending', 'Payment setup pending')}</button></div>}

    </form>
  </section>;
}
