import React, { useEffect } from 'react';
import { PillarState } from '../types';
import { OdometerStatCounter } from './OdometerStatCounter';

interface PillarModalProps {
  pillar: PillarState | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPillar: (pillarId: string) => void;
  allPillars: PillarState[];
}

export const PillarModal: React.FC<PillarModalProps> = ({
  pillar,
  isOpen,
  onClose,
  onSelectPillar,
  allPillars,
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !pillar) return null;

  return (
    <div
      id="pillar-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pillar-title"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-white/20 shadow-2xl text-white z-10 animate-scaleUp transition-shadow duration-1000"
        style={{
          boxShadow: `0 25px 60px -15px ${pillar.accentA}66`,
        }}
      >
        {/* Modal Header Banner with Pillar Accent Gradient */}
        <div
          className="relative px-6 py-8 rounded-t-3xl overflow-hidden transition-all duration-1000"
          style={{
            background: `linear-gradient(135deg, ${pillar.accentA}, ${pillar.accentB})`,
          }}
        >
          {/* Close button */}
          <button
            id="close-pillar-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            aria-label="Close dialog"
          >
            ✕
          </button>

          <div className="inline-block px-3 py-1 rounded-full bg-white/25 backdrop-blur-md text-xs font-black tracking-widest uppercase mb-2 border border-white/30">
            Pillar: {pillar.label}
          </div>

          <h2 id="modal-pillar-title" className="text-2xl sm:text-3xl font-extrabold text-white">
            {pillar.headline}
          </h2>

          <p className="text-white/90 text-sm mt-2 font-medium max-w-lg">
            {pillar.shortTagline}
          </p>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main summary */}
          <div>
            <h3 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-2">
              Mission Overview
            </h3>
            <p className="text-neutral-200 text-base leading-relaxed">
              {pillar.body}
            </p>
            <p className="text-neutral-400 text-sm mt-2 italic">
              {pillar.subText}
            </p>
          </div>

          {/* Impact Statistics Grid */}
          <div>
            <h3 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-3">
              Key Milestones & Reach
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pillar.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-neutral-800/90 border border-neutral-700/80 flex flex-col justify-center"
                >
                  <span
                    className="text-xl sm:text-2xl font-black"
                    style={{ color: pillar.accentB }}
                  >
                    <OdometerStatCounter
                      key={`${pillar.id}-${idx}-${stat.value}`}
                      value={stat.value}
                      duration={1800}
                    />
                  </span>
                  <span className="text-xs text-neutral-300 font-medium mt-0.5 leading-snug">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Highlights Bullet points */}
          <div>
            <h3 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-3">
              Core Initiatives
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              {pillar.keyHighlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: pillar.accentA }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Switch Pillars Quick Bar */}
          <div className="pt-4 border-t border-neutral-800">
            <h3 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-3">
              Explore Other Pillars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {allPillars.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPillar(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                    p.id === pillar.id
                      ? 'text-white border-white bg-white/10 shadow-sm'
                      : 'text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700 bg-neutral-800/40'
                  }`}
                  style={{
                    borderColor: p.id === pillar.id ? p.accentA : undefined,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-neutral-400 text-center sm:text-left">
              Sant Nirankari Charitable Foundation · Serving Humanity with Selfless Devotion
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-white text-sm font-semibold cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all"
              style={{ backgroundColor: pillar.accentA }}
            >
              Back to Hero Wheel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
