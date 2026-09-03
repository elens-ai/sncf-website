import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the turning ring.
 *
 * The honours are set around a cylinder that turns continuously. Each picture
 * sits at its own angle on the ring, so the ones at the centre face the reader
 * squarely and the ones toward the edges angle away — the band bows, and the
 * whole thing reads as a solid object rotating rather than a strip sliding.
 *
 * It is the hero's orbit wheel by another name, which is the point: this screen
 * should belong to the same journey.
 *
 * THE RADIUS IS MEASURED, NOT GUESSED. For pictures of width w placed every
 * `step` degrees, the ring's radius is (w / 2) / tan(step / 2) — that is the
 * only radius at which neighbours meet edge to edge. Hard-code it and the
 * pictures either overlap or leave gaps at every viewport width.
 *
 * SPEED IS PER PICTURE, NOT PER TURN. The rotation's duration is the number of
 * pictures times a constant, so four honours and forty turn at the same pace.
 * A fixed duration would make a long list a blur and a short one a crawl.
 *
 * AWARDS is empty until the real honours are supplied and NOTHING HERE INVENTS
 * ONE; while it is empty the ring carries the foundation's own pictures.
 */

interface Slide {
  key: string;
  src: string;
  alt: string;
  focal?: string;
  award: Award;
  photos: AwardPhoto[];
  emblem?: boolean;
}

const standIn = (
  key: string, src: string, alt: string,
  title: string, awardedBy: string, note: string,
  extra?: { focal?: string; emblem?: boolean },
): Slide => ({
  key, src, alt,
  focal: extra?.focal,
  emblem: extra?.emblem,
  photos: [{ src, alt, width: 1200, height: 1500, focal: extra?.focal }],
  award: { id: key, title, awardedBy, year: '', note },
});

const STANDIN: Slide[] = [
  standIn('satguru', '/images/satguru-mata-sudiksha-ji.jpg',
    'Portrait of Satguru Mata Sudiksha Ji Maharaj',
    'Satguru Mata Sudiksha Ji Maharaj', 'Sixth spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', { focal: '50% 24%' }),
  standIn('planting', '/images/mataji-rajpita-planting.webp',
    'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling',
    'Planting a sapling', 'Oneness Vann',
    'Native saplings planted and tended until they grow into community forests.',
    { focal: '50% 34%' }),
  standIn('rajpita', '/images/nirankari-rajpita-ramit-ji.jpg',
    'Portrait of Nirankari Rajpita Ramit Ji',
    'Nirankari Rajpita Ramit Ji', 'Spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', { focal: '50% 14%' }),
  standIn('volunteers', '/images/volunteers-planning.webp',
    'Foundation volunteers planning a service drive',
    'Volunteers planning a service drive', 'Documented service',
    'From the foundation’s own library, standing in until the honours are catalogued.',
    { focal: '50% 45%', emblem: true }),
  standIn('heal', '/images/vertical-heal.webp', 'Emblem for the Heal programme',
    'Heal', 'Health and blood donation',
    'Blood donation drives, eye-care camps and free health checkups.', { emblem: true }),
  standIn('enrich', '/images/vertical-enrich.webp', 'Emblem for the Enrich programme',
    'Enrich', 'Education and skills', 'Schools, scholarships and skill development.',
    { emblem: true }),
  standIn('empower', '/images/vertical-empower.webp', 'Emblem for the Empower programme',
    'Empower', 'Youth and environment',
    'Youth empowerment, plantation drives and disaster relief.', { emblem: true }),
];

/** Fewest pictures the ring may carry. Too few and the step between them is
    wide, only three or four face the reader, and the band reads as a fan
    rather than the shallow bow of a cylinder seen edge-on. */
const MIN_ON_RING = 24;
/** Seconds of rotation contributed by each picture. */
const SECONDS_EACH = 3.6;

export const AwardsSection: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [calm, setCalm] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);

  const hasAwards = AWARDS.length > 0;

  const source: Slide[] = useMemo(() => {
    if (!hasAwards) return STANDIN;
    return AWARDS.filter((a) => a.photos?.length).map((a) => {
      const p = a.photos![0];
      return {
        key: a.id, src: p.src, alt: p.alt, focal: p.focal,
        award: a, photos: a.photos!,
      };
    });
  }, [hasAwards]);

  /* A ring needs enough pictures to close; a short list repeats until it does,
     the way a marquee repeats its sequence. Duplicates carry the same honour,
     so pressing one opens the same citation. */
  const slides = useMemo(() => {
    if (source.length === 0) return [];
    const out: (Slide & { ringKey: string })[] = [];
    const laps = Math.max(1, Math.ceil(MIN_ON_RING / source.length));
    for (let lap = 0; lap < laps; lap++) {
      source.forEach((s) => out.push({ ...s, ringKey: `${s.key}-${lap}` }));
    }
    return out;
  }, [source]);

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
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* The measured radius. Pictures are laid every `step` degrees around the
     ring, so they only meet edge to edge at r = (w / 2) / tan(step / 2). */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || slides.length === 0) return;

    const measure = () => {
      const card = stage.querySelector<HTMLElement>('.award-slide');
      if (!card) return;
      /* offsetWidth, NOT getBoundingClientRect(). The rect is the box AFTER
         transform, and the transform is derived from this measurement — so
         reading the rect feeds the radius back into itself and the ring blows
         up to thousands of pixels. offsetWidth is the layout width and ignores
         transforms entirely. */
      const w = card.offsetWidth;
      const step = 360 / slides.length;
      /* Solving for w alone seats the pictures edge to edge. Solving for
         w + GAP opens an even gap between every neighbour, all the way round,
         at any viewport width. */
      const GAP = 16;
      const r = (w + GAP) / 2 / Math.tan((step * Math.PI) / 360);
      stage.style.setProperty('--step', `${step}`);
      stage.style.setProperty('--r', `${r}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [slides.length]);

  const open = useCallback((s: Slide) => {
    setTarget({ award: s.award, photos: s.photos, index: 0 });
  }, []);

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-16"
    >
      <div className="award-room" aria-hidden="true" />

      <div ref={rootRef} className={`award-hall${shown ? ' is-in' : ''}`}>
        <header className="award-head">
          <p className="award-eyebrow">Recognition</p>
          <h2 className="award-title">
            Awards &amp; <em>Recognitions</em>
          </h2>
          <p className="award-standfirst">
            Your appreciation makes us stronger to serve humanity.
          </p>
        </header>

        {/* THE RING. The stage holds the perspective; the ring turns inside it;
            each picture sits at its own angle on the ring's surface. */}
        <div className="award-stage" ref={stageRef}>
          {/* Two elements, two transforms. The outer one pushes the ring back by
              its own radius so the pictures at the front land at z = 0 and
              render at their true size; the inner one turns. Put both on one
              element and the animation's transform replaces the push, the
              front of the ring sits a radius from the camera, and perspective
              blows every front picture up by more than twice. */}
          <div className="award-ring-push">
            <div
              className="award-ring"
              style={{ ['--spin' as string]: `${(slides.length * SECONDS_EACH).toFixed(1)}s` }}
            >
              {slides.map((s, i) => (
                <button
                key={s.ringKey}
                type="button"
                className={`award-slide${s.emblem ? ' award-slide--emblem' : ''}`}
                style={{ ['--i' as string]: i }}
                onClick={() => open(s)}
                aria-label={`${s.award.title} — ${s.award.awardedBy}. Press to read.`}
              >
                <img src={s.src} alt={s.alt} loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
              </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="award-foot">
          <p className="award-standfirst award-standfirst--wide">
            {hasAwards
              ? 'Press any picture to read its citation, the body that conferred it and the year it was given.'
              : 'The honours are still being catalogued — each will take its place here with the body that conferred it and the year it was given. These are the foundation’s own pictures, standing in until then.'}
          </p>
        </footer>
      </div>

      <AwardLightbox
        target={target}
        onClose={() => setTarget(null)}
        onNavigate={(index) => setTarget((t) => (t ? { ...t, index } : t))}
      />
    </section>
  );
};
