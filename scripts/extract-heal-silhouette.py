"""Extract the front-face outline directly from the shipped Heal GLB."""
import json
import struct
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[1]
blob = (root / 'public/models/heal.glb').read_bytes()
length = struct.unpack_from('<I', blob, 12)[0]
doc = json.loads(blob[20:20 + length])
data = blob[28 + length:]

def accessor(index):
    a = doc['accessors'][index]
    view = doc['bufferViews'][a['bufferView']]
    count = {'VEC3': 3, 'SCALAR': 1}[a['type']]
    fmt = {5126: 'f', 5123: 'H', 5125: 'I'}[a['componentType']]
    offset = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = view.get('byteStride', struct.calcsize(fmt) * count)
    return [struct.unpack_from('<' + fmt * count, data, offset + i * stride) for i in range(a['count'])]

paths = []
for mesh in doc['meshes']:
    primitive = mesh['primitives'][0]
    vertices = accessor(primitive['attributes']['POSITION'])
    indices = [v[0] for v in accessor(primitive['indices'])]
    front = max(p[2] for p in vertices)
    edges = Counter()
    for i in range(0, len(indices), 3):
        tri = [vertices[j] for j in indices[i:i + 3]]
        if not all(abs(p[2] - front) < 1e-5 for p in tri):
            continue
        points = [tuple(round(v, 6) for v in p[:2]) for p in tri]
        for j in range(3):
            edges[tuple(sorted((points[j], points[(j + 1) % 3])))] += 1
    boundary = {edge for edge, count in edges.items() if count == 1}
    while boundary:
        start, current = boundary.pop()
        loop = [start, current]
        while current != start:
            edge = next(e for e in boundary if current in e)
            boundary.remove(edge)
            current = edge[1] if edge[0] == current else edge[0]
            loop.append(current)
        # GLB nodes invert Y; SVG's downwards Y restores the source coordinates.
        coords = [(round((x + 1.8) * 40, 3), round((y + 1.55) * 40, 3)) for x, y in loop]
        paths.append('M' + 'L'.join(f'{x} {y}' for x, y in coords) + 'Z')
assert len(paths) == 4, 'Expected the four connected Heal leaves'
(root / 'src/components/healModelOutline.ts').write_text(
    '// Generated from public/models/heal.glb by scripts/extract-heal-silhouette.py.\n'
    '// Exact front-face boundaries, including the natural cutout in the upper leaf.\n'
    'export const HEAL_MODEL_OUTLINE = ' + json.dumps(paths, indent=2) + ';\n')
print('Extracted', len(paths), 'exact model outlines')
