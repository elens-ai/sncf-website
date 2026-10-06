import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Pause, Play, Plus, Search, X } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import type { Partner } from '../data/partners';
import { BRAND } from '../data/partnerBrand';
import { partnerSectors, sectorOf } from './PartnerCircle';
import { useSectionActivity } from '../hooks/useSectionActivity';
import './partner-marquee.css';

/**
 * WHO WALKS WITH US, as a wall of marks — every organisation beside the
 * foundation on a tile of its own, drifting past in two rows, the one
 * leftwards and the other rightwards (after the customer wall the
 * foundation chose as its reference), each row mixing the fields of work.
 * A tile's plus opens what that collaboration was, in a panel beneath the
 * rows, and the rows hold still while it is open.
 *
 * A row pauses under the pointer and while the keyboard is in it, and the
 * button beside the search stops both, for anyone who would rather read
 * them still. A search takes the wall out of motion and lays out only what
 * matches (by name, collaboration or field). Each row's marks are repeated
 * until a loop is wider than any screen, so it never shows a gap; only the
 * first of each is read out or reached by the keyboard. With reduced
 * motion the rows stand still and scroll by hand.
 */
export function PartnerMarquee({ partners }: { partners: Partner[] }) {
  const root = useRef<HTMLDivElement>(null);
  const active = useSectionActivity(root);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const panelId = useId();
  /* each partner's own tile (not its copies), to return the keyboard to it when its panel closes */
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const sectors = Object.fromEntries(partnerSectors().map(sector => [sector.id, sector]));
  const fieldOf = (partner: Partner) => sectors[sectorOf(partner.id)];
  const q = query.trim().toLowerCase();
  const matches = q ? partners.filter(p => `${p.name} ${p.contribution} ${p.note ?? ''} ${fieldOf(p)?.name ?? ''}`.toLowerCase().includes(q)) : partners;
  const current = partners.find(p => p.id === chosen && matches.includes(p)) ?? null;
  /* the panel keeps showing the last one chosen while it folds away */
  const [shown, setShown] = useState<Partner | null>(null);
  useEffect(() => { if (current) setShown(current); }, [current]);
  /* alternate partners in each row, so both rows mix the fields */
  const rows = [partners.filter((_, i) => i % 2 === 0), partners.filter((_, i) => i % 2 === 1)];
  const more = getCMSCopy("copy.WhoWeArePage.partner-more", "More about");

  const tile = (partner: Partner, copy = false) => {
    const brand = BRAND[partner.id];
    const on = current?.id === partner.id;
    return (
      <li key={partner.id} className="who-partner-tile" data-on={on || undefined} aria-hidden={copy || undefined} inert={copy || undefined}
        style={{ '--tile-ink': brand?.color ?? '#426b89', '--sector': fieldOf(partner)?.color ?? '#8b72a3' } as React.CSSProperties}>
        <button type="button" ref={copy ? undefined : node => { buttons.current[partner.id] = node; }}
          aria-expanded={on} aria-controls={panelId} aria-label={`${more} ${partner.name}`} onClick={() => setChosen(on ? null : partner.id)}>
          {/* the monogram always, the logo laid over it, so a missing file still leaves a mark */}
          <span className="who-partner-mark" aria-hidden="true">
            <span className="who-partner-initials">{brand?.initials ?? partner.name.slice(0, 2)}</span>
            {brand?.logo && <img src={resolveCMSMedia(brand.logo)} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.style.display = 'none'; }} />}
          </span>
          <span className="who-partner-name" aria-hidden="true">{brand?.short ?? partner.name}</span>
          <span className="who-partner-plus" aria-hidden="true"><Plus size={14} strokeWidth={2.2} /></span>
        </button>
      </li>
    );
  };

  /* closing hands the keyboard back to the tile that opened the panel */
  const close = () => {
    const id = current?.id;
    setChosen(null);
    if (id) buttons.current[id]?.focus({ preventScroll: true });
  };
  const field = shown && fieldOf(shown);
  const brand = shown && BRAND[shown.id];
  return (
    <div ref={root} className="who-partners" data-active={active} data-still={stopped || !!current || undefined}
      onKeyDown={event => { if (event.key === 'Escape' && current) close(); }}>
      <div className="who-partner-toolbar">
        <label>
          <Search size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} aria-label={getCMSCopy("copy.WhoWeArePage.447786a75a38", "Search foundation partners")} placeholder={getCMSCopy("copy.WhoWeArePage.f3bd895aae45", "Find an organisation or a cause…")} />
        </label>
        {!q && (
          <button type="button" className="who-partner-pause" aria-pressed={stopped} onClick={() => setStopped(value => !value)}
            aria-label={stopped ? getCMSCopy("copy.WhoWeArePage.partners-play", "Set the logos moving") : getCMSCopy("copy.WhoWeArePage.partners-pause", "Stop the moving logos")}>
            {stopped ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
        )}
      </div>

      {q ? (
        matches.length
          ? <ul className="who-partner-results">{matches.map(partner => tile(partner))}</ul>
          : <p className="who-empty">{getCMSCopy("copy.WhoWeArePage.7d25129d73f9", "No collaborations match that search. Try another name or cause.")}</p>
      ) : (
        <div className="who-partner-rows" role="group" aria-label={getCMSCopy("copy.WhoWeArePage.partners-rows", "The organisations that walk with us")}>
          {rows.map((row, r) => (
            <div key={r} className="who-marquee" data-direction={r ? 'right' : 'left'} style={{ '--group': row.length * 2 } as React.CSSProperties}>
              <div className="who-marquee-track">
                <ul className="who-marquee-group">{row.map(partner => tile(partner))}{row.map(partner => tile(partner, true))}</ul>
                <ul className="who-marquee-group" aria-hidden="true" inert>{row.map(partner => tile(partner, true))}{row.map(partner => tile(partner, true))}</ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* what the chosen organisation did with the foundation */}
      <div id={panelId} className="who-partner-panel" data-shown={!!current} role="region" aria-label={shown?.name} inert={!current || undefined}>
        <div>
          {shown && (
            <div className="who-partner-card" style={{ '--tile-ink': brand?.color ?? '#426b89', '--sector': field?.color ?? '#8b72a3' } as React.CSSProperties}>
              <span className="who-partner-mark who-partner-card-mark" aria-hidden="true">
                <span className="who-partner-initials">{brand?.initials ?? shown.name.slice(0, 2)}</span>
                {brand?.logo && <img src={resolveCMSMedia(brand.logo)} alt="" decoding="async" onError={event => { event.currentTarget.style.display = 'none'; }} />}
              </span>
              <div className="who-partner-card-copy">
                {field && <p className="who-partner-field"><i aria-hidden="true" />{field.name}</p>}
                <h3>{shown.name}</h3>
                <p className="font-artistic-serif">{shown.contribution}</p>
                {shown.note && <p className="who-partner-note">{shown.note}</p>}
                {shown.href && (
                  <a href={shown.href} target="_blank" rel="noopener noreferrer">
                    {getCMSCopy("copy.WhoWeArePage.partner-visit", "Visit their website")}<ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
              <button type="button" className="who-partner-close" onClick={close} aria-label={getCMSCopy("copy.WhoWeArePage.partner-close", "Close")}><X size={16} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
