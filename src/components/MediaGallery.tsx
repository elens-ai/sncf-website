import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MEDIA, MediaItem } from '../data/media';

/**
 * THE GALLERY — photographs and films for one subsection.
 *
 * Three things it has to get right:
 *
 *  1. AN HONEST WALL. The foundation has not yet handed over its archive, so
 *     most plates have no file behind them. Those render as awaiting plates
 *     carrying their caption — the gallery reads as a wall being hung, not as
 *     a broken grid, and it will absorb the real files without a redesign.
 *     Awaiting plates are inert: not buttons, not in the tab order, not
 *     openable. Nothing pretends to be a photograph that isn't one.
 *
 *  2. ONE VIEWER FOR BOTH MEDIA. Films and photographs open in the same
 *     lightbox. A film whose src ends .mp4/.webm plays in a <video>; anything
 *     else is treated as an embed URL and framed. Only plates that actually
 *     have a file take part, so the arrows never land on an empty frame.
 *
 *  3. KEYBOARD PARITY. Escape closes, ← → step, focus is restored to the
 *     plate that opened the viewer. The filter is a radio group, not a row of
 *     lookalike buttons.
 */

interface MediaGalleryProps {
  /** Key into MEDIA. */
  section: string;
  /** Small caps line above the gallery. */
  title?: string;
  /**
   * Heading level for that line. A gallery that is one of the page's own
   * rail destinations is a SIBLING of the other sections, so it needs an h2;
   * one tucked inside a chapter is subordinate and stays an h3. Getting this
   * wrong files a top-level section under the section before it when anyone
   * navigates the page by headings.
   */
  headingLevel?: 2 | 3;
}

type Filter = 'all' | 'photo' | 'film';

const isEmbed = (src: string) => !/\.(mp4|webm|ogg)(\?|$)/i.test(src);

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['photo', 'Photographs'],
  ['film', 'Films'],
];

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  section,
  title = 'Photographs & films',
  headingLevel = 3,
}) => {
  const Heading = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
  const items = MEDIA[section] ?? [];
  const [filter, setFilterState] = useState<Filter>('all');
  /* Changing the filter re-derives `openable`, so a viewer left open would
     be indexing a list it no longer belongs to. Closing it HERE rather than
     in an effect means there is never a frame showing the wrong plate. */
  const setFilter = (f: Filter) => {
    setFilterState(f);
    setViewing(null);
  };
  /** index into `open`-able items, or null */
  const [viewing, setViewing] = useState<number | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const hasPhoto = items.some((m) => m.kind === 'photo');
  const hasFilm = items.some((m) => m.kind === 'film');
  const shown = items.filter((m) => filter === 'all' || m.kind === filter);
  /** only plates with a file can be opened — the arrows walk these */
  const openable = shown.filter((m) => m.src);

  const close = useCallback(() => {
    setViewing(null);
    /* hand focus back to the plate that opened this */
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const step = useCallback(
    (d: number) => {
      setViewing((cur) => {
        if (cur === null || !openable.length) return cur;
        return (cur + d + openable.length) % openable.length;
      });
    },
    [openable.length],
  );

  /* the viewer's keys, its focus trap, and the page's scroll lock */
  useEffect(() => {
    if (viewing === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        /* the page beneath binds Escape too (the partner chyron, the site's
           modals) — this one is on top, so it consumes the key */
        e.stopPropagation();
        close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Tab') {
        /* aria-modal is a promise to assistive tech, not a mechanism: without
           this, Tab walks straight out of the dialog into the page behind. */
        const d = dialogRef.current;
        if (!d) return;
        const focusable = d.querySelectorAll<HTMLElement>(
          'button, [href], video, iframe, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        /* On open, focus sits on the dialog CONTAINER, which is in neither
           the first nor the last branch — so a wrap test alone lets the very
           first Shift+Tab fall out of the dialog and into the page. Anything
           focused that is not inside the dialog is pulled back in. */
        const inside = d.contains(document.activeElement) && document.activeElement !== d;
        if (!inside) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);

    /* the page must not scroll behind the viewer — the same idiom the other
       modals in this repo use, restoring whatever was there before */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /* move focus into the dialog so the keys land and a screen reader
       announces it rather than leaving the user back on the page */
    const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = previousOverflow;
    };
  }, [viewing, close, step]);

  if (!items.length) return null;

  const current = viewing !== null ? openable[viewing] : null;
  /* counted over what is ON SCREEN, not over the whole set — under the Films
     filter, "3 of 12 hung" describes a grid the reader cannot see */
  const ready = openable.length;

  const openPlate = (m: MediaItem, el: HTMLElement) => {
    const i = openable.findIndex((o) => o.id === m.id);
    if (i === -1) return;
    returnFocusRef.current = el;
    setViewing(i);
  };

  return (
    /* no aria-label on the section: it would duplicate the heading right
       inside it, and a screen reader would announce the name twice */
    <section className="mgal">
      <header className="mgal-head">
        <Heading className="mgal-title font-artistic-display">{title}</Heading>

        {hasPhoto && hasFilm && (
          <div className="mgal-filter" role="radiogroup" aria-label="Filter media">
            {FILTERS.map(([k, label], i) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={filter === k}
                /* a radiogroup is ONE tab stop; the arrows move within it */
                tabIndex={filter === k ? 0 : -1}
                className="mgal-chip"
                data-on={filter === k}
                onClick={() => setFilter(k)}
                onKeyDown={(e) => {
                  const d =
                    e.key === 'ArrowRight' || e.key === 'ArrowDown'
                      ? 1
                      : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                        ? -1
                        : 0;
                  if (!d) return;
                  e.preventDefault();
                  const j = (i + d + FILTERS.length) % FILTERS.length;
                  setFilter(FILTERS[j][0]);
                  const group = e.currentTarget.parentElement;
                  const buttons = group?.querySelectorAll('button');
                  (buttons?.[j] as HTMLButtonElement | undefined)?.focus();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <ul className="mgal-grid">
        {shown.map((m) => {
          const awaiting = !m.src;
          return (
            <li
              key={m.id}
              className="mgal-cell"
              data-wide={m.wide ? 'true' : undefined}
              data-kind={m.kind}
              data-awaiting={awaiting ? 'true' : undefined}
            >
              {awaiting ? (
                /* inert on purpose — there is nothing behind it to open */
                <div className="mgal-plate mgal-plate-awaiting">
                  <span className="mgal-await-mark" aria-hidden="true">
                    {m.kind === 'film' ? '▶' : '◻'}
                  </span>
                  <span className="mgal-await-label">
                    {m.kind === 'film' ? 'Film to come' : 'Photograph to come'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="mgal-plate"
                  data-poster={m.kind === 'film' && !m.poster ? 'none' : undefined}
                  aria-label={`Open: ${m.caption}`}
                  onClick={(e) => openPlate(m, e.currentTarget)}
                >
                  {/* A film's tile shows its POSTER. With no poster there is
                      no still to show — and putting the film's own URL in an
                      <img> just renders a broken image, so the tile falls
                      back to an ink ground carrying the play mark. */}
                  {(m.kind === 'photo' ? m.src : m.poster) && (
                    <img
                      src={(m.kind === 'photo' ? m.src : m.poster) as string}
                      alt={m.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {m.kind === 'film' && (
                    <span className="mgal-play" aria-hidden="true">
                      ▶
                    </span>
                  )}
                </button>
              )}
              <p className="mgal-caption font-artistic-serif">{m.caption}</p>
            </li>
          );
        })}
      </ul>

      <p className="mgal-note">
        {ready} of {shown.length} hung · the rest arrive as the foundation’s
        archive is catalogued
      </p>

      {/* THE VIEWER */}
      {current &&
        createPortal(
          <div
            className="mgal-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={current.caption}
            tabIndex={-1}
            ref={dialogRef}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <button
              type="button"
              className="mgal-viewer-close"
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>

            {openable.length > 1 && (
              <>
                <button
                  type="button"
                  className="mgal-viewer-arrow mgal-viewer-prev"
                  aria-label="Previous"
                  onClick={() => step(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="mgal-viewer-arrow mgal-viewer-next"
                  aria-label="Next"
                  onClick={() => step(1)}
                >
                  ›
                </button>
              </>
            )}

            <figure className="mgal-viewer-figure">
              {current.kind === 'film' && current.src ? (
                isEmbed(current.src) ? (
                  <iframe
                    src={current.src}
                    title={current.caption}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={current.src} poster={current.poster} controls autoPlay />
                )
              ) : (
                <img src={current.src ?? ''} alt={current.alt} />
              )}
              <figcaption className="font-artistic-serif">
                {current.caption}
                {openable.length > 1 && (
                  <span className="mgal-viewer-count">
                    {viewing! + 1} / {openable.length}
                  </span>
                )}
              </figcaption>
            </figure>
          </div>,
          document.body,
        )}
    </section>
  );
};
