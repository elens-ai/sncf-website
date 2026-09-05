import React from 'react';
import { PageShell } from '../components/PageShell';
import { SubsectionNav } from '../components/SubsectionNav';
import { MediaGallery } from '../components/MediaGallery';
import { Tally } from '../components/Tally';
import { PARTNERS } from '../data/partners';
import { BRAND } from '../data/partnerBrand';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES } from '../data/activities';
import { toNumber, isTallyable, markStep, groupNum } from '../utils/figures';

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
 * The contact block carries the registered address, the phones, the email
 * addresses and the 80G position, because a page that asks an organisation
 * to partner or give has to say plainly where the money goes and who
 * receives it.
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
  style: { '--ink-a': INK_A, '--ink-b': INK_B } as React.CSSProperties,
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

const Leaf: React.FC<LeafProps> = ({ n, id, label, title, body, mark }) => (
  <header className="cv-threshold">
    {mark && <span className="cv-threshold-mark" data-for={id} aria-hidden="true" />}
    <span className="cv-threshold-num font-artistic-heading" aria-hidden="true">
      {String(n).padStart(2, '0')}
    </span>
    <p className="cv-threshold-label font-artistic-display">{label}</p>
    <h2 id={`${id}-title`} className="cv-threshold-title font-artistic-heading">
      {title}
    </h2>
    <p className="cv-threshold-body font-artistic-serif">{body}</p>
  </header>
);

export const WhoWeArePage: React.FC = () => (
  <PageShell
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
          { id: 'account', label: 'The account', ink: INK_B },
          { id: 'mission', label: 'Mission & vision', ink: INK_B },
          { id: 'road', label: 'The road so far', ink: INK_B },
          { id: 'partners', label: 'Who walks with us', ink: INK_B },
          { id: 'wwa-media', label: 'Photographs & films', ink: INK_B },
          { id: 'contact', label: 'Where to find us', ink: INK_B },
        ]}
      />
    }
  >
    {/* ── 01 · THE ACCOUNT ─────────────────────────────────────────────── */}
    <section {...roomProps('account')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={1}
        id="account"
        mark
        label="About the foundation"
        title="The account"
        body="Why it exists, in the words it uses itself."
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
          <h3 className="cv-sub font-artistic-display">What the three come to</h3>
          <ul className="cv-tally-list">
            {BIGGEST.map(({ pillar, act }) => {
              const v = toNumber(act.headline.value);
              const step = markStep(v);
              const marks = Math.max(1, Math.min(20, Math.round(v / step)));
              return (
                <li key={act.id} className="cv-tally-row">
                  <p className="cv-tally-head">
                    <span className="cv-tally-name font-artistic-heading">
                      {pillar.label} · {act.title}
                    </span>
                    <span className="cv-tally-figure font-artistic-heading">
                      <Tally value={act.headline.value} />
                      <span className="cv-tally-unit">{act.headline.label}</span>
                    </span>
                  </p>
                  <p className="cv-tally-marks" data-for={act.id} aria-hidden="true">
                    {Array.from({ length: marks }, (_, i) => (
                      <span key={i} style={{ '--n': i } as React.CSSProperties} />
                    ))}
                  </p>
                  <p className="cv-tally-key">
                    <span>
                      each mark ≈ {groupNum(step)}{' '}
                      {act.headline.label.toLowerCase()}
                    </span>
                    <span className="cv-tally-period">{act.period}</span>
                  </p>
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
        <div className="ww-pair" id="mission">
          <section className="ww-card">
            <h3 className="ww-card-title font-artistic-heading">Our mission</h3>
            <p className="font-artistic-serif">
              To serve with humility and to share what the foundation has — to
              heal, to enrich and to empower, wherever in the world the need is.
              The conviction underneath it is simple: what is given cheerfully and
              received gratefully leaves both sides better off.
            </p>
          </section>
          <section className="ww-card">
            <h3 className="ww-card-title font-artistic-heading">Our vision</h3>
            <p className="font-artistic-serif">
              Living the spirit of service. The foundation works towards a world
              in which people are healthy, educated and able to stand on their own
              — and it expects to get there through ordinary volunteers doing
              extraordinary amounts of quiet work, alongside others who want the
              same thing.
            </p>
          </section>
        </div>
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
      <div className="cv-chapter">
        <ol className="ww-timeline">
          {MILESTONES.map((m) => (
            <li key={m.year}>
              <span className="ww-year font-artistic-heading">{m.year}</span>
              <span className="font-artistic-serif">{m.text}</span>
            </li>
          ))}
        </ol>
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
        <ul className="ww-register">
          {PARTNERS.map((p) => {
            const b = BRAND[p.id];
            return (
              <li key={p.id}>
                <span
                  className="ww-register-mark"
                  style={{ '--tile-ink': b?.color ?? INK_A } as React.CSSProperties}
                >
                  <span className="ww-register-initials font-artistic-display">
                    {b?.initials ?? p.name.slice(0, 2)}
                  </span>
                  {b?.logo && (
                    <img
                      src={b.logo}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      /* the monogram underneath is the fallback, so a file
                         that 404s leaves a register entry rather than a hole */
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </span>
                <span className="ww-register-text">
                  <strong className="font-artistic-heading">{p.name}</strong>
                  <span className="font-artistic-serif">{p.contribution}</span>
                  {p.note && <span className="ww-register-note">{p.note}</span>}
                </span>
              </li>
            );
          })}
        </ul>

        <div id="wwa-media">
          <MediaGallery section="who-we-are" headingLevel={3} />
        </div>
      </div>
    </section>

    {/* ── 04 · WHERE TO FIND US ────────────────────────────────────────── */}
    <section {...roomProps('contact')}>
      <div className="cv-margin-print" data-room="who-we-are" aria-hidden="true" />
      <Leaf
        n={4}
        id="contact"
        label="The registered office"
        title="Where to find us"
        body="Where the foundation is, and under what terms a gift to it is made."
      />
      <div className="cv-chapter">
        <div className="ww-contact">
          <div className="ww-contact-grid">
            <div>
              <span className="ww-fact-k">Registered office</span>
              <p className="font-artistic-serif">
                Sant Nirankari Charitable Foundation
                <br />
                80-A, Avtar Marg, Nirankari Colony
                <br />
                Delhi 110009, India
              </p>
            </div>
            <div>
              <span className="ww-fact-k">Telephone</span>
              <p className="font-artistic-serif">
                <a href="tel:+911147660380">+91 11 4766 0380</a>
                <br />
                <a href="tel:+911147660200">+91 11 4766 0200</a>
              </p>
            </div>
            <div>
              <span className="ww-fact-k">Email</span>
              <p className="font-artistic-serif">
                <a href="mailto:sncf@nirankarifoundation.org">
                  sncf@nirankarifoundation.org
                </a>
                <br />
                <a href="mailto:accounts@nirankarifoundation.org">
                  accounts@nirankarifoundation.org
                </a>
              </p>
            </div>
            {/* THE 80G POSITION BELONGS HERE. This file's own header has
                always said the contact block carries it; it did not — the
                clause sat in the facts strip at the top of the page, four
                sections away from the addresses. The comment is true now. */}
            <div>
              <span className="ww-fact-k">Tax status</span>
              <p className="font-artistic-serif">
                Donations are deductible under section 80G(5)(vi) of the Income
                Tax Act, 1961.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageShell>
);
