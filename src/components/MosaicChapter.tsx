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
