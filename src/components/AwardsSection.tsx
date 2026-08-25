import React, { useEffect, useRef, useState } from 'react';
import { Medal } from 'lucide-react';
import { AWARDS, Award } from '../data/awards';
import { AwardLightbox, LightboxTarget } from './AwardLightbox';

/**
 * Awards and recognitions — the screen after upcoming events.
 *
 * Paints no background of its own; the page-wide .accent-canvas carries the
 * gradient so the colour continues unbroken from the screens above. Surfaces
 * here are translucent for the same reason — an opaque panel would read as a
 * seam across an otherwise continuous ramp.
 *
 * The recognitions are photographs first. The foundation's own honours page
 * is a wall of ceremony and certificate photos, so the tile leads with the
 * image and the text sits under it as caption, not the other way round.
 *
 * Until the real list is supplied, AWARDS is empty and the archival state
 * below renders instead — a designed state, not a broken one.
 */

/** Reveal-on-scroll. Fires once, then stops watching. */
const useRevealOnce = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /* No IntersectionObserver (old Safari, some test runners) means no reveal
       animation — but the content must still be there, so show it outright. */
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

/** The mounts in the archival state — deliberate empty plates, not missing images. */
const ARCHIVE_MOUNTS = [
  { tilt: -7, delay: 0 },
  { tilt: 2.5, delay: 220 },
  { tilt: 8, delay: 440 },
];

const AwardTile: React.FC<{
  award: Award;
  order: number;
  onOpen: (target: LightboxTarget) => void;
}> = ({ award, order, onOpen }) => {
  const photos = award.photos ?? [];
  const cover = photos[0];

  return (
    <li
      className={`award-tile${award.featured ? ' award-tile--featured' : ''}`}
      style={{ ['--i' as string]: order }}
    >
      {cover ? (
        <button
          type="button"
          className="award-plate"
          onClick={() => onOpen({ award, photos, index: 0 })}
          aria-label={`${award.title} — open ${photos.length} photograph${
            photos.length === 1 ? '' : 's'
          }`}
        >
          <img
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            loading="lazy"
            decoding="async"
            className="award-plate-img"
          />
          {photos.length > 1 && (
            <span className="award-plate-count tabular-nums">{photos.length}</span>
          )}
        </button>
      ) : (
        <div className="award-plate award-plate--textonly" aria-hidden="true">
          <Medal className="w-7 h-7 text-white/45" />
        </div>
      )}

      <div className="award-tile-body">
        <p className="award-tile-year tabular-nums">{award.year}</p>
        <h3 className="award-tile-title text-balance">{award.title}</h3>
        <p className="award-tile-by">{award.awardedBy}</p>
        {award.note && <p className="award-tile-note">{award.note}</p>}
      </div>
    </li>
  );
};

export const AwardsSection: React.FC = () => {
  const { ref, shown } = useRevealOnce<HTMLDivElement>();
  const [target, setTarget] = useState<LightboxTarget | null>(null);

  return (
    <section
      id="awards-section"
      aria-label="Awards and recognitions"
      className="snap-screen relative z-10 w-full min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-28 pb-16 overflow-hidden"
    >
      <div ref={ref} className={`relative z-10 w-full max-w-7xl mx-auto${shown ? ' is-in' : ''}`}>
        <header className="award-reveal mb-8 sm:mb-12" style={{ ['--i' as string]: 0 }}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/70 mb-2">
            Recognition
          </p>
          <h2 className="text-white font-extrabold text-[28px] sm:text-[36px] md:text-[42px] leading-tight max-w-3xl drop-shadow text-balance">
            Awards &amp; recognitions
          </h2>
          <p className="text-white/80 text-[15px] sm:text-[17px] leading-relaxed mt-3 max-w-2xl">
            Your appreciation makes us stronger to serve humanity.
          </p>
        </header>

        {AWARDS.length === 0 ? (
          <div className="award-archive">
            <div className="award-archive-note award-reveal" style={{ ['--i' as string]: 1 }}>
              <Medal className="w-6 h-6 text-white/70 mb-4" />
              <p className="text-white/95 text-[17px] leading-relaxed mb-2">
                The honours the foundation has received are being catalogued.
              </p>
              <p className="text-[14px] text-white/70 leading-relaxed">
                Each is listed here with its conferring body and the year it was
                given, as it is confirmed — so nothing appears without its source.
              </p>
            </div>

            {/* Empty mounts. Corner ticks and a hairline read as plates waiting
                for their photographs, which is what they are. */}
            {/* The reveal lives on the <li> and the drift on the plate inside
                it. Both on one element and the second `animation` shorthand
                would simply replace the first, so only one would ever run. */}
            <ul className="award-fan" aria-hidden="true">
              {ARCHIVE_MOUNTS.map((mount, i) => (
                <li
                  key={i}
                  className="award-mount award-reveal"
                  style={{
                    ['--i' as string]: i + 2,
                    ['--tilt' as string]: `${mount.tilt}deg`,
                  }}
                >
                  <div
                    className="award-mount-plate"
                    style={{ ['--drift-delay' as string]: `${mount.delay}ms` }}
                  >
                    <span className="award-mount-tick award-mount-tick--tl" />
                    <span className="award-mount-tick award-mount-tick--tr" />
                    <span className="award-mount-tick award-mount-tick--bl" />
                    <span className="award-mount-tick award-mount-tick--br" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="award-grid">
            {AWARDS.map((award, i) => (
              <AwardTile key={award.id} award={award} order={i + 1} onOpen={setTarget} />
            ))}
          </ul>
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
