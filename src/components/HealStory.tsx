import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import type { Activity } from '../data/activities';
import { onArrival } from '../utils/arrival';
import './heal-story.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.HealStory.${key}`, fallback);

interface Door {
  letter: string;
  numeral: string;
  phrase: string;
  text: string;
  photo: string;
  alt: string;
  /** object-position: which part of the photograph shows through the letter. */
  focus: string;
  programmes: string[];
}

/* H·E·A·L, read down the doorways: every programme sits behind one letter. */
const doors = (): Door[] => [
  {
    letter: 'H', numeral: 'I',
    phrase: c('hPhrase', 'Health, brought home.'),
    text: c('hText', 'Checkup camps travel to communities without a clinic nearby, while health centres — allopathy and homeopathy, physiotherapy, labs and pharmacy — stay open every day.'),
    photo: resolveCMSAsset('asset.HealStory.doorH', '/images/programmes/health-checkup-snhc-team.jpg'),
    alt: c('hAlt', 'Nurses in green uniforms take a blood sample from a young man inside a camp tent.'),
    focus: '61% 50%', programmes: ['health-checkup', 'health-centre'],
  },
  {
    letter: 'E', numeral: 'II',
    phrase: c('ePhrase', 'Eyes, given back their light.'),
    text: c('eText', 'Eye camps test vision, fit free spectacles and arrange cataract surgery — bringing reading, work and familiar faces back into focus.'),
    photo: resolveCMSAsset('asset.HealStory.doorE', '/images/programmes/eye-checkup-examination.jpg'),
    alt: c('eAlt', 'A doctor examines an elderly woman’s eye at a free eye checkup camp.'),
    focus: '30% 50%', programmes: ['eye-checkup'],
  },
  {
    letter: 'A', numeral: 'III',
    phrase: c('aPhrase', 'Always ready.'),
    text: c('aText', 'The blood bank processes, separates and stores every donated unit, so that blood is already waiting when a patient needs it.'),
    photo: resolveCMSAsset('asset.HealStory.doorA', '/images/programmes/blood-bank-processing.jpg'),
    alt: c('aAlt', 'Blood bank staff in lab coats sort and label bags of donated blood.'),
    focus: '33% 50%', programmes: ['blood-bank'],
  },
  {
    letter: 'L', numeral: 'IV',
    phrase: c('lPhrase', 'Lifeblood, freely given.'),
    text: c('lText', 'On Manav Ekta Diwas and all through the year, volunteers roll up their sleeves at donation camps across the country — one stranger’s gift to another.'),
    photo: resolveCMSAsset('asset.HealStory.doorL', '/images/programmes/blood-donation.jpg'),
    alt: c('lAlt', 'A volunteer at a blood donation camp holds a sign: “This isn’t a band aid. It’s a badge of honor.”'),
    focus: '73% 50%', programmes: ['blood-donation'],
  },
];

/** The letter is cut out of a pale wash laid over the photograph, so the
    scene shows through it; hovering or focusing the doorway lifts the wash. */
const DoorArch: React.FC<{ door: Door }> = ({ door }) => {
  const id = useId();
  return (
    <div className="heal-door-frame">
      <div className="heal-door-arch">
        <div className="heal-door-depth">
          <img className="heal-door-photo" src={door.photo} alt={door.alt} loading="lazy" decoding="async" style={{ objectPosition: door.focus }} />
        </div>
        <svg className="heal-door-veil" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbfaf8" stopOpacity=".93" />
              <stop offset="1" stopColor="#e9f2ea" stopOpacity=".8" />
            </linearGradient>
            <mask id={`${id}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="500">
              <rect width="400" height="500" fill="#fff" />
              <text className="heal-door-glyph" x="200" y="448" textAnchor="middle" fill="#000">{door.letter}</text>
            </mask>
          </defs>
          <rect width="400" height="500" fill={`url(#${id}-wash)`} mask={`url(#${id}-cut)`} />
        </svg>
        <svg className="heal-door-line" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
          <text className="heal-door-glyph" x="200" y="448" textAnchor="middle">{door.letter}</text>
        </svg>
        <span className="heal-door-numeral" aria-hidden="true">{door.numeral}</span>
      </div>
      <span className="heal-door-step" aria-hidden="true" />
    </div>
  );
};

export const HealStory: React.FC<{ titleId: string; activities: Activity[]; explorerId: string; onSelect: (id: string) => void }> = ({ titleId, activities, explorerId, onSelect }) => {
  useCMSRevision();
  const list = useRef<HTMLOListElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = list.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  const quote = c('quote', 'मानव को हो मानव प्यारा, एक दूजे का बने सहारा।').split(', ');

  return (
    <header className="heal-story">
      <div className="heal-story-masthead">
        <p className="heal-story-kicker"><span>{c('kicker', 'Cornerstone · I')}</span><i aria-hidden="true" /><span>{c('tagline', 'Service with Humility')}</span></p>
        <h2 id={titleId} className="value-hero-title heal-story-title">{c('title', 'Healing Mankind')}</h2>
        <p className="heal-story-lede">{c('lede', 'Healthcare for every')} <em>{c('ledeAccent', 'doorstep.')}</em></p>
        <div className="heal-story-intro">
          <p>{c('introLead', 'For decades, the Mission has been committed to preventive and curative healthcare, serving communities through diverse dimensions of healing.')}</p>
        </div>
      </div>

      <p className="heal-doors-label">{c('doorsLabel', 'Every letter, a doorway.')}</p>
      <ol ref={list} className="heal-doors" data-arrived={arrived}>
        {doors().map((door, i) => {
          const linked = door.programmes.map(pid => activities.find(a => a.id === pid)).filter((a): a is Activity => Boolean(a));
          return (
            <li key={door.letter} className="heal-door" style={{ '--i': i } as React.CSSProperties}>
              <DoorArch door={door} />
              <div className="heal-door-copy">
                <h3>{door.phrase}</h3>
                <p>{door.text}</p>
                <ul className="heal-door-links">
                  {linked.map(activity => (
                    <li key={activity.id}><a href={`#${explorerId}`} onClick={() => onSelect(activity.id)}>{activity.menuLabel ?? activity.title}<ArrowUpRight size={14} aria-hidden="true" /></a></li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <figure className="heal-motto">
        <blockquote lang="hi">{quote.map((line, i) => <span key={i}>{line}{i < quote.length - 1 ? ',' : ''}</span>)}</blockquote>
        <p className="heal-motto-translation">{c('quoteTranslation', 'May every human hold the other dear; may we become each other’s support.')}</p>
        <figcaption>{c('quoteSource', 'From the banner above a health checkup camp')}</figcaption>
      </figure>
    </header>
  );
};
