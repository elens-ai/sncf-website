import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { getCMSLink } from '../cms/links';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { onArrival } from '../utils/arrival';

/**
 * SANT NIRANKARI HEALTH CITY — from blueprint to reality.
 *
 * The campus has opened its OPD, so the section that used to promise it
 * now shows it: the foundation's own architectural render of the campus,
 * washed onto the page with a torn watercolour edge (as the album on the
 * home page does its lead photographs) over a foil brush stroke in the
 * Projects blue (as the hero plates), with a fine blueprint — frame,
 * grid, dimension line — that draws itself first, before the building
 * settles over it. The dot grids echo the foundation's own banner.
 *
 * Everything stated here is transcribed: "OPD services started" from the
 * banner, the 1,000+ beds / multispecialty / North Delhi from the report's
 * highlight. No activity figures exist yet, and the note says so.
 */
const STROKE_BODY = 'M28 66L384 38L394 252L44 288Z';
const STROKE_STREAKS = ['M6 84L110 70L112 78L8 92Z', '#', 'M300 30L398 18L399 26L302 40Z', 'M318 262L404 250L405 258L320 272Z', 'M2 250L70 240L72 247L4 258Z'].filter(d => d !== '#');

export const HealthCityFeature: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const [arrived, setArrived] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; return onArrival(el, () => setArrived(true)); }, []);
  return (
    <section ref={ref} className="project-health-city" id="health-city" aria-labelledby="health-city-title" data-arrived={arrived}>
      <div className="hc-copy">
        <p className="project-eyebrow">{getCMSCopy("copy.ProjectsPage.3532c25e1c80", "Now open / OPD services started")}</p>
        <h2 id="health-city-title">{getCMSCopy("copy.ProjectsPage.3eeeb717e545", "Sant Nirankari")}<br /><em>{getCMSCopy("copy.ProjectsPage.7560b5b78854", "Health City")}</em></h2>
        <p>{getCMSCopy("copy.ProjectsPage.d39d7428ab57", "A multi-specialty charitable hospital campus in North Delhi, intended to make advanced treatment more accessible.")}</p>
        <ul className="hc-chips" aria-label={getCMSCopy("copy.ProjectsPage.hcChipsSource", "As the foundation reports it")}>
          <li>{getCMSCopy("copy.ProjectsPage.hcChip1", "1,000+ beds")}</li>
          <li>{getCMSCopy("copy.ProjectsPage.hcChip2", "Multispecialty super-hospital")}</li>
          <li>{getCMSCopy("copy.ProjectsPage.hcChip3", "North Delhi")}</li>
        </ul>
        <p className="project-health-note">{getCMSCopy("copy.ProjectsPage.25984a49f9a1", "OPD services have started. Activity figures will be added as the campus begins reporting.")}</p>
        <a className="project-primary-link" href={getCMSLink("copy.Link.ProjectsPage.b03f7697e124", "https://www.nirankarihealthcity.org/")} target="_blank" rel="noopener noreferrer">{getCMSCopy("copy.ProjectsPage.5e3c06e2cdd5", "Visit Health City ")}<ArrowUpRight size={17} /></a>
      </div>
      <div className="hc-scene">
        <svg className="hc-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <filter id="hc-wash" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".006 .009" numOctaves="3" seed="11" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="70" xChannelSelector="R" yChannelSelector="G" result="torn" />
            <feGaussianBlur in="torn" stdDeviation="1.2" />
          </filter>
          <filter id="hc-rough" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency=".02 .11" numOctaves="2" seed="5" result="bristle" />
            <feDisplacementMap in="SourceGraphic" in2="bristle" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hc-foil" x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="7" result="grain" />
            <feDiffuseLighting in="grain" surfaceScale="1.5" diffuseConstant="1" lightingColor="#fff" result="lit"><feDistantLight azimuth="55" elevation="58" /></feDiffuseLighting>
            <feComponentTransfer in="lit" result="soft"><feFuncR type="linear" slope=".5" intercept=".55" /><feFuncG type="linear" slope=".5" intercept=".55" /><feFuncB type="linear" slope=".5" intercept=".55" /></feComponentTransfer>
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="litClip" />
            <feBlend in="SourceGraphic" in2="litClip" mode="multiply" result="shaded" />
            <feSpecularLighting in="grain" surfaceScale="2.6" specularConstant=".55" specularExponent="9" lightingColor="#fff" result="gleam"><feDistantLight azimuth="55" elevation="35" /></feSpecularLighting>
            <feComposite in="gleam" in2="SourceAlpha" operator="in" result="gleamClip" />
            <feBlend in="shaded" in2="gleamClip" mode="screen" />
          </filter>
        </svg>
        <span className="hc-dots hc-dots-a" aria-hidden="true" />
        <span className="hc-dots hc-dots-b" aria-hidden="true" />
        <svg className="hc-stroke" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
          <g filter="url(#hc-foil)"><g className="hc-ink" filter="url(#hc-rough)"><path d={STROKE_BODY} />{STROKE_STREAKS.map(d => <path key={d} d={d} />)}</g></g>
        </svg>
        <svg className="hc-blueprint" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
          <path className="hc-grid" d="M0 50H400M0 100H400M0 150H400M0 200H400M0 250H400M50 0V300M100 0V300M150 0V300M200 0V300M250 0V300M300 0V300M350 0V300" />
          <rect className="hc-draw" x="34" y="30" width="336" height="234" pathLength={1} />
          <path className="hc-draw" d="M34 282H370M34 276V288M370 276V288" pathLength={1} />
          <path className="hc-draw" d="M22 18V42M10 30H34M378 18V42M366 30H390" pathLength={1} />
        </svg>
        <figure className="hc-render">
          {/* The wash is a mask: its soft ellipse is what the filter tears, so the
              render's straight lines stay straight while its edge bleeds. */}
          <svg className="hc-render-art" viewBox="0 0 1000 621" role="img" aria-labelledby="hc-render-title">
            <title id="hc-render-title">{getCMSCopy("copy.ProjectsPage.hcAlt", "Architectural rendering of Sant Nirankari Health City, its name across the top of the main block")}</title>
            <defs>
              <radialGradient id="hc-feather" cx=".56" cy=".5" r=".5">
                <stop offset=".5" stopColor="#fff" />
                <stop offset=".66" stopColor="#fff" stopOpacity=".92" />
                <stop offset=".84" stopColor="#fff" stopOpacity=".38" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="hc-mask" maskUnits="userSpaceOnUse" x="-60" y="-60" width="1120" height="741">
                <rect x="-20" y="-20" width="1040" height="661" fill="url(#hc-feather)" filter="url(#hc-wash)" />
              </mask>
            </defs>
            <image href={resolveCMSMedia(resolveCMSAsset("asset.ProjectsPage.healthCity", "/images/projects/health-city.webp"))} width="1000" height="621" preserveAspectRatio="xMidYMid slice" mask="url(#hc-mask)" />
          </svg>
          <figcaption>{getCMSCopy("copy.ProjectsPage.hcCaption", "Sant Nirankari Health City · North Delhi")}</figcaption>
        </figure>
        <span className="hc-badge"><i aria-hidden="true" />{getCMSCopy("copy.ProjectsPage.hcBadge", "OPD services started")}</span>
      </div>
    </section>
  );
};
