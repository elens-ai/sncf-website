import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { CMSSection } from '../cms/CMSContentProvider';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Search, HeartHandshake, Sparkles, Pause, Play, Plus, Heart, BookOpen, Sprout } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { MediaGallery } from '../components/MediaGallery';
import { Tally } from '../components/Tally';
import { MissionVision } from '../components/MissionVision';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { PARTNERS } from '../data/partners';
import { EditorialTimeline, PartnerItem } from '../components/EditorialContent';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { toNumber, isTallyable } from '../utils/figures';
import './who-we-are.css';
import { EditorialMotion, EditorialHeading } from '../components/EditorialMotion';
import './who-editorial.css';

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
 * IT IS BUILT AS ROOMS, like Core Values and Projects. It was not, and that
 * was the whole of what was wrong with it: the same shell and the same rail,
 * but flat white cards where the pages either side have a tinted threshold
 * per chapter, a folio, printed margins and ink plates. It read as a
 * different, plainer site reached through the same header. Nothing here is a
 * new device — every class below already ships.
 */

/** The page prints in Enrich's blue: it is the foundation's own account, and
    Enrich is the cornerstone this page's shell already accents. */
const PILLAR = PILLARS.find((p) => p.id === 'enrich');
const INK_A = PILLAR?.accentA ?? '#1565c0';
const INK_B = PILLAR?.accentB ?? '#64b5f6';

let MILESTONES = bindCMSValue(() => ([
  { year: getCMSCopy("copy.WhoWeArePage.7d12ba56e9f8", "2010"), text: getCMSCopy("copy.WhoWeArePage.86c8252ee47f", "The foundation is established as the Mission’s charitable arm.") },
  { year: getCMSCopy("copy.WhoWeArePage.96da37e95d5c", "2014"), text: getCMSCopy("copy.WhoWeArePage.2be360738982", "The Rajmata scholarship scheme begins supporting students on merit and means.") },
  { year: getCMSCopy("copy.WhoWeArePage.1bea20e1df19", "2021"), text: getCMSCopy("copy.WhoWeArePage.e12b02013977", "Oneness Vann starts planting indigenous micro-forests across the country.") },
  { year: getCMSCopy("copy.WhoWeArePage.d398b29d3dbb", "2023"), text: getCMSCopy("copy.WhoWeArePage.aa6779f55c5f", "Project Amrit launches with the Government of India to revive water bodies.") },
]), value => { MILESTONES = value; });

let FACTS = bindCMSValue(() => ([
  { k: getCMSCopy("copy.WhoWeArePage.6520e4488973", "Founded"), v: getCMSCopy("copy.WhoWeArePage.7d12ba56e9f8", "2010") },
  { k: getCMSCopy("copy.WhoWeArePage.e4b35726fbaf", "Standing"), v: getCMSCopy("copy.WhoWeArePage.d5af85a6a90e", "UN special consultative status") },
  { k: getCMSCopy("copy.WhoWeArePage.2068b81b75d4", "Reach"), v: getCMSCopy("copy.WhoWeArePage.9d3f458ea970", "250+ branches nationwide") },
]), value => { FACTS = value; });

/**
 * THE PAGE SAYS "THREE CORNERSTONES" AND USED TO COUNT NOTHING.
 *
 * One row per cornerstone, carrying the largest plainly-written COUNT that
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

const WhoCover: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  return <section ref={ref} className="who-cover" data-active={active} aria-labelledby="who-title">
    <div className="who-cover-copy" data-reveal><p className="who-eyebrow">{getCMSCopy("copy.WhoWeArePage.a01941bf3134", "Sant Nirankari Charitable Foundation")}</p><div className="ed-dots" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} />)}</div><h1 id="who-title">{getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}</h1><p>{getCMSCopy("copy.WhoWeArePage.5f1d766bc647", "The Sant Nirankari Charitable Foundation is the Mission’s working hands — the part of it that builds hospitals, funds classrooms, plants forests and turns up after a flood.")}</p><div className="who-cover-actions"><a href={getCMSLink("copy.Link.WhoWeArePage.f24daa84860f", "#account")}>{getCMSCopy("copy.WhoWeArePage.3c34f30db957", "Discover our story ")}<ArrowDown size={17} /></a></div><span className="who-cover-signature"><HeartHandshake size={19} />{getCMSCopy("copy.WhoWeArePage.368abdd6a9dc", " Service with humility · Since 2010")}</span></div>
    <figure className="who-cover-photo" data-reveal><img src={resolveCMSAsset("asset.WhoWeArePage.76f684891a21", "/images/volunteers-planning.webp")} alt={getCMSCopy("copy.WhoWeArePage.5879b4fa1245", "Source illustration of volunteers planning a service drive")} width="640" height="480" decoding="async" fetchPriority="high" /><figcaption>{getCMSCopy("copy.WhoWeArePage.54f53f33a2a7", "Volunteer planning · Source illustration")}</figcaption><div className="who-cover-note"><HeartHandshake size={22} /><span>{getCMSCopy("copy.WhoWeArePage.d677190e0a99", "Service")}<br /><strong>{getCMSCopy("copy.WhoWeArePage.feb554a592af", "with Humility.")}</strong></span></div></figure>
  </section>;
};

export const WhoWeArePage: React.FC = () => {
  const [partnerQuery, setPartnerQuery] = useState('');
  const storyRef = useRef<HTMLDivElement>(null), timelineRef = useRef<HTMLDivElement>(null);
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
  const matchingPartners = PARTNERS.filter(p => `${p.name} ${p.contribution} ${p.note ?? ''}`.toLowerCase().includes(partnerQuery.trim().toLowerCase()));
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }), 100);
    return () => clearTimeout(timer);
  }, [hash]);
  return (
  <PageShell
    cover={<EditorialMotion><WhoCover /></EditorialMotion>}
    accentPillarId="enrich"
    eyebrow={getCMSCopy("copy.WhoWeArePage.eefebe5695c5", "Who We Are · About the foundation")}
    title={getCMSCopy("copy.WhoWeArePage.696ab4d5bfb5", "Who we are")}
    standfirst={getCMSCopy("copy.WhoWeArePage.b96d49653114", "The Sant Nirankari Charitable Foundation is the Mission’s working hands\n      — the part of it that builds hospitals, funds classrooms, plants forests\n      and turns up after a flood.")}

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
        <div className="ww-prose">
          <p className="font-artistic-serif">{getCMSCopy("copy.WhoWeArePage.8fb1d447ef9c", "The foundation was set up in 2010 to act on a single line of Baba Hardev Singh Ji’s: that a life gets its meaning if it is lived for others. That is not a slogan the organisation wears lightly — it is the whole operating principle. Everything below follows from it.")}</p>
          <p className="font-artistic-serif">{getCMSCopy("copy.WhoWeArePage.d9b601893e49", "Its governing phrase is ")}<em>{getCMSCopy("copy.WhoWeArePage.56219e473693", "Service with Humility")}</em>{getCMSCopy("copy.WhoWeArePage.1ae89fe4f166", ". The humility matters as much as the service: the work is done without asking who the recipient is, what they believe, or whether they can return the favour. Blood is given to whoever needs it. A classroom is opened to whoever will sit in it.")}</p>
          <p className="font-artistic-serif">{getCMSCopy("copy.WhoWeArePage.d4ef378ef3af", "The work is organised into three cornerstones — healing, enriching and empowering — with care for the natural world running through all three rather than sitting apart from them. Its reach is deliberately weighted towards places that are easy to overlook: remote districts, under-served neighbourhoods, villages a long way from a hospital.")}</p>
        </div>

        <ul className="ww-facts">
          {FACTS.map((f) => (
            <li key={f.k}>
              <span className="ww-fact-k">{f.k}</span>
              <span className="ww-fact-v font-artistic-heading">{f.v}</span>
            </li>
          ))}
        </ul>

        {/* WHAT THE THREE CORNERSTONES COME TO. The paragraph above names
            them; this counts them, in the same marks Core Values uses and at
            each row's own step, so nothing is ranked against anything else. */}
        <div className="cv-tally">
          <h3 className="cv-sub font-artistic-display">{getCMSCopy("copy.WhoWeArePage.25c28cead1f0", "Three values. Everyday action.")}</h3>
          <ul className="cv-tally-list">
            {getBiggest().map(({ pillar, act }) => {
              return (
                <li key={act.id} className="cv-tally-row" style={{ '--value-ink': pillar.accentA, '--value-tint': pillar.accentB } as React.CSSProperties}>
                  <p className="cv-tally-head">
                    <span className="cv-tally-name font-artistic-heading">
                      {pillar.label} · {act.title}
                    </span>
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

        {/* MISSION & VISION */}
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
      <div className="cv-chapter" ref={timelineRef}>
        <EditorialTimeline items={MILESTONES.map((m,i) => ({...m,label:['Our beginning','Learning opens doors','Growing together','Reviving our water'][i],href:['#account','/core-values#enrich','/projects#project-oneness-vann','/projects#project-amrit'][i]}))} />
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
        {/* THE REGISTER. Nine of the twelve publish a usable mark and those
            files have been in the repo unused; this page printed all twelve
            as text. A name set beside its own mark is what a register of
            supporters looks like, and the three without one take a monogram
            rather than a gap. */}
        <div className="who-partner-toolbar"><label><Search size={17} /><input value={partnerQuery} onChange={e => setPartnerQuery(e.target.value)} aria-label={getCMSCopy("copy.WhoWeArePage.447786a75a38", "Search foundation partners")} placeholder={getCMSCopy("copy.WhoWeArePage.f3bd895aae45", "Find an organisation or a cause…")} /></label><span>{matchingPartners.length}{getCMSCopy("copy.WhoWeArePage.26f9857f2b6f", " collaborations")}</span></div>
        {matchingPartners.length === 0 && <p className="who-empty">{getCMSCopy("copy.WhoWeArePage.7d25129d73f9", "No collaborations match that search. Try another name or cause.")}</p>}
        <ul className="ww-register">
          {matchingPartners.map(partner => <PartnerItem key={partner.id} partner={partner} />)}
        </ul>

        <div id="wwa-media">
          <MediaGallery section="who-we-are" headingLevel={3} layout="editorial" />
        </div>
      </div>
    </section></CMSSection>

    <CMSSection id="WhoWeArePage.contact"><section {...roomProps('contact')} data-reveal><Leaf n={4} id="contact" label={getCMSCopy("copy.WhoWeArePage.630add5617cc", "The registered office")} title={getCMSCopy("copy.WhoWeArePage.d06af8e88b68", "Where to find us")} body={getCMSCopy("copy.WhoWeArePage.dbfafcc18936", "Where the foundation is, and under what terms a gift to it is made.")}/><div className="who-contact-editorial">
      <div><p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.bc395eb428a7", "Registered office")}</p><h3>{getCMSCopy("copy.WhoWeArePage.129d2c4eafb3", "Service begins")}<br /><em>{getCMSCopy("copy.WhoWeArePage.6265a53e30a6", "with a conversation.")}</em></h3><address>{getCMSCopy("copy.WhoWeArePage.a01941bf3134", "Sant Nirankari Charitable Foundation")}<br/>{getCMSCopy("copy.WhoWeArePage.e1df9065fffb", "80-A, Avtar Marg, Nirankari Colony")}<br/>{getCMSCopy("copy.WhoWeArePage.f59cf0b8fe44", "Delhi 110009, India")}</address></div>
      <div><p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.84ecd6328b80", "Telephone")}</p><a href={getCMSLink("copy.Link.WhoWeArePage.e3dc1a537132", "tel:+911147660380")}>{getCMSCopy("copy.WhoWeArePage.c80396e2c603", "+91 11 4766 0380")}</a><a href={getCMSLink("copy.Link.WhoWeArePage.1cc23dc8cae1", "tel:+911147660200")}>{getCMSCopy("copy.WhoWeArePage.4d6d92142f22", "+91 11 4766 0200")}</a><p className="ed-eyebrow">{getCMSCopy("copy.WhoWeArePage.969ccbd3cf63", "Email")}</p><a href={getCMSLink("copy.Link.WhoWeArePage.87f2c7a16748", "mailto:sncf@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.e7896d85308f", "sncf@nirankarifoundation.org")}</a><a href={getCMSLink("copy.Link.WhoWeArePage.536060a063aa", "mailto:accounts@nirankarifoundation.org")}>{getCMSCopy("copy.WhoWeArePage.bee1eacddce6", "accounts@nirankarifoundation.org")}</a></div>
      <p className="who-contact-tax"><strong>{getCMSCopy("copy.WhoWeArePage.ee8c63df0992", "Tax status")}</strong>{getCMSCopy("copy.WhoWeArePage.6491cd959e1d", " Donations are deductible under section 80G(5)(vi) of the Income Tax Act, 1961.")}</p>
    </div></section></CMSSection>
    <div className="who-closing"><HeartHandshake size={30} strokeWidth={1.4} /><p>{getCMSCopy("copy.WhoWeArePage.67ba1a790310", "Service begins with a willingness")}<br /><em>{getCMSCopy("copy.WhoWeArePage.57911c50add4", "to make a difference.")}</em></p><a href={getCMSLink("copy.Link.WhoWeArePage.902ceeb21a5f", "/projects")}>{getCMSCopy("copy.WhoWeArePage.afa302c27b7e", "Discover our projects ")}<ArrowUpRight size={17} /></a></div>
    </div></EditorialMotion>
  </PageShell>
  );
};
