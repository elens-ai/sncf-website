import React, { useId } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { resolveCMSAsset } from '../cms/runtime';
import { roomPhoto } from '../data/pavilionGallery';
import { PROJECTS_FIVE_BOXES, PROJECTS_FIVE_OUTLINE, PROJECTS_LOGO_OUTLINE } from './projectsLogoOutline';
import { PROJECTS_CENTRE, PROJECTS_HUB_R, PROJECTS_SCALE, projectsPetalTransform, projectsUnder } from './pillarLogoArt';

/* THE PROJECTS' FLOWER: the emblem's own petal five times round the
   foundation's badge, each tucked under the next as the three were
   (projectsLogoOutline), a petal for each flagship project. Each carries one
   photograph of its project, laid upright over the whole petal: Sant
   Nirankari Health City at the top, then, round to the right, Oneness Vann,
   the watershed, Project Amrit and the adopted villages, each in its
   project's own colour (the Projects page's), washed faintly over its
   photograph. Every edge is drawn once and kept to its own petal: a thin
   light rim, as Heal's leaves have, runs inside each petal along its own
   edge, so where it tucks under the next it is that petal's rim that shows,
   its shadow falling on the one below. A pale hub beneath the petals fills
   the gaps between their curled bases and the badge. In emblem units (the
   shared 146 × 120 box); PillarPhotoMosaic gives the petals their depth and
   glaze. */

/* each project's photograph (replaceable in the CMS) and colour, in the petals' order */
const projectPetals = () => [
  { colour: '#e4aec7', alt: 'Sant Nirankari Health City', src: resolveCMSAsset("asset.ProjectsMosaicArt.health-city", "/images/projects/health-city.webp") },
  { colour: '#a7d4b0', alt: 'Oneness Vann', src: resolveCMSMedia(roomPhoto('projects', 2)) },
  { colour: '#e6cb98', alt: 'The Watershed Programme', src: resolveCMSMedia(roomPhoto('empower', 2)) },
  { colour: '#82ced7', alt: 'Project Amrit', src: resolveCMSMedia(roomPhoto('projects', 1)) },
  { colour: '#cdb7de', alt: 'Adopted Villages', src: resolveCMSAsset("asset.ProjectsMosaicArt.adopted-villages", "/images/programmes/adopted-villages-mandaura.webp") },
];

export const ProjectsMosaicArt: React.FC<{ photoFilter?: string; edge: string }> = ({ photoFilter, edge }) => {
  const id = useId().replace(/:/g, '');
  const petals = projectPetals();
  const [cx, cy] = PROJECTS_CENTRE;
  return <g className="projects-mosaic-petals">
    <defs>
      {PROJECTS_FIVE_OUTLINE.map((d, i) => <clipPath key={i} id={`${id}-${i}`}><path d={d} /></clipPath>)}
      {PROJECTS_FIVE_OUTLINE.map((_, i) => <clipPath key={i} id={`${id}-under-${i}`}>{projectsUnder(i).map(j => <path key={j} d={PROJECTS_FIVE_OUTLINE[j]} />)}</clipPath>)}
      <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".6" /></filter>
    </defs>
    <circle cx={cx} cy={cy} r={PROJECTS_HUB_R} fill="#f4fcf8" />
    {petals.map((petal, i) => {
      const [x, y, width, height] = PROJECTS_FIVE_BOXES[i];
      return <g key={petal.alt} clipPath={`url(#${id}-${i})`}>
        <title>{petal.alt}</title>
        <rect x={x} y={y} width={width} height={height} fill="#fbfffc" />
        <image x={x} y={y} width={width} height={height} href={petal.src} preserveAspectRatio="xMidYMid slice" filter={photoFilter} />
        <rect x={x} y={y} width={width} height={height} fill={petal.colour} opacity=".12" />
      </g>;
    })}
    {/* each petal's shadow on the two it lies over */}
    {petals.map((petal, i) => <g key={petal.alt} clipPath={`url(#${id}-under-${i})`} aria-hidden="true">
      <path d={PROJECTS_FIVE_OUTLINE[i]} transform="translate(-.5 .75)" fill="#0b2a24" opacity=".3" filter={`url(#${id}-soft)`} />
    </g>)}
    {/* each petal's rim, inside it and along its own edge */}
    {petals.map((petal, i) => <g key={petal.alt} clipPath={`url(#${id}-${i})`} aria-hidden="true">
      <path d={PROJECTS_LOGO_OUTLINE[0]} transform={projectsPetalTransform(i)} fill="none" stroke={edge} strokeWidth={.8 / PROJECTS_SCALE} strokeLinejoin="round" />
    </g>)}
    <g className="projects-centre-badge">
      <circle cx={cx} cy={cy} r={16.8 * PROJECTS_SCALE} fill="#f4fcf8" stroke="#fff" strokeWidth=".5" />
      <image href={resolveCMSMedia('/images/sncf-logo.webp')} x={cx - 16.32 * PROJECTS_SCALE} y={cy - 16.32 * PROJECTS_SCALE} width={32.64 * PROJECTS_SCALE} height={32.64 * PROJECTS_SCALE} preserveAspectRatio="xMidYMid meet" />
    </g>
  </g>;
};
