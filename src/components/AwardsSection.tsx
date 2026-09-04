import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AWARDS, Award, AwardPhoto } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the stage.
 *
 * One honour stands at the centre, large. Its neighbours wait small and
 * blurred to either side, one more sits further back, and everything else is
 * held offstage. Stepping the carousel rotates those roles and the whole
 * screen — position, scale, blur, opacity and the ground colour — crossfades
 * together over 650ms.
 *
 * ROLES ARE DERIVED, NOT STORED. Only activeIndex is state; centre, left,
 * right and back are computed from it each render. Storing four indices means
 * four things to keep in step, and they drift the first time a step is
 * interrupted.
 *
 * THE SCREEN PAINTS NO GROUND OF ITS OWN. It shows the page-wide
 * .accent-canvas, exactly as every other screen does, so the gradient runs
 * unbroken from the hero to the footer. An earlier cut turned a colour with
 * the carousel; it made this one screen the only one on the page wearing a
 * colour of its own.
 *
 * The figurine layout this follows assumes cut-out subjects on transparent
 * grounds, standing on the floor. Award photographs are rectangular, so they
 * stand as framed cards instead — same choreography, an honest frame.
 *
 * AWARDS is empty until the real honours are supplied and NOTHING HERE INVENTS
 * ONE; while it is empty the stage carries the foundation's own pictures.
 */

type Role = 'center' | 'left' | 'right' | 'back' | 'off';

interface Item {
  key: string;
  src: string;
  alt: string;
  focal?: string;
  /** The word set huge behind the stage — a year where there is one. */
  ghost: string;
  award: Award;
  photos: AwardPhoto[];
}

const standIn = (
  key: string, src: string, alt: string, ghost: string,
  title: string, awardedBy: string, note: string, focal?: string,
): Item => ({
  key, src, alt, ghost, focal,
  photos: [{ src, alt, width: 1200, height: 1500, focal }],
  award: { id: key, title, awardedBy, year: '', note },
});

const STANDIN = [
  standIn('satguru', '/images/satguru-mata-sudiksha-ji.jpg',
    'Portrait of Satguru Mata Sudiksha Ji Maharaj', 'Guiding',
    'Satguru Mata Sudiksha Ji Maharaj', 'Sixth spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', '50% 24%'),
  standIn('planting', '/images/mataji-rajpita-planting.webp',
    'Satguru Mata Sudiksha Ji Maharaj and Nirankari Rajpita Ramit Ji planting a sapling', 'Vann',
    'Planting a sapling', 'Oneness Vann',
    'Native saplings planted and tended until they grow into community forests.', '50% 32%'),
  standIn('rajpita', '/images/nirankari-rajpita-ramit-ji.jpg',
    'Portrait of Nirankari Rajpita Ramit Ji', 'Guiding',
    'Nirankari Rajpita Ramit Ji', 'Spiritual guide, Sant Nirankari Mission',
    'The Mission’s guiding force.', '50% 14%'),
  standIn('volunteers', '/images/volunteers-planning.webp',
    'Foundation volunteers planning a service drive', 'Sewa',
    'Volunteers planning a service drive', 'Documented service',
    'From the foundation’s own library, standing in until the honours are catalogued.',
    '50% 45%'),
  standIn('heal', '/images/vertical-heal.webp', 'Emblem for the Heal programme', 'Heal',
    'Heal', 'Health and blood donation',
    'Blood donation drives, eye-care camps and free health checkups.'),
  standIn('enrich', '/images/vertical-enrich.webp', 'Emblem for the Enrich programme', 'Enrich',
    'Enrich', 'Education and skills', 'Schools, scholarships and skill development.'),
  standIn('empower', '/images/vertical-empower.webp', 'Emblem for the Empower programme', 'Empower',
    'Empower', 'Youth and environment',
    'Youth empowerment, plantation drives and disaster relief.'),
];

const STEP_MS = 650;
/** How long each honour holds the centre before the stage turns itself. */
const HOLD_MS = 2000;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const AwardsSection: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const timer = useRef<number | null>(null);

  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [calm, setCalm] = useState(false);
  const [shown, setShown] = useState(false);
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const [held, setHeld] = useState(false);

  const hasAwards = AWARDS.length > 0;

  const items: Item[] = useMemo(() => {
    return hasAwards
      ? AWARDS.filter((a) => a.photos?.length).map((a): Item => {
          const p = a.photos![0];
          return {
            key: a.id, src: p.src, alt: p.alt, focal: p.focal,
            ghost: a.year || 'Honour',
            award: a, photos: a.photos!,
          };
        })
      : STANDIN;
  }, [hasAwards]);

  const n = items.length;

  useEffect(() => {
    const sync = () => setNarrow(window.innerWidth < 640);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

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
    }, { threshold: 0.25 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Warm the next pictures so a step never lands on an empty frame. */
  useEffect(() => {
    items.forEach((it) => { const img = new Image(); img.src = it.src; });
  }, [items]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (n < 2) return;
    /* One step at a time. Without the lock a fast double-press starts a second
       transition mid-flight and the roles land out of order. */
    if (lock.current) return;
    lock.current = true;
    setActive((i) => (dir === 'next' ? (i + 1) % n : (i + n - 1) % n));
    timer.current = window.setTimeout(() => { lock.current = false; }, STEP_MS);
  }, [n]);

  /* The stage turns itself. It is held while the citation is open — the screen
     behind an open dialog changing on its own is disorienting — while the
     pointer rests on a picture, so a reader can reach one, and entirely
     under reduced motion, where an unbidden change every two seconds is the
     whole thing that setting asks us not to do. */
  useEffect(() => {
    if (calm || target || held || n < 2) return;
    const id = window.setInterval(() => navigate('next'), HOLD_MS);
    return () => window.clearInterval(id);
  }, [calm, target, held, n, navigate]);

  /* Arrow keys drive the stage while it is the screen in view. Bound in the
     CAPTURE phase and stopped there, because App binds ArrowLeft/Right on
     window too and would otherwise spin the hero's pillar wheel at the same
     time — and its re-render would tear this listener off mid-dispatch. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onKey = (e: KeyboardEvent) => {
      if (!stage.contains(document.activeElement)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      navigate(e.key === 'ArrowRight' ? 'next' : 'prev');
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [navigate]);

  const roleOf = (i: number): Role => {
    if (i === active) return 'center';
    if (n > 1 && i === (active + n - 1) % n) return 'left';
    if (n > 2 && i === (active + 1) % n) return 'right';
    if (n > 3 && i === (active + 2) % n) return 'back';
    return 'off';
  };

  const current = items[active];

  const styleFor = (role: Role): React.CSSProperties => {
    const t = calm ? 'none' : `transform ${STEP_MS}ms ${EASE}, filter ${STEP_MS}ms ${EASE}, opacity ${STEP_MS}ms ${EASE}, left ${STEP_MS}ms ${EASE}, height ${STEP_MS}ms ${EASE}, bottom ${STEP_MS}ms ${EASE}`;
    const base: React.CSSProperties = {
      position: 'absolute',
      aspectRatio: '0.72 / 1',
      transition: t,
      willChange: 'transform, filter, opacity',
    };
    switch (role) {
      case 'center':
        return { ...base,
          left: '50%', bottom: narrow ? '30%' : '16%',
          height: narrow ? '40%' : '58%',
          transform: `translateX(-50%) scale(${narrow ? 1.05 : 1.18})`,
          filter: 'none', opacity: 1, zIndex: 20 };
      case 'left':
        return { ...base,
          left: narrow ? '16%' : '24%', bottom: narrow ? '34%' : '26%',
          height: narrow ? '17%' : '26%',
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)', opacity: 0.85, zIndex: 10 };
      case 'right':
        return { ...base,
          left: narrow ? '84%' : '76%', bottom: narrow ? '34%' : '26%',
          height: narrow ? '17%' : '26%',
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(2px)', opacity: 0.85, zIndex: 10 };
      case 'back':
        return { ...base,
          left: '50%', bottom: narrow ? '36%' : '30%',
          height: narrow ? '13%' : '20%',
          transform: 'translateX(-50%) scale(1)',
          filter: 'blur(4px)', opacity: 0.9, zIndex: 5 };
      default:
        /* Offstage: kept mounted so its picture stays decoded and its step
           back on is instant, but out of the tab order and out of the way. */
        return { ...base,
          left: '50%', bottom: '30%', height: narrow ? '13%' : '20%',
          transform: 'translateX(-50%) scale(0.9)',
          filter: 'blur(6px)', opacity: 0, zIndex: 1, pointerEvents: 'none' };
    }
  };

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen overflow-hidden"
    >
      <div ref={rootRef} className={`award-screen${shown ? ' is-in' : ''}`}>
        {/* The word behind the stage — the year where an honour has one. */}
        <p className="award-ghost" aria-hidden="true">{current?.ghost}</p>

        <div className="award-stage" ref={stageRef}>
          {items.map((it, i) => {
            const role = roleOf(i);
            return (
              <button
                key={it.key}
                type="button"
                className={`award-card award-card--${role}`}
                style={styleFor(role)}
                tabIndex={role === 'off' ? -1 : 0}
                aria-hidden={role === 'off' ? 'true' : undefined}
                /* The hold belongs on the pictures, not on the screen. On the
                   screen it covers the whole viewport, so a pointer resting
                   anywhere over this section froze the stage for good. */
                onPointerEnter={() => setHeld(true)}
                onPointerLeave={() => setHeld(false)}
                onFocus={() => setHeld(true)}
                onBlur={() => setHeld(false)}
                onClick={() => {
                  if (role === 'center') setTarget({ award: it.award, photos: it.photos, index: 0 });
                  else setActive(i);
                }}
                aria-label={
                  role === 'center'
                    ? `${it.award.title} — press to read`
                    : `Bring ${it.award.title} to the centre`
                }
              >
                <img src={it.src} alt={it.alt} draggable={false} decoding="async" />
              </button>
            );
          })}
        </div>

        {/* The reading side, and the controls. */}
        <div className="award-say">
          <p className="award-eyebrow">Recognition</p>
          <h2 className="award-title">
            Awards &amp; <em>Recognitions</em>
          </h2>
          {/* No live region: the stage turns itself every couple of seconds, and
              a live region here would read a new honour aloud that often,
              over whatever the visitor was actually doing. */}
          <p className="award-name">{current?.award.title}</p>
          <p className="award-by">
            {current?.award.awardedBy}
            {current?.award.year ? ` · ${current.award.year}` : ''}
          </p>

          <div className="award-nav">
            <button type="button" className="award-arrow" onClick={() => navigate('prev')} aria-label="Previous honour">
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button type="button" className="award-arrow" onClick={() => navigate('next')} aria-label="Next honour">
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
            <p className="award-count">
              <b>{active + 1}</b> / {n}
            </p>
          </div>
        </div>

        {!hasAwards && (
          <p className="award-note">
            The honours are still being catalogued — each will take the stage here
            with the body that conferred it and the year it was given.
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
