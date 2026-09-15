import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import React from 'react';
import { ArrowDown, ArrowUpRight, HeartHandshake, Trees, Droplets, Music } from 'lucide-react';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import { PageShell } from '../components/PageShell';
import { MediaGallery } from '../components/MediaGallery';
import { Tally } from '../components/Tally';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';

/**
 * OUR GUIDING FORCE — where the work gets its direction.
 *
 * The foundation's own page on this subject is about Satguru Mata Sudiksha
 * Ji Maharaj, and this page holds that centre of gravity exactly: the
 * present Satguru, at length, with the initiatives that carry Her guidance
 * into the world.
 *
 * IT IS BUILT AS ROOMS, like every other reading page. And it now carries
 * FIGURES: the page asserted that the guidance produces something "visible
 * rather than theoretical" and then showed nothing, while the activity
 * report had the COVID-19 relief numbers the sentence is actually about.
 */

/** Empower's ink — the cornerstone this page's shell already accents. */
const PILLAR = PILLARS.find((p) => p.id === 'empower');
const INK_A = PILLAR?.accentA ?? '#c2185b';
const INK_B = PILLAR?.accentB ?? '#f48fb1';

let UNDER_HER_GUIDANCE = bindCMSValue(() => ([
  {
    title: getCMSCopy("copy.GuidingForcePage.3c66946f7a8a", "Sant Nirankari Health City"),
    text: getCMSCopy("copy.GuidingForcePage.3e41e2816cc7", "A multi-specialty charitable hospital campus taking shape in North Delhi, meant to put advanced care within reach of those who cannot pay for it."),
  },
  {
    title: getCMSCopy("copy.GuidingForcePage.b98c09f4d313", "Oneness Vann"),
    /* The count that used to close this sentence — "around a thousand of them
       across the country" — is not in the record. activities.ts reports 630
       sites as on September 2025 and calls itself the source of truth, so the
       prose carries no count and the page's figures carry the counted one. */
    text: getCMSCopy("copy.GuidingForcePage.04b3679a46a7", "Volunteers turning small plots into dense indigenous micro-forests across the country."),
  },
  {
    title: getCMSCopy("copy.GuidingForcePage.a81619ca1e37", "Project Amrit"),
    text: getCMSCopy("copy.GuidingForcePage.0ad8c918c908", "A national effort with the Government of India to clean and revive rivers, ponds, ghats and beaches, and to keep them clean afterwards."),
  },
  {
    title: getCMSCopy("copy.GuidingForcePage.fb4c55902430", "Nirankari Youth Symposium & NIMA"),
    text: getCMSCopy("copy.GuidingForcePage.625e24c33bf4", "Platforms for young people — one for their questions, one for music and the performing arts."),
  },
]), value => { UNDER_HER_GUIDANCE = value; });

/**
 * THE EVIDENCE FOR THE SENTENCE ALREADY ON THE PAGE.
 *
 * "Through the COVID-19 emergency the Mission opened its own centres as
 * quarantine and vaccination sites" is a claim, and the report counted it.
 * These four are read out of the record rather than typed here, so a
 * correction upstream reaches the page; if a label is ever renamed the plate
 * disappears rather than printing a stale number under a live one.
 *
 * All four come from ONE activity and therefore share ONE date, which is why
 * the ledger can carry a single period line instead of four.
 */
/** The disaster-relief fund, stated as an amount — never plated beside a
    count, for the reason the Core Values page sets out at length. */


const roomProps = (id: string) => ({
  id,
  className: 'cv-room',
  style: { '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties,
  'aria-labelledby': `${id}-title`,
});

const GUIDANCE_LINKS = ['/projects#health-city', '/projects#project-oneness-vann', '/projects#project-amrit', '/core-values#enrich'];
const GUIDANCE_ICONS = [HeartHandshake, Trees, Droplets, Music];

const GuidingCover = () => <EditorialMotion><section className="ed-cover"><div className="ed-cover-copy" data-reveal><div className="ed-dots" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} />)}</div><p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.b733f26c2ca4", "Our Guiding Force")}</p><h1>{getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}</h1><p>{getCMSCopy("copy.GuidingForcePage.ff4066e1863f", "Every camp, classroom and forest in this site traces back to spiritual guidance rather than a strategy document. This page says plainly where that guidance comes from.")}</p><a className="ed-link" href={getCMSLink("copy.Link.GuidingForcePage.7783614ae9f5", "#satguru")}>{getCMSCopy("copy.GuidingForcePage.bc1bc49859a9", "The present Satguru ")}<ArrowDown size={17} /></a></div><figure className="ed-portrait" data-reveal><img src={resolveCMSAsset("asset.GuidingForcePage.56b9a5e0ea79", "/images/satguru-mata-sudiksha-ji.jpg")} alt={getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")} width="500" height="600" fetchPriority="high" /><figcaption>{getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")}</figcaption></figure></section></EditorialMotion>;

export const GuidingForcePage: React.FC = () => {
const COVID = ACTIVITIES.find((a) => a.id === 'covid-relief');
const WANTED = ['Oxygen concentrators', 'Vaccination centres', 'Care centres', 'Total beds'];
const RELIEF = WANTED.map((l) => COVID?.dataPoints.find((d) => d.label === l)).filter(
  Boolean,
) as { label: string; value: string }[];


const FUND = ACTIVITIES.find((a) => a.id === 'financial-support');
const RELIEF_FUND = FUND?.dataPoints.find((d) => d.label === 'Disaster relief & fund');
return (
  <PageShell
    cover={<GuidingCover />}
    accentPillarId="empower"
    eyebrow={getCMSCopy("copy.GuidingForcePage.b733f26c2ca4", "Our Guiding Force")}
    title={getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}
    standfirst={getCMSCopy("copy.GuidingForcePage.8b08fcc76f90", "Every camp, classroom and forest in this site traces back to spiritual\n      guidance rather than a strategy document. This page says plainly where\n      that guidance comes from.")}

  >
    <EditorialMotion className="guiding-story">
    {/* ── 01 · THE PRESENT SATGURU ─────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.satguru"><section data-reveal {...roomProps('satguru')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />

      {/* THE PORTRAIT TAKES THE BAND'S RIGHT-HAND SLOT — the place the
          projects put an official lockup, for the same reason: this page has
          one real image of its subject, and a drawn glyph beside it would be
          the collision that rule already refuses. It is DOM-last so a screen
          reader reaches Her name before the picture of Her. */}
      <EditorialHeading n={1} id="satguru" label={getCMSCopy("copy.GuidingForcePage.d16757403eaf", "The present Satguru")} title={getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")} body={getCMSCopy("copy.GuidingForcePage.d42bb56cd2a9", "Head of the Sant Nirankari Mission, whose subject is universal love, inner change and service asked of no one.")} />

      <div className="cv-chapter">
        <div className="ww-prose">
          <p className="font-artistic-serif">{getCMSCopy("copy.GuidingForcePage.9c10007c694f", "Her Holiness is the head of the Sant Nirankari Mission, a worldwide spiritual body whose concerns are peace, human oneness and the welfare of others. Her teaching reaches millions, and its subject is consistent: universal love, inner change, service asked of no one and offered to everyone, and the duty of being a decent citizen.")}</p>
          <p className="font-artistic-serif">{getCMSCopy("copy.GuidingForcePage.789311938ee2", "What that produces is visible rather than theoretical. Volunteers reach earthquakes, floods and wildfires with relief and stay to rebuild. Through the COVID-19 emergency the Mission opened its own centres as quarantine and vaccination sites. Affordable healthcare, the education of the young, and the repair of the natural world are the three directions Her guidance has pushed hardest.")}</p>
          <blockquote className="gf-quote font-dancing-script">{getCMSCopy("copy.GuidingForcePage.6c4e91b61bcb", "“Become One with the Formless One, so that we can become One with Everyone.”")}</blockquote>
        </div>
      </div>
    </section></CMSSection>

    <CMSSection id="GuidingForcePage.rajpita"><section id="rajpita" className="gf-rajpita" aria-labelledby="rajpita-title" data-reveal>
      <figure className="gf-rajpita-portrait">
        <img src={resolveCMSAsset('asset.GuidingForcePage.rajpita', '/images/nirankari-rajpita-ramit-ji.jpg')} alt={getCMSCopy('copy.GuidingForcePage.rajpitaName', 'Nirankari Rajpita Ramit Ji')} width="831" height="1134" loading="lazy" />
        <figcaption>{getCMSCopy('copy.GuidingForcePage.rajpitaName', 'Nirankari Rajpita Ramit Ji')}</figcaption>
      </figure>
      <div className="gf-rajpita-copy">
        <p className="ed-eyebrow">{getCMSCopy('copy.GuidingForcePage.rajpitaEyebrow', 'A shared spirit of service')}</p>
        <h2 id="rajpita-title">{getCMSCopy('copy.GuidingForcePage.rajpitaName', 'Nirankari Rajpita Ramit Ji')}</h2>
        <span className="gf-rajpita-rule" aria-hidden="true" />
        <p>{getCMSCopy('copy.GuidingForcePage.rajpitaBody', 'At the heart of the Nirankari spirit is a simple invitation: to see humanity as one family and to meet one another with love, respect and understanding.')}</p>
        <p>{getCMSCopy('copy.GuidingForcePage.rajpitaService', 'This spirit finds expression in everyday acts of care — giving time, sharing what we can, and serving with humility. It is the shared purpose that connects the foundation’s work in healthcare, education and community welfare.')}</p>
        <div className="gf-rajpita-signature">{getCMSCopy('copy.GuidingForcePage.rajpitaSignature', 'Together, in the spirit of oneness.')}</div>
      </div>
    </section></CMSSection>

    {/* ── 02 · UNDER HER GUIDANCE ──────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.guidance"><section data-reveal {...roomProps('guidance')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />
      <EditorialHeading n={2} id="guidance" label={getCMSCopy("copy.GuidingForcePage.a367e6652e45", "What follows from it")} title={getCMSCopy("copy.GuidingForcePage.457585ce2838", "Under Her guidance")} body={getCMSCopy("copy.GuidingForcePage.ee5bdda7de91", "Four undertakings the Mission runs, and one emergency it was counted through.")} />

      <div className="cv-chapter">
        <ul className="gf-works">
          {UNDER_HER_GUIDANCE.map((w, i) => (
            <li key={w.title} data-reveal>
              {React.createElement(GUIDANCE_ICONS[i], { size: 30, strokeWidth: 1.3, className: "gf-work-symbol" })}
              {i === 1 && <img className="gf-work-image" src={resolveCMSAsset("asset.GuidingForcePage.4daa8ff53979", "/images/mataji-rajpita-planting.webp")} alt={getCMSCopy("copy.GuidingForcePage.b779045462c9", "A sapling planted at a Oneness Vann drive")} loading="lazy" width="640" height="360" />}
              <strong className="font-artistic-heading">{w.title}</strong>
              <span className="font-artistic-serif">{w.text}</span>
              <a className="ed-link" href={GUIDANCE_LINKS[i]}>{i === 3 ? "Explore Enrich" : "Explore this project"} <ArrowUpRight size={16} /></a>
            </li>
          ))}
        </ul>

        {/* THE ONE THE PARAGRAPH ABOVE NAMES. Four figures, one activity, one
            date — so the ledger states its period once rather than per plate. */}
        {RELIEF.length > 0 && (
          <CMSSection id="GuidingForcePage.gf-relief"><section id="gf-relief" className="gf-relief" aria-labelledby="gf-relief-title" data-reveal>
            <p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.b19c990fc4cd", "Historical response · 2022 total")}</p>
            <h3 id="gf-relief-title" className="cv-sub cv-sub-wide font-artistic-display">{getCMSCopy("copy.GuidingForcePage.b9c6d4099b41", "The COVID-19 emergency, as it was counted")}</h3>
            <ul className="cv-ledger" aria-label={getCMSCopy("copy.GuidingForcePage.747466c9112f", "COVID-19 relief figures")}>
              {RELIEF.map((d) => (
                <li key={d.label}>
                  <Tally value={d.value} className="cv-ledger-value font-artistic-heading" />
                  <span className="cv-ledger-label">{d.label}</span>
                </li>
              ))}
            </ul>
            {RELIEF_FUND && (
              <ul className="cv-amounts">
                <li>
                  <span className="cv-amount-name">{FUND?.title}</span>
                  <span className="cv-amount-value font-artistic-heading">
                    {RELIEF_FUND.value}
                  </span>
                  <span className="cv-amount-unit">{RELIEF_FUND.label}</span>
                  <span className="cv-tally-period">{FUND?.period}</span>
                </li>
              </ul>
            )}
            <p className="cv-scale-note">
              {COVID?.period}{getCMSCopy("copy.GuidingForcePage.0bfa7d2ab669", " · the Mission's own centres, given over to quarantine, care and vaccination. The full record for every activity is on the Core Values page.")}</p>
          </section></CMSSection>
        )}
      </div>
    </section></CMSSection>

    {/* ── PHOTOGRAPHS & FILMS ──────────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.gf-media"><section id="gf-media">
      <MediaGallery section="guiding-force" headingLevel={2} layout="editorial" />
    </section></CMSSection>

    <div className="ed-closing" data-reveal><span className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.cfc915c141b5", "An invitation to listen")}</span><p>{getCMSCopy("copy.GuidingForcePage.be3639b3ac91", "To hear any of this properly, attend a Satsang. This page can only point the way.")}</p></div>
    </EditorialMotion>
  </PageShell>
);
};
