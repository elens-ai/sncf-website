import { bindCMSValue, getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import React from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { PILLARS } from '../data/pillars';
import './mission-vision-editorial.css';

let CHAPTERS = bindCMSValue(() => ([
  {
    name: getCMSCopy("copy.MissionVision.cf198785f902", "Our mission"), time: getCMSCopy('copy.MissionVision.mission-time', 'What we do today'), heading: getCMSCopy("copy.MissionVision.da1d72247ac3", "Give with"), emphasis: getCMSCopy('copy.MissionVision.mission-emphasis', 'humility.'),
    body: getCMSCopy("copy.MissionVision.e84df2244dc8", "To serve with humility and to share what the foundation has — to heal, to enrich and to empower, wherever in the world the need is. The conviction underneath it is simple: what is given cheerfully and received gratefully leaves both sides better off."),
    caption: getCMSCopy("copy.MissionVision.0310283e4357", "Every act of care starts with us."), link: '/core-values', action: getCMSCopy('copy.MissionVision.mission-action', 'See our values in action'),
    words: [getCMSCopy("copy.MissionVision.word-heal", "Heal"), getCMSCopy("copy.MissionVision.word-enrich", "Enrich"), getCMSCopy("copy.MissionVision.word-empower", "Empower")],
  },
  {
    name: getCMSCopy("copy.MissionVision.2642f93dd297", "Our vision"), time: getCMSCopy('copy.MissionVision.vision-time', 'The future we work towards'), heading: getCMSCopy("copy.MissionVision.7e9be7ae33a1", "A world where"), emphasis: getCMSCopy('copy.MissionVision.vision-emphasis', 'we all thrive.'),
    body: getCMSCopy("copy.MissionVision.7197209907ef", "Living the spirit of service. The foundation works towards a world in which people are healthy, educated and able to stand on their own — and it expects to get there through ordinary volunteers doing extraordinary amounts of quiet work, alongside others who want the same thing."),
    caption: getCMSCopy("copy.MissionVision.fd978c2cda84", "A shared future, shaped together."), link: '/projects', action: getCMSCopy('copy.MissionVision.vision-action', 'Explore the work taking shape'),
    words: [getCMSCopy("copy.MissionVision.word-healthy", "Healthy"), getCMSCopy("copy.MissionVision.word-educated", "Educated"), getCMSCopy("copy.MissionVision.word-self-reliant", "Self-reliant")],
  },
]), value => { CHAPTERS = value; });

/* the three cornerstones, in the order the words are written, each in its own ink */
const LANE_PILLARS = ['heal', 'enrich', 'empower'];

/** An open editorial spread, led by the people behind the work. */
export const MissionVision: React.FC = () => {
  const [mission, vision] = CHAPTERS;
  return <section id="mission" className="purpose-story" aria-labelledby="purpose-story-title">
    <header className="purpose-story-heading" data-reveal>
      <p>{getCMSCopy("copy.MissionVision.d416dc3ddd2f", "Mission and vision")}</p>
      <h2 id="purpose-story-title">{getCMSCopy('copy.MissionVision.today-heading', 'Service today.')} <em>{getCMSCopy('copy.MissionVision.tomorrow-heading', 'A better tomorrow.')}</em></h2>
    </header>
    <div className="purpose-story-spread">
      <figure className="purpose-story-photo" data-reveal>
        <img src={resolveCMSAsset('asset.MissionVision.volunteers', '/images/welcome-volunteers.jpg')}
          alt={getCMSCopy('copy.MissionVision.photo-alt', 'Foundation volunteers gathered in blue shirts, with folded hands, beneath the words Service with Humility')}
          width={2000} height={1099} loading="lazy" decoding="async" />
        <figcaption><span>{getCMSCopy('copy.MissionVision.photo-label', 'The people behind our purpose')}</span><strong>{mission.caption}</strong></figcaption>
      </figure>
      <div className="purpose-story-chapters">
        {CHAPTERS.map((chapter, i) => <article className="purpose-story-chapter" key={chapter.name} data-reveal>
          <div className="purpose-story-chapter-label"><span aria-hidden="true">0{i + 1}</span><p>{chapter.name}</p><small>{chapter.time}</small></div>
          <h3>{chapter.heading} <em>{chapter.emphasis}</em></h3>
          <p className="purpose-story-body">{chapter.body}</p>
          <a className="purpose-story-link" href={chapter.link}>{chapter.action}<span><ArrowUpRight size={17} aria-hidden="true" /></span></a>
        </article>)}
      </div>
    </div>
    <div className="purpose-story-outcomes" data-reveal>
      <p>{vision.caption}</p>
      <ul>
        {mission.words.map((word, i) => {
          const pillar = PILLARS.find(p => p.id === LANE_PILLARS[i]);
          return <li key={word} style={{ '--purpose-accent': pillar?.accentA ?? '#426b89' } as React.CSSProperties}>
            <a href={`/core-values#${LANE_PILLARS[i]}`}>
              <span className="purpose-story-value">{word}</span>
              <ArrowRight size={20} strokeWidth={1.2} aria-hidden="true" />
              <span className="sr-only">{getCMSCopy("copy.MissionVision.bridge", "grows into")} </span>
              <span className="purpose-story-outcome">{vision.words[i]}</span>
            </a>
          </li>;
        })}
      </ul>
    </div>
  </section>;
};
