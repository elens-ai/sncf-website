import React, { useId } from 'react';
import { resolveCMSMedia } from '../cms/media';
import { getCMSCopy } from '../cms/runtime';
import './awards-tree.css';

export interface TreeOrnament {
  key: string;
  /** Its honour's place in the section's list, and its photograph's within the honour. */
  award: number;
  photo: number;
  src: string;
  focal?: string;
  year: string;
  title: string;
}

/* THE WOOD. The tree is drawn in a 1000 × 860 box. Every limb (the trunk,
   its branches, their twigs, the roots) is a curved centre line with a width
   that tapers from its base to its tip and flares where it leaves its
   parent, so the wood grows out of itself rather than being stuck on. Each
   limb is filled, then lit along the edge that faces the light (from the
   upper left) and shaded along the other, which gives it its roundness. */
type Point = readonly [number, number];
type Curve = readonly [Point, Point, Point, Point];
interface Limb { line: Curve; from: number; to: number; flare?: number }

const at = ([a, b, c, d]: Curve, t: number): Point => {
  const u = 1 - t;
  return [u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]];
};
const along = ([a, b, c, d]: Curve, t: number): Point => {
  const u = 1 - t;
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
};
const half = (limb: Limb, t: number) => (limb.to + (limb.from - limb.to) * (1 - t) ** 1.25 + (limb.flare ?? 0) * Math.max(0, 1 - t / 0.16) ** 2) / 2;
/* a point s half-widths to one side of the centre line (s = 1 one edge, -1 the other) */
const edge = (limb: Limb, t: number, s: number): Point => {
  const [x, y] = at(limb.line, t);
  const [dx, dy] = along(limb.line, t);
  const h = half(limb, t) * s;
  return [x - dy * h, y + dx * h];
};
const xy = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;
/* the strip between two offsets, the whole length of the limb */
const band = (limb: Limb, s0: number, s1: number, steps: number, t0 = 0, t1 = 1) => {
  const one: Point[] = [], other: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps;
    one.push(edge(limb, t, s0)); other.push(edge(limb, t, s1));
  }
  return `M${one.map(xy).join('L')}L${other.reverse().map(xy).join('L')}Z`;
};
const line = (limb: Limb, s: number, steps: number, t0: number, t1: number) =>
  `M${Array.from({ length: steps + 1 }, (_, i) => xy(edge(limb, t0 + ((t1 - t0) * i) / steps, s))).join('L')}`;
/* which side of a limb faces the light, from the upper left */
const lit = (limb: Limb) => { const [dx, dy] = along(limb.line, 0.5); return -dy * -0.55 + dx * -0.83 > 0 ? 1 : -1; };
/* drawn: the limb, its lit edge and its shaded edge */
const carve = (limb: Limb, steps: number) => {
  const side = lit(limb);
  return { body: band(limb, 1, -1, steps), light: band(limb, side, side * 0.22, steps), shade: band(limb, -side * 0.38, -side, steps) };
};

/* the trunk, in an S from the ground up to where the crown's limb leaves it */
const TRUNK: Limb = { line: [[500, 838], [468, 706], [536, 516], [500, 300]], from: 84, to: 30, flare: 62 };
const onTrunk = (y: number): Point => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 28; i++) { const mid = (lo + hi) / 2; if (at(TRUNK.line, mid)[1] > y) lo = mid; else hi = mid; }
  return at(TRUNK.line, (lo + hi) / 2);
};
/* a branch leaves the trunk at a height, sets off in a direction and bends to its tip */
const branch = (y: number, out: Point, bend: Point, tip: Point, from: number, to: number): Limb => {
  const base = onTrunk(y);
  return { line: [base, [base[0] + out[0], base[1] + out[1]], bend, tip], from, to, flare: from * 0.7 };
};
const BRANCHES: Limb[] = [
  branch(700, [-62, -24], [330, 664], [250, 612], 30, 7),
  branch(672, [62, -30], [690, 644], [776, 590], 30, 7),
  branch(560, [-74, -34], [300, 500], [180, 424], 26, 6),
  branch(536, [74, -40], [706, 476], [832, 404], 26, 6),
  branch(440, [-52, -40], [356, 346], [272, 266], 22, 5),
  branch(424, [52, -44], [644, 332], [734, 246], 22, 5),
  branch(334, [-22, -50], [430, 222], [384, 164], 16, 4),
  branch(322, [24, -48], [572, 212], [616, 154], 16, 4),
];
/* the trunk's last limb, rising into the crown */
const LEADER: Limb = { line: [[500, 300], [490, 258], [508, 214], [500, 180]], from: 30, to: 13 };
/* twigs off every branch, one reaching out and one climbing back */
const TWIGS: Limb[] = BRANCHES.flatMap((limb, i) => {
  const out = i % 2 ? 1 : -1;
  const [x, y] = at(limb.line, 0.72);
  const [ix, iy] = at(limb.line, 0.4);
  return [
    { line: [[x, y], [x + out * 12, y - 24], [x + out * 28, y - 38], [x + out * 46, y - 44]], from: 8, to: 1.6, flare: 4 },
    { line: [[ix, iy], [ix - out * 6, iy - 22], [ix - out * 4, iy - 40], [ix + out * 8, iy - 58]], from: 7, to: 1.4, flare: 4 },
  ] as Limb[];
});
/* roots gripping the ground, the outer ones arching over it */
const ROOTS: Limb[] = [
  { line: [[478, 810], [438, 834], [394, 842], [312, 850]], from: 32, to: 3 },
  { line: [[522, 810], [564, 834], [610, 840], [692, 846]], from: 32, to: 3 },
  { line: [[488, 824], [462, 846], [438, 855], [400, 859]], from: 19, to: 2 },
  { line: [[512, 824], [540, 846], [564, 855], [602, 859]], from: 19, to: 2 },
  { line: [[468, 796], [412, 812], [358, 806], [268, 832]], from: 15, to: 2 },
  { line: [[532, 794], [592, 810], [648, 804], [736, 828]], from: 15, to: 2 },
  { line: [[494, 830], [488, 846], [478, 854], [460, 860]], from: 11, to: 1.5 },
  { line: [[506, 830], [512, 846], [522, 854], [542, 860]], from: 11, to: 1.5 },
];
const WOOD = [
  ...ROOTS.map(limb => carve(limb, 16)),
  ...BRANCHES.map(limb => carve(limb, 28)),
  ...TWIGS.map(limb => carve(limb, 12)),
  carve(LEADER, 16),
  carve(TRUNK, 40),
];
/* the bark's grain up the trunk, and two knots */
const GRAIN = [0.62, 0.3, -0.28, -0.6].map((s, i) => line(TRUNK, s, 24, 0.04 + i * 0.03, 0.82 - i * 0.06));
const KNOTS = [{ t: 0.34, s: 0.22, r: 7 }, { t: 0.6, s: -0.3, r: 5 }].map(({ t, s, r }) => ({ at: edge(TRUNK, t, s), r }));

/* THE LEAVES: set along every limb on its edges, turned outward, each with
   its midrib, in the colours of the logo's lotus petals (pink, orchid,
   indigo-blue, cyan and green, sampled from the petal artwork) and now and
   then the wood's own gold; each shaded along its length, light at its
   heart and deeper at base and tip, as the petals are. */
const LEAF = 'M0 0C8 -10 22 -12 34 0C22 12 8 10 0 0Z';
const LEAF_TONES = [
  ['#ff5c9e', '#e00f68'],
  ['#d886d1', '#a24c9d'],
  ['#62a8ea', '#5d58ad'],
  ['#45d3ec', '#0597bc'],
  ['#95d672', '#4f9e33'],
  ['#f4d895', '#c9973f'],
] as const;
const RIB = 'M3 0L30 0';
const LEAVES = [...BRANCHES, ...TWIGS, LEADER].flatMap((limb, i) => [0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.89, 0.98].map((t, k) => {
  const side = (i + k) % 2 ? 1 : -1;
  const [x, y] = edge(limb, t, side * 0.8);
  const [dx, dy] = along(limb.line, t);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI + side * (40 + ((k * 9) % 24));
  return { x, y, angle, scale: 0.8 + (((i * 7 + k * 3) % 6) * 0.12), tone: (i * 3 + k) % LEAF_TONES.length };
}));
const BLOSSOMS = TWIGS.map(limb => limb.line[3]);

/* where the honours hang, lowest first: the branch and how far along it, the thread's length and the frame's width */
const SLOTS = [
  { branch: 0, t: 1, thread: 34, size: 104 },
  { branch: 1, t: 1, thread: 40, size: 104 },
  { branch: 0, t: 0.55, thread: 92, size: 96 },
  { branch: 1, t: 0.55, thread: 96, size: 96 },
  { branch: 2, t: 1, thread: 40, size: 108 },
  { branch: 3, t: 1, thread: 44, size: 108 },
  { branch: 2, t: 0.55, thread: 60, size: 98 },
  { branch: 3, t: 0.55, thread: 64, size: 98 },
  { branch: 4, t: 1, thread: 40, size: 106 },
  { branch: 5, t: 1, thread: 42, size: 106 },
  { branch: 6, t: 1, thread: 30, size: 92 },
  { branch: 7, t: 1, thread: 30, size: 92 },
].map(slot => ({ ...slot, point: at(BRANCHES[slot.branch].line, slot.t) }));
/* the newest honour crowns the tree */
const CROWN = { x: 500, y: 104, size: 150 };
const SPARKS = Array.from({ length: 16 }, (_, i) => ({ x: 10 + ((i * 37) % 80), y: 4 + ((i * 53) % 62), delay: -(i * 0.9), size: 3 + (i % 3) }));
const place = (x: number, y: number) => ({ left: `${x / 10}%`, top: `${(y / 860) * 100}%` });

/** THE TREE OF HONOURS: the foundation's recognitions hung on a tree that
    grows with its service, every photograph a framed ornament on a thread.
    The oldest hang from the lowest branches (the undated beneath them), each
    year a branch higher, and the newest crowns it in gilt. The honour in
    view glows, with every photograph of it; choosing an ornament brings its
    honour into view. */
export function AwardsTree({ ornaments, award, photo, onChoose, label }: {
  /** In the tree's order: oldest first, the last crowning it. */
  ornaments: TreeOrnament[];
  award: number;
  photo: number;
  onChoose: (award: number, photo: number) => void;
  label: string;
}) {
  const id = useId().replace(/:/g, '');
  const crown = ornaments[ornaments.length - 1];
  const hung = ornaments.slice(0, -1).slice(-SLOTS.length);
  const ornament = (o: TreeOrnament, className: string, style: React.CSSProperties) => {
    const current = o.award === award && o.photo === photo;
    return (
      <li key={o.key} className={className} data-kin={o.award === award} data-current={current} style={style}>
        <button type="button" className="awards-tree-frame" aria-pressed={current} aria-label={`${o.title}${o.year ? `, ${o.year}` : ''}`} onClick={() => onChoose(o.award, o.photo)}>
          <img src={resolveCMSMedia(o.src)} alt="" loading="lazy" decoding="async" draggable={false} style={o.focal ? { objectPosition: o.focal } : undefined} />
        </button>
        <span className="awards-tree-tag" aria-hidden="true">{o.year || getCMSCopy('copy.AwardsTree.undated', 'Honour')}</span>
      </li>
    );
  };

  return (
    <div className="awards-tree" role="group" aria-label={label}>
      <svg className="awards-tree-art" viewBox="0 0 1000 860" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-wood`} gradientUnits="userSpaceOnUse" x1="0" y1="860" x2="0" y2="140">
            <stop offset="0" stopColor="#a8762f" />
            <stop offset="0.45" stopColor="#d4a352" />
            <stop offset="1" stopColor="#efcb80" />
          </linearGradient>
          {LEAF_TONES.map(([light, deep], i) => (
            <linearGradient key={i} id={`${id}-leaf-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={deep} />
              <stop offset="0.5" stopColor={light} />
              <stop offset="1" stopColor={deep} />
            </linearGradient>
          ))}
          <radialGradient id={`${id}-canopy`}>
            <stop offset="0" stopColor="#f3d58f" stopOpacity="0.18" />
            <stop offset="0.6" stopColor="#bfe8d2" stopOpacity="0.06" />
            <stop offset="1" stopColor="#bfe8d2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cfe9dc" stopOpacity="0.26" />
            <stop offset="1" stopColor="#cfe9dc" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop offset="0" stopColor="#021a18" stopOpacity="0.5" />
            <stop offset="1" stopColor="#021a18" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="500" cy="380" rx="440" ry="330" fill={`url(#${id}-canopy)`} />
        {/* the ground: a low mound, its shadow beneath the trunk */}
        <path className="awards-tree-mound" d="M150 860C270 832 390 822 500 822S730 832 850 860Z" fill={`url(#${id}-ground)`} />
        <path className="awards-tree-horizon" d="M210 850C330 830 420 824 500 824S670 830 790 850" />
        <ellipse cx="500" cy="840" rx="150" ry="14" fill={`url(#${id}-shadow)`} />
        <g className="awards-tree-wood">
          {WOOD.map((part, i) => (
            <g key={i}>
              <path d={part.body} fill={`url(#${id}-wood)`} />
              <path className="awards-tree-shade" d={part.shade} />
              <path className="awards-tree-light" d={part.light} />
            </g>
          ))}
          {GRAIN.map(d => <path key={d} className="awards-tree-grain" d={d} />)}
          {KNOTS.map(({ at: [x, y], r }) => <ellipse key={x} className="awards-tree-knot" cx={x} cy={y} rx={r} ry={r * 1.6} />)}
        </g>
        <g className="awards-tree-leaves">
          {LEAVES.map((leaf, i) => (
            <g key={i} data-tone={leaf.tone} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(1)}) scale(${leaf.scale.toFixed(2)})`}>
              <path d={LEAF} fill={`url(#${id}-leaf-${leaf.tone})`} /><path className="awards-tree-rib" d={RIB} />
            </g>
          ))}
        </g>
        <g className="awards-tree-blossoms">{BLOSSOMS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 4.5 : 6} />)}</g>
      </svg>
      <span className="awards-tree-sparks" aria-hidden="true">
        {SPARKS.map((spark, i) => <i key={i} style={{ left: `${spark.x}%`, top: `${spark.y}%`, width: spark.size, height: spark.size, animationDelay: `${spark.delay}s` }} />)}
      </span>
      {/* newest first, so the keyboard meets them as the list beside the tree does */}
      <ul className="awards-tree-ornaments">
        {crown && ornament(crown, 'awards-tree-crown', { ...place(CROWN.x, CROWN.y), '--size': CROWN.size / 10 } as React.CSSProperties)}
        {hung.map((o, i) => ({ o, slot: SLOTS[i], i })).reverse().map(({ o, slot, i }) => ornament(o, 'awards-tree-ornament', {
          ...place(slot.point[0], slot.point[1]), '--size': slot.size / 10, '--thread': slot.thread / 10, '--sway': `${-((i * 1.3) % 5.6)}s`,
        } as React.CSSProperties))}
      </ul>
    </div>
  );
}
