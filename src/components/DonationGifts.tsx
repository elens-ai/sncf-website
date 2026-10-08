import React, { useId } from 'react';

/** What is given, as the contribution planner names it: money, or one of the ways to give that are not money. */
export type GiftWay = 'money' | 'volunteer' | 'talent' | 'resources';

/* A GIFT, PICTURED in the planner's own manner: a glass jar for a financial
   gift, shagun envelopes (the envelope a gift of money is given in, sealed
   with a heart) going into it, with no money drawn; for any other, an open
   box, what that way gives going into it (things for resources or
   equipment: clothes, a toy, food, a phone, books; time and care for
   volunteering; art and music for talent). The gifts wait round it and, one
   after another, swoop in and drop inside, and each fills its heart a step:
   the heart in the middle of the jar, or the heart on the box's front. Full,
   it shines, lets go, and the round begins again. Its inks are the logo's
   petals' (pink, lavender, periwinkle, teal, green) and the honours' gold;
   the heart (and the envelopes' seals) is in the cause's own ink. It is
   drawn in a 320 × 320 box and leaves the caption's line free at its foot.
   Decorative: the planner says in words what is chosen. */

/* each way's gifts: where each waits round its vessel (its centre, tilt and size), in the order they go in */
type Gift = { item: string; x: number; y: number; turn: number; size: number };
const GIFTS: Record<GiftWay, Gift[]> = {
  money: [
    { item: 'envelopePink', x: 64, y: 112, turn: -8, size: 1 },
    { item: 'envelopePeriwinkle', x: 256, y: 112, turn: 10, size: 1 },
    { item: 'envelopeGreen', x: 106, y: 58, turn: 6, size: 0.88 },
    { item: 'envelopeLavender', x: 214, y: 58, turn: -12, size: 0.88 },
    { item: 'envelopeTeal', x: 160, y: 34, turn: -4, size: 0.82 },
  ],
  resources: [
    { item: 'shirt', x: 64, y: 112, turn: -10, size: 1 },
    { item: 'teddy', x: 256, y: 112, turn: 8, size: 1 },
    { item: 'apple', x: 106, y: 58, turn: 0, size: 0.9 },
    { item: 'phone', x: 214, y: 58, turn: 12, size: 0.9 },
    { item: 'book', x: 160, y: 34, turn: -8, size: 0.85 },
  ],
  volunteer: [
    { item: 'clock', x: 66, y: 110, turn: -6, size: 1 },
    { item: 'heart', x: 254, y: 110, turn: 8, size: 0.85 },
    { item: 'heart', x: 110, y: 54, turn: -10, size: 0.6 },
    { item: 'heart', x: 210, y: 54, turn: 12, size: 0.55 },
  ],
  talent: [
    { item: 'palette', x: 66, y: 110, turn: -8, size: 1 },
    { item: 'note', x: 254, y: 110, turn: 6, size: 0.95 },
    { item: 'star', x: 110, y: 54, turn: -10, size: 0.75 },
    { item: 'book', x: 210, y: 54, turn: 10, size: 0.85 },
  ],
};
/* One gift goes in every BEAT, and a round is a beat for each gift and one
   more, so the full vessel has its moment before it lets go. The heart
   beats with them (donation.css: gift-heart). */
const BEAT = 1.1;
const MOUTH_X = 160;

/* The heart, drawn round its own centre: 28 wide, its lobes' tops at -11.55
   and its point at 12. It sits in the box's medallion (centred on 160, 222) a
   touch below the exact middle, where it looks centred: its lobes carry its
   weight. In the jar it is drawn larger about the same point, in the middle
   of the glass, clear of its walls and of the light on them. */
const HEART = 'M0 12 C-5 8 -14 3 -14 -4 C-14 -9 -10 -12 -6 -11.5 C-3.4 -11 -1.6 -9.4 0 -7.4 C1.6 -9.4 3.4 -11 6 -11.5 C10 -12 14 -9 14 -4 C14 3 5 8 0 12 Z';
const HEART_AT = 'translate(160 222.4)';
const JAR_HEART_AT = 'translate(160 222.4) scale(2.3)';
/* Where the heart's level stands once each tenth of it is filled, point to
   lobes (measured from its outline), so every gift fills an equal share of
   it; and the level wholly below it and wholly above it, surface and all. */
const TENTHS = [12, 6.14, 3.63, 1.6, -0.21, -1.91, -3.55, -5.19, -6.85, -8.65, -11.55];
const EMPTY = 14;
const FULL = -13.5;
const levelFor = (share: number) => {
  if (share <= 0) return EMPTY;
  if (share >= 1) return FULL;
  const tenth = Math.floor(share * 10);
  return TENTHS[tenth] + (TENTHS[tenth + 1] - TENTHS[tenth]) * (share * 10 - tenth);
};
/* the level's surface: a wave 14 long, run three hearts wide so it can drift a wavelength and repeat */
const WAVE = `M-42 0 Q-38.5 -1.3 -35 0 ${Array.from({ length: 11 }, (_, i) => `T${-28 + i * 7} 0`).join(' ')} V30 H-42 Z`;

/* where the gifts go: into the vessel's mouth (at MOUTH_X), then down out of
   sight behind the box's front, or down through the jar's neck into its
   heart, fading as they reach it */
const intoY = (vessel: 'box' | 'jar') => (vessel === 'box' ? 228 : 214);

/* One round, as keyframes timed to the gifts' flight. Each gift's landing
   (one every BEAT, the first as the round begins) fills the heart a step: its
   level rises, with a little slosh. Full, it shines (a glow spreads from the
   heart, and a gleam crosses the jar's glass) and holds a moment, then lets
   go, and is empty again before the next round's first gift. They are
   written here, not in donation.css, because the steps follow the number of
   gifts. */
const RISE = 0.4;
const HOLD = 0.9;
const LET_GO = 0.5;
const SETTLE = 'cubic-bezier(.3, 1.35, .5, 1)';
function roundKeyframes(name: string, gifts: number, vessel: 'box' | 'jar') {
  const round = (gifts + 1) * BEAT;
  const at = (seconds: number) => `${+(100 * seconds / round).toFixed(3)}%`;
  const full = (gifts - 1) * BEAT + RISE;
  const shine = full - RISE / 2;
  const level = (filled: number) => `transform: translateY(${+levelFor(filled / gifts).toFixed(2)}px)`;
  const rises = Array.from({ length: gifts }, (_, k) => `${at(k * BEAT)} { ${level(k)};${k === 0 ? ' opacity: 1;' : ''} animation-timing-function: ${SETTLE}; } ${at(k * BEAT + RISE)} { ${level(k + 1)}; }`);
  const frames = [
    `@keyframes ${name}-fill { ${rises.join(' ')} ${at(full + HOLD)} { ${level(gifts)}; opacity: 1; } ${at(full + HOLD + LET_GO)} { ${level(gifts)}; opacity: 0; animation-timing-function: step-end; } 100% { ${level(0)}; opacity: 0; } }`,
    `@keyframes ${name}-glow { 0%, ${at(shine)} { opacity: 0; transform: scale(1); } ${at(shine + 0.05)} { opacity: .5; transform: scale(1); animation-timing-function: cubic-bezier(.2, .7, .3, 1); } ${at(full + 0.9)}, 100% { opacity: 0; transform: scale(1.45); } }`,
  ];
  if (vessel === 'jar') frames.push(`@keyframes ${name}-gleam { 0%, ${at(shine)} { transform: translateX(-130px); animation-timing-function: cubic-bezier(.45, 0, .25, 1); } ${at(shine + 0.9)}, 100% { transform: translateX(130px); } }`);
  return frames.join('\n');
}

/* the jar: its whole outline, lip to foot; the part in front of what is
   inside it (all but the lip's top); and the lip's front. Its neck is tall
   enough to tie a ribbon round. */
const JAR = 'M119 140 V146 Q119 150 123 151 V162 C123 172 108 172 108 184 V248 Q108 264 124 264 H196 Q212 264 212 248 V184 C212 172 197 172 197 162 V151 Q201 150 201 146 V140 A41 7 0 0 0 119 140 Z';
const JAR_FRONT = 'M119 140 A41 7 0 0 0 201 140 V146 Q201 150 197 151 V162 C197 172 212 172 212 184 V248 Q212 264 196 264 H124 Q108 264 108 248 V184 C108 172 123 172 123 162 V151 Q119 150 119 146 Z';
const LIP = 'M119 140 A41 7 0 0 0 201 140 V146 A41 7 0 0 1 119 146 Z';

export function DonationGifts({ way }: { way: GiftWay }) {
  const id = useId().replace(/:/g, '');
  /* this picture's own keyframes, by a name CSS can hold */
  const name = `gift-${id.replace(/[^\w-]/g, '')}`;
  const url = (part: string) => `url(#${id}-${part})`;
  const at = (part: string) => `#${id}-${part}`;
  const ink = (part: string, from: string, to: string) => (
    <linearGradient id={`${id}-${part}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
  );
  const keyline = { stroke: '#fff', strokeWidth: 1.3, strokeLinejoin: 'round' as const };
  /* a shagun envelope in one of the petals' inks (envelopePink, and so on): its flap folded down to a point, sealed
     there with a heart in the cause's ink, a fine border round it */
  const envelope = (petal: string) => (
    <g id={`${id}-envelope${petal[0].toUpperCase()}${petal.slice(1)}`}>
      <rect x="-19" y="-12" width="38" height="24" rx="2.5" fill={url(petal)} {...keyline} />
      <rect x="-16" y="-9" width="32" height="18" rx="1.4" fill="none" stroke="#fff" strokeWidth={0.7} opacity=".5" />
      <path d="M-19 -9.6 L0 2.6 L19 -9.6 V-12 H-19 Z" fill="#fff" opacity=".22" />
      <path d="M-18 -9.6 L0 2.6 L18 -9.6" fill="none" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" opacity=".9" />
      <g transform="translate(0 3.2) scale(.36)"><path d={HEART} fill="currentColor" stroke="#fff" strokeWidth={2.8} strokeLinejoin="round" /></g>
    </g>
  );
  const vessel = way === 'money' ? 'jar' : 'box';
  const gifts = GIFTS[way];
  const round = (gifts.length + 1) * BEAT;
  /* one of this picture's own keyframes, played over the round; set part by part, so donation.css can still hold it
     still (the shorthand would set it playing) */
  const playRound = (keyframes: string): React.CSSProperties => ({ animationName: keyframes, animationDuration: `${round}s`, animationTimingFunction: 'linear', animationIterationCount: 'infinite' });

  /* the box's heart: its medallion, the glow it gives when full, the level rising in it, and its outline; keyed by the
     way, like the gifts, so its round starts afresh with theirs */
  const boxHeart = (
    <g key={`heart-${way}`} className="gift-heart">
      <circle cx="160" cy="222" r="21" fill="#fcfcf4" stroke="#fff" strokeWidth={1.5} filter={url('softSmall')} />
      <circle className="gift-glow" cx="160" cy="222" r="21" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ opacity: 0, ...playRound(`${name}-glow`) }} />
      <g transform={HEART_AT}>
        <g clipPath={url('heartShape')}>
          {/* set full, as reduced motion leaves it */}
          <g className="gift-fill" style={{ transform: `translateY(${FULL}px)`, ...playRound(`${name}-fill`) }}>
            <path className="gift-wave gift-wave-back" d={WAVE} fill="currentColor" opacity=".3" />
            <path className="gift-wave" d={WAVE} fill="currentColor" opacity=".88" />
          </g>
        </g>
        <ellipse cx="-7.5" cy="-5" rx="3.2" ry="2" fill="#fff" opacity=".4" transform="rotate(-35 -7.5 -5)" />
        <path d={HEART} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />
      </g>
    </g>
  );
  /* the jar's heart, in the middle of its glass: the glow it gives when full (kept within the glass), its hollow (a
     pale glass of its own, so it reads empty), the level rising in it, and its outline; keyed by the way, like the
     gifts, so its round starts afresh with theirs */
  const jarHeart = (
    <g key={`heart-${way}`} className="gift-heart">
      <g clipPath={url('glassShape')}>
        <g className="gift-glow" style={{ opacity: 0, ...playRound(`${name}-glow`) }}>
          <path d={HEART} transform={JAR_HEART_AT} fill="none" stroke="currentColor" strokeWidth={0.7} strokeLinejoin="round" />
        </g>
      </g>
      <g transform={JAR_HEART_AT}>
        <path d={HEART} fill="#fff" fillOpacity=".55" />
        <g clipPath={url('heartShape')}>
          {/* set full, as reduced motion leaves it */}
          {/* in full ink: the glass in front of it already softens it */}
          <g className="gift-fill" style={{ transform: `translateY(${FULL}px)`, ...playRound(`${name}-fill`) }}>
            <path className="gift-wave gift-wave-back" d={WAVE} fill="currentColor" opacity=".3" />
            <path className="gift-wave" d={WAVE} fill="currentColor" />
          </g>
        </g>
        <ellipse cx="-7.5" cy="-5" rx="3.2" ry="2" fill="#fff" opacity=".45" transform="rotate(-35 -7.5 -5)" />
        <path d={HEART} fill="none" stroke="currentColor" strokeWidth={0.8} strokeLinejoin="round" />
      </g>
    </g>
  );

  return (
    <svg className="donation-gifts" data-vessel={vessel} viewBox="0 0 320 320" aria-hidden="true" focusable="false">
      <defs>
        <style>{roundKeyframes(name, gifts.length, vessel)}</style>
        <linearGradient id={`${id}-boxFront`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fffaf0" /><stop offset=".6" stopColor="#f3e2bd" /><stop offset="1" stopColor="#e2c48b" /></linearGradient>
        <linearGradient id={`${id}-boxInside`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9854c" /><stop offset="1" stopColor="#cfae72" /></linearGradient>
        {ink('flap', '#fffdf6', '#ead2a0')}
        <linearGradient id={`${id}-flapBack`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6e7c4" /><stop offset="1" stopColor="#dcbd83" /></linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        {/* the jar's glass: tinted at its edges, clear across its middle, as a round jar is */}
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfe6e0" stopOpacity=".9" /><stop offset=".22" stopColor="#eef8f5" stopOpacity=".8" /><stop offset=".5" stopColor="#fbfefd" stopOpacity=".75" /><stop offset=".8" stopColor="#ebf6f3" stopOpacity=".8" /><stop offset="1" stopColor="#c9e2dc" stopOpacity=".9" />
        </linearGradient>
        <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#dcece8" /></linearGradient>
        <linearGradient id={`${id}-mouth`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b3d1c9" /><stop offset="1" stopColor="#e3f0ec" /></linearGradient>
        <linearGradient id={`${id}-gleam`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id={`${id}-glassShape`}><path d={JAR_FRONT} /></clipPath>
        {ink('teal', '#f0fbfd', '#69cbd2')}
        {ink('lavender', '#f6eef8', '#c398c7')}
        {ink('green', '#f1fae6', '#9dce6a')}
        {ink('pink', '#fde6f0', '#eb69a6')}
        {ink('periwinkle', '#eef3fb', '#89a9d8')}
        {ink('gold', '#fff6dc', '#d9bf86')}
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="2" dy="6" stdDeviation="5" floodColor="#244f35" floodOpacity=".14" /></filter>
        <filter id={`${id}-softSmall`} x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#244f35" floodOpacity=".16" /></filter>
        <filter id={`${id}-blur`} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="4" /></filter>
        <clipPath id={`${id}-heartShape`}><path d={HEART} /></clipPath>

        {/* the gifts, each drawn round its own centre */}
        {envelope('pink')}{envelope('periwinkle')}{envelope('lavender')}{envelope('teal')}{envelope('green')}
        <g id={`${id}-shirt`}><path d="M-7 -15 Q0 -9 7 -15 L17 -11 L24 -1 L16 4 L15 2 V18 Q15 20 13 20 H-13 Q-15 20 -15 18 V2 L-16 4 L-24 -1 L-17 -11 Z" fill={url('teal')} {...keyline} strokeWidth={1.4} /><path d="M-7 -15 Q0 -6 7 -15" fill="none" stroke="#fff" strokeWidth={1.6} /></g>
        <g id={`${id}-teddy`}>
          <circle cx="-10" cy="-14" r="6.5" fill={url('lavender')} {...keyline} strokeWidth={1.2} /><circle cx="10" cy="-14" r="6.5" fill={url('lavender')} {...keyline} strokeWidth={1.2} />
          <ellipse cx="0" cy="13" rx="13" ry="11" fill={url('lavender')} {...keyline} strokeWidth={1.2} /><circle cx="0" cy="-4" r="12" fill={url('lavender')} {...keyline} strokeWidth={1.2} />
          <ellipse cx="0" cy="0" rx="5.5" ry="4" fill="#f8f1fa" /><circle cx="-4.5" cy="-7" r="1.4" fill="#3b3550" /><circle cx="4.5" cy="-7" r="1.4" fill="#3b3550" /><circle cx="0" cy="-1.2" r="1.5" fill="#3b3550" /><ellipse cx="0" cy="14" rx="6" ry="5" fill="#f8f1fa" opacity=".7" />
        </g>
        <g id={`${id}-apple`}><path d="M0 -7 C-6 -12 -16 -10 -16 1 C-16 12 -8 18 -3 16 Q0 15 3 16 C8 18 16 12 16 1 C16 -10 6 -12 0 -7 Z" fill={url('green')} {...keyline} /><path d="M0 -7 Q1 -13 4 -16" fill="none" stroke="#6b5a3e" strokeWidth={1.8} strokeLinecap="round" /><path d="M2 -12 Q9 -18 13 -12 Q7 -8 2 -12 Z" fill="#7cb85a" /><ellipse cx="-8" cy="-2" rx="3" ry="5" fill="#fff" opacity=".55" /></g>
        <g id={`${id}-phone`}><rect x="-10" y="-17" width="20" height="34" rx="4.5" fill="#2f4a46" {...keyline} /><rect x="-7.5" y="-13" width="15" height="24" rx="2" fill={url('periwinkle')} /><circle cx="0" cy="13.8" r="1.4" fill="#d7e3ef" /><path d="M-5 -9 L2 -9 M-5 -5 L5 -5 M-5 -1 L0 -1" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" opacity=".85" /></g>
        <g id={`${id}-book`}><path d="M-16 -12 Q-8 -15 0 -11 Q8 -15 16 -12 V13 Q8 10 0 14 Q-8 10 -16 13 Z" fill={url('pink')} {...keyline} /><path d="M0 -11 V14" stroke="#fff" strokeWidth={1.3} /><path d="M-12 -6 Q-7 -8 -3 -6 M-12 -1 Q-7 -3 -3 -1 M3 -6 Q7 -8 12 -6 M3 -1 Q7 -3 12 -1" fill="none" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" opacity=".8" /></g>
        <g id={`${id}-clock`}><circle r="17" fill="#fcfcf4" stroke={url('teal')} strokeWidth={4} /><circle r="17" fill="none" stroke="#fff" strokeWidth={1} /><path d="M0 -10 V0 L7 5" fill="none" stroke="#2f4a46" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /><circle r="1.8" fill="#2f4a46" /></g>
        <g id={`${id}-heart`}><path d="M0 15 C-6 10 -18 3 -18 -6 C-18 -13 -12 -17 -6.5 -16 C-3 -15.5 -1 -13 0 -11 C1 -13 3 -15.5 6.5 -16 C12 -17 18 -13 18 -6 C18 3 6 10 0 15 Z" fill={url('pink')} {...keyline} strokeWidth={1.4} /><ellipse cx="-8" cy="-8" rx="3.5" ry="2.5" fill="#fff" opacity=".6" /></g>
        <g id={`${id}-palette`}><path d="M-2 -17 C-14 -17 -20 -8 -20 1 C-20 11 -12 17 -3 17 C2 17 3 13 1 10 C-1 7 1 4 5 4 H11 C17 4 20 0 20 -4 C20 -12 10 -17 -2 -17 Z" fill={url('gold')} {...keyline} /><circle cx="-10" cy="2" r="3.4" fill="#9dce6a" /><circle cx="-8" cy="-8" r="3.4" fill="#69cbd2" /><circle cx="2" cy="-10" r="3.4" fill="#eb69a6" /><circle cx="11" cy="-6" r="3.2" fill="#c398c7" /></g>
        <g id={`${id}-note`}><path d="M-6 10 V-12 L12 -16 V6" fill="none" stroke="#5b4a7a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="-10" cy="11" rx="6" ry="4.6" fill={url('lavender')} stroke="#5b4a7a" strokeWidth={2} /><ellipse cx="8" cy="7" rx="6" ry="4.6" fill={url('lavender')} stroke="#5b4a7a" strokeWidth={2} /></g>
        <g id={`${id}-star`}><path d="M0 -14 L4 -4.5 L14 -4 L6 2.5 L9 13 L0 7 L-9 13 L-6 2.5 L-14 -4 L-4 -4.5 Z" fill={url('gold')} {...keyline} strokeWidth={1.2} /></g>
        <g id={`${id}-spark`}><path d="M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6 Z" fill="#e2c48b" /></g>
      </defs>

      {[[40, 176, 0.9], [282, 168, 0.8], [124, 22, 0.7], [236, 24, 0.6], [160, 92, 0.75]].map(([x, y, size], i) => (
        <g key={i} className="gift-spark" style={{ '--i': i } as React.CSSProperties}><use href={at('spark')} transform={`translate(${x} ${y}) scale(${size})`} /></g>
      ))}

      {/* the vessel's back (the box's back flap and open mouth; the jar's glass, its lip's top and mouth, and the heart
          in it), then the gifts going into it, then its front: the box's with the heart on it, the jar's glass with a
          ribbon round its neck */}
      <ellipse cx="160" cy="272" rx="72" ry="8" fill="#244f35" opacity=".13" filter={url('blur')} />
      {vessel === 'box' ? <>
        <path d="M118 168 L202 168 L196 152 L124 152 Z" fill={url('flapBack')} stroke="#fff" strokeWidth={1.1} strokeLinejoin="round" opacity=".9" />
        <path d="M114 168 H206 L214 184 H106 Z" fill={url('boxInside')} />
      </> : <>
        <path d={JAR} fill={url('glass')} filter={url('soft')} />
        <ellipse cx="160" cy="140" rx="41" ry="7" fill={url('lip')} />
        <ellipse cx="160" cy="140.6" rx="35.5" ry="5" fill={url('mouth')} />
        {jarHeart}
      </>}
      {/* keyed by the way, so a new way starts its round afresh, what it fills with it */}
      <g key={`gifts-${way}`}>
        {gifts.map(({ item, x, y, turn, size }, i) => (
          <g key={i} className="gift-flow" style={{ '--dur': `${round}s`, '--delay': `${+(i * BEAT - round).toFixed(2)}s`, '--dx': `${MOUTH_X + (i % 2 ? 8 : -8) - x}px`, '--dy': `${intoY(vessel) - y}px`, '--spin': `${(i % 2 ? 1 : -1) * 18 - turn}deg` } as React.CSSProperties}>
            <g><use href={at(item)} transform={`translate(${x} ${y}) rotate(${turn}) scale(${size})`} /></g>
          </g>
        ))}
      </g>
      {vessel === 'jar' ? <>
        <path d={JAR_FRONT} fill="#fff" fillOpacity=".16" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={LIP} fill={url('lip')} stroke="#fff" strokeWidth={1} strokeLinejoin="round" />
        {/* light on the glass, and the gleam that crosses it when the jar is full (set, as reduced motion leaves it, off the glass) */}
        <g fill="none" stroke="#fff" strokeLinecap="round">
          <path d="M116.5 190 Q114.5 218 117.5 244" strokeWidth={4} opacity=".75" />
          <path d="M124.5 194 V228" strokeWidth={1.6} opacity=".5" />
          <path d="M204.5 194 Q206.5 212 204.5 230" strokeWidth={2} opacity=".45" />
          <path d="M127 172 Q138 166.5 149 166" strokeWidth={2.2} opacity=".6" />
        </g>
        <g clipPath={url('glassShape')}>
          <path key={`gleam-${way}`} d="M140 120 L164 120 L134 280 L110 280 Z" fill={url('gleam')} style={{ transform: 'translateX(-130px)', ...playRound(`${name}-gleam`) }} />
        </g>
        {/* a ribbon in the cause's ink round its neck */}
        <path d="M123 153 Q160 158 197 153 V157.6 Q160 162.6 123 157.6 Z" fill="currentColor" />
        <path d="M124.5 153.7 Q160 158.4 195.5 153.7" fill="none" stroke="#fff" strokeWidth={0.8} opacity=".45" />
      </> : <>
        <g filter={url('soft')}>
          <path d="M106 184 L114 168 L82 156 L72 174 Z" fill={url('flap')} {...keyline} strokeWidth={1.2} />
          <path d="M214 184 L206 168 L238 156 L248 174 Z" fill={url('flap')} {...keyline} strokeWidth={1.2} />
          <path d="M106 184 H214 V254 Q214 264 204 264 H116 Q106 264 106 254 Z" fill={url('boxFront')} {...keyline} strokeWidth={1.4} />
          <path d="M112 188 H172 Q150 208 112 214 Z" fill={url('gloss')} opacity=".7" />
        </g>
        {boxHeart}
      </>}
    </svg>
  );
}
