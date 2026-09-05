import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Award, AwardPhoto } from '../data/awards';

export interface LightboxTarget {
  award: Award;
  photos: AwardPhoto[];
  index: number;
}

interface AwardLightboxProps {
  target: LightboxTarget | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Full-screen view of one award's photographs.
 *
 * Matches the modal contract the rest of the site already keeps: backdrop
 * click closes, Escape closes, the inner card stops propagation, and the body
 * scroll lock restores the PREVIOUS overflow value rather than hardcoding ''
 * — two stacked modals closing in sequence would otherwise leave the page
 * unscrollable.
 */
export const AwardLightbox: React.FC<AwardLightboxProps> = ({
  target,
  onClose,
  onNavigate,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  /* Whatever had focus when the lightbox opened — the thumbnail button. Focus
     goes back to it on close, so a keyboard reader returns to the tile they
     opened rather than to the top of the document. */
  const openerRef = useRef<Element | null>(null);

  const isOpen = target !== null;
  const count = target?.photos.length ?? 0;
  const index = target?.index ?? 0;

  const goPrev = useCallback(() => {
    if (count > 1) onNavigate((index - 1 + count) % count);
  }, [count, index, onNavigate]);

  const goNext = useCallback(() => {
    if (count > 1) onNavigate((index + 1) % count);
  }, [count, index, onNavigate]);

  /* The keydown effect must not re-subscribe on every render, so it reads the
     current callbacks through a ref instead of listing them as dependencies.
     Re-subscribing was not merely wasteful: App's own ArrowRight handler runs
     first, advances the hero pillar, and the re-render that followed removed
     this listener WHILE the very same keydown was still being dispatched — a
     listener detached mid-dispatch is never called, so the arrow keys did
     nothing while Escape (which App ignores, so nothing re-rendered) worked. */
  const handlersRef = useRef({ onClose, goPrev, goNext });
  useEffect(() => {
    handlersRef.current = { onClose, goPrev, goNext };
  });

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = document.activeElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { onClose: close, goPrev: prev, goNext: next } = handlersRef.current;

      if (e.key === 'Escape') {
        /* Capture phase + stopImmediatePropagation, so the keys this lightbox
           owns never also reach App's hero handler. Without it ArrowRight
           spun the pillar wheel — and repainted the page accents — behind the
           open photograph. */
        e.stopImmediatePropagation();
        close();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopImmediatePropagation();
        prev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopImmediatePropagation();
        next();
        return;
      }
      /* Focus trap. The card holds every control, so cycling within it is
         enough — no sentinel nodes needed. */
      if (e.key === 'Tab' && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown, true);

    cardRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [isOpen]);

  if (!target) return null;

  const photo = target.photos[index];
  const { award } = target;

  /* Portalled to <body>. Rendered in place it sat inside the awards section's
     own stacking context (`relative z-10`), where its z-50 counted only
     against its siblings — the header, also z-50 but at root level, painted
     straight over the backdrop. The same trap the social sidebar hit. */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${award.title} — photograph ${index + 1} of ${count}`}
        className="award-lightbox-card relative w-full max-w-5xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="award-icon-btn absolute -top-2 right-0 sm:top-0 sm:-right-2 z-10"
          aria-label="Close photograph"
        >
          <X className="w-5 h-5" />
        </button>

        <figure className="m-0 flex flex-col items-center">
          <div className="award-lightbox-stage">
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              decoding="async"
              className="award-lightbox-img"
            />
          </div>

          <figcaption className="w-full max-w-3xl mt-5 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60 mb-1.5">
              {award.awardedBy} · <span className="award-year-inline">{award.year}</span>
            </p>
            <h3 className="text-white font-bold text-[19px] sm:text-[22px] leading-snug text-balance">
              {award.title}
            </h3>
            {photo.caption && (
              <p className="text-[14px] text-white/70 leading-relaxed mt-2">{photo.caption}</p>
            )}
          </figcaption>
        </figure>

        {count > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={goPrev} className="award-icon-btn" aria-label="Previous photograph">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="text-[13px] text-white/70 tabular-nums" aria-live="polite">
              {index + 1} / {count}
            </p>
            <button onClick={goNext} className="award-icon-btn" aria-label="Next photograph">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
