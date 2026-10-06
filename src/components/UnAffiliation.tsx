import React from 'react';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { SDGS } from '../data/sdgs';
import './un-affiliation.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.UnAffiliation.${key}`, fallback);

/* THE FOUNDATION'S UN STANDING, AND THE UN GOALS ITS WORK SERVES.

   The standing is special consultative status with the UN Economic and
   Social Council (ECOSOC), and it is stated in words. The UN emblem is not
   drawn, nor anything made to resemble it: the UN does not let organisations
   in consultative status use it. The UNDP logo appears beside the words only
   once it is uploaded to its slot in the CMS (Website images → "UnSeal ·
   undp-logo"), which is for when UNDP has agreed in writing to its use. */

/** UNDP's logo, when the foundation has UNDP's permission and has uploaded it. */
const undpLogo = () => resolveCMSAsset("asset.UnSeal.undp-logo", "");

/** The standing, as a small seal (covers, the footer) or as a panel that says
    what it means (Partners, Who we are). */
export const UnSeal: React.FC<{ variant?: 'seal' | 'panel'; className?: string }> = ({ variant = 'seal', className }) => {
  useCMSRevision();
  const logo = undpLogo();
  const mark = logo
    ? <img className="un-seal-logo" src={logo} alt={c('undp-alt', 'UNDP')} decoding="async" />
    : <span className="un-seal-globe" aria-hidden="true"><Globe2 size={variant === 'panel' ? 24 : 15} strokeWidth={1.6} /></span>;
  if (variant === 'seal') {
    return (
      <span className={`un-seal${className ? ` ${className}` : ''}`} data-variant="seal" title={c('title', 'Special consultative status with the United Nations Economic and Social Council (ECOSOC)')}>
        {mark}
        <span className="un-seal-words"><strong>{c('short', 'UN ECOSOC')}</strong><span>{c('status', 'Special consultative status')}</span></span>
      </span>
    );
  }
  return (
    <aside className={`un-seal${className ? ` ${className}` : ''}`} data-variant="panel" aria-label={c('panel-label', 'Our United Nations standing')}>
      {mark}
      <div className="un-seal-body">
        <p className="un-seal-kicker">{c('kicker', 'United Nations')}</p>
        <h3 className="un-seal-title">{c('panel-title', 'Special consultative status with ECOSOC')}</h3>
        <p className="un-seal-text">{c('panel-text', 'The foundation holds special consultative status with the United Nations Economic and Social Council (ECOSOC), which lets it take part in the UN’s work and contribute to the Sustainable Development Goals.')}</p>
        <a className="un-seal-link" href="https://ecosoc.un.org/en/ngo/consultative-status" target="_blank" rel="noopener noreferrer">
          {c('panel-link', 'What consultative status means')}<ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
};

/** UNEP's logo, as the foundation's own partners panel shows it (Partners);
    a sharper copy can be uploaded to its slot in the CMS (Website images →
    "UnepSeal · logo"). */
const unepLogo = () => resolveCMSAsset("asset.UnepSeal.logo", "/images/partners/unep.png");

/** The UN Environment Programme, as a seal in the seal's style: the Core
    Values and Projects covers carry it in place of the ECOSOC standing,
    UNEP's logo and, beside it, its name in full. */
export const UnepSeal: React.FC<{ className?: string }> = ({ className }) => {
  useCMSRevision();
  const name = c('unep-name', 'United Nations Environment Programme');
  return (
    <span className={`un-seal un-seal--unep${className ? ` ${className}` : ''}`} data-variant="seal" title={name}>
      <img className="un-seal-logo" src={unepLogo()} alt={c('unep-short', 'UNEP')} decoding="async" />
      <span className="un-seal-words"><span>{name}</span></span>
    </span>
  );
};

/** Whether an event marks a UN international day (its tag names the UN). */
export const isUnObservance = (tag?: string) => /united nations|\bUN\b/i.test(tag ?? '');

/** In place of a UN day's tag: a small mark saying it is a UN observance. */
export const UnDayMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span className="un-day" data-compact={compact || undefined}>
    <Globe2 size={compact ? 11 : 12} strokeWidth={2} aria-hidden="true" />{c('observance', 'UN observance')}
  </span>
);

/** The UN Sustainable Development Goals a cornerstone, project or programme
    advances: each goal's number in its own colour, its name, and a link to
    the UN's page for it. */
export const SdgTags: React.FC<{ goals: number[]; label?: string; className?: string }> = ({ goals, label, className }) => {
  useCMSRevision();
  if (!goals.length) return null;
  return (
    <div className={`sdg-tags${className ? ` ${className}` : ''}`}>
      <span className="sdg-tags-label"><Globe2 size={14} strokeWidth={1.7} aria-hidden="true" />{label ?? c('sdg-label', 'Advancing the UN Sustainable Development Goals')}</span>
      <ul>
        {goals.map(goal => {
          const sdg = SDGS[goal];
          return (
            <li key={goal}>
              <a href={`https://sdgs.un.org/goals/goal${goal}`} target="_blank" rel="noopener noreferrer" style={{ '--sdg': sdg.color } as React.CSSProperties}
                title={`${c('sdg-title', 'UN Sustainable Development Goal')} ${goal}: ${sdg.name}`}>
                <b>{goal}</b><span>{sdg.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
