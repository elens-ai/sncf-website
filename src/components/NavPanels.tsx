import React from 'react';
import { ArrowUpRight, Award, BookOpen, Compass, Handshake, Hospital, Mail, Milestone, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { ACTIVITIES, type Activity } from '../data/activities';
import type { NavLink, PillarGroup } from '../data/navigation';
import { PILLARS } from '../data/pillars';
import { slug } from '../utils/slug';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { PillarModelCard } from './PillarModelCard';
import { UnSeal } from './UnAffiliation';

const c = (key: string, fallback: string) => getCMSCopy(`copy.NavPanels.${key}`, fallback);

/* THE MENUS' PANELS, each a small map of what its page holds.
     · Core Values: a card for each cornerstone (its door, with its leading
       figure and its programmes, each with its symbol).
     · Projects: a card for each project (its photograph, symbol and leading
       figure), and beside them the Health City and the way to all projects.
     · Any other menu (Who we are): its links, each with a symbol and a line
       on what it opens, beside the foundation's motto and standing.
   The links themselves stay those of the navigation (and its CMS); the
   panels only dress them from the programmes they point at. */

/** A link inside the site is a router link; any other opens in a new tab. */
const Go: React.FC<{ link: NavLink; className?: string; onNavigate: () => void; children: React.ReactNode }> = ({ link, className, onNavigate, children }) =>
  link.href.startsWith('/') && !link.external
    ? <Link to={link.href} className={className} onClick={onNavigate}>{children}</Link>
    : <a href={link.href} className={className} onClick={onNavigate} target="_blank" rel="noopener noreferrer">{children}</a>;

/* the programme a link points at: /core-values#<id> or /projects#<its title's slug> */
const programmeOf = (href: string): Activity | undefined => {
  const [path, hash] = href.split('#');
  if (!hash) return undefined;
  return path === '/core-values' ? ACTIVITIES.find(a => a.id === hash) : path === '/projects' ? ACTIVITIES.find(a => a.pillarId === 'projects' && slug(a.title) === hash) : undefined;
};
const symbolOf = (activity?: Activity) => (activity?.icon ? ACTIVITY_SYMBOLS[activity.icon] : undefined);

export const ValuesPanel: React.FC<{ groups: PillarGroup[]; onNavigate: () => void }> = ({ groups, onNavigate }) => (
  <>
    <div className="nvrooms">
      {groups.map((group, gi) => {
        const pillar = PILLARS.find(p => p.id === group.pillarId);
        const programmes = ACTIVITIES.filter(a => a.pillarId === group.pillarId);
        const lead = programmes[0];
        const all = group.links.find(l => l.label.startsWith('All of')) ?? { label: group.title, href: `/core-values#${group.pillarId}` };
        const rows = group.links.filter(l => !l.label.startsWith('All of'));
        return (
          <div key={group.pillarId} className="nvroom" style={{ '--ink-a': pillar?.accentA ?? '#3a3f57', '--ink-b': pillar?.accentB ?? '#ffffff', '--i': gi } as React.CSSProperties}>
            <Go link={all} className="nvroom-door" onNavigate={onNavigate}>
              <img className="nvroom-emblem" src={resolveCMSMedia(`/images/vertical-${group.pillarId}.webp`)} alt="" aria-hidden="true" />
              <span className="nvroom-folio" aria-hidden="true">{String(gi + 1).padStart(2, '0')}</span>
              <span className="nvroom-name font-artistic-display">{group.title}</span>
              <span className="nvroom-blurb">{group.blurb}</span>
              {lead && <span className="nvroom-figure"><strong>{lead.headline.value}</strong> {lead.headline.label}</span>}
            </Go>
            <ul className="nvroom-index">
              {rows.map(link => {
                const Symbol = symbolOf(programmeOf(link.href));
                return (
                  <li key={link.label}>
                    <Go link={link} className="nvroom-row" onNavigate={onNavigate}>
                      {Symbol ? <Symbol size={15} strokeWidth={1.7} aria-hidden="true" /> : <span className="nvroom-row-dot" aria-hidden="true" />}
                      <span>{link.label}</span>
                      <ArrowUpRight className="nvroom-row-arrow" size={13} aria-hidden="true" />
                    </Go>
                  </li>
                );
              })}
            </ul>

          </div>
        );
      })}
    </div>
  </>
);

export const ProjectsPanel: React.FC<{ links: NavLink[]; onNavigate: () => void }> = ({ links, onNavigate }) => {
  const cards = links.map(link => ({ link, project: programmeOf(link.href) })).filter(card => card.project);
  const others = links.filter(link => !programmeOf(link.href));
  const all = others.find(link => link.href === '/projects');
  const away = others.filter(link => link !== all);
  return (
    <div className="nvprojects">
      <ul className="nvproject-cards">
        {cards.map(({ link, project }, i) => {
          const isAmrit = project!.id === 'project-amrit';
          const isOneness = project!.id === 'oneness-vann';
          const isEmpower = project!.id === 'watershed' || project!.id === 'adopted-villages';
          const modelId = isAmrit ? 'amrit' : isOneness ? 'oneness' : 'projects';
          const modelUrl = isAmrit ? resolveCMSAsset('asset.ProjectFilms.amritModel', '/models/project-amrit-full.glb') : isOneness ? resolveCMSAsset('asset.ProjectFilms.onenessModel', '/models/project-oneness-full.glb') : undefined;
          return (
            <li key={link.href} style={{ '--i': i } as React.CSSProperties}>
              <Go link={link} className="nvproject" onNavigate={onNavigate}>
                <span className="nvproject-model" data-project={project!.id} aria-hidden="true"><PillarModelCard id={modelId} label={link.label} modelUrl={modelUrl} look={isEmpower ? 'projects-empower' : 'light'} active={false} animate={false} /></span>
                <span className="nvproject-words">
                  <span className="nvproject-name">{link.label}</span>
                </span>
              </Go>
            </li>
          );
        })}
      </ul>
      <div className="nvprojects-side">
        {away.map(link => (
          /* the Health City shows its building, the photograph its project page uses */
          <Go key={link.href} link={link} className={`nvfeature${/healthcity/i.test(link.href) ? ' nvfeature-city' : ''}`} onNavigate={onNavigate}>
            {/healthcity/i.test(link.href) && <img className="nvfeature-photo" src={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.healthCity", "/images/projects/health-city.webp"))} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
            <span className="nvfeature-icon" aria-hidden="true"><Hospital size={20} strokeWidth={1.6} /></span>
            <span className="nvfeature-name">{link.label}</span>
            <span className="nvfeature-go">{c('feature-visit', 'Visit')}<ArrowUpRight size={14} aria-hidden="true" /></span>
          </Go>
        ))}
        {all && (
          <Go link={all} className="nvpanel-explore" onNavigate={onNavigate}>
            {all.label}<ArrowUpRight size={15} aria-hidden="true" />
          </Go>
        )}
      </div>
    </div>
  );
};

/* a symbol and a line for each of Who we are's destinations, by its anchor */
const WHO: Record<string, { icon: LucideIcon; line: () => string }> = {
  account: { icon: BookOpen, line: () => c('who-account', 'Our story since 2010') },
  mission: { icon: Compass, line: () => c('who-mission', 'What drives the work') },
  road: { icon: Milestone, line: () => c('who-road', 'Milestones along the way') },
  partners: { icon: Handshake, line: () => c('who-partners', 'Organisations beside us') },
  contact: { icon: Mail, line: () => c('who-contact', 'Write, call or visit') },
  awards: { icon: Award, line: () => c('who-awards', 'Honours for the service') },
};

export const LinksPanel: React.FC<{ links: NavLink[]; onNavigate: () => void }> = ({ links, onNavigate }) => (
  <div className="nvlinks">
    <ul className="nvlist">
      {links.map((link, i) => {
        const known = WHO[link.href.split('#')[1] ?? ''];
        const Symbol = known?.icon;
        return (
          <li key={link.label} style={{ '--i': i } as React.CSSProperties}>
            <Go link={link} className="nvlink" onNavigate={onNavigate}>
              <span className="nvlink-icon" aria-hidden="true">{Symbol ? <Symbol size={16} strokeWidth={1.7} /> : <ArrowUpRight size={15} />}</span>
              <span className="nvlink-words"><span className="nvlink-name">{link.label}</span>{known && <span className="nvlink-line">{known.line()}</span>}</span>
            </Go>
          </li>
        );
      })}
    </ul>
    <aside className="nvlinks-side">
      <p className="nvlinks-motto font-signature">{c('motto', 'Service with Humility')}</p>
      <p className="nvlinks-facts">{c('facts', 'Since 2010 · 250+ branches nationwide')}</p>
      <UnSeal />
    </aside>
  </div>
);
