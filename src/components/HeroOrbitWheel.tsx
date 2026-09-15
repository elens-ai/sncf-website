import { getCMSCopy } from '../cms/runtime';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PillarState } from '../types';
import { CardIllustration } from './CardIllustration';
import { PillarModelCard, MODEL_PILLARS } from './PillarModelCard';
import { useSectionActivity } from '../hooks/useSectionActivity';
interface HeroOrbitWheelProps {
  pillars: PillarState[]; // 4 pillars: HEAL, ENRICH, EMPOWER, PROJECTS
  activeIndex: number; // 0..3 for active pillar
  onActiveIndexChange: (index: number) => void;
  isPaused: boolean;
  onCardClick: (index: number) => void;

}

export const HeroOrbitWheel: React.FC<HeroOrbitWheelProps> = ({
  pillars,
  activeIndex,
  onActiveIndexChange,
  isPaused,
  onCardClick,
}) => {
  const totalCards = pillars.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useSectionActivity(stageRef);
  const stepAngle = 360 / totalCards;

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const angleRef = useRef<number>(-activeIndex * stepAngle);
  const drumRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const holdTimeRef = useRef(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartAngleRef = useRef<number>(0);
  const lastDragXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const snapTargetRef = useRef<number | null>(null);
  const snapStartTimeRef = useRef<number | null>(null);
  const snapStartAngleRef = useRef<number>(0);
  const pausedSnapElapsedRef = useRef(0);
  const isSnappingRef = useRef<boolean>(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const updateActiveCardFromAngle = useCallback((angle: number) => {
    const positiveAngle = ((-angle % 360) + 360) % 360;
    const index = Math.round(positiveAngle / stepAngle) % totalCards;
    if (index !== activeIndex) onActiveIndexChange(index);
  }, [activeIndex, stepAngle, totalCards, onActiveIndexChange]);

  /* Writes the frame straight to the DOM. Previously every frame called
     setWheelAngle(), which re-rendered all six cards — each a full SVG
     illustration — at 60fps. React does no work per frame now; state is only
     touched when the active pillar actually changes. */
  const applyFrame = useCallback(
    (angle: number) => {
      if (reducedMotion) return;

      if (drumRef.current) {
        drumRef.current.style.transform = 'none';
      }

      for (let i = 0; i < totalCards; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const st = getCardTransformState(i, angle);
        /* Write only what changed. Re-assigning identical style strings still
           costs style recalculation across six cards every frame. */
        const nextTransform = st.transform;
        if (el.style.transform !== nextTransform) el.style.transform = nextTransform;

        const nextOpacity = st.opacity.toFixed(3);
        if (el.style.opacity !== nextOpacity) el.style.opacity = nextOpacity;
        el.style.pointerEvents = st.opacity < 0.01 ? 'none' : 'auto';

        const nextFilter = st.blur === 0 ? 'none' : `blur(${st.blur}px)`;
        if (el.style.filter !== nextFilter) el.style.filter = nextFilter;

        const nextZ = String(st.zIndex);
        if (el.style.zIndex !== nextZ) el.style.zIndex = nextZ;
      }
    },
    // getCardTransformState is a pure function of its args plus stepAngle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reducedMotion, totalCards, stepAngle, pillars],
  );

  // Main animation loop (requestAnimationFrame)
  useEffect(() => {
    if (reducedMotion || isPaused || !inView) return;
    lastTimeRef.current = null;
    if (isSnappingRef.current) snapStartTimeRef.current = performance.now() - pausedSnapElapsedRef.current;

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
        const snapDuration = 1.25;

        if (snapElapsed < snapDuration) {
          const progress = snapElapsed / snapDuration;
          // Smooth acceleration and a soft landing, with no scale overshoot.
          const easeProgress = progress * progress * progress * (progress * (progress * 6 - 15) + 10);

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
          pausedSnapElapsedRef.current = 0;
          holdTimeRef.current = 0;
        }
      } else if (!isDraggingRef.current && !isPaused) {
        // Reference rhythm: let the subject own the centre, then sweep the
        // next one forward. The sequence loops automatically without arrows.
        holdTimeRef.current += deltaTime;
        if (holdTimeRef.current >= 4.5) {
          snapStartAngleRef.current = angleRef.current;
          snapTargetRef.current = (Math.round(angleRef.current / stepAngle) - 1) * stepAngle;
          snapStartTimeRef.current = null;
          pausedSnapElapsedRef.current = 0;
          isSnappingRef.current = true;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (isSnappingRef.current && snapStartTimeRef.current !== null) pausedSnapElapsedRef.current = performance.now() - snapStartTimeRef.current;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    inView,
    isPaused,
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

    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
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

  // Awards-style staging: a large centre subject, smaller side neighbours,
  // and a recessed fourth subject. Interpolate continuously around the oval.
  const getCardTransformState = (cardIndex: number, atAngle: number = angleRef.current) => {
    const worldAngle = (((atAngle + cardIndex * stepAngle) % 360) + 540) % 360 - 180;
    const radians = worldAngle * Math.PI / 180;
    const presence = (1 + Math.cos(radians)) / 2;
    const prominence = presence * presence * presence;
    const scale = 0.22 + 0.94 * prominence;
    const x = Math.sin(radians) * 0.7;
    const y = 0.2 - 0.16 * prominence;
    const blur = presence < 0.25 ? 1 : 0;
    const reveal = Math.max(0, Math.min(1, (presence - 0.12) / 0.38));
    const visibility = reveal * reveal * (3 - 2 * reveal);
    return {
      isFrontFacing: Math.abs(worldAngle) < 35,
      scale,
      opacity: (0.55 + 0.45 * presence) * visibility,
      blur,
      zIndex: Math.round(5 + presence * 95),
      transform: `translate3d(calc(var(--hero-radius-base, 256px) * ${x.toFixed(4)}), calc(var(--card-height, 344px) * ${y.toFixed(4)}), 0) scale(${scale.toFixed(4)})`,
    };
  };

  // External pillar selection (for example the hero's keyboard controls)
  // positions the same stage; automatic reporting does not restart its turn.
  useEffect(() => {
    const current = Math.round((((-angleRef.current % 360) + 360) % 360) / stepAngle) % totalCards;
    if (current !== activeIndex) {
      angleRef.current = -activeIndex * stepAngle;
      applyFrame(angleRef.current);
    }
  }, [activeIndex, stepAngle, totalCards, applyFrame]);

  return (
    <div
      id="hero-orbit-wheel-container"
      ref={stageRef}
      className="relative flex flex-col items-center justify-center w-full max-w-[880px] py-0"
      tabIndex={0}
      role="region"
      /* Derived, not written out: the counts drifted out of date the moment
         a card was removed from the wheel. */
      aria-label={`Continuously revolving showcase with ${pillars.length} floating 3D icons`}
    >
      {/* 3D Scene Wrapper */}
      <div
        id="hero-orbit-3d-stage"
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
        {/* No orbital ring guide here. A 640px circle laid flat with
            rotateX(65deg) projects to a 903x322 ellipse on screen, and with its
            40px white box-shadow it read as an oval smear behind the cards
            rather than as a guide line. The orbit is already legible from the
            cards' own arc. */}

        {/* Central Axis Glow */}
        <div className="absolute w-36 h-36 rounded-full bg-white/15 blur-3xl pointer-events-none" />

        {/* The 3D Wheel Drum for 6 Cards */}
        <div
          id="hero-orbit-drum"
          ref={drumRef}
          className="relative w-full h-full flex items-center justify-center will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'none',
            /* No transform transition here. The rAF loop rewrites this every
               ~16ms, so a 50ms transition was restarted before it could ever
               finish — the drum permanently chased a target it never reached,
               which is what made the rotation look unstable. */
          }}
        >
          {/* 1. The 4 Dynamic Pillar Content Cards (Indices 0, 1, 2, 3) */}
          {pillars.map((pillar, i) => {
            const hasModel = MODEL_PILLARS.has(pillar.id);
            const cardState = getCardTransformState(i, reducedMotion ? -activeIndex * stepAngle : angleRef.current);
            const isCurrentActive = activeIndex === i;
            const driftClass = `card-drift-${i % 6}`;

            return (
              <div
                key={pillar.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                id={`hero-orbit-pillar-card-${pillar.id}`}
                onClick={() => onCardClick(i)}
                className="absolute flex items-center justify-center transition-[box-shadow] duration-300 cursor-pointer"
                style={{
                  width: 'calc(var(--hero-model-size, 320px) * var(--card-scale, 1))',
                  height: 'calc(var(--hero-model-size, 320px) * var(--card-scale, 1))',
                  transform: cardState.transform,
                  opacity: cardState.opacity,
                  pointerEvents: cardState.opacity < 0.01 ? 'none' : 'auto',
                  filter: cardState.blur === 0 ? 'none' : `blur(${cardState.blur}px)`,
                  zIndex: cardState.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                role="button"
                tabIndex={isCurrentActive ? 0 : -1}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onCardClick(i);
                  }
                }}
                aria-label={`${pillar.label}: ${pillar.headline}`}
                aria-current={isCurrentActive ? 'true' : 'false'}
              >
                {/* Independent Asynchronous Float/Drift Wrapper with extra curved border-radius */}
                <div
                  className={`w-full h-full rounded-[32px] ${hasModel ? 'overflow-visible' : 'overflow-hidden'} ${
                    !reducedMotion && !isPaused && inView && !isDragging ? driftClass : ''
                  } transition-[border,box-shadow] duration-300`}
                  style={{
                    boxShadow: hasModel ? 'none' : cardState.isFrontFacing
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 255, 255, 0.25)'
                      : '0 15px 35px rgba(0, 0, 0, 0.3)',
                    border: hasModel ? 'none' : cardState.isFrontFacing
                      ? '2.5px solid rgba(255, 255, 255, 0.95)'
                      : '1.2px solid rgba(255, 255, 255, 0.35)',
                  }}
                >
                  {hasModel ? <PillarModelCard id={pillar.id} label={pillar.label} active={isCurrentActive} animate={!reducedMotion && !isPaused && inView && !isDragging} /> : <CardIllustration
                    pillar={pillar}
                    index={i}
                    roundedClass="rounded-[32px]"
                    isActive={cardState.isFrontFacing || isCurrentActive}
                  />}

                </div>
              </div>
            );
          })}


        </div>
      </div>

    </div>
  );
};
