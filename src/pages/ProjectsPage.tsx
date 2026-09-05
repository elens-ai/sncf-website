import React from 'react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { MediaGallery } from '../components/MediaGallery';
import { ACTIVITIES } from '../data/activities';
import { PILLARS } from '../data/pillars';

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
 * ONE INK FOR THE WHOLE FAMILY.
 *
 * The Projects card in the hall is a single deep blue, and that blue IS the
 * projects' colour — the five undertakings are one programme of work, not
 * five brands. They were briefly given a colour each (Amrit teal, Vann
 * purple, Villages amber), which made the page read as five unrelated
 * things that happened to share a rail.
 *
 * So the ink is read once, from the `projects` pillar the hall itself
 * paints that card with, and every room takes it. Nothing is transcribed:
 * change the pillar and this page follows.
 *
 * WHAT NOW TELLS THE ROOMS APART is no longer colour but the mark — each
 * project's own glyph behind its threshold numeral and stamped on its
 * plate — and, where the foundation has one, its actual logo.
 */
const PROJECTS_PILLAR = PILLARS.find((p) => p.id === 'projects');
/* A missing pillar would silently repaint the page, so the fallback is the
   same blue rather than an inherited or arbitrary one. */
const INK_A = PROJECTS_PILLAR?.accentA ?? '#0d6a8c';
const INK_B = PROJECTS_PILLAR?.accentB ?? '#6ac8ed';

const PROJECT_FACE: Record<string, { scope: string }> = {
  'Project Amrit': { scope: 'Launched 2023 · with the Government of India' },
  'Project Oneness Vann': { scope: 'Launched 2021 · indigenous micro-forests' },
  'Watershed Programme': { scope: 'Arid-zone rejuvenation' },
  'Adopted Villages': { scope: 'Since 2017 · Haryana' },
};

/**
 * THE OFFICIAL LOCKUPS.
 *
 * Two of the five campaigns have a real mark of their own; the Watershed
 * Programme, the Adopted Villages and the Health City are programmes rather
 * than branded campaigns and have never had one. So this is a map with holes
 * in it on purpose, and a project with no entry prints nothing — the lockup
 * sits IN THE FLOW, so its absence costs no space and leaves no gap to
 * explain. That is the whole reason it is not an absolutely-placed badge:
 * a badge slot the eye has learned from the room above is the most
 * conspicuous thing a layout can leave empty, and filling it with a monogram
 * would assert a brand nobody has ever made.
 *
 * Sized by HEIGHT with width auto, because a lockup's aspect is whatever was
 * drawn — Amrit's is 1.63:1. Dropping oneness-vann.webp into
 * public/images/projects/ and adding one line here is then the entire change,
 * whatever shape that file turns out to be.
 *
 * The alt text carries the TAGLINE, not the name. The <h2> below already
 * says "Project Amrit"; a screen reader should not hear it twice, and the
 * Hindi line is the part of the mark that is genuinely additional.
 */
const PROJECT_LOCKUP: Record<string, { src: string; alt: string }> = {
  'Project Amrit': {
    src: '/images/projects/amrit.webp',
    alt: 'Swachh Jal, Swachh Man — clean water, clean mind',
  },
  /* 'Project Oneness Vann': awaiting the logo file. */
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
            /* THE BRIGHT half of the pair, which looks wrong and is right:
               the rail never paints --chip-ink raw. The light surface mixes
               it 42% into the page ink first (see THE ACTIVE RAIL CHIP), so
               INK_B lands at #39627c — 6.54:1 under white type. Handing it
               INK_A instead darkens an already-darkened colour to #123a54,
               11.94:1, a near-black pill on a paper page. */
            ...projects.map((p) => ({
              id: slug(p.title),
              label: p.title.replace(/^Project /, ''),
              ink: INK_B,
            })),
            { id: 'health-city', label: 'Health City', ink: INK_B },
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
            style={{ '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties}
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
              {/* the campaign's own letterhead, where it has one */}
              {PROJECT_LOCKUP[p.title] && (
                <img
                  className="pj-lockup"
                  src={PROJECT_LOCKUP[p.title].src}
                  alt={PROJECT_LOCKUP[p.title].alt}
                  loading="lazy"
                  decoding="async"
                />
              )}
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
      {/* The fifth project. It takes the inks inline exactly as the four
          rooms do — it is a sibling of .cv-room, not a child, so it inherits
          nothing from them. */}
      <section
        className="pj-forthcoming"
        id="health-city"
        style={{ '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties}
      >
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
