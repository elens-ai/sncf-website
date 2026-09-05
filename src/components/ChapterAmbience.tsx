import React, { useEffect } from 'react';

export interface Chapter {
  id: string;
  /** the deep accent — what the ambience is tinted with */
  ink: string;
}

interface ChapterAmbienceProps {
  chapters: Chapter[];
}

/** '#1f8a5c' -> [31,138,92] */
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `${Math.round(a[0] + (b[0] - a[0]) * t)} ${Math.round(a[1] + (b[1] - a[1]) * t)} ${Math.round(
    a[2] + (b[2] - a[2]) * t,
  )}`;

/**
 * THE ROOM ANSWERS.
 *
 * In the hall on "/" you never wonder which vertical you are in: the whole
 * ground is that room's colour, and it changes as you move. These pages had
 * no equivalent — three white cards in a row, and crossing from Heal into
 * Enrich felt like scrolling a list rather than entering somewhere else.
 *
 * This is the daylit version of that. It publishes ONE variable pair on the
 * page root — `--room-ink`, the colour of whichever cornerstone currently
 * owns the viewport, and `--room-cross`, how far through a crossing we are —
 * and the stylesheet does the rest: the ambient wash on the paper, the
 * watermark petal, the threshold's rule. Paper stays paper; the ink is
 * carried at a few percent. It is a change in the light of the room, not a
 * coat of paint.
 *
 * The colour does not switch, it CROSSES: over the last stretch of the
 * outgoing chapter the ink travels to the incoming one, so the next room's
 * light reaches you before you get there. That anticipation is the part that
 * makes it feel like arriving somewhere.
 *
 * HOW IT MEASURES. A rAF-throttled scroll read of getBoundingClientRect —
 * the same idiom PillarsSection uses for the hall, and deliberately NOT
 * IntersectionObserver, which this codebase has been bitten by (a throttled
 * tab can hold its callbacks indefinitely, and an effect that silently never
 * fires is worse than one that costs a few microseconds a frame).
 *
 * NO REACT STATE. Nothing here re-renders; it writes two custom properties.
 */
export const ChapterAmbience: React.FC<ChapterAmbienceProps> = ({ chapters }) => {
  const key = chapters.map((c) => `${c.id}:${c.ink}`).join('|');

  useEffect(() => {
    const list = key.split('|').map((s) => {
      const [id, ink] = s.split(':');
      return { id, ink, rgb: rgb(ink) };
    });
    if (!list.length) return;

    const root = document.documentElement;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;

    const read = () => {
      raf = 0;
      /* the reading line: where "you are here" is decided. Matches the rail's
         own line so the ambience and the lit chip never disagree. */
      const line = Math.max(window.innerHeight / 3, 150);

      let currentIdx = 0;
      const tops: number[] = [];
      list.forEach((c, i) => {
        const el = document.getElementById(c.id);
        const top = el ? el.getBoundingClientRect().top : Infinity;
        tops[i] = top;
        if (top <= line) currentIdx = i;
      });

      /* How far into the crossing toward the NEXT chapter are we? The last
         stretch before the next chapter's top reaches the line is the cross:
         one viewport-third of travel, so the light turns over about a screen
         before the seam rather than snapping at it. */
      const nextTop = tops[currentIdx + 1];
      const CROSS = Math.max(240, window.innerHeight * 0.45);
      let t = 0;
      if (nextTop !== undefined && Number.isFinite(nextTop)) {
        const distance = nextTop - line;
        t = distance <= 0 ? 1 : distance >= CROSS ? 0 : 1 - distance / CROSS;
      }
      /* smootherstep: no visible start or stop to the crossing */
      const e = t * t * t * (t * (t * 6 - 15) + 10);

      const from = list[currentIdx].rgb;
      const to = (list[currentIdx + 1] ?? list[currentIdx]).rgb;
      root.style.setProperty('--room-ink', calm.matches ? mix(from, from, 0) : mix(from, to, e));
      root.style.setProperty('--room-cross', calm.matches ? '0' : e.toFixed(3));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      /* the hall does not want these — hand the root back as we found it */
      root.style.removeProperty('--room-ink');
      root.style.removeProperty('--room-cross');
    };
  }, [key]);

  return null;
};
