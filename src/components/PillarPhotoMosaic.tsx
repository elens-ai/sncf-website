import React, { useEffect, useId, useRef } from 'react';
import { ProjectsMosaicArt } from './ProjectsMosaicArt';
import { resolveCMSMedia } from '../cms/media';
import { resolveCMSAsset } from '../cms/runtime';
import './heal-photo-mosaic.css';
import { BOOK_COVER, DEPTH_TINT, EMPOWER_COMPANIONS, PILLAR_LOGOS, companionTransform, type MosaicPillar } from './pillarLogoArt';
import { PILLARS } from '../data/pillars';
import { roomPhoto } from '../data/pavilionGallery';

// Smooth brand contours preserve the model proportions without polygon edges.
const TILES = [
  { x: 0, y: 0, w: 48, h: 40, photo: 1 },
  { x: 49, y: 0, w: 45, h: 40, photo: 2 },
  { x: 95, y: 0, w: 51, h: 40, photo: 5 },
  { x: 0, y: 41, w: 48, h: 39, photo: 5 },
  { x: 49, y: 41, w: 45, h: 39, photo: 4 },
  { x: 95, y: 41, w: 51, h: 39, photo: 1 },
  { x: 0, y: 81, w: 48, h: 39, photo: 4 },
  { x: 49, y: 81, w: 45, h: 39, photo: 2 },
  { x: 95, y: 81, w: 51, h: 39, photo: 5 },
];

/* Heal: a soft wave of light rolls over the emblem's surface, like a sheet of
   paper catching the light, from the bottom-left corner to the top-right. The
   emblem itself is untouched: nothing bends or moves, only light and shade
   drift across it. Two broad waves of different width and pace overlap so the
   swell never repeats like stripes. Each is one seamless T×T tile of sine
   bands (perpendicular to the diagonal) slid by exactly (T, −T) per cycle, so
   its loop is invisible. */
const HEAL_WAVES = [
  { tile: 230, seconds: 10 },
  { tile: 150, seconds: 7.5 },
];
const SINE_STEPS = Array.from({ length: 17 }, (_, i) => i / 16);
/* Light on each swell, soft shade in each dip. */
const SHEEN_STOPS = SINE_STEPS.map(o => {
  const s = Math.sin(o * Math.PI * 2);
  return { offset: o, color: s >= 0 ? '#ffffff' : '#0b2a24', opacity: +(Math.abs(s) * (s >= 0 ? .12 : .09)).toFixed(3) };
});
/* The hero's Heal emblem carries the foundation's own photographs: one collage
   per leaf (the Health City and its inauguration, the camps, the pharmacy and
   lab, registration), each replaceable in the CMS. Each box places its image
   over its leaf, in emblem units, in the order of the outline's paths; images
   fill their box, so a replacement photo of any shape still covers its leaf. */
const healHeroLeaves = (): { box: [number, number, number, number]; src: string }[] => [
  { box: [61.62, 4.12, 76.77, 67.85], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-leaf-top-right", "/images/heal-emblem/leaf-top-right.webp") },
  { box: [3.54, 20.12, 57.24, 51.52], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-leaf-top-left", "/images/heal-emblem/leaf-top-left.webp") },
  { box: [61.62, 72.64, 30.81, 27.78], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-leaf-bottom-right", "/images/heal-emblem/leaf-bottom-right.webp") },
  { box: [18.52, 73.15, 42.26, 38.38], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-leaf-bottom-left", "/images/heal-emblem/leaf-bottom-left.webp") },
];

/* Empower's figure is lifted by its companions (EMPOWER_COMPANIONS), here with
   photographs of their own: the room's dealt round one place for the first and
   two for the second, so that each is someone else; and faint. */
/* With its companions the figure spreads wider than Heal's leaves or Enrich's
   book, so the three are drawn together a little smaller than those, about
   their own middle and onto the middle the leaves and the book share. */
const TRIO = { scale: 0.86, from: [69.3, 57], to: [71.5, 58.5] } as const;
const TRIO_FIT = `translate(${TRIO.to[0]} ${TRIO.to[1]}) scale(${TRIO.scale}) translate(${-TRIO.from[0]} ${-TRIO.from[1]})`;

export const PillarPhotoMosaic: React.FC<{ pillar: MosaicPillar; caption?: boolean; heroArt?: boolean }> = ({ pillar, caption = true, heroArt = false }) => {
  const logo = PILLAR_LOGOS[pillar];
  /* Only the hero's Heal emblem shows the foundation's own photographs. */
  const ownPhotos = heroArt && pillar === 'heal';
  /* Empower's figure always stands with its companions. */
  const companions = pillar === 'empower';
  const clip = useId().replace(/:/g, '');
  const tintChannels = [1, 3, 5].map(offset => parseInt(logo.tint.slice(offset, offset + 2), 16) / 255);
  const photoFilter = `url(#${clip}-photo-tone)`;
  const svgRef = useRef<SVGSVGElement>(null);
  /* The light wave runs on SMIL, which CSS cannot pause: stop it off screen
     and for reduced motion. */
  useEffect(() => {
    const svg = svgRef.current;
    if (pillar !== 'heal' || !svg) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onScreen = true;
    const apply = () => (onScreen && !reduced.matches ? svg.unpauseAnimations() : svg.pauseAnimations());
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; apply(); });
    observer.observe(svg);
    reduced.addEventListener('change', apply);
    apply();
    return () => { observer.disconnect(); reduced.removeEventListener('change', apply); };
  }, [pillar]);
  return <figure className="heal-photo-mosaic" data-pillar={pillar} aria-label={`${logo.label} logo photo mosaic`}>
    <svg ref={svgRef} viewBox="-4 -12 174 142" role="img" aria-labelledby={`${clip}-title`}>
      <title id={`${clip}-title`}>{`The ${logo.label} emblem filled with photographs of ${logo.description}`}</title>
      <defs>
        <g id={`${clip}-outline`}>{logo.paths.map(d => <path key={d} d={d} />)}</g>
        <clipPath id={clip}>{logo.paths.map(d => <path key={d} d={d} />)}</clipPath>
        {ownPhotos && logo.paths.map((d, i) => <clipPath key={d} id={`${clip}-leaf-${i}`}><path d={d} /></clipPath>)}
        {/* Blend a pillar-coloured duotone with the original photograph so
            faces and activity details remain readable through the colour. */}
        <filter id={`${clip}-photo-tone`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" result="luminance" />
          <feComponentTransfer in="luminance" result="pillar-tone">
            <feFuncR type="linear" slope={.76 - .04 * tintChannels[0]} intercept={.28 * tintChannels[0]} />
            <feFuncG type="linear" slope={.76 - .04 * tintChannels[1]} intercept={.28 * tintChannels[1]} />
            <feFuncB type="linear" slope={.76 - .04 * tintChannels[2]} intercept={.28 * tintChannels[2]} />
          </feComponentTransfer>
          <feComposite in="pillar-tone" in2="SourceGraphic" operator="arithmetic" k1="0" k2=".72" k3=".28" k4="0" />
        </filter>
        <linearGradient id={`${clip}-bevel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".45" stopColor={logo.edge} stopOpacity=".65" />
          <stop offset="1" stopColor="#163f49" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`${clip}-glaze`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#142f38" stopOpacity=".14" />
        </linearGradient>
        <clipPath id={`${clip}-cover`}><path d={BOOK_COVER} /></clipPath>
        {companions && <>
          <linearGradient id={`${clip}-companion-opacity`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="110">
            <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
          </linearGradient>
          <mask id={`${clip}-companion-mask`} maskUnits="userSpaceOnUse" x="-10" y="-14" width="166" height="140" style={{ maskType: 'alpha' }}>
            <rect x="-10" y="-14" width="166" height="140" fill={`url(#${clip}-companion-opacity)`} />
          </mask>
        </>}
        {pillar === 'heal' && HEAL_WAVES.map((wave, i) => <React.Fragment key={wave.tile}>
            <linearGradient id={`${clip}-sheen-bands-${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={wave.tile} x2={wave.tile / 2} y2={wave.tile / 2} spreadMethod="repeat">
              {SHEEN_STOPS.map(stop => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />)}
            </linearGradient>
            <pattern id={`${clip}-sheen-${i}`} patternUnits="userSpaceOnUse" width={wave.tile} height={wave.tile}>
              <rect width={wave.tile} height={wave.tile} fill={`url(#${clip}-sheen-bands-${i})`} />
              <animateTransform attributeName="patternTransform" type="translate" from="0 0" to={`${wave.tile} ${-wave.tile}`} dur={`${wave.seconds}s`} repeatCount="indefinite" />
            </pattern>
          </React.Fragment>)}
        <linearGradient id={`${clip}-fold`}>
          <stop offset="0" stopColor="#073949" stopOpacity="0" />
          <stop offset=".42" stopColor="#073949" stopOpacity=".08" />
          <stop offset=".49" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".53" stopColor="#073949" stopOpacity=".22" />
          <stop offset=".62" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#073949" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the emblem itself (Empower's with its companions, fitted to the others' size) */}
      <g transform={companions ? TRIO_FIT : undefined}>
      {companions && <g className="pillar-mosaic-companions" aria-hidden="true">
        {EMPOWER_COMPANIONS.map(mate => <g key={mate.dx} mask={`url(#${clip}-companion-mask)`} transform={companionTransform(mate, Math.sign(mate.dx) * 9)}>
          {[6, 5, 4, 3, 2, 1].map(layer => <use key={layer} href={`#${clip}-outline`} transform={`translate(${-layer * .24} ${layer * .38})`} fill={layer > 4 ? '#234a4c' : logo.tint} />)}
          <g clipPath={`url(#${clip})`}>
            <rect x="0" y="0" width="146" height="120" fill={logo.tint} />
          </g>
          <use href={`#${clip}-outline`} fill="none" stroke={`url(#${clip}-bevel)`} strokeWidth=".45" strokeLinejoin="round" />
        </g>)}
      </g>}
      <g className="pillar-mosaic-depth" aria-hidden="true">
        {[6, 5, 4, 3, 2, 1].map(layer => <use key={layer} href={`#${clip}-outline`} transform={`translate(${-layer * .24} ${layer * .38})`} fill={layer > 4 ? '#234a4c' : DEPTH_TINT[pillar] ?? logo.tint} />)}
        <use href={`#${clip}-outline`} transform="translate(-.25 .4)" fill={logo.edge} />
      </g>
      <g className="heal-mosaic-leaves">
        <g id={`${clip}-photo-face`}>
        {ownPhotos ? <>
          {/* the photographs keep their own colour, as in the foundation's print */}
          {healHeroLeaves().map((leaf, i) => <g key={i} clipPath={`url(#${clip}-leaf-${i})`}>
            <rect x={leaf.box[0]} y={leaf.box[1]} width={leaf.box[2]} height={leaf.box[3]} fill={logo.edge} />
            <image href={leaf.src} x={leaf.box[0]} y={leaf.box[1]} width={leaf.box[2]} height={leaf.box[3]} preserveAspectRatio="xMidYMid slice" />
          </g>)}
          {logo.paths.map(d => <path key={d} d={d} fill="none" stroke={logo.edge} strokeWidth=".3" strokeLinejoin="round" />)}
        </> : pillar === 'projects' ? <ProjectsMosaicArt photoFilter={photoFilter} edge={logo.edge} /> : <>
        {pillar === 'enrich' && <g clipPath={`url(#${clip}-cover)`}>
          <rect width="146" height="120" fill="#ffffff" />
        </g>}
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="146" height="120" fill={logo.edge} />
          <g filter={photoFilter}>
            {TILES.map((tile, i) => <image key={i} href={resolveCMSMedia(roomPhoto(pillar, pillar === 'empower' && i === 1 || pillar === 'enrich' && i === 7 ? 3 : tile.photo))} x={tile.x} y={tile.y} width={tile.w} height={tile.h} preserveAspectRatio="xMidYMid slice" />)}
          </g>
          {pillar === 'enrich' && <rect width="146" height="120" fill={`url(#${clip}-fold)`} /> }
        </g>
        {logo.paths.map(d => <path key={d} d={d} fill="none" stroke={logo.edge} strokeWidth=".3" strokeLinejoin="round" />)}
        </>}
        </g>
        <g clipPath={`url(#${clip})`} aria-hidden="true">
          <rect width="146" height="120" fill={`url(#${clip}-glaze)`} />
          {/* Heal's soft wave of light, drifting over the surface. */}
          {pillar === 'heal' && HEAL_WAVES.map((wave, i) => <rect key={wave.tile} x="-4" y="-12" width="174" height="142" fill={`url(#${clip}-sheen-${i})`} />)}
        </g>
        <use href={`#${clip}-outline`} fill="none" stroke={`url(#${clip}-bevel)`} strokeWidth=".45" strokeLinejoin="round" aria-hidden="true" />
      </g>
      </g>
    </svg>
    {caption && <figcaption>{PILLARS.find(item => item.id === pillar)?.emblemCaption ?? logo.caption}</figcaption>}
  </figure>;
};
