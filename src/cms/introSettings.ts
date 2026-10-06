/* The welcome intro's settings are typed by editors into CMS text slots: a
   time in seconds, or a photo focus point as "across% down%". Anything that
   cannot be read, or falls outside a sensible range, uses the design default,
   so a typo in the CMS can never stall or break the intro. */

/** Milliseconds for a page hold given in seconds (decimals allowed). */
export function introSeconds(value: string, fallbackSeconds: number, min = 2, max = 120): number {
  const seconds = Number.parseFloat(String(value).trim().replace(',', '.'));
  return (Number.isFinite(seconds) && seconds >= min && seconds <= max ? seconds : fallbackSeconds) * 1000;
}

export interface FocusPoint { x: string; y: string }

/** A focus point such as "47% 46%" (the % signs are optional), each 0–100. */
export function introFocus(value: string, fallback: FocusPoint): FocusPoint {
  const parts = String(value).trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) return fallback;
  const [x, y] = parts.map(part => (/^\d+(\.\d+)?%?$/.test(part) ? Number.parseFloat(part) : Number.NaN));
  return [x, y].every(n => Number.isFinite(n) && n >= 0 && n <= 100) ? { x: `${x}%`, y: `${y}%` } : fallback;
}
