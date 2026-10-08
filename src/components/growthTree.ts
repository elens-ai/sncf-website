/* THE GROWING TREE — the Who We Are page's history (RoadTree.tsx), grown and
   drawn on a canvas.

   buildTree() grows the whole tree once from its events: an upright tree, its
   trunk rising through the years from a seed in the foundation's first year
   to today. Every event is a branch from the trunk at its year, the sides
   taking turns, so a year of several events grows several, out to either
   side; its photograph rides out at the branch's tip as it grows. Each limb
   reaches out to the edge of the crown, the older ones low and the newer
   higher, so the photographs ring a broad crown: wider than it is tall,
   widest high up, its top a broad dome. An event's limb shoots out and then
   grows on for years, as a limb does. The tree's own growth, between the
   events, fills the crown, and it widens as the tree ages. The sapling
   carries leaves up its young stem, which drop as the trunk clears.
   Every part knows when it begins and how long it takes to grow, so the tree
   can be drawn as it stood at any moment.

   TreePainter draws it at a time T (a fractional year). Foliage is masses of
   small leaves lit from the upper left: a few masses are painted once and
   every clump is one of them, turned, flipped and scaled. Parts that have
   finished growing are kept on two cached layers (behind the trunk: the
   shaded foliage and the branches; in front: the middle and sunlit foliage),
   so a frame draws only what is still growing, the trunk, and the caches. */

export interface TreeEvent { id: string; year: number }
export interface Pt { x: number; y: number; a: number }
interface Branch { pts: Pt[]; width: number; birth: number; dur: number; depth: number; settle: number }
interface Clump { x: number; y: number; size: number; rot: number; flip: number; variant: number; shade: number; birth: number; layer: number; settle: number; fall?: number }
/** An event's photograph: carried out at its branch's tip as the branch grows (or, the first year's, at the seed). */
export interface Medal { id: string; year: number; seed?: boolean; pts: Pt[]; birth: number; dur: number; dx: number; dy: number }
export interface YearMark { year: number; x: number; y: number; birth: number; seed?: boolean }

export interface Tree {
  W: number; H: number; k: number; groundY: number; base: [number, number]; spine: Pt[];
  startYear: number; endYear: number; settle: number; trunkMax: number; reach: number;
  branches: Branch[]; clumps: Clump[]; medals: Medal[]; marks: YearMark[];
  sOf: (T: number) => number; tOf: (s: number) => number;
  /** the radius of an event's photograph, in the tree's own units */
  medalR: number;
}

export const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const TAU = Math.PI * 2;

/* a smooth curve through the points (Catmull-Rom), resampled evenly by arc length, each point with its heading */
function spline(points: [number, number][], samples: number): Pt[] {
  const raw: [number, number][] = [];
  const p = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < 24; s++) {
      const t = s / 24, t2 = t * t, t3 = t2 * t;
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      const f = (j: 0 | 1) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      raw.push([f(0), f(1)]);
    }
  }
  raw.push(points[points.length - 1]);
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const total = cum[cum.length - 1];
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i <= samples; i++) {
    const d = (i / samples) * total;
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const f = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    out.push({ x: lerp(raw[j][0], raw[j + 1][0], f), y: lerp(raw[j][1], raw[j + 1][1], f), a: 0 });
  }
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
    out[i].a = Math.atan2(b.y - a.y, b.x - a.x);
  }
  return out;
}

/* a branch's path: out at its angle, bending towards the light as it goes, with a little wander */
function bend(x: number, y: number, angle: number, length: number, pull: (a: number) => number, wander: number, random: () => number, segments: number): Pt[] {
  const pts: Pt[] = [{ x, y, a: angle }];
  let a = angle;
  const step = length / segments;
  for (let i = 1; i <= segments; i++) {
    a += pull(a) / segments + (random() - 0.5) * wander;
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    pts.push({ x, y, a });
  }
  return pts;
}

/* how far a limb has grown at a share x of its growing time: an event's limb (depth 0) shoots out and then slows,
   growing on for years as a limb does; the others ease in and out */
const EASE = 2.2;
const grown = (depth: number, x: number) => (depth === 0 ? 1 - Math.pow(1 - clamp(x, 0, 1), EASE) : smooth(x));
/* the share of its growing time at which a limb's tip passes a share t of its length */
const passes = (depth: number, t: number) => (depth === 0 ? 1 - Math.pow(1 - t, 1 / EASE) : smooth(t));

/** Where an event's limb has reached at time T, and how far grown it is (0 to 1). */
export function tipAt(pts: Pt[], birth: number, dur: number, T: number) {
  const g = grown(0, (T - birth) / dur);
  const i = g * (pts.length - 1), i0 = Math.floor(i), i1 = Math.min(pts.length - 1, i0 + 1), f = i - i0;
  return { x: lerp(pts[i0].x, pts[i1].x, f), y: lerp(pts[i0].y, pts[i1].y, f), g };
}

/** The whole tree, from its events. */
export function buildTree({ width: W, height: H, events, startYear, endYear, seed = 11 }: {
  width: number; height: number; events: TreeEvent[]; startYear: number; endYear: number; seed?: number;
}): Tree {
  const random = rng(seed);
  const k = clamp(Math.min(W / 440, H / 620), 0.6, 1.3);             // the drawing's scale
  const settle = endYear + 2.2;
  /* THE YEARS up the trunk: a year with events gets room, a year without them a little */
  const byYear = new Map<number, TreeEvent[]>();
  for (const e of events) byYear.set(e.year, [...(byYear.get(e.year) ?? []), e]);
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  const weight = (y: number) => (byYear.has(y) ? 1 + 0.35 * (byYear.get(y)!.length - 1) : 0.45) * (y === startYear ? 0.7 : 1);
  const total = years.reduce((sum, y) => sum + weight(y), 0);
  const span = new Map<number, [number, number]>();
  let acc = 0;
  for (const y of years) { span.set(y, [acc / total, (acc + weight(y)) / total]); acc += weight(y); }
  const sOf = (T: number) => {
    if (T <= startYear) return 0;
    if (T >= endYear + 1) return 1;
    const y = Math.floor(T), [a, b] = span.get(y)!;
    return lerp(a, b, T - y);
  };
  const tOf = (s: number) => {
    for (const y of years) { const [a, b] = span.get(y)!; if (s <= b) return y + (s - a) / Math.max(1e-6, b - a); }
    return endYear + 1;
  };
  const cap = (birth: number, dur: number) => Math.min(birth, settle - dur - 0.15);

  /* THE TRUNK, rising up the middle with a gentle sway into the crown: a broad one, wider than it is tall, widest
     high up and rounding over a broad top */
  const groundY = H * 0.955;
  const cx = W / 2;
  const reach = Math.min(W * 0.47, 340 * k);                           // how far the crown spreads either side
  const height = Math.min(groundY - H * 0.07, reach * 2.25);           // the grown tree, its foot to its crown's top
  const crownTop = groundY - height, crownFoot = groundY - height * 0.36;
  const topY = crownTop + height * 0.2;                                 // the trunk's leader ends inside the crown
  /* the crown's half-width (of its reach) at a height through it, 0 its foot and 1 its top */
  const spread = (u: number) => (u < 0.58 ? 0.6 + 0.4 * Math.sin((clamp(u, 0, 1) / 0.58) * Math.PI / 2) : Math.sqrt(Math.max(0, 1 - ((u - 0.58) / 0.42) ** 2.6)));
  const crownY = (u: number) => lerp(crownFoot, crownTop, u);
  const sway = () => (random() - 0.5) * 12 * k;
  const spine = spline([[cx, groundY], [cx + sway(), lerp(groundY, topY, 0.25)], [cx + sway(), lerp(groundY, topY, 0.5)], [cx + sway() * 0.7, lerp(groundY, topY, 0.76)], [cx, topY]], 380);
  const at = (s: number): Pt => { const i = clamp(s, 0, 1) * (spine.length - 1); const i0 = Math.floor(i), i1 = Math.min(spine.length - 1, i0 + 1); const f = i - i0; return { x: lerp(spine[i0].x, spine[i1].x, f), y: lerp(spine[i0].y, spine[i1].y, f), a: spine[i0].a }; };
  /* how far up the trunk a height is (the trunk only rises) */
  const sAtY = (y: number) => clamp((groundY - y) / (groundY - topY), 0, 1);
  const clear = 0.2;                                                    // the trunk's lowest fifth stays clear
  const trunkMax = 42 * k;

  const branches: Branch[] = [];
  const clumps: Clump[] = [];
  const medals: Medal[] = [];
  const marks: YearMark[] = [];
  const sky = -Math.PI / 2;

  const clump = (x: number, y: number, size: number, birth: number, layer: number, shade: number) => {
    const b = Math.min(settle - 0.75, birth + random() * 0.25);
    clumps.push({ x, y, size, rot: (random() - 0.5) * 0.6, flip: random() < 0.5 ? -1 : 1, variant: Math.floor(random() * 4), shade, birth: b, layer, settle: b + (shade > 0 ? 1.25 : 0.65) });
  };
  /* foliage about a point: a shaded mass behind, then middle and sunlit clumps, the sunlit ones higher */
  const leafy = (x: number, y: number, size: number, birth: number, count = 3) => {
    clump(x + size * 0.1, y + size * 0.2, size * 1.1, birth, 0, 0);
    for (let i = 0; i < count; i++) {
      const th = random() * TAU, d = Math.sqrt(random()) * size * 0.5;
      const px = x + Math.cos(th) * d, py = y + Math.sin(th) * d * 0.7;
      const up = py < y - size * 0.05;
      clump(px, py, size * (0.55 + random() * 0.35), birth + 0.06 * i, up ? 2 : 1, up ? 2 : 1);
    }
  };

  /* a branch and its limbs and twigs, recursively, with foliage at the twigs' ends; a long limb takes years to grow */
  const grow = (x: number, y: number, angle: number, length: number, width: number, birth: number, depth: number, maxDepth: number, dur: number, path?: Pt[]): Branch => {
    const pts = path ?? bend(x, y, angle, length, a => (sky - a) * (depth === 0 ? 0.42 : 0.3), depth === 0 ? 0.05 : 0.11, random, depth === 0 ? 20 : depth === 1 ? 12 : 8);
    birth = cap(birth, dur + 0.5);
    const branch: Branch = { pts, width, birth, dur, depth, settle: birth + Math.max(dur + 0.8, 2) };
    branches.push(branch);
    const kids = depth < maxDepth ? (depth === 0 ? 3 + Math.floor(random() * 2) : 2 + Math.floor(random() * 2)) : 0;
    for (let i = 0; i < kids; i++) {
      const t = 0.3 + (i / kids) * 0.55 + random() * 0.1;
      const p = pts[Math.round(t * (pts.length - 1))];
      const turn = (i % 2 ? 1 : -1) * (0.38 + random() * 0.45);
      const len = length * (0.42 + random() * 0.2) * (1 - t * 0.3);
      grow(p.x, p.y, p.a + turn, len, Math.max(0.9 * k, width * (1 - t) * 0.6), birth + passes(depth, t) * dur + 0.04, depth + 1, maxDepth, depth === 0 ? 0.6 + 0.8 * (len / reach) : 0.42);
    }
    const end = pts[pts.length - 1];
    if (depth >= 1) leafy(end.x, end.y, (depth === 1 ? 31 : 25) * k * (0.8 + random() * 0.35), birth + dur * 0.7, depth === 1 ? 3 : 2);
    return branch;
  };

  /* a limb's path aimed to end at a point: bent towards the light as any limb is, its heading set so that it arrives */
  const aim = (x: number, y: number, tx: number, ty: number, segments: number) => {
    const seed = Math.floor(random() * 1e9);
    const want = Math.atan2(ty - y, tx - x), far = Math.hypot(tx - x, ty - y);
    let angle = want, length = far;
    const path = () => bend(x, y, angle, length, a => (sky - a) * 0.3, 0.035, rng(seed), segments);
    for (let i = 0; i < 4; i++) {
      const end = path()[segments];
      let turn = want - Math.atan2(end.y - y, end.x - x);
      turn -= TAU * Math.round(turn / TAU);
      angle += turn;
      length *= far / Math.max(1, Math.hypot(end.x - x, end.y - y));
    }
    return path();
  };

  /* THE EVENTS: the first year's at the seed's foot; every later one a limb from the trunk at its year, the sides
     taking turns, out to the crown's edge, each side's spaced along it from the foot of the crown (the oldest) up
     over its top (the newest), so the photographs ring the crown */
  const medalR = 26 * k + 4;
  const edge: Pt[] = [];
  for (let i = 0; i <= 60; i++) edge.push({ x: reach * 0.95 * spread(i / 60) * 0.84, y: crownY(i / 60), a: 0 });
  const along = [0];
  for (let i = 1; i < edge.length; i++) along.push(along[i - 1] + Math.hypot(edge[i].x - edge[i - 1].x, edge[i].y - edge[i - 1].y));
  const edgeAt = (f: number) => {
    const d = f * along[along.length - 1];
    let i = 1;
    while (i < along.length - 1 && along[i] < d) i++;
    const t = (d - along[i - 1]) / Math.max(1e-6, along[i] - along[i - 1]);
    return { x: lerp(edge[i - 1].x, edge[i].x, t), y: lerp(edge[i - 1].y, edge[i].y, t) };
  };
  const later = events.filter(e => e.year !== startYear).length;
  const perSide = [Math.ceil(later / 2), Math.floor(later / 2)];
  const placed = [0, 0];
  let side = 1;
  for (const [year, list] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const [a, b] = span.get(year)!;
    list.forEach((event, i) => {
      if (year === startYear) {
        medals.push({ id: event.id, year, seed: true, pts: [{ x: cx + 92 * k + i * (2 * medalR + 8 * k), y: groundY - medalR - 3 * k, a: 0 }], birth: startYear, dur: 0.3, dx: 0, dy: 0 });
        return;
      }
      side = -side;
      const which = side < 0 ? 0 : 1;
      const target = edgeAt(perSide[which] > 1 ? lerp(0.03, 0.8, placed[which] / (perSide[which] - 1)) : 0.4);
      placed[which]++;
      const s = Math.max(clear * 0.9, lerp(a, b, (i + 0.65) / (list.length + 0.3)));
      const p = at(s);
      const tx = cx + side * target.x, ty = target.y;
      const length = Math.hypot(tx - p.x, ty - p.y);
      const birth = tOf(s) + 0.04;
      const dur = clamp(2.4 + 2.6 * (length / reach), 1.2, Math.max(1.2, settle - 0.7 - birth));
      const branch = grow(p.x, p.y, 0, length, Math.min(trunkMax * 0.36, 15 * k), birth, 0, 2, dur, aim(p.x, p.y, tx, ty, 20));
      medals.push({ id: event.id, year, pts: branch.pts, birth: branch.birth, dur: branch.dur, dx: 0, dy: 0 });
    });
    if (year !== startYear) { const p = at(lerp(a, b, 0.5)); marks.push({ year, x: p.x, y: p.y, birth: year + 0.05 }); }
  }
  marks.unshift({ year: startYear, x: cx, y: groundY, birth: startYear, seed: true });

  /* THE TREE'S OWN GROWTH: limbs up the trunk on either side between the events, each out to a point within the
     crown at about its height, so they fill its broad shape */
  for (let s = 0.34; s < 0.99; s += 0.021 * (0.7 + random() * 0.6)) {
    const p = at(s);
    const sideOf = random() < 0.5 ? -1 : 1;
    const u = clamp(lerp(-0.02, 1.02, (s - 0.34) / 0.66) + (random() - 0.5) * 0.16, 0, 0.96);
    const tx = cx + sideOf * reach * 0.95 * spread(u) * (0.35 + random() * 0.55), ty = crownY(u) + (random() - 0.5) * 18 * k;
    const len = Math.hypot(tx - p.x, ty - p.y) * 0.95;
    grow(p.x, p.y, Math.atan2(ty - p.y, tx - p.x), len, 5.4 * k * lerp(1.25, 0.8, s), tOf(s) + 0.3 + random() * 0.4, 1, 2, 0.7 + 1.3 * (len / reach));
  }
  /* the leader's own limbs, spreading over the crown's top */
  for (let i = 0; i < 6; i++) {
    const s = 0.88 + i * 0.022, p = at(s);
    const u = 0.8 + random() * 0.14, sideOf = i % 2 ? 1 : -1;
    const tx = cx + sideOf * reach * 0.95 * spread(u) * (0.25 + random() * 0.6), ty = crownY(u);
    grow(p.x, p.y, Math.atan2(ty - p.y, tx - p.x), Math.hypot(tx - p.x, ty - p.y) * 0.95, 4.2 * k, tOf(s) + 0.3, 1, 2, 0.9);
  }

  /* THE CROWN'S FILL: rows of foliage across a broad dome, holes left where the light comes through, its middle
     appearing as the trunk passes and its edges later, so the crown widens as the tree ages */
  const rows = Math.max(6, Math.round((crownFoot - crownTop) / (15 * k)));
  const p1 = random() * TAU, p2 = random() * TAU, p3 = random() * TAU;
  const hole = (x: number, y: number) => Math.sin(x * 0.024 / k + p1) * 0.5 + Math.sin(y * 0.03 / k + p2) * 0.35 + Math.sin((x + y) * 0.015 / k + p3) * 0.3;
  for (let r = 0; r <= rows; r++) {
    const u = r / rows;                                                 // the crown's foot (0) to its top (1)
    const y = crownY(u);
    const hw = reach * 0.95 * spread(u);
    const n = Math.max(1, Math.round((2 * hw) / (25 * k)));
    const t0 = y < topY ? lerp(endYear - 0.8, endYear + 0.5, (topY - y) / Math.max(1, topY - crownTop)) : tOf(sAtY(y));
    for (let i = 0; i < n; i++) {
      const x = cx + (n === 1 ? 0 : lerp(-hw, hw, (i + 0.5 + (random() - 0.5) * 0.7) / n));
      const yy = y + (random() - 0.5) * 12 * k;
      if (u < 0.66 && Math.abs(x - cx) < hw * 0.8 && hole(x, yy) < -0.46) continue;
      const out = Math.abs(x - cx) / reach;
      const birth = t0 + 0.35 + out * Math.max(0.6, settle - 1.2 - t0) * 0.6 + random() * 0.3;
      /* lit from the upper left: the top and the left edge in the sun, the underside and the heart in shade */
      const ux = (x - cx) / Math.max(1, hw), light = u * 0.6 - ux * 0.35 + (random() - 0.5) * 0.3;
      const heart = Math.abs(ux) < 0.45 && u < 0.55;
      const shade = light > 0.42 ? 2 : light < 0.02 || heart ? 0 : 1;
      clump(x, yy, (24 + random() * 14) * k, birth, shade === 0 ? 0 : shade === 2 ? 2 : 1, shade);
    }
  }

  /* THE SAPLING'S LEAVES: small leaves up its young stem, which drop again as the tree matures and its trunk clears
     (a tree sheds its lowest branches as it grows); drawn live, never cached */
  for (let s = 0.03; s < clear + 0.08; s += 0.022 + random() * 0.01) {
    const p = at(s);
    for (const sideOf of [-1, 1]) {
      if (random() < 0.25) continue;
      const birth = tOf(s) + 0.1 + random() * 0.1;
      const fall = birth + 2.2 + random() * 1.1 + (s / clear) * 1.2;
      clumps.push({ x: p.x + sideOf * (4 + random() * 5) * k, y: p.y - (1 + random() * 3) * k, size: (8 + random() * 5) * k, rot: sideOf * 0.6 + (random() - 0.5) * 0.5, flip: sideOf, variant: Math.floor(random() * 4), shade: random() < 0.5 ? 2 : 1, birth, layer: 1, settle: Infinity, fall });
    }
  }

  /* the photographs, kept apart where their branches end */
  const gap = medalR * 2 + 8 * k;
  const final = medals.map(m => ({ x: m.pts[m.pts.length - 1].x, y: m.pts[m.pts.length - 1].y }));
  for (let pass = 0; pass < 30; pass++) {
    for (let i = 0; i < medals.length; i++) for (let j = i + 1; j < medals.length; j++) {
      const a = final[i], b = final[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d >= gap) continue;
      const push = (gap - d) / 2, ux = dx / d, uy = dy / d;
      if (!medals[i].seed) { a.x -= ux * push; a.y -= uy * push; }
      if (!medals[j].seed) { b.x += ux * push; b.y += uy * push; }
    }
    for (const f of final) { f.x = clamp(f.x, medalR + 6, W - medalR - 6); f.y = clamp(f.y, medalR + 6, groundY - medalR - 4); }
  }
  medals.forEach((m, i) => { const end = m.pts[m.pts.length - 1]; m.dx = final[i].x - end.x; m.dy = final[i].y - end.y; });

  /* draw order: slimmest first, so each joint is covered by the branch it grows from */
  branches.sort((a, b) => b.depth - a.depth);
  return { W, H, k, groundY, base: [cx, groundY], spine, startYear, endYear, settle, trunkMax, reach, branches, clumps, medals, marks, sOf, tOf, medalR };
}

/** When an event's photograph comes out: the seed's at once, a branch's once it is a fifth of the way out. */
export const medalOut = (m: Medal) => (m.seed ? m.birth : m.birth + m.dur * (1 - Math.pow(0.8, 1 / EASE)));

/** Where an event's photograph is at time T, how large (0.55 to 1) and whether it is out yet. */
export function medalAt(m: Medal, T: number) {
  if (m.seed) { const p = m.pts[0]; return { x: p.x, y: p.y, scale: 1, shown: T >= m.birth, g: 1 }; }
  const tip = tipAt(m.pts, m.birth, m.dur, T);
  return { x: tip.x + m.dx * tip.g, y: tip.y + m.dy * tip.g, scale: 0.55 + 0.45 * tip.g, shown: T >= medalOut(m), g: tip.g };
}

/** Every photograph at time T, kept apart as they ride out (the grown tree's are apart already): where two that are out
    meet, the newer gives way the more, and one just out only gradually, so none jumps; the seed's stays put. */
export function medalsAt(tree: Tree, T: number) {
  const out = tree.medals.map(m => medalAt(m, T));
  const there = out.map(p => (p.shown ? clamp((p.g - 0.2) / 0.15, 0, 1) : 0));
  const gap = 8 * tree.k;
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j], w = Math.min(there[i], there[j]);
      if (w <= 0) continue;
      const need = (tree.medalR * (a.scale + b.scale) + gap) * w;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d >= need) continue;
      const wa = tree.medals[i].seed ? 0 : 0.3, wb = tree.medals[j].seed ? 0 : 0.7, push = (need - d) / (wa + wb || 1);
      a.x -= (dx / d) * push * wa; a.y -= (dy / d) * push * wa;
      b.x += (dx / d) * push * wb; b.y += (dy / d) * push * wb;
    }
    /* and clear of the years on the trunk, from the moment it is out (they never move, so none jumps for it) */
    for (let i = 0; i < out.length; i++) {
      if (!out[i].shown || tree.medals[i].seed) continue;
      const p = out[i];
      for (const mark of tree.marks) {
        if (mark.seed || T < mark.birth) continue;
        const need = tree.medalR * p.scale + 25;                        // a chip is a fixed size: about 44 by 18
        const dx = p.x - mark.x, dy = p.y - mark.y, d = Math.hypot(dx, dy) || 1;
        if (d < need) { p.x += (dx / d) * (need - d); p.y += (dy / d) * (need - d); }
      }
    }
  }
  for (const p of out) { const r = tree.medalR * p.scale + 4; p.x = clamp(p.x, r, tree.W - r); p.y = clamp(p.y, r, tree.groundY - r); }
  return out;
}

/* ------------------------------------------------------------------ foliage */
export interface Foliage { sprites: { canvas: HTMLCanvasElement; R: number }[][]; R: number }
/** The leaf masses: shadow, middle, sunlit and new growth, four shapes each. A mass is an irregular group of lobes, a
    soft core of its own shade with small pointed leaves over it, back to front, lighter towards the upper left. */
export function makeFoliage(resolution: number): Foliage {
  const R = 70;
  const shades = [
    { h: [112, 124], s: [22, 30], l: [12, 21] },
    { h: [100, 114], s: [28, 38], l: [20, 30] },
    { h: [86, 100], s: [34, 46], l: [28, 42] },
    { h: [74, 88], s: [46, 58], l: [38, 52] },
  ];
  const sprites = shades.map((shade, si) => [0, 1, 2, 3].map(variant => {
    const random = rng(4100 + si * 31 + variant * 7);
    const size = Math.ceil(2 * R * resolution);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const c = canvas.getContext('2d')!;
    c.scale(resolution, resolution);
    c.translate(R, R);
    const lobes: { x: number; y: number; r: number }[] = [];
    const n = 4 + Math.floor(random() * 4);
    for (let i = 0; i < n; i++) {
      const th = random() * TAU, d = Math.sqrt(random()) * R * 0.44;
      lobes.push({ x: Math.cos(th) * d, y: Math.sin(th) * d * 0.72, r: R * (0.24 + random() * 0.2) });
    }
    const inside = (x: number, y: number) => lobes.some(l => (x - l.x) ** 2 + ((y - l.y) * 1.1) ** 2 < l.r * l.r);
    for (const l of lobes) {
      const g = c.createRadialGradient(l.x - l.r * 0.3, l.y - l.r * 0.35, l.r * 0.1, l.x, l.y, l.r * 0.85);
      g.addColorStop(0, `hsl(${shade.h[0] - 2}, ${shade.s[1]}%, ${shade.l[0] + 3}%)`);
      g.addColorStop(1, `hsla(${shade.h[1]}, ${shade.s[0]}%, ${Math.max(7, shade.l[0] - 6)}%, 0.96)`);
      c.fillStyle = g; c.beginPath(); c.ellipse(l.x, l.y, l.r * 0.8, l.r * 0.72, 0, 0, TAU); c.fill();
    }
    const leaves: { x: number; y: number; depth: number }[] = [];
    for (let tries = 0; leaves.length < 700 && tries < 9000; tries++) {
      const x = (random() * 2 - 1) * R, y = (random() * 2 - 1) * R;
      if (inside(x, y)) leaves.push({ x, y, depth: random() });
    }
    leaves.sort((a, b) => a.depth - b.depth);
    for (const leaf of leaves) {
      const toLight = clamp(0.55 - (leaf.y * 0.85 + leaf.x * 0.4) / (R * 1.25), 0, 1);
      const lit = clamp(toLight * 0.7 + leaf.depth * 0.4 + (random() - 0.5) * 0.22, 0, 1);
      c.fillStyle = `hsl(${lerp(shade.h[1], shade.h[0], lit)}, ${lerp(shade.s[0], shade.s[1], lit)}%, ${lerp(shade.l[0], shade.l[1], lit)}%)`;
      const len = 3.8 + random() * 3, wid = 1.4 + random() * 0.9;
      const a = Math.atan2(leaf.y, leaf.x) + (random() - 0.5) * 2.4;
      c.save(); c.translate(leaf.x, leaf.y); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -wid * 1.4, len, 0); c.quadraticCurveTo(len * 0.45, wid * 1.4, 0, 0); c.fill();
      c.restore();
    }
    return { canvas, R };
  }));
  return { sprites, R };
}

/* ----------------------------------------------------------------- drawing */
const BARK = [94, 71, 54], BARK_TIP = [116, 92, 68];
const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(lerp(v, b[i], t)));

/* a tapered limb as a filled outline: lit along the edge facing the upper left, shaded along the other; furrowed where thick */
function limb(ctx: CanvasRenderingContext2D, pts: Pt[], widthAt: (t: number) => number, n: number, color: number[], furrows = 0, seed = 1) {
  if (n < 2) return;
  const L: [number, number][] = [], Rt: [number, number][] = [], Wd: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], w = widthAt(i / (n - 1)) / 2;
    const nx = -Math.sin(p.a), ny = Math.cos(p.a);
    L.push([p.x + nx * w, p.y + ny * w]); Rt.push([p.x - nx * w, p.y - ny * w]); Wd.push(w);
  }
  const outline = new Path2D();
  outline.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) outline.lineTo(L[i][0], L[i][1]);
  const end = pts[n - 1];
  outline.arc(end.x, end.y, Wd[n - 1], end.a + Math.PI / 2, end.a - Math.PI / 2, true);
  for (let i = n - 1; i >= 0; i--) outline.lineTo(Rt[i][0], Rt[i][1]);
  outline.closePath();
  ctx.fillStyle = rgb(color); ctx.fill(outline);
  const band = (sign: number, from: number, to: number, style: string) => {
    const path = new Path2D();
    for (let i = 0; i < n; i++) {
      const p = pts[i], nx = -Math.sin(p.a) * sign, ny = Math.cos(p.a) * sign, w = Wd[i];
      const x = p.x + nx * w * from, y = p.y + ny * w * from;
      if (i) path.lineTo(x, y); else path.moveTo(x, y);
    }
    for (let i = n - 1; i >= 0; i--) {
      const p = pts[i], nx = -Math.sin(p.a) * sign, ny = Math.cos(p.a) * sign, w = Wd[i];
      path.lineTo(p.x + nx * w * to, p.y + ny * w * to);
    }
    path.closePath(); ctx.fillStyle = style; ctx.fill(path);
  };
  const mid = pts[Math.floor(n / 2)];
  const facing = (sign: number) => (-Math.sin(mid.a) * sign) * -0.5 + (Math.cos(mid.a) * sign) * -0.86;
  const lit = facing(1) > facing(-1) ? 1 : -1;
  band(lit, 0.1, 0.95, 'rgba(222, 192, 156, 0.28)');
  band(lit, 0.5, 0.88, 'rgba(240, 216, 186, 0.2)');
  band(-lit, 0.2, 1.0, 'rgba(28, 17, 9, 0.42)');
  if (furrows) {
    ctx.save(); ctx.clip(outline);
    const random = rng(seed);
    ctx.lineCap = 'round';
    for (let f = 0; f < furrows; f++) {
      const off = (random() * 2 - 1) * 0.86;
      ctx.strokeStyle = `rgba(30, 18, 10, ${0.18 + random() * 0.22})`; ctx.lineWidth = 0.7 + random() * 1.2;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i += 3) {
        if (random() < 0.07) { started = false; continue; }
        const p = pts[i], nx = -Math.sin(p.a), ny = Math.cos(p.a), w = Wd[i];
        const x = p.x + nx * w * off + (random() - 0.5) * 0.9, y = p.y + ny * w * off + (random() - 0.5) * 0.9;
        if (started) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        started = true;
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Draws a tree as it stood at any time, keeping what has finished growing on two cached layers: behind the trunk
    (the shaded foliage, then the branches), and in front of it (the middle and sunlit foliage). */
export class TreePainter {
  private layers: HTMLCanvasElement[] = [];
  private cachedTo = -Infinity;
  constructor(private tree: Tree, private foliage: Foliage, private dpr: number) {
    for (let i = 0; i < 2; i++) {
      const c = document.createElement('canvas');
      c.width = Math.round(tree.W * dpr); c.height = Math.round(tree.H * dpr);
      this.layers.push(c);
    }
  }

  private clumpAt(ctx: CanvasRenderingContext2D, c: Clump, T: number) {
    const g = smooth((T - c.birth) / 0.6);
    if (g < 0.02) return;
    /* a sapling's leaf, falling as the tree matures */
    const kept = c.fall === undefined ? 1 : 1 - smooth((T - c.fall) / 0.6);
    if (kept <= 0.01) return;
    const { dpr, foliage } = this;
    const scale = (c.size / foliage.R) * (0.4 + 0.6 * g);
    const cos = Math.cos(c.rot) * scale, sin = Math.sin(c.rot) * scale;
    ctx.setTransform(dpr * cos * c.flip, dpr * sin * c.flip, -dpr * sin, dpr * cos, dpr * c.x, dpr * c.y);
    const sprite = foliage.sprites[c.shade][c.variant];
    const R = sprite.R;
    ctx.globalAlpha = Math.min(1, g * 4) * kept;
    ctx.drawImage(sprite.canvas, -R, -R, 2 * R, 2 * R);
    /* new growth is a fresher green, darkening over its first year */
    const youth = c.shade > 0 ? 1 - smooth((T - c.birth - 0.4) / 0.8) : 0;
    if (youth > 0.02) { ctx.globalAlpha = Math.min(1, g * 4) * youth * 0.85 * kept; ctx.drawImage(foliage.sprites[3][c.variant].canvas, -R, -R, 2 * R, 2 * R); }
    ctx.globalAlpha = 1;
  }

  private branchAt(ctx: CanvasRenderingContext2D, b: Branch, T: number) {
    const { tree, dpr } = this;
    const k = tree.k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = grown(b.depth, (T - b.birth) / b.dur);
    const n = Math.max(2, Math.round(g * (b.pts.length - 1)) + 1);
    /* a limb thickens as it lengthens, and on for a while after */
    const thick = 0.4 + 0.6 * smooth((T - b.birth) / (b.dur + 0.8));
    const w0 = b.width * thick;
    limb(ctx, b.pts, t => Math.max(0.75 * k, w0 * Math.pow(1 - t * 0.88, 1.15) * (0.6 + 0.4 * g)), n, mix(BARK, BARK_TIP, b.depth / 2), b.depth === 0 && w0 > 9 * k ? 3 : 0, b.pts.length);
  }

  /* The caches hold every part settled by the time they are kept to, with some slack either way so they are seldom
     redrawn: going on, they are added to once the tree is a year past them (up to a quarter of a year before it);
     going back past them, they are rebuilt to two years earlier. What has settled since is drawn live meanwhile. */
  private cache(T: number) {
    const [behind, front] = this.layers.map(c => c.getContext('2d')!);
    let from: number, to: number;
    if (T < this.cachedTo) {
      from = -Infinity; to = Math.max(this.tree.startYear - 1, T - 2);
      for (const c of [behind, front]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); }
    } else if (T >= this.cachedTo + 1) {
      from = this.cachedTo; to = T - 0.25;
    } else return;
    for (const c of this.tree.clumps) if (c.layer === 0 && c.settle > from && c.settle <= to) this.clumpAt(behind, c, Infinity);
    for (const b of this.tree.branches) if (b.settle > from && b.settle <= to) this.branchAt(behind, b, Infinity);
    for (const layer of [1, 2]) for (const c of this.tree.clumps) if (c.layer === layer && c.settle > from && c.settle <= to) this.clumpAt(front, c, Infinity);
    this.cachedTo = to;
  }

  draw(ctx: CanvasRenderingContext2D, T: number) {
    const { tree, dpr, foliage } = this;
    const { W, k, groundY, base, spine, sOf, startYear, endYear } = tree;
    this.cache(T);
    const settled = this.cachedTo;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const age = clamp((T - startYear) / (endYear + 1 - startYear), 0, 1);
    const sT = sOf(T);
    const nT = Math.max(2, Math.round(sT * (spine.length - 1)) + 1);
    const tipNow = spine[nT - 1];

    /* the ground: a soft shadow under the crown, and a faint soil line */
    const reach = tree.reach * smooth(age * 1.6) + 20 * k;
    ctx.save(); ctx.translate(base[0], groundY + 2 * k); ctx.scale(1, 0.07);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, reach * 1.15);
    shadow.addColorStop(0, `rgba(52, 64, 34, ${0.24 * smooth(age * 2.5)})`); shadow.addColorStop(1, 'rgba(52, 64, 34, 0)');
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(0, 0, reach * 1.15, 0, TAU); ctx.fill(); ctx.restore();
    const left = Math.max(0, base[0] - tree.reach * 1.3), right = Math.min(W, base[0] + tree.reach * 1.3);
    const soil = ctx.createLinearGradient(left, 0, right, 0);
    soil.addColorStop(0, 'rgba(120, 98, 70, 0)'); soil.addColorStop(0.5, 'rgba(120, 98, 70, 0.34)'); soil.addColorStop(1, 'rgba(120, 98, 70, 0)');
    ctx.strokeStyle = soil; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(left, groundY + 0.5); ctx.lineTo(right, groundY + 0.5); ctx.stroke();

    const blit = (layer: HTMLCanvasElement) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, 0, 0); };
    const live = (layer: number) => { for (const c of tree.clumps) if (c.layer === layer && T >= c.birth && c.settle > settled) this.clumpAt(ctx, c, T); };

    blit(this.layers[0]); live(0);
    for (const b of tree.branches) if (T >= b.birth && b.settle > settled) this.branchAt(ctx, b, T);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* the trunk as far as it has grown: thick with age at the foot, tapering up to its slender growing tip */
    const baseW = lerp(2.2 * k, tree.trunkMax, smooth(age * 1.1));
    const widthAt = (t: number) => {
      const s = t * sT;
      const girth = lerp(1, 0.2, Math.pow(s, 0.8));
      const flare = 1 + 0.6 * Math.pow(Math.max(0, 1 - s / 0.06), 2) * smooth(age * 2);
      const tipFade = t > 0.88 ? 1 - (t - 0.88) * 4.5 : 1;
      return Math.max(1.4 * k, baseW * girth * flare * tipFade);
    };
    const rootG = smooth((age - 0.05) * 2.2);
    if (rootG > 0.02) {
      for (const [dir, len, droop] of [[-1, 0.95, 0.16], [-0.5, 0.55, 0.32], [0.55, 0.6, 0.3], [1, 1, 0.14]]) {
        const ang = dir < 0 ? Math.PI - droop : droop;
        const pts = bend(base[0] + dir * baseW * 0.16, groundY - baseW * 0.34, ang, len * 56 * k * rootG, () => 0, 0.05, rng(7 + dir * 10), 10);
        limb(ctx, pts, t => baseW * 0.4 * Math.pow(1 - t, 1.4) + 0.8 * k, pts.length, BARK, 0);
      }
    }
    limb(ctx, spine, widthAt, nT, BARK, baseW > 12 * k ? 8 : 0, 99);

    /* THE SEED, and the seedling's first leaves */
    const phase = T - startYear;
    if (phase < 1.6) {
      ctx.save(); ctx.globalAlpha = 1 - smooth((phase - 1.1) / 0.5);
      ctx.fillStyle = 'rgba(122, 94, 64, 0.55)';
      ctx.beginPath(); ctx.ellipse(base[0], groundY + 1, 20 * k, 4 * k, 0, Math.PI, TAU); ctx.fill();
      const split = smooth(phase / 0.3);
      for (const sideOf of [-1, 1]) {
        ctx.fillStyle = sideOf < 0 ? '#7a4e2c' : '#9a6a3c';
        ctx.beginPath(); ctx.ellipse(base[0] + sideOf * 3.5 * k * split, groundY - 3 * k, 7 * k, 4.6 * k, sideOf * (0.35 + split * 0.6), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    if (phase > 0.12) {
      const young = smooth((phase - 0.12) / 0.5);
      if (phase < 1.3) {
        ctx.fillStyle = '#8bbd5f';
        for (const sideOf of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(tipNow.x + sideOf * 7 * k * young, tipNow.y - 1.5 * k, 8 * k * young, 4.4 * k * young, sideOf * -0.5, 0, TAU);
          ctx.fill();
        }
      } else if (T < endYear + 1.4) {
        /* the growing tip carries its newest leaves */
        const size = (12 + 18 * smooth(age * 1.6)) * k;
        const sprite = foliage.sprites[3][1];
        const scale = size / foliage.R;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * tipNow.x, dpr * (tipNow.y - size * 0.2));
        ctx.drawImage(sprite.canvas, -sprite.R, -sprite.R, 2 * sprite.R, 2 * sprite.R);
      }
    }

    blit(this.layers[1]); live(1); live(2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
