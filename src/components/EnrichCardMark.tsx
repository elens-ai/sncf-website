import React, { useRef, useState, useEffect } from 'react';

interface EnrichCardMarkProps {
  isActive?: boolean;
  className?: string;
}

const WORD_TEXT = ['Education', 'Scholarships', 'Literacy', 'Knowledge'];
const WORDS = WORD_TEXT.map((text, i) => ({
  text,
  base: -90 + (360 / WORD_TEXT.length) * i,
}));

const BOOK_OPEN_MS = 460;
const BURST_MS = 550;
const REVOLUTION_MS = 13000;

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export const EnrichCardMark: React.FC<EnrichCardMarkProps> = ({
  isActive = false,
  className = '',
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const iconStageRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [isHovered, setIsHovered] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Active if passed as active card OR hovered by user
  const effectiveActive = isActive || isHovered;

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const settledTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Orbit radius relative to iconStage width
  const ORBIT_RATIO = 0.62;

  const getRadius = () => {
    if (iconStageRef.current) {
      return iconStageRef.current.getBoundingClientRect().width * ORBIT_RATIO;
    }
    return 48;
  };

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (effectiveActive) {
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
      setIsSettled(false);

      settledTimerRef.current = setTimeout(() => {
        setIsSettled(true);
      }, reduceMotion ? 0 : 2000);

      if (reduceMotion) {
        const R = getRadius();
        WORDS.forEach((w, idx) => {
          const el = wordsRef.current[idx];
          if (el) {
            const rad = (w.base * Math.PI) / 180;
            el.style.transform = `translate(${Math.cos(rad) * R}px, ${Math.sin(rad) * R}px)`;
            el.style.opacity = '1';
          }
        });
        return;
      }

      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        const t = now - startTimeRef.current;
        const R = getRadius();

        WORDS.forEach((w, idx) => {
          const el = wordsRef.current[idx];
          if (!el) return;

          const localT = Math.max(0, t - BOOK_OPEN_MS);
          const burstProgress = Math.min(1, localT / BURST_MS);
          const radius = R * easeOutCubic(burstProgress);

          const spinT = Math.max(0, localT - BURST_MS);
          const angle = w.base + (spinT / REVOLUTION_MS) * 360;
          const rad = (angle * Math.PI) / 180;

          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          el.style.transform = `translate(${x}px, ${y}px)`;
          el.style.opacity = `${burstProgress}`;
        });

        rafRef.current = requestAnimationFrame(tick);
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
      setIsSettled(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      WORDS.forEach((_, idx) => {
        const el = wordsRef.current[idx];
        if (el) {
          el.style.transform = 'translate(0px, 0px)';
          el.style.opacity = '0';
        }
      });

      if (tiltRef.current) {
        tiltRef.current.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    };
  }, [effectiveActive]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    setIsHovered(true);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    setIsHovered(false);
    if (tiltRef.current) {
      tiltRef.current.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!sceneRef.current || !tiltRef.current) return;

    const rect = sceneRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const max = 12;
    const rotY = Math.max(-max, Math.min(max, dx * max));
    const rotX = Math.max(-max, Math.min(max, -dy * max));

    tiltRef.current.style.transition = 'transform 0.12s ease-out';
    tiltRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.05)`;
  };

  return (
    <div
      ref={sceneRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      className={`relative flex items-center justify-center pointer-events-auto cursor-pointer select-none ${className}`}
      style={{
        perspective: '1100px',
        width: '100%',
        height: '100%',
      }}
      title="ENRICH"
    >
      {/* Soft translucent white backing halo circle for maximum contrast against sky/hills */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          width: '118px',
          height: '118px',
          background:
            'radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.45) 55%, rgba(255, 255, 255, 0) 100%)',
          backdropFilter: 'blur(3px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 24px -4px rgba(18, 121, 140, 0.15), inset 0 0 16px rgba(255, 255, 255, 0.6)',
        }}
      />

      {/* 3D Tilting Stage Container */}
      <div
        ref={tiltRef}
        className="enrich-tilt relative flex flex-col items-center justify-center will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          gap: '14px',
        }}
      >
        {/* Book Icon Stage */}
        <div
          ref={iconStageRef}
          className="relative flex items-center justify-center"
          style={{
            width: '68px',
            aspectRatio: '2567 / 1933',
          }}
        >
          {/* Soft Teal Radial Glow Blooming behind book while active */}
          <div
            className="enrich-glow absolute left-1/2 top-1/2 pointer-events-none rounded-full transition-all duration-700 ease-out"
            style={{
              width: '136px',
              height: '136px',
              transform: effectiveActive
                ? 'translate(-50%, -50%) scale(1)'
                : 'translate(-50%, -50%) scale(0.85)',
              opacity: effectiveActive ? 1 : 0,
              background:
                'radial-gradient(circle, rgba(43, 173, 195, 0.40) 0%, rgba(43, 173, 195, 0.18) 45%, rgba(43, 173, 195, 0) 72%)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }}
          />

          {/* Closed Book SVG (Idle State: teal outline #2badc3, transparent fill) */}
          <svg
            className="enrich-book-closed absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 264 200"
            aria-hidden="true"
            style={{
              color: '#2badc3',
              transformOrigin: '50% 88%',
              transform: effectiveActive
                ? 'translateZ(28px) rotate(-11deg) scale(0.86)'
                : 'translateZ(28px) rotate(0deg) scale(1)',
              opacity: effectiveActive ? 0 : 1,
              transition:
                'opacity 0.55s ease, transform 0.6s cubic-bezier(0.34, 1.28, 0.64, 1)',
              filter: 'drop-shadow(0 6px 14px rgba(18, 121, 140, 0.22))',
            }}
          >
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="13"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <rect x="47" y="10" width="10" height="26" rx="3" />
              <rect x="54" y="24" width="156" height="158" rx="6" />
              <line x1="54" y1="24" x2="54" y2="182" />
            </g>
            <path d="M124 0 L124 46 L132 35 L140 46 L140 0 Z" fill="currentColor" stroke="none" />
          </svg>

          {/* Open Book SVG (Active State: 2D crossfade + slight rotate/scale) */}
          <svg
            className="enrich-book-icon absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 317 2567 1933"
            aria-hidden="true"
            style={{
              color: '#2badc3',
              transformOrigin: '50% 88%',
              transform: effectiveActive
                ? 'translateZ(28px) rotate(0deg) scale(1)'
                : 'translateZ(28px) rotate(7deg) scale(0.88)',
              opacity: effectiveActive ? 1 : 0,
              transition:
                'opacity 0.55s ease 0.16s, transform 0.6s cubic-bezier(0.34, 1.28, 0.64, 1) 0.16s',
              filter: 'drop-shadow(0 8px 16px rgba(18, 121, 140, 0.25))',
            }}
          >
            <g transform="translate(0,2567) scale(0.1,-0.1)" fill="currentColor" stroke="none">
              <path
                d="M5589 22195 c-3 -3 -73 -7 -155 -10 -82 -2 -189 -8 -239 -14 -49 -5
-187 -17 -305 -25 -118 -9 -234 -20 -258 -26 -23 -5 -56 -10 -72 -10 -16 0
-39 -4 -52 -9 -13 -5 -99 -17 -193 -26 -93 -9 -192 -23 -220 -31 -27 -7 -107
-20 -177 -29 -71 -8 -152 -21 -180 -30 -29 -8 -98 -21 -153 -29 -56 -9 -119
-22 -141 -29 -21 -8 -64 -18 -94 -21 -89 -11 -161 -26 -220 -46 -30 -10 -81
-21 -113 -24 -31 -4 -81 -15 -110 -26 -28 -11 -83 -25 -121 -31 -38 -6 -88
-19 -112 -29 -23 -10 -67 -23 -96 -29 -29 -5 -73 -17 -98 -26 -25 -9 -74 -23
-110 -30 -36 -8 -86 -23 -112 -34 -26 -11 -64 -23 -85 -27 -21 -3 -65 -17 -98
-29 -33 -13 -87 -31 -120 -40 -33 -9 -69 -22 -80 -29 -11 -8 -36 -17 -55 -21
-19 -4 -51 -16 -70 -26 -19 -10 -63 -27 -96 -38 -34 -10 -78 -31 -98 -46 l-36
-27 -2 -715 c-3 -804 4 -734 -81 -747 -78 -11 -301 -68 -363 -91 -33 -13 -77
-26 -97 -30 -19 -4 -57 -18 -83 -31 -26 -13 -55 -24 -64 -24 -9 0 -37 -13 -61
-30 -24 -16 -50 -30 -57 -30 -17 0 -121 -63 -176 -105 -59 -45 -155 -146 -172
-180 -8 -16 -22 -43 -30 -58 -9 -15 -20 -56 -25 -90 -14 -91 -7 -15173 7
-15187 7 -7 1688 -11 5540 -13 5510 -2 5529 -2 5560 -22 18 -11 78 -55 134
-98 57 -44 110 -81 119 -85 9 -3 29 -16 44 -29 16 -13 41 -26 55 -29 15 -4 36
-14 47 -24 11 -10 38 -23 60 -30 22 -7 49 -21 60 -31 11 -9 43 -23 70 -30 28
-6 68 -22 90 -34 22 -13 59 -25 82 -29 23 -3 62 -15 87 -26 25 -10 70 -22 99
-26 28 -4 99 -18 157 -31 96 -23 131 -26 395 -30 160 -2 331 0 380 5 105 11
379 68 415 87 14 7 51 18 84 25 32 7 79 23 104 36 25 13 52 24 60 24 8 0 34
11 56 24 23 13 53 26 68 30 16 3 49 20 75 36 26 17 51 30 56 30 5 0 22 10 37
23 15 12 40 30 56 39 64 39 117 76 194 136 l82 62 5391 0 c2965 0 5394 3 5399
8 4 4 7 3431 6 7614 -3 6926 -4 7608 -19 7624 -9 11 -22 34 -29 52 -14 35
-164 183 -211 207 -15 9 -44 26 -64 39 -20 14 -49 27 -65 31 -16 3 -34 13 -41
21 -6 8 -37 21 -68 30 -31 9 -72 24 -91 34 -19 10 -60 23 -91 29 -30 6 -87 23
-125 36 -38 14 -82 25 -97 25 -18 0 -39 11 -58 29 l-29 29 0 761 c0 753 0 760
-20 779 -22 21 -63 39 -145 67 -163 55 -220 77 -230 85 -6 5 -36 16 -67 24
-31 8 -69 21 -84 29 -16 8 -58 21 -94 27 -36 7 -82 21 -103 32 -20 10 -67 25
-105 33 -37 7 -92 23 -122 34 -30 11 -64 20 -75 21 -11 0 -56 11 -100 25 -43
14 -97 28 -120 31 -22 3 -76 17 -120 30 -44 13 -117 31 -162 39 -45 7 -91 19
-102 25 -11 6 -66 17 -122 26 -56 8 -117 21 -137 29 -19 8 -85 22 -146 30 -61
8 -135 21 -164 29 -29 8 -95 20 -145 26 -51 7 -148 22 -217 35 -69 13 -180 29
-248 35 -67 6 -135 15 -150 20 -34 10 -183 27 -412 46 -96 8 -222 19 -280 25
-196 19 -374 23 -950 24 -565 0 -771 -5 -960 -25 -52 -5 -178 -16 -280 -25
-102 -8 -225 -22 -275 -31 -49 -9 -176 -26 -280 -38 -105 -13 -201 -28 -213
-35 -13 -7 -64 -17 -115 -22 -51 -5 -121 -18 -157 -29 -36 -10 -112 -26 -170
-35 -58 -9 -123 -23 -145 -31 -22 -9 -79 -22 -127 -30 -48 -8 -110 -23 -138
-34 -28 -11 -63 -20 -78 -20 -15 0 -65 -14 -112 -30 -46 -17 -92 -30 -102 -30
-10 0 -44 -9 -76 -21 -31 -12 -82 -27 -112 -33 -30 -7 -77 -22 -103 -34 -26
-12 -65 -24 -85 -28 -20 -4 -61 -17 -90 -30 -29 -13 -69 -26 -90 -30 -20 -4
-57 -17 -83 -30 -25 -12 -63 -26 -85 -29 -21 -4 -53 -16 -71 -27 -17 -10 -55
-26 -85 -34 -29 -9 -60 -22 -68 -29 -8 -8 -37 -19 -65 -26 -27 -7 -62 -21 -77
-31 -15 -10 -51 -26 -79 -34 -29 -9 -62 -22 -73 -30 -12 -7 -41 -20 -64 -28
-24 -9 -54 -24 -68 -35 -13 -10 -41 -22 -61 -26 -21 -3 -47 -15 -58 -25 -11
-10 -38 -24 -60 -31 -22 -7 -49 -21 -60 -30 -11 -9 -38 -22 -60 -29 -22 -7
-49 -20 -60 -30 -11 -10 -38 -23 -60 -30 -22 -7 -48 -19 -57 -27 -10 -9 -39
-26 -65 -39 -26 -13 -70 -37 -98 -54 -27 -16 -72 -41 -100 -55 -105 -56 -138
-75 -154 -89 -9 -7 -37 -24 -63 -36 -27 -12 -48 -26 -48 -30 0 -5 -10 -12 -22
-15 -13 -4 -39 -19 -58 -34 -19 -15 -50 -33 -67 -40 -18 -8 -33 -17 -33 -22 0
-5 -17 -18 -37 -29 -21 -12 -54 -32 -73 -45 -19 -13 -48 -34 -65 -45 -16 -11
-46 -32 -65 -45 -19 -13 -51 -34 -70 -45 -19 -11 -53 -34 -75 -51 -22 -16 -64
-46 -92 -66 -29 -20 -53 -39 -53 -43 0 -3 -16 -14 -35 -23 -19 -9 -35 -21 -35
-26 0 -5 -15 -18 -33 -29 -19 -11 -44 -28 -57 -38 -25 -21 -102 -83 -140 -114
-109 -87 -208 -171 -219 -184 -8 -10 -29 -16 -52 -16 -32 0 -46 8 -95 55 -32
30 -61 55 -65 55 -4 0 -25 15 -47 33 -21 17 -56 46 -76 62 -21 17 -68 55 -106
85 -88 71 -193 150 -234 175 -18 11 -47 31 -64 45 -17 14 -47 36 -67 50 -20
14 -48 35 -63 46 -15 12 -41 30 -58 40 -17 11 -65 42 -106 69 -42 28 -89 58
-105 67 -15 10 -47 30 -70 45 -24 16 -80 50 -125 77 -46 27 -91 56 -101 65
-18 16 -75 47 -167 92 -25 12 -52 27 -60 34 -8 7 -60 37 -115 65 -55 29 -122
66 -150 81 -27 16 -66 35 -85 44 -19 8 -46 22 -60 30 -27 16 -48 26 -125 60
-27 13 -89 41 -136 64 -48 22 -93 41 -101 41 -9 0 -27 9 -41 20 -15 12 -50 28
-79 36 -29 9 -63 24 -75 34 -13 10 -39 21 -58 24 -19 4 -63 20 -98 36 -34 17
-72 30 -83 30 -12 0 -33 9 -47 20 -13 11 -49 26 -80 34 -30 8 -70 22 -88 32
-19 9 -54 23 -79 30 -54 16 -152 48 -240 81 -36 13 -89 28 -117 33 -29 5 -70
18 -90 28 -21 11 -69 25 -108 32 -38 7 -88 21 -110 31 -22 10 -70 23 -106 28
-37 6 -84 18 -105 27 -22 9 -70 22 -109 29 -38 8 -114 25 -169 39 -54 14 -114
26 -133 26 -18 0 -61 9 -95 21 -34 11 -111 27 -172 35 -61 7 -140 21 -176 29
-36 8 -123 21 -195 30 -71 8 -139 18 -150 21 -46 12 -153 26 -360 45 -121 11
-263 24 -315 30 -52 5 -147 13 -210 16 -155 8 -1294 15 -1301 8z m1091 -713
c349 -21 639 -42 695 -51 115 -19 211 -31 324 -41 63 -6 118 -13 123 -16 13
-8 227 -44 263 -44 17 0 58 -9 90 -20 32 -11 99 -25 149 -31 50 -5 116 -19
146 -29 30 -10 93 -25 140 -33 47 -9 113 -25 147 -36 34 -12 72 -21 84 -21 12
0 60 -13 108 -29 47 -16 106 -32 131 -36 25 -4 60 -16 79 -26 19 -10 55 -21
80 -25 25 -3 69 -17 96 -29 28 -12 74 -28 104 -34 30 -6 59 -15 65 -20 6 -5
43 -18 81 -30 39 -12 81 -28 95 -36 14 -7 52 -21 85 -30 33 -10 74 -25 90 -35
17 -10 46 -21 65 -25 19 -4 49 -15 65 -25 17 -10 55 -26 85 -36 30 -9 62 -23
71 -30 8 -8 37 -20 63 -28 26 -8 55 -21 64 -29 10 -8 40 -22 69 -31 28 -10 57
-24 63 -32 7 -7 33 -20 59 -28 25 -7 68 -25 95 -40 27 -14 55 -26 61 -26 7 0
18 -7 25 -14 6 -8 33 -23 58 -32 26 -10 56 -25 67 -35 20 -17 58 -38 150 -83
28 -13 57 -31 64 -39 7 -9 25 -19 41 -22 16 -4 46 -20 66 -36 20 -16 42 -29
48 -29 6 -1 43 -21 81 -45 39 -25 91 -56 117 -70 26 -13 50 -30 54 -36 3 -6
21 -18 38 -26 17 -8 54 -30 81 -48 28 -19 57 -39 65 -45 8 -5 51 -34 95 -65
44 -30 94 -64 110 -75 65 -41 124 -85 125 -92 0 -4 15 -15 33 -24 17 -9 46
-28 62 -41 51 -41 178 -141 220 -173 100 -77 171 -139 183 -161 10 -19 13
-882 15 -4364 2 -3993 3 -4340 18 -4340 9 0 65 52 123 115 185 199 255 270
264 270 5 0 15 -6 21 -14 8 -10 10 -770 9 -2882 l-3 -2869 -29 -3 c-16 -2 -54
8 -86 22 -32 14 -66 26 -77 26 -11 0 -36 11 -55 24 -19 13 -51 26 -71 30 -21
4 -59 18 -85 31 -26 13 -67 29 -92 35 -25 7 -58 20 -75 30 -16 10 -48 22 -70
26 -22 3 -58 17 -80 29 -22 13 -56 26 -75 29 -20 3 -67 19 -105 36 -39 16 -79
30 -90 30 -11 0 -29 6 -40 13 -11 8 -47 21 -80 31 -33 9 -76 25 -96 36 -20 10
-66 26 -103 34 -36 9 -77 22 -89 31 -12 8 -47 19 -77 26 -30 6 -67 18 -83 26
-15 7 -60 22 -100 33 -39 10 -99 28 -132 39 -128 43 -193 63 -262 81 -40 11
-85 26 -101 34 -15 8 -57 20 -92 26 -35 6 -76 18 -90 25 -14 7 -57 20 -96 28
-39 8 -80 20 -93 26 -12 7 -62 21 -111 32 -50 10 -124 30 -164 44 -41 14 -84
25 -96 25 -11 0 -46 9 -76 20 -31 10 -93 26 -139 35 -46 8 -98 22 -117 29 -18
8 -73 21 -123 30 -49 9 -111 24 -137 32 -26 9 -76 19 -110 24 -35 5 -106 20
-158 34 -52 13 -131 32 -175 41 -176 36 -213 44 -280 55 -38 7 -96 18 -128 26
-31 8 -94 19 -140 25 -45 6 -116 19 -157 29 -41 10 -124 24 -185 30 -60 7
-130 18 -155 25 -49 15 -168 31 -300 41 -47 3 -99 12 -116 19 -17 7 -96 18
-175 24 -143 12 -260 24 -394 41 -406 52 -1557 72 -2150 37 -261 -15 -352 -24
-465 -47 -25 -5 -79 -12 -120 -15 -130 -11 -243 -26 -300 -41 -30 -7 -109 -21
-175 -29 -66 -9 -138 -23 -160 -31 -22 -8 -78 -21 -125 -28 -47 -7 -119 -22
-160 -34 -41 -11 -109 -28 -150 -37 -41 -10 -80 -21 -85 -26 -6 -4 -47 -15
-90 -24 -44 -9 -85 -21 -90 -25 -6 -5 -42 -16 -80 -26 -39 -9 -83 -25 -100
-34 -16 -10 -50 -21 -75 -25 -25 -4 -68 -18 -97 -31 -28 -13 -58 -24 -66 -24
-8 0 -35 -11 -61 -25 -55 -29 -69 -31 -90 -9 -15 14 -16 691 -16 7305 l0 7291
28 28 c20 20 48 32 102 44 41 9 103 28 137 42 34 13 73 24 88 24 15 0 54 11
88 24 34 14 89 30 122 36 33 6 83 20 110 30 28 10 81 24 119 30 38 6 91 20
118 30 28 10 75 22 106 25 32 4 84 15 117 25 33 11 114 28 181 40 66 11 134
24 150 30 25 8 113 23 264 46 25 3 53 11 63 16 10 5 55 13 100 18 127 14 227
28 282 40 28 6 120 18 205 27 85 8 184 19 220 23 224 28 409 42 797 59 89 3
165 10 169 14 10 10 674 1 884 -11z m13620 0 c499 -30 659 -42 775 -61 33 -5
121 -15 195 -20 74 -6 171 -18 215 -27 130 -25 175 -32 276 -43 52 -6 133 -19
180 -30 46 -11 111 -23 144 -27 33 -3 105 -17 160 -30 55 -12 123 -26 150 -29
28 -4 77 -15 110 -25 33 -10 101 -26 150 -35 50 -9 109 -23 131 -30 23 -8 73
-19 110 -26 38 -6 92 -20 119 -31 28 -11 77 -24 110 -29 33 -6 77 -19 97 -29
21 -11 67 -24 104 -30 36 -6 76 -17 88 -26 13 -8 54 -21 92 -29 80 -17 169
-57 178 -80 11 -30 7 -14584 -4 -14606 -14 -25 -43 -24 -93 5 -23 13 -58 27
-77 31 -19 4 -50 16 -68 26 -19 11 -55 24 -80 29 -26 6 -61 17 -78 25 -18 8
-60 22 -95 31 -35 9 -68 19 -74 23 -15 11 -93 34 -295 86 -36 9 -101 27 -145
40 -44 14 -100 27 -125 31 -42 6 -97 19 -180 43 -19 5 -73 15 -119 21 -46 6
-100 17 -120 25 -20 7 -99 21 -176 30 -77 9 -158 23 -180 30 -22 7 -98 18
-170 25 -127 11 -244 23 -395 41 -234 27 -392 32 -1025 32 -635 0 -836 -6
-1095 -33 -47 -5 -170 -16 -275 -25 -104 -8 -239 -24 -300 -35 -60 -11 -166
-25 -235 -31 -69 -5 -180 -21 -248 -35 -68 -13 -140 -24 -160 -24 -20 0 -91
-12 -157 -26 -66 -14 -156 -29 -200 -35 -44 -5 -112 -18 -152 -29 -40 -11
-109 -24 -155 -29 -46 -6 -108 -19 -138 -30 -30 -11 -93 -25 -138 -31 -46 -6
-111 -20 -145 -30 -34 -11 -96 -24 -137 -31 -41 -6 -97 -20 -125 -30 -27 -10
-78 -23 -113 -28 -35 -6 -89 -19 -120 -30 -31 -11 -87 -25 -123 -31 -37 -5
-86 -19 -110 -29 -24 -10 -69 -22 -99 -26 -29 -4 -73 -16 -97 -26 -23 -10 -69
-23 -102 -29 -33 -6 -98 -24 -145 -40 -47 -17 -96 -30 -108 -30 -13 0 -41 -9
-64 -19 -23 -10 -65 -24 -95 -30 -30 -7 -81 -22 -114 -35 -33 -13 -80 -27
-105 -31 -25 -4 -59 -16 -76 -26 -18 -11 -58 -24 -90 -30 -33 -6 -73 -19 -90
-30 -17 -10 -55 -23 -85 -30 -30 -6 -72 -19 -94 -30 -22 -10 -64 -23 -94 -30
-29 -6 -68 -19 -85 -29 -17 -10 -53 -23 -81 -29 -27 -6 -72 -22 -99 -36 -27
-14 -59 -25 -71 -25 -12 0 -43 -11 -68 -24 -25 -14 -63 -28 -84 -32 -21 -4
-65 -20 -99 -35 -34 -16 -67 -29 -75 -29 -8 0 -33 -9 -54 -21 -22 -11 -69 -29
-104 -40 -35 -10 -71 -25 -80 -33 -9 -7 -32 -17 -51 -21 -19 -4 -53 -18 -75
-30 -22 -12 -62 -28 -89 -34 -27 -7 -61 -20 -75 -30 -14 -10 -42 -22 -61 -26
-19 -4 -46 -15 -60 -25 -14 -9 -48 -25 -77 -34 -28 -9 -57 -24 -63 -32 -18
-21 -47 -17 -64 8 -14 20 -16 308 -16 2861 0 1937 3 2844 10 2858 17 30 55 24
78 -13 16 -28 83 -104 214 -248 13 -14 38 -44 57 -68 20 -26 37 -40 42 -35 6
6 9 1767 9 4341 0 3096 3 4337 11 4354 6 13 33 41 61 63 28 22 62 50 77 63 14
12 45 37 69 55 24 18 74 57 112 87 38 30 88 69 110 85 23 17 56 42 74 58 19
15 38 27 43 27 4 0 31 18 58 40 88 69 103 80 113 80 6 0 24 11 40 25 40 33
132 95 142 95 5 0 24 13 42 30 18 16 47 35 65 41 18 6 33 15 33 20 0 8 26 24
139 84 21 11 50 30 66 43 15 12 33 22 40 22 7 0 24 9 39 21 15 12 46 31 69 44
60 32 154 83 212 116 28 15 66 35 85 45 19 9 46 22 60 30 14 7 41 21 60 29 19
8 46 22 60 30 14 8 41 22 60 31 19 9 64 29 100 46 36 16 88 40 115 53 28 13
65 29 84 35 19 5 42 17 50 24 9 8 36 19 61 26 25 6 59 21 77 31 17 11 55 27
85 35 29 9 67 24 83 34 17 10 47 22 69 25 21 4 57 18 80 30 22 13 61 26 86 29
24 4 58 15 75 25 16 11 57 24 90 31 33 6 70 18 83 26 12 8 55 23 95 34 39 10
98 28 129 39 32 12 66 21 76 21 10 0 45 11 78 24 32 13 84 27 114 31 30 4 87
18 125 30 39 13 90 26 115 30 25 4 70 14 100 22 104 28 300 68 440 89 52 8
120 20 150 25 30 6 78 15 105 20 28 6 111 16 185 24 74 8 162 19 195 25 129
22 404 43 762 58 83 4 155 11 159 15 10 10 700 1 914 -11z"
              />
            </g>
          </svg>

          {/* Floating Orbiting Words Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {WORDS.map((w, idx) => (
              <div
                key={w.text}
                ref={(el) => {
                  wordsRef.current[idx] = el;
                }}
                className="absolute top-1/2 left-1/2 opacity-0 pointer-events-none will-change-transform"
                style={{
                  transform: 'translate(0px, 0px)',
                }}
              >
                <span className="absolute -translate-x-1/2 -translate-y-1/2 inline-block whitespace-nowrap">
                  <span
                    className="font-extrabold uppercase tracking-wider text-[8.5px] px-1.5 py-0.5 rounded-full"
                    style={{
                      color: '#12798c',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(43, 173, 195, 0.45)',
                      boxShadow: '0 2px 8px rgba(18, 121, 140, 0.22)',
                      textShadow: '0 0 10px rgba(43, 173, 195, 0.3)',
                    }}
                  >
                    {w.text}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Text "ENRICH" (Visible on closed book, fades out instantly on open, fades back in 2s later once settled) */}
        <div
          className="enrich-brand-text font-black tracking-widest text-center select-none pointer-events-none"
          style={{
            fontSize: '11px',
            letterSpacing: '0.16em',
            color: '#12798c',
            textShadow: '0 1px 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(43, 173, 195, 0.4)',
            transform: 'translateZ(28px)',
            opacity: !effectiveActive ? 1 : isSettled ? 1 : 0,
            transition: !effectiveActive
              ? 'opacity 0.5s ease'
              : isSettled
              ? 'opacity 0.7s ease'
              : 'opacity 0.3s ease',
          }}
        >
          ENRICH
        </div>
      </div>
    </div>
  );
};
