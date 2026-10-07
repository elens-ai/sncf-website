import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy } from '../cms/runtime';
import type { Award, AwardPhoto } from '../data/awards';
import './honour-pile.css';

/** One honour as the pile shows it: the award and its photographs. */
export interface PileHonour { key: string; award: Award; photos: AwardPhoto[] }

/* THE PILE OF HONOURS, after an archive's page of fragments. The photographs
   of the honours are prints laid loosely on the section's own ground: tilted,
   overlapping, each with its shadow, as if tipped out onto a table. Fifteen lie
   there at a time, the major honours first and never two of one honour; the rest wait
   their turn. A print brought forward rises where it lies, straightens, grows
   and comes to the front, and its honour's card stands beside it: the year,
   the honour, who gave it, and why. Pointing at a print brings it forward (so
   does tapping it, or moving to it by keyboard); while nobody is, the pile
   turns over by itself, an honour at a time: the print forward goes back, one
   that has lain there a while is taken away, a new one is dropped in its
   place, and the new one is brought forward. A print already forward opens
   its photograph full size. */

interface Slot { x: number; y: number; w: number; r: number }

/* A seeded random (mulberry32), so the places on the pile are the same on every visit (what lies in them is not). */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function shuffled<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/* Where the prints lie, for however many lie there at a time: a loose grid of
   the pile's shape, each row a half step off the last, every place nudged,
   tilted and sized a little differently, and the places taken in no order, so
   it reads as a heap rather than rows. Centres and widths are in % of the
   pile's width and height, tilts in degrees. */
const layOut = (count: number, aspect: number): Slot[] => {
  if (!count) return [];
  const rand = seeded(count * 7919 + Math.round(aspect * 100));
  /* cells a little wider than tall, as most of the photographs are */
  const rows = Math.max(1, Math.round(Math.sqrt(count / (aspect / 1.35))));
  const cols = Math.ceil(count / rows);
  const cw = 100 / cols, ch = 100 / rows;
  const cells = Array.from({ length: rows * cols }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return Array.from({ length: count }, (_, k) => {
    const row = Math.floor(cells[k] / cols), col = cells[k] % cols;
    return {
      x: (col + 0.5) * cw + (row % 2 ? 0.09 : -0.09) * cw + (rand() - 0.5) * cw * 0.16,
      y: (row + 0.5) * ch + (rand() - 0.5) * ch * 0.18,
      w: cw * (0.84 + rand() * 0.14),
      r: (rand() - 0.5) * 11,
    };
  });
};

/* The pile's shape for the screen: its proportions, how large a print
   brought forward may become (in % of the pile's width and height, and at
   most how many times its size) and how wide its card is (beside it; on a
   phone the card sits beneath the pile instead). */
type Shape = 'wide' | 'medium' | 'narrow';
const SHAPES: Record<Shape, { aspect: number; liftW: number; liftH: number; maxLift: number; cardW: number }> = {
  wide: { aspect: 2.45, liftW: 32, liftH: 68, maxLift: 1.85, cardW: 24 },
  medium: { aspect: 1.75, liftW: 40, liftH: 72, maxLift: 2, cardW: 32 },
  narrow: { aspect: 0.75, liftW: 84, liftH: 56, maxLift: 3.6, cardW: 0 },
};
const shapeNow = (): Shape => matchMedia('(min-width: 1100px)').matches ? 'wide' : matchMedia('(min-width: 640px)').matches ? 'medium' : 'narrow';
const useShape = () => {
  const [shape, setShape] = useState<Shape>(shapeNow);
  useEffect(() => {
    const lists = ['(min-width: 1100px)', '(min-width: 640px)'].map(query => matchMedia(query));
    const sync = () => setShape(shapeNow());
    lists.forEach(list => list.addEventListener('change', sync));
    return () => lists.forEach(list => list.removeEventListener('change', sync));
  }, []);
  return shape;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
/* how many prints lie on the pile at a time */
const ON_PILE = 15;
/* how long a print stays forward while the pile goes by itself (longer when someone chose it), how long one going
   back takes, how long one taken away takes to go, and how long a new one waits and then takes to land before it is
   brought forward; without motion, how often a print is changed for another (nothing is brought forward by itself) */
const FIRST_MS = 1200;
const DWELL_MS = 4200;
const CHOSEN_DWELL_MS = 10000;
const SETTLE_MS = 750;
const LEAVE_MS = 650;
const LAND_MS = 1200;
const CALM_TURN_MS = 6000;
/* the gap between a print brought forward and its card, in % of the pile's width */
const CARD_GAP = 2.5;

/* A print as it lies: which photograph, in which place, when it came (each lies over those before it) and how it fell. */
interface Laid { k: number; slot: number; seq: number; dx: number; dy: number; dr: number; first: boolean }

export const HonourPile: React.FC<{
  honours: PileHonour[];
  /** The section has come into view: the prints are laid down. */
  arrived: boolean;
  /** The pile may change by itself (in view, nothing open over it). */
  running: boolean;
  /** Motion is not wanted: the first honour is simply forward, and prints are changed without moving. */
  calm: boolean;
  /** A print already forward was chosen: open its photograph. */
  onOpen: (honour: number, photo: number) => void;
}> = ({ honours, arrived, running, calm, onOpen }) => {
  const shape = useShape();
  const stage = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const [stageWidth, setStageWidth] = useState(0);
  const [stageAspect, setStageAspect] = useState(SHAPES[shape].aspect);
  const [laid, setLaid] = useState<Laid[]>([]);
  const [leaving, setLeaving] = useState<Laid[]>([]);
  const [lifted, setLifted] = useState<number | null>(null);
  const [settling, setSettling] = useState<number | null>(null);
  /* the print dropped in last, brought forward once it has landed */
  const [landing, setLanding] = useState<number | null>(null);
  /* the print whose card shows: kept while nothing is forward, so a card fades rather than vanishes */
  const [cardK, setCardK] = useState<number | null>(null);
  /* someone is pointing at the pile, or moving through it by keyboard: it waits for them */
  const [held, setHeld] = useState(false);
  const liftedRef = useRef<number | null>(null);
  /* the print forward was chosen by someone, not brought forward by the pile */
  const chosenRef = useRef(false);
  const viewed = useRef<{ k: number; since: number } | null>(null);
  /* the prints waiting their turn, in the order they will come, and how many prints have come so far */
  const deck = useRef<number[]>([]);
  const openingTour = useRef<number[]>([]);
  const seq = useRef(0);
  const settleTimer = useRef(0);
  const leaveTimers = useRef(new Set<number>());

  const prints = useMemo(() => honours.flatMap((honour, h) => honour.photos.map((photo, p) => ({ key: `${honour.key}-${p}`, honour: h, photo: p, ...photo }))), [honours]);
  const count = Math.min(ON_PILE, prints.length);
  /* which photographs there are, in order: the content can be refreshed without any of them changing */
  const signature = useMemo(() => prints.map(print => print.key).join('|'), [prints]);
  const slots = useMemo(() => layOut(count, stageAspect), [count, stageAspect]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(Math.round(entry.contentRect.width / 20) * 20);
      if (entry.contentRect.height > 0) setStageAspect(entry.contentRect.width / entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* The first prints follow the editorial priority (never two of one honour while others wait); they land in
     the order they are dealt, each over the last */
  useEffect(() => {
    const order = prints.map((_, k) => k);
    const dealt: number[] = [], honoursIn = new Set<number>();
    for (const k of order) if (dealt.length < count && !honoursIn.has(prints[k].honour)) { dealt.push(k); honoursIn.add(prints[k].honour); }
    for (const k of order) if (dealt.length < count && !dealt.includes(k)) dealt.push(k);
    deck.current = order.filter(k => !dealt.includes(k));
    openingTour.current = dealt.slice(1);
    seq.current = 0;
    setLaid(dealt.map((k, slot) => ({ k, slot, seq: ++seq.current, dx: 0, dy: 0, dr: 0, first: true })));
    setLeaving([]);
    setLanding(null);
    setCardK(null);
    liftedRef.current = null;
    setLifted(null);
    setSettling(null);
    // dealt again only when the photographs themselves change, not when the same content is refreshed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, count]);

  useEffect(() => () => {
    window.clearTimeout(settleTimer.current);
    leaveTimers.current.forEach(timer => window.clearTimeout(timer));
  }, []);

  /* Each print's place on the pile and its place brought forward: it grows
     around where it lies (so a print pointed at stays under the pointer),
     drawn in from the pile's edges, never past its photograph's own
     resolution by much, and (beside its card) never so wide that the card
     cannot stand beside it. */
  const place = useCallback((entry: Laid) => {
    const print = prints[entry.k], slot = slots[entry.slot];
    const { liftW, liftH, maxLift, cardW } = SHAPES[shape];
    const aspect = stageAspect;
    const ratio = print.width && print.height ? print.width / print.height : 4 / 3;
    /* sized to its place and its proportions, and never, lying there, taller than most of the pile */
    const pw = Math.min(clamp(slot.w * Math.sqrt(ratio / (4 / 3)), slot.w * 0.72, slot.w * 1.3), 78 * ratio / aspect);
    const ph = pw * aspect / ratio;
    const x = clamp(slot.x + entry.dx, pw / 2 + 1, 99 - pw / 2);
    const y = clamp(slot.y + entry.dy, ph / 2 + 2, 98 - ph / 2);
    const beside = shape !== 'narrow';
    const room = beside ? 98 - cardW - CARD_GAP : 98;
    const native = stageWidth ? (print.width * 1.3) / (pw / 100 * stageWidth) : maxLift;
    const ls = Math.max(1.05, Math.min(liftW / pw, liftH / ph, maxLift, native, room / pw));
    const lw = pw * ls, lh = ph * ls;
    /* its card goes on the side with more room, and the print is drawn in from that side to make it */
    const cardRight = x <= 50;
    const lx = !beside ? clamp(x, lw / 2 + 1, 99 - lw / 2)
      : cardRight ? clamp(x, lw / 2 + 1, 99 - cardW - CARD_GAP - lw / 2)
      : clamp(x, 1 + cardW + CARD_GAP + lw / 2, 99 - lw / 2);
    return { ...print, ...entry, x, y, pw, r: slot.r + entry.dr, ls, lw, lx, ly: clamp(y, lh / 2 + 2, 98 - lh / 2), cardRight };
  }, [prints, slots, shape, stageWidth, stageAspect]);

  /* the prints in the order they are drawn: one being taken away just before the one that took its place (so neither
     moves in the page), each lying over every print that came before it */
  const placed = useMemo(() => {
    const order: Array<Laid & { leaving: boolean }> = [];
    for (const entry of laid) {
      for (const gone of leaving) if (gone.slot === entry.slot) order.push({ ...gone, leaving: true });
      order.push({ ...entry, leaving: false });
    }
    const rank = new Map([...order].sort((a, b) => a.seq - b.seq).map((entry, i) => [entry.seq, i + 1]));
    return order.map(entry => ({ ...place(entry), leaving: entry.leaving, z: rank.get(entry.seq)! }));
  }, [laid, leaving, place]);

  const settle = useCallback((k: number) => {
    setSettling(k);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setSettling(null), SETTLE_MS);
  }, []);
  const lift = useCallback((k: number, chosen: boolean) => {
    if (liftedRef.current === k) { if (chosen) chosenRef.current = true; return; }
    chosenRef.current = chosen;
    const previous = liftedRef.current;
    liftedRef.current = k;
    setLifted(k);
    setCardK(k);
    /* the print going back stays above the pile until it has settled into it */
    if (previous !== null) settle(previous);
  }, [settle]);
  const putDown = useCallback(() => {
    const previous = liftedRef.current;
    if (previous === null) return;
    liftedRef.current = null;
    setLifted(null);
    settle(previous);
  }, [settle]);

  /* One print taken away and another dropped in its place: one of the five that have lain there longest (never one
     kept), for the next waiting print of an honour not on the pile. Returns the print dropped in. */
  const turnOver = (keep: number[], viewedK?: number): number | null => {
    if (prints.length <= laid.length) return null;
    const oldest = laid.filter(entry => !keep.includes(entry.k)).sort((a, b) => a.seq - b.seq).slice(0, 5);
    if (!oldest.length) return null;
    const out = viewedK === undefined ? oldest[Math.floor(Math.random() * oldest.length)] : laid.find(entry => entry.k === viewedK);
    if (!out) return null;
    const busy = new Set(laid.map(entry => prints[entry.k].honour));
    const free = (k: number) => !busy.has(prints[k].honour);
    let at = deck.current.findIndex(free);
    if (at < 0) {
      /* every waiting print has had its turn: deal again from all those not on the pile */
      const onPile = new Set(laid.map(entry => entry.k));
      deck.current = shuffled(prints.map((_, k) => k).filter(k => !onPile.has(k)));
      at = deck.current.findIndex(free);
      if (at < 0) at = viewedK === undefined ? (deck.current.length ? 0 : -1) : deck.current.findIndex(k => prints[k].honour !== prints[out.k].honour);
      if (at < 0) return null;
    }
    const [k] = deck.current.splice(at, 1);
    openingTour.current = openingTour.current.filter(k => k !== out.k);
    const slot = slots[out.slot];
    const entry: Laid = { k, slot: out.slot, seq: ++seq.current, dx: (Math.random() - 0.5) * slot.w * 0.16, dy: (Math.random() - 0.5) * 5, dr: (Math.random() - 0.5) * 7, first: false };
    setLaid(list => list.map(e => (e.seq === out.seq ? entry : e)));
    setLeaving(list => [...list, out]);
    const timer = window.setTimeout(() => { leaveTimers.current.delete(timer); setLeaving(list => list.filter(e => e.seq !== out.seq)); }, LEAVE_MS);
    leaveTimers.current.add(timer);
    return k;
  };
  const finishViewing = (k: number) => {
    const seen = viewed.current;
    if (!seen || seen.k !== k) return;
    viewed.current = null;
    // Passing over a print on the way elsewhere does not count as viewing it.
    if (!running || performance.now() - seen.since < 800) return;
    if (turnOver([], k) === null) return;
    if (liftedRef.current === k) { putDown(); setCardK(null); }
    if (landing === k) setLanding(null);
  };
  const top = (): number => laid.reduce((a, b) => (b.k < a.k ? b : a)).k;

  /* by itself: the top print shortly after the prints are down; then, honour by honour, the pile turns over and the
     new print is brought forward. Without motion: the top print is simply forward, and a print is changed now and then. */
  useEffect(() => {
    if (!arrived || !laid.length || !running || held) return;
    if (calm) {
      if (lifted === null) { lift(top(), false); return; }
      if (prints.length <= laid.length) return;
      const timer = window.setTimeout(() => turnOver([lifted]), CALM_TURN_MS);
      return () => window.clearTimeout(timer);
    }
    if (landing !== null) {
      const timer = window.setTimeout(() => { setLanding(null); lift(landing, false); }, LAND_MS);
      return () => window.clearTimeout(timer);
    }
    if (lifted === null) {
      const timer = window.setTimeout(() => lift(top(), false), FIRST_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      putDown();
      const others = laid.filter(entry => entry.k !== lifted);
      const next = openingTour.current.shift();
      setLanding(next !== undefined && laid.some(entry => entry.k === next) ? next
        : turnOver([lifted]) ?? (others.length ? others[Math.floor(Math.random() * others.length)].k : null));
    }, chosenRef.current ? CHOSEN_DWELL_MS : DWELL_MS);
    return () => window.clearTimeout(timer);
    // turnOver and top read the same state as this effect, which it already follows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived, laid, running, held, calm, lifted, landing, prints.length, lift, putDown]);

  const current = lifted !== null ? placed.find(print => print.k === lifted && !print.leaving) ?? null : null;
  const cardPrint = cardK !== null ? placed.find(print => print.k === cardK && !print.leaving) ?? null : null;
  const { cardW } = SHAPES[shape];
  const cardBody = (h: number, photo: number, shown: boolean, key: React.Key) => {
    const { award, photos } = honours[h];
    return (
      <div key={key} id={shown ? cardId : undefined} className="honour-card-body" data-current={shown} aria-hidden={!shown || undefined}>
        <p className="honour-card-meta"><span>{award.year || getCMSCopy('copy.AwardsSection.card-undated', 'Recognition')}</span></p>
        <h3>{award.title}</h3>
        <p className="honour-card-issuer">{award.awardedBy}</p>
        {award.note && <p className="honour-card-note">{award.note}</p>}
        {photos.length > 1 && <p className="honour-card-photo">{getCMSCopy('copy.AwardsSection.card-photograph', 'Photograph')} {photo + 1} / {photos.length}</p>}
      </div>
    );
  };
  /* beside the print forward, level with it and on the side with room; on a phone beneath the pile, every honour's
     card held in the same place (so the page below never moves) and the last one brought forward showing */
  let card: React.ReactNode = null;
  if (shape !== 'narrow') {
    if (cardPrint) card = (
      <aside key={cardPrint.key} className="honour-card" style={{
        '--card-left': cardPrint.cardRight ? cardPrint.lx + cardPrint.lw / 2 + CARD_GAP : cardPrint.lx - cardPrint.lw / 2 - CARD_GAP - cardW,
        '--card-top': cardPrint.ly, '--card-w': cardW,
      } as React.CSSProperties}>
        {cardBody(cardPrint.honour, cardPrint.photo, true, cardPrint.key)}
      </aside>
    );
  } else if (prints.length && laid.length) {
    const shown = prints[cardK ?? top()];
    card = <aside className="honour-card"><div className="honour-card-stack">{honours.map((_, h) => cardBody(h, h === shown.honour ? shown.photo : 0, h === shown.honour, h))}</div></aside>;
  }

  return (
    <div className="honour-pile-wrap" data-shape={shape}>
      <div ref={stage} className="honour-pile" data-arrived={arrived} data-lifting={lifted !== null}
        style={{ '--pile-aspect': SHAPES[shape].aspect, '--drop-step': `${Math.round(clamp(1500 / Math.max(1, count), 22, 70))}ms` } as React.CSSProperties}
        role="group" aria-label={getCMSCopy('copy.AwardsSection.pile-label', 'The honours: choose a photograph to bring it forward, and again to see it in full')}
        onPointerEnter={event => { if (event.pointerType !== 'touch') setHeld(true); }}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false); }}>
        {placed.map(print => {
          const award = honours[print.honour].award;
          const forward = lifted === print.k && !print.leaving;
          return (
            <button key={`${print.key}-${print.seq}`} type="button" className="honour-print" data-honour={print.honour}
              data-lifted={forward} data-settling={settling === print.k && !print.leaving}
              data-leaving={print.leaving || undefined} data-fresh={!print.first || undefined}
              tabIndex={print.leaving ? -1 : undefined} aria-hidden={print.leaving || undefined}
              style={{ '--x': print.x, '--y': print.y, '--pw': print.pw, '--r': `${print.r}deg`, '--lx': print.lx, '--ly': print.ly, '--ls': print.ls, '--z': print.z, '--i': print.first ? print.seq - 1 : 0 } as React.CSSProperties}
              aria-label={`${award.title}${award.year ? `, ${award.year}` : ''}`} aria-describedby={forward ? cardId : undefined}
              onPointerEnter={event => { if (event.pointerType !== 'touch' && !print.leaving) { viewed.current = { k: print.k, since: performance.now() }; lift(print.k, true); } }}
              onPointerLeave={event => { if (event.pointerType !== 'touch' && !event.currentTarget.matches(':focus')) finishViewing(print.k); }}
              /* by keyboard only: a tap focuses the print too, and the tap itself decides (forward first, then open) */
              onFocus={event => { if (event.currentTarget.matches(':focus-visible')) { viewed.current = { k: print.k, since: performance.now() }; lift(print.k, true); } }}
              onBlur={() => finishViewing(print.k)}
              onClick={() => { viewed.current = null; if (liftedRef.current === print.k) onOpen(print.honour, print.photo); else lift(print.k, true); }}>
              <img src={resolveCMSMedia(print.src)} alt="" width={print.width} height={print.height} loading="lazy" decoding="async" draggable={false} />
              <span className="honour-print-open" aria-hidden="true"><Maximize2 size={13} /></span>
            </button>
          );
        })}
        {shape !== 'narrow' && card}
      </div>
      {shape === 'narrow' && card}
      <p className="sr-only" role="status">{held && current ? honours[current.honour].award.title : ''}</p>
      {/* the pile shows some honours at a time; a screen reader has them all */}
      <ul className="sr-only" aria-label={getCMSCopy('copy.AwardsSection.all-honours', 'Every honour')}>
        {honours.map(({ key, award }) => (
          <li key={key}>{award.title}{award.year ? `, ${award.year}` : ''}. {award.awardedBy}.{award.note ? ` ${award.note}` : ''}</li>
        ))}
      </ul>
    </div>
  );
};
