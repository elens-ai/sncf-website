import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
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

const accentOf = (pillarId: string) =>
  PILLARS.find((p) => p.id === pillarId)?.accentB ?? '#ffffff';

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
                {hasPanel(item) ? (
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
                  <a href={item.href} className={shared}>
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-amber-300 italic">
                        {item.badge}
                      </span>
                    )}
                  </a>
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
              <div className="rounded-2xl bg-neutral-950/90 border border-white/15 backdrop-blur-xl shadow-2xl p-4 min-w-[240px]">
                {item.groups ? (
                  /* Core Values — one column per pillar, in that pillar's colour */
                  <div className="flex gap-6 px-1">
                    {item.groups.map((g) => {
                      const accent = accentOf(g.pillarId);
                      return (
                        <div key={g.pillarId} className="min-w-[176px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2 h-2 rounded-full flex-none"
                              style={{ backgroundColor: accent }}
                            />
                            <span
                              className="font-artistic-display text-xs font-extrabold uppercase tracking-widest"
                              style={{ color: accent }}
                            >
                              {g.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/45 mb-2.5 pl-4">{g.blurb}</p>
                          <ul className="space-y-0.5">
                            {g.links.map((l) => (
                              <li key={l.href}>
                                <a
                                  href={l.href}
                                  className="block px-3 py-1.5 rounded-lg text-[13px] text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  {l.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {item.links?.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="block px-3 py-2 rounded-lg text-[13px] text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                        >
                          {l.label}
                        </a>
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
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 italic">
                        {item.badge}
                      </span>
                    )}
                  </a>
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
                                <a
                                  key={l.href}
                                  href={l.href}
                                  className="block px-6 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  {l.label}
                                </a>
                              ))}
                            </div>
                          ))
                        : item.links?.map((l) => (
                            <a
                              key={l.href}
                              href={l.href}
                              className="block px-6 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              {l.label}
                            </a>
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
