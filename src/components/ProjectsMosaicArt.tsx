import React, { useId } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { resolveCMSAsset } from '../cms/runtime';
import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';

/* One photograph to a petal, laid over the whole petal (its box, in emblem units): the forestry, water and
   healthcare the emblem stands for, as the Oneness Vann sign among its saplings on the top petal, a sapling
   planted at Sant Nirankari Health City on the right, and Project Amrit's gathering on the river bank, its banner
   clear of the badge, on the lower left.
   Each is its own image, cut to its petal's shape (the top one turned a little, `turn` degrees about its box's
   middle), brightened and shown in its own colours, and replaceable in the CMS. */
const PETALS = [
  { colour: '#a7d4b0', box: [29.76, -1, 48.39, 73.7], turn: -21.5, src: resolveCMSAsset("asset.ProjectsMosaicArt.petal-photo-top", "/images/projects-emblem/photo-top.webp") },
  { colour: '#82ced7', box: [56.13, 37.97, 69.46, 54.93], turn: 0, src: resolveCMSAsset("asset.ProjectsMosaicArt.petal-photo-right", "/images/projects-emblem/photo-right.webp") },
  { colour: '#e4aec7', box: [22.7, 64.06, 67.62, 49.83], turn: 0, src: resolveCMSAsset("asset.ProjectsMosaicArt.petal-photo-bottom", "/images/projects-emblem/photo-bottom.webp") },
] as const;

export const ProjectsMosaicArt: React.FC = () => {
  const id = useId().replace(/:/g, '');
  return <g className="projects-mosaic-petals">
    <defs>{PROJECTS_LOGO_OUTLINE.map((path, i) => <clipPath key={i} id={`${id}-${i}`}><path d={path} /></clipPath>)}</defs>
    {PETALS.map((petal, i) => <g key={petal.colour}>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill={petal.colour} transform="translate(-.2 .35)" />
      <g clipPath={`url(#${id}-${i})`}>
        <rect width="146" height="120" fill="#fbfffc" />
        <image x={petal.box[0]} y={petal.box[1]} width={petal.box[2]} height={petal.box[3]} href={resolveCMSMedia(petal.src)} preserveAspectRatio="xMidYMid slice"
          transform={petal.turn ? `rotate(${petal.turn} ${petal.box[0] + petal.box[2] / 2} ${petal.box[1] + petal.box[3] / 2})` : undefined} />
      </g>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill="none" stroke={petal.colour} strokeWidth=".3" strokeLinejoin="round" />
    </g>)}
    <g className="projects-centre-badge">
      <circle cx="64.84" cy="69.35" r="16.8" fill="#f4fcf8" stroke="#fff" strokeWidth=".5" />
      <image href={resolveCMSMedia('/images/sncf-logo.webp')} x="48.52" y="53.03" width="32.64" height="32.64" preserveAspectRatio="xMidYMid meet" />
    </g>
  </g>;
};
