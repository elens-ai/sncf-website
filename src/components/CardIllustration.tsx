import React from 'react';
import { PillarState } from '../types';

interface CardIllustrationProps {
  pillar: PillarState;
  index: number;
  roundedClass?: string;
  isActive?: boolean;
}

/**
 * Flat colour card for the orbit carousel.
 *
 * The vertical marks are drawn as inline SVG rather than loaded as image
 * files: they are flat solid shapes, so vectors reproduce them exactly,
 * stay crisp at every card scale, cost no network request, and avoid the
 * decode/raster work that made the wheel stutter.
 */

interface Mark {
  /** Solid colour of the glyph, matching the supplied vertical artwork. */
  color: string;
  /** Supplied artwork. Optimised local copy of the S3 original: the source
      PNGs are 2048x2048 (~4 MB each, ~12 MB for the set), which would undo
      the wheel's decode/raster budget. Resized to 512px WebP = 19 KB total,
      still 2x the largest size a card ever renders them at. */
  img?: string;
  art: React.ReactNode;
}

const MARKS: Record<string, Mark> = {
  // HEAL — sprout: two upper leaves, two lower leaves, vein on the large leaf
  heal: {
    img: '/images/vertical-heal.webp',
    color: '#2FA96B',
    art: (
      <>
        <path d="M12 13.1c0-5.6 3.9-10 9.6-10.6.4 5.8-3.4 10.2-9.6 10.6Z" />
        <path d="M11.4 13.1c0-4.5-3.2-8-8.1-8.4-.3 4.7 3 8.1 8.1 8.4Z" />
        <path d="M11.4 13.7c-3.5 0-6.1 2.7-6.1 6.2 3.6 0 6.1-2.7 6.1-6.2Z" />
        <path d="M12.2 13.7c2.9 0 5.2 2.4 5.2 5.2-2.8 0-5.2-2.3-5.2-5.2Z" />
        <path
          d="M12.7 12.5c1-3.9 3.9-7.2 8-8.8"
          fill="none"
          stroke="#fff"
          strokeWidth="1.05"
          strokeLinecap="round"
        />
      </>
    ),
  },

  // ENRICH — open book with white pages
  enrich: {
    img: '/images/vertical-enrich.webp',
    color: '#3BAFBF',
    art: (
      <>
        <path d="M2.8 5.4c3.4-1.1 6.5-.6 9.2 1.3 2.7-1.9 5.8-2.4 9.2-1.3v13.4c-3.4-1.1-6.5-.6-9.2 1.3-2.7-1.9-5.8-2.4-9.2-1.3V5.4Z" />
        <path d="M4.5 7c2.4-.5 4.6-.1 6.5 1.1V18c-1.9-1.2-4.1-1.6-6.5-1.1V7Z" fill="#fff" />
        <path d="M19.5 7c-2.4-.5-4.6-.1-6.5 1.1V18c1.9-1.2 4.1-1.6 6.5-1.1V7Z" fill="#fff" />
      </>
    ),
  },

  // EMPOWER — figure with arms raised
  empower: {
    img: '/images/vertical-empower.webp',
    color: '#E0459A',
    art: (
      <>
        <circle cx="12" cy="5.6" r="2.75" />
        <path d="M9.4 11c0-1.3 1-2.1 2.6-2.1s2.6.8 2.6 2.1v8.4c0 .6-.5 1-1.2 1h-2.8c-.7 0-1.2-.4-1.2-1V11Z" />
        <path
          d="M10.1 10.9 3.5 6.6M13.9 10.9l6.6-4.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
        />
      </>
    ),
  },

  // PROJECTS — skyline with a health cross
  projects: {
    color: '#C88A16',
    art: (
      <>
        <path d="M2.8 20.4v-8l4-1.4v9.4h-4Z" />
        <path d="M8.2 20.4V6.6l6.2-2v15.8H8.2Z" />
        <path d="M15.8 20.4v-9h5v9h-5Z" />
        <path
          d="M10.65 7.7h1.3v1.35h1.35v1.3h-1.35v1.35h-1.3v-1.35H9.3v-1.3h1.35V7.7Z"
          fill="#fff"
        />
        <path d="M1.6 20.6h20.8v1.2H1.6Z" />
      </>
    ),
  },

  amrit: {
    color: '#0E8C7F',
    art: (
      <>
        <path d="M12 2.9 17.4 9.5a6.9 6.9 0 1 1-10.8 0L12 2.9Z" />
        <path
          d="M8.6 14.6c.9 1.4 2.1 2.1 3.6 2.1"
          fill="none"
          stroke="#fff"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      </>
    ),
  },

  oneness: {
    color: '#7B2CA8',
    art: (
      <>
        <path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8Zm0 1.9c1.8 2.2 2.8 4.7 2.8 7.5s-1 5.3-2.8 7.5c-1.8-2.2-2.8-4.7-2.8-7.5s1-5.3 2.8-7.5Z" />
        <path d="M3.4 9.4h17.2v1.6H3.4zM3.4 13h17.2v1.6H3.4z" />
      </>
    ),
  },
};

export const CardIllustration: React.FC<CardIllustrationProps> = ({
  pillar,
  roundedClass = 'rounded-[18px]',
}) => {
  const mark = MARKS[pillar.id] ?? MARKS.oneness;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${roundedClass} select-none flex items-center justify-center p-4 sm:p-5`}
      style={{
        background: `linear-gradient(158deg, ${pillar.accentA} 0%, ${pillar.accentB} 100%)`,
      }}
    >
      {/* Single soft highlight — one gradient, no extra layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Vertical mark on a pale disc, as in the supplied artwork. The card
          carries no text — the pillar is named in the hero copy alongside it,
          so the mark is left to speak on its own. */}
      <div className="relative w-full flex items-center justify-center">
        <div className="relative grid place-items-center w-[62%] aspect-square rounded-full bg-white/95 shadow-sm overflow-hidden">
          {mark.img ? (
            /* The artwork carries its own pale disc; the circular container
               clips the square's white corners so it sits on the gradient. */
            <img
              src={mark.img}
              alt={`${pillar.label} icon`}
              className="w-full h-full object-cover"
              width={512}
              height={512}
              decoding="async"
              draggable={false}
            />
          ) : (
            <svg
              className="w-[58%] h-[58%]"
              viewBox="0 0 24 24"
              fill={mark.color}
              color={mark.color}
              role="img"
              aria-label={`${pillar.label} icon`}
            >
              {mark.art}
            </svg>
          )}
        </div>
      </div>

    </div>
  );
};
