import React, { useId } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { roomPhotoFor } from '../data/pavilionGallery';
import { PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';

const PETALS = [
  { colour: '#a7d4b0', tiles: [
    { x: 27, y: 0, w: 55, h: 28, src: '/images/pavilion/projects-3.jpg' },
    { x: 27, y: 28.5, w: 28, h: 32, src: '/images/pavilion/empower-4.jpg' },
    { x: 55.5, y: 28.5, w: 27, h: 32, src: '/images/pavilion/projects-4.jpg' },
    { x: 27, y: 61, w: 56, h: 36, src: '/images/pavilion/empower-3.jpg' },
  ] },
  { colour: '#82ced7', tiles: [
    { x: 55, y: 32, w: 37, h: 28, src: '/images/pavilion/projects-1.jpg' },
    { x: 92.5, y: 32, w: 40, h: 28, src: '/images/pavilion/projects-2.jpg' },
    { x: 55, y: 60.5, w: 30, h: 40, src: '/images/projects/amrit.webp' },
    { x: 85.5, y: 60.5, w: 47, h: 40, src: '/images/pavilion/projects-5.jpg' },
  ] },
  { colour: '#e4aec7', tiles: [
    { x: 17, y: 54, w: 40, h: 34, src: '/images/pavilion/heal-1.jpg' },
    { x: 57.5, y: 54, w: 43, h: 34, src: '/images/pavilion/heal-4.jpg' },
    { x: 17, y: 88.5, w: 40, h: 33, src: '/images/projects/health-city.webp' },
    { x: 57.5, y: 88.5, w: 43, h: 33, src: '/images/pavilion/heal-2.jpg' },
  ] },
];

export const ProjectsMosaicArt: React.FC<{ photoFilter?: string }> = ({ photoFilter }) => {
  const id = useId().replace(/:/g, '');
  return <g className="projects-mosaic-petals">
    <defs>{PROJECTS_LOGO_OUTLINE.map((path, i) => <clipPath key={i} id={`${id}-${i}`}><path d={path} /></clipPath>)}</defs>
    {PETALS.map((petal, i) => <g key={petal.colour}>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill={petal.colour} transform="translate(-.65 .85)" />
      <g clipPath={`url(#${id}-${i})`}>
        <rect width="146" height="120" fill="#fbfffc" />
        <g filter={photoFilter}>
          {petal.tiles.map((tile, j) => <image key={j} x={tile.x} y={tile.y} width={tile.w} height={tile.h} href={resolveCMSMedia(roomPhotoFor(tile.src))} preserveAspectRatio="xMidYMid slice" />)}
        </g>
        <rect width="146" height="120" fill={petal.colour} opacity=".2" />
      </g>
      <path d={PROJECTS_LOGO_OUTLINE[i]} fill="none" stroke={petal.colour} strokeWidth=".55" strokeLinejoin="round" />
    </g>)}
    <g className="projects-centre-badge">
      <circle cx="64.84" cy="69.35" r="16.8" fill="#f4fcf8" stroke="#fff" strokeWidth=".5" />
      <image href={resolveCMSMedia('/images/sncf-logo.webp')} x="48.52" y="53.03" width="32.64" height="32.64" preserveAspectRatio="xMidYMid meet" />
    </g>
  </g>;
};
