import React from 'react';
import { ArrowUpRight, BookOpen, HeartHandshake, Sprout } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import './foundation-purpose.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.FoundationPurpose.${key}`, fallback);

export function FoundationPurpose() {
  const cornerstones = [
    { id: 'heal', label: c('heal', 'Heal'), description: c('heal-description', 'Care that reaches everyone.'), Icon: HeartHandshake, ink: '#1f8a5c' },
    { id: 'enrich', label: c('enrich', 'Enrich'), description: c('enrich-description', 'Learning that opens possibilities.'), Icon: BookOpen, ink: '#137e96' },
    { id: 'empower', label: c('empower', 'Empower'), description: c('empower-description', 'Communities that grow together.'), Icon: Sprout, ink: '#bd2464' },
  ];
  return <div className="foundation-purpose" data-reveal>
    <div className="foundation-purpose-intro">
      <div className="foundation-purpose-copy">
        <p className="foundation-purpose-eyebrow">{c('eyebrow', 'About the foundation')}</p>
        <h2 id="account-title">{c('title', 'A purpose bigger')}<br /><em>{c('title-em', 'than ourselves.')}</em></h2>
        <p className="foundation-purpose-body">{c('introduction', 'Established in 2010, Sant Nirankari Charitable Foundation brings a belief in selfless service into everyday action. We reach out with care, education and support, especially where they are needed most.')}</p>
        <div className="foundation-purpose-since"><span aria-hidden="true" /><p>{c('since', 'One shared purpose. Since 2010.')}</p></div>
      </div>
      <figure className="foundation-purpose-quote">
        <p className="foundation-purpose-script">{c('motto', 'Service with Humility')}</p>
        <blockquote>{c('quote', 'A life gets its meaning if it is lived for others.')}</blockquote>
        <figcaption>{c('attribution', 'Baba Hardev Singh Ji')}</figcaption>
        <p className="foundation-purpose-quote-note">{c('quote-note', 'Care offered openly. A classroom for every learner. Service that sees everyone as one.')}</p>
      </figure>
    </div>
    <nav className="foundation-purpose-cornerstones" aria-label={c('cornerstones', 'Our three cornerstones')}>
      {cornerstones.map(({ id, label, description, Icon, ink }) => <a key={id} href={`/core-values#${id}`} style={{ '--purpose-ink': ink } as React.CSSProperties}>
        <span className="foundation-purpose-icon"><Icon size={25} strokeWidth={1.5} aria-hidden="true" /></span>
        <span><strong>{label}</strong><small>{description}</small></span>
        <ArrowUpRight className="foundation-purpose-arrow" size={18} aria-hidden="true" />
      </a>)}
    </nav>
    <p className="foundation-purpose-footnote"><Sprout size={16} aria-hidden="true" />{c('environment', 'Care for the natural world runs through everything we do.')}</p>
  </div>;
}
