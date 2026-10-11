/**
 * THE ANTHEM IS ONE SOUND FOR THE WHOLE VISIT.
 *
 * Each page draws its own header, and the header's anthem toggle used to hold
 * its own <audio> as well: moving from one part of the site to another (Home,
 * Core Values, Projects, Events...) took the anthem down with the old header
 * and started it again, from its first note, with the new one. The element is
 * made once, here, and kept in the document, where the project films find it
 * and fade it under their own soundtracks (audioFocus.ts), but outside every
 * page, so it plays on while the pages change; each page's toggle only drives
 * it (AnthemPlayer).
 *
 * Where it has got to is kept for the rest of the visit as well, so a refresh
 * (pulled down on a phone, or the browser's own) carries on from there rather
 * than from the start.
 */
const POSITION_KEY = 'sncf:anthem-at';

let audio: HTMLAudioElement | null = null;

const savedPosition = () => {
  try { return Number(sessionStorage.getItem(POSITION_KEY)) || 0; } catch { return 0; }
};
const savePosition = (seconds: number | null) => {
  try {
    if (seconds === null) sessionStorage.removeItem(POSITION_KEY);
    else sessionStorage.setItem(POSITION_KEY, String(Math.floor(seconds)));
  } catch { /* storage unavailable: a refresh starts it again */ }
};

/** The anthem's one element, made (and put in the document) the first time it is asked for. */
export function anthemAudio(src: string): HTMLAudioElement {
  if (!audio) {
    const el = audio = document.createElement('audio');
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.dataset.anthem = 'true';
    document.body.appendChild(el);
    const resume = savedPosition();
    if (resume > 0) el.addEventListener('loadedmetadata', () => { if (resume < el.duration - 1) el.currentTime = resume; }, { once: true });
    let saved = resume;
    el.addEventListener('timeupdate', () => {
      if (Math.abs(el.currentTime - saved) < 2) return;
      saved = el.currentTime;
      savePosition(saved);
    });
    el.addEventListener('ended', () => { saved = 0; savePosition(null); });
  }
  /* set only when it changes (a new recording published from the CMS): setting it reloads it from the start */
  if (audio.getAttribute('src') !== src) audio.setAttribute('src', src);
  return audio;
}

/** Whether the anthem is sounding now, carried over from the page before; it is not made by asking. */
export const anthemPlaying = () => !!audio && !audio.paused;
