import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions.
 *
 * PHOTOGRAPHS ARE THE PAGE. The honours exist as pictures — ceremonies,
 * citations being handed over, trophies — so the wall carries the pictures and
 * nothing else. No caption sits on a photograph: press one and the detail
 * opens. A wall of images each wearing a label is a list with pictures on it,
 * which is not what this section is.
 *
 * The hall is dark and a warm pool of light follows the pointer across it, so
 * the wall is lit from wherever the visitor is looking. That is one CSS
 * radial driven by two custom properties — no canvas, no per-tile listener.
 *
 * Bands are justified: a tile's flex-grow IS its aspect ratio, so each band
 * fills the width exactly and no photograph is cropped to fit a cell.
 *
 * AWARDS is empty until the real honours are supplied and NOTHING HERE INVENTS
 * ONE. While it is empty the wall hangs the foundation's own documented
 * pictures and the note beneath says exactly that.
 */

interface Tile {
  key: string;
  src: string;
  alt: string;
  ar: number;
  focal?: string;
  /** Shown only once the tile is pressed. */
  award: Award;
  photos: AwardPhoto[];
  /** True while these are stand-ins rather than confirmed honours. */
  placeholder?: boolean;
  /** Emblems and diagram art need a warm wash; photographs do not. */
  emblem?: boolean;
}

const standIn = (
  key: string,
  src: string,
  alt: string,
  ar: number,
  title: string,
  awardedBy: string,
  note: string,
  extra?: { focal?: string; emblem?: boolean },
): Tile => {
  const photo: AwardPhoto = { src, alt, width: 1600, height: Math.round(1600 / ar), ...extra };
  return {
    key,
    src,
    alt,
    ar,
    focal: extra?.focal,
    emblem: extra?.emblem,
    placeholder: true,
    photos: [photo],
    award: { id: key, title, awardedBy, year: '', note },
  };
};

/* The foundation's own documented pictures, standing in until the honours are
   supplied. Every line here describes something real; none of it claims an
   award, a conferring body or a year. */
const STANDIN: Tile[] = [
  standIn(
    'volunteers',
    '/images/volunteers-planning.webp',
    'Foundation volunteers gathered around a table planning a service drive',
    1.76,
    'Volunteers planning a service drive',
    'Documented service',
    'A picture from the foundation’s own library, standing in until the honours are catalogued.',
    { emblem: true },
  ),
  standIn(
    'satguru',
    '/images/satguru-mata-sudiksha-ji.jpg',
    'Portrait of Satguru Mata Sudiksha Ji Maharaj',
    0.99,
    'Satguru Mata Sudiksha Ji Maharaj',
    'Sixth spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.',
    { focal: '50% 30%' },
  ),
  standIn(
    'planting',
    '/images/mataji-rajpita-planting.webp',
    'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling',
    0.46,
    'Planting a sapling',
    'Oneness Vann',
    'Native saplings planted and tended until they grow into community forests.',
    { focal: '50% 38%' },
  ),
  standIn(
    'rajpita',
    '/images/nirankari-rajpita-ramit-ji.jpg',
    'Portrait of Nirankari Rajpita Ramit Ji',
    0.73,
    'Nirankari Rajpita Ramit Ji',
    'Spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.',
    { focal: '50% 20%' },
  ),
  standIn(
    'heal',
    '/images/vertical-heal.webp',
    'Emblem for the foundation’s Heal programme',
    1,
    'Heal',
    'Health and blood donation',
    'Blood donation drives, eye-care camps and free health checkups.',
    { emblem: true },
  ),
  standIn(
    'lotus',
    '/images/lotus-watermark.png',
    'The foundation’s lotus emblem, held in an open palm',
    1.78,
    'The lotus, held in an open palm',
    'Service with humility',
    'The foundation’s emblem.',
    { focal: '50% 45%', emblem: true },
  ),
];

const tilesFromAwards = (awards: Award[]): Tile[] =>
  awards
    .map((award): Tile | null => {
      const photo = award.photos?.[0];
      if (!photo) return null;
      return {
        key: award.id,
        src: photo.src,
        alt: photo.alt,
        ar: photo.width / photo.height,
        focal: photo.focal,
        award,
        photos: award.photos ?? [],
      };
    })
    .filter((t): t is Tile => t !== null);

/** Packs tiles into bands whose aspect ratios sum to roughly one screen-width. */
const intoBands = (tiles: Tile[], targetPerBand = 3.4): Tile[][] => {
  const bands: Tile[][] = [];
  let band: Tile[] = [];
  let sum = 0;

  tiles.forEach((tile) => {
    band.push(tile);
    sum += tile.ar;
    if (sum >= targetPerBand) {
      bands.push(band);
      band = [];
      sum = 0;
    }
  });
  if (band.length) bands.push(band);
  return bands;
};

export const AwardsSection: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [calm, setCalm] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);

  const hasAwards = AWARDS.length > 0;
  const tiles = useMemo(() => (hasAwards ? tilesFromAwards(AWARDS) : STANDIN), [hasAwards]);
  const bands = useMemo(() => intoBands(tiles), [tiles]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* The lamp the visitor carries. Two properties on the wall, read by one
     radial gradient — nothing per tile. Not bound under reduced motion. */
  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || calm) return;

    let frame = 0;
    let next: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!next) return;
      wall.style.setProperty('--mx', `${next.x}%`);
      wall.style.setProperty('--my', `${next.y}%`);
    };

    const onMove = (e: PointerEvent) => {
      const r = wall.getBoundingClientRect();
      next = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    wall.addEventListener('pointermove', onMove);
    return () => {
      wall.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [calm]);

  const open = useCallback((tile: Tile) => {
    setTarget({ award: tile.award, photos: tile.photos, index: 0 });
  }, []);

  let order = 0;

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-28 pb-16 overflow-hidden"
    >
      <div className="award-room" aria-hidden="true" />

      <div ref={rootRef} className={`award-hall${shown ? ' is-in' : ''}`}>
        <header className="award-head">
          <div>
            <p className="award-eyebrow">Recognition</p>
            <h2 className="award-title">
              Awards &amp; <em>Recognitions</em>
            </h2>
          </div>
          <p className="award-standfirst">
            Your appreciation makes us stronger to serve humanity.
            <span className="award-count">
              {hasAwards
                ? `${AWARDS.length} ${AWARDS.length === 1 ? 'honour' : 'honours'} · press any picture`
                : 'Press any picture'}
            </span>
          </p>
        </header>

        <div className="award-wall" ref={wallRef}>
          <span className="award-lamp" aria-hidden="true" />

          {bands.map((band, b) => (
            <div className="award-band" key={b}>
              {band.map((tile) => {
                const i = order++;
                return (
                  <button
                    key={tile.key}
                    type="button"
                    className={`award-tile${tile.emblem ? ' award-tile--emblem' : ''}`}
                    style={{
                      ['--ar' as string]: tile.ar,
                      ['--i' as string]: i,
                      ...(tile.focal ? { ['--focal' as string]: tile.focal } : {}),
                    }}
                    onClick={() => open(tile)}
                    aria-label={`${tile.award.title} — open details`}
                  >
                    <img
                      src={tile.src}
                      alt={tile.alt}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                    {/* The only thing a picture wears: a hairline that draws in
                        under it as it is looked at. Everything else waits for
                        the press. */}
                    <span className="award-underline" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {!hasAwards && (
          <p className="award-note">
            The honours are still being catalogued — each will be hung here with
            the body that conferred it and the year it was given. These are the
            foundation&rsquo;s own pictures, standing in until then.
          </p>
        )}
      </div>

      <AwardLightbox
        target={target}
        onClose={() => setTarget(null)}
        onNavigate={(index) => setTarget((t) => (t ? { ...t, index } : t))}
      />
    </section>
  );
};
