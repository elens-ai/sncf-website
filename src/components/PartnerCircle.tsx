import React, { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import type { Partner } from '../data/partners';
import { BRAND } from '../data/partnerBrand';
import './partner-circle.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.PartnerCircle.${key}`, fallback);

type SectorId = 'heal' | 'enrich' | 'empower' | 'together';
/* The cornerstone of the foundation's work each partner served, as the
   foundation groups them (data/partners.ts). A partner added in the CMS joins
   "walking with us" until it is placed here. */
const SECTOR_OF: Record<string, SectorId> = {
  unep: 'heal', aiims: 'heal', 'red-cross': 'heal', 'life-west': 'heal', ebai: 'heal',
  niit: 'enrich', singer: 'enrich', 'blind-relief': 'enrich', 'pracheen-kala-kendra': 'enrich',
  railways: 'empower', culture: 'empower', ksct: 'empower', ndtv: 'empower', toi: 'empower',
  nmba: 'empower', 'delhi-athletics': 'empower', 'divyang-para-sports': 'empower',
};
/* each in the logo's petal ink nearest the cornerstone's own colour across the site (`color`, on a light page),
   and the ink it is drawn in on the Partners section's teal (`ink`): Enrich's blue is lightened there, or it sinks in */
const sectors = (): { id: SectorId; name: string; color: string; ink: string }[] => [
  { id: 'heal', name: c('sector-heal', 'Heal'), color: '#69b947', ink: '#69b947' },
  { id: 'enrich', name: c('sector-enrich', 'Enrich'), color: '#09a6cf', ink: '#a6e6ff' },
  { id: 'empower', name: c('sector-empower', 'Empower'), color: '#f81170', ink: '#f81170' },
  { id: 'together', name: c('sector-together', 'Walking with us'), color: '#8dd4df', ink: '#8dd4df' },
];
/** The cornerstones, in their inks, and the one a partner is placed in — shared with the
    Who We Are register and the partner's card, so they always group alike. */
export const partnerSectors = sectors;
export const sectorOf = (id: string): SectorId => SECTOR_OF[id] ?? 'together';
/** The partners in the order the circle seats them, clockwise from the top. */
export const ringOrder = <P extends { id: string }>(partners: P[]): P[] => sectors().flatMap(sector => partners.filter(p => sectorOf(p.id) === sector.id));

/* The circle is drawn in a 640 × 640 box: the foundation at its centre, its
   partners on a ring, each cornerstone an arc of colour beyond them. */
const SIZE = 640, MID = 320, RING = 222, BAND = 298, HUB = 86;
const polar = (r: number, deg: number): [number, number] => [MID + r * Math.cos((deg * Math.PI) / 180), MID + r * Math.sin((deg * Math.PI) / 180)];
const pct = (v: number) => `${(v / SIZE) * 100}%`;
/* an arc of the band; one in the lower half runs right to left, so its name reads upright */
const arc = (r: number, from: number, to: number) => {
  const [x0, y0] = polar(r, from), [x1, y1] = polar(r, to);
  const large = to - from > 180 ? 1 : 0;
  const lower = Math.sin((((from + to) / 2) * Math.PI) / 180) > 0.05;
  return lower ? `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${large} 0 ${x0.toFixed(1)} ${y0.toFixed(1)}` : `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

function Badge({ partner }: { partner: Partner }) {
  const brand = BRAND[partner.id];
  const [failed, setFailed] = useState(false);
  /* a logo much wider than tall may use more of the badge's width, where a round badge has room for it */
  const [wide, setWide] = useState(false);
  return brand?.logo && !failed
    ? <img src={resolveCMSMedia(brand.logo)} alt="" loading="lazy" decoding="async" draggable={false} data-wide={wide || undefined}
        onLoad={event => setWide(event.currentTarget.naturalWidth > event.currentTarget.naturalHeight * 1.8)} onError={() => setFailed(true)} />
    : <span data-long={(brand?.initials ?? '').length > 3 || undefined} style={{ color: `color-mix(in srgb, ${brand?.color ?? '#24545a'}, #163f48 25%)` }}>{brand?.initials ?? partner.name.slice(0, 2)}</span>;
}

/** THE CIRCLE OF TOGETHERNESS: the foundation at the centre and every
    partner around it, grouped by the cornerstone of its work they served
    (Heal, Enrich, Empower), each an arc in one of the logo's petal colours.
    A thread of light runs from the foundation to every partner; the partner
    being told (`shown`) has its thread lit and its name set on it, and so
    does one pointed at or reached by keyboard (`onHover` says which).
    Choosing one keeps it told (`pinned`). Pointing at an arc (or tapping
    it) lights every partner in it. A seat on the ring is kept for the next
    organisation, and opens the invitation. */
export function PartnerCircle({ partners, shown, pinned, onChoose, onHover, onJoin }: {
  partners: Partner[];
  /** The partner whose collaboration is being told beside the circle. */
  shown?: string;
  /** The partner someone chose, so it stays told. */
  pinned?: string | null;
  onChoose: (id: string) => void;
  /** A partner is pointed at or reached by keyboard (null when none is). */
  onHover?: (id: string | null) => void;
  /** Opens the partnership invitation from the circle's empty seat. */
  onJoin?: () => void;
}) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState<string | null>(null);
  const [seatHover, setSeatHover] = useState(false);
  const [lens, setLens] = useState<SectorId | null>(null);
  const all = sectors();
  const ring = all.flatMap(sector => partners.filter(p => sectorOf(p.id) === sector.id).map(partner => ({ partner, sector })));
  const seats = ring.length + (onJoin ? 1 : 0);
  const step = 360 / Math.max(1, seats);
  const angle = (i: number) => -90 + i * step;
  /* the badges as large as they were for a dozen partners, smaller only when more must share the ring */
  const node = Math.min(10.6, ((2 * RING * Math.sin(Math.PI / Math.max(3, seats))) * 0.82 / SIZE) * 100);
  const focus = seatHover ? null : hover ?? shown ?? null;
  const focused = ring.find(r => r.partner.id === focus);
  const spans = all.flatMap(sector => {
    const at = ring.flatMap((r, i) => (r.sector.id === sector.id ? [i] : []));
    return at.length ? [{ sector, from: angle(at[0]) - step / 2 + 1.6, to: angle(at[at.length - 1]) + step / 2 - 1.6 }] : [];
  });
  const lit = (sector: SectorId, partnerId?: string) => (lens ? lens === sector : partnerId ? partnerId === focus : focused?.sector.id === sector);
  const hold = (partnerId: string | null) => () => { setHover(partnerId); onHover?.(partnerId); };

  return (
    <div className="partner-circle" data-lens={lens ?? undefined}>
      <div className="partner-circle-stage" style={{ '--node': `${node.toFixed(2)}cqw` } as React.CSSProperties}>
        <svg className="partner-circle-art" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-halo`}>
              <stop offset="0" stopColor="#f3eed6" stopOpacity="0.3" />
              <stop offset="1" stopColor="#f3eed6" stopOpacity="0" />
            </radialGradient>
            {spans.map(({ sector, from, to }) => <path key={sector.id} id={`${id}-arc-${sector.id}`} d={arc(BAND, from, to)} />)}
          </defs>
          <circle cx={MID} cy={MID} r={170} fill={`url(#${id}-halo)`} />
          <circle className="partner-circle-guide" cx={MID} cy={MID} r={RING} />
          <g className="partner-circle-orbits">
            <circle cx={MID} cy={MID} r={HUB + 22} />
            <circle cx={MID} cy={MID} r={HUB + 46} />
          </g>
          {/* the cornerstones, each an arc of colour with its name along it; pointing at one (a wide, unseen band over
              it) lights its partners, and on a touch screen a tap does, until the next */}
          {spans.map(({ sector }) => (
            <g key={sector.id} className="partner-circle-field" data-on={lit(sector.id)} style={{ '--sector': sector.ink } as React.CSSProperties}>
              <use href={`#${id}-arc-${sector.id}`} className="partner-circle-band" />
              <text className="partner-circle-field-name" dy="0.35em"><textPath href={`#${id}-arc-${sector.id}`} startOffset="50%" textAnchor="middle">{sector.name}</textPath></text>
              <use href={`#${id}-arc-${sector.id}`} className="partner-circle-reach"
                onPointerEnter={event => { if (event.pointerType !== 'touch') setLens(sector.id); }}
                onPointerLeave={event => { if (event.pointerType !== 'touch') setLens(null); }}
                onPointerUp={event => { if (event.pointerType === 'touch') setLens(now => (now === sector.id ? null : sector.id)); }} />
            </g>
          ))}
          {/* a thread of light from the foundation to each partner */}
          {ring.map(({ partner, sector }, i) => {
            const [x0, y0] = polar(HUB + 6, angle(i)), [x1, y1] = polar(RING - 38, angle(i));
            return <line key={partner.id} className="partner-circle-thread" data-on={lit(sector.id, partner.id)} x1={x0} y1={y0} x2={x1} y2={y1} style={{ '--sector': sector.ink, animationDelay: `${-i * 0.37}s` } as React.CSSProperties} />;
          })}
          {onJoin && (() => { const [x0, y0] = polar(HUB + 6, angle(seats - 1)), [x1, y1] = polar(RING - 38, angle(seats - 1)); return <line className="partner-circle-thread partner-circle-thread-seat" x1={x0} y1={y0} x2={x1} y2={y1} />; })()}
        </svg>

        {/* the foundation, at the heart of it */}
        <span className="partner-circle-hub" aria-hidden="true"><img src={resolveCMSMedia(resolveCMSAsset('asset.PartnerCircle.hub', '/images/sncf-logo.webp'))} alt="" draggable={false} /></span>

        <div className="partner-circle-nodes" role="group" aria-label={c('label', 'Our partners, around the foundation')}>
          {ring.map(({ partner, sector }, i) => {
            const [x, y] = polar(RING, angle(i));
            const [lx, ly] = polar((HUB + RING - 38) / 2 + 8, angle(i));
            const on = lit(sector.id, partner.id);
            return (
              <React.Fragment key={partner.id}>
                <button type="button" className="partner-circle-node" data-on={on} data-chosen={partner.id === shown} aria-pressed={partner.id === pinned}
                  aria-label={`${partner.name} — ${c('read', 'read this collaboration')}`}
                  style={{ left: pct(x), top: pct(y), '--sector': sector.ink, '--sector-deep': sector.color, '--order': i } as React.CSSProperties}
                  onClick={() => onChoose(partner.id)} onPointerEnter={hold(partner.id)} onPointerLeave={hold(null)} onFocus={hold(partner.id)} onBlur={hold(null)}>
                  <span className="partner-circle-badge"><Badge partner={partner} /></span>
                </button>
                {/* its name, set on its thread while it is the one in view */}
                {partner.id === focus && !lens && <span className="partner-circle-name" aria-hidden="true" style={{ left: pct(lx), top: pct(ly), '--sector': sector.ink, '--sector-deep': sector.color } as React.CSSProperties}>{BRAND[partner.id]?.short ?? partner.name}</span>}
              </React.Fragment>
            );
          })}
          {onJoin && (() => {
            const [x, y] = polar(RING, angle(seats - 1));
            const [lx, ly] = polar((HUB + RING - 38) / 2 + 8, angle(seats - 1));
            return (
              <>
                <button type="button" className="partner-circle-node partner-circle-seat" style={{ left: pct(x), top: pct(y), '--order': seats - 1 } as React.CSSProperties}
                  aria-label={c('seat', 'A place for your organisation — become a partner')} onClick={onJoin}
                  onPointerEnter={() => setSeatHover(true)} onPointerLeave={() => setSeatHover(false)} onFocus={() => setSeatHover(true)} onBlur={() => setSeatHover(false)}>
                  <span className="partner-circle-badge"><Plus size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                </button>
                {seatHover && <span className="partner-circle-name partner-circle-name-seat" aria-hidden="true" style={{ left: pct(lx), top: pct(ly) }}>{c('seat-name', 'Become a partner')}</span>}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
