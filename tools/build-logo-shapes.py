"""Turn the vector seal (sncf-logo-only.svg) into animatable groups.

    python3 tools/build-logo-shapes.py    (needs numpy + Pillow; dev-only)

The vector file is the logo itself, so its outlines and colours are exact —
no tracing, no colour matching. What it does not have is structure: it is 284
flat paths, the gradients cut into bands, with no clue which band belongs to
which petal. That is what this script adds.

Grouping is done by POSITION rather than colour, because a band's hue drifts
across a gradient but its place on the seal does not: the raster crops that
the old tracer used give a per-figure mask, the ring on both files fixes the
transform between them, and every path is then assigned to the figure it
actually sits on. Colour is carried straight over from the file.

Coordinates are left exactly as the SVG has them — the component translates
the emblem and pivots each petal with transform-origin instead, so nothing
here is re-encoded and nothing drifts.
"""
import colorsys
import re
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SVG = ROOT / 'tools' / 'sncf-logo-only.svg'
LOTUS_CROP = (ROOT / 'tools' / 'lotus-source.png', (350, 380))
HAND_CROP = (ROOT / 'tools' / 'hand-source.png', (306, 571))
TARGET = ROOT / 'src' / 'components' / 'logoShapes.ts'

NAMES = {'magenta': 'welcome', 'purple': 'heal', 'indigo': 'enrich',
         'cyan': 'empower', 'green': 'projects'}
CLASSES = {'magenta': (305, 355), 'purple': (262, 305), 'indigo': (225, 262),
           'cyan': (175, 225), 'green': (70, 165)}
PAINT_ORDER = ['enrich', 'heal', 'empower', 'welcome', 'projects']

# Paths the seal carries that the emblem does not want, matched on ink and
# bounding box so a rebuild cannot quietly bring them back.
EXCLUDE = [
    # a thin blue rim highlight that runs along the top of the thumb curl and
    # off the palm's right edge — part of the seal's ring shading, not the hand
    ('#3BADE1', (224, 337, 371, 375)),
]

# Bloom windows. The hand opens first, then the seal's white disc (its window
# lives in SncfLotus3D.tsx), then one petal at a time.
#
# ASSIGNED BY POSITION, LEFT TO RIGHT — keys below are in ascending dir.x.
# The flower opens as one gesture travelling across the screen, and each
# petal is TINTED to the vertical whose turn it is (see POSITION_TINT in
# SncfLotus3D.tsx): leftmost Heal green, then Enrich blue, Empower pink,
# Projects teal, and the rose last. PillarsSection steps the ground through
# the same five on these same frames, so petal and screen always agree.
#
# NOTE THE KEYS ARE POSITION LABELS the grouper assigned, not verticals. The
# petal keyed 'welcome' is simply the leftmost one and now wears Heal green.
# Read the position, not the key.
HAND_WINDOW = [0.0, 0.07]
# The first 0.10 of the scrub belongs to the HALL'S THRESHOLD — the seal is
# still landing and the entrance panel is still leaving. Nothing of the flower
# may start before it, which is why these do not begin at 0.20 any more. The
# last petal keeps its 0.82 start and each window is 0.13 rather than 0.14, so
# the shift is absorbed by the early windows and the tail is untouched.
WINDOWS = {'welcome': [0.24, 0.37], 'heal': [0.385, 0.515], 'enrich': [0.53, 0.66], 'empower': [0.675, 0.805], 'projects': [0.82, 0.95]}

# ---------------------------------------------------------------- the vector

svg = SVG.read_text()
paths = []
for attrs in re.findall(r'<path\b(.*?)>', svg, re.S):
    fill = (re.search(r'fill="([^"]+)"', attrs) or [None, ''])[1]
    d = (re.search(r'd="([^"]*)"', attrs, re.S) or [None, ''])[1]
    nums = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]
    if not d or not fill.startswith('#') or len(nums) < 6:
        continue
    xs, ys = np.array(nums[0::2]), np.array(nums[1::2])
    r, g, b = (int(fill[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    paths.append({'fill': fill, 'd': d, 'hue': h * 360, 'sat': s, 'val': v,
                  'pts': np.stack([xs, ys], 1),
                  'bbox': (xs.min(), ys.min(), xs.max(), ys.max())})
print(f'{len(paths)} coloured paths', file=sys.stderr)

# --------------------------------------------------------- the two seals fit

def navy_ring_svg():
    """The seal's dark ring in the vector file, as bbox."""
    cand = [p for p in paths if 200 < p['hue'] < 245 and p['sat'] > 0.5
            and p['val'] < 0.65]
    boxes = np.array([p['bbox'] for p in cand])
    return boxes[:, 0].min(), boxes[:, 1].min(), boxes[:, 2].max(), boxes[:, 3].max()


def navy_ring_png():
    im = Image.open(ROOT.parent / 'sncf-logo.png').convert('RGB')
    hsv = np.asarray(im.convert('HSV'), dtype=float)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    ys, xs = np.nonzero((hue > 200) & (hue < 240) & (sat > 0.55) & (val < 0.65))
    keep = (ys > 150) & (ys < 820)          # the seal, not the wordmarks
    ys, xs = ys[keep], xs[keep]
    return xs.min(), ys.min(), xs.max(), ys.max()


sx0, sy0, sx1, sy1 = navy_ring_svg()
px0, py0, px1, py1 = navy_ring_png()
SCALE = ((px1 - px0) / (sx1 - sx0) + (py1 - py0) / (sy1 - sy0)) / 2
OFF = ((px0 + px1) / 2 - (sx0 + sx1) / 2 * SCALE,
       (py0 + py1) / 2 - (sy0 + sy1) / 2 * SCALE)
print(f'vector -> raster: x{SCALE:.4f} + {OFF[0]:.1f},{OFF[1]:.1f}', file=sys.stderr)
to_png = lambda p: p * SCALE + OFF

# ------------------------------------------------------------- the reference

def label8(m):
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


def masks_from(crop_path, origin, bands, min_px=200, dots=False):
    """Pixel clouds from a raster crop, in logo-pixel coordinates. With
    `dots`, the small round shapes are returned as clouds of their own —
    they are separate shapes in the seal, so a path lying on one is nowhere
    near its figure and would otherwise be rejected."""
    im = Image.open(crop_path).convert('RGB')
    hsv = np.asarray(im.convert('HSV'), dtype=float)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    sel = (sat > 0.25) & (val > 0.25)
    H, W = hue.shape
    out = {}
    for name, (h0, h1) in bands.items():
        lab, n = label8(sel & (hue >= h0) & (hue < h1))
        best, best_n = None, 0
        for cid in range(1, n + 1):
            comp = lab == cid
            npx = int(comp.sum())
            ys, xs = np.nonzero(comp)
            if npx < min_px or npx < best_n:
                continue
            if ys.min() == 0 or xs.min() == 0 or ys.max() == H - 1 or xs.max() == W - 1:
                continue                       # the ring, clipped by the crop
            best, best_n = comp, npx
        if best is None:
            continue
        ys, xs = np.nonzero(best)
        pick = slice(None, None, max(1, len(ys) // 4000))   # sampling is plenty
        out[name] = np.stack([xs[pick] + origin[0], ys[pick] + origin[1]], 1).astype(float)

        if dots:
            for cid in range(1, n + 1):
                comp = lab == cid
                npx = int(comp.sum())
                ys, xs = np.nonzero(comp)
                if not (40 < npx < 900) or comp is best:
                    continue
                if ys.min() == 0 or xs.min() == 0 or ys.max() == H - 1 or xs.max() == W - 1:
                    continue
                w, h = xs.max() - xs.min(), ys.max() - ys.min()
                if max(w, h) / max(1, min(w, h)) > 1.4:
                    continue                    # not a head
                out[f'dot:{name}:{cid}'] = np.stack(
                    [xs + origin[0], ys + origin[1]], 1).astype(float)
    return out


def curl_reference():
    """The thumb curl. It cannot be picked out as the largest blue shape —
    its channel runs into the seal's blue rim, so the two trace as one — but
    closing the palm seals that channel, and the blue inside the sealed palm
    is the curl."""
    im = Image.open(HAND_CROP[0]).convert('RGB')
    hsv = np.asarray(im.convert('HSV'), dtype=float)
    hue, sat = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255
    lab, _ = label8((sat > 0.2) & (hue > 280) & (hue < 355))
    palm_m = lab == int(np.argmax(np.bincount(lab.ravel())[1:]) + 1)
    m = palm_m.copy()
    for _ in range(20):
        pad = np.pad(m, 1, constant_values=False)
        m = (pad[1:-1, 1:-1] | pad[:-2, 1:-1] | pad[2:, 1:-1]
             | pad[1:-1, :-2] | pad[1:-1, 2:])
    for _ in range(20):
        pad = np.pad(m, 1, constant_values=True)
        m = (pad[1:-1, 1:-1] & pad[:-2, 1:-1] & pad[2:, 1:-1]
             & pad[1:-1, :-2] & pad[1:-1, 2:])
    blue = (sat > 0.2) & (hue > 170) & (hue < 250) & m & ~palm_m
    lb, _ = label8(blue)
    comp = lb == int(np.argmax(np.bincount(lb.ravel())[1:]) + 1)
    ys, xs = np.nonzero(comp)
    return np.stack([xs + HAND_CROP[1][0], ys + HAND_CROP[1][1]], 1).astype(float)


figures = masks_from(LOTUS_CROP[0], LOTUS_CROP[1], CLASSES, dots=True)
missing = set(CLASSES) - set(figures)
if missing:
    sys.exit(f'figures not found: {sorted(missing)}')

# A head belongs to the figure it floats over.
owner_of = {}
for key in [k for k in figures if k.startswith('dot:')]:
    c = figures[key].mean(0)
    owner_of[key] = min(CLASSES, key=lambda f: np.hypot(*(figures[f] - c).T).min())
print('heads ->', {k.split(':')[1]: owner_of[k] for k in owner_of}, file=sys.stderr)
hand_ref = masks_from(HAND_CROP[0], HAND_CROP[1], {'palm': (280, 355)}, min_px=400)
hand_ref['curl'] = curl_reference()
print('reference clouds:', {k: len(v) for k, v in
                            {**figures, **hand_ref}.items()}, file=sys.stderr)

# ------------------------------------------------------------------ the disc

def seal_disc():
    """The seal's inner white disc, in the vector file's units.

    Measured as the reach of the white inside the ring rather than by fitting
    the white region itself: the two hands cut across the disc, so its pixels
    are not a circle, but the FURTHEST white pixel from the seal's centre
    still lands on the ring's inner edge."""
    im = Image.open(ROOT.parent / 'sncf-logo.png').convert('RGB')
    hsv = np.asarray(im.convert('HSV'), dtype=float)
    sat, val = hsv[..., 1] / 255, hsv[..., 2] / 255
    cx, cy = (px0 + px1) / 2, (py0 + py1) / 2
    ys, xs = np.nonzero((val > 0.93) & (sat < 0.08))
    d = np.hypot(xs - cx, ys - cy)
    inner = d < (px1 - px0) / 2          # inside the ring
    r = float(np.quantile(d[inner], 0.999))
    return ((cx - OFF[0]) / SCALE, (cy - OFF[1]) / SCALE, r / SCALE)


SEAL_DISC = seal_disc()
print('seal disc: centre %.1f,%.1f radius %.1f' % SEAL_DISC, file=sys.stderr)

# ------------------------------------------------------------------ classify

def nearest(cloudset, pts_png):
    """Which cloud this path sits on: the one closest to most of its points."""
    votes = {}
    for name, cloud in cloudset.items():
        d = np.sqrt(((pts_png[:, None, :] - cloud[None, :, :]) ** 2).sum(-1)).min(1)
        votes[name] = float(np.median(d))
    return min(votes, key=votes.get), votes


def sample(p, k=24):
    pts = p['pts']
    step = max(1, len(pts) // k)
    return to_png(pts[::step])


LOTUS_BOX = (130, 140, 372, 352)
HAND_BOX = (95, 312, 425, 430)


def in_box(p, box):
    x0, y0, x1, y1 = p['bbox']
    return x0 >= box[0] - 6 and y0 >= box[1] - 6 and x1 <= box[2] + 6 and y1 <= box[3] + 6


# A path has to SIT ON the shape it is assigned to. Falling inside the
# emblem's bounding box is not enough — the seal's rim, its upper hand and
# the letters of CHARITABLE FOUNDATION all cross those boxes, and without
# this test they ride along into the petals as floating debris.
MAX_GAP = 5.0        # logo pixels

def excluded(p):
    return any(p['fill'].upper() == fill.upper()
               and all(abs(a - b) < 2 for a, b in zip(p['bbox'], box))
               for fill, box in EXCLUDE)


petals = {name: [] for name in NAMES.values()}
palm, curl, dropped, cut = [], [], 0, 0
for p in paths:
    if p['sat'] < 0.12:
        continue
    if excluded(p):
        cut += 1
        continue
    if in_box(p, LOTUS_BOX):
        who, votes = nearest(figures, sample(p))
        if votes[who] > MAX_GAP:
            dropped += 1
            continue
        petals[NAMES[owner_of.get(who, who)]].append(p)
    elif in_box(p, HAND_BOX):
        who, votes = nearest(hand_ref, sample(p))
        if votes[who] > MAX_GAP:
            dropped += 1
            continue
        (curl if who == 'curl' else palm).append(p)

for k, v in petals.items():
    print(f'  {k}: {len(v)} paths', file=sys.stderr)
print(f'  palm: {len(palm)} paths, curl: {len(curl)} paths, '
      f'{dropped} dropped as not on any shape, {cut} excluded by name',
      file=sys.stderr)
if cut != len(EXCLUDE):
    sys.exit(f'EXCLUDE matched {cut} of {len(EXCLUDE)} paths — the art moved')

# --------------------------------------------------------------------- emit

kept = [p for v in petals.values() for p in v] + palm + curl
box = np.array([p['bbox'] for p in kept])
ex0, ey0 = box[:, 0].min(), box[:, 1].min()
ex1, ey1 = box[:, 2].max(), box[:, 3].max()

# The disc is drawn around what WE draw, not around the whole seal: the seal's
# own circle also holds the upper hand, and centred on our emblem it would
# leave a bare white crescent where that hand should be. Same idea, same snug
# proportion — the seal's content fills its disc to within a few percent — but
# sized to the lotus and the palm.
# The disc holds the FLOWER, and the palm holds the disc. Sizing it to the
# whole emblem instead pushes it out past the hand, which is the one thing it
# must not do — in the seal the circle is what the hand carries.
fbox = np.array([p['bbox'] for v in petals.values() for p in v])
fx0, fy0, fx1, fy1 = (fbox[:, 0].min(), fbox[:, 1].min(),
                      fbox[:, 2].max(), fbox[:, 3].max())
dcx, dcy = (fx0 + fx1) / 2, (fy0 + fy1) / 2
# Set by hand, not derived: 115 sits just inside the flower's own reach, so
# the outermost tips break the circle's edge as they do in the seal.
DISC = (dcx, dcy, 115.0)
print('disc on the palm: centre %.1f,%.1f radius %.1f  (flower reaches %.1f; '
      'the seal\'s own disc is %.1f, around both hands)'
      % (*DISC, float(np.hypot(fx1 - dcx, fy1 - dcy)), SEAL_DISC[2]),
      file=sys.stderr)

pad = 10
vx0 = min(ex0, DISC[0] - DISC[2]) - pad
vy0 = min(ey0, DISC[1] - DISC[2]) - pad
vx1 = max(ex1, DISC[0] + DISC[2]) + pad
vy1 = max(ey1, DISC[1] + DISC[2]) + pad

# The point the petals converge on, carried over from the raster work
# (logo pixel 514, 536) and expressed in the vector file's own units.
BASE = ((514 - OFF[0]) / SCALE, (536 - OFF[1]) / SCALE)


def shapes(group):
    return ('[\n'
            + ''.join("      { fill: '%s', d: '%s' },\n"
                      % (p['fill'], ' '.join(p['d'].split()))
                      for p in group)
            + '    ]')


L = ["/* GENERATED — run `python3 tools/build-logo-shapes.py` to rebuild.",
     ' *',
     " * The seal's own vector art, grouped so it can be animated: outlines and",
     ' * colours come straight from sncf-logo-only.svg (no tracing, no colour',
     ' * matching), and every path is assigned to the petal or the hand it sits',
     ' * on by position. Coordinates are the file\'s own — the component',
     ' * translates the emblem and pivots each petal about BASE instead. */',
     '',
     'export interface LogoShape {',
     '  fill: string;',
     '  d: string;',
     '}',
     '',
     'export interface LogoPetal {',
     '  id: string;',
     '  /** Unit vector from the base out along this petal. */',
     '  dir: { x: number; y: number };',
     "  /** This petal's leading ink — the colour its beam carries. */",
     '  tone: string;',
     "  /** [start, end] window of the section's scroll this petal blooms in. */",
     '  window: [number, number];',
     '  shapes: LogoShape[];',
     '}',
     '',
     f"export const LOGO_VIEWBOX = '{vx0:.0f} {vy0:.0f} {vx1 - vx0:.0f} {vy1 - vy0:.0f}';",
     f'export const LOGO_ASPECT = {(vx1 - vx0) / (vy1 - vy0):.4f};',
     '/** The point every petal unfolds about, in the file\'s own units. */',
     'export const LOGO_BASE = { x: %.1f, y: %.1f };' % BASE,
     '',
     "/** The seal's inner white disc, which the emblem settles into. */",
     'export const LOGO_DISC = { cx: %.1f, cy: %.1f, r: %.1f };' % DISC,
     '',
     'export const LOGO_PETALS: LogoPetal[] = [']
for name in PAINT_ORDER:
    group = petals[name]
    c = np.array([p['pts'].mean(0) for p in group]).mean(0)
    v = c - np.array(BASE)
    v = v / (np.hypot(*v) or 1)
    lead = max(group, key=lambda q: (q['bbox'][2] - q['bbox'][0])
               * (q['bbox'][3] - q['bbox'][1]))
    L += ['  {', f"    id: '{name}',",
          '    dir: { x: %.4f, y: %.4f },' % (v[0], v[1]),
          f"    tone: '{lead['fill']}',",
          f'    window: [{WINDOWS[name][0]}, {WINDOWS[name][1]}],',
          f'    shapes: {shapes(group)},', '  },']
L += ['];', '',
      '/** The cupping hand the flower opens out of, and the thumb curl on it. */',
      'export const LOGO_HAND = {',
      f'  window: [{HAND_WINDOW[0]}, {HAND_WINDOW[1]}] as [number, number],',
      f'  palm: {shapes(palm)},',
      f'  curl: {shapes(curl)},',
      '};', '']

TARGET.write_text('\n'.join(L))
print(f'wrote {TARGET.relative_to(ROOT)} '
      f'({TARGET.stat().st_size // 1024} KB), viewBox '
      f'{vx0:.0f} {vy0:.0f} {vx1 - vx0:.0f} {vy1 - vy0:.0f}', file=sys.stderr)
