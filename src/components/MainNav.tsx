import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Heart, Menu, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { NAV_ITEMS, NavItem } from '../data/navigation';
import { PILLARS } from '../data/pillars';

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

export const MainNav: React.FC<{ onOpenDonate: () => void; onSearchClick: () => void }> = ({ onOpenDonate, onSearchClick }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<number | null>(null);
  const mobilePanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    const wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    mobilePanel.current?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const panel = mobilePanel.current;
      const items = Array.from<HTMLElement>(panel?.querySelectorAll<HTMLElement>('button, a[href]') ?? []).filter((item) => !item.closest('[hidden]'));
      if (!panel || !items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!panel.contains(document.activeElement) || document.activeElement === panel || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    };
    const resized = () => { if (innerWidth >= 1280) setMobileOpen(false); };
    document.addEventListener('keydown', trap);
    window.addEventListener('resize', resized);
    return () => {
      document.body.style.overflow = oldOverflow;
      if (root) root.inert = wasInert;
      document.removeEventListener('keydown', trap);
      window.removeEventListener('resize', resized);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [mobileOpen]);

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
        aria-label={getCMSCopy("copy.MainNav.eb814be3ca3b", "Main")}
        className="hidden xl:flex pointer-events-auto relative"
        onMouseLeave={scheduleClose}
      >
        <div
          ref={barRef}
          className="relative flex items-center gap-1 px-2 py-1.5 "
        >
          {/* Sliding spotlight — one element, moved by transform */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-0 pointer-events-none"
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
                              src={resolveCMSMedia(`/images/vertical-${g.pillarId}.webp`)}
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
        aria-controls="mobile-site-navigation"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        className="mobile-menu-trigger xl:hidden pointer-events-auto grid place-items-center w-11 h-11 bg-transparent border-0 text-white/90 hover:text-white transition-all cursor-pointer active:scale-95 flex-none"
      >
        {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
      </button>

      {/* Portalled so the hero's entrance and transforms cannot clip the dialog. */}
      {mobileOpen && createPortal(
        <div className="mobile-menu-overlay" onClick={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
          <div id="mobile-site-navigation" ref={mobilePanel} role="dialog" aria-modal="true" aria-label={getCMSCopy("copy.MainNav.7b06d0dd6977", "Site navigation")} tabIndex={-1} className="site-mobile-menu">
            <header className="mobile-menu-heading">
              <div><span className="mobile-menu-eyebrow">Service with humility</span><p>Explore SNCF<span>.</span></p></div>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={24} /></button>
            </header>
            <button className="mobile-menu-search" type="button" onClick={() => { setMobileOpen(false); onSearchClick(); }}><Search size={18} /><span>Find a cause, camp or initiative</span><ArrowUpRight size={16} /></button>
            <nav className="mobile-menu-links" aria-label="Mobile main">
              {NAV_ITEMS.map((item, i) => {
                const open = mobileSection === i;
                return <div key={item.label} className="mobile-menu-item" style={{ '--item-index': i } as React.CSSProperties}>
                  {hasPanel(item) ? <button type="button" className="mobile-menu-row" onClick={() => setMobileSection(open ? null : i)} aria-expanded={open} aria-controls={`mobile-section-${i}`}>
                    <span className="mobile-menu-number" aria-hidden="true">0{i + 1}</span><span>{item.label}</span><ChevronDown size={20} className={open ? 'rotate-180' : ''} />
                  </button> : <NavAnchor href={item.href} external={item.external} onClick={() => setMobileOpen(false)} className="mobile-menu-row">
                    <span className="mobile-menu-number" aria-hidden="true">0{i + 1}</span><span>{item.label}</span><ArrowUpRight size={20} />
                  </NavAnchor>}
                  {hasPanel(item) && <div id={`mobile-section-${i}`} hidden={!open} className="mobile-menu-submenu">
                    {item.href && <NavAnchor href={item.href} external={item.external} onClick={() => setMobileOpen(false)} className="mobile-menu-overview">Explore {item.label}<ArrowUpRight size={15} /></NavAnchor>}
                    {item.groups ? item.groups.map((group) => <div className="mobile-menu-group" key={group.pillarId}>
                      <p style={{ color: deepOf(group.pillarId) }}>{group.title}</p>
                      {group.links.map((link) => <NavAnchor key={link.label} href={link.href} external={link.external} onClick={() => setMobileOpen(false)}>{link.label}</NavAnchor>)}
                    </div>) : item.links?.map((link) => <NavAnchor key={link.label} href={link.href} external={link.external} onClick={() => setMobileOpen(false)}>{link.label}</NavAnchor>)}
                  </div>}
                </div>;
              })}
            </nav>
            <footer className="mobile-menu-footer">
              <p>A little kindness.<br /><strong>A lasting difference.</strong></p>
              <button type="button" onClick={() => { setMobileOpen(false); onOpenDonate(); }}><Heart size={17} />Donate<ArrowUpRight size={18} /></button>
              <span>Sant Nirankari Charitable Foundation</span>
            </footer>
          </div>
        </div>, document.body
      )}
    </>
  );
};
