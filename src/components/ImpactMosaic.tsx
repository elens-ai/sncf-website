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
    const written = new Map<string, number>();
    let raf = 0;
    let applied: string | null | undefined;
    let shown = -2;
    /* One CSS variable per element, written in 1/200 steps so a still page costs nothing. */
    const write = (el: HTMLElement, name: string, value: number) => {
      const step = Math.round(value * 200) / 200;
      const key = `${name}@${el.dataset.stage ?? el.className}`;
      if (written.get(key) === step) return;
      written.set(key, step);
      el.style.setProperty(name, String(step));
    };
    const paint = (stage: HTMLElement, p: number) => write(stage, '--p', p);
    const settle = (next: string | null) => {
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
    const readStaged = () => {
      const count = stages.length;
      if (!count) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      /* The track is one screen taller than the scroll it grants, so this runs
         0 → 1 exactly while the screen is pinned, one segment per chapter. (The
         overture that used to open the stage now opens the page.) */
      const t = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - vh)));
      const u = t * count;
      const index = Math.min(count - 1, Math.floor(u));
      waveInput.current.travel = t;
      paint(stages[index], u - index);
      if (index !== shown) {
        shown = index;
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
      settle(rect.top <= vh * READING_LINE ? stages[index].dataset.stage ?? null : null);
    };
    const read = () => { raf = 0; (staged ? readStaged : readStacked)(); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    if (!staged) { stages.forEach(stage => { delete stage.dataset.state; }); }
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
          <p className="mosaic-stage-label" data-show={current !== null}><span aria-hidden="true" />{getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}<span className="mosaic-stage-count">{`${String(position + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`}</span></p>
          {body}
        </div>
      ) : (
        body
      )}
    </section>
  );
};
