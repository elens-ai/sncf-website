import { bindCMSValue, getCMSCopy } from '../cms/runtime';
import React from 'react';
import { ArrowUpRight, HeartHandshake, Sprout } from 'lucide-react';

let CHAPTERS = bindCMSValue(() => ([
  {
    name: getCMSCopy("copy.MissionVision.cf198785f902", "Our mission"), time: 'What we do today', heading: getCMSCopy("copy.MissionVision.da1d72247ac3", "Give with"), emphasis: 'humility.',
    body: getCMSCopy("copy.MissionVision.e84df2244dc8", "To serve with humility and to share what the foundation has — to heal, to enrich and to empower, wherever in the world the need is. The conviction underneath it is simple: what is given cheerfully and received gratefully leaves both sides better off."),
    centre: 'Service', caption: getCMSCopy("copy.MissionVision.0310283e4357", "Every act of care starts with us."), link: '/core-values', action: 'See our values in action',
    words: ['Heal', 'Enrich', 'Empower'],
  },
  {
    name: getCMSCopy("copy.MissionVision.2642f93dd297", "Our vision"), time: 'The future we work towards', heading: getCMSCopy("copy.MissionVision.7e9be7ae33a1", "A world where"), emphasis: 'we all thrive.',
    body: getCMSCopy("copy.MissionVision.7197209907ef", "Living the spirit of service. The foundation works towards a world in which people are healthy, educated and able to stand on their own — and it expects to get there through ordinary volunteers doing extraordinary amounts of quiet work, alongside others who want the same thing."),
    centre: 'Possibility', caption: getCMSCopy("copy.MissionVision.fd978c2cda84", "A shared future, shaped together."), link: '/projects', action: 'Explore the work taking shape',
    words: ['Healthy', 'Educated', 'Self-reliant'],
  },
]), value => { CHAPTERS = value; });

export const MissionVision: React.FC = () => <section id="mission" className="purpose-pair" aria-label={getCMSCopy("copy.MissionVision.d416dc3ddd2f", "Mission and vision")}>
  {CHAPTERS.map((chapter,i) => { const Icon = i === 0 ? HeartHandshake : Sprout; return <article className="purpose-panel" key={chapter.name} data-reveal>
    <div className="purpose-art" aria-hidden="true"><span/><span/><Icon size={58} strokeWidth={1}/></div>
    <p className="ed-eyebrow">{chapter.time}</p><h2>{chapter.name}</h2>
    <h3>{chapter.heading} <em>{chapter.emphasis}</em></h3><p className="purpose-body">{chapter.body}</p>
    <a className="ed-link" href={chapter.link}>{chapter.action}<ArrowUpRight size={17}/></a>
  </article>; })}
</section>;
