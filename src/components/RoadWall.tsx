import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { ROAD_FIRST, ROAD_LAST } from '../data/roadYears';
import { ROAD_WALL } from './roadWallTiles';
import './road-wall.css';

const c = (key: string, fallback: string) => getCMSCopy(`copy.RoadWall.${key}`, fallback);

/**
 * THE ROAD SO FAR, AS A WALL, after the mosaic at the close of the Mission's
 * documentary Sukoon-e-Satguru: the foundation's photographs come together on
 * a wall, four years at a time, as the page is scrolled, from 2010 to 2026,
 * and at the last the supplied Jagriti artwork comes up over the whole of it.
 *
 * The wall stays in view while its section scrolls past (a tall section, the
 * wall sticky within it). It begins empty, every cell a bare slot, the seal
 * no more than a hint over it, seen square on. Then, like the walk
 * round a model of an exhibition, the wall lays back and turns as the view
 * goes in close to four blocks of it, three cells by three each, a year's to
 * a block, and stops there, turning a little; the years, 2010 – 2013, stand
 * large in the middle of the screen over the empty blocks, and as they fade
 * the four years' photographs all come down at once, like rain, from high
 * above the wall, turning as they fall, to settle flat into their places, in
 * their own colours, one of each year's carrying the year small at its foot
 * as a dated print would. Then the view draws back a little and crosses the
 * wall, turning another way, to the next four years in another corner of it,
 * and so on, 2026 last with the wall's last block beside it; the years before
 * settle into the wall's purple to teal. At the end the wall comes square on
 * again, the view draws back to the whole of it, every cell of it filled, and
 * the seal comes up over it. Scrolling back takes it all back down. The wall eases
 * after the scroll rather than jumping with it, and every change in it is
 * gradual, so it moves as one continuous thing.
 *
 * Where motion is unwelcome the wall is simply shown whole, the seal over it.
 * The photographs are one small sprite for the whole wall, and each larger on
 * its own for the close views, fetched as its stop comes
 * (scripts/build-road-wall.ts).
 */
const YEARS = Array.from({ length: ROAD_LAST - ROAD_FIRST + 1 }, (_, i) => ROAD_FIRST + i);
const { cols: COLS, rows: ROWS } = ROAD_WALL.grid;
/* THE BLOCKS, three cells by three, a year's each, the whole wall, edge to edge in three rows of six; and the stops of
   the view, four years to each, read across the wall: three squares of four blocks across its top two rows, then four
   blocks in a row along its bottom one, and 2026 last, its photographs filling the wall's last two blocks */
const BLOCKS = [0, 3, 6].flatMap(row => [0, 3, 6, 9, 12, 15].map(col => ({ col, row })));
const STOPS = [
  { blocks: [0, 1, 6, 7], years: [0, 1, 2, 3] },
  { blocks: [2, 3, 8, 9], years: [4, 5, 6, 7] },
  { blocks: [4, 5, 10, 11], years: [8, 9, 10, 11] },
  { blocks: [12, 13, 14, 15], years: [12, 13, 14, 15] },
  { blocks: [16, 17], years: [16] },
].map(stop => ({ blocks: stop.blocks.map(b => BLOCKS[b]), years: stop.years, range: stop.years.length > 1 ? `${YEARS[stop.years[0]]} – ${YEARS[stop.years[stop.years.length - 1]]}` : String(YEARS[stop.years[0]]) }));
/* the scroll, in shares of a stop: the empty wall, the stops, the view drawing back and the seal coming up, a while
   to look */
const LEAD = 1, PER_STOP = 2, OUTRO = 1.8, LINGER = .7;
const END = STOPS.length * PER_STOP, SPAN = LEAD + END + OUTRO + LINGER;
/* a stop: the view crossing to it and stopping there; its years standing large, then fading as its photographs come,
   all of them at once, each a little after or before the others */
const HOP = .45, RANGE_IN = .3, RANGE_OUT = .62, ARRIVE_AT = .6, SPREAD = .35, ARRIVE = .5;
/* the view at a stop, as round a model: the wall laid back so far, and turned so far, a different way at each stop,
   turning on a little while it stays */
const TILT = 48, TURNS = [-22, 16, -12, 24, -16], DRIFT = 5;
/* how much of the wall's colour lies on a photograph once its stop has passed; and, at the end, how strongly the
   photographs and the seal over them show */
const TONE = .5, PHOTOS_AT_END = .62, SEAL_AT_END = .88;
/* the wall's colour, top to bottom, the seal's own: its navy, into its sky blue, into its pink */
const PALETTE = [[24, 48, 120], [48, 168, 240], [216, 96, 168]];
const paletteAt = (t: number) => {
  const at = Math.min(1, Math.max(0, t)) * (PALETTE.length - 1), i = Math.min(PALETTE.length - 2, Math.floor(at)), f = at - i;
  return PALETTE[i].map((v, k) => Math.round(v + (PALETTE[i + 1][k] - v) * f));
};

type Cell = { col: number; row: number; tint: string; tone: number; tile?: number; y: number; k: number; at: number; label: boolean; dx: number; dy: number; dz: number; rx: number; ry: number; turn: number };
/* THE LAYOUT, laid by a seeded hand so the wall is the same on every visit: each stop's photographs in its blocks, a
   year's to a block in order, in an order of their own within it, its dated photograph among them; every photograph
   coming down from high above the wall, like rain, a little out from its place and turning as it falls */
const CELLS: Cell[] = (() => {
  let seed = 2026;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const cells: Cell[] = Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS, row = Math.floor(i / COLS), t = (row + .5) / ROWS + (col / COLS - .5) * .12;
    return { col, row, tint: `rgb(${paletteAt(t).join(' ')})`, tone: .62 + rand() * .5, y: -1, k: -1, at: 0, label: false, dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, turn: 0 };
  });
  STOPS.forEach((stop, k) => {
    const tiles = stop.years.flatMap(y => ROAD_WALL.tiles.flatMap((tile, t) => (tile.year === YEARS[y] ? [t] : [])));
    stop.blocks.forEach((block, b) => {
      const places = Array.from({ length: 9 }, (_, p) => ({ p, key: rand() })).sort((x, z) => x.key - z.key).map(({ p }) => p);
      tiles.slice(b * 9, b * 9 + 9).forEach((tile, order) => {
        const at = places[order], col = block.col + (at % 3), row = block.row + Math.floor(at / 3);
        const ox = (at % 3) - 1, oy = Math.floor(at / 3) - 1, angle = ox || oy ? Math.atan2(oy, ox) + (rand() - .5) * .8 : rand() * Math.PI * 2;
        const far = .15 + rand() * .35, turnX = (rand() - .5) * 50, turnY = (rand() - .5) * 50;
        Object.assign(cells[row * COLS + col], { tile, y: YEARS.indexOf(ROAD_WALL.tiles[tile].year), k, at: ARRIVE_AT + rand() * SPREAD,
          label: 'label' in ROAD_WALL.tiles[tile], dx: Math.cos(angle) * far, dy: Math.sin(angle) * far, dz: 5 + rand() * 4, rx: turnX, ry: turnY, turn: (rand() - .5) * 40 });
      });
    });
  });
  return cells;
})();
const TILES = CELLS.flatMap((cell, index) => (cell.tile === undefined ? [] : [{ ...cell, index }]));
const TILE_AT = new Map(TILES.map((tile, n) => [tile.index, n]));

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const spriteAt = (t: number) => `${((t % ROAD_WALL.cols) / (ROAD_WALL.cols - 1)) * 100}% ${(Math.floor(t / ROAD_WALL.cols) / (ROAD_WALL.rows - 1)) * 100}%`;

export function RoadWall() {
  useCMSRevision();
  const root = useRef<HTMLElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const photos = useRef<(HTMLElement | null)[]>([]);
  const sharps = useRef<(HTMLImageElement | null)[]>([]);
  const tones = useRef<(HTMLElement | null)[]>([]);
  const stamps = useRef<(HTMLElement | null)[]>([]);
  const ranges = useRef<(HTMLElement | null)[]>([]);
  const seals = useRef<(HTMLDivElement | null)[]>([]);
  const tint = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  /* the photographs are fetched only as the wall comes near */
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); observer.disconnect(); } }, { rootMargin: '150% 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /* Where the scroll has got to, in shares of a stop, and the view of the wall that goes with it. The wall eases after
     the scroll rather than jumping with it: each frame it goes part of the way to where the scroll is, so a turn of the
     wheel becomes a glide. Each photograph's state is worked out here and written only when it changes, so a frame
     touches only the photographs on the move, never the whole wall. */
  useEffect(() => {
    const section = root.current, element = wall.current, view = element?.parentElement;
    const layers = [element, tint.current, ...seals.current].filter((el): el is HTMLDivElement => !!el);
    if (!section || !element || !view) return;
    let frame = 0, last = 0, shown = NaN, size = '';
    /* what each photograph was last set to: how far it has come, how much of the wall's colour is on it, its year */
    const set = new Float32Array(TILES.length * 3).fill(-1);
    const write = (slot: number, value: number, apply: (value: number) => void) => {
      if (value === set[slot] || (value > 0 && value < 1 && Math.abs(value - set[slot]) < .002)) return;
      set[slot] = value;
      apply(value);
    };
    const goal = () => {
      if (still) return END + OUTRO;
      const rect = section.getBoundingClientRect();
      return clamp(-rect.top / Math.max(1, rect.height - view.clientHeight)) * SPAN - LEAD;
    };
    const draw = (p: number) => {
      const vw = view.clientWidth, vh = view.clientHeight;
      const cell = Math.max(vw / COLS, vh / ROWS), width = cell * COLS, height = cell * ROWS;
      const next = cell.toFixed(2);
      if (next !== size) {
        size = next;
        set.fill(-1);
        for (const el of layers) {
          el.style.setProperty('--wall-cell', `${next}px`);
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        }
        /* the seal, in the middle of what shows of the whole wall below the header, as large as fits there */
        const room = vh - (vw < 768 ? 108 : 124);
        const markWidth = Math.min(vw * .86, room * .8 * (596 / 335)), markHeight = markWidth * (335 / 596);
        for (const el of seals.current) {
          el?.style.setProperty('--seal-x', `${width / 2 - markWidth / 2}px`);
          el?.style.setProperty('--seal-y', `${vh - room / 2 - markHeight / 2}px`);
          el?.style.setProperty('--seal-width', `${markWidth}px`);
          el?.style.setProperty('--seal-height', `${markHeight}px`);
        }
      }
      /* the view: the whole wall, square on; or, like the walk round a model of the exhibition, the wall laid back and
         turned, close on a stop's blocks, all of them whole in view, held there (turning a little the while) as their
         photographs come down; or crossing between two stops, drawing back a little on the way */
      type View = { x: number; y: number; zoom: number; tilt: number; turn: number };
      /* framed in what shows below the site's header and the page's tabs, which lie over the top of the wall */
      const below = vw < 768 ? 108 : 124, open = vh - below, middle = below + open / 2;
      const whole: View = { x: width / 2, y: height / 2, zoom: 1, tilt: 0, turn: 0 };
      const stop = (k: number, v = HOP): View => {
        const blocks = STOPS[k].blocks;
        const left = Math.min(...blocks.map(b => b.col)), right = Math.max(...blocks.map(b => b.col)) + 3;
        const top = Math.min(...blocks.map(b => b.row)), bottom = Math.max(...blocks.map(b => b.row)) + 3;
        return { x: ((left + right) / 2) * cell, y: ((top + bottom) / 2) * cell, zoom: 1.3 * Math.min(vw / ((right - left + 1) * cell), open / ((bottom - top + 1) * cell)),
          tilt: TILT, turn: TURNS[k] + DRIFT * (v - HOP) };
      };
      let from = whole, to = whole, s = 0, dip = 0;
      if (p >= END) { from = stop(STOPS.length - 1, PER_STOP); s = smooth(clamp((p - END) / 1.1)); }
      else if (p >= 0) {
        const k = Math.floor(p / PER_STOP), v = p - k * PER_STOP;
        if (v < HOP) { from = k ? stop(k - 1, PER_STOP) : whole; to = stop(k); s = smooth(v / HOP); dip = k ? .3 : 0; }
        else { from = to = stop(k, v); }
      }
      const mix = (a: number, b: number) => a + (b - a) * s;
      const zoom = Math.exp(mix(Math.log(from.zoom), Math.log(to.zoom))) * (1 - dip * Math.sin(Math.PI * s));
      const tilt = mix(from.tilt, to.tilt), turn = mix(from.turn, to.turn);
      /* square on, keep the wall over the whole view (or, where it is drawn smaller than the view, centred in it); laid
         back, let the view go where the stop is, the wall's edges in sight */
      const within = (at: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : clamp(at, lo, hi));
      const flat = 1 - tilt / TILT, x = mix(from.x, to.x), y = mix(from.y, to.y);
      const fx = x + (within(x, vw / 2 / zoom, width - vw / 2 / zoom) - x) * flat, fy = y + (within(y, middle / zoom, height - (vh - middle) / zoom) - y) * flat;
      const placed = `translate(${vw / 2}px, ${middle}px) scale3d(${zoom.toFixed(4)}, ${zoom.toFixed(4)}, ${zoom.toFixed(4)}) rotateX(${tilt.toFixed(3)}deg) rotateZ(${turn.toFixed(3)}deg) translate(${-fx.toFixed(1)}px, ${-fy.toFixed(1)}px)`;
      for (const el of layers) el.style.transform = placed;

      /* the stop's years, large in the middle of the screen while its blocks stand empty, going as its photographs come */
      STOPS.forEach((_, k) => {
        const v = p - k * PER_STOP, show = clamp(Math.min((v - RANGE_IN) / .18, (RANGE_OUT + .2 - v) / .2));
        const el = ranges.current[k];
        if (el) { el.style.opacity = show.toFixed(3); el.style.transform = `translateY(-50%) scale(${(1.06 - .06 * smooth(clamp((v - RANGE_IN) / .4))).toFixed(4)})`; }
      });

      /* each photograph comes down from high above the wall, turning, and settles flat into its place, the stop's all
         together; in its own colours while its stop is the one in view, then taking the wall's as the view leaves; the
         dated one shows its year while its stop is in view; each stop's larger photographs are fetched a stop ahead */
      TILES.forEach((tile, n) => {
        const v = p - tile.k * PER_STOP, a = clamp((v - tile.at) / ARRIVE), t = 1 - (1 - a) ** 3;
        write(n * 3, t, t => {
          const el = photos.current[n], k = 1 - t;
          if (!el) return;
          el.style.opacity = clamp(a * 3).toFixed(3);
          el.style.transform = k < .001 ? 'none' : `translate3d(${(tile.dx * cell * k).toFixed(1)}px, ${(tile.dy * cell * k).toFixed(1)}px, ${(tile.dz * cell * k).toFixed(1)}px) rotateX(${(tile.rx * k).toFixed(2)}deg) rotateY(${(tile.ry * k).toFixed(2)}deg) rotateZ(${(tile.turn * k).toFixed(2)}deg)`;
        });
        const fresh = clamp(Math.min((v - tile.at) / .1, (PER_STOP + .8 - v) / .4));
        write(n * 3 + 1, (1 - fresh) * TONE, tone => { const el = tones.current[n]; if (el) el.style.opacity = tone.toFixed(3); });
        if (tile.label) write(n * 3 + 2, clamp(Math.min((v - tile.at - .3) / .15, (PER_STOP + .4 - v) / .15)), show => { const el = stamps.current[n]; if (el) el.style.opacity = show.toFixed(3); });
        const img = sharps.current[n];
        if (img && !img.getAttribute('src') && v > -1.5 && v < PER_STOP + 1) img.src = resolveCMSMedia(`${ROAD_WALL.sharp}/${String(tile.tile).padStart(3, '0')}.webp`);
      });

      /* the seal: a hint over the empty wall, gone as the view goes in, and coming up over the photographs once the view
         has drawn back, the photographs still showing through it, both of them fading back a little as it comes; the
         wall's colour over both, lightly, so they are one picture */
      const hint = 1 - smooth(clamp((p + .05) / .3)), reveal = smooth(clamp((p - END - .5) / 1.2));
      const seal = seals.current[0];
      /* each layer drawn only while it shows, so the stops between pay nothing for it */
      const show = (el: HTMLElement | null | undefined, opacity: number) => {
        if (!el) return;
        el.style.opacity = opacity.toFixed(4);
        el.style.visibility = opacity > .001 ? '' : 'hidden';
      };
      show(seal, Math.max(hint * .04, reveal * SEAL_AT_END));
      show(tint.current, Math.max(hint, reveal * .45));
      show(dim.current, reveal * (1 - PHOTOS_AT_END));
    };
    const tick = (now: number) => {
      frame = 0;
      const target = goal(), dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60;
      shown = Number.isNaN(shown) || still ? target : shown + (target - shown) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(target - shown) < .0004) shown = target;
      draw(shown);
      last = shown === target ? 0 : now;
      if (shown !== target) frame = requestAnimationFrame(tick);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(tick); };
    tick(performance.now());
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => { removeEventListener('scroll', schedule); removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [still, near]);

  const sprite = useMemo(() => ({ '--wall-sprite': `url(${resolveCMSMedia(ROAD_WALL.src)})`, '--wall-sprite-cols': ROAD_WALL.cols, '--wall-sprite-rows': ROAD_WALL.rows }), []);

  return (
    <section ref={root} className="road-wall" data-still={still || undefined} style={{ '--wall-span': SPAN } as React.CSSProperties}>
      <div className="road-wall-view" role="img" aria-label={c('jagriti-label', 'The foundation’s photographs from 2010 to 2026, coming together beneath Jagriti — The Awakening, 79th Nirankari Sant Samagam')}>
        <div ref={wall} className="road-wall-wall" style={{ '--wall-cols': COLS, ...(near ? sprite : {}) } as React.CSSProperties}>
          {CELLS.map((cell, i) => {
            const style = { '--wall-tint': cell.tint, '--wall-tone': cell.tone.toFixed(2) } as React.CSSProperties;
            if (cell.tile === undefined) return <i key={i} className="road-wall-plain" style={style} />;
            const n = TILE_AT.get(i)!;
            return <i key={i} className="road-wall-slot" style={style}>
              <span ref={el => { photos.current[n] = el; }} className="road-wall-photo" style={{ opacity: 0, backgroundPosition: spriteAt(cell.tile) }}>
                <img ref={el => { sharps.current[n] = el; }} className="road-wall-sharp" alt="" decoding="async" draggable={false}
                  onLoad={event => { event.currentTarget.dataset.ready = 'true'; }} />
                <b ref={el => { tones.current[n] = el; }} className="road-wall-tone" />
                {cell.label && <span ref={el => { stamps.current[n] = el; }} className="road-wall-year" style={{ opacity: 0 }}>{YEARS[cell.y]}</span>}
              </span>
            </i>;
          })}
        </div>
        {/* at the end, the photographs faded back a little into the ground behind them; then, each on a layer of its own
            lying exactly over the wall, the seal, a hint over the empty wall at the start and at the end coming up over the
            photographs, which still show through it; and over both the wall's colour, laid in colour only, so the seal and
            the photographs are one picture */}
        <div ref={dim} className="road-wall-dim" />
        <div ref={el => { seals.current[0] = el; }} className="road-wall-over road-wall-seal">
          {near && <img src={resolveCMSMedia(resolveCMSAsset('asset.RoadWall.jagriti', '/images/road-wall-jagriti.png'))} alt="" decoding="async" draggable={false} />}
        </div>
        <div ref={tint} className="road-wall-over road-wall-tint" />
        <div className="road-wall-ranges" aria-hidden="true">
          {STOPS.map((stop, k) => <p key={stop.range} ref={el => { ranges.current[k] = el; }} className="road-wall-range">{stop.range}</p>)}
        </div>
      </div>
    </section>
  );
}
