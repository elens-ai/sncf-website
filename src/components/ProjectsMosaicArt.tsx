import React, { useId } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { roomPhoto } from '../data/pavilionGallery';
import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';

/* One photograph to a petal, laid over the whole petal (its box, in emblem units): the forestry, water and
   healthcare the emblem stands for, as Oneness Vann on the top petal, Project Amrit on the right and Sant
   Nirankari Health City on the lower left, each washed faintly in its petal's colour. The first two are the
   Projects room's own photographs, so they change with it in the CMS. */
const PETALS = [
  { colour: '#a7d4b0', box: [36.62, 6.81, 42.08, 64.09], photo: () => roomPhoto('projects', 2) },
  { colour: '#82ced7', box: [58.4, 39.77, 64.92, 51.34], photo: () => roomPhoto('projects', 1) },
  { colour: '#e4aec7', box: [22.7, 64.06, 67.62, 49.83], photo: () => '/images/projects/health-city.webp' },
] as const;

export const ProjectsMosaicArt: React.FC<{ photoFilter?: string }> = ({ photoFilter }) => {
  const id = useId().replace(/:/g, '');
  return <g className="projects-mosaic-petals">
    <defs>{PROJECTS_LOGO_OUTLINE.map((path, i) => <clipPath key={i} id={`${id}-${i}`}><path d={path} /></clipPath>)}</defs>
    {PETALS.map((petal, i) => <g key={petal.colour}>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill={petal.colour} transform="translate(-.2 .35)" />
      <g clipPath={`url(#${id}-${i})`}>
        <rect width="146" height="120" fill="#fbfffc" />
        <image x={petal.box[0]} y={petal.box[1]} width={petal.box[2]} height={petal.box[3]} href={resolveCMSMedia(petal.photo())} preserveAspectRatio="xMidYMid slice" filter={photoFilter} />
        <rect width="146" height="120" fill={petal.colour} opacity=".2" />
      </g>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill="none" stroke={petal.colour} strokeWidth=".3" strokeLinejoin="round" />
    </g>)}
    <g className="projects-centre-badge">
      <circle cx="64.84" cy="69.35" r="16.8" fill="#f4fcf8" stroke="#fff" strokeWidth=".5" />
      <image href={resolveCMSMedia('/images/sncf-logo.webp')} x="48.52" y="53.03" width="32.64" height="32.64" preserveAspectRatio="xMidYMid meet" />
    </g>
  </g>;
};
