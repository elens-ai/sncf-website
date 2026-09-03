import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the recognition wall.
 *
 * A salon hang. The honours are photographs first, so the mount carries the
 * picture and the plate sits over its foot as a caption. Mounts are hung to
 * their true proportions and packed close: within each band a mount's
 * flex-grow IS its aspect ratio, so the band fills the width exactly with
 * nothing cropped to fit a box and no dead wall between pictures.
 *
 * The room is a wash that fades up from nothing at the section's top edge and
 * back to nothing at its foot (see .award-room), so this screen reads as its
 * own lit room without cutting the page-wide gradient that runs unbroken from
 * the hero to the footer.
 *
 * AWARDS is empty until the real honours are supplied, and nothing here
 * invents one. While it is empty the wall hangs the foundation's own
 * documented service photographs, and the curator's note among them says so.
 */

interface Mount {
  key: string;
  src: string;
  alt: string;
  /** Intrinsic aspect ratio — this is also the mount's flex-grow. */
  ar: number;
  focal?: string;
  title: string;
  tag: string;
  sub?: string;
  year?: string;
  /** Emblems and diagram art take a warm wash; photographs do not. */
  emblem?: boolean;
  award?: Award;
  photos?: AwardPhoto[];
}

/* The stand-in hang. Real, documented pictures from the foundation's own
   library — never a fabricated honour. Captions describe what each picture
   shows, which is all that can honestly be said of it here. */
const STANDIN: Mount[][] = [
  [
    {
      key: 'volunteers',
      src: '/images/volunteers-planning.webp',
      alt: 'Foundation volunteers gathered around a table planning a service drive',
      ar: 1.76,
      title: 'Volunteers planning a service drive',
      tag: 'Sewa',
      sub: 'Documented service',
      emblem: true,
    },
    {
      key: 'satguru',
      src: '/images/satguru-mata-sudiksha-ji.jpg',
      alt: 'Portrait of Satguru Mata Sudiksha Ji Maharaj',
      ar: 0.99,
      focal: '50% 32%',
      title: 'Satguru Mata Sudiksha Ji Maharaj',
      tag: 'Guiding force',
      sub: 'Sixth spiritual guide',
    },
    {
      key: 'planting',
      src: '/images/mataji-rajpita-planting.webp',
      alt: 'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling',
      ar: 0.46,
      focal: '50% 40%',
      title: 'Planting a sapling',
      tag: 'Oneness Vann',
    },
  ],
  [
    {
      key: 'rajpita',
      src: '/images/nirankari-rajpita-ramit-ji.jpg',
      alt: 'Portrait of Nirankari Rajpita Ramit Ji',
      ar: 0.73,
      focal: '50% 22%',
      title: 'Nirankari Rajpita Ramit Ji',
      tag: 'Guiding force',
    },
    {
      key: 'heal',
      src: '/images/vertical-heal.webp',
      alt: "Emblem for the foundation's Heal programme",
      ar: 1,
      title: 'Heal',
      tag: 'Pillar',
      sub: 'Health & blood donation',
      emblem: true,
    },
    {
      key: 'lotus',
      src: '/images/lotus-watermark.png',
      alt: "The foundation's lotus emblem, held in an open palm",
      ar: 1.78,
      focal: '50% 45%',
      title: 'The lotus, held in an open palm',
      tag: 'Emblem',
      sub: 'Service with humility',
      emblem: true,
    },
  ],
];

/** Fires once, then stops watching. */
const useRevealOnce = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    /* No IntersectionObserver means no reveal — but the wall must still be
       there, so show it outright rather than leaving it at opacity 0. */
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
};

/** Hangs the real honours three to a band, each to its photograph's shape. */
const bandsFromAwards = (awards: Award[]): Mount[][] => {
  const mounts: Mount[] = awards.map((award) => {
    const photo = award.photos?.[0];
    return {
      key: award.id,
      src: photo?.src ?? '',
      alt: photo?.alt ?? '',
      /* A mount with no photograph still needs a shape to be hung to; a
         gentle landscape sits it among the pictures without a hole. */
      ar: photo ? photo.width / photo.height : 1.45,
      focal: photo?.focal,
      title: award.title,
      tag: award.awardedBy,
      year: award.year,
      award,
      photos: award.photos,
    };
  });

  const bands: Mount[][] = [];
  for (let i = 0; i < mounts.length; i += 3) bands.push(mounts.slice(i, i + 3));
  return bands;
};

const MountTile: React.FC<{ mount: Mount; order: number; onOpen: (t: LightboxTarget) => void }> = ({
  mount,
  order,
  onOpen,
}) => (
  <figure
    className={`award-mount award-reveal${mount.emblem ? ' award-mount--emblem' : ''}`}
    style={{
      ['--ar' as string]: mount.ar,
      ['--i' as string]: order,
      ...(mount.focal ? { ['--focal' as string]: mount.focal } : {}),
    }}
  >
    {mount.src && (
      <img
        src={mount.src}
        alt={mount.alt}
        loading={order < 3 ? 'eager' : 'lazy'}
        decoding="async"
      />
    )}

    <figcaption className="award-plate">
      <p className="award-plate-title">{mount.title}</p>
      <p className="award-plate-meta">
        <span className="award-plate-tag">{mount.tag}</span>
        {mount.year && <span className="award-plate-year">{mount.year}</span>}
        {mount.sub && <span>{mount.sub}</span>}
      </p>
    </figcaption>

    {mount.award && mount.photos && mount.photos.length > 0 && (
      <button
        type="button"
        className="award-hit"
        onClick={() => onOpen({ award: mount.award!, photos: mount.photos!, index: 0 })}
        aria-label={`${mount.title} — open ${mount.photos.length} photograph${
          mount.photos.length === 1 ? '' : 's'
        }`}
      />
    )}
  </figure>
);

export const AwardsSection: React.FC = () => {
  const { ref, shown } = useRevealOnce<HTMLDivElement>();
  const [target, setTarget] = useState<LightboxTarget | null>(null);

  const hasAwards = AWARDS.length > 0;
  const bands = useMemo(() => (hasAwards ? bandsFromAwards(AWARDS) : STANDIN), [hasAwards]);

  let order = 1;

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-28 pb-16 overflow-hidden"
    >
      <div className="award-room" aria-hidden="true" />

      <div ref={ref} className={`relative z-10 w-full max-w-7xl mx-auto${shown ? ' is-in' : ''}`}>
        <header className="award-reveal" style={{ ['--i' as string]: 0 }}>
          <p className="award-eyebrow">Recognition</p>
          <h2 className="award-title">
            Awards &amp; <em>Recognitions</em>
          </h2>
          <p className="award-standfirst">
            Your appreciation makes us stronger to serve humanity. The honours the
            foundation has received are hung here as they are confirmed — each with
            the body that conferred it and the year it was given.
          </p>
          <hr className="award-rule" />
        </header>

        <div className="award-wall">
          {bands.map((band, b) => (
            <div className="award-band" key={b}>
              {b === 1 && !hasAwards && (
                <section
                  className="award-label award-reveal"
                  style={{ ['--i' as string]: order++ }}
                  aria-label="About this wall"
                >
                  <span className="award-label-kicker">Curator&rsquo;s note</span>
                  <span className="award-label-mark" />
                  <p>
                    The honours are being catalogued — each will be hung with the
                    body that conferred it and the year it was given. The mounts
                    presently hold the foundation&rsquo;s own service photographs.
                  </p>
                </section>
              )}
              {band.map((mount) => (
                <MountTile key={mount.key} mount={mount} order={order++} onOpen={setTarget} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <AwardLightbox
        target={target}
        onClose={() => setTarget(null)}
        onNavigate={(index) => setTarget((t) => (t ? { ...t, index } : t))}
      />
    </section>
  );
};
