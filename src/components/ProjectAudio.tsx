import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { resolveCMSAsset, getCMSCopy } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { claimProjectAudio, fadeMediaVolume } from '../utils/audioFocus';

export function ProjectAudio({ active, project, title }: { active: boolean; project: 'project-amrit' | 'oneness-vann'; title: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const silenced = useRef(false);
  const startPlayback = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const startAt = project === 'project-amrit' ? 18 : 8;
  const source = resolveCMSMedia(project === 'project-amrit'
    ? resolveCMSAsset('asset.ProjectAudio.amrit', '/media/projects/project-amrit.mp3')
    : resolveCMSAsset('asset.ProjectAudio.oneness', '/media/projects/oneness-vann.mp3'));
  useEffect(() => {
    const el = audio.current;
    if (!el || !active) return;
    const focus = claimProjectAudio(el);
    let disposed = false, ready = false;
    el.volume = 0;
    el.currentTime = startAt;
    const attempt = () => {
      if (disposed || silenced.current || !ready || !el.paused) return;
      void el.play().then(() => {
        if (disposed) return;
        setBlocked(false);
        void fadeMediaVolume(el, .7);
      }).catch(() => { if (!disposed) setBlocked(true); });
    };
    const unlock = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('.project-audio-toggle')) return;
      attempt();
    };
    startPlayback.current = attempt;
    void focus.ready.then(() => { ready = true; attempt(); });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      disposed = true;
      startPlayback.current = () => {};
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      void focus.release();
    };
  }, [active, source, startAt]);
  return <>
    <audio ref={audio} src={source} preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    <button type="button" className="project-audio-toggle" aria-pressed={playing} disabled={!active} aria-label={`${playing ? 'Mute' : 'Play'} ${title} audio`}
      onClick={() => {
        const el = audio.current;
        if (!el) return;
        if (playing) { silenced.current = true; void fadeMediaVolume(el, 0).then(() => { if (silenced.current) el.pause(); }); }
        else { silenced.current = false; startPlayback.current(); }
      }}>
      {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
      {blocked ? getCMSCopy('copy.ProjectAudio.enable', 'Play project audio') : playing
        ? getCMSCopy('copy.ProjectAudio.mute', 'Mute project audio') : getCMSCopy('copy.ProjectAudio.play', 'Play project audio')}
    </button>
  </>;
}
