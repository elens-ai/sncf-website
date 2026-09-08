import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NAV_ITEMS, NavItem } from '../data/navigation';
import { PILLARS } from '../data/pillars';

/**
 * Main navigation for the hero.
 *
 * Two ideas make it feel of a piece with the wheel rather than bolted on:
 *
 *  - A spotlight pill slides between items instead of each item lighting up
 *    on its own. It is one element moved by transform, so the highlight reads
 *    as a single object travelling the bar.
 *  - Core Values opens a mega menu split by Heal / Enrich / Empower, each
 *    column carrying that pillar's own accent colour — the same three
 *    verticals the carousel is cycling, so the menu explains the hero.
 *
 * Gallery is not here on purpose: the header already has a Gallery ribbon.
 */

/**
 * One link that knows where it goes. Internal destinations ('/core-values',
 * '/projects#amrit') are router links so the page swaps without a reload;
 * anything else is a real anchor that leaves the site in a new tab.
 */
const NavAnchor: React.FC<{
  href?: string;
  external?: boolean;
  className?: string;
  onClick?: () => void;
  onFocus?: () => void;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
  children: React.ReactNode;
}> = ({ href, external, className, onClick, onFocus, ariaExpanded, ariaHasPopup, children }) => {
  const aria = {
    ...(ariaExpanded === undefined ? {} : { 'aria-expanded': ariaExpanded }),
    ...(ariaHasPopup ? { 'aria-haspopup': true as const } : {}),
  };
  const internal = !!href && href.startsWith('/') && !external;
  if (internal) {
    return (
      <Link to={href!} className={className} onClick={onClick} onFocus={onFocus} {...aria}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      onFocus={onFocus}
      {...aria}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
};

const accentOf = (pillarId: string) =>
  PILLARS.find((p) => p.id === pillarId)?.accentB ?? '#ffffff';
/* the deep half of the pair — the readable one on a light ground */
const deepOf = (pillarId: string) =>
  PILLARS.find((p) => p.id === pillarId)?.accentA ?? '#3a3f57';

export const MainNav: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<number | null>(null);

  const barRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [spotlight, setSpotlight] = useState<{ x: number; w: number } | null>(null);
  /** Delays close so the pointer can cross the gap into the panel. */
  const closeTimer = useRef<number | null>(null);

  const moveSpotlight = useCallback((index: number | null) => {
    if (index === null || !barRef.current) {
      setSpotlight(null);
      return;
    }
    const el = itemRefs.current[index];
    if (!el) return;
    const bar = barRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setSpotlight({ x: r.left - bar.left, w: r.width });
  }, []);

  const openMenu = (index: number) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenIndex(index);
    moveSpotlight(index);
  };

  /* Navigating with the panel still on screen leaves it hanging over the page
     you just asked for. Every destination in it closes it. */
  const closeMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenIndex(null);
    setSpotlight(null);
  };

  /* Escape dismisses it, as it should for anything that opens over the page. */
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex]);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpenIndex(null);
      setSpotlight(null);
    }, 140);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenIndex(null);
      setSpotlight(null);
      setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const hasPanel = (item: NavItem) => Boolean(item.links || item.groups);

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <nav
        aria-label="Main"
        className="hidden lg:flex pointer-events-auto relative"
        onMouseLeave={scheduleClose}
      >
        <div
          ref={barRef}
          className="relative flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg"
        >
          {/* Sliding spotlight — one element, moved by transform */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-white/20 pointer-events-none"
            style={{
              width: spotlight?.w ?? 0,
              transform: `translateX(${spotlight?.x ?? 0}px)`,
              opacity: spotlight ? 1 : 0,
              transition:
                'transform 320ms cubic-bezier(0.33, 1, 0.68, 1), width 320ms cubic-bezier(0.33, 1, 0.68, 1), opacity 200ms ease',
            }}
          />

          {NAV_ITEMS.map((item, i) => {
            const expanded = openIndex === i;
            const shared =
              'relative z-10 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-semibold tracking-wide text-white/90 hover:text-white transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

            return (
              <div
                key={item.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onMouseEnter={() => (hasPanel(item) ? openMenu(i) : (moveSpotlight(i), setOpenIndex(null)))}
                className="relative"
              >
                {/* An item that BOTH has a page and a panel is a link first:
                    hovering opens the panel, clicking the label goes to the
                    page. Only a panel with nowhere of its own to go stays a
                    button. Otherwise Core Values, Projects and Who We Are
                    would be reachable only through their own submenus. */}
                {hasPanel(item) && item.href ? (
                  <NavAnchor
                    href={item.href}
                    external={item.external}
                    className={shared}
                    /* These were a <button> before they became links, and the
                       conversion silently dropped both attributes — assistive
                       tech was no longer told the panel existed. */
                    ariaExpanded={expanded}
                    ariaHasPopup
                    /* Hover opens it for a mouse; focus is the keyboard's
                       equivalent, and without this the panel could not be
                       opened from the keyboard at all. */
                    onFocus={() => openMenu(i)}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </NavAnchor>
                ) : hasPanel(item) ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-haspopup="true"
                    onClick={() => (expanded ? setOpenIndex(null) : openMenu(i))}
                    className={shared}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <NavAnchor href={item.href} external={item.external} className={shared}>
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 italic">
                        {item.badge}
                      </span>
                    )}
                  </NavAnchor>
                )}
              </div>
            );
          })}
        </div>

        {/* ---------- Panels ---------- */}
        {NAV_ITEMS.map((item, i) => {
          if (!hasPanel(item) || openIndex !== i) return null;

          return (
            <div
              key={`panel-${item.label}`}
              onMouseEnter={() => openMenu(i)}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 animate-fadeIn"
            >
              <div className="nvpanel">
                {item.groups ? (
                  /* Core Values — one leaf per room, each a miniature of that
                     room's page: the tinted door it opens with on top, its
                     index of activities on white beneath. */
                  <div className="nvrooms">
                    {item.groups.map((g, gi) => {
                      const deep = deepOf(g.pillarId);
                      const bright = accentOf(g.pillarId);
                      const all = g.links.find((l) => l.label.startsWith('All of'));
                      const rows = g.links.filter((l) => !l.label.startsWith('All of'));
                      return (
                        <div
                          key={g.pillarId}
                          className="nvroom"
                          style={
                            { '--ink-a': deep, '--ink-b': bright } as React.CSSProperties
                          }
                        >
                          <NavAnchor
                            href={all?.href ?? `/core-values#${g.pillarId}`}
                            className="nvroom-door"
                            onClick={closeMenu}
                          >
                            <img
                              className="nvroom-emblem"
                              src={`/images/vertical-${g.pillarId}.webp`}
                              alt=""
                              aria-hidden="true"
                            />
                            <span className="nvroom-folio" aria-hidden="true">
                              {String(gi + 1).padStart(2, '0')}
                            </span>
                            <span className="nvroom-name font-artistic-display">{g.title}</span>
                            <span className="nvroom-blurb">{g.blurb}</span>
                          </NavAnchor>
                          <ul className="nvroom-index">
                            {rows.map((l) => (
                              <li key={l.label}>
                                <NavAnchor
                                  href={l.href}
                                  external={l.external}
                                  className="nvroom-row"
                                  onClick={closeMenu}
                                >
                                  {l.label}
                                </NavAnchor>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                                ) : (
                  <ul className="nvlist">
                    {item.links?.map((l) => (
                      <li key={l.label}>
                        <NavAnchor
                          href={l.href}
                          external={l.external}
                          className="nvroom-row"
                          onClick={closeMenu}
                        >
                          {l.label}
                        </NavAnchor>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ---------- Mobile trigger ---------- */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        className="lg:hidden pointer-events-auto grid place-items-center w-11 h-11 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl text-white/90 hover:bg-white/20 transition-all cursor-pointer active:scale-95 flex-none"
      >
        {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
      </button>

      {/* ---------- Mobile panel ---------- */}
      {mobileOpen && (
        <div className="lg:hidden pointer-events-auto fixed left-0 right-0 top-[72px] z-50 px-4 animate-fadeIn">
          <div className="rounded-2xl bg-neutral-950/95 border border-white/15 backdrop-blur-xl shadow-2xl p-3 max-h-[70vh] overflow-y-auto">
            {NAV_ITEMS.map((item, i) => {
              const open = mobileSection === i;
              if (!hasPanel(item)) {
                return (
                  <NavAnchor
                    key={item.label}
                    href={item.href}
                    external={item.external}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 italic">
                        {item.badge}
                      </span>
                    )}
                  </NavAnchor>
                );
              }
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setMobileSection(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="pb-2">
                      {item.href && !item.external && (
                        <NavAnchor
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-6 py-2 rounded-lg text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          Open {item.label}
                        </NavAnchor>
                      )}
                      {item.groups
                        ? item.groups.map((g) => (
                            <div key={g.pillarId} className="mb-2">
                              <div
                                className="px-6 py-1 text-[10px] font-extrabold uppercase tracking-widest"
                                style={{ color: accentOf(g.pillarId) }}
                              >
                                {g.title}
                              </div>
                              {g.links.map((l) => (
                                <NavAnchor
                                  key={l.label}
                                  href={l.href}
                                  external={l.external}
                                  onClick={() => setMobileOpen(false)}
                                  className="block px-6 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  {l.label}
                                </NavAnchor>
                              ))}
                            </div>
                          ))
                        : item.links?.map((l) => (
                            <NavAnchor
                              key={l.label}
                              href={l.href}
                              external={l.external}
                              onClick={() => setMobileOpen(false)}
                              className="block px-6 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              {l.label}
                            </NavAnchor>
                          ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
