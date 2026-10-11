import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { resolveCMSAsset } from '../cms/runtime';
import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { audioFocus, fadeMediaVolume } from '../utils/audioFocus';
import { anthemAudio, anthemPlaying } from '../utils/anthemAudio';
import { Volume2, VolumeX } from 'lucide-react';

const anthemURL = () => resolveCMSAsset("asset.AnthemPlayer.bf1bfa524baa", "/media/sncf-anthem-instrumental-v1.2.mp3");
/** The instrumental (v1.2, 3:05) plays from its first note. */
const START_AT_SECONDS = 0;
const VOLUME = 0.7;
const MUTED_KEY = 'sncf:anthem-muted';

/**
 * Plays the SNCF anthem on arrival, and on through the whole visit.
 *
 * Browsers block audible autoplay until the visitor has interacted with the
 * page, so a bare play() call is rejected on most first visits. We attempt it
 * anyway — kiosk/exhibition browsers are often launched with autoplay allowed,
 * and there it simply works — and when the attempt is refused we arm one-shot
 * listeners so the anthem begins at the visitor's first click, tap, key or
 * scroll instead of silently never playing.
 *
 * The sound itself is the site's one anthem element (utils/anthemAudio), not
 * this header's: each page draws its own header, and the anthem plays on as
 * they change, from wherever it had got to. A header arriving while it plays
 * leaves it be.
 *
 * The toggle is always visible so the anthem can be silenced, and that choice
 * is remembered.
 */
export const AnthemPlayer: React.FC = () => {
  useCMSRevision();
  const ANTHEM_URL = anthemURL();
  const src = resolveCMSMedia(ANTHEM_URL);
  const projectAudioActive = useSyncExternalStore(audioFocus.subscribe, audioFocus.active, () => false);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      return false;
    }
  });
  /* already sounding when this page's header arrives, carried over from the page before */
  const [playing, setPlaying] = useState(anthemPlaying);
  /* True when the browser refused autoplay. Nothing in JS can override that
     policy, so the honest response is to make the control visible enough that
     a visitor knows sound is waiting for them. */
  const [blocked, setBlocked] = useState(false);

  /** Seek to the cue point, once metadata makes duration/seeking available. */
  const cue = useCallback((el: HTMLAudioElement) => {
    if (el.readyState < 1) return; // no metadata yet — loadedmetadata will call us
    if (el.currentTime < START_AT_SECONDS) {
      try {
        el.currentTime = START_AT_SECONDS;
      } catch {
        /* seek not available yet; harmless */
      }
    }
  }, []);

  useEffect(() => {
    const el = anthemAudio(src);
    if (projectAudioActive) { setPlaying(false); return; }
    if (muted) { el.pause(); setPlaying(false); return; }

    /* From silence it rises; one already sounding (from the page before) is left
       as it is, and one that has played to its end is not begun again by moving
       to another page (the toggle plays it again). */
    const start = () => {
      if (!el.paused) { setBlocked(false); return Promise.resolve(); }
      if (el.ended) return Promise.resolve();
      el.volume = 0;
      return el.play().then(() => { setBlocked(false); void fadeMediaVolume(el, VOLUME); });
    };
    setPlaying(!el.paused);
    const onMeta = () => cue(el);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onPause);

    let unlockArmed = false;
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

    const unlock = () => {
      if (!audioFocus.permits(el)) return;
      disarm();
      cue(el);
      start().catch(() => {
        /* still refused — leave it to the toggle */
      });
    };

    const disarm = () => {
      if (!unlockArmed) return;
      unlockArmed = false;
      events.forEach((e) => window.removeEventListener(e, unlock));
    };

    const arm = () => {
      if (unlockArmed) return;
      unlockArmed = true;
      events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    };

    const attempt = () =>
      audioFocus.permits(el) ? start()
        .catch(() => {
          setBlocked(true);
          arm(); // refused → start on the visitor's first interaction
        }) : Promise.resolve();

    if (!muted) {
      cue(el);
      void attempt();
    }

    /* Retry when the tab comes back to the foreground: a background tab is
       refused outright, and without this the anthem would stay silent even
       after the visitor returns and the policy would allow it. */
    const onVisible = () => {
      if (document.visibilityState === 'visible' && el.paused && !muted) {
        cue(el);
        void attempt();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      disarm();
      document.removeEventListener('visibilitychange', onVisible);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onPause);
    };
    // Intentionally runs once: the toggle drives playback afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, src, muted, projectAudioActive]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    } catch {
      /* storage unavailable — preference simply won't persist */
    }
  }, [muted]);

  const toggle = () => {
    const el = anthemAudio(src);
    if (!audioFocus.permits(el)) return;

    if (playing) {
      el.pause();
      setMuted(true);
      return;
    }
    // A click is a user gesture, so this play() is always allowed. (A project
    // film may have faded it right down before it paused, so it rises again.)
    setMuted(false);
    setBlocked(false);
    cue(el);
    if (el.volume < VOLUME) { el.volume = 0; void el.play().then(() => fadeMediaVolume(el, VOLUME)).catch(() => undefined); }
    else void el.play().catch(() => undefined);
  };

  return (
    <>
      <button
        id="anthem-toggle"
        disabled={projectAudioActive}
        onClick={toggle}
        title={
          blocked
            ? 'Tap for sound — your browser blocked autoplay'
            : playing
              ? 'Mute the anthem'
              : 'Play the anthem'
        }
        aria-label={blocked ? 'Play the anthem (autoplay was blocked)' : playing ? 'Mute the anthem' : 'Play the anthem'}
        aria-pressed={playing}
        className="relative grid place-items-center w-11 h-11 bg-transparent border-0 text-white/90 hover:text-white transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex-none"
      >
        {playing ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
      </button>
    </>
  );
};
