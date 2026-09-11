import { resolveCMSMedia } from '../cms/media';
import React from 'react';
import { getCMSLink } from '../cms/links';
import { useParams, Link } from 'react-router-dom';
import { getCMSSnapshot, isRecord, safeCMSURL, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { PageShell } from '../components/PageShell';
import { EventsSection } from '../components/EventsSection';
import { AwardsSection } from '../components/AwardsSection';

type RecordValue = Record<string, unknown>;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const records = (value: unknown): RecordValue[] => Array.isArray(value) ? value.filter(isRecord) : [];

function Media({ item }: { item: RecordValue }) {
  const src = text(item.src), video = text(item.video);
  if (safeCMSURL(video)) return <video controls playsInline preload="metadata" poster={resolveCMSMedia(safeCMSURL(src) ? src : undefined)} className="w-full rounded-2xl"><source src={resolveCMSMedia(video)} /><a href={video}>{getCMSCopy("copy.CMSPage.ec7c20b5b09e", "Watch the video")}</a></video>;
  if (safeCMSURL(src)) return <figure><img src={resolveCMSMedia(src)} alt={text(item.alt)} loading="lazy" decoding="async" className="w-full rounded-2xl" />{item.caption && <figcaption className="mt-3 text-sm opacity-70">{text(item.caption)}</figcaption>}</figure>;
  return null;
}

function Section({ section }: { section: RecordValue }) {
  if (section.enabled === false) return null;
  if (section.blockType === 'custom') {
    if (section.component === 'events') return <EventsSection />;
    if (section.component === 'awards') return <AwardsSection />;
    return null;
  }
  return <section className="my-12 md:my-20" id={text(section.id)}>
    {section.heading && <h2 className="font-artistic-heading text-3xl mb-6">{text(section.heading)}</h2>}
    {section.blockType === 'media' && <Media item={section} />}
    {section.body && <p className="text-lg leading-relaxed whitespace-pre-line my-6">{text(section.body)}</p>}
    {section.blockType === 'cards' && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{records(section.cards).map((card, index) => <article className="p-6 bg-white rounded-2xl border border-black/10" key={text(card.id) || index}>
      <Media item={card} />
      {card.title && <h3 className="font-artistic-heading text-2xl mt-5 mb-3">{text(card.title)}</h3>}
      <p className="leading-relaxed whitespace-pre-line">{text(card.body)}</p>
      {safeCMSURL(card.href, true) && <a className="inline-block mt-4 underline underline-offset-4" href={card.href}>{getCMSCopy("copy.CMSPage.2e1ac6e9292a", "Explore ")}{text(card.title)} →</a>}
    </article>)}</div>}
  </section>;
}

export default function CMSPage() {
  useCMSRevision();
  const { slug } = useParams();
  const page = records(getCMSSnapshot().pages).find(item => item.slug === slug);
  if (!page) return <PageShell title={getCMSCopy("copy.CMSPage.cb6f188292dd", "Page unavailable")} eyebrow={getCMSCopy("copy.CMSPage.16ff4ce94280", "SNCF")} standfirst={getCMSCopy("copy.CMSPage.10ae4997444f", "This page is not currently published.")}><Link to={getCMSLink("copy.Link.CMSPage.8a5edab28263", "/")} className="inline-block my-12 underline">{getCMSCopy("copy.CMSPage.bbcc935e4263", "Return home")}</Link></PageShell>;
  return <PageShell title={text(page.title)} eyebrow={getCMSCopy("copy.CMSPage.a01941bf3134", "Sant Nirankari Charitable Foundation")} standfirst={text(page.description)}>
    {records(page.sections).map((section, index) => <React.Fragment key={text(section.id) || index}><Section section={section} /></React.Fragment>)}
  </PageShell>;
}
