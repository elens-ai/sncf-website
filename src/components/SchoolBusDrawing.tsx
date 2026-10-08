import React from 'react';
import { getCMSCopy } from '../cms/runtime';

/** The school bus arrives and pauses for its pupil drop-off. */
export function SchoolBusDrawing({ compact = false }: { compact?: boolean }) {
  return <g className="school-bus-journey" style={{ '--bus-entry': compact ? '630px' : '1230px' } as React.CSSProperties} aria-label={getCMSCopy('copy.SchoolBusDrawing.description', 'A Sant Nirankari Public School bus arrives for its pupil drop-off.')}>
    <g transform={compact ? "translate(0 260) scale(.65)" : "translate(0 501) scale(.65)"}>
      <path d="M15 119V77L38 36Q42 25 55 25H360Q375 25 378 41L385 113V129H340Q340 105 315 105Q290 105 290 129H112Q112 105 87 105Q62 105 62 129H25Q15 129 15 119Z" fill="var(--sketch-stone)" fillOpacity=".08" />
      <path d="M22 72H45M35 66L24 59V72M383 81H393V94M14 111H29" />
      <path d="M29 68L47 35H76V68ZM51 38H96V119H51ZM73 76V119M57 114H90M57 108H90M101 29V118M366 31V117M19 95H37V105H19M372 95H382V114H372M18 116H60M116 121H287M342 120H383M108 76H369M108 82H369M110 102H367" />
      {[113,156,199,242,285,328].map(x => <g key={x}>
        <path d={`M${x} 37H${x+33}V68H${x}ZM${x+3} 42H${x+30}`} />
        <path d={`M${x+10} 65Q${x+9} 59 ${x+14} 56Q${x+8} 52 ${x+13} 47Q${x+20} 43 ${x+24} 50Q${x+25} 54 ${x+20} 57Q${x+26} 60 ${x+26} 65`} opacity=".55" />
      </g>)}
      <text x="237" y="96" textAnchor="middle" className="school-bus-name">{getCMSCopy('copy.SchoolBusDrawing.name', 'Sant Nirankari Public School')}</text>
      <path className="school-bus-door" d="M54 38H92V113H54ZM73 39V111" />
      {[87,315].map(x=><g key={x}>
        <circle cx={x} cy="128" r="20" fill="var(--backdrop-dark, #164b60)" />
        <circle cx={x} cy="128" r="12" />
        <g className="school-bus-wheel" style={{transformOrigin:`${x}px 128px`}}>
          <path d={`M${x-9} 128H${x+9}M${x} 119V137`} />
        </g>
        <circle cx={x} cy="128" r="3" />
      </g>)}
      <path d="M13 138H61M114 138H286M342 138H389" opacity=".3" />
    </g>
  </g>;
}
