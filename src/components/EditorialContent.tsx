import React from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { Partner } from '../data/partners';
import { BRAND } from '../data/partnerBrand';

export function EditorialTimeline({ items }: { items: { year: string; text: string; label: string; href: string }[] }) {
  return <ol className="ed-timeline" aria-label="Foundation milestones" data-reveal>{items.map((item,i) => <li key={item.year}><span className="ed-timeline-dot" aria-hidden="true"/><p className="ed-eyebrow">0{i + 1} / {item.label}</p><h3>{item.year}</h3><p>{item.text}</p><a className="ed-link" href={item.href}>Explore this chapter <ArrowUpRight size={16}/></a></li>)}</ol>;
}

export const PartnerItem: React.FC<{ partner: Partner }> = ({ partner }) => {
  const brand = BRAND[partner.id];
  return <li><span className="ww-register-mark" style={{ '--tile-ink': brand?.color ?? '#426b89' } as React.CSSProperties}><span className="ww-register-initials font-artistic-display">{brand?.initials ?? partner.name.slice(0,2)}</span>{brand?.logo && <img src={brand.logo} alt="" width="90" height="65" loading="lazy" decoding="async" onError={event => {event.currentTarget.style.display='none';}}/>}</span><details className="ww-register-text who-partner-story"><summary><strong className="font-artistic-heading">{partner.name}</strong><Plus size={17}/></summary><div><span className="font-artistic-serif">{partner.contribution}</span>{partner.note && <span className="ww-register-note">{partner.note}</span>}</div></details></li>;
};
