import React from 'react';
import type { MosaicPillar } from './pillarLogoArt';

// Hero lettering in the flared style of the traced HEAL title (H and E are taken from it directly).
const HERO_GLYPHS: Record<string, { width: number; dx?: number; path: string }> = {
  E: { width: 89, dx: -104.8, path: 'M114 6.2L180.1 6.2L180.3 6.4L182.7 6.4Q184.3 6.8 185.2 7.9L186 9.5L186.2 12.4L186.4 12.6L186.6 19.8L186.8 20L186.8 26.9L187.2 28.9L187.2 34.9Q186.8 36.3 185.7 37L183.5 37.2Q182 36.7 181.2 35.7Q179.4 32.9 176.9 30.8Q174.7 28.8 171.8 27.4L169 26.2Q166.3 25.8 164.2 24.8L161.7 24.6L157.3 23.7L147.2 23.5L147 23.7L141.8 23.7L137.9 24.6L136.1 24.8L132.1 26.4Q129.9 27.5 128.4 29.3Q127.1 30.7 126.6 32.9L126.4 36.5L127.2 39.2L129.3 41.7Q131.5 43.5 134.7 44.3Q137.3 44.3 139.2 45.1L141.4 45.1L143.2 45.5L146.2 45.5L147.8 45.1L154.7 45.1L155.9 44.7L159.7 44.7L159.9 44.5L163.1 44.5L163.3 44.3L170.4 44.1Q171.8 44.4 172.5 45.4L173.3 47.4L173.3 61.3L172.9 62.7L172 63.7L170.4 64.1L169.4 63.9L167 62.4L163.7 60.8L159.1 59.4L156.1 59.2L151.1 58.2L141 58.2L138.8 58.6L137.3 59.2L135.5 59.4L133.5 60.2Q130.5 61.5 128.6 63.8L127.4 65.6L126.6 68.2Q126.9 69.3 126.4 69.6L126.4 75.6L127 78.7L128.2 81.3Q129.4 83.6 131.5 85L133.9 86.6L137.3 88.2Q139.9 88.6 142 89.5L145.4 89.7L148 90.3L158.3 90.3L159.7 89.9L165.2 89.5L168.2 88.6L170.4 88.2L175 86Q178.1 84.1 180.4 81.5Q183.6 78.1 185.8 73.6L186.9 72.5L187.9 71.9L189.1 71.7L190.4 72.1L191.7 73.4L192.3 75.2L192.5 79.3L192.7 79.5L192.7 82.7L193.1 84.3L193.1 87.5L193.3 87.7L193.3 90.4L193.5 90.6L193.5 94.4L193.7 94.6L193.7 98.4L193.9 98.6L193.9 105.9L192.8 107.2L191 108L187.7 108L187.5 108.2L107.7 108.2Q106 108 105.4 106.7L104.8 104.7L104.8 88.1L105 87.9L105 77.1L105.2 76.9L105.2 75L105.4 74.8L105.8 46L106 45.8L106.2 35.7L106.6 33.9L106.6 28.3Q107.1 28 106.8 26.9L106.8 26.5L107 18.2L107.2 18L107.2 15.6L107.4 15.4L107.6 9.9Q107.9 8.2 109.1 7.4L111.3 6.4L113.8 6.4L114 6.2Z' },
  H: { width: 91, dx: -3, path: 'M73.2 5L87 5Q89.3 5.5 90.5 6.9L91.3 9.1L91.5 13.8L91.9 15.6L91.9 18.8L92.1 19L92.3 25.5L92.5 25.7L92.5 30.1L92.7 30.3L92.7 36.5L93.1 38.2L93.1 43.8L93.3 44L93.3 49.6L93.5 49.8L93.5 57.5L93.7 57.7L93.9 104.7L92.6 106.8L90.8 107.8L88.8 108.2L70.6 108.2Q68.8 107.9 68.1 106.5L67.7 105.7L67.7 102.1L68.5 97.8L68.9 92.4L69.1 92.2L69.3 88.8L69.7 86.9L69.9 80.7L70.1 80.5L70.1 73.8L69.3 71L67 68.3L63.2 66.5L58.9 65.7L56.9 65.7L55.1 65.3L40.8 65.3L39 65.7L37.2 65.7L31.9 66.9Q29.5 67.9 28 69.8L26.8 72.8L26.6 77.1L26.8 77.3L26.8 84.3L27 84.5L27.2 89.8L27.4 90L27.6 93.2L28 94.8L28.4 100.6L29 103.1L29 105.1Q28.7 106.7 27.5 107.4L25.3 108.2L7.9 108.2L5.9 107.8L3.6 106.1L3 104.7L3 74.2L3.2 74L3.2 61.5L3.4 61.3L3.4 47L3.6 46.8L3.6 44.6L3.8 44.4L3.8 35.9L4.2 33.9L4.2 28.7L4.4 28.5L4.6 19.8L4.8 19.6L5 14.2L5.4 12.6L5.6 9.5Q6 7.9 7.3 7.2L8.3 6.6L10.2 6.2L22.9 6.2Q23.2 6.7 24.3 6.4L25.7 7L27.4 8.5Q28.1 9.5 27.8 11.6L27.2 15L26.8 23L26.6 23.2L26.6 26.1L26.4 26.3L26.2 38L26.6 40L27.6 42.2L29.3 43.9L31.7 45.3L37.6 46.7L58.3 46.7L64.4 45.3Q67.1 44.4 68.7 42.4L69.9 40.2L70.3 38.6L70.3 37.1L70.5 36.9L70.5 31.9L70.3 31.7L70.3 29.3L70.1 29.1L70.1 24.9L69.9 24.7L69.7 18.4L69.3 16.8L69.3 14.6L68.9 12.4L68.9 8.7Q69.6 6.8 71.2 5.8L73.2 5Z' },
  I: { width: 25, path: 'M4 6H21Q25 6 25 10Q23.5 57 25 104Q25 108 21 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6Z' },
  T: { width: 88, path: 'M4 6H84Q88 6 88 10V22Q88 28 82 28Q62 27 57 34Q55.5 70 57 104Q57 108 53 108H35Q31 108 31 104Q32.5 70 31 34Q26 27 6 28Q0 28 0 22V10Q0 6 4 6Z' },
  N: { width: 96, path: 'M4 6H22Q27 6 30 11L68 72Q69.5 40 69 10Q69 6 73 6H92Q96 6 96 10Q94.5 57 96 104Q96 108 92 108H74Q69 108 66 103L28 42Q26.5 74 27 104Q27 108 23 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6Z' },
  R: { width: 90, path: 'M4 6H50Q86 6 86 37Q86 58 66 66L89 102Q91 108 84 108H66Q61 108 58 103L44 72H27Q26.5 90 27 104Q27 108 23 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6ZM27 26V52H47Q60 52 60 39Q60 26 47 26Z' },
  C: { width: 92, path: 'M52 4Q76 4 88 14Q92 17 91 22L90 34Q89 40 83 36Q70 26 54 27Q29 28 29 57Q29 86 54 87Q72 88 84 77Q90 73 91 79L92 93Q92 98 88 101Q74 110 51 110Q0 110 0 57Q0 4 52 4Z' },
  O: { width: 104, path: 'M52 4Q104 4 104 57Q104 110 52 110Q0 110 0 57Q0 4 52 4ZM52 27Q29 27 29 57Q29 87 52 87Q75 87 75 57Q75 27 52 27Z' },
  P: { width: 88, path: 'M4 6H48Q86 6 86 41Q86 77 48 77H28Q27 92 28 104Q28 108 24 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6ZM27 27V56H46Q60 56 60 41.5Q60 27 46 27Z' },
  M: { width: 118, path: 'M4 6H24Q30 6 32 12L59 70L86 12Q88 6 94 6H114Q118 6 118 10Q116.5 57 118 104Q118 108 114 108H96Q92 108 92 104Q91 75 92 48L71 98Q68 106 59 106Q50 106 47 98L26 48Q27 75 26 104Q26 108 22 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6Z' },
  W: { width: 138, path: 'M3 6H22Q28 6 29 12L40 74L56 24Q58 18 64 18H74Q80 18 82 24L98 74L109 12Q110 6 116 6H134Q139 6 137 11L117 100Q115 108 107 108H96Q90 108 88 102L69 50L50 102Q48 108 42 108H31Q23 108 21 100L1 11Q-1 6 3 6Z' },
  J: { width: 72, path: 'M48 6H68Q72 6 72 10Q71 40 72 72Q72 110 36 110Q14 110 3 99Q0 96 0 91V78Q0 72 5 76Q17 86 32 86Q46 86 46 70Q45 40 44 10Q44 6 48 6Z' },
  S: { width: 90, path: 'M47 4Q70 4 84 12Q88 14 88 19V31Q88 37 82 34Q67 25 49 25Q30 25 30 33Q30 40 50 44Q90 52 90 78Q90 110 46 110Q20 110 5 100Q1 98 1 93V79Q1 73 7 76Q24 88 44 88Q62 88 62 80Q62 73 42 69Q2 61 2 35Q2 4 47 4Z' },
};

/** Hero titles share HEAL's 112-unit height and baseline, so every pillar's text lines up with Heal's. */
export const HeroPillarWordmark: React.FC<{ pillar: MosaicPillar }> = ({ pillar }) => {
  let width = 3;
  const letters = [...pillar.toUpperCase()].map(letter => {
    const glyph = HERO_GLYPHS[letter];
    const x = width + (glyph.dx ?? 0);
    width += glyph.width + 10;
    return { letter, glyph, x };
  });
  /* Each letter sits in its own group, so the hero can animate the letter
     itself without disturbing where the group places it. */
  return <svg className="heal-wordmark pillar-wordmark hero-pillar-wordmark" viewBox={`0 0 ${width - 7} 112`} preserveAspectRatio="xMinYMax meet" aria-hidden="true">
    <g fill="currentColor" fillRule="evenodd">
      {letters.map(({ letter, glyph, x }, i) => <g key={`${letter}-${i}`} transform={`translate(${x} 0)`} style={{ '--i': i } as React.CSSProperties}><path d={glyph.path} /></g>)}
    </g>
  </svg>;
};

/* Further letters in the same flared style, for names beyond the pillar
   titles (A and L come straight from the traced HEAL). */
export const NAME_GLYPHS: Record<string, { width: number; dx?: number; path: string }> = {
  ...HERO_GLYPHS,
  A: { width: 99, dx: -202, path: 'M243.4 6.2L259.9 6.2Q260.2 6.6 261.1 6.4L262.9 7.2L264.4 8.5L266.6 12.4L273.5 27.3L278.7 39.4Q280 43.7 281.8 47.4L282.2 49L283.2 50.9L283.6 52.5L284.2 53.5L293.7 80.5L293.7 81.1L297.5 92.6L297.7 94L298.7 96.6L301.1 105.7Q300.9 107 300 107.6L298.6 108.2L278.8 108.2Q276.6 107.9 275.7 106.3L275.3 105.1L275.1 98.8L274.9 98.6L274.7 95.4L274.1 92.2L272.9 88.3L270.4 85.6L266.9 83.6L261.7 82.4L260.1 82.4L258.3 82L244.8 82L243.2 82.4L241.8 82.4L236.7 83.6Q233.2 85 231 87.7L229.6 90.8L229.2 93.6L228.8 94.6L228.8 95.6L228.4 97L228.4 99.2L228.3 99.4L228.3 104.9L227.7 106.5L227.2 107L225.8 107.8L224.2 108.2L204.5 108.2Q203.2 107.9 202.6 106.9Q202 106.3 202.3 104.7L205.8 92.2L210.4 78.3L210.4 77.7L219.3 52.9L226.3 35.7L228.1 32.1L231.6 23.6L238.2 10.1Q238.9 8.4 240.3 7.4Q241.5 6.5 243.4 6.2ZM251.3 32.8L250.5 33.2Q248.7 34.8 247.9 37.2L244.9 46.1L243.7 50.6L242.7 53.2L242.7 54L241.3 58.8Q241.2 61.8 240.2 64.3Q239.8 66.9 241 68.1L242.3 69.1L244.9 70.3L245.9 70.5L248.9 70.5L249.1 70.7L257.4 70.5L259 70.1L261.4 68.9Q262.8 68.1 263.2 66.3L263.2 64.1Q262.6 62.9 262.6 61.4L260.2 52.4L259.2 49.9L259 48.5L255.6 39.1L255.4 37.9L253.5 34L252.1 32.8L251.3 32.8Z' },
  L: { width: 89, dx: -310, path: 'M317.5 6.2L336.7 6.2L338.2 7L339.2 8.9L339.2 10.5L338.2 14.4L338 16.6L337 20.4L336.6 23.6L335.6 27.7L335.4 30.3L334.4 34.9L334.2 37.8L333.2 43.6L333 47.4L332.8 47.6L332.8 49.4L332.4 51.3L332.4 53.3L332.2 53.5L332.2 55.5L332 55.7L331.6 71.6L331.8 71.8L332 75.8L333.2 79.5Q334.9 82.9 337.7 85.2Q340 87 342.9 88.2L344.2 88.4L346.8 89.3L351.2 89.7L354 90.3L362.7 90.3L365.7 89.7L369.7 89.5L375.4 88Q381.6 85.6 385.4 80.9Q388.2 77.6 390.2 73.6L391.3 72.5Q392.1 71.5 394.1 71.7Q395.6 72.1 396.3 73.4L396.7 74.4L396.9 76.9L397.1 77.1L397.1 78.9L397.3 79.1L397.5 85.9L397.7 86.1L397.7 89.2L397.9 89.4L397.9 92L398.1 92.2L398.1 95.8L398.3 96L398.7 105.1Q398.4 106.7 397.2 107.4L396 108Q395.1 107.8 394.9 108.2L312.5 108.2L311.9 108L310.4 106.5L310.2 104.3L310 104.1L310 101.4L310.2 101.2L310.2 93L310 92.8L310 90.2L310.2 90L310.2 75.8L310.4 75.6L310.6 58.9L310.8 58.7L311 46L311.4 44L311.4 35.1L311.6 34.9L311.8 25.3L312 25.1L312.2 17.6L312.6 15.4L312.6 10.7Q313.1 10.4 312.8 9.3L313.9 7.6L315.3 6.8L317.5 6.2Z' },
  B: { width: 90, path: 'M4 6H50Q84 6 84 33Q84 49 72 55Q90 62 90 80Q90 108 52 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6ZM28 27V47H46Q57 47 57 37Q57 27 46 27ZM28 66V87H49Q62 87 62 76.5Q62 66 49 66Z' },
  D: { width: 96, path: 'M4 6H44Q96 6 96 57Q96 108 44 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6ZM28 28V86H42Q68 86 68 57Q68 28 42 28Z' },
  F: { width: 84, path: 'M4 6H80Q84 6 84 10V22Q84 28 78 28H28V46H70Q74 46 74 50V60Q74 66 68 66H28Q27 88 28 104Q28 108 24 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6Z' },
  K: { width: 94, path: 'M4 6H22Q26 6 26 10Q25.5 30 26 46L62 9Q65 6 70 6H90Q95 6 92 10L52 52L93 102Q96 108 90 108H70Q65 108 62 104L35 70L26 79Q25.5 92 26 104Q26 108 22 108H4Q0 108 0 104Q1.5 57 0 10Q0 6 4 6Z' },
  U: { width: 94, path: 'M4 6H22Q26 6 26 10Q25 40 26 66Q26 86 47 86Q68 86 68 66Q69 40 68 10Q68 6 72 6H90Q94 6 94 10Q93 40 94 66Q94 110 47 110Q0 110 0 66Q1 40 0 10Q0 6 4 6Z' },
};
export const NAME_SPACE = 40;

/** Any short name in the flared HEAL lettering, broken over two lines where
    they balance best (the longer line never longer than it must be). Falls
    back to plain text for unsupported letters. */
export const FlaredWordmark: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const words = text.toUpperCase().trim().split(/\s+/);
  if (!words.every(word => [...word].every(letter => NAME_GLYPHS[letter]))) return <span className={className}>{text}</span>;
  const wordWidth = (word: string) => [...word].reduce((sum, letter) => sum + NAME_GLYPHS[letter].width + 8, -8);
  const lineWidth = (line: string[]) => line.reduce((sum, word) => sum + wordWidth(word), NAME_SPACE * (line.length - 1));
  let split = words.length;
  for (let i = 1, best = Infinity; i < words.length; i++) {
    const widest = Math.max(lineWidth(words.slice(0, i)), lineWidth(words.slice(i)));
    if (widest < best) { best = widest; split = i; }
  }
  const lines = [words.slice(0, split), words.slice(split)].filter(line => line.length);
  let running = 0;
  return <span className={className} role="img" aria-label={text}>
    {lines.map((line, li) => {
      let width = 3;
      const placed = line.flatMap((word, wi) => {
        if (wi > 0) width += NAME_SPACE;
        return [...word].map(letter => {
          const glyph = NAME_GLYPHS[letter];
          const x = width + (glyph.dx ?? 0);
          width += glyph.width + 8;
          return { letter, glyph, x };
        });
      });
      return <svg key={li} viewBox={`0 0 ${width - 5} 112`} preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <g fill="currentColor" fillRule="evenodd">
          {/* Each letter sits in its own positioned group, so a CSS animation on
              the letter itself can never override where it is placed. */}
          {placed.map(({ letter, glyph, x }, i) => <g key={`${letter}-${i}`} transform={`translate(${x} 0)`} style={{ '--i': running++ } as React.CSSProperties}><path d={glyph.path} /></g>)}
        </g>
      </svg>;
    })}
  </span>;
};
