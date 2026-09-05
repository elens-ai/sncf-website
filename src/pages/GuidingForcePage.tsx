import React from 'react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { MediaGallery } from '../components/MediaGallery';

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
 * Satsang and the Mission's own literature instead.
 */

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
    rail={
      <SubsectionNav
        label="On this page"
        links={[
          { id: 'satguru', label: 'The present Satguru', ink: '#b357ad' },
          { id: 'guidance', label: 'Under Her guidance', ink: '#09a6cf' },
          { id: 'gf-media', label: 'Photographs & films', ink: '#69b947' },
        ]}
      />
    }
  >
    {/* THE PRESENT SATGURU */}
    <section className="gf-present" id="satguru">
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
    <section id="guidance">
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

    <section id="gf-media">
      <MediaGallery section="guiding-force" headingLevel={2} />
    </section>

    <p className="gf-footnote font-artistic-serif">
      To hear any of this properly, attend a Satsang. This page can only point
      the way.
    </p>
  </PageShell>
);
