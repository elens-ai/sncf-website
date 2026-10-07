import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BarChart3, FileText, Images, type LucideIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import './explore-tabs.css';

export type ExploreTab = 'reports' | 'gallery' | 'stats';

const TABS: { id: ExploreTab; icon: LucideIcon; name: () => string }[] = [
  { id: 'reports', icon: FileText, name: () => getCMSCopy("copy.ExploreTabs.reports", "Reports") },
  { id: 'gallery', icon: Images, name: () => getCMSCopy("copy.ExploreTabs.gallery", "Gallery") },
  { id: 'stats', icon: BarChart3, name: () => getCMSCopy("copy.ExploreTabs.stats", "Stats") },
];

/** THE THREE WAYS INTO A CORNERSTONE OR A PROJECT: its report, its gallery
    and its figures charted, as tabs beneath its masthead. The bar stays in
    view under the page's own rail while its panel scrolls past.

    Every tab is an address: #heal-gallery opens Heal's gallery and the page
    brings its tabs into view, so the home page and the menus can link
    straight to one; choosing a tab writes its address without moving the
    page. A panel is built the first time it is opened and then kept, so a
    scrapbook keeps its page and a chart does not draw itself twice. */
export const ExploreTabs: React.FC<{
  /** The cornerstone's or project's anchor; tabs are #{id}-reports and so on. */
  id: string;
  name: string;
  tab: ExploreTab;
  onTab: (tab: ExploreTab) => void;
  /** A line under each tab's name, e.g. "5 programmes"; without it, the names stand alone. */
  notes?: Record<ExploreTab, string>;
  panels: Record<ExploreTab, () => React.ReactNode>;
  /** 'segmented': a quiet grey track with the tab chosen raised as a white slip, names alone, no icons and no
      colour (the Projects and Core Values pages). */
  look?: 'segmented';
}> = ({ id, name, tab, onTab, notes, panels, look }) => {
  useCMSRevision();
  const { hash } = useLocation();
  const [opened, setOpened] = useState<ExploreTab[]>([tab]);
  const list = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<ExploreTab, HTMLButtonElement | null>>>({});
  const choose = useRef(onTab);
  choose.current = onTab;

  useEffect(() => { setOpened(open => (open.includes(tab) ? open : [...open, tab])); }, [tab]);

  /* An address naming one of these tabs opens it: from the router, and from
     a plain link to the same page. */
  useEffect(() => {
    const follow = () => {
      const named = TABS.find(t => window.location.hash === `#${id}-${t.id}`);
      if (named) choose.current(named.id);
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, [id, hash]);

  /* the ink beneath the chosen tab slides across to it */
  useLayoutEffect(() => {
    const bar = list.current, chosen = buttons.current[tab];
    if (!bar || !chosen) return;
    const place = () => {
      bar.style.setProperty('--ink-x', `${chosen.offsetLeft}px`);
      bar.style.setProperty('--ink-w', `${chosen.offsetWidth}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [tab]);

  const select = (next: ExploreTab, focus = false) => {
    onTab(next);
    if (focus) buttons.current[next]?.focus();
    /* the address follows the choice; the page does not jump to it */
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#${id}-${next}`);
  };
  const keys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const at = TABS.findIndex(t => t.id === tab);
    const to = event.key === 'ArrowRight' ? at + 1 : event.key === 'ArrowLeft' ? at - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : null;
    if (to === null) return;
    event.preventDefault();
    select(TABS[(to + TABS.length) % TABS.length].id, true);
  };

  return (
    <div className="explore" data-tab={tab} data-look={look}>
      <div ref={list} className="explore-tabs" role="tablist" aria-label={`${name}: ${getCMSCopy("copy.ExploreTabs.label", "reports, gallery and stats")}`}>
        <span className="explore-tabs-ink" aria-hidden="true" />
        {TABS.map(({ id: t, icon: Icon, name: label }) => (
          <button key={t} ref={node => { buttons.current[t] = node; }} id={`${id}-${t}`} type="button" role="tab"
            aria-selected={tab === t} aria-controls={`${id}-${t}-panel`} tabIndex={tab === t ? 0 : -1}
            onClick={() => select(t)} onKeyDown={keys}>
            {look !== 'segmented' && <span className="explore-tab-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>}
            <span className="explore-tab-name">{label()}</span>
            {notes && <span className="explore-tab-note">{notes[t]}</span>}
          </button>
        ))}
      </div>
      {TABS.map(({ id: t }) => opened.includes(t) && (
        <div key={t} id={`${id}-${t}-panel`} className="explore-panel" role="tabpanel" aria-labelledby={`${id}-${t}`} hidden={tab !== t}>
          {panels[t]()}
        </div>
      ))}
    </div>
  );
};
