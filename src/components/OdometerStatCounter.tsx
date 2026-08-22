import React, { useEffect, useRef, useState, useId } from 'react';

interface RollingOdometerProps {
  value: string;
  duration?: number;
  className?: string;
}

type Token =
  | { type: 'digit'; targetDigit: number; digitIndex: number }
  | { type: 'symbol'; text: string };

function tokenizeStat(raw: string): Token[] {
  if (!raw) return [];
  const tokens: Token[] = [];
  let digitCount = 0;

  const regex = /(\d)|([^\d]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({
        type: 'digit',
        targetDigit: parseInt(match[1], 10),
        digitIndex: digitCount++,
      });
    } else if (match[2] !== undefined) {
      tokens.push({
        type: 'symbol',
        text: match[2],
      });
    }
  }

  return tokens;
}

// Generate repeating digit reels [0..9, 0..9, 0..9, 0..9, 0..targetDigit]
// so it spins through multiple full 0-9 revolutions before landing cleanly on target
function generateReelDigits(targetDigit: number, cycles: number): number[] {
  const list: number[] = [];
  for (let c = 0; c < cycles; c++) {
    for (let d = 0; d <= 9; d++) {
      list.push(d);
    }
  }
  for (let d = 0; d <= targetDigit; d++) {
    list.push(d);
  }
  return list;
}

interface RollingDigitColumnProps {
  targetDigit: number;
  digitIndex: number;
  totalDigits: number;
  isTriggered: boolean;
}

const RollingDigitColumn: React.FC<RollingDigitColumnProps> = ({
  targetDigit,
  digitIndex,
  totalDigits,
  isTriggered,
}) => {
  // Higher place value (left) spins more revolutions and settles slightly later,
  // creating the signature livecounts.io staggered cascading roll
  const cycles = Math.max(2, (totalDigits - digitIndex) * 2 + 1);
  const reel = React.useMemo(() => generateReelDigits(targetDigit, cycles), [targetDigit, cycles]);
  const finalIndex = reel.length - 1;

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Staggered durations & delays
  // Left digits spin longer (e.g. 2.2s), right digits spin slightly shorter (e.g. 1.6s)
  const durationMs = 1500 + (totalDigits - digitIndex) * 160;
  const delayMs = 60 + digitIndex * 70;

  useEffect(() => {
    if (!isTriggered) return;

    const startTimeout = setTimeout(() => {
      setIsSpinning(true);
      setHasStarted(true);
    }, delayMs);

    const finishTimeout = setTimeout(() => {
      setIsSpinning(false);
    }, delayMs + durationMs);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(finishTimeout);
    };
  }, [isTriggered, delayMs, durationMs]);

  // Target translation in percentage of single digit height
  // Each digit in the vertical column is 100% of the viewport container height
  const translateY = hasStarted ? `-${(finalIndex / reel.length) * 100}%` : '0%';

  return (
    <div
      className="relative inline-block overflow-hidden align-middle select-none mx-[0.5px]"
      style={{
        height: '1.2em',
        width: '0.62em',
        verticalAlign: '-0.15em',
      }}
    >
      {/* Moving Digit Reel */}
      <div
        className="flex flex-col will-change-transform"
        style={{
          transform: `translateY(${translateY})`,
          transitionProperty: 'transform, filter',
          transitionDuration: `${durationMs}ms`,
          // Smooth livecounts.io easing: fast start, gradual silky deceleration to stop
          transitionTimingFunction: 'cubic-bezier(0.12, 0.78, 0.22, 1)',
          filter: isSpinning ? 'blur(0.6px)' : 'blur(0px)',
          opacity: isSpinning ? 0.92 : 1,
        }}
      >
        {reel.map((digit, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center font-artistic-heading font-extrabold text-white text-center leading-none"
            style={{
              height: '1.2em',
              lineHeight: '1.2em',
            }}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* Subtle top & bottom edge vignette for cylindrical reel depth */}
      <div className="absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
    </div>
  );
};

export const OdometerStatCounter: React.FC<RollingOdometerProps> = ({
  value,
  className = '',
}) => {
  const tokens = tokenizeStat(value);
  const totalDigits = tokens.filter((t) => t.type === 'digit').length;
  const [isTriggered, setIsTriggered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTriggered(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    } else {
      setIsTriggered(true);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={`odometer-stat-${uniqueId.replace(/:/g, '')}`}
      className={`inline-flex items-baseline flex-wrap leading-none ${className}`}
      aria-label={value}
      style={{
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {tokens.map((token, idx) => {
        if (token.type === 'digit') {
          return (
            <RollingDigitColumn
              key={`digit-${idx}-${token.digitIndex}`}
              targetDigit={token.targetDigit}
              digitIndex={token.digitIndex}
              totalDigits={totalDigits}
              isTriggered={isTriggered}
            />
          );
        }

        // Static characters (comma, decimal point, plus, suffix text like "M+", "%", etc.)
        return (
          <span
            key={`symbol-${idx}`}
            className="font-artistic-heading font-extrabold text-white inline-block select-none leading-none align-baseline tracking-tight"
            style={{
              marginRight: token.text === ',' || token.text === '.' ? '0.04em' : '0.08em',
              marginLeft: token.text === ',' || token.text === '.' ? '0.04em' : '0.08em',
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

export const FlipClockStatCounter = OdometerStatCounter;
export const RollingOdometerStatCounter = OdometerStatCounter;
