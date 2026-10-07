import React from 'react';
import { CalendarDays, Download, FileText } from 'lucide-react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import type { Activity } from '../data/activities';
import { PROGRAMME_SDGS, SDGS } from '../data/sdgs';
import { printReport } from '../utils/printReport';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ReportActions.${key}`, fallback);

/* The foundation's own published report for each cornerstone and project: a
   PDF uploaded to its slot in the CMS (Website images → "Reports · …"). Until
   one is, the slot is empty and only the report built from the figures is
   offered. */
const PUBLISHED: Record<string, () => string> = {
  heal: () => resolveCMSAsset("asset.Reports.heal", ""),
  enrich: () => resolveCMSAsset("asset.Reports.enrich", ""),
  empower: () => resolveCMSAsset("asset.Reports.empower", ""),
  'project-amrit': () => resolveCMSAsset("asset.Reports.project-amrit", ""),
  'oneness-vann': () => resolveCMSAsset("asset.Reports.oneness-vann", ""),
  watershed: () => resolveCMSAsset("asset.Reports.watershed", ""),
  'adopted-villages': () => resolveCMSAsset("asset.Reports.adopted-villages", ""),
};

/** At the head of a Reports tab: the period and source of its figures, the
    foundation's published report when there is one, and a copy of this
    report to save as a PDF. */
export const ReportActions: React.FC<{
  /** The cornerstone or project the report is for (its key in PUBLISHED). */
  id: string;
  title: string;
  ink: string;
  programmes: Activity[];
}> = ({ id, title, ink, programmes }) => {
  useCMSRevision();
  const published = PUBLISHED[id]?.() ?? '';
  const periods = programmes.map(programme => programme.period).filter((period, i, all) => all.indexOf(period) === i);
  const period: string = periods.length === 1 ? periods[0] : c('periods', 'Each programme’s own reporting period');
  const source = c('source', 'Source: the foundation’s activity report · figures shown as reported');
  const save = () => printReport({
    title: `${title} — ${c('report', 'Activity report')}`,
    subtitle: period,
    ink,
    foundation: c('foundation', 'Sant Nirankari Charitable Foundation'),
    source,
    programmes: programmes.map(programme => ({
      title: programme.title,
      blurb: programme.blurb,
      period: programme.period,
      dataPoints: programme.dataPoints,
      goals: (PROGRAMME_SDGS[programme.id] ?? []).map(goal => `SDG ${goal} ${SDGS[goal].name}`),

    })),
  });
  return (
    <div className="report-actions">
      <div className="report-actions-meta">
        <span className="report-period"><CalendarDays size={14} aria-hidden="true" />{period}</span>
        <span className="report-source">{source}</span>
      </div>
      <div className="report-actions-buttons">
        {published && (
          <a className="report-published" href={published} target="_blank" rel="noopener noreferrer">
            <FileText size={16} aria-hidden="true" />{c('published', 'The published report (PDF)')}
          </a>
        )}
        <button type="button" className="report-save" onClick={save} title={c('save-hint', 'Opens a printable copy: choose “Save as PDF”')}>
          <Download size={16} aria-hidden="true" />{c('save', 'Save as PDF')}
        </button>
      </div>
    </div>
  );
};
