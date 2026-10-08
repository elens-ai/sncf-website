import React, { useId } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { Ink } from './ServiceSceneArtwork';
import { CleanupVolunteers } from './CleanupVolunteers';

/** SNCF Express approaches Bhodwal Majri while independent teams clean the platform. */
export function RailwayCleanupDrawing() {
  const trackFade = useId().replace(/:/g, '');
  return <>
    <defs>
      <linearGradient id={`${trackFade}-gradient`} x1="0" y1="110" x2="0" y2="500" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="white" /><stop offset=".68" stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
      <mask id={`${trackFade}-mask`} maskUnits="userSpaceOnUse" x="700" y="100" width="450" height="410"><rect x="700" y="100" width="450" height="410" fill={`url(#${trackFade}-gradient)`} /></mask>
    </defs>
    <g className="service-sketch-building railway-platform">
      {/* Broad left platform and its receding canopy. */}
      <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M70 379L172 173 774 116 681 379Z" />
      <Ink d="M70 379H681L774 116M72 389H689L785 117M78 397H696M171 175L771 119M173 175V293M365 154V254M554 135V223M727 120V184M117 176L167 138 737 85 786 119ZM141 178L783 121M190 174L223 196 226 166M387 153L414 173 417 147M570 135L591 151 594 129" />
      <Ink d="M179 187L683 139V224L181 286M192 274L664 217M208 203L280 196V258L208 267ZM217 211L271 205V249L217 257ZM303 193L361 187V246L303 253ZM385 185L435 180V234L385 241ZM463 177L507 173V223L463 229ZM530 170L568 166V214L530 219ZM592 164L625 160V205L592 210" />
      <Ink d="M255 96L576 66V114L255 144ZM276 141V151M554 116V125" />
      <text className="railway-station-title" lang="hi" x="416" y="112" textAnchor="middle" transform="rotate(-5 416 112)">{getCMSCopy('copy.RailwayCleanupDrawing.station-name', 'भोडवाल माजरी')}</text>
      <Ink d="M653 133H673M663 133V151M659 151H667V156H659Z" />
      <g className="railway-hanging-clock">
        <circle cx="663" cy="178" r="22" fill="var(--backdrop-dark, #682e48)" />
        <circle cx="663" cy="178" r="18" />
        <path d="M663 164V178L673 184M663 161V164M663 192V195M646 178H649M677 178H680" stroke="var(--sketch-ink)" />
      </g>
      {/* Benches, station roundel and labelled waste bins along the platform. */}
      <circle cx="117" cy="244" r="21" />
      <path d="M69 234H165V254H69Z" fill="var(--backdrop-dark, #682e48)" />
      <text className="railway-roundel-name" lang="hi" x="117" y="247" textAnchor="middle">{getCMSCopy('copy.RailwayCleanupDrawing.station-name', 'भोडवाल माजरी')}</text>
      <Ink d="M69 234H165V254H69ZM117 266V357M181 304L296 285M181 311L296 292M187 298L288 281M193 316V330M284 299V312M319 298L359 291V339L319 346ZM325 300L353 295M331 303L343 301M364 290L398 284V331L364 337ZM370 292L391 288M376 294L385 292M317 347L400 332" />
      <Ink className="service-sketch-fine" d="M93 364L671 364M205 343L320 326M445 280L665 240M507 324L681 292M181 334L278 317M226 365L273 347M435 357L451 341" />
    </g>
    {/* The converging rails make the approach read as movement towards us. */}
    <g className="railway-perspective-tracks" mask={`url(#${trackFade}-mask)`}>
      {/* Both rails converge on (828,110); the cab wheels follow these exact rays. */}
      <Ink d="M828 110L861 500M828 110L867 500M828 110L1067 500M828 110L1075 500" />
      {[.12,.22,.35,.5,.68,.89,1.12,1.38].map(t => {
        const y=110+265*t, left=828+24.5*t, right=828+165*t;
        return <Ink key={t} d={`M${left-9*t} ${y}H${right+10*t}M${left-10*t} ${y+4*t}H${right+12*t}`} />;
      })}
      <Ink className="service-sketch-fine" d="M827 110L845 500M831 110L1100 500" />
    </g>
    <g className="railway-approaching-train">
      {/* New passenger train: a rounded front cab and receding carriages.
          Its wheels and lower body sit on the same perspective as the rails. */}
      <g className="railway-passenger-coaches">
        {/* Consistent coach sections share the cab's vanishing point.
            Nearer carriages naturally conceal the lower parts of those behind. */}
        {[.27, .46, .68].map(depth => <g key={depth} transform={`translate(${48*(1-depth)} ${-35*(1-depth)}) scale(${depth})`}>
          <path d="M38 28Q140 2 224 28L238 191Q143 215 29 190Z" fill="var(--backdrop-dark, #682e48)" />
          <Ink d="M38 28Q140 2 224 28L238 191Q143 215 29 190ZM42 37Q141 13 218 37M43 47L222 47M34 145Q140 167 233 145M32 174Q140 198 236 174M52 60H94V106H49ZM111 60H153V106H111ZM170 60H212L216 106H171M95 30V43M164 29V43M76 192V210M199 191V209" />
        </g>)}
      </g>
      <path d="M46 26Q135 4 219 25Q243 32 249 60L258 183Q251 210 226 218H49Q27 213 24 188L28 64Q29 36 46 26Z" fill="var(--backdrop-dark, #682e48)" />
      <Ink d="M46 26Q135 4 219 25Q243 32 249 60L258 183Q251 210 226 218H49Q27 213 24 188L28 64Q29 36 46 26ZM48 35Q137 15 216 34M36 182Q142 202 247 180M40 192Q144 211 243 191M58 216V230H87V218M199 218V230H227V216M82 230H199M111 215V228H171V215" />
      {/* Wide divided windscreen and restrained destination board. */}
      <path d="M54 59Q139 43 221 59L230 108Q141 122 44 108Z" fill="var(--sketch-blue)" fillOpacity=".16" />
      <Ink d="M54 59Q139 43 221 59L230 108Q141 122 44 108ZM137 50V115M63 66Q98 58 127 58V101L53 101ZM148 58Q183 57 211 65L218 102H148ZM69 96L103 76M166 96L200 77M84 39H191V49H84ZM100 42H176" />
      <text className="railway-passenger-name" x="141" y="144" textAnchor="middle">{getCMSCopy('copy.RailwayCleanupDrawing.train-name', 'SNCF Express')}</text>
      {/* Reference-inspired front: round buffers and a tapered slatted pilot. */}
      <Ink d="M48 153H82V162H48ZM196 153H230V162H196ZM36 169Q142 181 248 167V183Q142 197 36 184ZM42 175Q142 188 241 174M102 163H177M29 92L20 83V70H29M245 74H257V89L249 95M33 126H48M237 124H250" />
      <ellipse cx="59" cy="179" rx="11" ry="8" /><ellipse cx="224" cy="177" rx="11" ry="8" />
      <path d="M69 190Q141 202 211 188L233 224Q141 244 48 227Z" fill="var(--backdrop-dark, #682e48)" />
      <Ink d="M69 190Q141 202 211 188L233 224Q141 244 48 227ZM71 195L57 226M83 198L72 229M95 200L88 232M108 202L105 234M122 204L122 236M137 205V237M152 204L155 236M167 202L172 234M181 199L188 231M195 196L204 228M207 193L220 225M52 221Q142 241 229 220M121 185V205H160V185M129 192H153M130 205L125 215H156L151 205" />
      <path className="railway-headlamps" d="M52 156H78V160H52ZM200 156H226V160H200Z" fill="var(--sketch-stone)" fillOpacity=".6" stroke="none" />
      <Ink className="service-sketch-fine" d="M55 119Q142 132 225 120M38 60L35 108M239 61L242 108" />
    </g>
    {/* Three independent teams are already caring for the whole station. */}
    <g className="railway-station-volunteers">
      <g className="railway-cleaning-team railway-cleaning-team--far"><g transform="translate(160 100) scale(.45)"><CleanupVolunteers /></g></g>
      <g className="railway-cleaning-team railway-cleaning-team--middle"><g transform="translate(120 100) scale(.7)"><CleanupVolunteers /></g></g>
      <g className="railway-cleaning-team railway-cleaning-team--front"><g transform="translate(-240 65) scale(.8)"><CleanupVolunteers /></g></g>
    </g>
  </>;
}
