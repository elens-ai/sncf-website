import React from 'react';
import { PageShell } from '../components/PageShell';

/**
 * OUR GUIDING FORCE — where the work gets its direction.
 *
 * The foundation's own page on this subject is about Satguru Mata Sudiksha
 * Ji Maharaj, and this page keeps that centre of gravity: the present
 * Satguru first, at length, with the initiatives that carry Her guidance
 * into the world; then the succession that led here, named plainly.
 *
 * The succession is stated as fact — who, in what order, and what each is
 * known for. It is deliberately not embroidered: this is a living spiritual
 * lineage, and the site's job is to point towards Satsang and the Mission's
 * own literature, never to interpret on their behalf. Portraits exist in the
 * repository for the present Satguru and Nirankari Rajpita Ji only; the
 * earlier Satgurus are given their place in the line without invented
 * imagery.
 */

const LINEAGE = [
  {
    name: 'Baba Buta Singh Ji',
    era: 'Founder · 1929',
    note: 'Began the Mission, teaching that God is formless and knowable in this life.',
  },
  {
    name: 'Baba Avtar Singh Ji',
    era: 'Second Satguru',
    note: 'Gave the Mission its scale and its sacred verses, the Avtar Bani.',
  },
  {
    name: 'Baba Gurbachan Singh Ji',
    era: 'Third Satguru',
    note: 'Carried the message beyond India and gave his life for it.',
  },
  {
    name: 'Baba Hardev Singh Ji',
    era: 'Fourth Satguru',
    note: 'Turned the Mission decisively towards service — the charge this foundation was founded on.',
  },
  {
    name: 'Satguru Mata Sudiksha Ji Maharaj',
    era: 'Present Satguru',
    note: 'Guides the Mission today, with a particular emphasis on youth, health and the environment.',
    present: true,
  },
];

const UNDER_HER_GUIDANCE = [
  {
    title: 'Sant Nirankari Health City',
    text: 'A multi-specialty charitable hospital campus taking shape in North Delhi, meant to put advanced care within reach of those who cannot pay for it.',
  },
  {
    title: 'Oneness Vann',
    text: 'Volunteers turning small plots into dense indigenous micro-forests — around a thousand of them across the country.',
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

export const GuidingForcePage: React.FC = () => (
  <PageShell
    accentPillarId="empower"
    eyebrow="Our Guiding Force"
    title="Our guiding force"
    standfirst="Every camp, classroom and forest in this site traces back to spiritual
      guidance rather than a strategy document. This page says plainly where
      that guidance comes from."
  >
    {/* THE PRESENT SATGURU */}
    <section className="gf-present">
      <figure className="gf-portrait">
        <img
          src="/images/satguru-mata-sudiksha-ji.jpg"
          alt="Portrait of Satguru Mata Sudiksha Ji Maharaj"
          loading="lazy"
        />
      </figure>
      <div className="gf-present-text">
        <p className="gf-eyebrow font-artistic-display">The present Satguru</p>
        <h2 className="gf-name font-artistic-heading">
          Satguru Mata Sudiksha Ji Maharaj
        </h2>
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
    </section>

    {/* WHAT FOLLOWS FROM IT */}
    <section>
      <h2 className="gf-section-title font-artistic-display">
        Under Her guidance
      </h2>
      <ul className="gf-works">
        {UNDER_HER_GUIDANCE.map((w) => (
          <li key={w.title}>
            <strong className="font-artistic-heading">{w.title}</strong>
            <span className="font-artistic-serif">{w.text}</span>
          </li>
        ))}
      </ul>
    </section>

    {/* RAJPITA JI */}
    <section className="gf-second">
      <figure className="gf-portrait gf-portrait-sm">
        <img
          src="/images/nirankari-rajpita-ramit-ji.jpg"
          alt="Portrait of Nirankari Rajpita Ramit Ji"
          loading="lazy"
        />
      </figure>
      <div>
        <h2 className="gf-name gf-name-sm font-artistic-heading">
          Nirankari Rajpita Ramit Ji
        </h2>
        <p className="font-artistic-serif">
          A guiding presence alongside Satguru Mata Sudiksha Ji Maharaj, seen
          throughout the Mission’s service work — including the plantation
          drives that have become one of its most visible commitments.
        </p>
      </div>
    </section>

    {/* THE LINE */}
    <section>
      <h2 className="gf-section-title font-artistic-display">The succession</h2>
      <p className="gf-lede font-artistic-serif">
        Five Satgurus have led the Sant Nirankari Mission since 1929. The line
        is given here as it stands; what each taught belongs to the Mission’s
        own literature and to Satsang, not to a website.
      </p>
      <ol className="gf-line">
        {LINEAGE.map((l) => (
          <li key={l.name} data-present={l.present ? 'true' : undefined}>
            <span className="gf-line-era font-artistic-display">{l.era}</span>
            <span className="gf-line-name font-artistic-heading">{l.name}</span>
            <span className="gf-line-note font-artistic-serif">{l.note}</span>
          </li>
        ))}
      </ol>
    </section>

    <p className="gf-footnote font-artistic-serif">
      To hear any of this properly, attend a Satsang. This page can only point
      the way.
    </p>
  </PageShell>
);
