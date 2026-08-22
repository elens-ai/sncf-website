import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PillarState } from '../types';
import { CardIllustration } from './CardIllustration';

interface HeroWheelProps {
  pillars: PillarState[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isPaused: boolean;
  onCardClick: (index: number) => void;
}

export const HeroWheel: React.FC<HeroWheelProps> = ({
  pillars,
  activeIndex,
  onActiveIndexChange,
  isPaused,
  onCardClick,
}) => {
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const angleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartAngleRef = useRef<number>(0);
  const lastDragXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const snapTargetRef = useRef<number | null>(null);
  const snapStartTimeRef = useRef<number | null>(null);
  const snapStartAngleRef = useRef<number>(0);
  const isSnappingRef = useRef<boolean>(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Update active card index based on current wheel angle
  const updateActiveCardFromAngle = useCallback(
    (angle: number) => {
      // Normalize angle to 0..360
      // In CSS, card i sits at i * 90deg.
      // Card i is front-facing when (angle + i * 90) % 360 is close to 0 (or 360)
      // That means -angle % 360 is close to i * 90
      const positiveAngle = ((-angle % 360) + 360) % 360;
      const index = Math.round(positiveAngle / 90) % 4;
      if (index !== activeIndex) {
        onActiveIndexChange(index);
      }
    },
    [activeIndex, onActiveIndexChange]
  );

  // Main animation loop (requestAnimationFrame)
  useEffect(() => {
    if (reducedMotion) {
      // In reduced motion, simply cycle every 4s without 3D rotation
      const interval = setInterval(() => {
        if (!isPaused && !isHovered) {
          onActiveIndexChange((activeIndex + 1) % 4);
        }
      }, 4000);
      return () => clearInterval(interval);
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // Handle animated snap transition (e.g. from dot click or drag release)
      if (isSnappingRef.current && snapTargetRef.current !== null) {
        if (snapStartTimeRef.current === null) {
          snapStartTimeRef.current = currentTime;
        }
        const snapElapsed = (currentTime - snapStartTimeRef.current) / 1000;
        const snapDuration = 0.7; // 700ms ease-in-out

        if (snapElapsed < snapDuration) {
          const progress = snapElapsed / snapDuration;
          // Cubic ease in-out
          const easeProgress =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const currentAngle =
            snapStartAngleRef.current +
            (snapTargetRef.current - snapStartAngleRef.current) * easeProgress;

          angleRef.current = currentAngle;
          setWheelAngle(currentAngle);
          updateActiveCardFromAngle(currentAngle);
        } else {
          // Snap finished
          angleRef.current = snapTargetRef.current;
          setWheelAngle(snapTargetRef.current);
          updateActiveCardFromAngle(snapTargetRef.current);
          isSnappingRef.current = false;
          snapTargetRef.current = null;
          snapStartTimeRef.current = null;
        }
      } else if (!isDraggingRef.current && !isPaused && !isHovered) {
        // Continuous auto-rotation
        // Speed: 360 deg over 16s on desktop (22.5 deg/sec), or 12s on small screens (30 deg/sec)
        const isMobile = window.innerWidth < 600;
        const fullTurnSeconds = isMobile ? 12 : 16;
        const degreesPerSecond = 360 / fullTurnSeconds;

        const newAngle = angleRef.current - degreesPerSecond * deltaTime;
        angleRef.current = newAngle;
        setWheelAngle(newAngle);
        updateActiveCardFromAngle(newAngle);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPaused,
    isHovered,
    reducedMotion,
    updateActiveCardFromAngle,
    activeIndex,
    onActiveIndexChange,
  ]);

  // Pointer drag / swipe handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (reducedMotion) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    isSnappingRef.current = false;
    snapTargetRef.current = null;
    dragStartXRef.current = e.clientX;
    dragStartAngleRef.current = angleRef.current;
    lastDragXRef.current = e.clientX;
    velocityRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    velocityRef.current = e.clientX - lastDragXRef.current;
    lastDragXRef.current = e.clientX;

    // Convert horizontal drag distance to rotation: 0.3deg per px
    const newAngle = dragStartAngleRef.current + deltaX * 0.35;
    angleRef.current = newAngle;
    setWheelAngle(newAngle);
    updateActiveCardFromAngle(newAngle);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Apply inertia and snap to nearest 90-degree step
    const currentAngle = angleRef.current;
    const momentum = velocityRef.current * 1.5;
    const projectedAngle = currentAngle + momentum;
    const nearestStep = Math.round(projectedAngle / 90) * 90;

    snapStartAngleRef.current = currentAngle;
    snapTargetRef.current = nearestStep;
    snapStartTimeRef.current = null;
    isSnappingRef.current = true;
  };

  // Jump to specific pillar via dot click
  const handleDotClick = (targetIndex: number) => {
    isSnappingRef.current = true;
    snapStartTimeRef.current = null;
    snapStartAngleRef.current = angleRef.current;

    // Determine target angle closest to current angle that brings targetIndex front-facing
    // For card targetIndex to be front, angle must satisfy: -angle % 360 == targetIndex * 90
    // => angle = -(targetIndex * 90) + k * 360
    const desiredTargetBase = -(targetIndex * 90);
    const current = angleRef.current;
    // Find multiple of 360 that is closest to current angle
    const diff = ((desiredTargetBase - current) % 360 + 540) % 360 - 180;
    snapTargetRef.current = current + diff;
  };

  // Helper to compute dynamic 3D card scale, opacity, and blur for each card
  const getCardTransformState = (cardIndex: number) => {
    // Card's angular offset in wheel:
    const cardAngleInWheel = cardIndex * 90;
    // Current world orientation angle
    const worldAngle = ((wheelAngle + cardAngleInWheel) % 360 + 540) % 360 - 180;
    const absAngle = Math.abs(worldAngle);

    // Front-facing threshold: within ~25 deg
    const isFrontFacing = absAngle <= 25;
    // Normalized distance from front (0 is front, 1 is 180deg back)
    const normalizedDistance = Math.min(absAngle / 180, 1);

    // Scale: 1.12 at front, down to 0.85 at sides/back
    const scale = 1.12 - normalizedDistance * 0.27;
    // Opacity: 1 at front, down to 0.55 at back
    const opacity = 1 - normalizedDistance * 0.45;
    // Blur: 0px at front, up to 4px at back
    const blur = normalizedDistance * 4;
    // Z-Index: highest for front
    const zIndex = Math.round((1 - normalizedDistance) * 100);

    return {
      isFrontFacing,
      scale,
      opacity,
      blur,
      zIndex,
      worldAngle,
    };
  };

  return (
    <div
      id="hero-wheel-container"
      className="relative flex flex-col items-center justify-center w-full max-w-[620px] py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="region"
      aria-label="Interactive 3D Foundation Pillars Carousel"
    >
      {/* 3D Scene Wrapper */}
      <div
        id="wheel-3d-stage"
        className={`relative w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[560px] md:h-[520px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          perspective: '1400px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Decorative central axis glow */}
        <div className="absolute w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        {/* The 3D Wheel Drum */}
        <div
          id="wheel-drum"
          className="relative w-full h-full flex items-center justify-center will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: reducedMotion
              ? 'none'
              : `rotateY(${wheelAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.05s linear',
          }}
        >
          {pillars.map((pillar, i) => {
            const cardState = getCardTransformState(i);
            const isCurrentActive = activeIndex === i;

            return (
              <div
                key={pillar.id}
                id={`wheel-card-${pillar.id}`}
                onClick={() => onCardClick(i)}
                className="wheel-card absolute flex items-center justify-center will-change-transform transition-[filter,box-shadow] duration-300 rounded-[18px] cursor-pointer"
                style={{
                  width: 'var(--card-width, 220px)',
                  height: 'var(--card-height, 280px)',
                  transform: reducedMotion
                    ? 'none'
                    : `rotateY(${i * 90}deg) translateZ(var(--wheel-radius, 280px)) scale(${cardState.scale})`,
                  opacity: reducedMotion ? (isCurrentActive ? 1 : 0.4) : cardState.opacity,
                  filter: reducedMotion ? 'none' : `blur(${cardState.blur}px)`,
                  zIndex: cardState.zIndex,
                  boxShadow: cardState.isFrontFacing
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 255, 255, 0.15)'
                    : '0 20px 40px rgba(0, 0, 0, 0.25)',
                  border: cardState.isFrontFacing
                    ? `2px solid rgba(255, 255, 255, 0.9)`
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(2px)',
                }}
                role="group"
                aria-label={`${pillar.label}: ${pillar.headline}`}
                aria-current={isCurrentActive ? 'true' : 'false'}
              >
                <CardIllustration
                  pillar={pillar}
                  index={i}
                  isActive={cardState.isFrontFacing || isCurrentActive}
                />

                {/* Focus Ring & Active indicator badge */}
                {cardState.isFrontFacing && pillar.id !== 'empower' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white text-neutral-900 text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 z-20 border border-white/80 animate-bounce">
                    <span
                      className="w-1.5 h-1.5 rounded-full transition-colors duration-1000"
                      style={{ backgroundColor: pillar.accentA }}
                    />
                    <span>ACTIVE</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Touch / Drag Guidance Hint */}
      <div className="text-white/70 text-[11px] font-medium tracking-wide flex items-center gap-2 mt-1 mb-3 pointer-events-none">
        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path d="M7 16l-4-4m0 0l4-4m-4 4h18m-4 4l4-4m0 0l-4-4" />
        </svg>
        <span>Drag to rotate · Hover to pause · Click card for details</span>
      </div>

      {/* 4 DOT INDICATORS (below the wheel) */}
      <nav
        id="wheel-dot-indicators"
        className="flex items-center gap-3 bg-black/25 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 shadow-lg"
        aria-label="Pillar Navigation Dots"
      >
        {pillars.map((pillar, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={pillar.id}
              id={`nav-dot-${pillar.id}`}
              onClick={() => handleDotClick(idx)}
              className="group relative flex items-center justify-center p-1.5 transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
              aria-label={`Show ${pillar.label} pillar`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <span
                className={`block rounded-full transition-all duration-1000 ease-in-out ${
                  isActive
                    ? 'w-6 h-2.5 bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)]'
                    : 'w-2.5 h-2.5 bg-white/40 group-hover:bg-white/75'
                }`}
                style={{
                  backgroundColor: isActive ? pillar.accentB : undefined,
                  transition: 'background-color 1000ms cubic-bezier(0.45, 0.05, 0.25, 1), width 500ms ease, box-shadow 1000ms cubic-bezier(0.45, 0.05, 0.25, 1)',
                }}
              />
              <span className="sr-only">{pillar.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
