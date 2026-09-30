import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Award, BookOpen, Droplet, Droplets, Eye, GraduationCap,
  HandCoins, Heart, HeartHandshake, Hospital, House, Laptop, Mountain,
  PackageCheck, Scissors, Sparkles, Sprout, Stethoscope, Trees, Waves,
  type LucideIcon,
} from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import type { Activity } from '../data/activities';
import type { PillarState } from '../types';
import { PillarArtwork } from './PillarArtwork';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import { PillarWordmark } from './PillarWordmark';
import { MosaicWavesStatic } from './MosaicWaves';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import './mosaic-chapter.css';

const ACTIVITY_SYMBOLS: Record<string, LucideIcon> = {
  'blood-donation': Droplets, 'health-checkup': Stethoscope, 'eye-checkup': Eye,
  'health-centre': Hospital, 'blood-bank': Droplet,
  'schools-colleges': GraduationCap, scholarships: Award, 'free-schools': BookOpen,
  'skill-nima': Laptop, 'skill-trades': Scissors,
  'tree-plantation': Trees, cleanliness: Sparkles, 'covid-relief': PackageCheck,
  'mass-marriages': Heart, 'financial-support': HandCoins,
  'project-amrit': Waves, 'oneness-vann': Sprout, watershed: Mountain, 'adopted-villages': House,
};

/** Photographs that blend in behind the chapter while a programme is hovered. */
const ACTIVITY_BACKDROPS: Record<string, string[]> = {
  'blood-donation': [
    '/images/programmes/blood-donation-donor.jpg',
    /* Cut-out with its white surround keyed to transparent. */
    '/images/programmes/blood-donation-volunteers.png',
    '/images/programmes/blood-donation-satguru.jpg',
  ],
  'health-checkup': [
    '/images/programmes/health-checkup-sample-collection.jpg',
    '/images/programmes/health-checkup-blood-draw.jpg',
    '/images/programmes/health-checkup-camp.jpg',
  ],
  'health-centre': [
    '/images/programmes/health-centre-building.jpg',
    '/images/programmes/health-centre-team.jpg',
    '/images/programmes/health-centre-inauguration.jpg',
    '/images/programmes/health-centre-dedication.jpg',
  ],
};

/** A spot in one collage photo shown clearly instead of faded: `slot` is the
    photo's index, `x`/`y` the spot's centre within that photo's panel, and
    `rx`/`ry` its radii. */
interface BackdropFocus { slot: number; x: string; y: string; rx?: string; ry?: string }
const BACKDROP_FOCUS: Record<string, BackdropFocus> = {
  /* Satguru Mata ji and Ramit ji at the centre of the team photograph. */
  'health-centre': { slot: 1, x: '52%', y: '63%' },
  /* Satguru Mata ji beside the donor; the two fill most of the panel. */
  'blood-donation': { slot: 2, x: '48%', y: '42%', rx: '34%', ry: '38%' },
};

/** Feathered photo collage; images load once its chapter is on screen, so the
    first hover doesn't wait on the download. */
const ActivityBackdrop: React.FC<{ photos: string[]; show: boolean; preload: boolean; focus?: BackdropFocus }> = ({ photos, show, preload, focus }) => {
  const [primed, setPrimed] = React.useState(show || preload);
  React.useEffect(() => { if (show || preload) setPrimed(true); }, [show, preload]);
  if (!primed) return null;
  return (
    <>
      <div className="activity-backdrop" data-show={show} aria-hidden="true">
        {photos.map((src, i) => <span key={src} className="activity-backdrop-photo" data-slot={i} style={{ backgroundImage: `url(${src})` }} />)}
      </div>
      {focus && (
        <span className="activity-backdrop-photo activity-backdrop-focus" data-slot={focus.slot} data-show={show} aria-hidden="true"
          style={{ backgroundImage: `url(${photos[focus.slot]})`, '--focus-x': focus.x, '--focus-y': focus.y, '--focus-rx': focus.rx, '--focus-ry': focus.ry } as React.CSSProperties} />
      )}
    </>
  );
};

interface MosaicChapterProps {
  pillar: PillarState;
  index: number;
  activities: Activity[];
  live: boolean;
  stacked: boolean;
  openId: string | null;
  attendedId: string | null;
  onOpen: (activity: Activity) => void;
  onAttend: (activity: Activity | null) => void;
}

/** The same photographic emblem as the hero, surrounded by the actual programmes. */
export const MosaicChapter = React.memo(function MosaicChapter({
  pillar, index, activities, live, stacked, openId, attendedId, onOpen, onAttend,
}: MosaicChapterProps) {
  const id = pillar.id as MosaicPillar;
  const logo = PILLAR_LOGOS[id];
  const name = pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase();
  const leftCount = Math.max(1, Math.ceil(activities.length / 2));
  const rightCount = Math.max(1, Math.floor(activities.length / 2));
  const rows = leftCount * rightCount;
  const marked = activities.some(activity => activity.images.length > 0);

  return (
    <article className="mosaic-chapter activity-chapter" data-stage={id} data-current={live}
      data-busy={openId !== null}
      style={{ '--chapter-a': pillar.accentA, '--chapter-b': pillar.accentB, '--chapter-edge': logo.edge } as React.CSSProperties}
      aria-labelledby={`mosaic-${id}-title`}>
      {stacked && <MosaicWavesStatic pillar={pillar} />}
      {activities.filter(activity => ACTIVITY_BACKDROPS[activity.id]).map(activity => (
        <ActivityBackdrop key={activity.id} photos={ACTIVITY_BACKDROPS[activity.id]} show={activity.id === attendedId || activity.id === openId} preload={live} focus={BACKDROP_FOCUS[activity.id]} />
      ))}
      <PillarArtwork pillarId={id} />
      <header className="activity-chapter-heading" data-reveal>
        <div className="activity-chapter-identity">
          <span className="activity-chapter-number" aria-hidden="true">0{index + 1}</span>
          <h3 id={`mosaic-${id}-title`} tabIndex={-1}>
            <span className="sr-only">{name}</span><PillarWordmark pillar={id} />
          </h3>
          <p>{pillar.headline}</p>
        </div>
        <Link className="activity-chapter-explore" to={id === 'projects' ? '/projects' : `/core-values#${id}`}>
          {getCMSCopy('copy.ImpactMosaic.3b73900b8d29', 'Explore')} {name}<ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </header>

      <div className="activity-constellation" data-reveal style={{ '--activity-rows': rows } as React.CSSProperties}>
        <svg className="activity-connections" viewBox="0 0 1200 600" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <ellipse cx="600" cy="300" rx="265" ry="245" />
          <ellipse cx="600" cy="300" rx="295" ry="215" transform="rotate(-15 600 300)" />
          {activities.map((activity, i) => {
            const left = i % 2 === 0;
            const y = (Math.floor(i / 2) + .5) / (left ? leftCount : rightCount) * 600;
            const x = left ? 284 : 916;
            const endX = left ? 465 : 735;
            const endY = 300 + (y - 300) * .45;
            return <g key={activity.id} data-attended={activity.id === attendedId || activity.id === openId}>
              <path pathLength="1" d={`M${x} ${y}C${left ? 370 : 830} ${y} ${left ? 385 : 815} ${endY} ${endX} ${endY}`} />
              <circle cx={x} cy={y} r="3" /><circle cx={endX} cy={endY} r="2" />
            </g>;
          })}
        </svg>
        <div className="activity-emblem">
          <div className="activity-emblem-art"><PillarPhotoMosaic pillar={id} caption={false} /></div>
          <p className="activity-emblem-caption font-dancing-script">{logo.caption}</p>
        </div>
        <ul className="activity-nodes" aria-label={`${name} programmes`}>
          {activities.map((activity, i) => {
            const Symbol = ACTIVITY_SYMBOLS[activity.id] ?? HeartHandshake;
            const span = i % 2 ? leftCount : rightCount;
            return (
              <li key={activity.id} className="activity-node" data-side={i % 2 ? 'right' : 'left'}
                style={{ '--node-column': i % 2 ? 3 : 1, '--node-row': Math.floor(i / 2) * span + 1, '--node-span': span, '--node-order': i } as React.CSSProperties}>
                <button id={`mosaic-tile-${activity.id}`} className="activity-node-button" type="button"
                  aria-expanded={openId === activity.id} aria-controls={openId === activity.id ? 'mosaic-spotlight' : undefined}
                  onClick={() => onOpen(activity)} onPointerEnter={() => onAttend(activity)} onPointerLeave={() => onAttend(null)}
                  onFocus={() => onAttend(activity)} onBlur={() => onAttend(null)}>
                  <span className="activity-node-heading">
                    <span className="activity-node-symbol"><Symbol size={23} strokeWidth={1.5} aria-hidden="true" /></span>
                    <span className="activity-node-name">{activity.title}</span>
                    <ArrowUpRight className="activity-node-arrow" size={15} aria-hidden="true" />
                  </span>
                  <span className="activity-node-value" data-long={activity.headline.value.length > 10}>{activity.headline.value}</span>
                  <span className="activity-node-label">{activity.headline.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="activity-chapter-footer">
        <span><span className="activity-live-dot" aria-hidden="true" />{getCMSCopy('copy.MosaicChapter.discover', 'Every activity, a story. Select one to discover more.')}<ArrowUpRight size={13} aria-hidden="true" /></span>
        <small>{marked ? getCMSCopy('copy.ImpactMosaic.d51afc068025', 'Photography is illustrative unless marked.') : getCMSCopy('copy.ImpactMosaic.a216e016d42c', 'Photography is illustrative.')}</small>
      </footer>
    </article>
  );
});
