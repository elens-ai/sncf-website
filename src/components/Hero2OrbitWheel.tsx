import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PillarState } from '../types';
import { CardIllustration } from './CardIllustration';
import { DevotionalPhotoCard, DEVOTIONAL_LEADERS, DevotionalLeader } from './DevotionalPhotoCard';

interface Hero2OrbitWheelProps {
  pillars: PillarState[]; // 4 pillars: HEAL, ENRICH, EMPOWER, PROJECTS
  activeIndex: number; // 0..3 for active pillar
  onActiveIndexChange: (index: number) => void;
  isPaused: boolean;
  onCardClick: (index: number) => void;
  onPhotoCardClick?: (leader: DevotionalLeader) => void;
  /** Fired once whenever a devotional portrait takes (or leaves) the front:
      the leader's index, or null when a pillar card fronts again. */
  onDevotionalFront?: (leaderIdx: number | null) => void;
}

export const Hero2OrbitWheel: React.FC<Hero2OrbitWheelProps> = ({
  pillars,
  activeIndex,
  onActiveIndexChange,
  isPaused,
  onCardClick,
  onPhotoCardClick,
  onDevotionalFront,
}) => {
  /* Both spiritual guides ride the wheel with their official photographs.
     6 cards -> 60-degree steps. */
  const WHEEL_LEADERS = DEVOTIONAL_LEADERS;
  const totalCards = 4 + WHEEL_LEADERS.length;
  const stepAngle = 360 / totalCards; // 60 degrees

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  /* Start with the Satguru Mata Sudiksha Ji portrait front (card 4 at -240deg
     with 60-degree steps). Forward rotation then walks: Mata Ji -> Rajpita Ji
     -> Heal -> Enrich -> Empower -> Projects -> back to Mata Ji, looping. */
  const angleRef = useRef<number>(-240);
  const drumRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
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
  const lastDevotionalRef = useRef<number | null>(0);

  const updateActiveCardFromAngle = useCallback(
    (angle: number) => {
      const positiveAngle = ((-angle % 360) + 360) % 360;
      const index = Math.round(positiveAngle / stepAngle) % totalCards;
      if (index < pillars.length) {
        // Pillar card front
        if (index !== activeIndex) onActiveIndexChange(index);
        if (lastDevotionalRef.current !== null) {
          lastDevotionalRef.current = null;
          onDevotionalFront?.(null);
        }
      } else {
        // Devotional portrait front — tell the parent which one, once
        const leaderIdx = index - pillars.length;
        if (lastDevotionalRef.current !== leaderIdx) {
          lastDevotionalRef.current = leaderIdx;
          onDevotionalFront?.(leaderIdx);
        }
      }
    },
    [activeIndex, pillars.length, stepAngle, onActiveIndexChange, onDevotionalFront]
  );

  /* Writes the frame straight to the DOM. Previously every frame called
     setWheelAngle(), which re-rendered all six cards — each a full SVG
     illustration — at 60fps. React does no work per frame now; state is only
     touched when the active pillar actually changes. */
  const applyFrame = useCallback(
    (angle: number) => {
      if (reducedMotion) return;

      if (drumRef.current) {
        drumRef.current.style.transform = `rotateY(${angle}deg)`;
      }

      for (let i = 0; i < totalCards; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const st = getCardTransformState(i, angle);
        el.style.transform = `rotateY(${i * stepAngle}deg) translateZ(var(--hero2-radius, 408px)) scale(${st.scale})`;
        el.style.opacity = String(st.opacity);
        el.style.filter = `blur(${st.blur}px)`;
        el.style.zIndex = String(st.zIndex);
      }
    },
    // getCardTransformState is a pure function of its args plus stepAngle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reducedMotion, totalCards, stepAngle],
  );

  // Main animation loop (requestAnimationFrame)
  useEffect(() => {
    if (reducedMotion) {
      const interval = setInterval(() => {
        if (!isPaused && !isHovered) {
          onActiveIndexChange((activeIndex + 1) % pillars.length);
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

      // Handle animated snap transition
      if (isSnappingRef.current && snapTargetRef.current !== null) {
        if (snapStartTimeRef.current === null) {
          snapStartTimeRef.current = currentTime;
        }
        const snapElapsed = (currentTime - snapStartTimeRef.current) / 1000;
        const snapDuration = 0.7; // 700ms ease-in-out

        if (snapElapsed < snapDuration) {
          const progress = snapElapsed / snapDuration;
          const easeProgress =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const currentAngle =
            snapStartAngleRef.current +
            (snapTargetRef.current - snapStartAngleRef.current) * easeProgress;

          angleRef.current = currentAngle;
          applyFrame(currentAngle);
          updateActiveCardFromAngle(currentAngle);
        } else {
          // Snap finished
          angleRef.current = snapTargetRef.current;
          applyFrame(snapTargetRef.current);
          updateActiveCardFromAngle(snapTargetRef.current);
          isSnappingRef.current = false;
          snapTargetRef.current = null;
          snapStartTimeRef.current = null;
        }
      } else if (!isDraggingRef.current && !isPaused && !isHovered) {
        // Continuous auto-rotation: 26s for a full 360-degree rotation across 6 cards
        const isMobile = window.innerWidth < 640;
        const fullTurnSeconds = isMobile ? 20 : 26;
        const degreesPerSecond = 360 / fullTurnSeconds;

        const newAngle = angleRef.current - degreesPerSecond * deltaTime;
        angleRef.current = newAngle;
        applyFrame(newAngle);
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
    applyFrame,
    activeIndex,
    pillars.length,
    onActiveIndexChange,
  ]);

  // Paint the opening frame so the cards never flash at their unpositioned state
  useEffect(() => {
    applyFrame(angleRef.current);
  }, [applyFrame]);

  /* Safety net for the drag/hover latches. If a pointer is released outside the
     wheel, or the tab loses focus mid-drag, the element-level pointerup never
     fires and isDraggingRef stays true — which silently freezes auto-rotation
     for the rest of the session. Same for the hover latch. */
  useEffect(() => {
    const release = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };
    const clearHover = () => setIsHovered(false);

    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', clearHover);
    document.addEventListener('visibilitychange', clearHover);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', clearHover);
      document.removeEventListener('visibilitychange', clearHover);
    };
  }, []);

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

    // Convert horizontal drag distance to rotation: ~0.35deg per px
    const newAngle = dragStartAngleRef.current + deltaX * 0.35;
    angleRef.current = newAngle;
    applyFrame(newAngle);
    updateActiveCardFromAngle(newAngle);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Apply inertia and snap to nearest 60-degree step
    const currentAngle = angleRef.current;
    const momentum = velocityRef.current * 1.5;
    const projectedAngle = currentAngle + momentum;
    const nearestStep = Math.round(projectedAngle / stepAngle) * stepAngle;

    snapStartAngleRef.current = currentAngle;
    snapTargetRef.current = nearestStep;
    snapStartTimeRef.current = null;
    isSnappingRef.current = true;
  };

  // Helper to compute dynamic 3D card scale, opacity, and blur for each card in the 6-orbit
  const getCardTransformState = (cardIndex: number, atAngle: number = angleRef.current) => {
    const cardAngleInWheel = cardIndex * stepAngle;
    const worldAngle = (((atAngle + cardAngleInWheel) % 360) + 540) % 360 - 180;
    const absAngle = Math.abs(worldAngle);

    // Front-facing threshold: within ~20 deg
    const isFrontFacing = absAngle <= 20;
    // Normalized distance from front (0 at front, 1 at 180deg back)
    const normalizedDistance = Math.min(absAngle / 180, 1);

    // Scale: 1.15 at front, down to 0.82 at back
    const scale = 1.15 - Math.pow(normalizedDistance, 0.8) * 0.36;
    // Opacity: 1.0 at front, down to 0.55 at back
    /* A linear falloff left the two cards flanking the front at ~0.85 opacity and
       the rear card at 0.55 showing through it — mid-rotation that reads as three
       competing cards. The power curve drops the neighbours away quickly so only
       the front card holds attention, and all but retires the rear one. */
    const opacity = 1 - Math.pow(normalizedDistance, 0.75) * 0.9;
    // Blur: a dead zone keeps the front card perfectly crisp. Previously this
    // ramped straight from 0, so the active card always carried a residual
    // ~0.3px blur because the wheel never rests at exactly 0deg.
    const BLUR_DEAD_ZONE = 0.2;
    const blur =
      normalizedDistance <= BLUR_DEAD_ZONE
        ? 0
        : (normalizedDistance - BLUR_DEAD_ZONE) * 3.0;
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
      id="hero2-orbit-wheel-container"
      className="relative flex flex-col items-center justify-center w-full max-w-[880px] py-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="region"
      aria-label="Interactive 6-Card Orbital Carousel with 4 Pillars and 2 Spiritual Portraits"
    >
      {/* 3D Scene Wrapper */}
      <div
        id="hero2-orbit-3d-stage"
        className={`relative w-[420px] h-[400px] sm:w-[580px] sm:h-[500px] md:w-[720px] md:h-[580px] xl:w-[800px] xl:h-[620px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          perspective: '1800px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Subtle Orbital Ring Guide Line in Background */}
        <div
          className="absolute w-[640px] h-[640px] rounded-full border border-white/10 pointer-events-none"
          style={{
            transform: 'rotateX(65deg) scale(1.15)',
            boxShadow: '0 0 40px rgba(255,255,255,0.05)',
          }}
        />

        {/* Central Axis Glow */}
        <div className="absolute w-36 h-36 rounded-full bg-white/15 blur-3xl pointer-events-none" />

        {/* The 3D Wheel Drum for 6 Cards */}
        <div
          id="hero2-orbit-drum"
          ref={drumRef}
          className="relative w-full h-full flex items-center justify-center will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: reducedMotion ? 'none' : `rotateY(${angleRef.current}deg)`,
            /* No transform transition here. The rAF loop rewrites this every
               ~16ms, so a 50ms transition was restarted before it could ever
               finish — the drum permanently chased a target it never reached,
               which is what made the rotation look unstable. */
          }}
        >
          {/* 1. The 4 Dynamic Pillar Content Cards (Indices 0, 1, 2, 3) */}
          {pillars.map((pillar, i) => {
            const cardState = getCardTransformState(i);
            const isCurrentActive = activeIndex === i;
            const driftClass = `card-drift-${i % 6}`;

            return (
              <div
                key={pillar.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                id={`hero2-orbit-pillar-card-${pillar.id}`}
                onClick={() => onCardClick(i)}
                className="absolute flex items-center justify-center transition-[box-shadow] duration-300 cursor-pointer"
                style={{
                  width: 'var(--card-width, 268px)',
                  height: 'var(--card-height, 344px)',
                  transform: reducedMotion
                    ? 'none'
                    : `rotateY(${i * stepAngle}deg) translateZ(var(--hero2-radius, 408px)) scale(${cardState.scale})`,
                  opacity: reducedMotion ? (isCurrentActive ? 1 : 0.4) : cardState.opacity,
                  filter: reducedMotion ? 'none' : `blur(${cardState.blur}px)`,
                  zIndex: cardState.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                role="group"
                aria-label={`${pillar.label}: ${pillar.headline}`}
                aria-current={isCurrentActive ? 'true' : 'false'}
              >
                {/* Independent Asynchronous Float/Drift Wrapper with extra curved border-radius */}
                <div
                  className={`w-full h-full rounded-[32px] overflow-hidden ${
                    !reducedMotion && !isDragging ? driftClass : ''
                  } transition-[border,box-shadow] duration-300`}
                  style={{
                    boxShadow: cardState.isFrontFacing
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 255, 255, 0.25)'
                      : '0 15px 35px rgba(0, 0, 0, 0.3)',
                    border: cardState.isFrontFacing
                      ? '2.5px solid rgba(255, 255, 255, 0.95)'
                      : '1.2px solid rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <CardIllustration
                    pillar={pillar}
                    index={i}
                    roundedClass="rounded-[32px]"
                    isActive={cardState.isFrontFacing || isCurrentActive}
                  />

                  {/* Active Indicator Badge */}
                  {cardState.isFrontFacing && pillar.id !== 'empower' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-white text-neutral-900 text-[10px] font-black tracking-widest uppercase shadow-lg flex items-center gap-1.5 z-20 border border-white/90 animate-bounce">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: pillar.accentA }}
                      />
                      <span>ACTIVE</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 2. The 2 Static Devotional Photo Cards (Indices 4 and 5) */}
          {WHEEL_LEADERS.map((leader, idx) => {
            const cardIndex = 4 + idx;
            const cardState = getCardTransformState(cardIndex);
            const driftClass = `card-drift-${cardIndex % 6}`;

            return (
              <div
                key={leader.id}
                ref={(el) => {
                  cardRefs.current[cardIndex] = el;
                }}
                id={`hero2-orbit-photo-card-${leader.id}`}
                onClick={() => onPhotoCardClick?.(leader)}
                className="absolute flex items-center justify-center transition-[box-shadow] duration-300 cursor-pointer"
                style={{
                  width: 'var(--card-width, 268px)',
                  height: 'var(--card-height, 344px)',
                  transform: reducedMotion
                    ? 'none'
                    : `rotateY(${cardIndex * stepAngle}deg) translateZ(var(--hero2-radius, 408px)) scale(${cardState.scale})`,
                  opacity: reducedMotion ? 0.9 : cardState.opacity,
                  filter: reducedMotion ? 'none' : `blur(${cardState.blur}px)`,
                  zIndex: cardState.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                role="group"
                aria-label={`Devotional Portrait: ${leader.name}`}
              >
                {/* Independent Float/Drift Wrapper */}
                <div
                  className={`w-full h-full rounded-[32px] overflow-hidden ${
                    !reducedMotion && !isDragging ? driftClass : ''
                  } transition-[border,box-shadow] duration-300`}
                  style={{
                    boxShadow: cardState.isFrontFacing
                      ? `0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px ${leader.glowColor}40`
                      : '0 15px 35px rgba(0, 0, 0, 0.4)',
                    border: cardState.isFrontFacing
                      ? `2.5px solid ${leader.glowColor}`
                      : '1.2px solid rgba(255, 255, 255, 0.35)',
                  }}
                >
                  <DevotionalPhotoCard
                    leader={leader}
                    roundedClass="rounded-[32px]"
                    isFrontFacing={cardState.isFrontFacing}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
