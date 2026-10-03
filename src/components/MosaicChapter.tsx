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
import type { ActivityIcon } from '../data/activityIcons';
import { resolveCMSMedia } from '../cms/media';
import type { PillarState } from '../types';
import { PillarArtwork } from './PillarArtwork';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import { PillarWordmark } from './PillarWordmark';
import { MosaicWavesStatic } from './MosaicWaves';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import './mosaic-chapter.css';

const ACTIVITY_SYMBOLS: Record<ActivityIcon, LucideIcon> = {
  droplets: Droplets, droplet: Droplet, stethoscope: Stethoscope, eye: Eye, hospital: Hospital,
  'graduation-cap': GraduationCap, award: Award, 'book-open': BookOpen, laptop: Laptop, scissors: Scissors,
  trees: Trees, sparkles: Sparkles, 'package-check': PackageCheck, heart: Heart, 'hand-coins': HandCoins,
  waves: Waves, sprout: Sprout, mountain: Mountain, house: House, 'heart-handshake': HeartHandshake,
};

type BackdropFocus = NonNullable<Activity['hoverFocus']>;

/** Always-on photo collage drifting faintly behind a chapter's constellation:
    separate photographs, feathered into one another at slight angles, so the
    wash reads as one soft collage with no gutters between pictures. Positions
    and sizes are percentages of the chapter. */
interface AmbientTile { src: string; x: number; y: number; w: number; h: number; rot: number }
const AMBIENT_COLLAGES: Partial<Record<MosaicPillar, AmbientTile[]>> = {
  heal: [
    { src: '/images/programmes/health-checkup-snhc-team.jpg', x: -6, y: -6, w: 44, h: 46, rot: -3 },
    { src: '/images/programmes/eye-checkup-examination.jpg', x: 30, y: -8, w: 40, h: 42, rot: 2 },
    { src: '/images/programmes/blood-bank-processing.jpg', x: 62, y: -4, w: 44, h: 46, rot: -2 },
    { src: '/images/programmes/blood-donation.jpg', x: -8, y: 36, w: 40, h: 44, rot: 2.5 },
    { src: '/images/programmes/health-checkup-blood-pressure.jpg', x: 28, y: 30, w: 46, h: 42, rot: -1.5 },
    { src: '/images/programmes/eye-checkup-vision-test.jpg', x: 66, y: 38, w: 40, h: 42, rot: 3 },
    { src: '/images/programmes/health-centre-team.jpg', x: 10, y: 64, w: 44, h: 42, rot: -2 },
    { src: '/images/programmes/health-checkup-camp.jpg', x: 52, y: 66, w: 46, h: 40, rot: 1.5 },
  ],
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
        {photos.map((src, i) => <span key={`${i}-${src}`} className="activity-backdrop-photo" data-slot={i} style={{ backgroundImage: `url(${resolveCMSMedia(src)})` }} />)}
      </div>
      {focus && (
        <span className="activity-backdrop-photo activity-backdrop-focus" data-slot={focus.photo - 1} data-show={show} aria-hidden="true"
          style={{ backgroundImage: `url(${resolveCMSMedia(photos[focus.photo - 1])})`, '--focus-x': `${focus.x}%`, '--focus-y': `${focus.y}%`, '--focus-rx': `${focus.width}%`, '--focus-ry': `${focus.height}%` } as React.CSSProperties} />
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
  /* How many programmes show their own photograph; the rest borrow one of the
     pillar's, marked illustrative on the tile. */
  const own = activities.filter(activity => activity.images.length > 0).length;

  return (
    <article className="mosaic-chapter activity-chapter" data-stage={id} data-current={live}
      data-busy={openId !== null} data-attending={attendedId !== null}
      style={{ '--chapter-a': pillar.accentA, '--chapter-b': pillar.accentB, '--chapter-edge': logo.edge } as React.CSSProperties}
      aria-labelledby={`mosaic-${id}-title`}>
      {AMBIENT_COLLAGES[id] && (
        <div className="activity-ambient" data-current={live} aria-hidden="true">
          {AMBIENT_COLLAGES[id]!.map((tile, i) => (
            <span key={tile.src} className="activity-ambient-tile"
              style={{ backgroundImage: `url(${resolveCMSMedia(tile.src)})`, left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%`, height: `${tile.h}%`, '--tile-rot': `${tile.rot}deg`, animationDelay: `${-i * 4.5}s` } as React.CSSProperties} />
          ))}
        </div>
      )}
      {stacked && <MosaicWavesStatic pillar={pillar} />}
      {activities.filter(activity => activity.hoverPhotos?.length).map(activity => (
        <ActivityBackdrop key={activity.id} photos={activity.hoverPhotos!.map(photo => photo.src)} show={activity.id === attendedId || activity.id === openId} preload={live} focus={activity.hoverFocus} />
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
          <p className="activity-emblem-caption font-dancing-script">{pillar.emblemCaption ?? logo.caption}</p>
        </div>
        <ul className="activity-nodes" aria-label={`${name} programmes`}>
          {activities.map((activity, i) => {
            const Symbol = (activity.icon && ACTIVITY_SYMBOLS[activity.icon]) || HeartHandshake;
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
        <small>{own === activities.length ? getCMSCopy('copy.MosaicChapter.ownPhotos', 'Photographs from the foundation’s own work.') : own > 0 ? getCMSCopy('copy.MosaicChapter.mostlyOwnPhotos', 'Photographs from the foundation’s work; a tile marked illustrative shows another programme.') : getCMSCopy('copy.ImpactMosaic.a216e016d42c', 'Photography is illustrative.')}</small>
      </footer>
    </article>
  );
});
