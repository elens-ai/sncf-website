/** Reveal whole graphemes so Hindi matras and conjuncts never type separately. */
export function typewriterLines(lines: readonly string[], duration: number) {
  const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
  const rows = lines.map(line => [...segmenter.segment(line)].map(part => part.segment));
  const total = rows.reduce((count, row) => count + row.length, 0);
  let index = 0;
  return rows.map(row => row.map(text => ({ text, at: ++index / total * duration })));
}
