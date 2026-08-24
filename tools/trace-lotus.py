"""Regenerate src/components/lotusGeometry.ts from the SNCF logo's lotus mark.

    python3 tools/trace-lotus.py          (needs numpy + Pillow; dev-only)

lotus-source.png is the lotus cropped out of the foundation's seal. Its five
figures are separated by white keylines, so a hue classification yields one
complete mask per figure — no fused-silhouette cutting needed (the white
watermark version of the mark fuses its blades and cannot be split cleanly).

Getting smooth outlines out of a 330px source that will be drawn 1340 units
wide takes more than upscaling: at 4 units per source pixel the pixel
staircase is plainly visible, and blurring hard enough to hide it would eat
the pointed tips.

The staircase is really an information problem — a yes/no mask discards what
the source already knows. The seal is anti-aliased, so a pixel on the edge of
a blade is a MIXTURE of that blade's ink and the white behind it, and how far
it has travelled from white towards the ink says where inside that pixel the
true edge falls. So each figure's mask is built as a coverage field (that
projection, per pixel, kept only where this figure is the nearest ink) and
the field is what gets upscaled and cut at half coverage — recovering the
edge to a fraction of a source pixel instead of snapping it to pixel corners.

The field is upscaled 8x and lightly blurred, traced by
crack-following (chaining the directed edges between inside and outside
pixels, which cannot oscillate the way Moore-neighbour tracing does on
one-pixel spurs), and then the CONTOUR ITSELF is filtered: a Gaussian along
the outline erases the staircase, except where a real corner is detected
(the turn over a short span is sharp), where the original vertex is kept so
the tips stay tips. The result is simplified and emitted as cubic Beziers,
not line segments — the curve between vertices is what finally removes the
faceting a polygon can never lose.

Everything below TRACED is measured from the image. Everything under
AUTHORED is design intent — edit it here, not in the generated file.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'tools' / 'lotus-source.png'
TARGET = ROOT / 'src' / 'components' / 'lotusGeometry.ts'

S = 8            # mask upscale factor
REF = 5          # the scale the viewBox numbers below were fixed at
BLUR = 0.25 * S  # mask low-pass, upscaled pixels
SIGMA = 0.7 * S  # contour low-pass along the outline, upscaled pixels
CORNER_COS = -0.35  # turn sharper than this counts as a corner and is kept
EPS = 1.6        # simplification tolerance, upscaled pixels (~1 viewBox unit)

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
OX, OY = 140, 160          # content origin, REF-scale pixels
VIEW = (1340, 810)

# Bloom windows as fractions of the section's pinned scroll, LEFT TO RIGHT and
# strictly one at a time: each petal finishes and holds before the next one
# starts, and the whole flower stands through the last stretch before the
# section releases the page.
#
# Colours are deliberately absent: each petal wears its own hero card's
# accents, read from PILLARS / DEVOTIONAL_ACCENT at render time, so the
# flower cannot drift from the cards it names.
WINDOWS = {
    'welcome':  [0.03, 0.19],
    'heal':     [0.21, 0.37],
    'enrich':   [0.39, 0.55],
    'empower':  [0.57, 0.73],
    'projects': [0.75, 0.91],
}

# -------------------------------------------------------------------- TRACED

crop = Image.open(SOURCE).convert('RGB')
W0, H0 = crop.size
srgb = np.asarray(crop, dtype=float)
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


WHITE = np.array([255.0, 255.0, 255.0])


def coverage(rgb_ink):
    """Per-pixel ink coverage: how far this pixel has travelled from the
    white behind the mark towards this figure's ink. 1 inside the blade,
    0 on the page, and the fraction in between on an anti-aliased edge."""
    axis = rgb_ink - WHITE
    return np.clip(((srgb - WHITE) @ axis) / float(axis @ axis), 0, 1)


def dilate(m, r):
    out = m.copy()
    for _ in range(r):
        p = np.pad(out, 1, constant_values=False)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1]
               | p[1:-1, :-2] | p[1:-1, 2:])
    return out


def smooth_mask(field):
    """Coverage field -> soft-edged mask at S times the resolution, cut at
    half coverage so the boundary lands where the ink half-covers a pixel."""
    img = (Image.fromarray((field * 255).astype(np.uint8))
           .resize((W0 * S, H0 * S), Image.BICUBIC)
           .filter(ImageFilter.GaussianBlur(BLUR)))
    return np.asarray(img, dtype=np.uint8) > 127


def core_colour(comp):
    """Mean colour of a shape's interior, keylines and anti-aliased rim
    eroded away so the reading is the ink itself."""
    core = comp.copy()
    for _ in range(2):
        p = np.pad(core, 1, constant_values=False)
        core = (p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1]
                & p[1:-1, :-2] & p[1:-1, 2:])
    return srgb[core if core.sum() > 20 else comp].mean(axis=0)


def trace_boundary(m):
    """Crack-following: the directed edges between inside and outside pixels
    chain into loops. Returns the longest loop as (y, x) vertices."""
    H, W = m.shape
    pad = np.zeros((H + 2, W + 2), dtype=bool)
    pad[1:-1, 1:-1] = m
    # only edge pixels can contribute cracks — scanning the interior is the
    # difference between seconds and minutes at this resolution
    rim = m & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    edges = {}
    ys, xs = np.nonzero(rim)
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


def relax(points, sigma=SIGMA):
    """Gaussian low-pass ALONG a closed contour, corners exempted.

    The staircase and the shape live at different frequencies, so filtering
    the vertex sequence removes the first and leaves the second. Corners are
    the exception — they are high-frequency on purpose — so vertices whose
    turn over +/-L is sharp keep their original position, and the blend back
    to full smoothing is itself ramped so no kink appears at the seam."""
    pts = np.array(points, dtype=float)
    n = len(pts)
    r = max(1, int(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    idx = (np.arange(n)[:, None] + np.arange(-r, r + 1)[None, :]) % n
    smoothed = (pts[idx] * k[None, :, None]).sum(axis=1)

    # Corners are found on the SMOOTHED outline and over a span wide enough
    # to outlast the staircase: measured on the raw contour at a short span,
    # every pixel step turns a right angle and the whole outline reads as
    # corner, which exempts it from the very smoothing it needs.
    L = max(3, int(2.5 * sigma))
    a = smoothed[(np.arange(n) - L) % n] - smoothed
    b = smoothed[(np.arange(n) + L) % n] - smoothed
    cos = ((a * b).sum(1)
           / (np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + 1e-9))
    keep = (cos > CORNER_COS).astype(float)          # 1 at corners
    widx = (np.arange(n)[:, None] + np.arange(-L // 2, L // 2 + 1)[None, :]) % n
    keep = keep[widx].mean(axis=1)                    # spread the exemption
    w = np.clip(1 - keep, 0, 1)[:, None]              # 0 at corners, 1 away
    print(f'    contour {n} pts, {int((w < 0.5).sum())} held as corners',
          file=sys.stderr)
    return [tuple(v) for v in pts * (1 - w) + smoothed * w]


def bezier_path(points, scale, ox, oy):
    """Closed Catmull-Rom through the points, written as cubic Beziers.

    Tangents are dropped to zero at corner vertices, so a corner is entered
    and left along its chords and stays sharp while everything else curves."""
    pts = np.array([(x * scale - ox, y * scale - oy) for (y, x) in points])
    n = len(pts)
    prev = pts[np.arange(n) - 1]
    nxt = pts[(np.arange(n) + 1) % n]
    a, b = prev - pts, nxt - pts
    cos = ((a * b).sum(1)
           / (np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + 1e-9))
    sharp = cos > CORNER_COS

    out = [f'M{pts[0][0]:.1f} {pts[0][1]:.1f}']
    for i in range(n):
        p0, p1 = pts[i - 1], pts[i]
        p2, p3 = pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = p1 if sharp[i] else p1 + (p2 - p0) / 6
        c2 = p2 if sharp[(i + 1) % n] else p2 - (p3 - p1) / 6
        out.append(f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} '
                   f'{p2[0]:.1f} {p2[1]:.1f}')
    return ''.join(out) + 'Z'


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


# Pass one: find the shapes and read their ink.
shapes = []
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
        w, h = xs.max() - xs.min(), ys.max() - ys.min()
        shapes.append({
            'class': cname, 'comp': comp, 'npx': npx, 'rgb': core_colour(comp),
            'kind': 'dot' if (npx < 700 and max(w, h) / max(1, min(w, h)) < 1.4)
                    else 'figure',
        })

# Pass two: rebuild each shape from its coverage, with every other shape's
# coverage competing for the same pixels so neighbouring inks cannot bleed
# across a keyline into each other's edges.
# Each shape only competes where it actually lies (its own neighbourhood):
# the teal arch and the teal head share an ink to within 2/255, so a global
# argmax over colour alone would hand every one of those pixels to whichever
# came first and leave the other with nothing at all.
cov = np.stack([np.where(dilate(sh['comp'], 2), coverage(sh['rgb']), 0.0)
                for sh in shapes])
owner = cov.argmax(axis=0)

figures, dots = {}, []
for i, sh in enumerate(shapes):
    field = np.where(owner == i, cov[i], 0.0)
    big = smooth_mask(field)
    bys, bxs = np.nonzero(big)
    w, h = bxs.max() - bxs.min(), bys.max() - bys.min()
    if sh['kind'] == 'dot':
        dots.append({'cx': float(bxs.mean()), 'cy': float(bys.mean()),
                     'r': float((w + h) / 4), 'rgb': sh['rgb']})
        continue
    outer = dp(relax(trace_boundary(big)), EPS)
    figures[sh['class']] = {
        'outer': outer, 'rgb': sh['rgb'],
        'bbox': (float(bxs.min()), float(bys.min()),
                 float(bxs.max()), float(bys.max())),
        'centroid': (float(bxs.mean()), float(bys.mean()))}
    print(f'{sh["class"]}: {sh["npx"]}px source, {len(outer)} points',
          file=sys.stderr)

missing = set(CLASSES) - set(figures)
if missing:
    sys.exit(f'figures not found: {sorted(missing)} — check the hue bands')

# Each dot belongs to the figure the seal PAINTED it to match, not to the one
# it happens to float nearest: the heads sit in the gaps between blades, and
# proximity mis-assigns the right-hand pair (the teal head is a shade nearer
# the gold crescent than the teal arch whose colour it exactly shares). Ink is
# unambiguous where geometry is not — three of the four match their figure to
# within 8/255, and the odd one out, a lighter sky blue, falls to the figure
# left over: the centre, which the seal gives no head of its own tone. The
# gold crescent ends up headless, as it is in the seal.
pairs = sorted(((float(np.linalg.norm(d['rgb'] - f['rgb'])), i, c)
                for i, d in enumerate(dots) for c, f in figures.items()),
               key=lambda t: t[0])
dot_of, taken = {}, set()
for dist, i, c in pairs:
    if c in dot_of or i in taken:
        continue
    dot_of[c] = dots[i]
    taken.add(i)
    print(f'dot at ({dots[i]["cx"] / S:.0f},{dots[i]["cy"] / S:.0f}) -> '
          f'{NAMES[c]}  (colour distance {dist:.1f}/255)', file=sys.stderr)
for c in figures:
    if c not in dot_of:
        print(f'{NAMES[c]}: no head in the seal', file=sys.stderr)

# ------------------------------------------------------------------- EMIT

def ref(v):
    """Upscaled pixels -> the REF-scale space the viewBox is fixed in."""
    return v * REF / S


L = [
    "/* GENERATED — run `python3 tools/trace-lotus.py` to rebuild.",
    " *",
    " * The petal outlines are the foundation seal's own lotus, traced from",
    " * tools/lotus-source.png rather than drawn by hand, so the shapes on the",
    " * page are the shapes on the seal. Bloom windows and paint order are",
    " * authored in the generator's AUTHORED block — edit them there. Colours",
    " * are not here at all: each petal wears its hero card's accents, which",
    " * SncfLotus3D reads from PILLARS / DEVOTIONAL_ACCENT. */",
    '',
    'export interface LotusPetal {',
    '  id: string;',
    '  /** Resting fan angle about the base, degrees. Geometry is baked at this',
    '      pose, so the unfold runs the rotation from -rest back to 0. */',
    '  rest: number;',
    "  /** [start, end] window of the section's scroll this petal blooms in. */",
    '  window: [number, number];',
    "  /** The figure's floating dot — the head the seal paints in this",
    "      figure's own ink. The gold crescent has none. */",
    '  dot: { cx: number; cy: number; r: number } | null;',
    '  /** Vertical extent [top, bottom], so a dot can be filled from its own',
    "      petal's ramp at the height it floats rather than from a ramp",
    '      squeezed into the dot itself. */',
    '  span: [number, number];',
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
    w = WINDOWS[name]
    path = bezier_path(f['outer'], REF / S, OX, OY)
    cx, cy = ref(f['centroid'][0]) - OX, ref(f['centroid'][1]) - OY
    rest = round(np.degrees(np.arctan2(cx - BASE[0], BASE[1] - cy)), 1)
    d = dot_of.get(cname)
    dot = ('null' if d is None else '{ cx: %.1f, cy: %.1f, r: %.1f }'
           % (ref(d['cx']) - OX, ref(d['cy']) - OY, ref(d['r'])))
    span = (ref(f['bbox'][1]) - OY, ref(f['bbox'][3]) - OY)
    L += ['  {', f"    id: '{name}',", f'    rest: {rest},',
          f'    window: [{w[0]}, {w[1]}],',
          f'    dot: {dot},',
          f'    span: [{span[0]:.1f}, {span[1]:.1f}],',
          '    path:', f"      '{path}',", '  },']
L += ['];', '']

TARGET.write_text('\n'.join(L))
print(f'wrote {TARGET.relative_to(ROOT)} — {len(figures)} figures, {len(dots)} dots',
      file=sys.stderr)
