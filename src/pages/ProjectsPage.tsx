import React, { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { ACTIVITIES } from '../data/activities';

/**
 * PROJECTS — the four named undertakings, each given its own section.
 *
 * These differ from the cornerstone activities in kind: a cornerstone is a
 * standing commitment, a project is a campaign with a name, a start and a
 * measurable footprint. So each gets a full spread rather than a row — its
 * figures laid out as a plate, its scope stated, and a way through to the
 * page the foundation itself publishes about it.
 *
 * The fifth entry is Sant Nirankari Health City, which the foundation
 * headlines but which reports no figures yet — it is under construction. It
 * is listed honestly as such rather than padded with invented numbers.
 */

/** Per-project presentation: the ink it wears and where it lives officially. */
const PROJECT_FACE: Record<
  string,
  { ink: string; ink2: string; scope: string; href?: string }
> = {
  'Project Amrit': {
    ink: '#00796b',
    ink2: '#4db6ac',
    scope: 'Launched 2023 · with the Government of India',
    href: 'https://nirankarifoundation.org/project-amrit/',
  },
  'Project Oneness Vann': {
    ink: '#6a1b9a',
    ink2: '#ba68c8',
    scope: 'Launched 2021 · indigenous micro-forests',
    href: 'https://nirankarifoundation.org/oneness-vann/',
  },
  'Watershed Programme': {
    ink: '#0d6a8c',
    ink2: '#6ac8ed',
    scope: 'Arid-zone rejuvenation',
    href: 'https://nirankarifoundation.org/watershed-program/',
  },
  'Adopted Villages': {
    ink: '#b06a1f',
    ink2: '#f0b357',
    scope: 'Since 2017 · Haryana',
    href: 'https://nirankarifoundation.org/adopted-villages/',
  },
};

export const ProjectsPage: React.FC = () => {
  const projects = ACTIVITIES.filter((a) => a.pillarId === 'projects');
  const [active, setActive] = useState<string>(projects[0]?.id ?? '');

  return (
    <PageShell
      accentPillarId="projects"
      eyebrow="Projects · Named undertakings"
      title="The projects"
      standfirst="Four campaigns the foundation runs under their own names — each with a
        start, a footprint, and figures it reports against. A fifth is being
        built."
    >
      {/* THE RAIL — one tab per project, the ink changing with the choice */}
      <nav className="pj-rail" aria-label="Choose a project">
        {projects.map((p) => {
          const face = PROJECT_FACE[p.title];
          const on = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className="pj-tab"
              data-on={on}
              aria-pressed={on}
              style={
                { '--ink-a': face?.ink, '--ink-b': face?.ink2 } as React.CSSProperties
              }
              onClick={() => setActive(p.id)}
            >
              {p.title.replace(/^Project /, '')}
            </button>
          );
        })}
      </nav>

      {/* THE SPREADS */}
      {projects.map((p) => {
        const face = PROJECT_FACE[p.title];
        if (active !== p.id) return null;
        return (
          <article
            key={p.id}
            className="pj-spread"
            style={{ '--ink-a': face?.ink, '--ink-b': face?.ink2 } as React.CSSProperties}
          >
            <header className="pj-head">
              <p className="pj-scope font-artistic-display">{face?.scope}</p>
              <h2 className="pj-title font-artistic-heading">{p.title}</h2>
              <p className="pj-blurb font-artistic-serif">{p.blurb}</p>
            </header>

            {/* THE HEADLINE PLATE */}
            <div className="pj-plate">
              <span className="pj-plate-value font-artistic-heading">
                {p.headline.value}
              </span>
              <span className="pj-plate-label">{p.headline.label}</span>
            </div>

            {/* EVERY FIGURE IT REPORTS */}
            <dl className="pj-points">
              {p.dataPoints.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd className="font-artistic-heading">{d.value}</dd>
                </div>
              ))}
            </dl>

            <footer className="pj-foot">
              <span className="pj-period font-artistic-serif">{p.period}</span>
              {face?.href && (
                <a
                  className="pj-link"
                  href={face.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the foundation's own page →
                </a>
              )}
            </footer>
          </article>
        );
      })}

      {/* THE ONE STILL BEING BUILT */}
      <section className="pj-forthcoming">
        <p className="pj-forthcoming-eyebrow font-artistic-display">Under construction</p>
        <h2 className="pj-forthcoming-title font-artistic-heading">
          Sant Nirankari Health City
        </h2>
        <p className="font-artistic-serif">
          A multi-specialty charitable hospital campus rising in North Delhi —
          the foundation's largest healthcare undertaking, intended to put
          advanced treatment within reach of people who could not otherwise
          afford it. It reports no activity figures yet, because it has not
          opened. When it does, its record will stand here with the rest.
        </p>
        <a
          className="pj-link"
          href="https://www.nirankarihealthcity.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow its progress →
        </a>
      </section>
    </PageShell>
  );
};
