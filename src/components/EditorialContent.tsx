import { resolveCMSMedia } from '../cms/media';
import React from 'react';
import { Plus } from 'lucide-react';
import type { Partner } from '../data/partners';
import { BRAND } from '../data/partnerBrand';

/** One organisation in the Who We Are register: its own mark (or a monogram),
    the field of work it is grouped under, and its collaboration behind a fold. */
export const PartnerItem: React.FC<{ partner: Partner; sector?: { name: string; color: string } }> = ({ partner, sector }) => {
  const brand = BRAND[partner.id];
  return <li style={sector ? { '--sector': sector.color } as React.CSSProperties : undefined}>{sector && <span className="ww-register-sector"><i aria-hidden="true" />{sector.name}</span>}<span className="ww-register-mark" style={{ '--tile-ink': brand?.color ?? '#426b89' } as React.CSSProperties}><span className="ww-register-initials font-artistic-display">{brand?.initials ?? partner.name.slice(0,2)}</span>{brand?.logo && <img src={resolveCMSMedia(brand.logo)} alt="" width="90" height="65" loading="lazy" decoding="async" onError={event => {event.currentTarget.style.display='none';}}/>}</span><details className="ww-register-text who-partner-story"><summary><strong className="font-artistic-heading">{partner.name}</strong><Plus size={17}/></summary><div><span className="font-artistic-serif">{partner.contribution}</span>{partner.note && <span className="ww-register-note">{partner.note}</span>}</div></details></li>;
};
