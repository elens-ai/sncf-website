import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import type { Activity } from '../data/activities';
import { ACTIVITY_SYMBOLS } from './activitySymbols';
import { resolveCMSMedia } from '../cms/media';
import type { PillarState } from '../types';
import { PillarArtwork } from './PillarArtwork';
import { PillarPhotoMosaic } from './PillarPhotoMosaic';
import { HeroPillarWordmark } from './PillarWordmark';
import { HeroHealWordmark } from './HealWordmark';
import { MosaicWavesStatic } from './MosaicWaves';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';
import './mosaic-chapter.css';

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
  /** In place of the photographic emblem (Core Values gives Enrich its scrapbook). */
  emblem?: React.ReactNode;
  /** On the cornerstone's own page (Core Values): Explore leads down to its
      story and Reports, Gallery and Stats to its tabs there, and a programme
      opens in its report rather than in a spotlight. */
  inPage?: boolean;
  /** The name's heading level: h2 where the chapter is a section of its page. */
  heading?: 'h2' | 'h3';
}

/** The same photographic emblem as the hero, surrounded by the actual programmes. */
export const MosaicChapter = React.memo(function MosaicChapter({
  pillar, index, activities, live, stacked, openId, attendedId, onOpen, onAttend, emblem, inPage = false, heading: Name = 'h3',
}: MosaicChapterProps) {
  const id = pillar.id as MosaicPillar;
  const logo = PILLAR_LOGOS[id];
  const name = pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase();
  const leftCount = Math.max(1, Math.ceil(activities.length / 2));
  const rightCount = Math.max(1, Math.floor(activities.length / 2));
  const rows = leftCount * rightCount;

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
          <Name id={`mosaic-${id}-title`} tabIndex={-1}>
            <span className="sr-only">{name}</span>{id === 'heal' ? <HeroHealWordmark /> : <HeroPillarWordmark pillar={id} />}
          </Name>
          <p>{pillar.headline}</p>
        </div>
        <div className="activity-chapter-actions">
          {inPage ? (
            <a className="activity-chapter-explore" href={`#${id}-story`}>
              {getCMSCopy('copy.ImpactMosaic.3b73900b8d29', 'Explore')} {name}<ArrowUpRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <Link className="activity-chapter-explore" to={id === 'projects' ? '/projects' : `/core-values#${id}`}>
              {getCMSCopy('copy.ImpactMosaic.3b73900b8d29', 'Explore')} {name}<ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
          {/* straight into the cornerstone's report, gallery or stats: its tabs on Core Values (on that page, just below) */}
          {id !== 'projects' && (
            <nav className="activity-chapter-quick" aria-label={`${name}: ${getCMSCopy('copy.ImpactMosaic.quick-label', 'reports, gallery and stats')}`}>
              {([['reports', getCMSCopy('copy.ImpactMosaic.quick-reports', 'Reports')], ['gallery', getCMSCopy('copy.ImpactMosaic.quick-gallery', 'Gallery')], ['stats', getCMSCopy('copy.ImpactMosaic.quick-stats', 'Stats')]] as const).map(([tab, label]) => inPage
                ? <a key={tab} href={`#${id}-${tab}`}>{label}</a>
                : <Link key={tab} to={`/core-values#${id}-${tab}`}>{label}</Link>)}
            </nav>
          )}
        </div>
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
          <div className="activity-emblem-art">{emblem ?? <PillarPhotoMosaic pillar={id} caption={false} />}</div>
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
                  aria-expanded={inPage ? undefined : openId === activity.id} aria-controls={!inPage && openId === activity.id ? 'mosaic-spotlight' : undefined}
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

    </article>
  );
});
