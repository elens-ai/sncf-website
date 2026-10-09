/** A project soundtrack owns audible playback until its chapter ends. */
export function createAudioFocus() {
  let owner: HTMLMediaElement | null = null;
  let generation = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    active: () => owner !== null,
    owner: () => owner,
    permits: (media: HTMLMediaElement) => !owner || media === owner || media.muted,
    claim(media: HTMLMediaElement) {
      const lease = ++generation;
      owner = media;
      notify();
      return Object.assign(() => {
        if (lease !== generation) return;
        owner = null;
        notify();
      }, { current: () => lease === generation });
    },
  };
}
export const audioFocus = createAudioFocus();
const fades = new WeakMap<HTMLMediaElement, () => void>();
export const AUDIO_FADE_MS = 300;

/** Cancel an earlier ramp when a visitor changes chapters again mid-transition. */
export function fadeMediaVolume(media: HTMLMediaElement, target: number, duration = AUDIO_FADE_MS) {
  fades.get(media)?.();
  if (document.hidden || duration <= 0) { media.volume = target; return Promise.resolve(true); }
  return new Promise<boolean>(resolve => {
    const from = media.volume;
    const start = performance.now();
    let frame = 0;
    const finish = (completed: boolean) => { cancelAnimationFrame(frame); if (fades.get(media) === cancel) fades.delete(media); resolve(completed); };
    const cancel = () => finish(false);
    fades.set(media, cancel);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t * t * (3 - 2 * t);
      media.volume = from + (target - from) * ease;
      if (t < 1) frame = requestAnimationFrame(tick); else finish(true);
    };
    frame = requestAnimationFrame(tick);
  });
}

export function claimProjectAudio(media: HTMLMediaElement) {
  const outgoing = new Set([...document.querySelectorAll<HTMLMediaElement>('audio, video')]
    .filter(other => other !== media && !other.muted && !other.paused));
  const releaseFocus = audioFocus.claim(media);
  const guard = (event: Event) => {
    if (!releaseFocus.current()) return;
    const target = event.target;
    if (target instanceof HTMLMediaElement && !outgoing.has(target) && !audioFocus.permits(target)) target.pause();
  };
  document.addEventListener('play', guard, true);
  document.addEventListener('volumechange', guard, true);
  const ready = Promise.all([...outgoing].map(async other => {
    const completed = await fadeMediaVolume(other, 0);
    if (completed && audioFocus.owner() !== other) other.pause();
    outgoing.delete(other);
  }));
  return {
    ready,
    async release() {
      const completed = media.paused || await fadeMediaVolume(media, 0);
      if (completed && (releaseFocus.current() || audioFocus.owner() !== media)) media.pause();
      document.removeEventListener('play', guard, true);
      document.removeEventListener('volumechange', guard, true);
      releaseFocus();
    },
  };
}
