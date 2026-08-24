"""Regenerate src/components/lotusGeometry.ts from the SNCF logo's lotus mark.

    python3 tools/trace-lotus.py          (needs numpy + Pillow; dev-only)

lotus-source.png is the lotus cropped out of the foundation's seal. Its five
figures are separated by white keylines, so a hue classification yields one
complete mask per figure — no fused-silhouette cutting needed (the white
watermark version of the mark fuses its blades and cannot be split cleanly).
Each mask is upscaled 5x, traced by crack-following (chaining the directed
edges between inside and outside pixels, which cannot oscillate the way
Moore-neighbour tracing does on one-pixel spurs), Chaikin-smoothed twice to
melt the pixel staircase, then Douglas-Peucker simplified.

Everything below TRACED is measured from the image. Everything under
AUTHORED is design intent — edit it here, not in the generated file.
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'tools' / 'lotus-source.png'
TARGET = ROOT / 'src' / 'components' / 'lotusGeometry.ts'

S = 5  # mask upscale factor

# ------------------------------------------------------------------ AUTHORED

# Hue bands that isolate each figure in the seal, and the site name each one
# carries. 'cyan' catches the teal arch; 'green' the gold crescent (the seal's
# own hues, not the render's).
CLASSES = {
    'magenta': (305, 355),
    'purple': (262, 305),
    'indigo': (225, 262),
    'cyan': (175, 225),
    'green': (70, 165),
}
NAMES = {'magenta': 'welcome', 'purple': 'heal', 'indigo': 'enrich',
         'cyan': 'empower', 'green': 'projects'}

# Paint order, back to front — the centre sits behind its neighbours and the
# two crescents in front, as in the seal.
PAINT_ORDER = ['indigo', 'purple', 'cyan', 'magenta', 'green']

# The point every figure converges on, in generated viewBox coordinates. Each
# petal folds to, and unfolds about, this point.
BASE = (680, 620)

# Bloom windows as fractions of the section's pinned scroll, LEFT TO RIGHT and
# strictly one at a time: each petal finishes and holds before the next one
# starts, and the whole flower stands through the last stretch before the
# section releases the page.
SPEC = {
    'welcome':  {'window': [0.03, 0.19], 'colors': ['#bb3e73', '#f19cc0']},
    'heal':     {'window': [0.21, 0.37], 'colors': ['#33935e', '#96d4b2']},
    'enrich':   {'window': [0.39, 0.55], 'colors': ['#4f74c2', '#b3c9f0']},
    'empower':  {'window': [0.57, 0.73], 'colors': ['#3a5eb5', '#8fb0e8']},
    # the gold crescent's dot is periwinkle in the reference render
    'projects': {'window': [0.75, 0.91], 'colors': ['#b57f1e', '#e9c66f'],
                 'dotFill': 'empower'},
}

# -------------------------------------------------------------------- TRACED

crop = Image.open(SOURCE).convert('RGB')
W0, H0 = crop.size
hsv = np.asarray(crop.convert('HSV'), dtype=float)
hue = hsv[..., 0] * 360 / 255
sel = (hsv[..., 1] / 255 > 0.25) & (hsv[..., 2] / 255 > 0.25)


def label8(m):
    """Connected components, 8-connectivity."""
    lab = np.zeros(m.shape, dtype=np.int32)
    cur = 0
    H, W = m.shape
    for y0 in range(H):
        for x0 in np.nonzero(m[y0] & (lab[y0] == 0))[0]:
            if lab[y0, x0]:
                continue
            cur += 1
            q = deque([(y0, int(x0))])
            lab[y0, x0] = cur
            while q:
                y, x = q.popleft()
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = cur
                            q.append((ny, nx))
    return lab, cur


def trace_boundary(m):
    """Crack-following: the directed edges between inside and outside pixels
    chain into loops. Returns the longest loop as (y, x) vertices."""
    H, W = m.shape
    pad = np.zeros((H + 2, W + 2), dtype=bool)
    pad[1:-1, 1:-1] = m
    edges = {}
    ys, xs = np.nonzero(m)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if not pad[y, x + 1]:
            edges[(x, y)] = (x + 1, y)
        if not pad[y + 1, x + 2]:
            edges[(x + 1, y)] = (x + 1, y + 1)
        if not pad[y + 2, x + 1]:
            edges[(x + 1, y + 1)] = (x, y + 1)
        if not pad[y + 1, x]:
            edges[(x, y + 1)] = (x, y)
    best = []
    while edges:
        v0, v = next(iter(edges.items()))
        loop = [v0]
        del edges[v0]
        while v != v0 and v in edges:
            loop.append(v)
            v = edges.pop(v)
        if len(loop) > len(best):
            best = loop
    return [(y, x) for (x, y) in best]


def chaikin(points, rounds=2):
    pts = np.array(points, dtype=float)
    for _ in range(rounds):
        a = pts
        b = np.roll(pts, -1, axis=0)
        pts = np.empty((len(a) * 2, 2))
        pts[0::2] = 0.75 * a + 0.25 * b
        pts[1::2] = 0.25 * a + 0.75 * b
    return [tuple(p) for p in pts]


def dp(points, eps):
    """Douglas-Peucker on a closed contour (split at the farthest vertex, so
    the start/end coincidence cannot collapse the whole ring)."""
    pts = np.array(points, dtype=float)

    def rec(i, j):
        if j <= i + 1:
            return []
        p, q = pts[i], pts[j]
        seg = q - p
        L = np.hypot(*seg) or 1.0
        rel = pts[i + 1:j] - p
        d = np.abs(seg[0] * rel[:, 1] - seg[1] * rel[:, 0]) / L
        k = int(np.argmax(d))
        if d[k] > eps:
            k += i + 1
            return rec(i, k) + [k] + rec(k, j)
        return []

    far = int(np.argmax(((pts - pts[0]) ** 2).sum(axis=1)))
    idx = [0] + rec(0, far) + [far] + rec(far, len(pts) - 1) + [len(pts) - 1]
    return [points[i] for i in idx]


figures, dots = {}, []
for cname, (h0, h1) in CLASSES.items():
    lab, n = label8(sel & (hue >= h0) & (hue < h1))
    for cid in range(1, n + 1):
        comp = lab == cid
        npx = int(comp.sum())
        if npx < 40:
            continue
        ys, xs = np.nonzero(comp)
        if ys.min() == 0 or xs.min() == 0 or ys.max() == H0 - 1 or xs.max() == W0 - 1:
            continue  # the seal's outer ring, clipped by the crop
        big = np.asarray(
            Image.fromarray((comp * 255).astype(np.uint8))
            .resize((W0 * S, H0 * S), Image.LANCZOS), dtype=float) > 127
        bys, bxs = np.nonzero(big)
        w, h = bxs.max() - bxs.min(), bys.max() - bys.min()
        if npx < 700 and max(w, h) / max(1, min(w, h)) < 1.4:
            dots.append({'cx': float(bxs.mean()), 'cy': float(bys.mean()),
                         'r': float((w + h) / 4)})
            continue
        outer = dp(chaikin(trace_boundary(big)), 2.0)
        figures[cname] = {'outer': outer,
                          'centroid': (float(bxs.mean()), float(bys.mean()))}
        print(f'{cname}: {npx}px, {len(outer)} points', file=sys.stderr)

missing = set(CLASSES) - set(figures)
if missing:
    sys.exit(f'figures not found: {sorted(missing)} — check the hue bands')

# Origin: the content's own bounding box, so the viewBox hugs the flower.
allx = [x for f in figures.values() for _, x in f['outer']] + [d['cx'] - d['r'] for d in dots]
ally = [y for f in figures.values() for y, _ in f['outer']] + [d['cy'] - d['r'] for d in dots]
OX, OY = 140, 160  # kept fixed so hand-tuned viewBox numbers stay valid
VIEW = (1340, 810)

# Dots belong to the figures they float above, left to right.
dots.sort(key=lambda d: d['cx'])
dot_of = dict(zip(['magenta', 'purple', 'cyan', 'green'], dots))

# ------------------------------------------------------------------- EMIT

L = [
    "/* GENERATED — run `python3 tools/trace-lotus.py` to rebuild.",
    " *",
    " * The petal outlines are the foundation seal's own lotus, traced from",
    " * tools/lotus-source.png rather than drawn by hand, so the shapes on the",
    " * page are the shapes on the seal. Bloom windows, colours and paint order",
    " * are authored in the generator's AUTHORED block — edit them there. */",
    '',
    'export interface LotusPetal {',
    '  id: string;',
    '  /** Resting fan angle about the base, degrees. Geometry is baked at this',
    '      pose, so the unfold runs the rotation from -rest back to 0. */',
    '  rest: number;',
    '  /** [start, end] window of the section\'s scroll this petal blooms in. */',
    '  window: [number, number];',
    '  /** Gradient stops: [dark base, light tip]. */',
    '  colors: [string, string];',
    "  /** The figure's floating dot, if it carries one. */",
    '  dot: { cx: number; cy: number; r: number } | null;',
    '  /** Petal id whose gradient the dot borrows (render-accurate). */',
    '  dotFill?: string;',
    '  path: string;',
    '}',
    '',
    f'export const LOTUS_VIEW = {{ w: {VIEW[0]}, h: {VIEW[1]} }} as const;',
    '/** The point all five figures converge on — every unfold pivots here. */',
    f'export const LOTUS_BASE = {{ x: {BASE[0]}, y: {BASE[1]} }} as const;',
    '',
    '/* Array order is PAINT order, back to front; bloom order lives in the',
    '   windows. */',
    'export const LOTUS_PETALS: LotusPetal[] = [',
]
for cname in PAINT_ORDER:
    f = figures[cname]
    name = NAMES[cname]
    s = SPEC[name]
    pts = [(x - OX, y - OY) for (y, x) in f['outer']]
    path = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
    cx, cy = f['centroid'][0] - OX, f['centroid'][1] - OY
    rest = round(np.degrees(np.arctan2(cx - BASE[0], BASE[1] - cy)), 1)
    d = dot_of.get(cname)
    dot = ('null' if d is None else
           '{ cx: %.1f, cy: %.1f, r: %.1f }' % (d['cx'] - OX, d['cy'] - OY, d['r']))
    L += ['  {', f"    id: '{name}',", f'    rest: {rest},',
          f"    window: [{s['window'][0]}, {s['window'][1]}],",
          f"    colors: ['{s['colors'][0]}', '{s['colors'][1]}'],",
          f'    dot: {dot},']
    if 'dotFill' in s:
        L.append(f"    dotFill: '{s['dotFill']}',")
    L += ['    path:', f"      '{path}',", '  },']
L += ['];', '']

TARGET.write_text('\n'.join(L))
print(f'wrote {TARGET.relative_to(ROOT)} — {len(figures)} figures, {len(dots)} dots',
      file=sys.stderr)
