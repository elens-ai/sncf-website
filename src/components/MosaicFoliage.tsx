import React from 'react';

/**
 * THE ALBUM'S ARTWORK — what makes a page of prints an album page.
 *
 * MosaicAlbumDefs holds the two SVG filters the album paints with, once for
 * the whole section: `mosaic-wash` tears and feathers a photograph's edge
 * like a watercolour bleed (noise-driven displacement over an already soft
 * mask, then a breath of blur), `mosaic-watercolour` roughens the foliage
 * so its leaves read as pigment rather than vector.
 *
 * MosaicFoliage is the sprig that sits behind the prints: a fixed fan of
 * leaves, a few berries on stems, nothing random per render. The leaves
 * take the chapter's own inks (--chapter-a / --chapter-b) mixed with an
 * autumn gold and rust, so Heal's sprig is a green one, Projects' a blue
 * one, and each leaf pools darker toward its edge the way wet paint does.
 */
export const MosaicAlbumDefs: React.FC = () => (
  <svg className="mosaic-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <filter id="mosaic-wash" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".009 .012" numOctaves="3" seed="9" result="grain" />
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="38" xChannelSelector="R" yChannelSelector="G" result="torn" />
      <feGaussianBlur in="torn" stdDeviation=".7" />
    </filter>
    <filter id="mosaic-watercolour" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="4" result="grain" />
      <feDisplacementMap in="SourceGraphic" in2="grain" scale="7" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** One leaf, 100 long and 76 wide, growing along +x from its stem. */
const LEAF = 'M0 0C20-34 68-38 100 0C68 38 20 34 0 0Z';
/** x, y of the stem, angle, scale, and which of the three tones it wears. */
const LEAVES: [number, number, number, number, number][] = [
  [150, 262, -150, 1.15, 0],
  [160, 258, -118, 1.0, 1],
  [172, 254, -92, 1.25, 2],
  [182, 256, -66, .95, 0],
  [190, 262, -38, 1.2, 1],
  [196, 270, -12, .9, 2],
  [140, 270, -172, .8, 1],
  [168, 262, -130, .6, 2],
  [186, 266, -50, .62, 0],
];
const STEMS = ['M150 262Q132 236 120 210', 'M154 262Q142 244 128 226', 'M192 266Q218 246 236 226', 'M194 268Q226 254 246 240'];
const BERRIES: [number, number, number][] = [[120, 210, 6], [128, 226, 4.5], [236, 226, 5.5], [246, 240, 4]];

export const MosaicFoliage: React.FC<{ pillarId: string }> = ({ pillarId }) => {
  const tone = (n: number) => `mosaic-leaf-${pillarId}-${n}`;
  return (
    <svg className="mosaic-foliage" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={tone(0)} cx=".5" cy=".5" r=".62">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--chapter-b) 55%, #f3d67e)', stopOpacity: .78 }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--chapter-a) 70%, #6b3f14)', stopOpacity: .96 }} />
        </radialGradient>
        <radialGradient id={tone(1)} cx=".5" cy=".5" r=".62">
          <stop offset="0" style={{ stopColor: '#f0c86a', stopOpacity: .8 }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--chapter-b) 40%, #c4772a)', stopOpacity: .96 }} />
        </radialGradient>
        <radialGradient id={tone(2)} cx=".5" cy=".5" r=".62">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--chapter-b) 75%, #ffffff)', stopOpacity: .8 }} />
          <stop offset="1" style={{ stopColor: 'var(--chapter-a)', stopOpacity: .96 }} />
        </radialGradient>
      </defs>
      <g filter="url(#mosaic-watercolour)">
        {STEMS.map(d => <path key={d} d={d} fill="none" stroke="color-mix(in srgb, var(--chapter-a) 55%, #5a3a1a)" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />)}
        {LEAVES.map(([x, y, angle, scale, t], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} style={{ mixBlendMode: 'multiply' }}>
            <path d={LEAF} fill={`url(#${tone(t)})`} />
            <path d="M8 0H90" fill="none" stroke="rgb(255 255 255 / .4)" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ))}
        {BERRIES.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={`url(#${tone(1)})`} style={{ mixBlendMode: 'multiply' }} />)}
      </g>
    </svg>
  );
};
