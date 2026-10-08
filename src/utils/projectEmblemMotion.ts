interface Journey {
  scroll: number;
  source: { x: number; top: number; size: number };
  chapterTop: number;
  chapterBottom: number;
  corner: { x: number; y: number; size: number };
  reduced?: boolean;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

/** Fixed viewport coordinates. No accumulated deltas or trailing scroll spring. */
export function projectEmblemPose({ scroll, source, chapterTop, chapterBottom, corner, reduced }: Journey) {
  const progress = reduced ? 1 : clamp((scroll - chapterTop + 38) / 280);
  const ease = progress * progress * (3 - 2 * progress);
  const opacity = clamp((chapterBottom - scroll - corner.y - corner.size / 2) / 140);
  return {
    x: mix(source.x, corner.x, ease),
    y: mix(progress === 0 ? source.top - scroll : Math.max(corner.y, source.top - chapterTop + 38), corner.y, ease),
    size: mix(source.size, corner.size, ease),
    opacity,
    phase: opacity < 1 ? 'fading' : progress === 0 ? 'origin' : progress === 1 ? 'pinned' : 'travelling',
  };
}
