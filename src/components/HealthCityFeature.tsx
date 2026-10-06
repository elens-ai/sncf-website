import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { onArrival } from '../utils/arrival';

/**
 * SANT NIRANKARI HEALTH CITY — open, and shown as it is.
 *
 * Its name is set in its own logo (from nirankarihealthcity.org); beneath
 * it, the campus's figures as the Health City itself states them on that
 * site (1,200+ beds in all, 500+ in its first phase, 1,500+ staff, 40+
 * specialties). Beside the words, its first days in three photographs laid
 * as prints: the hospital's team in its atrium, the dedication to the
 * service of humanity on 23 February 2026, and the plaque that records it.
 * The prints settle in one after another when the section comes into view.
 */
const STATS = () => [
  [getCMSCopy("copy.ProjectsPage.hcStat1Value", "1,200+"), getCMSCopy("copy.ProjectsPage.hcStat1Label", "Bedded Health City")],
  [getCMSCopy("copy.ProjectsPage.hcStat2Value", "500+"), getCMSCopy("copy.ProjectsPage.hcStat2Label", "Beds in Phase 1")],
  [getCMSCopy("copy.ProjectsPage.hcStat3Value", "1,500+"), getCMSCopy("copy.ProjectsPage.hcStat3Label", "Staff")],
  [getCMSCopy("copy.ProjectsPage.hcStat4Value", "40+"), getCMSCopy("copy.ProjectsPage.hcStat4Label", "Specialties")],
];

export const HealthCityFeature: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  return (
    <section ref={ref} className="project-health-city" id="health-city" aria-labelledby="health-city-title" data-arrived={arrived}>
      <div className="hc-copy">
        <p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.3532c25e1c80", "Now open / OPD services started")}</p>
        <h2 id="health-city-title" className="hc-logo">
          <img src={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.hcLogo", "/images/projects/health-city/logo.webp"))} alt={getCMSCopy("copy.ProjectsPage.hcLogoAlt", "Sant Nirankari Health City")} width={1200} height={266} decoding="async" />
        </h2>
        <p>{getCMSCopy("copy.ProjectsPage.d39d7428ab57", "A multi-specialty charitable hospital campus in North Delhi, intended to make advanced treatment more accessible.")}</p>
        <dl className="hc-stats" aria-describedby="hc-stats-source">
          {STATS().map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <p className="hc-stats-source" id="hc-stats-source">{getCMSCopy("copy.ProjectsPage.hcStatsSource", "As Sant Nirankari Health City states them")}</p>
        <p className="project-health-note">{getCMSCopy("copy.ProjectsPage.25984a49f9a1", "OPD services have started. Activity figures will be added as the campus begins reporting.")}</p>
        <a className="project-primary-link" href={getCMSLink("copy.Link.ProjectsPage.b03f7697e124", "https://www.nirankarihealthcity.org/")} target="_blank" rel="noopener noreferrer">{getCMSCopy("copy.ProjectsPage.5e3c06e2cdd5", "Visit Health City ")}<ArrowUpRight size={17} /></a>
      </div>
      <figure className="hc-collage">
        <span className="hc-dots hc-dots-a" aria-hidden="true" />
        <span className="hc-dots hc-dots-b" aria-hidden="true" />
        <span className="hc-print hc-print-team">
          <img src={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.hcTeam", "/images/projects/health-city/team.webp"))} alt={getCMSCopy("copy.ProjectsPage.hcTeamAlt", "The Health City's team gathered in the hospital's atrium")} width={1400} height={934} loading="lazy" decoding="async" />
        </span>
        <span className="hc-print hc-print-plaque">
          <img src={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.hcPlaque", "/images/projects/health-city/plaque.webp"))} alt={getCMSCopy("copy.ProjectsPage.hcPlaqueAlt", "The plaque recording that Satguru Mata Sudiksha Ji Maharaj dedicated the premises of Sant Nirankari Health City to the service of humanity on 23 February 2026")} width={900} height={1252} loading="lazy" decoding="async" />
        </span>
        <span className="hc-print hc-print-stage">
          <img src={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.hcDedication", "/images/projects/health-city/dedication.webp"))} alt={getCMSCopy("copy.ProjectsPage.hcDedicationAlt", "The ceremony dedicating Sant Nirankari Health City to the service of humanity")} width={1200} height={659} loading="lazy" decoding="async" />
        </span>
        <span className="hc-badge"><i aria-hidden="true" />{getCMSCopy("copy.ProjectsPage.hcBadge", "OPD services started")}</span>
        <figcaption className="hc-collage-caption">{getCMSCopy("copy.ProjectsPage.hcCollageCaption", "Dedicated to the service of humanity · 23 February 2026")}</figcaption>
      </figure>
    </section>
  );
};
