import React, { useEffect, useRef, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import type { ModelView } from './pillarRenderer';
export const MODEL_PILLARS = new Set(['heal', 'enrich', 'empower', 'projects']);

export function PillarModelCard({ id, label, animate, active = false }: {
  id: string; label: string; animate: boolean; active?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ModelView | null>(null);
  const stateRef = useRef({ active, animate });
  stateRef.current = { active, animate };
  const [poster, setPoster] = useState<string>();
  const [live, setLive] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false, visible = false, loading = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      visible = entry.isIntersecting;
      viewRef.current?.update({ ...stateRef.current, visible });
      if (!visible || loading) return;
      loading = true;
      try {
        const { attachModel } = await import('./pillarRenderer');
        if (disposed) return;
        viewRef.current = attachModel(host, id, setPoster, setLive);
        viewRef.current.update({ ...stateRef.current, visible });
      } catch (error) { console.warn(`Unable to load ${id} model`, error); }
    });
    observer.observe(host);
    return () => {
      disposed = true;
      observer.disconnect();
      viewRef.current?.dispose();
      viewRef.current = null;
    };
  }, [id]);
  useEffect(() => { viewRef.current?.update({ active, animate }); }, [active, animate]);
  return (
    <div className="relative w-full h-full overflow-visible pointer-events-none" role="img" aria-label={`${label} floating 3D icon`}>
      {!poster && !live && id !== 'projects' && <img src={`/images/vertical-${id}.webp`} alt="" className="absolute w-[60%] left-[20%] top-1/2 -translate-y-1/2 rounded-full" />}
      {!poster && !live && id === 'projects' && <HeartHandshake aria-hidden="true" className="absolute w-[65%] h-[65%] left-[17.5%] top-[17.5%] text-sky-200" strokeWidth={1.25} />}
      <div className="absolute -inset-[22%] z-[1]">
        {poster && <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-contain" style={{ visibility: live ? 'hidden' : 'visible' }} />}
        <div ref={hostRef} className="absolute inset-0" />
      </div>
    </div>
  );
}
