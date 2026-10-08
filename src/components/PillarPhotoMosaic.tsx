import React, { useEffect, useId, useRef } from 'react';
import { ProjectsMosaicArt } from './ProjectsMosaicArt';
import { resolveCMSMedia } from '../cms/media';
import { resolveCMSAsset } from '../cms/runtime';
import './heal-photo-mosaic.css';
import { BOOK_COVER, EMPOWER_COMPANIONS, EMPOWER_TILT, PILLAR_LOGOS, companionTransform, type MosaicPillar } from './pillarLogoArt';
import { PILLARS } from '../data/pillars';
import { LocalOpacityControls } from './LocalOpacityControls';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';

/* Empower's figure carries six photographs, one to each part of it: volunteers
   planting a sapling in its head (the photograph's blown-out white sky repainted
   blue, with faded clouds); along its raised arms, the flood rescue (its
   helpers at the hand, the boat and its crew at the shoulder) on the left and
   students marching with their placards on the right (their line running from
   the shoulder to the nearest of them at the hand); the Delhi State Kids
   Athletics Championships across its chest; the foundation's toilet block and its
   mural below that; and at its foot a volunteer clearing litter on the shore.
   Each is its own image, cut to its part and replaceable in the CMS, and held to
   its part's box; a fine gap between the parts, as between the book's pages.
   An arm is a band some 18 units across, so its photograph is laid along it,
   turned (`at`, `angle`, then `x`, `y`, `w`, `h` in the turned frame) to the arm
   or, for the march, less steeply, so the band follows its line of students from
   the far ones to the near; each arm's photograph has its background carried on
   a little past its edge, to reach the shoulder and armpit. */
/* `photo`, where given, is the box the photograph fills, when it is not the part's own (the head's is the circle's square) */
type EmpowerTile = { x: number; y: number; w: number; h: number; src: string; photo?: { x: number; y: number; w: number; h: number }; strip?: { at: [number, number]; angle: number; x: number; y: number; w: number; h: number } };
const empowerTiles = (): EmpowerTile[] => [
  { x: 51, y: 0, w: 36, h: 40, photo: { x: 51.84, y: 5.12, w: 34.56, h: 34.56 }, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-head", "/images/empower-emblem/photo-head.webp") },
  { x: -4, y: -4, w: 54.5, h: 74, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-left-arm", "/images/empower-emblem/photo-left-arm.webp"),
    strip: { at: [12.22, -5.46], angle: 34.4, x: 0, y: 0, w: 88.35, h: 42.08 } },
  { x: 88, y: -4, w: 62, h: 74, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-right-arm", "/images/empower-emblem/photo-right-arm.webp"),
    strip: { at: [29.25, 10.38], angle: -9.7, x: 0, y: 0, w: 106, h: 65.01 } },
  { x: 51, y: 41, w: 36, h: 21.5, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-chest", "/images/empower-emblem/photo-chest.webp") },
  { x: 51, y: 63.5, w: 36, h: 21.5, photo: { x: 50.1, y: 64.4, w: 36, h: 21.5 }, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-waist", "/images/empower-emblem/photo-waist.webp") },
  { x: 51, y: 86, w: 36, h: 21.5, photo: { x: 50.1, y: 86.6, w: 36, h: 21.5 }, src: resolveCMSAsset("asset.PillarPhotoMosaic.empower-photo-foot", "/images/empower-emblem/photo-foot.webp") },
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
/* Heal's emblem carries the foundation's own photographs, one to a leaf: the yoga
   day (top right), a blood donation camp (top left), an eye checkup camp
   (bottom right) and the Sant Nirankari Health Centre (bottom left), each cropped to its leaf and
   replaceable in the CMS. Each box places its image over its leaf, in emblem
   units, in the order of the outline's paths; images fill their box, so a
   replacement photo of any shape still covers its leaf. */
type Box = [number, number, number, number];
const healLeaves = (): { box: Box; src: string; second?: { box: Box; src: string } }[] => [
  { box: [67.6, 4.12, 76.77, 67.85], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-photo-top-right", "/images/heal-emblem/photo-top-right.webp"),
    second: { box: [44.78, 19.56, 75.84, 53.09], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-photo-top-right-second", "/images/heal-emblem/photo-top-right-2.webp") } },
  { box: [3.54, 20.12, 57.24, 51.52], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-photo-top-left", "/images/heal-emblem/photo-top-left.webp") },
  { box: [61.62, 72.64, 30.81, 27.78], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-photo-bottom-right", "/images/heal-emblem/photo-bottom-right.webp") },
  { box: [18.52, 73.15, 42.26, 38.38], src: resolveCMSAsset("asset.PillarPhotoMosaic.heal-photo-bottom-left", "/images/heal-emblem/photo-bottom-left.webp") },
];

/* The large leaf carries two photographs side by side, either side of a gently
   curving seam that runs from the leaf's top edge down through the tip of its
   vein (the curved split in the outline) to its foot: the chiropractic camp on
   the left (the leaf's second photograph), the yoga day on the right. SEAM is
   drawn as a fine line in the outline's colour; the sides are the seam closed
   round either way. */
const SEAM = 'M103.4 6.6 C102.6 16 101.6 25 100.9 32.4 C100.3 42 99.6 56 98.4 71.2';
const SPLIT = 'M103.6 0 L103.4 6.6 C102.6 16 101.6 25 100.9 32.4 C100.3 42 99.6 56 98.4 71.2 L98.2 80';
const SPLIT_SIDES = { second: `${SPLIT} L40 80 L40 0 Z`, first: `${SPLIT} L150 80 L150 0 Z` };

/* Enrich's book carries six photographs, three to a page, one above another:
   the sewing class, the coaching centre's study hall and the Nirankari Baba Gurbachan Singh
   Memorial College on the left page; a school's computer lab, its chemistry lab
   and the Annual Day at SNPS Avtar Enclave on the right. The rows are set so the book's curved top and
   foot leave each about the same height in view (the top and bottom rows run
   on under the curves), and each photograph is its own image, cut to its row
   and replaceable in the CMS. */
const ENRICH_ROWS = [{ y: 9, h: 29.5 }, { y: 39.5, h: 23 }, { y: 63.5, h: 30 }];
const ENRICH_PAGES = [{ x: 17, w: 54 }, { x: 73, w: 54 }];
const enrichPages = (): { x: number; y: number; w: number; h: number; src: string }[] => {
  const photos = [
    [resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-top-left", "/images/enrich-emblem/photo-top-left.webp"),
      resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-top-right", "/images/enrich-emblem/photo-top-right.webp")],
    [resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-middle-left", "/images/enrich-emblem/photo-middle-left.webp"),
      resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-middle-right", "/images/enrich-emblem/photo-middle-right.webp")],
    [resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-bottom-left", "/images/enrich-emblem/photo-bottom-left.webp"),
      resolveCMSAsset("asset.PillarPhotoMosaic.enrich-photo-bottom-right", "/images/enrich-emblem/photo-bottom-right.webp")],
  ];
  return ENRICH_ROWS.flatMap((row, r) => ENRICH_PAGES.map((page, p) => ({ ...page, ...row, src: photos[r][p] })));
};

/* Empower's figure is lifted by its companions (EMPOWER_COMPANIONS), here with
   photographs of their own: the room's dealt round one place for the first and
   two for the second, so that each is someone else; and faint. */
/* With its companions the figure spreads wider than Heal's leaves or Enrich's
   book, so the three are drawn together a little smaller than those, about
   their own middle and onto the middle the leaves and the book share. */
const TRIO = { scale: 0.86, from: [69.3, 57], to: [71.5, 58.5] } as const;
const TRIO_FIT = `translate(${TRIO.to[0]} ${TRIO.to[1]}) scale(${TRIO.scale}) translate(${-TRIO.from[0]} ${-TRIO.from[1]})`;

export const PillarPhotoMosaic: React.FC<{ pillar: MosaicPillar; caption?: boolean; heroArt?: boolean; solid?: boolean }> = ({ pillar, caption = true, heroArt = false, solid = false }) => {
  const logo = PILLAR_LOGOS[pillar];
  /* Heal's emblem shows the foundation's own photographs, one to a leaf, wherever it is drawn. */
  const ownPhotos = pillar === 'heal';
  /* Empower's figure always stands with its companions. */
  const companions = pillar === 'empower';
  const softSurface = pillar === 'heal' || pillar === 'projects';
  const clip = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  /* The light wave runs on SMIL, which CSS cannot pause: stop it off screen
     and for reduced motion. */
  useEffect(() => {
    const svg = svgRef.current;
    if (pillar !== 'heal' || !svg) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onScreen = true;
    const apply = () => (onScreen && !reduced.matches && pageIsActive(svg as unknown as HTMLElement) ? svg.unpauseAnimations() : svg.pauseAnimations());
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; apply(); });
    observer.observe(svg);
    reduced.addEventListener('change', apply);
    document.addEventListener('visibilitychange', apply);
    document.addEventListener(PAGE_ACTIVITY_EVENT, apply);
    apply();
    return () => { observer.disconnect(); reduced.removeEventListener('change', apply); document.removeEventListener('visibilitychange', apply); document.removeEventListener(PAGE_ACTIVITY_EVENT, apply); };
  }, [pillar]);
  return <figure className="heal-photo-mosaic" data-pillar={pillar} aria-label={`${logo.label} ${solid ? 'solid emblem' : 'logo photo mosaic'}`}>
    <svg ref={svgRef} viewBox="-4 -12 174 142" role="img" aria-labelledby={`${clip}-title`}>
      <title id={`${clip}-title`}>{solid ? `The ${logo.label} emblem in solid colour` : `The ${logo.label} emblem filled with photographs of ${logo.description}`}</title>
      <defs>
        <g id={`${clip}-outline`}>{logo.paths.map(d => <path key={d} d={d} />)}</g>
        <clipPath id={clip}>{logo.paths.map(d => <path key={d} d={d} />)}</clipPath>
        {ownPhotos && logo.paths.map((d, i) => <clipPath key={d} id={`${clip}-leaf-${i}`}><path d={d} /></clipPath>)}
        {ownPhotos && Object.entries(SPLIT_SIDES).map(([side, d]) => <clipPath key={side} id={`${clip}-split-${side}`}><path d={d} /></clipPath>)}
        <linearGradient id={`${clip}-bevel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".45" stopColor={logo.edge} stopOpacity=".65" />
          <stop offset="1" stopColor="#163f49" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`${clip}-soft-edge`} x1="0" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor={logo.edge} />
          <stop offset=".55" stopColor={logo.tint} />
          <stop offset="1" stopColor={logo.tint} stopOpacity=".75" />
        </linearGradient>
        <linearGradient id={`${clip}-glaze`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#142f38" stopOpacity=".14" />
        </linearGradient>
        {pillar === 'empower' && empowerTiles().map((tile, i) => <clipPath key={i} id={`${clip}-tile-${i}`}><rect x={tile.x} y={tile.y} width={tile.w} height={tile.h} /></clipPath>)}
        {companions && <>
          <linearGradient id={`${clip}-companion-opacity`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="110">
            <stop offset="0" stopColor="#fff" stopOpacity="var(--empower-companion-top, 0.4)" />
            <stop offset="1" stopColor="#fff" stopOpacity="var(--empower-companion-bottom, 0.1)" />
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
        {EMPOWER_COMPANIONS.map(mate => <g key={mate.dx} mask={`url(#${clip}-companion-mask)`} transform={companionTransform(mate, Math.sign(mate.dx) * EMPOWER_TILT)}>
          {[6, 5, 4, 3, 2, 1].map(layer => <use key={layer} href={`#${clip}-outline`} transform={`translate(${-layer * .24} ${layer * .38})`} fill={layer > 4 ? '#234a4c' : logo.tint} />)}
          <g clipPath={`url(#${clip})`}>
            <rect x="0" y="0" width="146" height="120" fill={logo.tint} />
          </g>
          <use href={`#${clip}-outline`} fill="none" stroke={`url(#${clip}-bevel)`} strokeWidth=".45" strokeLinejoin="round" />
        </g>)}
      </g>}
      <g className="pillar-mosaic-depth" aria-hidden="true">
        {pillar === 'enrich' && <>
          <path d={BOOK_COVER} fill="#238fa7" transform="translate(-1 1.4)" />
          <path d={BOOK_COVER} fill={logo.tint} stroke="#8ed5df" strokeWidth=".4" strokeLinejoin="round" />
        </>}
        {softSurface ? <use href={`#${clip}-outline`} transform="translate(-.35 .65)" fill={`url(#${clip}-soft-edge)`} stroke={`url(#${clip}-soft-edge)`} strokeWidth=".6" strokeLinejoin="round" />
          : (pillar === 'enrich' ? [4, 3, 2, 1] : [6, 5, 4, 3, 2, 1]).map(layer => <use key={layer} href={`#${clip}-outline`} transform={`translate(${pillar === 'enrich' ? 0 : -layer * .24} ${layer * .38})`} fill={pillar === 'enrich' ? (layer % 2 ? '#fdfbf5' : '#dbe3e8') : layer > 4 ? '#234a4c' : logo.tint} />)}
        <use href={`#${clip}-outline`} transform={softSurface ? 'translate(-.1 .15)' : 'translate(-.25 .4)'} fill={logo.edge} />
      </g>
      <g className="heal-mosaic-leaves">
        <g id={`${clip}-photo-face`}>
        {solid ? <>{logo.paths.map(d => <path key={d} d={d} fill={logo.tint} stroke={logo.edge} strokeWidth=".3" strokeLinejoin="round" />)}</> : ownPhotos ? <>
          {/* the photographs keep their own colour, as in the foundation's print */}
          {healLeaves().map((leaf, i) => <g key={i} clipPath={`url(#${clip}-leaf-${i})`}>
            <rect x={leaf.box[0]} y={leaf.box[1]} width={leaf.box[2]} height={leaf.box[3]} fill={logo.edge} />
            {leaf.second ? <>
              <g clipPath={`url(#${clip}-split-first)`}><image href={leaf.src} x={leaf.box[0]} y={leaf.box[1]} width={leaf.box[2]} height={leaf.box[3]} preserveAspectRatio="xMidYMid slice" /></g>
              <g clipPath={`url(#${clip}-split-second)`}><image href={leaf.second.src} x={leaf.second.box[0]} y={leaf.second.box[1]} width={leaf.second.box[2]} height={leaf.second.box[3]} preserveAspectRatio="xMidYMid slice" /></g>
              <path d={SEAM} fill="none" stroke={logo.edge} strokeWidth=".6" strokeLinecap="round" />
            </> : <image href={leaf.src} x={leaf.box[0]} y={leaf.box[1]} width={leaf.box[2]} height={leaf.box[3]} preserveAspectRatio="xMidYMid slice" />}
          </g>)}
          {logo.paths.map(d => <path key={d} d={d} fill="none" stroke={logo.edge} strokeWidth=".3" strokeLinejoin="round" />)}
        </> : pillar === 'projects' ? <ProjectsMosaicArt /> : <>
        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width="146" height="120" fill={logo.edge} />
          {pillar === 'enrich'
            ? enrichPages().map((page, i) => <image key={i} href={resolveCMSMedia(page.src)} x={page.x} y={page.y} width={page.w} height={page.h} preserveAspectRatio="xMidYMid slice" />)
            : empowerTiles().map((tile, i) => <g key={i} clipPath={`url(#${clip}-tile-${i})`}>
              {tile.strip
                ? <image href={resolveCMSMedia(tile.src)} x={tile.strip.x} y={tile.strip.y} width={tile.strip.w} height={tile.strip.h} preserveAspectRatio="xMidYMid slice" transform={`translate(${tile.strip.at[0]} ${tile.strip.at[1]}) rotate(${tile.strip.angle})`} />
                : <image href={resolveCMSMedia(tile.src)} x={(tile.photo ?? tile).x} y={(tile.photo ?? tile).y} width={(tile.photo ?? tile).w} height={(tile.photo ?? tile).h} preserveAspectRatio="xMidYMid slice" />}
            </g>)}
          {pillar === 'enrich' && <rect width="146" height="120" fill={`url(#${clip}-fold)`} /> }
        </g>
        {logo.paths.map(d => <path key={d} d={d} fill="none" stroke={logo.edge} strokeWidth={pillar === 'enrich' ? 1 : .3} strokeLinejoin="round" />)}
        </>}
        </g>
        <g clipPath={`url(#${clip})`} aria-hidden="true">
          <rect width="146" height="120" fill={`url(#${clip}-glaze)`} />
          {/* Heal's soft wave of light, drifting over the surface. */}
          {pillar === 'heal' && HEAL_WAVES.map((wave, i) => <rect key={wave.tile} x="-4" y="-12" width="174" height="142" fill={`url(#${clip}-sheen-${i})`} />)}
        </g>
        <use href={`#${clip}-outline`} fill="none" stroke={`url(#${clip}-bevel)`} strokeWidth={softSurface ? '.28' : '.45'} strokeLinejoin="round" aria-hidden="true" />
      </g>
      </g>
    </svg>
    {caption && <figcaption>{PILLARS.find(item => item.id === pillar)?.emblemCaption ?? logo.caption}</figcaption>}
    {companions && heroArt && <LocalOpacityControls />}
  </figure>;
};
