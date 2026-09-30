import React, { useId } from 'react';
import { ProjectsMosaicArt } from './ProjectsMosaicArt';
import { resolveCMSMedia } from '../cms/media';
import './heal-photo-mosaic.css';
import { PILLAR_LOGOS, type MosaicPillar } from './pillarLogoArt';

// Smooth brand contours preserve the model proportions without polygon edges.
const BOOK_COVER = 'M6 23L11.65 20V95C35 92 54 97 71.3 105C94 97 116 92 132.34 95V20L138 23V105H6Z';
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

export const PillarPhotoMosaic: React.FC<{ pillar: MosaicPillar; caption?: boolean }> = ({ pillar, caption = true }) => {
  const logo = PILLAR_LOGOS[pillar];
  const clip = useId().replace(/:/g, '');
  const tintChannels = [1, 3, 5].map(offset => parseInt(logo.tint.slice(offset, offset + 2), 16) / 255);
  const photoFilter = `url(#${clip}-photo-tone)`;
  return <figure className="heal-photo-mosaic" data-pillar={pillar} aria-label={`${logo.label} logo photo mosaic`}>
    <svg viewBox="-4 -12 174 142" role="img" aria-labelledby={`${clip}-title`}>
      <title id={`${clip}-title`}>{`The ${logo.label} emblem filled with photographs of ${logo.description}`}</title>
      <defs>
        <g id={`${clip}-outline`}>{logo.paths.map(d => <path key={d} d={d} />)}</g>
        <clipPath id={clip}>{logo.paths.map(d => <path key={d} d={d} />)}</clipPath>
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
        <linearGradient id={`${clip}-fold`}>
          <stop offset="0" stopColor="#073949" stopOpacity="0" />
          <stop offset=".42" stopColor="#073949" stopOpacity=".08" />
          <stop offset=".49" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".53" stopColor="#073949" stopOpacity=".22" />
          <stop offset=".62" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#073949" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="pillar-mosaic-depth" aria-hidden="true">
        {[6, 5, 4, 3, 2, 1].map(layer => <use key={layer} href={`#${clip}-outline`} transform={`translate(${-layer * .24} ${layer * .38})`} fill={layer > 4 ? '#234a4c' : logo.tint} />)}
        <use href={`#${clip}-outline`} transform="translate(-.25 .4)" fill={logo.edge} />
      </g>
      <g className="heal-mosaic-leaves">
        <g id={`${clip}-photo-face`}>
        {pillar === 'projects' ? <ProjectsMosaicArt photoFilter={photoFilter} /> : <>
        {pillar === 'enrich' && <g clipPath={`url(#${clip}-cover)`}>
          <image href={resolveCMSMedia('/images/pavilion/enrich-5.jpg')} width="146" height="120" preserveAspectRatio="xMidYMid slice" filter={photoFilter} />
          <rect width="146" height="120" fill={logo.tint} opacity=".4" />
        </g>}
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="146" height="120" fill={logo.edge} />
          <g filter={photoFilter}>
            {TILES.map((tile, i) => <image key={i} href={resolveCMSMedia(`/images/pavilion/${pillar}-${pillar === 'empower' && i === 1 || pillar === 'enrich' && i === 7 ? 3 : tile.photo}.jpg`)} x={tile.x} y={tile.y} width={tile.w} height={tile.h} preserveAspectRatio="xMidYMid slice" />)}
          </g>
          {pillar === 'enrich' && <rect width="146" height="120" fill={`url(#${clip}-fold)`} /> }
        </g>
        {logo.paths.map(d => <path key={d} d={d} fill="none" stroke={logo.edge} strokeWidth=".3" strokeLinejoin="round" />)}
        </>}
        </g>
        <g clipPath={`url(#${clip})`} aria-hidden="true">
          <rect width="146" height="120" fill={`url(#${clip}-glaze)`} />
        </g>
        <use href={`#${clip}-outline`} fill="none" stroke={`url(#${clip}-bevel)`} strokeWidth=".45" strokeLinejoin="round" aria-hidden="true" />
      </g>
    </svg>
    {caption && <figcaption>{logo.caption}<span>Illustrative photography</span></figcaption>}
  </figure>;
};
