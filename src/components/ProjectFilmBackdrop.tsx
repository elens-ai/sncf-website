import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { resolveCMSMedia } from '../cms/media';
import { loadYouTubeAPI, type FilmPlayer } from '../utils/youtube';

/** Play only while the project's opening section is on screen. */
export function ProjectFilmBackdrop({ videoId, videoSrc, poster, title, active, illustrative = false }: {
  videoId: string | null; videoSrc?: string; poster: string; title: string; active: boolean; illustrative?: boolean;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const localFilm = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);
  const calm = useReducedMotion() ?? true;
  const [status, setStatus] = useState<'poster' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error'>('poster');
  const load = active && !!videoId && !videoSrc && !calm;

  useEffect(() => { resumeAt.current = 0; }, [videoSrc]);
  useEffect(() => {
    const film = localFilm.current;
    if (!film || !videoSrc) return;
    if (!active || calm) { setStatus('poster'); return; }
    let cancelled = false;
    const resume = () => {
      if (resumeAt.current > 0 && resumeAt.current < film.duration) film.currentTime = resumeAt.current;
      void film.play().catch(() => { if (!cancelled) setStatus('blocked'); });
    };
    setStatus('loading');
    film.addEventListener('loadedmetadata', resume, { once: true });
    film.src = resolveCMSMedia(videoSrc);
    film.load();
    return () => {
      cancelled = true;
      resumeAt.current = film.currentTime;
      film.removeEventListener('loadedmetadata', resume);
      film.pause();
      // Release the decoder and buffered media once the opening is offscreen.
      film.removeAttribute('src');
      film.load();
    };
  }, [active, calm, videoSrc]);

  useEffect(() => {
    const host = mount.current;
    if (videoSrc) return;
    if (!load || !videoId || !host) { setStatus('poster'); return; }
    let cancelled = false;
    let instance: FilmPlayer | undefined;
    ready.current = false;
    const readyTimeout = window.setTimeout(() => { if (!cancelled && !ready.current) setStatus('error'); }, 20000);
    setStatus('loading');
    const target = document.createElement('div');
    host.appendChild(target);
    loadYouTubeAPI().then(api => {
      if (cancelled) return;
      instance = new api.Player(target, {
        videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: { autoplay: 0, controls: 0, playsinline: 1, loop: 1, playlist: videoId, rel: 0, disablekb: 1, origin: window.location.origin },
        events: {
          onReady: event => {
            if (cancelled) return;
            clearTimeout(readyTimeout);
            ready.current = true;
            const frame = event.target.getIframe();
            frame.title = `${title} — background film`;
            frame.tabIndex = -1;
            frame.setAttribute('aria-hidden', 'true');
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange: event => { if (!cancelled && [1, 2].includes(event.data)) setStatus(event.data === 1 ? 'playing' : 'paused'); },
          onError: () => { if (!cancelled) setStatus('error'); },
          onAutoplayBlocked: () => { if (!cancelled) setStatus('blocked'); },
        },
      });
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; clearTimeout(readyTimeout); ready.current = false; instance?.destroy(); host.replaceChildren(); };
  }, [load, videoId, videoSrc, title]);

  const playing = status === 'playing';
  return <div className="project-film-stage" data-playing={playing} data-illustrative={illustrative || undefined}>
    <div className="project-film-picture" aria-hidden="true">
      <img src={resolveCMSMedia(poster)} alt="" loading="lazy" decoding="async" />
      {videoSrc ? <video ref={localFilm} className="project-film-local-video" data-visible={playing} muted loop playsInline preload="none" tabIndex={-1}
        onPlaying={() => setStatus('playing')} onError={() => { if (active) setStatus('error'); }} />
        : <div ref={mount} className="project-film-player" data-visible={status === 'playing' || status === 'paused'} />}
      <div className="project-film-shade" />
    </div>
    </div>;
}
