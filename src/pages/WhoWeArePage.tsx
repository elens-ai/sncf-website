import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, HeartHandshake, CalendarHeart, Globe, MapPinned, MapPin, Phone, Mail, BadgeCheck } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { MediaGallery } from '../components/MediaGallery';
import { Tally } from '../components/Tally';
import { MissionVision } from '../components/MissionVision';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PARTNERS } from '../data/partners';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { toNumber, isTallyable } from '../utils/figures';
import './who-we-are.css';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import './who-editorial.css';
import { ServiceStory } from '../components/ServiceStory';
import { UnSeal } from '../components/UnAffiliation';
import { SubsectionNav } from '../components/SubsectionNav';
import { HandsBloom, HandsLede, HandsProof, handWays } from '../components/WorkingHands';
import { GrowthRings } from '../components/GrowthRings';
/* after the page's own stylesheets, so the wall's styles come after theirs */
import { PartnerMarquee } from '../components/PartnerMarquee';

/**
 * WHO WE ARE — the foundation's own account of itself.
 *
 * Written from what the foundation publishes: founded 2010 to carry out Baba
 * Hardev Singh Ji's charge that a life gets its meaning from being lived for
 * others; governed by "Service with Humility"; working across health,
 * education and upliftment, with environmental care running through all
 * three. The mission and vision statements are the foundation's own
 * positions, restated here rather than reproduced.
 *
 * IT IS BUILT AS ROOMS, like Core Values and Projects, and it has their
 * rail. The cover is the logo's own emblem come alive: the lotus held in two
 * hands, each petal a photograph of what the lede says those hands do, and
 * the figure the record gives for it. The road so far is a trunk's cross-
 * section, a ring for every year; the register groups its partners by the
 * field they worked in, as the home page's circle does.
 */

/* the photographs the trunk's milestones are told with */
const MILESTONE_PHOTOS = [
  { asset: 'asset.WhoWeArePage.road-2010', src: '/images/sncf-logo.webp', logo: true },
  { asset: 'asset.WhoWeArePage.road-2014', src: '/images/programmes/scholarships-graduation.webp' },
  { asset: 'asset.WhoWeArePage.road-2021', src: '/images/programmes/oneness-vann-planting.webp' },
  { asset: 'asset.WhoWeArePage.road-2023', src: '/images/programmes/amrit-riverbank.webp' },
];
/* the logo's petal inks, one for each milestone and each fact */
const PETAL_INKS = ['#b357ad', '#6663b5', '#69b947', '#09a6cf', '#f81170'];

let MILESTONES = bindCMSValue(() => ([
  { year: getCMSCopy("copy.WhoWeArePage.7d12ba56e9f8", "2010"), label: getCMSCopy("copy.WhoWeArePage.road-label-1", "Our beginning"), text: getCMSCopy("copy.WhoWeArePage.86c8252ee47f", "The foundation is established as the Mission’s charitable arm."), href: '#account' },
  { year: getCMSCopy("copy.WhoWeArePage.96da37e95d5c", "2014"), label: getCMSCopy("copy.WhoWeArePage.road-label-2", "Learning opens doors"), text: getCMSCopy("copy.WhoWeArePage.2be360738982", "The Rajmata scholarship scheme begins supporting students on merit and means."), href: '/core-values#scholarships' },
  { year: getCMSCopy("copy.WhoWeArePage.1bea20e1df19", "2021"), label: getCMSCopy("copy.WhoWeArePage.road-label-3", "Growing together"), text: getCMSCopy("copy.WhoWeArePage.e12b02013977", "Oneness Vann starts planting indigenous micro-forests across the country."), href: '/projects#project-oneness-vann' },
  { year: getCMSCopy("copy.WhoWeArePage.d398b29d3dbb", "2023"), label: getCMSCopy("copy.WhoWeArePage.road-label-4", "Reviving our water"), text: getCMSCopy("copy.WhoWeArePage.aa6779f55c5f", "Project Amrit launches with the Government of India to revive water bodies."), href: '/projects#project-amrit' },
]), value => { MILESTONES = value; });

let FACTS = bindCMSValue(() => ([
  { k: getCMSCopy("copy.WhoWeArePage.6520e4488973", "Founded"), v: getCMSCopy("copy.WhoWeArePage.7d12ba56e9f8", "2010") },
  { k: getCMSCopy("copy.WhoWeArePage.e4b35726fbaf", "Standing"), v: getCMSCopy("copy.WhoWeArePage.d5af85a6a90e", "UN special consultative status") },
  { k: getCMSCopy("copy.WhoWeArePage.2068b81b75d4", "Reach"), v: getCMSCopy("copy.WhoWeArePage.9d3f458ea970", "250+ branches nationwide") },
]), value => { FACTS = value; });
const FACT_ICONS = [CalendarHeart, Globe, MapPinned];
const FACT_INKS = ['#f81170', '#09a6cf', '#69b947'];

/**
 * THE PAGE SAYS "THREE CORNERSTONES" AND USED TO COUNT NOTHING.
 *
 * One door per cornerstone, carrying the largest plainly-written COUNT that
 * cornerstone reports. Chosen by measurement rather than named by hand, so
 * the row follows the record: if a bigger count is added to Heal next year
 * this picks it up, and if one is corrected downward this drops it.
 *
 * Amounts are excluded by `isTallyable`, which also keeps abbreviated
 * figures out — counting the mantissa of "1.5M" rounds it to "2M" and
 * invents half a million units of blood.
 */
const CORNERSTONES = ['heal', 'enrich', 'empower'] as const;
const getBiggest = () => CORNERSTONES.map((id) => {
  const pillar = PILLARS.find((p) => p.id === id);
  const best = ACTIVITIES.filter(
    (a) => a.pillarId === id && isTallyable(a.headline.value),
  ).sort((x, y) => toNumber(y.headline.value) - toNumber(x.headline.value))[0];
  return best ? { pillar, act: best } : null;
}).filter(Boolean) as { pillar: (typeof PILLARS)[number]; act: (typeof ACTIVITIES)[number] }[];

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

const Leaf: React.FC<LeafProps> = (props) => <EditorialHeading {...props} className="who-chapter-heading" />;

/** The prose as written, the phrases named here picked out in their inks.
    A phrase an edit has taken out of the prose is simply left unmarked. */
const marked = (text: string, marks: { phrase: string; ink: string }[]) => {
  const hits = marks.map(m => ({ ...m, at: m.phrase ? text.indexOf(m.phrase) : -1 })).filter(m => m.at >= 0).sort((a, b) => a.at - b.at);
  const out: React.ReactNode[] = [];
  let from = 0;
  hits.forEach((m, i) => {
    if (m.at < from) return;
    out.push(text.slice(from, m.at), <mark key={i} className="who-mark" style={{ '--mark': m.ink } as React.CSSProperties}>{m.phrase}</mark>);
    from = m.at + m.phrase.length;
  });
  out.push(text.slice(from));
  return out;
};

const WhoCover: React.FC = () => {
  useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const ways = handWays(FACTS[2]?.v ?? '');
  const [current, setCurrent] = useState(0);
  const [held, setHeld] = useState(false);
  /* announced only when the visitor chooses, never on the bloom's own turns; and once they
     have chosen, the bloom stops turning on its own */
  const [told, setTold] = useState(false);
  const pick = (i: number) => { setTold(true); setCurrent(i); };
  useEffect(() => {
    if (!active || held || told || ways.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => { setTold(false); setCurrent(i => (i + 1) % ways.length); }, 4600);
    return () => window.clearInterval(timer);
  }, [active, held, told, ways.length]);
  const hold = {
    onPointerEnter: () => setHeld(true), onPointerLeave: () => setHeld(false),
    onFocus: () => setHeld(true), onBlur: (event: React.FocusEvent) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); },
  };
  const way = ways[current] ?? ways[0];
  return <section ref={ref} className="who-cover" data-active={active} aria-labelledby="who-title">
    <div className="who-cover-copy" data-reveal>
      <h1 id="who-title">{getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}</h1>
      <div className="hands-reading" {...hold}>
        <HandsLede text={getCMSCopy("copy.WhoWeArePage.5f1d766bc647", "The Sant Nirankari Charitable Foundation is the Mission’s working hands — the part of it that builds hospitals, funds classrooms, plants forests and turns up after a flood.")} ways={ways} current={current} onPick={pick} />
        {way && <HandsProof way={way} told={told} />}
      </div>
      <div className="who-cover-actions"><a href={getCMSLink("copy.Link.WhoWeArePage.f24daa84860f", "#account")}>{getCMSCopy("copy.WhoWeArePage.3c34f30db957", "Discover our story ")}<ArrowDown size={17} /></a></div>
      <span className="who-cover-signature"><HeartHandshake size={19} />{getCMSCopy("copy.WhoWeArePage.368abdd6a9dc", " Service with humility · Since 2010")}</span>
    </div>
    <div className="who-cover-stage" {...hold}><HandsBloom ways={ways} current={current} onPick={pick} /></div>
  </section>;
};

export const WhoWeArePage: React.FC = () => {
  const storyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const elements = storyRef.current?.querySelectorAll('.who-chapter-heading, .ww-facts, .cv-tally-row, .ww-card, .who-closing');
    if (!elements) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.entered = 'true'; observer.unobserve(entry.target); }
    }), { threshold: .12 });
    elements.forEach((el,i) => { (el as HTMLElement).style.setProperty('--reveal-delay', `${i % 3 * 70}ms`); observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  const { hash } = useLocation();
  const founded = Number.parseInt(FACTS[0]?.v ?? '', 10) || 2010;
  const years = new Date().getFullYear() - founded;
  const pillarInk = (id: string) => PILLARS.find(p => p.id === id)?.accentA ?? '#426b89';
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => clearTimeout(timer);
  }, [hash]);
  const office = [getCMSCopy("copy.WhoWeArePage.a01941bf3134", "Sant Nirankari Charitable Foundation"), getCMSCopy("copy.WhoWeArePage.e1df9065fffb", "80-A, Avtar Marg, Nirankari Colony"), getCMSCopy("copy.WhoWeArePage.f59cf0b8fe44", "Delhi 110009, India")];
  return (
  <PageShell
    cover={<EditorialMotion><WhoCover /></EditorialMotion>}
    accentPillarId="enrich"
    eyebrow={getCMSCopy("copy.WhoWeArePage.eefebe5695c5", "Who We Are · About the foundation")}
    title={getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}
    standfirst={getCMSCopy("copy.WhoWeArePage.b96d49653114", "The Sant Nirankari Charitable Foundation is the Mission’s working hands\n      — the part of it that builds hospitals, funds classrooms, plants forests\n      and turns up after a flood.")}
    rail={<SubsectionNav label={getCMSCopy("copy.WhoWeArePage.rail", "On this page")} links={[
      { id: 'account', label: getCMSCopy("copy.WhoWeArePage.rail-account", "About us"), ink: '#f0c5ac' },
      { id: 'mission', label: getCMSCopy("copy.WhoWeArePage.rail-mission", "Mission & vision"), ink: '#dcd0eb' },
      { id: 'road', label: getCMSCopy("copy.WhoWeArePage.rail-road", "The road so far"), ink: '#c6dfbd' },
      { id: 'partners', label: getCMSCopy("copy.WhoWeArePage.rail-partners", "Partners"), ink: '#dcd0eb' },
      { id: 'contact', label: getCMSCopy("copy.WhoWeArePage.rail-contact", "Contact"), ink: '#b9dee1' },
    ]} />}
  >
    <EditorialMotion className="who-editorial"><div className="who-story" ref={storyRef}>
    {/* ── 01 · THE ACCOUNT ─────────────────────────────────────────────── */}
    <CMSSection id="WhoWeArePage.account"><section {...roomProps('account')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={1}
        id="account"
        mark
        label={getCMSCopy("copy.WhoWeArePage.788281056a5e", "About the foundation")}
        title={getCMSCopy("copy.WhoWeArePage.faac0dc151a5", "A purpose bigger than ourselves.")}
        body={getCMSCopy("copy.WhoWeArePage.428e0aab4777", "The belief that brings us together, and the work that carries it forward.")}
      />

      <div className="cv-chapter">
        {/* THE CREED: the founding line, the governing phrase and the three
            cornerstones, each picked out in the prose where it is written */}
        <div className="ww-prose">
          <p className="font-artistic-serif">{marked(getCMSCopy("copy.WhoWeArePage.8fb1d447ef9c", "The foundation was set up in 2010 to act on a single line of Baba Hardev Singh Ji’s: that a life gets its meaning if it is lived for others. That is not a slogan the organisation wears lightly — it is the whole operating principle. Everything below follows from it."), [{ phrase: getCMSCopy("copy.WhoWeArePage.mark-line", "a life gets its meaning if it is lived for others"), ink: '#a75e48' }])}</p>
          <p className="font-artistic-serif">{getCMSCopy("copy.WhoWeArePage.d9b601893e49", "Its governing phrase is ")}<em>{getCMSCopy("copy.WhoWeArePage.56219e473693", "Service with Humility")}</em>{getCMSCopy("copy.WhoWeArePage.1ae89fe4f166", ". The humility matters as much as the service: the work is done without asking who the recipient is, what they believe, or whether they can return the favour. Blood is given to whoever needs it. A classroom is opened to whoever will sit in it.")}</p>
          <p className="font-artistic-serif">{marked(getCMSCopy("copy.WhoWeArePage.d4ef378ef3af", "The work is organised into three cornerstones — healing, enriching and empowering — with care for the natural world running through all three rather than sitting apart from them. Its reach is deliberately weighted towards places that are easy to overlook: remote districts, under-served neighbourhoods, villages a long way from a hospital."), [
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-heal", "healing"), ink: pillarInk('heal') },
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-enrich", "enriching"), ink: pillarInk('enrich') },
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-empower", "empowering"), ink: pillarInk('empower') },
          ])}</p>
        </div>

        <ul className="ww-facts who-facts">
          {FACTS.map((f, i) => {
            const Icon = FACT_ICONS[i] ?? MapPinned;
            return (
              <li key={f.k} style={{ '--fact': FACT_INKS[i % FACT_INKS.length] } as React.CSSProperties}>
                <span className="who-fact-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <span className="ww-fact-k">{f.k}</span>
                <span className="ww-fact-v font-artistic-heading">{f.v}</span>
                {i === 0 && years > 0 && <span className="who-fact-more">{years} {getCMSCopy("copy.WhoWeArePage.fact-years", "years of service")}</span>}
              </li>
            );
          })}
        </ul>
        {/* the standing above, and what it means */}
        <UnSeal variant="panel" className="ww-un" />

        {/* HOW SERVICE TAKES SHAPE — the three moments, told one at a time */}
        <div className="who-approach">
          <div className="who-approach-head">
            <p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.approach-eyebrow", "How service takes shape")}</p>
            <h3>{getCMSCopy("copy.WhoWeArePage.approach-title", "Listen. Come together.")} <em>{getCMSCopy("copy.WhoWeArePage.approach-title-em", "Serve.")}</em></h3>
          </div>
          <ServiceStory headingLevel={4} />
        </div>

        {/* WHAT THE THREE CORNERSTONES COME TO. The paragraph above names
            them; these count them, a door for each with its own photograph,
            each figure at its own date, so nothing is ranked against anything else. */}
        <div className="cv-tally">
          <h3 className="cv-sub font-artistic-display">{getCMSCopy("copy.WhoWeArePage.25c28cead1f0", "Three values. Everyday action.")}</h3>
          <ul className="cv-tally-list who-doors">
            {getBiggest().map(({ pillar, act }) => {
              const photo = act.images?.[0]?.src ?? act.cardPhoto?.src;
              return (
                <li key={act.id} className="cv-tally-row who-door" style={{ '--value-ink': pillar.accentA, '--value-tint': pillar.accentB } as React.CSSProperties}>
                  <span className="who-door-photo" aria-hidden="true">
                    {photo && <img src={resolveCMSMedia(photo)} alt="" loading="lazy" decoding="async" />}
                    <span className="who-door-pillar">{pillar.label}</span>
                  </span>
                  <p className="cv-tally-head">
                    <span className="cv-tally-name font-artistic-heading">{act.title}</span>
                    <span className="cv-tally-figure font-artistic-heading">
                      <Tally value={act.headline.value} />
                      <span className="cv-tally-unit">{act.headline.label}</span>
                    </span>
                  </p>
                  <p className="cv-tally-key">
                    <span className="cv-tally-period">{act.period}</span>
                  </p>
                  <a className="who-value-link" href={`/core-values#${pillar.id}`}>{getCMSCopy("copy.WhoWeArePage.2e1ac6e9292a", "Explore ")}{pillar.label.toLowerCase()} <ArrowUpRight size={15} /></a>
                </li>
              );
            })}
          </ul>
          <p className="cv-scale-note">{getCMSCopy("copy.WhoWeArePage.daa59bc900b6", "One figure per cornerstone — the largest plain count each of them reports. They are counted in different units and stopped at different dates, so nothing here is ranked against anything else. The full record is on the Core Values page.")}</p>
        </div>

        {/* MISSION & VISION, and the bridge between them */}
        <MissionVision />
      </div>
    </section></CMSSection>

    {/* ── 02 · THE ROAD SO FAR ─────────────────────────────────────────── */}
    <CMSSection id="WhoWeArePage.road"><section {...roomProps('road')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={2}
        id="road"
        mark
        label={getCMSCopy("copy.WhoWeArePage.1d3009abb21e", "Since 2010")}
        title={getCMSCopy("copy.WhoWeArePage.77d72aaa5ec2", "The road so far")}
        body={getCMSCopy("copy.WhoWeArePage.d018d79f674c", "Four dates the foundation marks its own history by.")}
      />
      <div className="cv-chapter">
        <GrowthRings founded={founded} milestones={MILESTONES.map((m, i) => {
          const photo = MILESTONE_PHOTOS[i];
          return { ...m, color: PETAL_INKS[i % PETAL_INKS.length], photo: photo ? resolveCMSAsset(photo.asset, photo.src) : undefined, logo: photo?.logo };
        })} />
      </div>
    </section></CMSSection>

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

        <div id="wwa-media">
          <MediaGallery section="who-we-are" headingLevel={3} layout="slides" />
        </div>
      </div>
    </section></CMSSection>

    {/* ── 04 · WHERE TO FIND US: a postcard from the registered office ── */}
    <CMSSection id="WhoWeArePage.contact"><section {...roomProps('contact')} data-reveal><Leaf n={4} id="contact" label={getCMSCopy("copy.WhoWeArePage.630add5617cc", "The registered office")} title={getCMSCopy("copy.WhoWeArePage.d06af8e88b68", "Where to find us")} body={getCMSCopy("copy.WhoWeArePage.dbfafcc18936", "Where the foundation is, and under what terms a gift to it is made.")}/>
      <div className="who-contact-editorial who-postcard">
        <div className="who-postcard-note">
          <p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.bc395eb428a7", "Registered office")}</p>
          <h3>{getCMSCopy("copy.WhoWeArePage.129d2c4eafb3", "Service begins")}<br /><em>{getCMSCopy("copy.WhoWeArePage.6265a53e30a6", "with a conversation.")}</em></h3>
          <address>{office.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</address>
          <a className="who-postcard-map" href={getCMSLink("copy.Link.WhoWeArePage.maps", "https://www.google.com/maps/search/?api=1&query=Sant%20Nirankari%20Charitable%20Foundation%2C%2080-A%20Avtar%20Marg%2C%20Nirankari%20Colony%2C%20Delhi%20110009")} target="_blank" rel="noreferrer">
            <MapPin size={16} aria-hidden="true" />{getCMSCopy("copy.WhoWeArePage.maps", "Open in Maps")}<ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="who-postcard-lines">
          <span className="who-postcard-stamp" aria-hidden="true"><img src={resolveCMSAsset("asset.WhoWeArePage.stamp", "/images/sncf-logo.webp")} alt="" width="70" height="68" loading="lazy" /><small>{getCMSCopy("copy.WhoWeArePage.stamp", "Since 2010")}</small></span>
          <span className="who-postcard-postmark" aria-hidden="true">{getCMSCopy("copy.WhoWeArePage.postmark", "Delhi · 110009")}</span>
          <p className="ed-eyebrow"><Phone size={13} aria-hidden="true" />{getCMSCopy("copy.WhoWeArePage.84ecd6328b80", "Telephone")}</p>
          <a href={getCMSLink("copy.Link.WhoWeArePage.e3dc1a537132", "tel:+911147660380")}>{getCMSCopy("copy.WhoWeArePage.c80396e2c603", "+91 11 4766 0380")}</a>
          <a href={getCMSLink("copy.Link.WhoWeArePage.1cc23dc8cae1", "tel:+911147660200")}>{getCMSCopy("copy.WhoWeArePage.4d6d92142f22", "+91 11 4766 0200")}</a>
          <p className="ed-eyebrow"><Mail size={13} aria-hidden="true" />{getCMSCopy("copy.WhoWeArePage.969ccbd3cf63", "Email")}</p>
          <a href={getCMSLink("copy.Link.WhoWeArePage.87f2c7a16748", "mailto:sncf@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.e7896d85308f", "sncf@nirankarifoundation.org")}</a>
          <a href={getCMSLink("copy.Link.WhoWeArePage.536060a063aa", "mailto:accounts@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.bee1eacddce6", "accounts@nirankarifoundation.org")}</a>
        </div>
        <p className="who-contact-tax"><BadgeCheck size={18} aria-hidden="true" /><span><strong>{getCMSCopy("copy.WhoWeArePage.ee8c63df0992", "Tax status")}</strong>{getCMSCopy("copy.WhoWeArePage.6491cd959e1d", " Donations are deductible under section 80G(5)(vi) of the Income Tax Act, 1961.")}</span></p>
      </div>
    </section></CMSSection>
    <div className="who-closing"><HeartHandshake size={30} strokeWidth={1.4} /><p>{getCMSCopy("copy.WhoWeArePage.67ba1a790310", "Service begins with a willingness")}<br /><em>{getCMSCopy("copy.WhoWeArePage.57911c50add4", "to make a difference.")}</em></p><a href={getCMSLink("copy.Link.WhoWeArePage.902ceeb21a5f", "/projects")}>{getCMSCopy("copy.WhoWeArePage.afa302c27b7e", "Discover our projects ")}<ArrowUpRight size={17} /></a></div>
    </div></EditorialMotion>
  </PageShell>
  );
};
