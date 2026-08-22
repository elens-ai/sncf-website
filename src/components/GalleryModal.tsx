import React, { useEffect } from 'react';
import { X, Images } from 'lucide-react';
import { PillarState } from '../types';
import { CardIllustration } from './CardIllustration';
import { DevotionalPhotoCard, DevotionalLeader, DEVOTIONAL_LEADERS } from './DevotionalPhotoCard';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillars: PillarState[];
  /** Opens the pillar detail modal for a selected pillar tile. */
  onSelectPillar: (pillar: PillarState) => void;
  /** Opens the devotional lightbox for a selected portrait tile. */
  onSelectLeader: (leader: DevotionalLeader) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  pillars,
  onSelectPillar,
  onSelectLeader,
}) => {
  // Close on Escape, and lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="gallery-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="gallery-modal-panel"
        className="relative w-full max-w-6xl my-auto rounded-[32px] bg-neutral-950/95 border border-white/15 shadow-2xl p-5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-artistic-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Images className="w-5 h-5 text-amber-400" />
              Gallery
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {pillars.length} pillars · {DEVOTIONAL_LEADERS.length} spiritual portraits
            </p>
          </div>

          <button
            id="gallery-close-btn"
            onClick={onClose}
            aria-label="Close gallery"
            className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pillar tiles */}
        <section className="mb-8">
          <h3 className="text-xs uppercase font-bold text-neutral-300 tracking-wider mb-3">
            The Four Pillars
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {pillars.map((pillar, index) => (
              <button
                key={pillar.id}
                onClick={() => onSelectPillar(pillar)}
                title={`${pillar.label} — ${pillar.headline}`}
                className="group relative aspect-[3/4] rounded-[20px] overflow-hidden border border-white/15 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                style={{
                  boxShadow: `0 12px 32px -12px ${pillar.accentA}80`,
                }}
              >
                <CardIllustration pillar={pillar} index={index} roundedClass="rounded-[20px]" />

                {/* Hover veil with the pillar name */}
                <span className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-white">
                    View {pillar.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Devotional portraits */}
        <section>
          <h3 className="text-xs uppercase font-bold text-neutral-300 tracking-wider mb-3">
            Spiritual Guides
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {DEVOTIONAL_LEADERS.map((leader) => (
              <button
                key={leader.id}
                onClick={() => onSelectLeader(leader)}
                title={leader.name}
                className="group relative aspect-[3/4] rounded-[20px] overflow-hidden border border-white/15 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                style={{
                  boxShadow: `0 12px 32px -12px ${leader.glowColor}80`,
                }}
              >
                <DevotionalPhotoCard leader={leader} roundedClass="rounded-[20px]" isFrontFacing />

                <span className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-white">
                    View Portrait
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
