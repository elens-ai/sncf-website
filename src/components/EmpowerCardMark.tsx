import React, { useRef, useState, useEffect } from 'react';

interface EmpowerCardMarkProps {
  className?: string;
}

const FIGURE_SPRITE_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAArMAAAIiCAYAAADb3UD9AACVrElEQVR42uz9Z5gch3kmaldX6uqc8/T05IwZTMAggwBBgCQIMIpRVLKCFa21P/scW9/62LL3WF7vrtday7JshbWySIqkSDBTTIiDDAyAAQaTY0/nnKq6qs4PctYwLcgMCNXTz/1nrofURZHoqp6qp99+iyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACWqfBHAADwwdjVBlJHcRRLUqSB0bCUiiQZFU3JhCzTKooU5LJIEiQpE7JMqUiyLIsiraIoSZZliZCkjFAo8VJZKklliZfK0lIxKeJPFQAAF7MAAFeFldWTpEpFWBg9IxGSbGZ0nEzIspHWcCxJ0z6N1UWpKNrMai1aSm1wqk0BXioXNBRjyIt8WkuxxoIoZC7PRUnIciSjTwi5pbIk8kvF1JxMyHK4lAoXRL4UK2WzEiHJaaFQolWkKiHkBFGW5FAxhQtdAABczAIA/HYuzkSpCBVhZnSMmzMb/Fqb28LqLBZG79TRapOJ0ToZklLrac6hpdQ2LaW2EgRBGBjOR6soDalS0ZIsl9/9U0WoSJmQpeVMEASRK5dCZVksFUU+UZSEVLZcjPBSOZcRCtGcWEplhGIiKeRic/nowmIxkYiWMkU0uAAAuJgFAPg3AloHY2K0bEBntxlpjd6jsfi0lNpQp3N06yjO7tfa1hEEQZgZXT0vlTNGRhMoSUJSTTLm5Z+CJGYZktK/159lWczTKkr77n9OQeSjDElpE3xunFSp6GAhcTIv8onpXOREupyPLxWT8wWRL87n4+GkkCsuFOKFOJ+V8CoCAC5mAQCqSKvBy1lYHedUm8wezuwK6BwtHs7S4tNYe/U059bRaidBEISGYm0EQRC0itL+psaVVKno5X/mh83LF7jLf70si3mCIAhBEvNlWSzkyqUwL5WzcT47ESmlx6dzkbNLxcT8YjERjvPZXLCQzM0XYmW8ugCAi1kAgBWoVmtntJSaaja4nbVau7/LWLvJyur9bs68ilKRrJMzdouyxH+QpvV6/0wJ+amyLBbCxfT5nFiMjGYW98/nY1PDqdlLcT5bGM0sFvGKAwAuZgEAKpyNNZA6Wk016JzmJr0n0KB3tns4S0tA61hrZfUtRkYT+E2NKK2itMv/jKvdwH7QfKVGuCDy0bxYCgcLiZPBYnJkKhcensqFxy9lgguRUrqIthYAcDELAFCBBiyNRq/GYm0xeJp9GmtTp9F/h4nR+h1qY/eHnXlVys93/3csN7YT2dBrM/nIqZH0/MlQMRUdSc+HZ/NRAUcFAOBiFgBAwVyciXKqTVyDzuXoMQf6Vpvr7nCqTR0WVtdEqyiOISn98v9WKY3r1c6SLJclQuJTQn46IxQXxrLBN84kZ94aSc+NLRQS6bFssIQjBQBWCgp/BACwElhZPdlhrDGsMgV8t7p7dq63tdyx0d76eQ9n6bOy+haCIKTlRpNSkawgiVmaJLmVmGmS5ERZLulpzqehWZtfa1/rUBudHaaaVUZGwxsZTakklgsMSRMFkZdx9ABAJavIZtbGGsgYn8EqGgAgCIIg2o0+zWpzXV27wdfdZvRtqdHY1trVhnaSINlrsXWg0nJZFvMkQbIlSUhGS5mRkfTcc6OZ4PHTyelz49mlBGZqAaCSVVwz22Xya1eZ/O411qYaLaUWJFkWsuUimgWAKtRq8HI95oBth6t781ZH58ObHG1fsasNrTbW0CbKcunyprIaGtkrZYakdGVZyqspxsyStK7J4N7h4kw1Hs5sIlWquJnRSXmxVMqjpQWoWvU6J1uvc2rqdU5dUeL5Sno/qKhmtkHnYrc6OzpvcXZ/XEuzlslseOjNyPmXzqXmFidzIR6HIkB1cHEmqlHnNvVa6toHLI23BbSOtW7O3E+TJKfELQRKzTE+MxIups+PZhZfP5GY2Hc0PjGBeVqA6tNjDui6TYGG1ea6DUVRyO2Ljrz+8tKZxUr596+YZtbNmalOk991l2/NZzuMNfcEtI6tRkZr92vtNZRKFVMRqsxiMYE3YYAVrkHnYjc72po3O9q27nT1/F6DznWzizP1yQQhMiSlq+YG9v1mPc35jIzGF9DZ1xoZLePkjLRMEDFJloV0uYBRLoAVzs2ZqY32Vs9me/v6XZ7eL7cYPDsCWkd/jM+cLYpCZKmYrIiisGIuZtuNPuMdnr7dq811D9jVhg5JlstGRlNrUxuaarS2Ro5iMyZGmxckMZ8QcnhuOcAKfNPtNddbt7u61m6xd9y31tb0Ow61sUtLs05Jlss0SXIEQRCUimSR33umVRRHqUjGp7GucapNAYfaqKZVZJIgiHy4lMIqL4AVyMrqyRaDR7vF3t6+2d5+62Z7++f8WttGM6NrIFSEzJEsGeczl9JCIZkS8oq/sa2Ii9l6nZPd4epZO2htvLdB77rt8oZBTTFmWkWpmwyujTbWoDEyGr4oCVGCIKRcuYT5L4AVoM3g43rMdb47PH0fWWttenCVufZhhqS0LEkb0bBenZlaUZZLVlbfYmF13ga9q5MlqbiaYrJpoVDAxgOAlaNB52LbjTW2W909t6y3td47YG38HT3NeTmKtQqSmNVQrIMlaY4haT5YTIzmxVJR6ddTir+YtbEGctDW5N/uXPVQp8l/P6Ui2Xc3DBzFWDmStXg4S7eNNTjsagPFS+WIKEulJFpagIrWa67Xb3G0r97t7fvsKlPtvTUa20YVoaIY8u0ndqFhvbpZT3MeA63x1modq4yMRlSpVNF8mc9WQjsDAL/dKlOtbtDa1Hy7p/fBPnPDfa1Gz51qkjGzJK2//P1AR6tdapJhVQQRWSgkppQ+bqD4i9m11mb7Znv7to321i8zJKVjSEp7pb2KMkGILs7Ua2J0Np/G6qBVVFJHc6XZfLSAQxigsrg4E7XF3uHb7Ghbf5t79e8HtI7NVlbfWpalPLYUXNuspmgTS9F6v9a+xkBrVDqayxclIS4RkoiNBwCVx8NZqC2Odt9GW9vgre6ezzbrPTt8GuuG37b1xcLqmkmVqliUhNlwKRVS8g2toi9m240+zVZnx+DNzq4vWlhdo5pkzO+lYTAx2oCF1fnrdc5OA60p6xkuXRCFHJoFgMrQrHerN9vbm7c5u/ZsdXT+nlNtWqWj1Z73cv4jX53MkJSWUdE6D2fptqsNDhOjFQoiHy5IfAkjXACVwcYa3p6NdbR3bHN03rXF0fF5n8a6zsRo6/+j9wNJlstaWm0jCCKd4LPjl7LBFC5m36cajY3uNtf6drl7P+vT2NbqaLX7/TQMWlrt0lCs1a+1rTYzWtrw9hNv4oQKs7QASr+Q3enuGdjq6Hpw0Nb0OT3NuTmKsaAxvTFPEpMJQnRz5j4zo7OYWS2ZEvKzZVkqoRwAULZ6nZNtMXgsd3j6bt1kb3+439LwOzpa7VyejX0v5z9BELKF1dcmhNy5vMgvBRW6NUqxF7OdJr9pl7vvri5T7T1WVt/6QRqGd74gonNypjan2uR1cEZaJuS4IIkFzNICKIuV1ZPtRp9+h6tn7TZn5ydWmWofUlOMiSVpwwc5/5GvbjazukYjrbXZWAMnylKIl8rZOJ/F+yiAAvVZ6g3rrM2tt7pX3z9gbXy4Ue+6lVHROoZ8ew/3+/mEhlKRjJ7mtEkhdzEp5GJKvH5S5MVss96t3uHuXr/W2vRwrdZ+04f9li5JkJSbM/dZWYOnRmv1MCoqwZJ0fr4QK+KQB7jx3vkozHind2DXRnvro+1G330EQcgsSRvQkConm1ltg4nROr0ai0eQy3NlWcpgfReAcng4C7XZ3u5bb2tZs8vT93vNBvcOD2dZc/ls7Ps9/1mSNrIkreMoRgoWk+cz5UJeaZ9wK+5i1sWZqPW21oabHB33txlq7qZJSnO1GgYjo6m1q40ttTp7C0cyGY5iU6IsFdHSAtzYC9l2o8+yy9O3a7O9/XcbdK5bl7cVfJjzHfnaZB2tdhkYjdvFmVyCJM7nxGIsWsqUcSQD3FirTLW6DfbWlm3Orj03OTq+6NVY1hgZTe3VOP81FGtjVDQjEXJ4oRCfDCpsuwGlwBfDtN7WsmGzvf331CRjvPrf0mXMHMWa63SOAQuroy2sXhbkckwmCDFbLmKWFuA6X8i2GDymj9Sse2CNtenhgM5x8+XbCtCIKjNrKNahodQWD2epLYr8JC+Vk2hoAW6MBp2L7bXU229zr96+ztZy14C14XcMDOdb/q7B1Tr/jYymViLkdFES5haLiaVMuaiYuXlFXcw26l3sOltzx3bnqs86OGMnS9LGa9EwsCSt50jW4tNY+2yswe7kjKwoS9GSWM7jSw0A10+vud6yx9u/e621+RMBnf1mNKCVk98uBhijU21y8VJ5Fg0twPXXYw7o1tua22539z7UZ6m/r9XgvUtNMpZrsYdbJKSigdF4ZEJOZMqFyUsZ5Ww3UMzFrIszUe0Gn+Mu35rPNOpdt+hoznM9vqXr4ky9FkbvqtFaPQQhL2kpNT9XiGEvLcA1Pt+7TQHz3b41d6+1Nn80oLPfjMazMhtajmJNHs5SmxdL44IkptDQAlx7NRobvcnR5t1gax3c5en7vSaDa7tXY1knyTJ/rfZwL38HycLqaqOlzHBB5ENK2W6gmIvZVoNXf6t79Y5+S8NH7WpDx/VsGAyMpsbIaD1+rb3RxGpkPa1JF0Qee2kBrgErqyfbDTWWPd6BPettLZ/ya21bZIKQ0HhWbkOrpzmXTW0wlyVpIS+WopFSGg0twDVgVxvIJr1Hu8XR3rXduerezfb2z3k05n4jow1cr/OfJEiKIalytJS5mBLySSVcK1FKeXG2Ojq7NtrbHmrSu+8oSULySk/6ulZZS6tdeppz1WrtvWZGy1hZvVQQ+UhZlkQ8lxzg6l3INus9xrt8A3cPWpseCejsmJFdAVlNMWYNpba4ObM/Wy6NlSQhgQtagKurVmtnWg1e625v/23rbS339ZgDj7w9G/ve9sZevfOdNtEkxTIkVZjIhs4uFOI3fDOUIi5mB61N9q2Ojtv6LPUf/yB70K5WXt5L69VYe22swWFV6yQVQaRkgihinyLAh9dl8htvd/fu2GRv+1xA58CM7ApsaK2s3pgXS5PpciGe4LEpBuBq6DXX6wcsjY073T13D1qbP9ZkcN/+zjXLDdnDraPVLkmWcgWJn4rz2aUbfY10wy9mV5lqdZvt7QM3OTq/oKc5L0vS+hvZMDAkpSMIQnKojausrN7dZHC3qFREmCap7LwC7j4AKlWnsUaz2zNwy0Z7y8fqdM5b0Miu1IaWNZsZnS7B50aLopBNYPUhwAcW0DqYLY72mvW2lsHdnv6vNhs8t3g0lkFRlksMSelu5PluVeubRFmK5cr87GIxEb+Rn2Lf0ItZN2em+iz1tbe6ez5Vp3Ns1VCsXSmNg0wQkpnV1hsYjbtWa2/V0uo8R7JJXioXMEsL8P406z3qne6ewZscHZ9qMrh3qQgVhUZzZWaOYiwcxRiMtIZMCLnJlJDPYO0hwPtjVxvINqNPv83ZuXqrs/Oezfb2L7g582oTo61XyvlOvv1kMFtOLE5F+czMjSz8bujFbJvBZ7jD23d3m8F3m5XVtyixcXh7nyJrDegcAyZGqzKz2rIoS0nspQV4b7waC32zs7Nzs6P9I93mwKOiLPHXeyYe+fpmPc35NBRrUJNMYamYHMuLpVIe3z0AeM83/72WOu8uT+/uNdamuwetTV/QUGqbmmLMSjvfVYRKZWK0tqVi8mScz8VuVNl3wy5ma7V2Zquzc/V6W+vDdTrHdpVKRSq1cbhsL22vQ21yOdRGWiLkRFkW85gJA7gyK6snB61Nvu2uVff2Wxo+eSNnvJCvb9bTnFdNMrRMEOFgMTEbKmJlF8BvY2MNZLcpYFpva+7a5en71Gpz3QN1Orm2yv7fX9jL25u/72b2g427k935mN/95v/032j5L/f4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgMr0fwC3rWlVvLq67AAAAABJRU5ErkJggg==';

export const EmpowerCardMark: React.FC<EmpowerCardMarkProps> = ({
  className = '',
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!stageRef.current || !cardRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    const maxTilt = 10;
    const rotateY = (x - 0.5) * maxTilt * 2;
    const rotateX = -(y - 0.5) * maxTilt * 2;

    cardRef.current.style.transform = `rotateX(${rotateX.toFixed(
      2
    )}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.035)`;
  };

  const handleMouseEnter = () => {
    setIsHover(true);
  };

  const handleMouseLeave = () => {
    setIsHover(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const handleTouchStart = () => {
    handleMouseEnter();
  };

  const handleTouchEnd = () => {
    setTimeout(handleMouseLeave, 1600);
  };

  return (
    <div
      ref={stageRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ perspective: '1100px' }}
      className={`relative w-full h-full flex items-center justify-center pointer-events-auto cursor-pointer select-none ${
        isHover ? 'hover is-hover-stage' : ''
      } ${className}`}
      title="EMPOWER"
    >
      {/* Tilting card surface */}
      <div
        ref={cardRef}
        className="empower-card relative w-full h-full flex items-center justify-center transition-transform duration-350 ease-out will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(0deg) rotateY(0deg) scale(1)',
          transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Soft blurred pink-white glow blooming behind the figure */}
        <div
          className="empower-glow absolute left-1/2 pointer-events-none rounded-full transition-all duration-600 ease-out"
          style={{
            bottom: '28%',
            width: '66%',
            height: '66%',
            background:
              'radial-gradient(circle, rgba(255, 214, 233, 0.95) 0%, rgba(255, 214, 233, 0) 70%)',
            filter: 'blur(6px)',
            opacity: isHover ? 1 : 0,
            transform: isHover
              ? 'translate(-50%, 45%) translateZ(-90px) scale(1)'
              : 'translate(-50%, 45%) translateZ(-90px) scale(0.5)',
            transition:
              'opacity 0.5s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* 6 echo copies fanning left */}
        {[6, 5, 4, 3, 2, 1].map((i) => (
          <div
            key={`echo-left-${i}`}
            className="empower-echo absolute left-1/2 pointer-events-none transition-all duration-600 ease-out"
            style={{
              bottom: '28%',
              width: '47%',
              marginLeft: '-23.5%',
              aspectRatio: '691 / 546',
              backgroundImage: `url("${FIGURE_SPRITE_DATA}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              backgroundSize: 'contain',
              transformOrigin: '50% 100%',
              transform: isHover
                ? `rotate(${i * -8}deg) translateZ(${i * -14}px) scale(${
                    1 - i * 0.045
                  })`
                : 'rotate(0deg) translateZ(0px) scale(0.92)',
              opacity: isHover ? 0.46 - i * 0.058 : 0,
              transition:
                'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease',
            }}
          />
        ))}

        {/* 6 echo copies fanning right */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={`echo-right-${i}`}
            className="empower-echo absolute left-1/2 pointer-events-none transition-all duration-600 ease-out"
            style={{
              bottom: '28%',
              width: '47%',
              marginLeft: '-23.5%',
              aspectRatio: '691 / 546',
              backgroundImage: `url("${FIGURE_SPRITE_DATA}")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              backgroundSize: 'contain',
              transformOrigin: '50% 100%',
              transform: isHover
                ? `rotate(${i * 8}deg) translateZ(${i * -14}px) scale(${
                    1 - i * 0.045
                  })`
                : 'rotate(0deg) translateZ(0px) scale(0.92)',
              opacity: isHover ? 0.46 - i * 0.058 : 0,
              transition:
                'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease',
            }}
          />
        ))}

        {/* Central main figurine sprite (person with both arms raised, color #DE4A94) */}
        <div
          role="img"
          aria-label="Empower figurine logo"
          className="empower-figure-main absolute left-1/2 pointer-events-none transition-all duration-400 ease-out"
          style={{
            bottom: '28%',
            width: '47%',
            marginLeft: '-23.5%',
            aspectRatio: '691 / 546',
            backgroundImage: `url("${FIGURE_SPRITE_DATA}")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom center',
            backgroundSize: 'contain',
            transform: 'translateZ(46px)',
            filter: isHover
              ? 'drop-shadow(0 16px 22px rgba(74, 15, 48, 0.22)) drop-shadow(0 0 18px rgba(222, 74, 148, 0.35))'
              : 'drop-shadow(0 0 0 rgba(0, 0, 0, 0))',
            transition: 'filter 0.4s ease',
          }}
        />

        {/* Wordmark "EMPOWER" (letter-spaced, semi-bold, #C93E82) fading in below figurine */}
        <div
          className="empower-label absolute left-1/2 pointer-events-none font-semibold text-center select-none"
          style={{
            bottom: '10%',
            transform: isHover
              ? 'translate(-50%, 0) translateZ(26px)'
              : 'translate(-50%, 10px) translateZ(26px)',
            opacity: isHover ? 1 : 0,
            letterSpacing: '0.24em',
            fontSize: '1rem',
            color: '#C93E82',
            whiteSpace: 'nowrap',
            transition:
              'opacity 0.5s ease 0.18s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.18s',
          }}
        >
          EMPOWER
        </div>
      </div>
    </div>
  );
};
