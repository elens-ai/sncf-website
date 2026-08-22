import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const ANTHEM_URL = 'https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-anthem.mp3';
/** The anthem is cued past its intro. */
const START_AT_SECONDS = 5;
const VOLUME = 0.7;
const MUTED_KEY = 'sncf:anthem-muted';

/**
 * Plays the SNCF anthem from 0:05 on arrival.
 *
 * Browsers block audible autoplay until the visitor has interacted with the
 * page, so a bare play() call is rejected on most first visits. We attempt it
 * anyway — kiosk/exhibition browsers are often launched with autoplay allowed,
 * and there it simply works — and when the attempt is refused we arm one-shot
 * listeners so the anthem begins at the visitor's first click, tap, key or
 * scroll instead of silently never playing.
 *
 * The toggle is always visible so the anthem can be silenced, and that choice
 * is remembered.
 */
export const AnthemPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [playing, setPlaying] = useState(false);
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
    const el = audioRef.current;
    if (!el) return;

    el.volume = VOLUME;
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
      disarm();
      cue(el);
      void el
        .play()
        .then(() => setBlocked(false))
        .catch(() => {
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
      el
        .play()
        .then(() => setBlocked(false))
        .catch(() => {
          setBlocked(true);
          arm(); // refused → start on the visitor's first interaction
        });

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
  }, [cue]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    } catch {
      /* storage unavailable — preference simply won't persist */
    }
  }, [muted]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;

    if (playing) {
      el.pause();
      setMuted(true);
      return;
    }
    // A click is a user gesture, so this play() is always allowed.
    setMuted(false);
    setBlocked(false);
    cue(el);
    void el.play().catch(() => undefined);
  };

  return (
    <>
      <audio ref={audioRef} src={ANTHEM_URL} preload="auto" playsInline />
      <button
        id="anthem-toggle"
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
        className={`relative grid place-items-center w-11 h-11 rounded-full bg-white/10 border backdrop-blur-xl text-white/90 hover:bg-white/20 hover:text-white transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex-none ${
          blocked ? 'border-white/70 anthem-waiting' : 'border-white/25'
        }`}
      >
        {playing ? <Volume2 className="w-[18px] h-[18px]" /> : <VolumeX className="w-[18px] h-[18px]" />}
      </button>
    </>
  );
};
