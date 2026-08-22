import React, { useState } from 'react';

export interface DevotionalLeader {
  id: 'mata-sudiksha-ji' | 'rajpita-ramit-ji';
  name: string;
  honorificTitle: string;
  avatarTone: string;
  glowColor: string;
  portraitType: 'mata-ji' | 'rajpita-ji';
  /** Official photograph; when present the card renders it full-bleed
      instead of the vector portrait. */
  photoUrl?: string;
}

export const DEVOTIONAL_LEADERS: DevotionalLeader[] = [
  {
    id: 'mata-sudiksha-ji',
    name: 'Satguru Mata Sudiksha Ji Maharaj',
    honorificTitle: 'Sixth Spiritual Guide · Sant Nirankari Mission',
    avatarTone: 'from-amber-500 via-rose-500 to-indigo-900',
    glowColor: '#f59e0b',
    portraitType: 'mata-ji',
    photoUrl: '/images/satguru-mata-sudiksha-ji.jpg',
  },
  {
    id: 'rajpita-ramit-ji',
    name: 'Nirankari Rajpita Ramit Ji',
    honorificTitle: 'Spiritual Guide · Sant Nirankari Mission',
    avatarTone: 'from-sky-500 via-blue-600 to-slate-900',
    glowColor: '#38bdf8',
    portraitType: 'rajpita-ji',
    photoUrl: '/images/nirankari-rajpita-ramit-ji.jpg',
  },
];

interface DevotionalPhotoCardProps {
  leader: DevotionalLeader;
  roundedClass?: string;
  isFrontFacing?: boolean;
}

export const DevotionalPhotoCard: React.FC<DevotionalPhotoCardProps> = ({
  leader,
  roundedClass = 'rounded-[32px]',
  isFrontFacing = false,
}) => {
  const isMataJi = leader.portraitType === 'mata-ji';

  if (leader.photoUrl) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${roundedClass} select-none bg-white flex flex-col justify-end`}
      >
        <img
          src={leader.photoUrl}
          alt={leader.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: '50% 18%' }}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${roundedClass} select-none bg-white flex flex-col justify-end`}
    >
      {/* Clean Plain White Background */}
      <div className="absolute inset-0 bg-white">
        {/* Dignified Devotional Portrait Figure Rendering (Clean, without halo rings or colored glow) */}
        <div className="absolute inset-0 flex items-center justify-center pt-2">
          {isMataJi ? (
            /* Mata Sudiksha Ji Maharaj Serene Portrait Art */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Graceful Portrait Vector Avatar with White Dupatta & Benevolent Presence */}
              <svg
                className="w-40 h-52 drop-shadow-md"
                viewBox="0 0 200 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shoulders & White Traditional Attire */}
                <path
                  d="M30 250 C30 180, 60 145, 100 145 C140 145, 170 180, 170 250 Z"
                  fill="url(#attire-white-mata)"
                />
                <path
                  d="M50 250 C55 190, 75 160, 100 160 C125 160, 145 190, 150 250 Z"
                  fill="#f8fafc"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />

                {/* Elegant White Dupatta / Shawl Draping */}
                <path
                  d="M45 140 C35 170, 32 210, 30 250 C50 250, 65 210, 70 170 Z"
                  fill="#f1f5f9"
                  opacity="0.95"
                />
                <path
                  d="M155 140 C165 170, 168 210, 170 250 C150 250, 135 210, 130 170 Z"
                  fill="#f1f5f9"
                  opacity="0.95"
                />
                {/* Dupatta Golden Border Detail */}
                <path
                  d="M45 140 C35 170, 32 210, 30 250"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M155 140 C165 170, 168 210, 170 250"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Neck */}
                <path d="M90 120 L110 120 L108 145 L92 145 Z" fill="#e8bc9e" />

                {/* Head / Face */}
                <ellipse cx="100" cy="85" rx="30" ry="38" fill="#fcd7b6" />

                {/* Hair & Draping Head Covering */}
                <path
                  d="M66 85 C66 48, 80 40, 100 40 C120 40, 134 48, 134 85 C134 98, 130 115, 126 125 C118 100, 115 65, 100 65 C85 65, 82 100, 74 125 C70 115, 66 98, 66 85 Z"
                  fill="#2d1b14"
                />
                {/* Gentle White Head Covering Veil */}
                <path
                  d="M62 80 C62 38, 78 30, 100 30 C122 30, 138 38, 138 80 C138 105, 148 135, 155 150 C140 145, 132 120, 130 90 C125 45, 75 45, 70 90 C68 120, 60 145, 45 150 C52 135, 62 105, 62 80 Z"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <path
                  d="M62 80 C62 38, 78 30, 100 30 C122 30, 138 38, 138 80"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Gentle Eyes & Serene Expression */}
                <path
                  d="M84 82 Q90 79 96 82"
                  stroke="#451a03"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M104 82 Q110 79 116 82"
                  stroke="#451a03"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Gentle Tilak / Bindi */}
                <circle cx="100" cy="74" r="1.8" fill="#b91c1c" />
                {/* Serene Smile */}
                <path
                  d="M93 102 Q100 107 107 102"
                  stroke="#9a3412"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="attire-white-mata" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            /* Nirankari Rajpita Ramit Ji Serene Portrait Art */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Graceful Portrait Vector Avatar with Traditional White Kurta */}
              <svg
                className="w-40 h-52 drop-shadow-md"
                viewBox="0 0 200 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shoulders & White Kurta Attire */}
                <path
                  d="M25 250 C25 175, 55 140, 100 140 C145 140, 175 175, 175 250 Z"
                  fill="url(#attire-white-rajpita)"
                />
                {/* Kurta Nehru Collar / Placket */}
                <path d="M96 130 L104 130 L104 210 L96 210 Z" fill="#e2e8f0" />
                <line
                  x1="100"
                  y1="130"
                  x2="100"
                  y2="210"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                <circle cx="100" cy="145" r="1.5" fill="#64748b" />
                <circle cx="100" cy="165" r="1.5" fill="#64748b" />
                <circle cx="100" cy="185" r="1.5" fill="#64748b" />

                {/* Neck */}
                <path d="M88 115 L112 115 L110 140 L90 140 Z" fill="#deb897" />

                {/* Head / Face */}
                <ellipse cx="100" cy="85" rx="31" ry="38" fill="#fcd7b6" />

                {/* Neat Styled Hair */}
                <path
                  d="M68 80 C68 46, 80 38, 100 38 C120 38, 132 46, 132 80 C132 86, 131 92, 129 95 C126 80, 122 55, 100 55 C78 55, 74 80, 71 95 C69 92, 68 86, 68 80 Z"
                  fill="#1e1e24"
                />

                {/* Dignified Beard & Moustache */}
                <path
                  d="M74 92 C74 122, 85 132, 100 132 C115 132, 126 122, 126 92 C122 105, 115 124, 100 124 C85 124, 78 105, 74 92 Z"
                  fill="#24242e"
                  opacity="0.9"
                />
                {/* Moustache */}
                <path
                  d="M86 98 Q100 104 114 98 Q100 95 86 98 Z"
                  fill="#181820"
                />

                {/* Calm Eyes & Expression */}
                <path
                  d="M83 78 Q90 75 97 78"
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M103 78 Q110 75 117 78"
                  stroke="#1e293b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Gentle Kind Smile */}
                <path
                  d="M93 106 Q100 110 107 106"
                  stroke="#854d0e"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="attire-white-rajpita" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Bottom Vignette for Clean Label Readability */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Minimalist Name Caption Bar ONLY (No badge, no headings, no body description, no button) */}
      <div className="relative z-10 p-3.5 sm:p-4 text-center">
        <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/20 shadow-lg">
          <p className="font-artistic-serif text-white font-medium text-xs sm:text-sm tracking-wider whitespace-nowrap drop-shadow">
            {leader.name}
          </p>
        </div>
      </div>
    </div>
  );
};
