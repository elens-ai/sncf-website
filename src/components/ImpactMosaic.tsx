import { getCMSCopy } from '../cms/runtime';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PILLARS } from '../data/pillars';
import type { PillarState } from '../types';
import { activitiesFor, type Activity } from '../data/activities';
import { exploreHref } from '../data/activityImagery';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { MosaicSpotlight } from './MosaicTile';
import { MosaicChapter } from './MosaicChapter';
import { MosaicWaves, type WaveInput } from './MosaicWaves';
import { MosaicOverture } from './MosaicOverture';
import type { MosaicPillar } from './pillarLogoArt';
import { easeOut } from '../utils/waves';
import { subjectFor } from '../utils/waves';
import './impact-mosaic.css';

/**
 * The hero's photographic emblems surrounded by each pillar's programmes.
 * Desktop chapters share a sticky stage; smaller screens and reduced motion
 * use the same content in a flowing layout. The reader steers the shared
 * page palette and animation arrivals without rendering on every scroll.
 */

/** A chapter is current once its top has crossed this fraction of the viewport. */
const READING_LINE = .45;

/** Room enough for a chapter to stand on one screen beside its collage. */
const STAGE_QUERY = '(min-width: 1024px) and (min-height: 640px)';

const useMediaFlag = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, [query]);
  return matches;
};

/** "HEAL" as the report writes it → "Heal" as the script face wants it. */
const titleCase = (label: string) => label.charAt(0) + label.slice(1).toLowerCase();

export const ImpactMosaic: React.FC<{ heroPillar: PillarState }> = ({ heroPillar }) => {
  const revision = useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const reduced = useMediaFlag('(prefers-reduced-motion: reduce)');
  const roomy = useMediaFlag(STAGE_QUERY);
  const [current, setCurrent] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<Activity | null>(null);
  /* The programme under the pointer or focus, if any: the waves take its mood. */
  const [attended, setAttended] = useState<Activity | null>(null);
  /* The stage's progress, 0..1 across all four chapters, handed to the waves
     without a DOM read: the reader writes it, the wave clock reads it. */
  const waveInput = useRef<WaveInput>({ travel: 0 });
  const pendingFocus = useRef<string | null>(null);
  const chapters = useMemo(() => PILLARS.map(pillar => ({ pillar, activities: activitiesFor(pillar.id) })), [revision]);
  // Extra CMS programmes should flow naturally instead of being clipped in a pinned screen.
  const staged = roomy && !reduced && chapters.every(chapter => chapter.activities.length <= 6);
  const spotlightPillar = spotlight ? PILLARS.find(p => p.id === spotlight.pillarId) : undefined;

  const open = useCallback((activity: Activity) => setSpotlight(activity), []);
  const close = useCallback(() => {
    setSpotlight(previous => {
      if (previous) document.getElementById(`mosaic-tile-${previous.id}`)?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  const chooseChapter = useCallback((id: MosaicPillar) => {
    const section = ref.current;
    const chapter = section?.querySelector<HTMLElement>(`[data-stage="${id}"]`);
    if (!section || !chapter) return;
    const index = PILLARS.findIndex(p => p.id === id);
    const rect = section.getBoundingClientRect();
    const segment = (rect.height - window.innerHeight) / (PILLARS.length + 1);
    const header = document.getElementById('site-header')?.offsetHeight ?? 72;
    const top = staged
      ? window.scrollY + rect.top + segment * (index + 1) + 2
      : window.scrollY + chapter.getBoundingClientRect().top - header - 24;
    pendingFocus.current = id;
    window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
  }, [staged, reduced]);

  /* Stacked: each [data-reveal] block flags itself the first time it scrolls
     into view. On the stage the reader replays arrivals itself. */
  useEffect(() => {
    const section = ref.current;
    if (!section || staged) return;
    const stops: (() => void)[] = [];
    section.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
      stops.push(onArrival(el, () => { el.dataset.arrived = 'true'; }));
    });
    return () => stops.forEach(stop => stop());
  }, [staged, revision]);

  /* The reader. */
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const page = section.closest<HTMLElement>('.home-page');
    const stages = section.querySelectorAll<HTMLElement>('[data-stage]');
    const overture = section.querySelector<HTMLElement>('.mosaic-overture');
    const petals = section.querySelectorAll<HTMLElement>('.mosaic-petal');
    const written = new Map<string, number>();
    let raf = 0;
    let assemblyFrame = 0, assemblyStarted = 0, assemblyProgress = 0;
    let lastWheel = 0, touchY = 0, completedAtY = 0;
    let advancing = false;
    let applied: string | null | undefined;
    let shown = -2;
    /* One CSS variable per element, written in 1/200 steps so a still page costs nothing. */
    const write = (el: HTMLElement, name: string, value: number) => {
      const step = Math.round(value * 200) / 200;
      const key = `${name}@${el.dataset.piece ?? el.dataset.stage ?? el.className}`;
      if (written.get(key) === step) return;
      written.set(key, step);
      el.style.setProperty(name, String(step));
    };
    const paint = (stage: HTMLElement, p: number) => write(stage, '--p', p);
    const settle = (next: string | null) => {
      if (next && pendingFocus.current === next) {
        pendingFocus.current = null;
        requestAnimationFrame(() => document.getElementById(`mosaic-${next}-title`)?.focus({ preventScroll: true }));
      }
      if (next === applied) return;
      applied = next;
      setAttended(null);
      /* Above the section the override lifts and the hero's own colour comes
         back; below it the override simply stays. */
      const pillar = PILLARS.find(p => p.id === next);
      if (page) {
        if (pillar) {
          page.dataset.chapterTheme = pillar.id;
          page.style.setProperty('--accent-a', pillar.accentA);
          page.style.setProperty('--accent-b', pillar.accentB);
        } else {
          delete page.dataset.chapterTheme;
          page.style.removeProperty('--accent-a');
          page.style.removeProperty('--accent-b');
        }
      }
      section.dataset.chapter = next ?? '';
      setCurrent(next);
    };
    const readStacked = () => {
      const vh = window.innerHeight;
      const line = vh * READING_LINE;
      const inside = section.getBoundingClientRect().top <= line;
      updateAssembly(section.getBoundingClientRect().top, vh * .65, false);
      let next: string | null = null;
      stages.forEach(stage => {
        const rect = stage.getBoundingClientRect();
        if (inside && rect.top <= line) next = stage.dataset.stage ?? null;
        /* 0 as the chapter's top enters at the foot of the viewport, 1 as its
           bottom leaves the top. */
        if (!reduced) paint(stage, Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height))));
      });
      settle(next);
    };
    const paintAssembly = (o: number) => {
      if (!overture) return;
      write(overture, '--a', easeOut(Math.min(1, o / .8)));
      // A cupped hand, then the center petal, then mirrored pairs unfolding.
      petals.forEach((petal, index) => {
        const palm = petal.dataset.piece === 'palm';
        const start = palm ? 0 : .13 + Math.abs(index - 2) * .085;
        const t = Math.max(0, Math.min(1, (o - start) / (palm ? .38 : .48)));
        const bloom = t * t * t * (t * (t * 6 - 15) + 10);
        write(petal, '--bloom', bloom);
        write(petal, '--arc', Math.sin(Math.PI * bloom));
      });
      write(overture, '--w', easeOut(Math.max(0, Math.min(1, (o - .2) / .65))));
      write(overture, '--links', Math.max(0, Math.min(1, (o - .55) / .45)));
    };
    const animateAssembly = (now: number) => {
      assemblyProgress = Math.min(1, (now - assemblyStarted) / 2000);
      paintAssembly(assemblyProgress);
      if (assemblyProgress === 1) completedAtY = window.scrollY;
      assemblyFrame = assemblyProgress < 1 ? requestAnimationFrame(animateAssembly) : 0;
    };
    const updateAssembly = (top: number, threshold: number, finished: boolean) => {
      if (top > window.innerHeight && assemblyStarted) {
        cancelAnimationFrame(assemblyFrame);
        assemblyFrame = 0; assemblyStarted = 0; assemblyProgress = 0; advancing = false;
        paintAssembly(0);
      } else if (!assemblyStarted && top <= threshold) {
        assemblyStarted = performance.now();
        if (finished || reduced) { assemblyProgress = 1; paintAssembly(1); }
        else assemblyFrame = requestAnimationFrame(animateAssembly);
      }
    };
    const advanceToHeal = () => {
      if (pendingFocus.current || advancing || !staged || !assemblyStarted || shown !== -1 || performance.now() - assemblyStarted < 450) return;
      const rect = section.getBoundingClientRect();
      if (rect.top > window.innerHeight * .2) return;
      advancing = true;
      cancelAnimationFrame(assemblyFrame);
      assemblyProgress = 1; paintAssembly(1);
      const segment = (rect.height - window.innerHeight) / (stages.length + 1);
      window.scrollTo({ top: window.scrollY + rect.top + segment + 2, behavior: reduced ? 'instant' : 'smooth' });
    };
    const wheel = (event: WheelEvent) => {
      const now = performance.now();
      const freshGesture = now - lastWheel > 220;
      lastWheel = now;
      if (!event.ctrlKey && event.deltaY > 0 && freshGesture) advanceToHeal();
    };
    const touchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0; };
    const touchEnd = (event: TouchEvent) => {
      if (touchY - (event.changedTouches[0]?.clientY ?? touchY) > 40) advanceToHeal();
    };
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
      if (['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey) advanceToHeal();
    };
    const readStaged = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const count = stages.length;
      /* The track is one screen taller than the scroll it grants, so this runs
         0 → 1 exactly while the screen is pinned. The first segment is the
         overture — the petals assembling and "Our work" arriving — and the
         chapters take the rest, one segment each. */
      const t = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - vh)));
      const u = t * (count + 1);
      const index = u < 1 ? -1 : Math.min(count - 1, Math.floor(u) - 1);
      waveInput.current.travel = t;
      updateAssembly(rect.top, vh * .2, index >= 0);
      if (index >= 0) paint(stages[index], u - Math.floor(u));
      if (index !== shown) {
        shown = index;
        if (overture) overture.dataset.state = index < 0 ? 'active' : 'before';
        stages.forEach((stage: HTMLElement, i: number) => {
          stage.dataset.state = i < index ? 'before' : i > index ? 'after' : 'active';
          if (i !== index) return;
          /* Replay the arrival: drop the flag, let the style settle, raise it. */
          stage.querySelectorAll<HTMLElement>('[data-reveal]').forEach(block => {
            block.dataset.arrived = 'false';
            void block.offsetWidth;
            block.dataset.arrived = 'true';
          });
        });
        setSpotlight(null);
      }
      settle(index >= 0 && rect.top <= vh * READING_LINE ? stages[index].dataset.stage ?? null : null);
    };
    const read = () => { raf = 0; (staged ? readStaged : readStacked)(); };
    const onScroll = () => {
      if (assemblyProgress === 1 && window.scrollY > completedAtY + 12) advanceToHeal();
      if (!raf) raf = requestAnimationFrame(read);
    };
    if (!staged) { stages.forEach(stage => { delete stage.dataset.state; }); }
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('keydown', keyDown);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchend', touchEnd);
      window.removeEventListener('keydown', keyDown);
      cancelAnimationFrame(assemblyFrame);
      if (raf) cancelAnimationFrame(raf);
      page?.style.removeProperty('--accent-a');
      page?.style.removeProperty('--accent-b');
      if (page) delete page.dataset.chapterTheme;
    };
  }, [revision, reduced, staged]);

  const position = Math.max(0, chapters.findIndex(({ pillar }) => pillar.id === current));
  const body = (
    <>
      {chapters.map(({ pillar, activities }, index) => (
        <MosaicChapter
          key={pillar.id}
          pillar={pillar}
          index={index}
          activities={activities}
          live={current === pillar.id}
          stacked={!staged}
          openId={spotlight?.id ?? null}
          attendedId={attended?.id ?? null}
          onOpen={open}
          onAttend={setAttended}
        />
      ))}
      {spotlight && spotlightPillar && (
        <MosaicSpotlight key={spotlight.id} activity={spotlight} pillarName={titleCase(spotlightPillar.label)} href={exploreHref(spotlight)} onClose={close} />
      )}
    </>
  );

  return (
    <section id="pillars-section" ref={ref} className="impact-mosaic" data-mode={staged ? 'stage' : 'stacked'} data-active={active} aria-label={getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}>
      {staged ? (
        <div className="mosaic-stage">
          <MosaicWaves subject={subjectFor(chapters.find(({ pillar }) => pillar.id === current)?.pillar ?? heroPillar, current ? spotlight ?? attended : null)} active={active && !spotlight} input={waveInput} />
          <MosaicOverture onChoose={chooseChapter} />
          <p className="mosaic-stage-label" data-show={current !== null}><span aria-hidden="true" />{getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}<span className="mosaic-stage-count">{`${String(position + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`}</span></p>
          {body}
        </div>
      ) : (
        <>
          <MosaicOverture onChoose={chooseChapter} />
          {body}
        </>
      )}
    </section>
  );
};
