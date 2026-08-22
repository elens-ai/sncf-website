import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { DevotionalLeader } from './DevotionalPhotoCard';

interface DevotionalLightboxModalProps {
  leader: DevotionalLeader | null;
  onClose: () => void;
}

export const DevotionalLightboxModal: React.FC<DevotionalLightboxModalProps> = ({
  leader,
  onClose,
}) => {
  if (!leader) return null;

  return (
    <div
      id="devotional-lightbox-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="devotional-lightbox-card"
        className="relative w-full max-w-lg rounded-[36px] overflow-hidden bg-neutral-950 border border-white/20 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 0 60px ${leader.glowColor}30, 0 25px 50px -12px rgba(0, 0, 0, 0.9)`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close Lightbox"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Spiritual Halo Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold tracking-widest uppercase mb-5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: leader.glowColor }} />
          <span>Spiritual Guidance</span>
        </div>

        {/* Centered Large Dignified Portrait Icon Frame */}
        <div
          className="relative w-48 h-64 sm:w-56 sm:h-72 rounded-[28px] overflow-hidden border-2 border-white/40 shadow-inner flex items-center justify-center mb-6 bg-white"
        >
          {/* Portrait Icon Graphics */}
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center shadow-md mb-3">
              <span className="font-artistic-display text-2xl sm:text-3xl text-neutral-900 font-bold tracking-wider">
                ੴ
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-neutral-900 text-[11px] font-bold text-white uppercase tracking-widest shadow-sm">
              Sant Nirankari Mission
            </div>
          </div>
        </div>

        {/* Name and Honorific Description */}
        <h2 className="font-artistic-serif text-xl sm:text-2xl font-bold text-white tracking-wide mb-1.5">
          {leader.name}
        </h2>
        <p className="text-sm sm:text-base text-neutral-300 font-medium tracking-wide max-w-sm mb-4">
          {leader.honorificTitle}
        </p>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
          “Know One, Believe in One, Become One. Spreading universal brotherhood, love, peace, and selfless service across humanity.”
        </p>
      </div>
    </div>
  );
};
