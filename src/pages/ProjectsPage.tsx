import React from 'react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { MediaGallery } from '../components/MediaGallery';
import { ACTIVITIES } from '../data/activities';
import { PILLARS, EXTENDED_PILLARS } from '../data/pillars';

/**
 * PROJECTS — the four named undertakings, each given its own section.
 *
 * These differ from the cornerstone activities in kind: a cornerstone is a
 * standing commitment, a project is a campaign with a name, a start and a
 * measurable footprint. So each gets a full spread rather than a row — its
 * figures laid out as a plate, its scope stated, and a way through to the
 * page the foundation itself publishes about it.
 *
 * The four were tabbed once, which hid three projects behind a control and
 * gave each one nowhere to hang its own photographs. They are stacked now,
 * one spread each with its own plates, and the rail at the top of the page
 * does the job the tabs did — except it also says where you are.
 *
 * The fifth entry is Sant Nirankari Health City, which the foundation
 * headlines but which reports no figures yet — it is under construction. It
 * is listed honestly as such rather than padded with invented numbers, and
 * it keeps its outbound link because the Health City runs its own live site.
 *
 * Nothing here links to nirankarifoundation.org: this site replaces it and
 * that domain is being decommissioned. The figures below ARE the record now,
 * so there is no longer another page to send anyone to.
 */

/**
 * THE PROJECTS TAKE THEIR COLOUR FROM THE HALL.
 *
 * Amrit and Oneness Vann are rooms on the home page with inks of their own,
 * and the Watershed Programme sits under the Projects pillar. Those inks
 * were transcribed here by hand, which meant two copies of the same colour
 * and no way to keep them in step — the same drift that puts "over 9,100
 * camps" in prose above a record reading 9,174. They are looked up from
 * PILLARS now, so a project on this page is the colour of its room in the
 * exhibition, always.
 *
 * The Adopted Villages have no pillar of their own — they are the one
 * undertaking the hall does not give a room — so they carry an ink stated
 * here, and that is said plainly rather than hidden among lookups.
 */
const inkOf = (pillarId: string): [string, string] => {
  /* BOTH arrays. `PILLARS` holds only the four rooms the hall walks through;
     Amrit and Oneness live in `EXTENDED_PILLARS`. Searching the first alone
     found neither and silently returned the fallback, so three of the four
     projects came out the same generic blue — the failure looked like a
     colour choice rather than a missed lookup, which is why it needed
     measuring to catch. */
  const p =
    PILLARS.find((x) => x.id === pillarId) ??
    EXTENDED_PILLARS.find((x) => x.id === pillarId);
  return [p?.accentA ?? '#0d6a8c', p?.accentB ?? '#6ac8ed'];
};

const PROJECT_FACE: Record<
  string,
  { ink: string; ink2: string; scope: string }
> = {
  'Project Amrit': {
    ...(([a, b]) => ({ ink: a, ink2: b }))(inkOf('amrit')),
    scope: 'Launched 2023 · with the Government of India',
  },
  'Project Oneness Vann': {
    ...(([a, b]) => ({ ink: a, ink2: b }))(inkOf('oneness')),
    scope: 'Launched 2021 · indigenous micro-forests',
  },
  'Watershed Programme': {
    ...(([a, b]) => ({ ink: a, ink2: b }))(inkOf('projects')),
    scope: 'Arid-zone rejuvenation',
  },
  'Adopted Villages': {
    /* no room in the hall, so no pillar to read from */
    ink: '#b06a1f',
    ink2: '#f0b357',
    scope: 'Since 2017 · Haryana',
  },
};

/** 'Project Oneness Vann' -> 'project-oneness-vann' — the MEDIA key, the
    anchor id and the margin print all key off this one string, so a gallery
    can never silently miss its own room. */
const slug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const ProjectsPage: React.FC = () => {
  const projects = ACTIVITIES.filter((a) => a.pillarId === 'projects');

  return (
    <PageShell
      accentPillarId="projects"
      eyebrow="Projects · Named undertakings"
      title="The projects"
      standfirst="Four campaigns the foundation runs under their own names — each with a
        start, a footprint, and figures it reports against. A fifth is being
        built."
      rail={
        <SubsectionNav
          label="The projects"
          links={[
            ...projects.map((p) => ({
              id: slug(p.title),
              label: p.title.replace(/^Project /, ''),
              ink: PROJECT_FACE[p.title]?.ink2,
            })),
            { id: 'health-city', label: 'Health City', ink: '#9ad6ef' },
          ]}
        />
      }
    >
      {/* THE SPREADS */}
      {projects.map((p, i) => {
        const face = PROJECT_FACE[p.title];
        return (
          <section
            key={p.id}
            id={slug(p.title)}
            className="cv-room"
            style={{ '--ink-a': face?.ink, '--ink-b': face?.ink2 } as React.CSSProperties}
            aria-labelledby={`${slug(p.title)}-title`}
          >
            <div className="cv-margin-print" data-room={slug(p.title)} aria-hidden="true" />

            {/* the same threshold the cornerstones use — these are stacked
                now, and a project deserves the same announcement */}
            <header className="cv-threshold">
              {/* the project's own mark, in place of the shared petal that
                  used to say the same thing about all four */}
              <span
                className="cv-threshold-mark"
                data-for={slug(p.title)}
                aria-hidden="true"
              />
              <span className="cv-threshold-num font-artistic-heading" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="cv-threshold-label font-artistic-display">{face?.scope}</p>
              <h2
                id={`${slug(p.title)}-title`}
                className="cv-threshold-title font-artistic-heading"
              >
                {p.title}
              </h2>
              <p className="cv-threshold-body font-artistic-serif">{p.blurb}</p>
            </header>

            <article className="pj-spread">

            {/* THE HEADLINE PLATE */}
            <div className="pj-plate" data-for={slug(p.title)}>
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
            </footer>

            {/* THE PLATES */}
            <MediaGallery
              section={slug(p.title)}
              title={`${p.title.replace(/^Project /, '')} — photographs & films`}
            />
            </article>
          </section>
        );
      })}

      {/* THE ONE STILL BEING BUILT */}
      <section className="pj-forthcoming" id="health-city">
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
