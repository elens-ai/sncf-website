import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, HeartHandshake, Trees, Droplets, Music, Heart, Sprout, HandHeart, Landmark, Wind, Syringe, Building2, BedDouble } from 'lucide-react';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import { PageShell } from '../components/PageShell';
import { MediaGallery } from '../components/MediaGallery';
import { SubsectionNav } from '../components/SubsectionNav';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
import { Tiles } from '../components/ValueAnalytics';
import { onArrival } from '../utils/arrival';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import './guiding-force.css';

/**
 * OUR GUIDING FORCE — where the work gets its direction.
 *
 * The foundation's own page on this subject is about Satguru Mata Sudiksha
 * Ji Maharaj, and this page holds that centre of gravity exactly: the
 * present Satguru, at length, with the initiatives that carry Her guidance
 * into the world.
 *
 * IT IS BUILT AS ROOMS, like every other reading page, with their rail. The
 * portrait stands in a halo whose ring carries the subject of Her teaching
 * as the prose below names it; the initiatives are shown by their own
 * photographs and counted by the record; and the COVID-19 relief the prose
 * speaks of is drawn out in the site's own charts.
 */

/** Empower's ink — the cornerstone this page's shell already accents. */
const PILLAR = PILLARS.find((p) => p.id === 'empower');
const INK_A = PILLAR?.accentA ?? '#c2185b';
const INK_B = PILLAR?.accentB ?? '#f48fb1';
/* the logo's petal inks */
const PETAL_INKS = ['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'];

let UNDER_HER_GUIDANCE = bindCMSValue(() => ([
  { title: getCMSCopy("copy.GuidingForcePage.3c66946f7a8a", "Sant Nirankari Health City") },
  { title: getCMSCopy("copy.GuidingForcePage.b98c09f4d313", "Oneness Vann") },
  { title: getCMSCopy("copy.GuidingForcePage.a81619ca1e37", "Project Amrit") },
  { title: getCMSCopy("copy.GuidingForcePage.fb4c55902430", "Nirankari Youth Symposium & NIMA") },
]), value => { UNDER_HER_GUIDANCE = value; });

/** What the prose says Her teaching is about, a word or two each. */
let TEACHINGS = bindCMSValue(() => ([
  getCMSCopy("copy.GuidingForcePage.teaching-1", "Universal love"),
  getCMSCopy("copy.GuidingForcePage.teaching-2", "Inner change"),
  getCMSCopy("copy.GuidingForcePage.teaching-3", "Service, asked of no one"),
  getCMSCopy("copy.GuidingForcePage.teaching-4", "A decent citizen"),
]), value => { TEACHINGS = value; });
const TEACHING_ICONS = [Heart, Sprout, HandHeart, Landmark];

/* "Affordable healthcare, the education of the young, and the repair of the
   natural world are the three directions Her guidance has pushed hardest" —
   each undertaking below is marked with the one it serves. */
const directions = () => ({
  health: { name: getCMSCopy("copy.GuidingForcePage.dir-health", "Affordable healthcare"), color: '#f81170' },
  young: { name: getCMSCopy("copy.GuidingForcePage.dir-young", "The education of the young"), color: '#6663b5' },
  nature: { name: getCMSCopy("copy.GuidingForcePage.dir-nature", "The repair of the natural world"), color: '#4f9e33' },
});

const activity = (id: string) => ACTIVITIES.find((a) => a.id === id);
const pointOf = (id: string, label: string) => activity(id)?.dataPoints.find((d) => d.label === label);

/** Each undertaking's photograph, the direction it serves, and what the record counts of it. */
const works = () => {
  const vann = activity('oneness-vann'), amrit = activity('project-amrit');
  const nimaCentres = pointOf('skill-nima', 'NIMA centres'), nimaYouth = pointOf('skill-nima', 'Youth benefitted');
  return [
    { area: 'hc', dir: 'health' as const, icon: HeartHandshake, link: '/projects#health-city', action: getCMSCopy("copy.GuidingForcePage.work-explore", "Explore this project"),
      photo: resolveCMSAsset("asset.GuidingForcePage.work-hc", "/images/programmes/health-centre-inauguration.jpg"), focus: 'center 78%', side: 'end',
      alt: getCMSCopy("copy.GuidingForcePage.work-hc-alt", "Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji on the stage before Sant Nirankari Health City"),
      status: getCMSCopy("copy.GuidingForcePage.work-hc-status", "Dedicated 23 February 2026 · OPD services started") },
    { area: 'vann', dir: 'nature' as const, icon: Trees, link: '/projects#project-oneness-vann', action: getCMSCopy("copy.GuidingForcePage.work-explore", "Explore this project"), cutout: true,
      photo: resolveCMSAsset("asset.GuidingForcePage.4daa8ff53979", "/images/mataji-rajpita-planting.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-vann-alt", "Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling"),
      figure: vann && { value: vann.headline.value, label: vann.headline.label, more: pointOf('oneness-vann', 'Sites') } },
    { area: 'amrit', dir: 'nature' as const, icon: Droplets, link: '/projects#project-amrit', action: getCMSCopy("copy.GuidingForcePage.work-explore", "Explore this project"),
      photo: resolveCMSAsset("asset.GuidingForcePage.work-amrit", "/images/programmes/amrit-riverbank.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-amrit-alt", "Project Amrit volunteers clearing a riverbank"),
      figure: amrit && { value: amrit.headline.value, label: amrit.headline.label, more: pointOf('project-amrit', 'States / UTs') } },
    { area: 'nima', dir: 'young' as const, icon: Music, link: '/core-values#skill-nima', action: getCMSCopy("copy.GuidingForcePage.work-explore-enrich", "Explore Enrich"),
      photo: resolveCMSAsset("asset.GuidingForcePage.work-nima", "/images/programmes/nima-tabla.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-nima-alt", "Two students playing tabla at a Nirankari Institute of Music and Art evening"),
      figure: nimaYouth && { value: nimaYouth.value, label: nimaYouth.label, more: nimaCentres } },
  ];
};

const roomProps = (id: string) => ({
  id,
  className: 'cv-room',
  style: { '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties,
  'aria-labelledby': `${id}-title`,
});

/* a figure that rolls into place for the eye; the figure itself is what is read */
const Rolling: React.FC<{ value: string }> = ({ value }) => (
  <><span className="sr-only">{value}</span><span className="gf-roll" aria-hidden="true"><OdometerStatCounter value={value} duration={1300} /></span></>
);

/** The portrait in its halo: rings of light behind the arch, the subject of
    Her teaching written round the outermost, and the logo's five petal
    colours travelling the ring inside it. */
const GuidingCover = () => {
  useCMSRevision();
  const words = TEACHINGS.join('  ·  ');
  const R = 266;
  return <EditorialMotion><section className="ed-cover gf-cover"><div className="ed-cover-copy" data-reveal><p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.b733f26c2ca4", "Our Guiding Force")}</p><h1>{getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}</h1><p>{getCMSCopy("copy.GuidingForcePage.ff4066e1863f", "Every camp, classroom and forest in this site traces back to spiritual guidance rather than a strategy document. This page says plainly where that guidance comes from.")}</p><a className="ed-link" href={getCMSLink("copy.Link.GuidingForcePage.7783614ae9f5", "#satguru")}>{getCMSCopy("copy.GuidingForcePage.bc1bc49859a9", "The present Satguru ")}<ArrowDown size={17} /></a></div>
    <figure className="ed-portrait gf-halo" data-reveal>
      <svg className="gf-halo-art" viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <path id="gf-halo-path" d={`M300 ${300 - R}a${R} ${R} 0 1 1 0 ${R * 2}a${R} ${R} 0 1 1 0 ${-R * 2}`} />
          <radialGradient id="gf-halo-light"><stop offset="0.35" stopColor="#ffe1ec" stopOpacity="0.9" /><stop offset="1" stopColor="#ffe1ec" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#gf-halo-light)" />
        {[168, 206, 242, 290].map((r, i) => <circle key={r} className="gf-halo-ring" cx="300" cy="300" r={r} style={{ '--i': i } as React.CSSProperties} />)}
        <g className="gf-halo-words"><text><textPath href="#gf-halo-path" textLength={Math.round(Math.PI * R * 2 - 16)} lengthAdjust="spacing">{`${words}  ·  ${words}  ·  `}</textPath></text></g>
        <g className="gf-halo-orbs">{PETAL_INKS.map((ink, i) => { const a = ((i * 72 - 90) * Math.PI) / 180; return <circle key={ink} cx={300 + 242 * Math.cos(a)} cy={300 + 242 * Math.sin(a)} r="8" fill={ink} />; })}</g>
      </svg>
      <img src={resolveCMSAsset("asset.GuidingForcePage.56b9a5e0ea79", "/images/satguru-mata-sudiksha-ji.jpg")} alt={getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")} width="500" height="600" fetchPriority="high" />
      <figcaption>{getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")}</figcaption>
    </figure></section></EditorialMotion>;
};

/** The quote, its every "One" lit: the word the whole sentence turns on. */
const Quote: React.FC<{ text: string }> = ({ text }) => (
  <blockquote className="gf-quote font-dancing-script">
    {text.split(/\b(One)\b/).map((part, i) => (part === 'One' ? <span key={i} className="gf-one">{part}</span> : part))}
  </blockquote>
);

/** The pandemic, as it was counted, in the site's own charts: the centres and
    beds as tiles (one activity, one date), and the relief fund apart, as an
    amount never set beside a count. */
const ReliefCharts: React.FC<{ label: string; relief: { label: string; value: string }[] }> = ({ label, relief }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  const icons: Record<string, typeof Wind> = { 'Oxygen concentrators': Wind, 'Vaccination centres': Syringe, 'Care centres': Building2, 'Total beds': BedDouble };
  return (
    <div ref={ref} className="value-analytics gf-relief-charts" role="group" aria-label={label} data-arrived={arrived} style={{ '--value-color': INK_A, '--value-light': INK_B } as React.CSSProperties}>
      <Tiles items={relief.map(d => ({ icon: icons[d.label] ?? Building2, value: d.value, label: d.label }))} />
    </div>
  );
};

export const GuidingForcePage: React.FC = () => {
const COVID = ACTIVITIES.find((a) => a.id === 'covid-relief');
const WANTED = ['Oxygen concentrators', 'Vaccination centres', 'Care centres', 'Total beds'];
const RELIEF = WANTED.map((l) => COVID?.dataPoints.find((d) => d.label === l)).filter(
  Boolean,
) as { label: string; value: string }[];

const FUND = ACTIVITIES.find((a) => a.id === 'financial-support');
const RELIEF_FUND = FUND?.dataPoints.find((d) => d.label === 'Disaster relief & fund');
const dirs = directions();
const QUOTE = getCMSCopy("copy.GuidingForcePage.6c4e91b61bcb", "“Become One with the Formless One, so that we can become One with Everyone.”");
return (
  <PageShell
    cover={<GuidingCover />}
    accentPillarId="empower"
    eyebrow={getCMSCopy("copy.GuidingForcePage.b733f26c2ca4", "Our Guiding Force")}
    title={getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}
    standfirst={getCMSCopy("copy.GuidingForcePage.8b08fcc76f90", "Every camp, classroom and forest in this site traces back to spiritual\n      guidance rather than a strategy document. This page says plainly where\n      that guidance comes from.")}
    rail={<SubsectionNav label={getCMSCopy("copy.GuidingForcePage.rail", "On this page")} links={[
      { id: 'satguru', label: getCMSCopy("copy.GuidingForcePage.rail-satguru", "The present Satguru"), ink: INK_B },
      { id: 'guidance', label: getCMSCopy("copy.GuidingForcePage.rail-guidance", "Under Her guidance"), ink: '#c6dfbd' },
      ...(RELIEF.length ? [{ id: 'gf-relief', label: getCMSCopy("copy.GuidingForcePage.rail-relief", "Pandemic response"), ink: '#f0c5ac' }] : []),
      { id: 'gf-media', label: getCMSCopy("copy.GuidingForcePage.rail-media", "Photographs"), ink: '#b9dee1' },
    ]} />}
  >
    <EditorialMotion className="guiding-story">
    {/* ── 01 · THE PRESENT SATGURU ─────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.satguru"><section data-reveal {...roomProps('satguru')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />

      <EditorialHeading n={1} id="satguru" label={getCMSCopy("copy.GuidingForcePage.d16757403eaf", "The present Satguru")} title={getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")} body={getCMSCopy("copy.GuidingForcePage.d42bb56cd2a9", "Head of the Sant Nirankari Mission, whose subject is universal love, inner change and service asked of no one.")} />

      <div className="cv-chapter">
        <div className="ww-prose">
          <p className="font-artistic-serif">{getCMSCopy("copy.GuidingForcePage.9c10007c694f", "Her Holiness is the head of the Sant Nirankari Mission, a worldwide spiritual body whose concerns are peace, human oneness and the welfare of others. Her teaching reaches millions, and its subject is consistent: universal love, inner change, service asked of no one and offered to everyone, and the duty of being a decent citizen.")}</p>
          <p className="font-artistic-serif">{getCMSCopy("copy.GuidingForcePage.789311938ee2", "What that produces is visible rather than theoretical. Volunteers reach earthquakes, floods and wildfires with relief and stay to rebuild. Through the COVID-19 emergency the Mission opened its own centres as quarantine and vaccination sites. Affordable healthcare, the education of the young, and the repair of the natural world are the three directions Her guidance has pushed hardest.")}</p>
          {/* THE SUBJECT OF HER TEACHING, as the paragraph above names it */}
          <div className="gf-teachings">
            <p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.teachings", "The subject of Her teaching")}</p>
            <ul>
              {TEACHINGS.map((teaching, i) => {
                const Icon = TEACHING_ICONS[i % TEACHING_ICONS.length];
                return <li key={teaching} style={{ '--ink': PETAL_INKS[i % PETAL_INKS.length] } as React.CSSProperties}><span className="gf-teaching-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.6} /></span><strong>{teaching}</strong></li>;
              })}
            </ul>
          </div>
          <Quote text={QUOTE} />
        </div>
      </div>
    </section></CMSSection>

    {/* ── 02 · UNDER HER GUIDANCE ──────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.guidance"><section data-reveal {...roomProps('guidance')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />
      <EditorialHeading n={2} id="guidance" label={getCMSCopy("copy.GuidingForcePage.a367e6652e45", "What follows from it")} title={getCMSCopy("copy.GuidingForcePage.457585ce2838", "Under Her guidance")} body={getCMSCopy("copy.GuidingForcePage.ee5bdda7de91", "Four undertakings the Mission runs, and one emergency it was counted through.")} />

      <div className="cv-chapter">
        <ul className="gf-bento">
          {works().map((w, i) => {
            const words = UNDER_HER_GUIDANCE[i];
            if (!words) return null;
            const dir = dirs[w.dir];
            const Icon = w.icon;
            return (
              <li key={w.area} className="gf-work" data-cutout={w.cutout || undefined} data-side={w.side} style={{ gridArea: w.area, '--dir': dir.color } as React.CSSProperties} data-reveal>
                <img className="gf-work-photo" src={resolveCMSMedia(w.photo)} alt={w.alt} loading="lazy" decoding="async" style={w.focus ? { objectPosition: w.focus } : undefined} />
                <span className="gf-work-shade" aria-hidden="true" />
                <div className="gf-work-body">
                  <span className="gf-direction"><i aria-hidden="true" />{dir.name}</span>
                  <h3 className="font-artistic-heading"><Icon size={20} strokeWidth={1.6} aria-hidden="true" />{words.title}</h3>
                  {w.figure ? (
                    <div className="gf-work-figure"><strong><Rolling value={w.figure.value} /></strong><span>{w.figure.label}{w.figure.more && <small> · {w.figure.more.value} {w.figure.more.label.toLowerCase()}</small>}</span></div>
                  ) : w.status ? <p className="gf-work-status"><i aria-hidden="true" />{w.status}</p> : null}
                  <a className="gf-work-link" href={w.link}>{w.action} <ArrowUpRight size={16} aria-hidden="true" /></a>
                </div>
              </li>
            );
          })}
        </ul>

        {/* THE ONE THE PARAGRAPH ABOVE NAMES. One activity, one date — so the
            ledger states its period once rather than per plate. */}
        {RELIEF.length > 0 && (
          <CMSSection id="GuidingForcePage.gf-relief"><section id="gf-relief" className="gf-relief" aria-labelledby="gf-relief-title" data-reveal>
            <p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.reliefEyebrow", "Pandemic response")}{COVID?.period ? ` · ${COVID.period}` : ''}</p>
            <h3 id="gf-relief-title" className="cv-sub cv-sub-wide font-artistic-display">{getCMSCopy("copy.GuidingForcePage.b9c6d4099b41", "The COVID-19 emergency, as it was counted")}</h3>
            <ReliefCharts label={getCMSCopy("copy.GuidingForcePage.747466c9112f", "COVID-19 relief figures")} relief={RELIEF} />
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
      <MediaGallery section="guiding-force" headingLevel={2} layout="slides" />
    </section></CMSSection>

    <div className="ed-closing gf-closing" data-reveal>
      {/* listening: rings spreading from the logo's lotus */}
      <span className="gf-ripples" aria-hidden="true" style={{ '--lotus': `url("${resolveCMSAsset("asset.GuidingForcePage.closing-lotus", "/images/lotus-watermark.png")}")` } as React.CSSProperties}><i /><i /><i /><b /></span>
      <span className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.cfc915c141b5", "An invitation to listen")}</span>
      <p>{getCMSCopy("copy.GuidingForcePage.be3639b3ac91", "To hear any of this properly, attend a Satsang. This page can only point the way.")}</p>
    </div>
    </EditorialMotion>
  </PageShell>
);
};
