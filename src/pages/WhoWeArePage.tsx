import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight, HeartHandshake, Phone, Mail, BadgeCheck } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { MediaGallery } from '../components/MediaGallery';
import { MissionVision } from '../components/MissionVision';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PARTNERS } from '../data/partners';
import { PILLARS } from '../data/pillars';
import { EditorialMotion } from '../components/EditorialMotion';
import { ServiceStory } from '../components/ServiceStory';
import { WhoEverydayAction } from '../components/WhoEverydayAction';
import { FoundationPurpose } from '../components/FoundationPurpose';
import { SubsectionNav } from '../components/SubsectionNav';
import { ServicePortrait } from '../components/ServicePortrait';
import { RoadWall } from '../components/RoadWall';
/* after the page's own stylesheets, so the wall's styles come after theirs */
import { PartnerMarquee } from '../components/PartnerMarquee';
import './who-we-are.css';
import './who-cover.css';

/** The foundation's introduction, purpose, cumulative programme reach and photo history. */

/* The contact postcard only embeds Google Maps. */
const onGoogleMaps = (url: string) => /^https:\/\/(?:www\.google\.com|maps\.google\.com)\/maps[/?]/.test(url);

const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
// Temporarily hidden at the user's request; restore this flag to bring back the wall and its tab.
const SHOW_ROAD_HISTORY = false;

/** One room per chapter — the number on the leaf and the ink beneath it. */
const roomProps = (id: string) => ({
  id,
  className: 'cv-room',
  style: { '--ink-a': ({ account: '#a75e48', road: '#517659', partners: '#766295', contact: '#347d87' } as Record<string,string>)[id], '--ink-b': ({ account: '#f0c5ac', road: '#c6dfbd', partners: '#dcd0eb', contact: '#b9dee1' } as Record<string,string>)[id] } as React.CSSProperties,
  'aria-labelledby': `${id}-title`,
});

interface LeafProps {
  n: number;
  id: string;
  label: string;
  title: string;
  body: string;
  /** Only two of the four leaves carry a glyph — see the CSS. */
  mark?: boolean;
}

const Leaf: React.FC<LeafProps> = ({ id, label, title, body }) => <header className="who-section-heading" data-reveal>
  <div><p className="who-kicker">{label}</p><h2 id={`${id}-title`}>{title}</h2></div>
  <p>{body}</p>
</header>;

/* THE COVER, laid out as the Core Values and Projects covers are but light: the logo's light blue in the tone of
   the contact postcard's paper, with the same waves over it in those blues. */
const WHO_GROUND = { id: 'who-we-are', accentA: '#086b92', accentB: '#173a73' };

/** The foundation’s original floating 3D emblem on its branded blue ground. */
const WhoCover: React.FC = () => {
  useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  return <section ref={ref} className="who-cover" data-active={active} aria-labelledby="who-title">
    <div className="who-cover-ground" aria-hidden="true">
      <MosaicWaves subject={WHO_GROUND} active={active && !calm} input={waveInput} scale={3} fps={24} />
    </div>
    <div className="who-cover-copy" data-reveal>
      <h1 id="who-title" className="who-cover-title">
        <span className="who-cover-title-label">{getCMSCopy("copy.WhoWeArePage.cover-heading", "Service with")} {getCMSCopy("copy.WhoWeArePage.cover-hands", "Humility").replace(/\.$/, '')}</span>
        <svg className="who-cover-lettering" viewBox="640 433 3814 2181" aria-hidden="true" focusable="false">
          <defs>
            <filter id="who-lettering-ink" colorInterpolationFilters="sRGB">
              <feFlood floodColor="currentColor" />
              <feComposite in2="SourceAlpha" operator="in" />
            </filter>
          </defs>
          <image href={resolveCMSAsset("asset.WhoWeArePage.service-lettering", "/images/service-with-humility-lettering-bold.png")} width="5280" height="2970" filter="url(#who-lettering-ink)" />
        </svg>
      </h1>
      {/* Verified against nirankarifoundation.org/about-us/ and its cornerstone overview. */}
      <p className="who-cover-lede">{getCMSCopy("copy.WhoWeArePage.cover-introduction", "Established in 2010, Sant Nirankari Charitable Foundation serves communities through healthcare, education, and social and environmental welfare.")}</p>
      <nav className="who-cover-pillars" aria-label={getCMSCopy("copy.WhoWeArePage.cover-pillars", "Explore our three cornerstones")}>
        {PILLARS.filter(pillar => CORNERSTONES.includes(pillar.id as typeof CORNERSTONES[number])).map(pillar =>
          <a key={pillar.id} href={`/core-values#${pillar.id}`} style={{ '--pillar-color': pillar.accentB } as React.CSSProperties}>
            <span aria-hidden="true" />{pillar.label}<ArrowUpRight size={13} aria-hidden="true" />
          </a>
        )}
      </nav>
      <div className="who-cover-actions"><a className="who-cover-cta" href={getCMSLink("copy.Link.WhoWeArePage.f24daa84860f", "#account")}>{getCMSCopy("copy.WhoWeArePage.3c34f30db957", "Discover our story ")}<span><ArrowDown size={17} aria-hidden="true" /></span></a></div>
    </div>
    <div className="who-cover-stage" data-reveal>
      <ServicePortrait active={active} reducedMotion={calm} />
    </div>
  </section>;
};

export const WhoWeArePage: React.FC = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => clearTimeout(timer);
  }, [hash]);
  const office = [getCMSCopy("copy.WhoWeArePage.a01941bf3134", "Sant Nirankari Charitable Foundation"), getCMSCopy("copy.WhoWeArePage.e1df9065fffb", "80-A, Avtar Marg, Nirankari Colony"), getCMSCopy("copy.WhoWeArePage.f59cf0b8fe44", "Delhi 110009, India")];
  const officeMap = getCMSLink("copy.Link.WhoWeArePage.map", "https://maps.google.com/maps?q=Sant%20Nirankari%20Charitable%20Foundation%2C%2080-A%20Avtar%20Marg%2C%20Nirankari%20Colony%2C%20Delhi%20110009&z=16&hl=en&output=embed");
  return (
  <PageShell
    cover={<EditorialMotion><WhoCover /></EditorialMotion>}
    accentPillarId="enrich"
    eyebrow={getCMSCopy("copy.WhoWeArePage.eefebe5695c5", "Who We Are · About the foundation")}
    title={getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}
    standfirst={getCMSCopy("copy.WhoWeArePage.b96d49653114", "Established in 2010, Sant Nirankari Charitable Foundation serves communities through healthcare, education, and social and environmental welfare.")}
    rail={<SubsectionNav floating keepVisibleUntil=".who-cover" variant="tabs" look="segmented" label={getCMSCopy("copy.WhoWeArePage.rail", "On this page")} links={[
      { id: 'account', label: getCMSCopy("copy.WhoWeArePage.rail-account", "About us"), ink: '#6fd19a' },
      { id: 'everyday-action', label: getCMSCopy('copy.WhoWeArePage.rail-reach', 'Our reach'), ink: '#f48fb1' },
      { id: 'mission', label: getCMSCopy("copy.WhoWeArePage.rail-mission", "Mission & vision"), ink: '#8dd4df' },
      ...(SHOW_ROAD_HISTORY ? [{ id: 'road', label: getCMSCopy("copy.WhoWeArePage.rail-road", "The road so far"), ink: '#c6dfbd' }] : []),
      { id: 'partners', label: getCMSCopy("copy.WhoWeArePage.rail-partners", "Partners"), ink: '#8dd4df' },
      { id: 'contact', label: getCMSCopy("copy.WhoWeArePage.rail-contact", "Contact"), ink: '#b9dee1' },
    ]} />}
  >
    <EditorialMotion className="who-editorial"><div className="who-story">
    {/* ── 01 · THE ACCOUNT ─────────────────────────────────────────────── */}
    <CMSSection id="WhoWeArePage.account"><section {...roomProps('account')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <div className="cv-chapter">
        <FoundationPurpose />

        {/* HOW SERVICE TAKES SHAPE — the three moments, told one at a time */}
        <div id="how-we-serve" className="who-service-process" data-reveal>
          <div className="who-service-process-heading">
            <p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.approach-eyebrow", "How service takes shape")}</p>
            <h3>{getCMSCopy("copy.WhoWeArePage.approach-title", "Listen. Come together.")} <em>{getCMSCopy("copy.WhoWeArePage.approach-title-em", "Serve.")}</em></h3>
            <p className="who-service-caption">{getCMSCopy('copy.WhoWeArePage.approach-caption', 'A simple belief becomes meaningful change, one thoughtful act at a time.')}</p>
          </div>
          <ServiceStory headingLevel={4} />
        </div>

        {/* Each figure keeps its own reporting period and unit. */}
        <WhoEverydayAction />

        {/* MISSION & VISION, and the bridge between them */}
        <MissionVision />
      </div>
    </section></CMSSection>

    {/* ── 02 · THE ROAD SO FAR ─────────────────────────────────────────── */}
    {/* the wall alone: no heading of its own, its section named for the rail and for screen readers */}
    {SHOW_ROAD_HISTORY && <CMSSection id="WhoWeArePage.road"><section {...roomProps('road')} aria-labelledby={undefined} aria-label={getCMSCopy("copy.WhoWeArePage.77d72aaa5ec2", "The road so far")}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <div className="cv-chapter road-chapter">
        <RoadWall />
      </div>
    </section></CMSSection>}

    {/* ── 03 · WHO WALKS WITH US ───────────────────────────────────────── */}
    <CMSSection id="WhoWeArePage.partners"><section {...roomProps('partners')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={3}
        id="partners"
        label={getCMSCopy("copy.WhoWeArePage.b68d1e8eda83", "Supports & collaborations")}
        title={getCMSCopy("copy.WhoWeArePage.b66e8cc28209", "Who walks with us")}
        body={`${PARTNERS.length} organisations have put their name beside the foundation’s — United Nations bodies, government departments, newsrooms, hospitals and institutes.`}
      />
      <div className="cv-chapter">
        {/* the search, then every organisation's mark drifting past in two rows, each opening what it did with us */}
        <PartnerMarquee partners={PARTNERS} />


      </div>
    </section></CMSSection>

    <section id="wwa-media" className="who-media-room" aria-label={getCMSCopy('copy.WhoWeArePage.gallery-label', 'Stories from the foundation')}>
      <p className="who-kicker">{getCMSCopy('copy.WhoWeArePage.gallery-eyebrow', 'A closer look')}</p>
      <MediaGallery section="who-we-are" headingLevel={2} layout="slides" />
    </section>

    <CMSSection id="WhoWeArePage.contact"><section {...roomProps('contact')}>
      <div className="who-contact-card" data-reveal>
        <div className="who-contact-copy">
          <p className="who-kicker">{getCMSCopy("copy.WhoWeArePage.630add5617cc", "The registered office")}</p>
          <h2 id="contact-title">{getCMSCopy("copy.WhoWeArePage.129d2c4eafb3", "Service begins")}<br /><em>{getCMSCopy("copy.WhoWeArePage.6265a53e30a6", "with a conversation.")}</em></h2>
          <address>{office.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</address>
          <div className="who-contact-method">
            <Phone size={20} strokeWidth={1.5} aria-hidden="true" />
            <div><p>{getCMSCopy("copy.WhoWeArePage.84ecd6328b80", "Telephone")}</p>
              <a href={getCMSLink("copy.Link.WhoWeArePage.e3dc1a537132", "tel:+911147660380")}>{getCMSCopy("copy.WhoWeArePage.c80396e2c603", "+91 11 4766 0380")}</a>
              <a href={getCMSLink("copy.Link.WhoWeArePage.1cc23dc8cae1", "tel:+911147660200")}>{getCMSCopy("copy.WhoWeArePage.4d6d92142f22", "+91 11 4766 0200")}</a>
            </div>
          </div>
          <div className="who-contact-method">
            <Mail size={20} strokeWidth={1.5} aria-hidden="true" />
            <div><p>{getCMSCopy("copy.WhoWeArePage.969ccbd3cf63", "Email")}</p>
              <a href={getCMSLink("copy.Link.WhoWeArePage.87f2c7a16748", "mailto:sncf@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.e7896d85308f", "sncf@nirankarifoundation.org")}</a>
              <a href={getCMSLink("copy.Link.WhoWeArePage.536060a063aa", "mailto:accounts@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.bee1eacddce6", "accounts@nirankarifoundation.org")}</a>
            </div>
          </div>
        </div>
        <div className="who-contact-location">
          <div className="who-contact-location-title"><span>{getCMSCopy('copy.WhoWeArePage.location-city', 'Come find us in Delhi')}</span><img src={resolveCMSAsset("asset.WhoWeArePage.stamp", "/images/sncf-logo.webp")} alt="" width={58} height={58} loading="lazy" /></div>
          {onGoogleMaps(officeMap) && <iframe title={getCMSCopy("copy.WhoWeArePage.map-title", "Map: Sant Nirankari Charitable Foundation, 80-A, Avtar Marg, Nirankari Colony, Delhi")} src={officeMap} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
          <p><BadgeCheck size={19} aria-hidden="true" /><span><strong>{getCMSCopy("copy.WhoWeArePage.ee8c63df0992", "Tax status")}</strong>{getCMSCopy("copy.WhoWeArePage.6491cd959e1d", " Donations are deductible under section 80G(5)(vi) of the Income Tax Act, 1961.")}</span></p>
        </div>
      </div>
    </section></CMSSection>
    <div className="who-closing"><HeartHandshake size={30} strokeWidth={1.4} /><p>{getCMSCopy("copy.WhoWeArePage.67ba1a790310", "Service begins with a willingness")}<br /><em>{getCMSCopy("copy.WhoWeArePage.57911c50add4", "to make a difference.")}</em></p><a href={getCMSLink("copy.Link.WhoWeArePage.902ceeb21a5f", "/projects")}>{getCMSCopy("copy.WhoWeArePage.afa302c27b7e", "Discover our projects ")}<ArrowUpRight size={17} /></a></div>
    </div></EditorialMotion>
  </PageShell>
  );
};
