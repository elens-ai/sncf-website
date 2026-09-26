import { getCMSCopy } from '../cms/runtime';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PILLARS } from '../data/pillars';
import type { PillarState } from '../types';
import { activitiesFor, type Activity } from '../data/activities';
import { activityImage, exploreHref } from '../data/activityImagery';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useSectionActivity } from '../hooks/useSectionActivity';
import { onArrival } from '../utils/arrival';
import { PillarModelCard } from './PillarModelCard';
import { MosaicTile, MosaicSpotlight } from './MosaicTile';
import { MosaicAlbumDefs, MosaicFoliage } from './MosaicFoliage';
import { MosaicWaves, MosaicWavesStatic, type WaveInput } from './MosaicWaves';
import { PETAL_ART, PALM_ART } from './petalArt';
import { easeOut } from '../utils/waves';
import { subjectFor } from '../utils/waves';
import './impact-mosaic.css';

/**
 * OUR WORK — THE LIVING MOSAIC. The screen below the hero.
 *
 * Four chapters, one per pillar, and each one is an album page first: the
 * pillar's programmes as prints laid over a washed lead photograph, a
 * watercolour sprig behind them (MosaicFoliage), with the pillar itself
 * reduced to a signature — a faint chapter numeral, the script name, one
 * line, and its 3D model held small in a lit halo. No paragraphs, no grid
 * of statistics: every photograph carries one figure, and a programme
 * opens onto its photographs and its story in a spotlight over the collage.
 *
 * Two layouts, one component:
 *
 *  - THE STAGE (desktop, motion allowed). The section is a track four
 *    viewports long with one sticky screen inside it; scrolling turns the
 *    chapters in place — the current one slides away, the next rises, its
 *    signature and tiles replay their arrival — and a rail at the right
 *    names the four stops. The reader never leaves the screen.
 *
 *  - STACKED (phones, short viewports, reduced motion). The four chapters
 *    simply follow each other, each arriving as it scrolls into view.
 *
 * Three things here are deliberate:
 *
 *  - It paints no ground. The page-wide .accent-canvas shows through, and
 *    this component steers its colour: the chapter in view writes its
 *    accent pair on .home-page, which sits closer to the canvas than the
 *    :root values the hero publishes. The hero's writer is never touched,
 *    and its colour returns the moment the reader scrolls back above the
 *    section. Below it the override stays, so Events opens on the same
 *    mood — no seam.
 *
 *  - Scrolling causes no React work. One rAF-coalesced reader owns the
 *    stage: which chapter shows (data-state, DOM), its progress (--p, the
 *    parallax the tiles drift on), and the arrival replays. React only
 *    hears about a change of chapter.
 *
 *  - Exactly one model is live. The shared pillar renderer has a single
 *    canvas and hands every other card a poster, so `active` derives from
 *    the one `current` value and nothing else.
 */

/** A chapter is current once its top has crossed this fraction of the viewport. */
const READING_LINE = .45;

/* THE OVERTURE'S LOTUS. The five petals and the palm, in the artwork's own
   composition (petalArt.ts carries where each sits), expressed as fractions
   of the assembled flower's box so one CSS box scales the whole thing. Each
   piece also gets the place it flies in FROM — a fixed table, the same on
   every visit, coming down from where the hero's watermark was. */
const PIECES = [...PETAL_ART, { id: 'palm', ...PALM_ART }];
const LOTUS_BOX = (() => {
  const x0 = Math.min(...PIECES.map(p => p.x)), y0 = Math.min(...PIECES.map(p => p.y));
  const x1 = Math.max(...PIECES.map(p => p.x + p.w)), y1 = Math.max(...PIECES.map(p => p.y + p.h));
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
})();
const FLIGHT: Record<string, [string, string, string]> = {
  welcome: ['-44vw', '-38vh', '-40deg'],
  heal: ['-20vw', '-52vh', '22deg'],
  enrich: ['10vw', '-56vh', '-16deg'],
  empower: ['34vw', '-40vh', '30deg'],
  projects: ['46vw', '-12vh', '-26deg'],
  palm: ['0vw', '48vh', '0deg'],
};
const LOTUS = PIECES.map(p => ({
  id: p.id, src: p.src,
  left: ((p.x - LOTUS_BOX.x0) / LOTUS_BOX.w) * 100, top: ((p.y - LOTUS_BOX.y0) / LOTUS_BOX.h) * 100, width: (p.w / LOTUS_BOX.w) * 100,
  flight: FLIGHT[p.id] ?? ['0vw', '-40vh', '0deg'],
}));
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

const MosaicChapter = React.memo(function MosaicChapter({ pillar, index, activities, live, reduced, stacked, openId, onOpen, onAttend }: {
  pillar: PillarState; index: number; activities: Activity[]; live: boolean; reduced: boolean; stacked: boolean;
  openId: string | null; onOpen: (activity: Activity) => void; onAttend: (activity: Activity | null) => void;
}) {
  const name = titleCase(pillar.label);
  const flagship = pillar.id === 'projects';
  const marked = activities.some(activity => activity.images.length > 0);
  return (
    <article
      className="mosaic-chapter"
      data-stage={pillar.id}
      data-current={live}
      style={{ '--chapter-a': pillar.accentA, '--chapter-b': pillar.accentB } as React.CSSProperties}
      aria-labelledby={`mosaic-${pillar.id}-title`}
    >
      {stacked && <MosaicWavesStatic pillar={pillar} />}
      <div className="mosaic-hub" data-reveal>
        <div className="mosaic-medallion">
          <span className="mosaic-halo" aria-hidden="true" />
          <div className="mosaic-medallion-model"><PillarModelCard id={pillar.id} label={name} active={live && openId === null} animate={live && !reduced && openId === null} /></div>
        </div>
        <p className="mosaic-name font-dancing-script">{name}</p>
        <h3 id={`mosaic-${pillar.id}-title`} className="mosaic-headline">{pillar.headline}</h3>
        <Link className="mosaic-explore-all" to={flagship ? '/projects' : `/core-values#${pillar.id}`}>{getCMSCopy("copy.ImpactMosaic.3b73900b8d29", "Explore")} {name} <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
      <div className="mosaic-collage">
        <div className="mosaic-album" data-reveal>
          <MosaicFoliage pillarId={pillar.id} />
          <ul className="mosaic-prints" aria-label={`${name} programmes`}>
            {activities.map((activity, i) => (
              <MosaicTile key={activity.id} activity={activity} image={activityImage(activity)} index={i} open={openId === activity.id} onOpen={onOpen} onAttend={onAttend} />
            ))}
          </ul>
        </div>
        <p className="mosaic-tiles-note">{marked ? getCMSCopy("copy.ImpactMosaic.d51afc068025", "Photography is illustrative unless marked.") : getCMSCopy("copy.ImpactMosaic.a216e016d42c", "Photography is illustrative.")}</p>
      </div>
    </article>
  );
});

export const ImpactMosaic: React.FC = () => {
  const revision = useCMSRevision();
  const ref = useRef<HTMLElement>(null);
  const active = useSectionActivity(ref);
  const reduced = useMediaFlag('(prefers-reduced-motion: reduce)');
  const roomy = useMediaFlag(STAGE_QUERY);
  const staged = roomy && !reduced;
  const [current, setCurrent] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<Activity | null>(null);
  /* The programme under the pointer or focus, if any: the waves take its mood. */
  const [attended, setAttended] = useState<Activity | null>(null);
  /* The stage's progress, 0..1 across all four chapters, handed to the waves
     without a DOM read: the reader writes it, the wave clock reads it. */
  const waveInput = useRef<WaveInput>({ travel: 0 });
  const chapters = useMemo(() => PILLARS.map(pillar => ({ pillar, activities: activitiesFor(pillar.id) })), [revision]);
  const spotlightPillar = spotlight ? PILLARS.find(p => p.id === spotlight.pillarId) : undefined;

  const open = useCallback((activity: Activity) => setSpotlight(activity), []);
  const close = useCallback(() => {
    setSpotlight(previous => {
      if (previous) document.getElementById(`mosaic-tile-${previous.id}`)?.focus();
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
    const overture = section.querySelector<HTMLElement>('.mosaic-overture');
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
      /* Above the section the override lifts and the hero's own colour comes
         back; below it the override simply stays. */
      const pillar = PILLARS.find(p => p.id === next);
      if (page) {
        if (pillar) {
          page.style.setProperty('--accent-a', pillar.accentA);
          page.style.setProperty('--accent-b', pillar.accentB);
        } else {
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
      if (overture) {
        const o = Math.min(1, u);
        write(overture, '--a', easeOut(Math.min(1, o / .7)));            // the petals' flight, done by 70 %
        write(overture, '--w', Math.max(0, Math.min(1, (o - .55) / .35))); // the words, once the flower has formed
      }
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
          reduced={reduced}
          stacked={!staged}
          openId={spotlight?.id ?? null}
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
      <MosaicAlbumDefs />
      {staged ? (
        <div className="mosaic-stage">
          <MosaicWaves subject={subjectFor(chapters.find(({ pillar }) => pillar.id === current)?.pillar ?? chapters[0].pillar, spotlight ?? attended)} active={active && !spotlight} input={waveInput} />
          <div className="mosaic-overture" data-state="active" aria-hidden="true">
            <div className="mosaic-lotus" style={{ '--lotus-aspect': LOTUS_BOX.w / LOTUS_BOX.h } as React.CSSProperties}>
              {LOTUS.map(piece => (
                <img
                  key={piece.id}
                  className="mosaic-petal"
                  src={piece.src}
                  alt=""
                  draggable={false}
                  style={{ left: `${piece.left}%`, top: `${piece.top}%`, width: `${piece.width}%`, '--sx': piece.flight[0], '--sy': piece.flight[1], '--sr': piece.flight[2] } as React.CSSProperties}
                />
              ))}
            </div>
            <p className="mosaic-overture-eyebrow"><span /> {getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}</p>
            <p className="mosaic-overture-title font-dancing-script">{getCMSCopy("copy.ImpactMosaic.eee670c33892", "Four paths. One purpose.")}</p>
            <p className="mosaic-overture-lead">{getCMSCopy("copy.ImpactMosaic.c18aacd51665", "Every figure below is as the foundation reports it.")}</p>
          </div>
          <p className="mosaic-stage-label" data-show={current !== null}><span aria-hidden="true" />{getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}<span className="mosaic-stage-count">{`${String(position + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`}</span></p>
          {body}
        </div>
      ) : (
        <>
          <header className="mosaic-intro" data-reveal>
            <p className="mosaic-eyebrow"><span aria-hidden="true" />{getCMSCopy("copy.ImpactMosaic.fc967e87a6e8", "Our work")}</p>
            <h2 className="mosaic-intro-title font-dancing-script">{getCMSCopy("copy.ImpactMosaic.be2f5e9cfc4f", "Four paths. One purpose.")}</h2>
            <p className="mosaic-intro-lead">{getCMSCopy("copy.ImpactMosaic.942ee319c0e6", "Every figure below is as the foundation reports it.")}</p>
          </header>
          {body}
        </>
      )}
    </section>
  );
};
