/**
 * READING THE FOUNDATION'S FIGURES.
 *
 * These were written inside CoreValuesPage and are now shared: Who We Are
 * counts three cornerstone figures with the same marks, and two copies of
 * `markStep` would be two scales that could silently disagree while both
 * printing "each mark ≈". Moved here rather than duplicated.
 */

/** '1,500,230' -> 1500230; '19,582,822 sq ft' -> 19582822; '449' -> 449. */
export const toNumber = (v: string): number => {
  const m = v.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

/**
 * A SUM OF MONEY, not a count of things — '₹4,82,19,252' beside '209,038'.
 * The ranked scale must never put these on one axis: rupees parse to a far
 * larger number than any headcount next to them, so one amount becomes the
 * peak and every real quantity in the room collapses against it.
 */
export const isAmount = (v: string) => /^[₹$]/.test(v.trim());

/**
 * ONE MARK STANDS FOR HOW MANY?
 *
 * The tally draws a row of marks per activity, and each row declares its own
 * worth — "each ● = 100,000 units collected". That declaration is what makes
 * the presentation honest: a bar chart forces one axis onto quantities that
 * do not share one, so 47 hospitals sat three pixels long beside 1.5 million
 * bags of blood and read as negligible. Counting symbols carry magnitude
 * without ever implying that a hospital and a blood bag are the same thing.
 *
 * The step is chosen so every row lands between 8 and 20 marks — enough to
 * feel a quantity, few enough to take in without counting.
 */
export const markStep = (v: number): number => {
  if (v <= 20) return 1;
  /* WHOLE STEPS ONLY. A 2.5 in this list gave the Health Centre a step of
     2.5 centres, which the key then printed as "≈ 3" — a caption that
     misstates its own scale, in the one section whose whole purpose is not
     to mislead. Integers only, so what is printed is what is drawn. */
  const mag = Math.pow(10, Math.floor(Math.log10(v / 14)));
  for (const m of [1, 2, 5]) {
    const step = Math.max(1, Math.round(m * mag));
    if (v / step <= 20) return step;
  }
  return Math.max(1, Math.round(mag * 10));
};

/** '100000' -> '100,000'; 2500 -> '2,500' */
export const groupNum = (n: number) =>
  n >= 1 ? Math.round(n).toLocaleString('en-US') : String(n);

/**
 * Only whole, plainly-written counts may be tallied: '9,174+' yes, '1.5M+'
 * no. An abbreviated figure carries its magnitude in a letter, so counting
 * its mantissa rounds 1.5M to "2M" — a quarter of a million units of blood
 * invented by a rounding step. Those are printed exactly as reported.
 */
export const isTallyable = (v: string) => /^[\d,]+\+?$/.test(v.trim());
