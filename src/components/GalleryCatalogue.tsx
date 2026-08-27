import React, { useEffect, useRef } from 'react';
import { PILLARS } from '../data/pillars';
import { ACTIVITIES, activitiesFor, Activity } from '../data/activities';
import { LOGO_INK } from './petalArt';

/**
 * THE CATALOGUE — the book a gallery hands you at the door.
 *
 * The exhibition itself is walked: scroll carries the visitor through four
 * rooms in sequence, and each wall hangs only what that room owns. That is
 * the designed way through, but it is a GUIDED way — there was no view of
 * the whole collection at once, and no way to step straight to one piece
 * without walking everything before it.
 *
 * This overlay is that missing view, kept in the exhibition's own language:
 * not a settings-menu list of links but the printed catalogue, room by room
 * in walking order, every work as the same framed plate it hangs as on the
 * wall (the markup and classes are the wall's own — see .lotus-plate), each
 * lit in its room's colour. Selecting a piece opens the SAME ActivityCase
 * the walls open, so the catalogue is a second door to the works, not a
 * second implementation of them.
 *
 * It deliberately stays OPEN underneath the case (ActivityCase is z-80,
 * this is z-70): step up to a piece, read it, step back — and you are still
 * holding the catalogue at the page you were on, the way browsing actually
 * works. Closing the catalogue itself is the only way to put it down.
 */
interface GalleryCatalogueProps {
  open: boolean;
  onClose: () => void;
  /** Opens a work in the ActivityCase; the catalogue stays open behind it. */
  onSelect: (activity: Activity) => void;
}

/** The rooms, in the exhibition's own walking order. */
const ROOM_IDS = ['heal', 'enrich', 'empower', 'projects'] as const;

/** Frame treatments cycle so a shelf of plates reads as a hung collection
    rather than a print run — purely cosmetic, same set the walls use. */
const PLATE_STYLES = ['frame', 'mat', 'print'] as const;

export const GalleryCatalogue: React.FC<GalleryCatalogueProps> = ({ open, onClose, onSelect }) => {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      /* Escape puts the catalogue down — but NOT while a case is open above
         it: that Escape belongs to the case (ActivityCase binds its own),
         and handling it here too would close both layers on one keypress. */
      if (e.key === 'Escape' && !document.querySelector('.activity-case')) onClose();
    };
    /* Hold the page still, restoring rather than clearing — the splash, the
       modals and the ActivityCase all manage this same property, and the
       last one out must not unlock a page another layer still holds. */
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="gallery-catalogue"
      role="dialog"
      aria-modal="true"
      aria-label={`Exhibition catalogue — ${ACTIVITIES.length} works in four rooms`}
    >
      <button className="gallery-catalogue-scrim" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <div className="gallery-catalogue-body">
        <button ref={closeRef} className="gallery-catalogue-close" onClick={onClose} aria-label="Close the catalogue">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* the catalogue's cover line */}
        <header className="gallery-catalogue-head">
          <p className="font-dancing-script pillar-script-name font-bold text-white leading-none drop-shadow-md select-none">
            The Catalogue
          </p>
          <p className="font-artistic-display text-white/80 text-[11px] sm:text-[12.5px] tracking-[0.22em] uppercase mt-3">
            Four rooms · {ACTIVITIES.length} works
          </p>
          <p className="font-artistic-serif text-white/60 text-[12px] mt-1.5">
            Select any piece to step up to its figures
          </p>
        </header>

        {ROOM_IDS.map((id, i) => {
          const pillar = PILLARS.find((p) => p.id === id)!;
          const acts = activitiesFor(id);
          return (
            <section
              key={id}
              className="gallery-catalogue-room"
              style={{ '--room-a': pillar.accentA, '--room-b': pillar.accentB } as React.CSSProperties}
              aria-label={`Room ${i + 1} — ${pillar.label}`}
            >
              <div className="gallery-catalogue-room-head">
                <p className="font-artistic-display text-[10px] tracking-[0.2em] text-white/55 uppercase">
                  Room {i + 1} of {ROOM_IDS.length}
                </p>
                <p className="font-dancing-script text-[30px] sm:text-[36px] font-bold text-white leading-none mt-0.5">
                  {pillar.label.charAt(0) + pillar.label.slice(1).toLowerCase()}
                </p>
                <span className="gallery-catalogue-room-rule" aria-hidden="true" />
              </div>

              {/* the room's shelf — the wall's own plate markup, browsed as
                  a grid instead of hung on a scroll-driven wall */}
              <div className="gallery-catalogue-shelf">
                {acts.map((act, j) => {
                  const art = act.images[0];
                  return (
                    <figure
                      key={act.id}
                      className="lotus-plate relative m-0 aspect-[4/3]"
                      data-empty={art ? 'false' : 'true'}
                      data-style={PLATE_STYLES[j % PLATE_STYLES.length]}
                      /* Same petal inks the walls use, so a work is framed
                         identically wherever it is met. */
                      style={{ '--plate-ink': LOGO_INK[j % LOGO_INK.length] } as React.CSSProperties}
                    >
                      <button
                        type="button"
                        className="lotus-plate-hit"
                        onClick={() => onSelect(act)}
                        aria-label={`${act.title} — ${act.dataPoints.length} figures`}
                      >
                        <span className="lotus-plate-art">
                          {art ? <img src={art.src} alt={art.alt} loading="lazy" decoding="async" /> : null}
                        </span>
                        <span className="lotus-plate-headline">
                          <span className="lotus-plate-value">{act.headline.value}</span>
                          <span className="lotus-plate-metric">{act.headline.label}</span>
                        </span>
                      </button>
                      <figcaption className="lotus-plate-label">{act.title}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="font-artistic-serif text-white/45 text-[11.5px] text-center pb-2">
          Figures as reported · March 2026
        </p>
      </div>
    </div>
  );
};
