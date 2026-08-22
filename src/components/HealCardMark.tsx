import React, { useRef, useState, useEffect } from 'react';

interface HealCardMarkProps {
  className?: string;
  size?: number; // pixel width/height, defaults to 154 (25-30% larger than 118)
}

export const HealCardMark: React.FC<HealCardMarkProps> = ({
  className = '',
  size = 154,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState(false);
  const isHoverRef = useRef(false);

  const randomizeEntrance = () => {
    if (!stageRef.current) return 520;
    const leafEls = Array.from(
      stageRef.current.querySelectorAll('.heal-orbit-leaf')
    ) as SVGPathElement[];
    if (!leafEls.length) return 520;

    const order = leafEls.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    let maxPop = 0;
    order.forEach((el, i) => {
      const pop = i * (35 + Math.random() * 25);
      el.style.setProperty('--pop', `${pop}ms`);
      maxPop = Math.max(maxPop, pop);
    });

    return maxPop + 520;
  };

  const handleMouseEnter = () => {
    isHoverRef.current = true;
    setIsHover(true);
    randomizeEntrance();
  };

  const handleMouseLeave = () => {
    isHoverRef.current = false;
    setIsHover(false);
    if (stageRef.current) {
      const leafEls = stageRef.current.querySelectorAll(
        '.heal-orbit-leaf'
      ) as NodeListOf<SVGPathElement>;
      leafEls.forEach((el) => {
        el.style.setProperty('--pop', '0ms');
      });
    }
    if (cardRef.current) {
      cardRef.current.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || !cardRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * 34;
    const rotX = (0.5 - py) * 34;
    cardRef.current.style.transform = `perspective(900px) rotateX(${rotX.toFixed(
      2
    )}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.06)`;
  };

  const handleTouchStart = () => {
    handleMouseEnter();
    if (cardRef.current) {
      cardRef.current.style.transform =
        'perspective(900px) rotateX(6deg) rotateY(-6deg) scale(1.05)';
    }
  };

  const handleTouchEnd = () => {
    setTimeout(handleMouseLeave, 1600);
  };

  useEffect(() => {
    return () => {
      isHoverRef.current = false;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '900px',
      }}
      className={`relative flex items-center justify-center pointer-events-auto cursor-pointer select-none ${className}`}
      title="HEAL: Healthcare for every doorstep"
    >
      {/* 3D Tilting Card Surface with Mouse-driven RotateX/RotateY */}
      <div
        ref={cardRef}
        className={`relative w-full h-full flex items-center justify-center transition-transform duration-500 ease-out will-change-transform ${
          isHover ? 'is-hover heal-card-hovered' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
          transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* Real 3D Pop-Out Mark SVG (translateZ 46px -> 64px, dual drop-shadows) */}
        <svg
          viewBox="0 0 300 300"
          className="w-[88%] h-[88%] overflow-visible will-change-transform"
          style={{
            transform: isHover ? 'translateZ(64px)' : 'translateZ(46px)',
            filter: isHover
              ? 'drop-shadow(0 16px 20px rgba(160, 40, 20, 0.22)) drop-shadow(0 40px 52px rgba(160, 40, 20, 0.22))'
              : 'drop-shadow(0 10px 14px rgba(160, 40, 20, 0.16)) drop-shadow(0 26px 34px rgba(160, 40, 20, 0.16))',
            transition: 'filter .5s ease, transform .55s cubic-bezier(.22,1,.36,1)',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring: 7 Orbiting Leaves (Clockwise Rotation 16s) */}
          <g
            id="ringOuter"
            className="heal-ring-outer"
            style={{
              transformOrigin: '150px 150px',
            }}
          >
            <path
              className="heal-orbit-leaf outer"
              d="M 258.00,150.00 Q 259.99,163.86 249.76,170.40 Q 246.94,158.58 258.00,150.00 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 217.34,234.44 Q 207.75,244.64 196.25,240.71 Q 203.73,231.14 217.34,234.44 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 125.97,255.29 Q 112.02,254.15 107.91,242.72 Q 120.06,242.60 125.97,255.29 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 52.70,196.86 Q 44.89,185.24 51.27,174.91 Q 58.94,184.33 52.70,196.86 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 52.70,103.14 Q 56.91,89.79 68.97,88.34 Q 66.38,100.21 52.70,103.14 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 125.97,44.71 Q 139.03,39.68 147.69,48.20 Q 136.80,53.58 125.97,44.71 Z"
            />
            <path
              className="heal-orbit-leaf outer"
              d="M 217.34,65.56 Q 229.41,72.64 228.15,84.72 Q 217.15,79.56 217.34,65.56 Z"
            />
          </g>

          {/* Inner Ring: 5 Orbiting Leaves (Counter-Clockwise Rotation 11s) */}
          <g
            id="ringInner"
            className="heal-ring-inner"
            style={{
              transformOrigin: '150px 150px',
            }}
          >
            <path
              className="heal-orbit-leaf inner"
              d="M 214.72,197.02 Q 216.87,206.97 209.78,212.24 Q 207.13,203.81 214.72,197.02 Z"
            />
            <path
              className="heal-orbit-leaf inner"
              d="M 125.28,226.08 Q 116.48,231.20 109.28,226.08 Q 116.48,220.96 125.28,226.08 Z"
            />
            <path
              className="heal-orbit-leaf inner"
              d="M 70.00,150.00 Q 62.41,143.21 65.06,134.78 Q 72.15,140.05 70.00,150.00 Z"
            />
            <path
              className="heal-orbit-leaf inner"
              d="M 125.28,73.92 Q 129.39,64.60 138.22,64.51 Q 135.41,72.89 125.28,73.92 Z"
            />
            <path
              className="heal-orbit-leaf inner"
              d="M 214.72,102.98 Q 224.85,104.01 227.67,112.38 Q 218.83,112.29 214.72,102.98 Z"
            />
          </g>

          {/* Central Leaf Mark Artwork: Traced pixel-for-pixel from artwork */}
          <g transform="translate(150,150) scale(0.1444) translate(-450,-357)">
            <g
              transform="translate(0,714) scale(0.1,-0.1)"
              fill="var(--heal, #23a873)"
            >
              <path d="M7155 6974 c-16 -2 -84 -9 -150 -15 -1425 -130 -2628 -1222 -2908 -2639 -58 -289 -67 -438 -67 -1052 0 -510 1 -528 19 -538 30 -16 50 -2 61 44 116 447 244 743 471 1086 526 794 1374 1329 2309 1455 63 8 148 20 188 26 73 11 172 4 172 -11 0 -10 -52 -20 -103 -20 -22 0 -56 -4 -76 -9 -20 -5 -72 -17 -116 -26 -171 -36 -170 -36 -370 -100 -1041 -337 -1882 -1241 -2154 -2315 -16 -63 -26 -121 -23 -128 8 -22 1327 -11 1492 12 463 64 783 162 1152 353 884 457 1526 1307 1719 2277 56 279 61 353 66 985 5 566 5 595 -13 608 -14 11 -168 13 -828 12 -446 -1 -824 -4 -841 -5z M190 5853 c-8 -3 -18 -11 -22 -17 -14 -21 -9 -712 7 -871 58 -612 290 -1111 709 -1530 371 -371 824 -597 1371 -686 186 -30 1410 -42 1438 -14 15 15 17 53 17 398 -1 467 -13 618 -74 868 -219 905 -959 1619 -1866 1803 -242 49 -232 49 -915 52 -357 2 -657 1 -665 -3z M2760 2423 c-145 -9 -332 -53 -499 -117 -523 -202 -924 -653 -1065 -1197 -46 -180 -57 -305 -54 -639 l3 -305 470 -3 c507 -3 559 1 768 53 570 143 1039 580 1231 1145 74 220 96 392 96 767 0 234 -2 274 -16 287 -14 14 -66 16 -447 14 -238 -1 -457 -3 -487 -5z M4041 2416 c-22 -27 -9 -475 17 -591 107 -470 427 -801 899 -932 l98 -28 375 0 375 0 -1 245 c-1 190 -5 264 -18 330 -100 490 -460 853 -958 966 -110 25 -768 33 -787 10z" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
