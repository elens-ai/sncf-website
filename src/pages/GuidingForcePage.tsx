import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import { resolveCMSMedia } from '../cms/media';
import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { ArrowDown, HeartHandshake, Trees, Droplets, Music, Heart, Sprout, HandHeart, Landmark } from 'lucide-react';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import { PageShell } from '../components/PageShell';
import { PILLARS } from '../data/pillars';
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
 * photographs and counted by the record.
 */

/** Empower's ink — the cornerstone this page's shell already accents. */
const PILLAR = PILLARS.find((p) => p.id === 'empower');
const INK_A = PILLAR?.accentA ?? '#c2185b';
const INK_B = PILLAR?.accentB ?? '#f48fb1';
/* the logo's petal inks */
const PETAL_INKS = ['#c52b75', '#158262', '#147d9c', '#7752ab'];

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
  health: { name: getCMSCopy("copy.GuidingForcePage.dir-health", "Affordable healthcare"), color: '#1f8a5c' },
  young: { name: getCMSCopy("copy.GuidingForcePage.dir-young", "The education of the young"), color: '#2d91bd' },
  nature: { name: getCMSCopy("copy.GuidingForcePage.dir-nature", "The repair of the natural world"), color: '#4f9e33' },
});

/** The original photographs for the four initiatives inspired by Her guidance. */
const works = () => {
  return [
    { area: 'hc', dir: 'health' as const, icon: HeartHandshake,
      photo: resolveCMSAsset("asset.GuidingForcePage.work-hc-photo", "/images/programmes/health-city-evening.webp"), focus: '52% 86%', side: 'start',
      alt: getCMSCopy("copy.GuidingForcePage.work-hc-alt", "Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji on the stage before Sant Nirankari Health City") },
    { area: 'vann', dir: 'nature' as const, icon: Trees, cutout: true,
      photo: resolveCMSAsset("asset.GuidingForcePage.4daa8ff53979", "/images/mataji-rajpita-planting.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-vann-alt", "Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling") },
    { area: 'amrit', dir: 'nature' as const, icon: Droplets,
      photo: resolveCMSAsset("asset.GuidingForcePage.work-amrit", "/images/programmes/amrit-riverbank.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-amrit-alt", "Project Amrit volunteers clearing a riverbank") },
    { area: 'nima', dir: 'young' as const, icon: Music,
      photo: resolveCMSAsset("asset.GuidingForcePage.work-nima", "/images/programmes/nima-tabla.webp"),
      alt: getCMSCopy("copy.GuidingForcePage.work-nima-alt", "Two students playing tabla at a Nirankari Institute of Music and Art evening") },
  ];
};

const roomProps = (id: string) => ({
  id,
  className: 'cv-room',
  style: { '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties,
  'aria-labelledby': `${id}-title`,
});

/** Photo panels expand on hover, keyboard focus or tap; no background animation loop. */
const GuidanceAccordion: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const initiatives = works();
  const dirs = directions();
  const cornerstones = ['heal', 'empower', 'empower', 'enrich'].map(id => PILLARS.find(pillar => pillar.id === id)!);
  const chooseWithKeys = (event: React.KeyboardEvent, index: number) => {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % initiatives.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index - 1 + initiatives.length) % initiatives.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? initiatives.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus({ preventScroll: true });
  };
  return <div className="gf-guidance-experience">
    <div className="gf-guidance-panels">
      {initiatives.map((work, index) => {
        const current = index === selected;
        const title = UNDER_HER_GUIDANCE[index]?.title;
        const Icon = work.icon;
        return <article key={work.area} className="gf-guidance-panel" data-open={current} data-cutout={work.cutout || undefined}
          style={{ '--panel-ink': cornerstones[index].accentA } as React.CSSProperties}
          onPointerEnter={event => { if (event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) setSelected(index); }}>
          <img className="gf-guidance-photo" src={resolveCMSMedia(work.photo)} alt={work.alt} loading="lazy" decoding="async" style={{ objectPosition: work.focus ?? 'center' }} />
          <div className="gf-guidance-shade" aria-hidden="true" />
          <span className="gf-guidance-badge" aria-hidden="true"><Icon size={14} />{cornerstones[index].label}</span>
          <span className="gf-guidance-collapsed-title" aria-hidden="true">{title}</span>
          <button ref={node => { buttons.current[index] = node; }} type="button" className="gf-guidance-toggle"
            id={`guidance-${work.area}-toggle`} aria-label={title} aria-expanded={current} aria-controls={`guidance-${work.area}-content`}
            onClick={() => setSelected(index)} onFocus={() => setSelected(index)} onKeyDown={event => chooseWithKeys(event, index)} />
          <div id={`guidance-${work.area}-content`} role="region" aria-labelledby={`guidance-${work.area}-toggle`}
            className="gf-guidance-content" aria-hidden={!current} inert={!current}>
            <p className="gf-guidance-category">{dirs[work.dir].name}</p>
            <h3>{title}</h3>

          </div>
          <span className="gf-guidance-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        </article>;
      })}
    </div>
  </div>;
};

const GF_CREAM_GROUND = { id: 'guiding-cream', accentA: '#d6af70', accentB: '#fff3da' };

/** Gentle waves stay in the Donate ribbon's cream and gold family, behind the original portrait. */
const GuidingCover = () => {
  useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: .5 });
  return <EditorialMotion><section ref={ref} className="ed-cover gf-cover">
    <div className="gf-cover-ground" aria-hidden="true">
      {/* Map the shared waves' navy shadows into warm gold; the portrait is outside this layer. */}
      <svg width="0" height="0" className="gf-wave-palette" focusable="false"><defs>
        <filter id="gf-cream-wave-ink" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".055 .1851 .0187 0 .7412  .09 .3029 .0306 0 .5569  .1417 .4768 .0481 0 .2745  0 0 0 1 0" />
        </filter>
      </defs></svg>
      <MosaicWaves subject={GF_CREAM_GROUND} active={active && !calm} input={waveInput} scale={3} fps={24} steady />
    </div>
    <div className="ed-cover-copy" data-reveal><h1>{getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}</h1><p>{getCMSCopy("copy.GuidingForcePage.cover-lede", "Every camp, classroom and forest in this site traces back to spiritual guidance rather than a strategy document.")}</p><a className="ed-link" href={getCMSLink("copy.Link.GuidingForcePage.7783614ae9f5", "#satguru")}>{getCMSCopy("copy.GuidingForcePage.bc1bc49859a9", "HER HOLINESS")}<ArrowDown size={17} /></a></div>
    <figure className="ed-portrait gf-portrait" data-reveal>
      <img src={resolveCMSAsset("asset.GuidingForcePage.cover-portrait", "/images/satguru-mata-sudiksha-ji-portrait.webp")} alt={getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")} width="940" height="1101" fetchPriority="high" />
      <figcaption>{getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")}</figcaption>
    </figure></section></EditorialMotion>;
};

/** Keep each decorative mark with its boundary word when the quote wraps. */
const Quote: React.FC<{ text: string }> = ({ text }) => {
  const words = text.trim().replace(/^[“"]|[”"]$/g, '').split(/\s+/);
  return <blockquote className="gf-quote font-dancing-script">
    {words.map((word, index) => {
      const content = word.split(/\b(One)\b/).map((part, partIndex) => part === 'One'
        ? <span key={partIndex} className="gf-one">{part}</span> : part);
      const first = index === 0;
      const last = index === words.length - 1;
      return <React.Fragment key={index}>
        {index > 0 && ' '}
        {first || last ? <span className="gf-quote-boundary">
          {first && <span className="gf-quote-mark" aria-hidden="true">“</span>}
          {content}
          {last && <span className="gf-quote-mark gf-quote-mark-close" aria-hidden="true">”</span>}
        </span> : content}
      </React.Fragment>;
    })}
  </blockquote>;
};

export const GuidingForcePage: React.FC = () => {
const QUOTE = getCMSCopy("copy.GuidingForcePage.6c4e91b61bcb", "Become One with the Formless One, so that we can become One with Everyone.");
return (
  <PageShell
    cover={<GuidingCover />}
    accentPillarId="empower"
    eyebrow=""
    title={getCMSCopy("copy.GuidingForcePage.bab255b4564b", "Our guiding force")}
    standfirst={getCMSCopy("copy.GuidingForcePage.cover-lede", "Every camp, classroom and forest in this site traces back to spiritual guidance rather than a strategy document.")}

  >
    <EditorialMotion className="guiding-story">
    {/* ── 01 · THE PRESENT SATGURU ─────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.satguru"><section data-reveal {...roomProps('satguru')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />

      <div className="gf-intro-grid">
        <div className="gf-intro-copy">
          <p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.d16757403eaf", "HER HOLINESS")}</p>
          <h2 id="satguru-title">{getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")}</h2>
          <p className="gf-intro-summary">{getCMSCopy("copy.GuidingForcePage.d42bb56cd2a9", "Head of the Sant Nirankari Mission, whose subject is universal love, inner change and service asked of no one.")}</p>
          <p className="gf-biography">{getCMSCopy("copy.GuidingForcePage.9c10007c694f", "Her Holiness is the head of the Sant Nirankari Mission, a worldwide spiritual body whose concerns are peace, human oneness and the welfare of others. Her teaching reaches millions, and its subject is consistent: universal love, inner change, service asked of no one and offered to everyone, and the duty of being a decent citizen.")}</p>
        </div>
        <figure className="gf-quote-feature">
          <p className="ed-eyebrow">{getCMSCopy('copy.GuidingForcePage.quote-label', 'A message of oneness')}</p>
          <Quote text={QUOTE} />
          <figcaption>{getCMSCopy("copy.GuidingForcePage.e19d3f2c98e2", "Satguru Mata Sudiksha Ji Maharaj")}</figcaption>
        </figure>
      </div>
      <div className="gf-teachings">
        <p className="ed-eyebrow">{getCMSCopy("copy.GuidingForcePage.teachings", "The subject of Her teaching")}</p>
        <ul>{TEACHINGS.map((teaching, i) => {
          const Icon = TEACHING_ICONS[i % TEACHING_ICONS.length];
          return <li key={teaching} style={{ '--ink': PETAL_INKS[i % PETAL_INKS.length] } as React.CSSProperties}>
            <span className="gf-teaching-icon" aria-hidden="true"><Icon size={25} strokeWidth={1.5} /></span>
            <strong>{teaching}</strong><span className="gf-teaching-number" aria-hidden="true">0{i + 1}</span>
          </li>;
        })}</ul>
      </div>
      <div className="gf-service-note">
        <h3>{getCMSCopy('copy.GuidingForcePage.service-title', 'Compassion,')} <em>{getCMSCopy('copy.GuidingForcePage.service-emphasis', 'in action.')}</em></h3>
        <p>{getCMSCopy("copy.GuidingForcePage.789311938ee2", "What that produces is visible rather than theoretical. Volunteers reach earthquakes, floods and wildfires with relief and stay to rebuild. Through the COVID-19 emergency the Mission opened its own centres as quarantine and vaccination sites. Affordable healthcare, the education of the young, and the repair of the natural world are the three directions Her guidance has pushed hardest.")}</p>
      </div>
    </section></CMSSection>

    {/* ── 02 · UNDER HER GUIDANCE ──────────────────────────────────────── */}
    <CMSSection id="GuidingForcePage.guidance"><section data-reveal {...roomProps('guidance')}>
      <div className="cv-margin-print" data-room="our-guiding-force" aria-hidden="true" />
      <EditorialHeading n={2} id="guidance" label={getCMSCopy("copy.GuidingForcePage.a367e6652e45", "What follows from it")} title={getCMSCopy("copy.GuidingForcePage.457585ce2838", "Under Her guidance")} body={getCMSCopy("copy.GuidingForcePage.guidance-introduction", "Her guidance takes shape in places of care, spaces to learn and a greener world for everyone.")} />

      <div className="cv-chapter">
        <GuidanceAccordion />
      </div>
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
