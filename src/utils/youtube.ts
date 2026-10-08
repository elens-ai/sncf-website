/** Accept a single YouTube film, never arbitrary embed HTML or a playlist. */
export function youtubeId(source: string | null | undefined): string | null {
  if (!source) return null;
  const value = source.trim();
  const valid = (id: string | null) => id && /^[\w-]{11}$/.test(id) ? id : null;
  if (valid(value)) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (host === 'youtu.be') return valid(url.pathname.split('/')[1]);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) return null;
    const parts = url.pathname.split('/');
    return valid(parts[1] === 'watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[1]) ? parts[2] : null);
  } catch { return null; }
}

export interface FilmPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
}
interface PlayerEvent { target: FilmPlayer; data: number }
interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    videoId: string; host: string; width: string; height: string;
    playerVars: Record<string, string | number>;
    events: { onReady(event: PlayerEvent): void; onStateChange(event: PlayerEvent): void; onError(): void; onAutoplayBlocked(): void };
  }) => FilmPlayer;
}
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<YouTubeAPI> | undefined;

export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    const fail = () => { clearTimeout(timeout); script.remove(); apiPromise = undefined; reject(new Error('YouTube could not load')); };
    const timeout = window.setTimeout(fail, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      previous?.();
      if (window.YT?.Player) resolve(window.YT); else fail();
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return apiPromise;
}
