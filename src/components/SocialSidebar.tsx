import React from 'react';
import { Instagram, Youtube, Facebook } from 'lucide-react';

// Custom clean SVG for Spotify & X to match exact official ghost circular iconography
const SpotifyIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.809-.87 7.076-.496 9.722 1.113.294.18.387.563.207.857zm1.224-2.72c-.226.368-.71.482-1.078.256-2.69-1.653-6.79-2.131-9.97-1.165-.413.125-.85-.11-.975-.523-.125-.413.11-.85.523-.975 3.633-1.103 8.147-.568 11.244 1.33.368.225.482.709.256 1.077zm.105-2.835C14.692 8.95 8.082 8.73 4.708 9.755c-.494.15-1.02-.128-1.17-.622-.15-.494.128-1.02.622-1.17 3.947-1.198 11.238-.944 15.11 1.353.444.263.59.839.327 1.283-.264.444-.84.59-1.283.327z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const SocialSidebar: React.FC = () => {
  const socialLinks = [
    {
      name: 'Instagram',
      icon: <Instagram className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      url: 'https://instagram.com',
      ariaLabel: 'Follow Sant Nirankari Mission on Instagram',
      colorHover: 'hover:text-pink-400 hover:border-pink-400/60 hover:shadow-[0_0_15px_rgba(244,114,182,0.35)]',
    },
    {
      name: 'YouTube',
      icon: <Youtube className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      url: 'https://youtube.com',
      ariaLabel: 'Watch Sant Nirankari Mission on YouTube',
      colorHover: 'hover:text-red-400 hover:border-red-400/60 hover:shadow-[0_0_15px_rgba(248,113,113,0.35)]',
    },
    {
      name: 'Spotify',
      icon: <SpotifyIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      url: 'https://spotify.com',
      ariaLabel: 'Listen to Nirankari Spiritual Discourses & Bhajans on Spotify',
      colorHover: 'hover:text-emerald-400 hover:border-emerald-400/60 hover:shadow-[0_0_15px_rgba(52,211,153,0.35)]',
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      url: 'https://facebook.com',
      ariaLabel: 'Connect with Sant Nirankari Mission on Facebook',
      colorHover: 'hover:text-blue-400 hover:border-blue-400/60 hover:shadow-[0_0_15px_rgba(96,165,250,0.35)]',
    },
    {
      name: 'X (Twitter)',
      icon: <XIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      url: 'https://x.com',
      ariaLabel: 'Follow Sant Nirankari Mission on X',
      colorHover: 'hover:text-white hover:border-white/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.35)]',
    },
  ];

  return (
    <aside
      id="hero-social-sidebar"
      aria-label="Social Media Connections"
      /* left-[38px] centres the 40px icon column on x=58 — the same vertical axis as
         the 52px header logo (32px inset + 26px radius), so logo and icons read as
         one aligned rail down the left edge. */
      className="fixed left-3 sm:left-5 md:left-[15px] top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3.5 select-none pointer-events-auto"
    >
      {/* Top Vertical Divider Line */}
      <div className="w-[1px] h-12 lg:h-16 bg-gradient-to-b from-transparent via-white/35 to-white/60" />

      {/* Social Icons Stack */}
      <div className="flex flex-col items-center gap-2.5">
        {socialLinks.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            title={item.name}
            className={`group relative w-9 h-9 lg:w-10 lg:h-10 rounded-full border border-white/20 bg-black/25 backdrop-blur-md flex items-center justify-center text-white/75 transition-all duration-300 hover:scale-115 hover:bg-white/15 active:scale-95 ${item.colorHover}`}
          >
            {item.icon}

            {/* Subtle Tooltip on Hover */}
            <span className="absolute left-full ml-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg border border-white/15">
              {item.name}
            </span>
          </a>
        ))}
      </div>

      {/* Bottom Vertical Divider Line */}
      <div className="w-[1px] h-12 lg:h-16 bg-gradient-to-b from-white/60 via-white/35 to-transparent" />
    </aside>
  );
};
