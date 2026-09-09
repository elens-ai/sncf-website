import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Search, HeartHandshake, Sparkles, Pause, Play, Plus, Heart, BookOpen, Sprout } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
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

const MILESTONES = [
  { year: '2010', text: 'The foundation is established as the Mission’s charitable arm.' },
  { year: '2014', text: 'The Rajmata scholarship scheme begins supporting students on merit and means.' },
  { year: '2021', text: 'Oneness Vann starts planting indigenous micro-forests across the country.' },
  { year: '2023', text: 'Project Amrit launches with the Government of India to revive water bodies.' },
];

const FACTS = [
  { k: 'Founded', v: '2010' },
  { k: 'Standing', v: 'UN special consultative status' },
  { k: 'Reach', v: '250+ branches nationwide' },
];

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
const BIGGEST = CORNERSTONES.map((id) => {
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
    <div className="who-cover-copy" data-reveal><p className="who-eyebrow">Sant Nirankari Charitable Foundation</p><div className="ed-dots" aria-hidden="true">{[0,1,2,3,4].map(i => <i key={i} />)}</div><h1 id="who-title">Who we are</h1><p>The Sant Nirankari Charitable Foundation is the Mission’s working hands — the part of it that builds hospitals, funds classrooms, plants forests and turns up after a flood.</p><div className="who-cover-actions"><a href="#account">Discover our story <ArrowDown size={17} /></a></div><span className="who-cover-signature"><HeartHandshake size={19} /> Service with humility · Since 2010</span></div>
    <figure className="who-cover-photo" data-reveal><img src="/images/volunteers-planning.webp" alt="Source illustration of volunteers planning a service drive" width="640" height="480" decoding="async" fetchPriority="high" /><figcaption>Volunteer planning · Source illustration</figcaption><div className="who-cover-note"><HeartHandshake size={22} /><span>Service<br /><strong>with Humility.</strong></span></div></figure>
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
    eyebrow="Who We Are · About the foundation"
    title="Who we are"
    standfirst="The Sant Nirankari Charitable Foundation is the Mission’s working hands
      — the part of it that builds hospitals, funds classrooms, plants forests
      and turns up after a flood."
    rail={
      <SubsectionNav
        label="On this page"
        links={[
          /* One ink, the page's own. These carried the five petal inks — the
             hall's lotus colours — which made a third colour system on a page
             that already has a pillar and a set of brand marks. */
          { id: 'account', label: 'Our story', ink: INK_B },
          { id: 'mission', label: 'Mission & vision', ink: INK_B },
          { id: 'road', label: 'The road so far', ink: INK_B },
          { id: 'partners', label: 'Who walks with us', ink: INK_B },
          { id: 'wwa-media', label: 'Photographs & films', ink: INK_B },
          { id: 'contact', label: 'Where to find us', ink: INK_B },
        ]}
      />
    }
  >
    <EditorialMotion className="who-editorial"><div className="who-story" ref={storyRef}>
    {/* ── 01 · THE ACCOUNT ─────────────────────────────────────────────── */}
    <section {...roomProps('account')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={1}
        id="account"
        mark
        label="About the foundation"
        title="A purpose bigger than ourselves."
        body="The belief that brings us together, and the work that carries it forward."
      />

      <div className="cv-chapter">
        <div className="ww-prose">
          <p className="font-artistic-serif">
            The foundation was set up in 2010 to act on a single line of Baba
            Hardev Singh Ji’s: that a life gets its meaning if it is lived for
            others. That is not a slogan the organisation wears lightly — it is
            the whole operating principle. Everything below follows from it.
          </p>
          <p className="font-artistic-serif">
            Its governing phrase is <em>Service with Humility</em>. The humility
            matters as much as the service: the work is done without asking who
            the recipient is, what they believe, or whether they can return the
            favour. Blood is given to whoever needs it. A classroom is opened to
            whoever will sit in it.
          </p>
          <p className="font-artistic-serif">
            The work is organised into three cornerstones — healing, enriching and
            empowering — with care for the natural world running through all
            three rather than sitting apart from them. Its reach is deliberately
            weighted towards places that are easy to overlook: remote districts,
            under-served neighbourhoods, villages a long way from a hospital.
          </p>
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
          <h3 className="cv-sub font-artistic-display">Three values. Everyday action.</h3>
          <ul className="cv-tally-list">
            {BIGGEST.map(({ pillar, act }) => {
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
                  <a className="who-value-link" href={`/core-values#${pillar.id}`}>Explore {pillar.label.toLowerCase()} <ArrowUpRight size={15} /></a>
                </li>
              );
            })}
          </ul>
          <p className="cv-scale-note">
            One figure per cornerstone — the largest plain count each of them
            reports. They are counted in different units and stopped at
            different dates, so nothing here is ranked against anything else.
            The full record is on the Core Values page.
          </p>
        </div>

        {/* MISSION & VISION */}
        <MissionVision />
      </div>
    </section>

    {/* ── 02 · THE ROAD SO FAR ─────────────────────────────────────────── */}
    <section {...roomProps('road')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={2}
        id="road"
        mark
        label="Since 2010"
        title="The road so far"
        body="Four dates the foundation marks its own history by."
      />
      <div className="cv-chapter" ref={timelineRef}>
        <EditorialTimeline items={MILESTONES.map((m,i) => ({...m,label:['Our beginning','Learning opens doors','Growing together','Reviving our water'][i],href:['#account','/core-values#enrich','/projects#project-oneness-vann','/projects#project-amrit'][i]}))} />
      </div>
    </section>

    {/* ── 03 · WHO WALKS WITH US ───────────────────────────────────────── */}
    <section {...roomProps('partners')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={3}
        id="partners"
        label="Supports & collaborations"
        title="Who walks with us"
        body={`${PARTNERS.length} organisations have put their name beside the foundation’s — United Nations bodies, government departments, newsrooms, hospitals and institutes.`}
      />
      <div className="cv-chapter">
        {/* THE REGISTER. Nine of the twelve publish a usable mark and those
            files have been in the repo unused; this page printed all twelve
            as text. A name set beside its own mark is what a register of
            supporters looks like, and the three without one take a monogram
            rather than a gap. */}
        <div className="who-partner-toolbar"><label><Search size={17} /><input value={partnerQuery} onChange={e => setPartnerQuery(e.target.value)} aria-label="Search foundation partners" placeholder="Find an organisation or a cause…" /></label><span>{matchingPartners.length} collaborations</span></div>
        {matchingPartners.length === 0 && <p className="who-empty">No collaborations match that search. Try another name or cause.</p>}
        <ul className="ww-register">
          {matchingPartners.map(partner => <PartnerItem key={partner.id} partner={partner} />)}
        </ul>

        <div id="wwa-media">
          <MediaGallery section="who-we-are" headingLevel={3} layout="editorial" />
        </div>
      </div>
    </section>

    <section {...roomProps('contact')} data-reveal><Leaf n={4} id="contact" label="The registered office" title="Where to find us" body="Where the foundation is, and under what terms a gift to it is made."/><div className="who-contact-editorial">
      <div><p className="ed-eyebrow">Registered office</p><h3>Service begins<br /><em>with a conversation.</em></h3><address>Sant Nirankari Charitable Foundation<br/>80-A, Avtar Marg, Nirankari Colony<br/>Delhi 110009, India</address></div>
      <div><p className="ed-eyebrow">Telephone</p><a href="tel:+911147660380">+91 11 4766 0380</a><a href="tel:+911147660200">+91 11 4766 0200</a><p className="ed-eyebrow">Email</p><a href="mailto:sncf@nirankarifoundation.org">sncf@nirankarifoundation.org</a><a href="mailto:accounts@nirankarifoundation.org">accounts@nirankarifoundation.org</a></div>
      <p className="who-contact-tax"><strong>Tax status</strong> Donations are deductible under section 80G(5)(vi) of the Income Tax Act, 1961.</p>
    </div></section>
    <div className="who-closing"><HeartHandshake size={30} strokeWidth={1.4} /><p>Service begins with a willingness<br /><em>to make a difference.</em></p><a href="/projects">Discover our projects <ArrowUpRight size={17} /></a></div>
    </div></EditorialMotion>
  </PageShell>
  );
};
