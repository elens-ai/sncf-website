import React from 'react';
import { HealWordmark } from './HealWordmark';
import type { MosaicPillar } from './pillarLogoArt';

// Shared rounded lettering keeps all four titles in the reference's bold style.
const GLYPHS: Record<string, { width: number; path: string }> = {
  E: { width: 89, path: 'M3 5H86V15Q86 28 71 28H32V45H77V55Q77 67 63 67H32V78Q32 85 44 85H88V96Q88 108 74 108H38Q3 108 3 77Z' },
  N: { width: 98, path: 'M3 107V5H19Q28 5 34 16L68 69V5H81Q95 5 95 19V107H77Q69 107 64 96L30 43V107H17Q3 107 3 93Z' },
  R: { width: 95, path: 'M3 5H45Q87 5 87 40Q87 62 67 70L94 107H72Q61 107 56 97L43 76H31V107H18Q3 107 3 92ZM31 28V54H44Q58 54 58 40Q58 28 44 28Z' },
  I: { width: 35, path: 'M3 5H18Q32 5 32 20V107H17Q3 107 3 92Z' },
  C: { width: 98, path: 'M90 13V38Q74 26 59 27Q30 27 30 56Q30 86 59 86Q76 86 91 73V99Q77 110 54 110Q1 110 1 56Q1 2 55 2Q77 2 90 13Z' },
  H: { width: 96, path: 'M3 5H18Q30 5 30 20V44H65V5H78Q92 5 92 21V107H78Q65 107 65 94V66H30V107H18Q3 107 3 89Z' },
  M: { width: 116, path: 'M3 107V20Q3 5 19 5H36L58 67L80 5H96Q112 5 112 20V107H98Q85 107 85 92V47L66 100Q64 107 56 107Q48 107 45 100L30 47V107Z' },
  P: { width: 94, path: 'M3 5H47Q90 5 90 42Q90 79 47 79H31V107H17Q3 107 3 91ZM31 28V56H45Q60 56 60 42Q60 28 45 28Z' },
  O: { width: 110, path: 'M55 2Q107 2 107 56Q107 110 55 110Q3 110 3 56Q3 2 55 2ZM55 27Q32 27 32 56Q32 85 55 85Q78 85 78 56Q78 27 55 27Z' },
  J: { width: 79, path: 'M49 5H64Q78 5 78 20V74Q78 110 40 110Q16 110 3 97V71Q18 85 34 85Q49 85 49 69Z' },
  T: { width: 98, path: 'M2 5H96V18Q96 30 82 30H63V107H49Q35 107 35 92V30H2Z' },
  S: { width: 94, path: 'M85 11V36Q69 25 48 25Q30 25 30 34Q30 41 51 45Q91 53 91 78Q91 110 47 110Q20 110 4 99V73Q23 87 45 87Q63 87 63 79Q63 72 42 68Q3 60 3 35Q3 2 47 2Q70 2 85 11Z' },
  W: { width: 137, path: 'M1 5H20Q29 5 31 18L44 75L57 22H79L94 75L107 5H122Q136 5 132 20L112 96Q109 108 96 108H87L68 55L51 108H42Q29 108 25 96Z' },
};

export const PillarWordmark: React.FC<{ pillar: MosaicPillar }> = ({ pillar }) => {
  if (pillar === 'heal') return <HealWordmark />;
  let width = 0;
  const letters = [...pillar.toUpperCase()].map(letter => {
    const glyph = GLYPHS[letter];
    const x = width;
    width += glyph.width + 4;
    return { letter, glyph, x };
  });
  return <svg className="heal-wordmark pillar-wordmark" viewBox={`0 0 ${width} 114`} aria-hidden="true">
    <g fill="currentColor" fillRule="evenodd">
      {letters.map(({ letter, glyph, x }, i) => <path key={`${letter}-${i}`} d={glyph.path} transform={`translate(${x} 0)`} />)}
    </g>
  </svg>;
};
