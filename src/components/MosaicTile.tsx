import { getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import type { Activity } from '../data/activities';
import { activityGallery, type ActivityImage } from '../data/activityImagery';

/**
 * ONE PROGRAMME ON THE ALBUM PAGE — a photograph first.
 *
 * The first programme of a chapter is the page's lead: its photograph is
 * washed onto the page, the edges feathered and torn like a watercolour
 * bleed (the `mosaic-wash` filter in MosaicFoliage), with its name written
 * in the corner. Every other programme is a print laid over it: a white
 * border, a shadow, a hand-written caption in the margin with the report's
 * one headline figure beneath it, each sitting at its own slight angle.
 * Each is a real button: it lifts on hover, drifts a little with the scroll
 * (the chapter's --p, see ImpactMosaic), and opening it raises the
 * programme's spotlight over the album rather than navigating anywhere.
 */
interface MosaicTileProps {
  activity: Activity;
  image: ActivityImage | null;
  index: number;
  open: boolean;
  onOpen: (activity: Activity) => void;
  /** Hover or focus: the waves take the programme's mood while it lasts. */
  onAttend: (activity: Activity | null) => void;
}

/** Where each print lies on the page — the first is the washed lead. */
const SLOTS = ['lead', 'a', 'b', 'c', 'd'];

export const MosaicTile: React.FC<MosaicTileProps> = ({ activity, image, index, open, onOpen, onAttend }) => {
  const lead = index === 0;
  const picture = image
    ? <img src={resolveCMSMedia(image.src)} alt={image.alt} loading="lazy" decoding="async" />
    : <span className="mosaic-tile-awaiting">{getCMSCopy("copy.MosaicTile.6e941a57fcb6", "Photograph to follow")}</span>;
  return (
    <li className={lead ? 'mosaic-print mosaic-print-lead' : 'mosaic-print'} data-slot={SLOTS[index] ?? 'd'} style={{ '--i': index } as React.CSSProperties}>
      <button
        type="button"
        id={`mosaic-tile-${activity.id}`}
        className="mosaic-print-face"
        aria-expanded={open}
        aria-controls="mosaic-spotlight"
        onClick={() => onOpen(activity)}
        onPointerEnter={() => onAttend(activity)}
        onPointerLeave={() => onAttend(null)}
        onFocus={() => onAttend(activity)}
        onBlur={() => onAttend(null)}
      >
        {lead ? (
          <span className="mosaic-wash">
            <span className="mosaic-wash-halo" aria-hidden="true" />
            <span className="mosaic-wash-mask">{picture}</span>
          </span>
        ) : (
          <span className="mosaic-print-photo">{picture}</span>
        )}
        <span className="mosaic-print-caption">
          <span className="mosaic-print-title">{activity.title}</span>
          <span className="mosaic-print-figure">{`${activity.headline.value} ${activity.headline.label}`}</span>
          {image && !image.illustrative && <span className="mosaic-print-mark">{getCMSCopy("copy.MosaicTile.5e18f08027f3", "Foundation photograph")}</span>}
        </span>
      </button>
    </li>
  );
};

/**
 * THE SPOTLIGHT — what a programme opens onto.
 *
 * Photographs before figures: a large picture with its caption, the rest of
 * the programme's photographs as thumbnails to browse (its own first, then
 * the pillar's illustrative set, each labelled for what it is), and beside
 * them the programme in words — what it is, when the figures are from, the
 * headline figure and a few more as quiet chips, and the deep link.
 *
 * It is a region over the collage, not a modal: an aria-modal dialog would
 * make usePageMotion pause every animation under the section, this one
 * included. The close button takes focus on open; Escape, the backdrop and
 * the button close it, and ImpactMosaic hands focus back to the tile.
 */
interface MosaicSpotlightProps {
  activity: Activity;
  pillarName: string;
  href: string;
  onClose: () => void;
}

export const MosaicSpotlight: React.FC<MosaicSpotlightProps> = ({ activity, pillarName, href, onClose }) => {
  const gallery = activityGallery(activity);
  const [shown, setShown] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const picture = gallery[shown] ?? gallery[0];
  const more = activity.dataPoints.filter(point => point.label !== activity.headline.label).slice(0, 3);
  return (
    <div
      id="mosaic-spotlight"
      className="mosaic-spotlight"
      role="region"
      aria-label={activity.title}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="mosaic-spot-card">
        <div className="mosaic-spot-gallery">
          {picture && (
            <figure className="mosaic-spot-main" key={picture.src}>
              <img src={resolveCMSMedia(picture.src)} alt={picture.alt} decoding="async" />
              <span className="mosaic-spot-mark">{picture.illustrative ? getCMSCopy("copy.MosaicTile.f6bd5e33b6e7", "Illustrative photograph") : getCMSCopy("copy.MosaicTile.5e18f08027f3", "Foundation photograph")}</span>
              {picture.caption && <figcaption>{picture.caption}</figcaption>}
            </figure>
          )}
          {gallery.length > 1 && (
            <ul className="mosaic-spot-thumbs" aria-label={`${activity.title} photographs`}>
              {gallery.map((image, i) => (
                <li key={image.src}>
                  <button type="button" onClick={() => setShown(i)} aria-pressed={i === shown} aria-label={image.alt}>
                    <img src={resolveCMSMedia(image.src)} alt="" loading="lazy" decoding="async" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mosaic-spot-info">
          <p className="mosaic-spot-kicker">{`${pillarName} · ${activity.period}`}</p>
          <h4 className="mosaic-spot-title">{activity.title}</h4>
          <p className="mosaic-spot-blurb">{activity.blurb}</p>
          <p className="mosaic-spot-figure"><strong>{activity.headline.value}</strong><span>{activity.headline.label}</span></p>
          {more.length > 0 && (
            <ul className="mosaic-spot-figures">
              {more.map(point => <li key={point.label}><strong>{point.value}</strong><span>{point.label}</span></li>)}
            </ul>
          )}
          <Link className="mosaic-explore" to={href}>{getCMSCopy("copy.MosaicTile.3b73900b8d29", "Explore")} {activity.title} <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
        <button ref={closeRef} type="button" className="mosaic-spot-close" onClick={onClose} aria-label={`Close ${activity.title}`}><X size={16} aria-hidden="true" /></button>
      </div>
    </div>
  );
};
