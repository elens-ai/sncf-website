import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the hall of honour.
 *
 * This screen has to belong to the same journey as the orbit wheel, the
 * opening lotus and the pinned rooms above it, so the wall is not a flat grid
 * of pictures: it is hung in depth, it assembles as you arrive, and it answers
 * the pointer.
 *
 * THREE TRANSFORMS, THREE ELEMENTS. Parallax, entrance and hover each drive a
 * transform, and one element cannot carry three — an animation's transform
 * replaces a transition's outright. So .award-mount takes the pointer
 * parallax, .award-mount-inner takes the entrance, and .award-mount-art takes
 * the hover lift. Collapse them and whichever lands last silently wins.
 *
 * The room is a wash that fades to nothing at both edges (see .award-room), so
 * the screen reads as its own lit hall without cutting the page-wide gradient
 * that runs unbroken from the hero to the footer.
 *
 * AWARDS is empty until the real honours are supplied and nothing here invents
 * one; while it is empty the wall hangs the foundation's own documented
 * service photographs and the curator's note says exactly that.
 */

interface Mount {
  key: string;
  src: string;
  alt: string;
  /** Intrinsic aspect ratio — this is also the mount's flex-grow. */
  ar: number;
  /** Where this mount sits in the hall's depth, in px of translateZ. */
  z: number;
  focal?: string;
  title: string;
  tag: string;
  sub?: string;
  year?: string;
  emblem?: boolean;
  award?: Award;
  photos?: AwardPhoto[];
}

const STANDIN: Mount[][] = [
  [
    {
      key: 'volunteers',
      src: '/images/volunteers-planning.webp',
      alt: 'Foundation volunteers gathered around a table planning a service drive',
      ar: 1.76,
      z: 0,
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
      z: 38,
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
      z: -26,
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
      z: 22,
      focal: '50% 22%',
      title: 'Nirankari Rajpita Ramit Ji',
      tag: 'Guiding force',
    },
    {
      key: 'heal',
      src: '/images/vertical-heal.webp',
      alt: "Emblem for the foundation's Heal programme",
      ar: 1,
      z: -34,
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
      z: 14,
      focal: '50% 45%',
      title: 'The lotus, held in an open palm',
      tag: 'Emblem',
      sub: 'Service with humility',
      emblem: true,
    },
  ],
];

const useRevealOnce = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
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
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
};

/**
 * The hall leans toward the pointer. Two custom properties on the wall are all
 * it takes — they inherit, so every mount reads them and applies its own depth
 * against them without a listener of its own.
 *
 * Nothing is bound when the visitor asks for reduced motion: a wall that tilts
 * under the cursor is precisely what that setting is asking us not to do.
 */
const usePointerLean = (enabled: boolean) => {
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || !enabled) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;
      wall.style.setProperty('--px', pending.x.toFixed(3));
      wall.style.setProperty('--py', pending.y.toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      const r = wall.getBoundingClientRect();
      pending = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: ((e.clientY - r.top) / r.height) * 2 - 1,
      };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      pending = { x: 0, y: 0 };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    wall.addEventListener('pointermove', onMove);
    wall.addEventListener('pointerleave', onLeave);
    return () => {
      wall.removeEventListener('pointermove', onMove);
      wall.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return wallRef;
};

const bandsFromAwards = (awards: Award[]): Mount[][] => {
  const depths = [0, 34, -28, 20, -36, 12];
  const mounts: Mount[] = awards.map((award, i) => {
    const photo = award.photos?.[0];
    return {
      key: award.id,
      src: photo?.src ?? '',
      alt: photo?.alt ?? '',
      ar: photo ? photo.width / photo.height : 1.45,
      z: depths[i % depths.length],
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
    className={`award-mount${mount.emblem ? ' award-mount--emblem' : ''}`}
    style={{
      ['--ar' as string]: mount.ar,
      ['--i' as string]: order,
      ['--z' as string]: mount.z,
      ...(mount.focal ? { ['--focal' as string]: mount.focal } : {}),
    }}
  >
    <div className="award-mount-inner">
      <div className="award-mount-art">
        {mount.src && (
          <img
            src={mount.src}
            alt={mount.alt}
            loading={order < 3 ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
        <span className="award-gleam" aria-hidden="true" />

        <figcaption className="award-plate">
          <p className="award-plate-title">{mount.title}</p>
          <p className="award-plate-meta">
            <span className="award-plate-tag">{mount.tag}</span>
            {mount.year && <span className="award-plate-year">{mount.year}</span>}
            {mount.sub && <span>{mount.sub}</span>}
          </p>
        </figcaption>
      </div>
    </div>

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

/** The seal draws itself as the hall opens, the way the welcome signature does. */
const HonourSeal: React.FC = () => (
  <svg className="award-seal" viewBox="0 0 120 120" aria-hidden="true">
    <circle className="award-seal-ring" cx="60" cy="60" r="52" pathLength="1" />
    <circle className="award-seal-ring award-seal-ring--in" cx="60" cy="60" r="43" pathLength="1" />
    <path
      className="award-seal-mark"
      pathLength="1"
      d="M60 38c7 9 10 16 10 23a10 10 0 0 1-20 0c0-7 3-14 10-23Z
         M42 52c9 2 15 6 18 11-5 5-12 7-19 5s-11-8-11-14c3-1 7-2 12-2Z
         M78 52c-9 2-15 6-18 11 5 5 12 7 19 5s11-8 11-14c-3-1-7-2-12-2Z"
    />
  </svg>
);

export const AwardsSection: React.FC = () => {
  const { ref, shown } = useRevealOnce<HTMLDivElement>();
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const wallRef = usePointerLean(shown && !calm);

  const hasAwards = AWARDS.length > 0;
  const bands = useMemo(() => (hasAwards ? bandsFromAwards(AWARDS) : STANDIN), [hasAwards]);

  const setLightbox = useCallback((t: LightboxTarget) => setTarget(t), []);

  let order = 1;

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-28 pb-16 overflow-hidden"
    >
      <div className="award-room" aria-hidden="true" />

      <div ref={ref} className={`relative z-10 w-full max-w-7xl mx-auto${shown ? ' is-in' : ''}`}>
        <header className="award-head">
          <HonourSeal />
          <div className="award-head-text">
            <p className="award-eyebrow">Recognition</p>
            <h2 className="award-title">
              Awards &amp; <em>Recognitions</em>
            </h2>
            <p className="award-standfirst">
              Your appreciation makes us stronger to serve humanity. The honours the
              foundation has received are hung here as they are confirmed — each with
              the body that conferred it and the year it was given.
            </p>
          </div>
        </header>
        <hr className="award-rule" />

        <div className="award-wall" ref={wallRef}>
          <span className="award-sweep" aria-hidden="true" />

          {bands.map((band, b) => (
            <div className="award-band" key={b}>
              {b === 1 && !hasAwards && (
                <section
                  className="award-label"
                  style={{ ['--i' as string]: order++, ['--z' as string]: 8 }}
                  aria-label="About this wall"
                >
                  <div className="award-mount-inner">
                    <span className="award-label-kicker">Curator&rsquo;s note</span>
                    <span className="award-label-mark" />
                    <p>
                      The honours are being catalogued — each will be hung with the
                      body that conferred it and the year it was given. The mounts
                      presently hold the foundation&rsquo;s own service photographs.
                    </p>
                  </div>
                </section>
              )}
              {band.map((mount) => (
                <MountTile key={mount.key} mount={mount} order={order++} onOpen={setLightbox} />
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
