import React, { useEffect, useRef } from 'react';
import { Activity } from '../data/activities';

/**
 * STEPPING UP TO A PIECE.
 *
 * Selecting a frame on a pillar's wall opens this: the work enlarged, and
 * beside it the wall text — title, reporting period, what the work is, and
 * every figure the report gives for it. It is modelled on the printed panel
 * a gallery hangs next to a piece rather than on a product modal, which is
 * why the figures are a ruled list of label and value rather than a grid of
 * cards: a card grid competes with the picture, a list reads as caption.
 *
 * The room behind does not move while this is open. Its bloom is driven by
 * scroll, so leaving the page scrollable would rewind the flower and swap
 * the room out from under the piece being read.
 */
interface ActivityCaseProps {
  activity: Activity | null;
  /** That pillar's accent pair, so the case is lit in the room's colour. */
  accent: { a: string; b: string };
  onClose: () => void;
}

export const ActivityCase: React.FC<ActivityCaseProps> = ({ activity, accent, onClose }) => {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!activity) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    /* Hold the page still. Restoring the previous value rather than clearing
       it matters: the splash and the modals set this too, and clobbering it
       would leave the page locked or unlocked depending on close order. */
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [activity, onClose]);

  if (!activity) return null;
  const hero = activity.images[0];
  const rest = activity.images.slice(1);

  return (
    <div
      className="activity-case"
      role="dialog"
      aria-modal="true"
      aria-label={`${activity.title} — figures`}
      style={
        {
          '--case-a': accent.a,
          '--case-b': accent.b,
        } as React.CSSProperties
      }
    >
      {/* The gallery goes dark around the piece. Clicking the darkness steps
          back from it, the way walking away does. */}
      <button className="activity-case-scrim" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <div className="activity-case-body">
        <button ref={closeRef} className="activity-case-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="activity-case-grid">
          {/* the work */}
          <div className="activity-case-art-col">
            <figure className="activity-case-art" data-empty={hero ? 'false' : 'true'}>
              {hero ? <img src={hero.src} alt={hero.alt} /> : null}
            </figure>
            {rest.length > 0 && (
              <div className="activity-case-strip">
                {rest.map((img) => (
                  <figure key={img.src} className="activity-case-thumb">
                    <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
                  </figure>
                ))}
              </div>
            )}
          </div>

          {/* the wall text */}
          <div className="activity-case-text">
            <p className="activity-case-period">{activity.period}</p>
            <h3 className="activity-case-title">{activity.title}</h3>
            <p className="activity-case-blurb">{activity.blurb}</p>

            <p className="activity-case-figures-head">Figures as reported</p>
            <dl className="activity-case-figures">
              {activity.dataPoints.map((d) => (
                <div key={d.label} className="activity-case-figure">
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>

            <p className="activity-case-source">
              SNCF Activity Report, March 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
