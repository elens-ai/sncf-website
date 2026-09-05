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
  const stripRef = useRef<HTMLUListElement | null>(null);
  /* true while a reader has the band — pointer over it, or focus inside */
  const heldRef = useRef(false);

  const hasPhoto = items.some((m) => m.kind === 'photo' && m.src);
  const hasFilm = items.some((m) => m.kind === 'film' && m.src);
  /* What exists leads; what is awaited follows. A carousel that opens on
     three placeholders buries the one photograph the room actually has. */
  const shown = items
    .filter((m) => filter === 'all' || m.kind === filter)
    .slice()
    .sort((a, b) => (a.src ? 0 : 1) - (b.src ? 0 : 1));
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

  /* THE DRIFT.
     The band travels right to left on its own, and it does it by moving the
     strip's own scrollLeft rather than by translating a track. That one
     choice is what lets the drift coexist with everything else: the wheel,
     a drag, a touch flick and the keyboard all act on the same scrollLeft,
     so there is no second coordinate system to reconcile and no jump when a
     reader takes hold of it.

     The plates are rendered TWICE — the second set aria-hidden and out of
     the tab order — so when the scroll passes the halfway mark it can be
     rewound by exactly half the track and the seam is invisible.

     It stops when a pointer is over it, when focus is inside it, when the
     gallery is off screen, and entirely under prefers-reduced-motion. */
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = 0;
    const SPEED = 22; /* px per second — a reel passing a gate, not a hoarding */

    const step = (t: number) => {
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      raf = requestAnimationFrame(step);

      if (heldRef.current) return;
      /* off screen: nothing to watch, so nothing to spend */
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;

      /* THE PERIOD IS MEASURED, NOT DIVIDED.
         `scrollWidth / 2` looks like the length of one pass and is not: the
         track carries padding at both ends and a gap between the last plate
         of the first set and the first of the echo, so the halves are not
         equal. Rewinding by that figure put the first plate where the last
         had been — a visible jolt once a loop. The true period is the
         distance from a plate to its own echo, which the DOM knows. */
      const cells = el.children;
      const n = cells.length / 2;
      if (n < 1) return;
      const first = cells[0] as HTMLElement;
      const echo = cells[n] as HTMLElement;
      if (!echo) return;
      const period = echo.offsetLeft - first.offsetLeft;
      if (period <= 1) return;

      let next = el.scrollLeft + (SPEED * dt) / 1000;
      if (next >= period) next -= period;
      el.scrollLeft = next;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* THE WHEEL DRIVES THE STRIP SIDEWAYS.
     A vertical wheel gesture over the strip scrolls it horizontally — but
     only while the strip can still take it. At either end the gesture is
     handed back to the page untouched, which is the difference between a
     carousel you can scroll past and the familiar trap where a horizontal
     band swallows the page's scroll and strands the reader inside it.

     Bound with { passive: false } because preventDefault is meaningless on a
     passive listener, and React's onWheel is passive by default — the whole
     thing would silently do nothing if this were a JSX prop. */
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      /* a genuinely horizontal gesture (trackpad, shift-wheel) already works
         — leave it alone */
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;
      /* A TOLERANCE, not an exact comparison. The strip carries 2px of
         padding so focus rings are not clipped, and scroll-snap rests it on
         the first plate's edge rather than on 0 — so `scrollLeft <= 0` was
         never true, the "hand it back at the start" branch never ran, and
         scrolling up over the strip trapped the page. Sub-pixel scroll
         positions on a fractional-DPI display would break an exact test the
         same way. */
      const EDGE = 4;
      const atStart = el.scrollLeft <= EDGE;
      const atEnd = el.scrollLeft >= max - EDGE;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

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

  /* Every room gets the band, including the ones whose photographs have not
     arrived. An awaiting plate is a designed object — the room's ink, the
     subject it is reserved for — not a grey hole, so a wall being hung still
     reads as a wall. */
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

      <ul
        className="mgal-strip"
        ref={stripRef}
        onPointerEnter={() => { heldRef.current = true; }}
        onPointerLeave={() => { heldRef.current = false; }}
        onFocusCapture={() => { heldRef.current = true; }}
        onBlurCapture={() => { heldRef.current = false; }}
      >
        {[...shown, ...shown].map((m, dupIndex) => {
          const echo = dupIndex >= shown.length;
          const awaiting = !m.src;
          return (
            <li
              key={`${m.id}-${dupIndex}`}
              className="mgal-cell"
              data-wide={m.wide ? 'true' : undefined}
              data-kind={m.kind}
              data-awaiting={awaiting ? 'true' : undefined}
              /* the second pass is the seam's echo: seen, never read, never
                 tabbed into */
              aria-hidden={echo || undefined}
              /* a real boolean: React 19 takes `inert` as one, and an empty
                 string was being dropped, leaving the echo tabbable */
              inert={echo}
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
