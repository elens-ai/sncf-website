import React from 'react';

/**
 * THE PLATE UNDER A HERO MODEL — a brush stroke of foil, not a card.
 *
 * One diagonal swipe of paint with bristle streaks running off its ends and
 * a few flecks at the corners, a thin white line frame laid across it, and
 * the vertical's name beneath. The stroke is torn by a turbulence-driven
 * displacement (the bristles) and shaded by a diffuse-and-specular lighting
 * pass over fine noise (the crinkled foil), so nothing here is an image: it
 * is tinted from the pillar's own accents (--plate-accent / --plate-tint)
 * and follows them if the CMS changes them.
 *
 * Two tones: `light` foil for the models that go dark on it (Heal, Enrich,
 * Empower), `deep` foil under the pastel Projects bloom, which keeps its own
 * inks. Both filters render once — the wheel moves the card, not the art.
 */
const BODY = 'M46 128L352 62L372 318L74 388Z';
const STREAKS = [
  'M18 152L124 124L128 134L24 162Z',
  'M296 44L392 22L394 31L300 54Z',
  'M318 372L404 350L406 360L322 384Z',
  'M6 334L82 314L84 322L10 344Z',
  'M60 96L200 66L202 72L64 104Z',
  'M230 350L340 324L342 331L233 358Z',
];
const SPLATTER: [number, number, number][] = [
  [28, 100, 3], [36, 118, 1.8], [386, 96, 2.6], [396, 120, 1.6], [24, 392, 2.4], [388, 388, 3.2], [372, 404, 1.5], [60, 60, 1.4], [340, 46, 1.2], [14, 200, 1.6],
];

export const HeroModelPlate: React.FC<{ pillarId: string; label: string; accentA: string; accentB: string; tone: 'light' | 'deep' }> = ({ pillarId, label, accentA, accentB, tone }) => {
  const rough = `hero-plate-rough-${pillarId}`, foil = `hero-plate-foil-${pillarId}`;
  return (
    <span className="hero-model-plate" data-tone={tone} aria-hidden="true" style={{ '--plate-accent': accentA, '--plate-tint': accentB } as React.CSSProperties}>
      <svg className="hero-plate-art" viewBox="0 0 400 440" focusable="false">
        <defs>
          <filter id={rough} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency=".02 .11" numOctaves="2" seed="3" result="bristle" />
            <feDisplacementMap in="SourceGraphic" in2="bristle" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={foil} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="7" result="grain" />
            <feDiffuseLighting in="grain" surfaceScale="1.5" diffuseConstant="1" lightingColor="#fff" result="lit">
              <feDistantLight azimuth="55" elevation="58" />
            </feDiffuseLighting>
            {/* lift the shading so the creases only shade the tint, never grey it */}
            <feComponentTransfer in="lit" result="soft">
              <feFuncR type="linear" slope=".5" intercept=".55" />
              <feFuncG type="linear" slope=".5" intercept=".55" />
              <feFuncB type="linear" slope=".5" intercept=".55" />
            </feComponentTransfer>
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="litClip" />
            <feBlend in="SourceGraphic" in2="litClip" mode="multiply" result="shaded" />
            <feSpecularLighting in="grain" surfaceScale="2.6" specularConstant=".55" specularExponent="9" lightingColor="#fff" result="gleam">
              <feDistantLight azimuth="55" elevation="35" />
            </feSpecularLighting>
            <feComposite in="gleam" in2="SourceAlpha" operator="in" result="gleamClip" />
            <feBlend in="shaded" in2="gleamClip" mode="screen" />
          </filter>
        </defs>
        <g filter={`url(#${foil})`}>
          <g className="hero-plate-ink" filter={`url(#${rough})`}>
            <path d={BODY} />
            {STREAKS.map(d => <path key={d} d={d} />)}
            {SPLATTER.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
          </g>
        </g>
        <rect className="hero-plate-frame" x="62" y="70" width="276" height="276" />
      </svg>
      <span className="hero-model-name">{label}</span>
    </span>
  );
};
