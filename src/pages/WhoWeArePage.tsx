import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection, useCMSRevision } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight, HeartHandshake, Phone, Mail, BadgeCheck } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { MosaicWaves, type WaveInput } from '../components/MosaicWaves';
import { Saying } from '../components/Saying';
import { OdometerStatCounter } from '../components/OdometerStatCounter';
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
import './who-cover.css';
import { ServiceStory } from '../components/ServiceStory';
import { UnepSeal } from '../components/UnAffiliation';
import { SubsectionNav } from '../components/SubsectionNav';
import { HandsBloom, HandsLede, HandsProof, handWays, splitFigure } from '../components/WorkingHands';
import { RoadTree } from '../components/RoadTree';
import { ROAD_EVENTS } from '../data/roadEvents';
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
 * rail; its cover is drawn as theirs are, on the page's own ground. Beside
 * its words is a five-leaf star, each leaf a photograph of what the
 * lede says the foundation's hands do, and
 * the figure the record gives for it. The road so far is a tree growing
 * from a seed in 2010, a branch for every moment the foundation marks; the
 * organisations beside it pass by as a wall of their marks.
 */

/* the year the foundation was founded, and its reach: the cover's foot carries them */
let FACTS = bindCMSValue(() => ([
  { k: getCMSCopy("copy.WhoWeArePage.6520e4488973", "Founded"), v: getCMSCopy("copy.WhoWeArePage.7d12ba56e9f8", "2010") },
  { k: getCMSCopy("copy.WhoWeArePage.2068b81b75d4", "Reach"), v: getCMSCopy("copy.WhoWeArePage.9d3f458ea970", "250+ branches nationwide") },
]), value => { FACTS = value; });
/* the contact postcard's map is Google's only: the CMS may move its pin, but cannot embed another site */
const onGoogleMaps = (url: string) => /^https:\/\/(?:www\.google\.com|maps\.google\.com)\/maps[/?]/.test(url);
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

/* THE COVER, laid out as the Core Values and Projects covers are but light: the logo's light blue in the tone of
   the contact postcard's paper, with the same waves over it in those blues. */
const WHO_GROUND = { id: 'who-we-are', accentA: '#2ab2ea', accentB: '#cfe9f3' };

/** The cover: the words and the way on, beside the five-leaf star, each of its
    five petals a photograph of a thing the foundation's hands do. The script
    line and the lede carry those things as highlighted phrases, and pointing
    at any of them (phrase or petal) brings it into view with its reported
    figure. Beneath the star, the line the foundation was set up to act on;
    at the foot, UNEP and the foundation's own figures; and the page's paper
    laps up over the foot. */
const WhoCover: React.FC = () => {
  useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const calm = useReducedMotion() ?? false;
  const waveInput = useRef<WaveInput>({ travel: 0.5 });
  const ways = handWays(FACTS[1]?.v ?? '');
  const [current, setCurrent] = useState(0);
  const [held, setHeld] = useState(false);
  /* announced only when the visitor chooses, never on the bloom's own turns; and once they
     have chosen, the bloom stops turning on its own */
  const [told, setTold] = useState(false);
  const pick = (i: number) => { if (i < 0) return; setTold(true); setCurrent(i); };
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
  /* the script line carries the hands; the lede, the rest */
  const handsAt = ways.findIndex(w => w.id === 'hands');
  const hands = ways[handsAt];
  const script = getCMSCopy("copy.WhoWeArePage.cover-script", "the Mission’s working hands");
  const at = hands ? script.toLowerCase().indexOf(hands.phrase.toLowerCase()) : -1;
  const lede = ways.filter(w => w.id !== 'hands');
  /* the foot: the year it was founded, its reach and its years of service */
  const founded = FACTS[0]?.v ?? '';
  const years = new Date().getFullYear() - (Number.parseInt(founded, 10) || 2010);
  const [reachFigure, reachUnit] = splitFigure(FACTS[1]?.v ?? '');
  const figures = [
    { figure: founded, unit: FACTS[0]?.k ?? '', roll: false },
    { figure: reachFigure, unit: reachUnit, roll: true },
    { figure: years > 0 ? String(years) : '', unit: getCMSCopy("copy.WhoWeArePage.fact-years", "years of service"), roll: true },
  ].filter(item => item.figure);
  return <section ref={ref} className="who-cover" data-active={active} aria-labelledby="who-title">
    <div className="who-cover-ground" aria-hidden="true">
      <MosaicWaves subject={WHO_GROUND} active={active && !calm} input={waveInput} scale={3} fps={24} />
    </div>
    <div className="who-cover-copy" data-reveal>
      <h1 id="who-title">{getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}<br />
        <em>{hands && at >= 0
          ? <>{script.slice(0, at)}<button type="button" className="hands-chip" style={{ '--way': hands.color } as React.CSSProperties}
              aria-pressed={current === handsAt} onClick={() => pick(handsAt)} onPointerEnter={() => pick(handsAt)}>{script.slice(at, at + hands.phrase.length)}</button>{script.slice(at + hands.phrase.length)}</>
          : script}</em>
      </h1>
      <div className="hands-reading" {...hold}>
        <HandsLede text={getCMSCopy("copy.WhoWeArePage.cover-lede", "The part of it that builds hospitals, funds classrooms, plants forests and turns up after a flood.")}
          ways={lede} current={lede.findIndex(w => w.id === way?.id)} onPick={i => pick(ways.indexOf(lede[i]))} />
        {way && <HandsProof way={way} told={told} />}
      </div>
      <div className="who-cover-actions"><a className="who-cover-cta" href={getCMSLink("copy.Link.WhoWeArePage.f24daa84860f", "#account")}>{getCMSCopy("copy.WhoWeArePage.3c34f30db957", "Discover our story ")}<ArrowDown size={15} aria-hidden="true" /></a></div>
    </div>
    {/* the five-leaf star, and beneath it the line the foundation was set up to act on */}
    <div className="who-cover-stage" {...hold}>
      <HandsBloom ways={ways} current={current} onPick={pick} />
      <div className="who-cover-voice"><Saying id="contribute" className="who-cover-saying" /></div>
    </div>
    <div className="who-cover-footer">
      <span className="who-cover-standing"><UnepSeal /></span>
      <ul className="who-cover-impact" aria-label={getCMSCopy("copy.WhoWeArePage.cover-figures", "The foundation in figures")}>
        {figures.map((item, i) => (
          <li key={item.unit} style={{ '--way-ink': FACT_INKS[i % FACT_INKS.length] } as React.CSSProperties}>
            {/* a rolling figure is for the eye; the figure itself is what is read */}
            <span className="who-cover-impact-figure">{item.roll
              ? <><span className="sr-only">{item.figure}</span><span aria-hidden="true"><OdometerStatCounter value={item.figure} duration={1400} /></span></>
              : item.figure}</span>
            <span className="who-cover-impact-unit">{item.unit}</span>
          </li>
        ))}
      </ul>
    </div>
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
  const pillarInk = (id: string) => PILLARS.find(p => p.id === id)?.accentA ?? '#426b89';
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
    standfirst={getCMSCopy("copy.WhoWeArePage.b96d49653114", "The Sant Nirankari Charitable Foundation is the Mission’s working hands\n      — the part of it that builds hospitals, funds classrooms, plants forests\n      and turns up after a flood.")}
    rail={<SubsectionNav variant="tabs" label={getCMSCopy("copy.WhoWeArePage.rail", "On this page")} links={[
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
        {/* THE CREED, in three moments: the founding line as the foundation
            tells it (the cover's saying), the governing phrase set on its own,
            and the three cornerstones; each phrase picked out in the prose
            where it is written */}
        <div className="ww-creed">
          <p className="ww-moment-lead">{marked(getCMSCopy("copy.WhoWeArePage.8fb1d447ef9c", "The foundation was set up in 2010 to act on a single line of Baba Hardev Singh Ji’s: that a life gets its meaning if it is lived for others. That is not a slogan the organisation wears lightly — it is the whole operating principle. Everything below follows from it."), [{ phrase: getCMSCopy("copy.WhoWeArePage.mark-line", "a life gets its meaning if it is lived for others"), ink: '#01327f' }])}</p>
          <div className="ww-interlude">
            <p className="ww-interlude-phrase">{getCMSCopy("copy.WhoWeArePage.56219e473693", "Service with Humility")}</p>
            <p className="ww-interlude-line">{getCMSCopy("copy.WhoWeArePage.interlude-line", "The humility matters as much as the service: blood is given to whoever needs it, and a classroom is opened to whoever will sit in it.")}</p>
          </div>
          <p className="ww-moment-text">{marked(getCMSCopy("copy.WhoWeArePage.d4ef378ef3af", "The work is organised into three cornerstones — healing, enriching and empowering — with care for the natural world running through all three rather than sitting apart from them. Its reach is deliberately weighted towards places that are easy to overlook: remote districts, under-served neighbourhoods, villages a long way from a hospital."), [
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-heal", "healing"), ink: pillarInk('heal') },
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-enrich", "enriching"), ink: pillarInk('enrich') },
            { phrase: getCMSCopy("copy.WhoWeArePage.mark-empower", "empowering"), ink: pillarInk('empower') },
          ])}</p>
        </div>

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
          <h3 className="cv-sub font-artistic-display">{getCMSCopy("copy.WhoWeArePage.tally-title", "Everyday action.")}</h3>
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
        body={getCMSCopy("copy.WhoWeArePage.road-body", "From a seed in 2010 to the tree it is today: every branch a moment the foundation marks its history by.")}
      />
      <div className="cv-chapter road-chapter">
        <RoadTree events={ROAD_EVENTS} labels={{
          aria: getCMSCopy("copy.WhoWeArePage.road-aria", "The foundation’s history as a growing tree"),
          seed: getCMSCopy("copy.WhoWeArePage.road-seed", "The seed"),
          year: getCMSCopy("copy.WhoWeArePage.road-year", "Year"),
          moments: getCMSCopy("copy.WhoWeArePage.road-moments", "moments"),
          explore: getCMSCopy("copy.WhoWeArePage.road-explore", "Explore this chapter"),
          today: getCMSCopy("copy.WhoWeArePage.road-today", "Today"),
          hint: getCMSCopy("copy.WhoWeArePage.road-hint", "Scroll to watch it grow"),
        }} />
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
          {/* the office on Google's map, taped to the postcard: the foundation's own place card, and directions */}
          {onGoogleMaps(officeMap) && (
            <div className="who-postcard-mapframe">
              <iframe title={getCMSCopy("copy.WhoWeArePage.map-title", "Map: Sant Nirankari Charitable Foundation, 80-A Avtar Marg, Nirankari Colony, Delhi")}
                src={officeMap} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          )}
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
