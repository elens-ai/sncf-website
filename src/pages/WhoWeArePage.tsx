import React from 'react';
import { PageShell } from '../components/PageShell';
import { PARTNERS } from '../data/partners';

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
 * The contact block carries the registered address and the 80G position,
 * because a page that asks an organisation to partner or give has to say
 * plainly where the money goes and who receives it.
 */

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
  { k: 'Tax status', v: 'Donations deductible u/s 80G(5)(vi)' },
];

export const WhoWeArePage: React.FC = () => (
  <PageShell
    accentPillarId="enrich"
    eyebrow="Who We Are · About the foundation"
    title="Who we are"
    standfirst="The Sant Nirankari Charitable Foundation is the Mission’s working hands
      — the part of it that builds hospitals, funds classrooms, plants forests
      and turns up after a flood."
  >
    {/* THE ACCOUNT */}
    <section className="ww-prose">
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
    </section>

    {/* THE FACTS */}
    <ul className="ww-facts">
      {FACTS.map((f) => (
        <li key={f.k}>
          <span className="ww-fact-k">{f.k}</span>
          <span className="ww-fact-v font-artistic-heading">{f.v}</span>
        </li>
      ))}
    </ul>

    {/* MISSION & VISION */}
    <div className="ww-pair">
      <section className="ww-card">
        <h2 className="ww-card-title font-artistic-heading">Our mission</h2>
        <p className="font-artistic-serif">
          To serve with humility and to share what the foundation has — to
          heal, to enrich and to empower, wherever in the world the need is.
          The conviction underneath it is simple: what is given cheerfully and
          received gratefully leaves both sides better off.
        </p>
      </section>
      <section className="ww-card">
        <h2 className="ww-card-title font-artistic-heading">Our vision</h2>
        <p className="font-artistic-serif">
          Living the spirit of service. The foundation works towards a world
          in which people are healthy, educated and able to stand on their own
          — and it expects to get there through ordinary volunteers doing
          extraordinary amounts of quiet work, alongside others who want the
          same thing.
        </p>
      </section>
    </div>

    {/* THE ROAD SO FAR */}
    <section>
      <h2 className="ww-section-title font-artistic-display">The road so far</h2>
      <ol className="ww-timeline">
        {MILESTONES.map((m) => (
          <li key={m.year}>
            <span className="ww-year font-artistic-heading">{m.year}</span>
            <span className="font-artistic-serif">{m.text}</span>
          </li>
        ))}
      </ol>
    </section>

    {/* WHO WALKS WITH US */}
    <section>
      <h2 className="ww-section-title font-artistic-display">Who walks with us</h2>
      <p className="ww-lede font-artistic-serif">
        {PARTNERS.length} organisations have put their name beside the
        foundation’s — United Nations bodies, government departments,
        newsrooms, hospitals and institutes.
      </p>
      <ul className="ww-partners">
        {PARTNERS.map((p) => (
          <li key={p.id}>
            <strong className="font-artistic-heading">{p.name}</strong>
            <span className="font-artistic-serif">{p.contribution}</span>
          </li>
        ))}
      </ul>
    </section>

    {/* WHERE TO FIND US */}
    <section className="ww-contact">
      <h2 className="ww-section-title font-artistic-display">Where to find us</h2>
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
      </div>
    </section>
  </PageShell>
);
