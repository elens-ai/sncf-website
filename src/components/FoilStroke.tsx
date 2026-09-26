import React from 'react';

/**
 * A BRUSH STROKE OF FOIL — the site's plate.
 *
 * The same swipe of paint the hero plates are made of, as a component any
 * page can lay under a date, a picture or a name: a diagonal body with
 * bristle streaks running off its ends and flecks at the corners, torn by a
 * turbulence-driven displacement and shaded by a lighting pass over fine
 * noise (crinkled foil). Its colour is `--foil` on the element around it,
 * so the page decides the tint. `id` must be unique on the page: the two
 * filters are named from it.
 */
const PORTRAIT = {
  box: '0 0 400 440',
  body: 'M46 128L352 62L372 318L74 388Z',
  streaks: ['M18 152L124 124L128 134L24 162Z', 'M296 44L392 22L394 31L300 54Z', 'M318 372L404 350L406 360L322 384Z', 'M6 334L82 314L84 322L10 344Z', 'M60 96L200 66L202 72L64 104Z', 'M230 350L340 324L342 331L233 358Z'],
  flecks: [[28, 100, 3], [36, 118, 1.8], [386, 96, 2.6], [396, 120, 1.6], [24, 392, 2.4], [388, 388, 3.2], [372, 404, 1.5], [60, 60, 1.4], [340, 46, 1.2], [14, 200, 1.6]] as [number, number, number][],
};
const LANDSCAPE = {
  box: '0 0 400 300',
  body: 'M28 66L384 38L394 252L44 288Z',
  streaks: ['M6 84L110 70L112 78L8 92Z', 'M300 30L398 18L399 26L302 40Z', 'M318 262L404 250L405 258L320 272Z', 'M2 250L70 240L72 247L4 258Z'],
  flecks: [[20, 50, 2.4], [392, 60, 2], [16, 280, 2], [390, 284, 2.6], [200, 20, 1.4]] as [number, number, number][],
};

export const FoilStroke: React.FC<{ id: string; shape?: 'portrait' | 'landscape'; className?: string }> = ({ id, shape = 'portrait', className }) => {
  const art = shape === 'landscape' ? LANDSCAPE : PORTRAIT;
  const rough = `${id}-rough`, foil = `${id}-foil`;
  return (
    <svg className={className} viewBox={art.box} aria-hidden="true" focusable="false">
      <defs>
        <filter id={rough} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency=".02 .11" numOctaves="2" seed="3" result="bristle" />
          <feDisplacementMap in="SourceGraphic" in2="bristle" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={foil} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="7" result="grain" />
          <feDiffuseLighting in="grain" surfaceScale="1.5" diffuseConstant="1" lightingColor="#fff" result="lit"><feDistantLight azimuth="55" elevation="58" /></feDiffuseLighting>
          <feComponentTransfer in="lit" result="soft"><feFuncR type="linear" slope=".5" intercept=".55" /><feFuncG type="linear" slope=".5" intercept=".55" /><feFuncB type="linear" slope=".5" intercept=".55" /></feComponentTransfer>
          <feComposite in="soft" in2="SourceAlpha" operator="in" result="litClip" />
          <feBlend in="SourceGraphic" in2="litClip" mode="multiply" result="shaded" />
          <feSpecularLighting in="grain" surfaceScale="2.6" specularConstant=".55" specularExponent="9" lightingColor="#fff" result="gleam"><feDistantLight azimuth="55" elevation="35" /></feSpecularLighting>
          <feComposite in="gleam" in2="SourceAlpha" operator="in" result="gleamClip" />
          <feBlend in="shaded" in2="gleamClip" mode="screen" />
        </filter>
      </defs>
      <g filter={`url(#${foil})`}>
        <g className="foil-ink" filter={`url(#${rough})`}>
          <path d={art.body} />
          {art.streaks.map(d => <path key={d} d={d} />)}
          {art.flecks.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        </g>
      </g>
    </svg>
  );
};
