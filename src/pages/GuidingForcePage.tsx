import React from 'react';
import { ArrowDown, ArrowUpRight, HeartHandshake, Trees, Droplets, Music } from 'lucide-react';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
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
 * It carried two more sections once — a second portrait and the five-Satguru
 * succession — and both were removed at the foundation's request. A living
 * spiritual lineage is not this site's to narrate; the page points towards
 * Satsang and the Mission's own literature instead. The CSS those sections
 * left behind (.gf-line*, .gf-second, .gf-portrait-sm, .gf-name-sm, .gf-lede)
 * has now been deleted too — it had been sitting unused since.
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

const UNDER_HER_GUIDANCE = [
  {
    title: 'Sant Nirankari Health City',
    text: 'A multi-specialty charitable hospital campus taking shape in North Delhi, meant to put advanced care within reach of those who cannot pay for it.',
  },
  {
    title: 'Oneness Vann',
    /* The count that used to close this sentence — "around a thousand of them
       across the country" — is not in the record. activities.ts reports 630
       sites as on September 2025 and calls itself the source of truth, so the
       prose carries no count and the page's figures carry the counted one. */
    text: 'Volunteers turning small plots into dense indigenous micro-forests across the country.',
  },
  {
    title: 'Project Amrit',
    text: 'A national effort with the Government of India to clean and revive rivers, ponds, ghats and beaches, and to keep them clean afterwards.',
  },
  {
    title: 'Nirankari Youth Symposium & NIMA',
    text: 'Platforms for young people — one for their questions, one for music and the performing arts.',
  },
];

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
const COVID = ACTIVITIES.find((a) => a.id === 'covid-relief');
const WANTED = ['Oxygen concentrators', 'Vaccination centres', 'Care centres', 'Total beds'];
const RELIEF = WANTED.map((l) => COVID?.dataPoints.find((d) => d.label === l)).filter(
  Boolean,
) as { label: string; value: string }[];

/** The disaster-relief fund, stated as an amount — never plated beside a
    count, for the reason the Core Values page sets out at length. */
const FUND = ACTIVITIES.find((a) => a.id === 'financial-support');
const RELIEF_FUND = FUND?.dataPoints.find((d) => d.label === 'Disaster relief & fund');

const roomProps = (id: string) => ({
  id,
  className: 'cv-room',
  style: { '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties,
  'aria-labelledby': `${id}-title`,
});

const GUIDANCE_LINKS = ['/projects#health-city', '/projects#project-oneness-vann', '/projects#project-amrit', '/core-values#enrich'];
const GUIDANCE_ICONS = [HeartHandshake, Trees, Droplets, Music];

const GuidingCover = () => <EditorialMotion><section className="ed-cover"><div className="ed-cover-copy" data-reveal><div className="ed-dots" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} />)}</div><p className="ed-eyebrow">Our Guiding Force</p><h1>Our guiding force</h1><p>Every camp, classroom and forest in this site traces back to spiritual guidance rather than a strategy document. This page says plainly where that guidance comes from.</p><a className="ed-link" href="#satguru">The present Satguru <ArrowDown size={17} /></a></div><figure className="ed-portrait" data-reveal><img src="/images/satguru-mata-sudiksha-ji.jpg" alt="Satguru Mata Sudiksha Ji Maharaj" width="500" height="600" fetchPriority="high" /><figcaption>Satguru Mata Sudiksha Ji Maharaj</figcaption></figure></section></EditorialMotion>;

export const GuidingForcePage: React.FC = () => (
  <PageShell
    cover={<GuidingCover />}
    accentPillarId="empower"
    eyebrow="Our Guiding Force"
    title="Our guiding force"
    standfirst="Every camp, classroom and forest in this site traces back to spiritual
      guidance rather than a strategy document. This page says plainly where
      that guidance comes from."
    rail={
      <SubsectionNav
        label="On this page"
        links={[
          /* the page's own ink, not the hall's five petal colours */
          { id: 'satguru', label: 'The present Satguru', ink: INK_B },
          { id: 'guidance', label: 'Under Her guidance', ink: INK_B },
          { id: 'gf-relief', label: 'COVID-19 response', ink: INK_B },
          { id: 'gf-media', label: 'Photographs & films', ink: INK_B },
        ]}
      />
    }
  >
    <EditorialMotion className="guiding-story">
    {/* ── 01 · THE PRESENT SATGURU ─────────────────────────────────────── */}
    <section data-reveal {...roomProps('satguru')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />

      {/* THE PORTRAIT TAKES THE BAND'S RIGHT-HAND SLOT — the place the
          projects put an official lockup, for the same reason: this page has
          one real image of its subject, and a drawn glyph beside it would be
          the collision that rule already refuses. It is DOM-last so a screen
          reader reaches Her name before the picture of Her. */}
      <EditorialHeading n={1} id="satguru" label="The present Satguru" title="Satguru Mata Sudiksha Ji Maharaj" body="Head of the Sant Nirankari Mission, whose subject is universal love, inner change and service asked of no one." />

      <div className="cv-chapter">
        <div className="ww-prose">
          <p className="font-artistic-serif">
            Her Holiness is the head of the Sant Nirankari Mission, a worldwide
            spiritual body whose concerns are peace, human oneness and the
            welfare of others. Her teaching reaches millions, and its subject is
            consistent: universal love, inner change, service asked of no one
            and offered to everyone, and the duty of being a decent citizen.
          </p>
          <p className="font-artistic-serif">
            What that produces is visible rather than theoretical. Volunteers
            reach earthquakes, floods and wildfires with relief and stay to
            rebuild. Through the COVID-19 emergency the Mission opened its own
            centres as quarantine and vaccination sites. Affordable healthcare,
            the education of the young, and the repair of the natural world are
            the three directions Her guidance has pushed hardest.
          </p>
          <blockquote className="gf-quote font-dancing-script">
            “Become One with the Formless One, so that we can become One with
            Everyone.”
          </blockquote>
        </div>
      </div>
    </section>

    {/* ── 02 · UNDER HER GUIDANCE ──────────────────────────────────────── */}
    <section data-reveal {...roomProps('guidance')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />
      <EditorialHeading n={2} id="guidance" label="What follows from it" title="Under Her guidance" body="Four undertakings the Mission runs, and one emergency it was counted through." />

      <div className="cv-chapter">
        <ul className="gf-works">
          {UNDER_HER_GUIDANCE.map((w, i) => (
            <li key={w.title} data-reveal>
              {React.createElement(GUIDANCE_ICONS[i], { size: 30, strokeWidth: 1.3, className: "gf-work-symbol" })}
              {i === 1 && <img className="gf-work-image" src="/images/mataji-rajpita-planting.webp" alt="A sapling planted at a Oneness Vann drive" loading="lazy" width="640" height="360" />}
              <strong className="font-artistic-heading">{w.title}</strong>
              <span className="font-artistic-serif">{w.text}</span>
              <a className="ed-link" href={GUIDANCE_LINKS[i]}>{i === 3 ? "Explore Enrich" : "Explore this project"} <ArrowUpRight size={16} /></a>
            </li>
          ))}
        </ul>

        {/* THE ONE THE PARAGRAPH ABOVE NAMES. Four figures, one activity, one
            date — so the ledger states its period once rather than per plate. */}
        {RELIEF.length > 0 && (
          <section id="gf-relief" className="gf-relief" aria-labelledby="gf-relief-title" data-reveal>
            <p className="ed-eyebrow">Historical response · 2022 total</p>
            <h3 id="gf-relief-title" className="cv-sub cv-sub-wide font-artistic-display">
              The COVID-19 emergency, as it was counted
            </h3>
            <ul className="cv-ledger" aria-label="COVID-19 relief figures">
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
              {COVID?.period} · the Mission's own centres, given over to
              quarantine, care and vaccination. The full record for every
              activity is on the Core Values page.
            </p>
          </section>
        )}
      </div>
    </section>

    {/* ── PHOTOGRAPHS & FILMS ──────────────────────────────────────────── */}
    <section id="gf-media">
      <MediaGallery section="guiding-force" headingLevel={2} layout="editorial" />
    </section>

    <div className="ed-closing" data-reveal><span className="ed-eyebrow">An invitation to listen</span><p>
      To hear any of this properly, attend a Satsang. This page can only point
      the way.
    </p></div>
    </EditorialMotion>
  </PageShell>
);
