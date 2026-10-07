/**
 * Builds a 3D box for each of the 17 UN Sustainable Development Goals, as the
 * foundation's print dieline folds them.
 *
 *   npm run models:sdg-boxes     writes exports/sdg-boxes/
 *
 * Each box is a cube: the goal's icon on all four sides and on the lid, and
 * the "Sustainable Development Goals" logo on a white base. The faces are
 * turned as the dieline turns them, so every side reads upright, the lid
 * reads from the front, and the base's logo has its top along the front edge.
 * sdg-01.glb … sdg-17.glb are one box each; sdg-boxes-all.glb stands all
 * seventeen in the poster's rows of six. A box is one unit along each edge,
 * standing on the origin: scale it to the printed size where that matters.
 *
 * The artwork is the UN's own, from its SDG communications page
 * (un.org/sustainabledevelopment/news/communications-material): tools/sdg/
 * goal-NN.png are its "SDG icons" (web), sdg-logo.png its square logo without
 * the UN emblem. The UN allows them for informational use under its SDG
 * guidelines; fundraising or commercial use needs its permission. Sharp is
 * the backend's (the site has none).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SDGS } from '../src/data/sdgs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(import.meta.url)(join(root, 'backend/node_modules/sharp'));
const art = join(root, 'tools/sdg');
const out = join(root, 'exports/sdg-boxes');

const TEXTURE = 1024;       // px per face: a power of two, so every viewer mipmaps it
const LOGO_WIDTH = 0.72;    // of the base's width, as on the dieline
const PER_ROW = 6;          // the SDG poster's rows
const GAP = 0.5;            // between boxes in the all-goals file, in box edges
const ROUGHNESS = 0.6;      // matte printed board

const pad2 = (n: number) => String(n).padStart(2, '0');

/* ---- the cube ----------------------------------------------------------- */

type V3 = [number, number, number];
/** A face: its centre, and the directions its artwork's right and top point in. */
interface Face { centre: V3; right: V3; up: V3 }

/* Seen from outside, right × up is the outward normal, so no face is mirrored. */
const SIDES: Face[] = [
  { centre: [0, 0.5, 0.5], right: [1, 0, 0], up: [0, 1, 0] },     // front
  { centre: [0.5, 0.5, 0], right: [0, 0, -1], up: [0, 1, 0] },    // right
  { centre: [0, 0.5, -0.5], right: [-1, 0, 0], up: [0, 1, 0] },   // back
  { centre: [-0.5, 0.5, 0], right: [0, 0, 1], up: [0, 1, 0] },    // left
  { centre: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },        // lid, read from the front
];
const BASE: Face[] = [{ centre: [0, 0, 0], right: [1, 0, 0], up: [0, 0, 1] }];

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Quads for the faces, wound counter-clockwise from outside; glTF's UV origin is the image's top left. */
const geometry = (faces: Face[]) => {
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const { centre, right, up } of faces) {
    const normal = cross(right, up), first = positions.length / 3;
    for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      positions.push(...centre.map((c, i) => c + (s * right[i] + t * up[i]) / 2));
      normals.push(...normal);
      uvs.push((s + 1) / 2, (1 - t) / 2);
    }
    indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
  }
  return { positions, normals, uvs, indices };
};

/* ---- glTF binary --------------------------------------------------------- */

/** One .glb: its JSON and the binary chunk it points into. */
class Glb {
  json: Record<string, any[]> & { asset?: object; scene?: number } = {
    bufferViews: [], accessors: [], images: [], samplers: [], textures: [], materials: [], meshes: [], nodes: [], scenes: [],
  };
  private chunks: Buffer[] = [];
  private length = 0;

  private view(data: Buffer, target?: number) {
    const padding = (4 - (this.length % 4)) % 4;
    if (padding) { this.chunks.push(Buffer.alloc(padding)); this.length += padding; }
    this.json.bufferViews.push({ buffer: 0, byteOffset: this.length, byteLength: data.length, ...(target ? { target } : {}) });
    this.chunks.push(data);
    this.length += data.length;
    return this.json.bufferViews.length - 1;
  }

  private accessor(values: number[], type: 'SCALAR' | 'VEC2' | 'VEC3', withBounds = false) {
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
    const isIndex = type === 'SCALAR';
    const data = isIndex ? Buffer.from(new Uint16Array(values).buffer) : Buffer.from(new Float32Array(values).buffer);
    const bounds = withBounds
      ? { min: [0, 1, 2].map(i => Math.min(...values.filter((_, j) => j % size === i))), max: [0, 1, 2].map(i => Math.max(...values.filter((_, j) => j % size === i))) }
      : {};
    this.json.accessors.push({
      bufferView: this.view(data, isIndex ? 34963 : 34962),
      componentType: isIndex ? 5123 : 5126, count: values.length / size, type, ...bounds,
    });
    return this.json.accessors.length - 1;
  }

  /** The faces' geometry, to share between every mesh that uses it. */
  primitive(faces: Face[]) {
    const g = geometry(faces);
    return {
      attributes: { POSITION: this.accessor(g.positions, 'VEC3', true), NORMAL: this.accessor(g.normals, 'VEC3'), TEXCOORD_0: this.accessor(g.uvs, 'VEC2') },
      indices: this.accessor(g.indices, 'SCALAR'),
    };
  }

  /** A matte printed material showing the PNG. */
  material(name: string, png: Buffer) {
    if (!this.json.samplers.length) this.json.samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 });
    this.json.images.push({ bufferView: this.view(png), mimeType: 'image/png', name });
    this.json.textures.push({ sampler: 0, source: this.json.images.length - 1 });
    this.json.materials.push({
      name,
      pbrMetallicRoughness: { baseColorTexture: { index: this.json.textures.length - 1 }, metallicFactor: 0, roughnessFactor: ROUGHNESS },
    });
    return this.json.materials.length - 1;
  }

  toBuffer() {
    this.json.asset = { version: '2.0', generator: 'sncf-website scripts/build-sdg-boxes.ts' };
    this.json.scene = 0;
    for (const key of Object.keys(this.json)) if (Array.isArray(this.json[key]) && !this.json[key].length) delete this.json[key];
    const bin = Buffer.concat(this.chunks);
    (this.json as any).buffers = [{ byteLength: bin.length }];
    const chunk = (data: Buffer, type: number, fill: number) => {
      const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4, fill);
      data.copy(padded);
      const head = Buffer.alloc(8);
      head.writeUInt32LE(padded.length, 0);
      head.writeUInt32LE(type, 4);
      return Buffer.concat([head, padded]);
    };
    const body = Buffer.concat([chunk(Buffer.from(JSON.stringify(this.json)), 0x4e4f534a, 0x20), chunk(bin, 0x004e4942, 0)]);
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(12 + body.length, 8);
    return Buffer.concat([header, body]);
  }
}

/* ---- the artwork --------------------------------------------------------- */

const icon = (goal: number): Promise<Buffer> =>
  sharp(join(art, `goal-${pad2(goal)}.png`)).resize(TEXTURE, TEXTURE, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();

const base = async (): Promise<Buffer> => {
  const logo = await sharp(join(art, 'sdg-logo.png')).resize({ width: Math.round(TEXTURE * LOGO_WIDTH), kernel: 'lanczos3' }).toBuffer();
  return sharp({ create: { width: TEXTURE, height: TEXTURE, channels: 3, background: '#ffffff' } })
    .composite([{ input: logo, gravity: 'centre' }]).png({ compressionLevel: 9 }).toBuffer();
};

/* ---- the boxes ----------------------------------------------------------- */

const goals = Object.values(SDGS).sort((a, b) => a.goal - b.goal);
const icons = await Promise.all(goals.map(sdg => icon(sdg.goal)));
const basePng = await base();

const label = (goal: number) => `SDG ${pad2(goal)} · ${SDGS[goal].name}`;
const extras = (goal: number) => ({ goal, name: SDGS[goal].name, color: SDGS[goal].color });

/** Adds one goal's box to a file, sharing its geometry and base. */
const addBox = (glb: Glb, shared: { sides: object; base: object; baseMaterial: number }, index: number, translation?: V3) => {
  const { goal } = goals[index];
  glb.json.meshes.push({
    name: label(goal),
    primitives: [{ ...shared.sides, material: glb.material(`SDG ${pad2(goal)} print`, icons[index]) }, { ...shared.base, material: shared.baseMaterial }],
  });
  glb.json.nodes.push({ name: label(goal), mesh: glb.json.meshes.length - 1, ...(translation ? { translation } : {}), extras: extras(goal) });
  return glb.json.nodes.length - 1;
};

const newFile = () => {
  const glb = new Glb();
  return { glb, shared: { sides: glb.primitive(SIDES), base: glb.primitive(BASE), baseMaterial: glb.material('SDG base', basePng) } };
};

mkdirSync(out, { recursive: true });

goals.forEach((sdg, index) => {
  const { glb, shared } = newFile();
  glb.json.scenes.push({ name: label(sdg.goal), nodes: [addBox(glb, shared, index)] });
  writeFileSync(join(out, `sdg-${pad2(sdg.goal)}.glb`), glb.toBuffer());
});

/* all seventeen, in rows of six read from the back row forward, centred on the origin */
const all = newFile();
const pitch = 1 + GAP, rows = Math.ceil(goals.length / PER_ROW);
const children = goals.map((_, index) => addBox(all.glb, all.shared, index, [
  ((index % PER_ROW) - (PER_ROW - 1) / 2) * pitch, 0, (Math.floor(index / PER_ROW) - (rows - 1) / 2) * pitch,
]));
all.glb.json.nodes.push({ name: 'SDG boxes', children });
all.glb.json.scenes.push({ name: 'SDG boxes', nodes: [all.glb.json.nodes.length - 1] });
writeFileSync(join(out, 'sdg-boxes-all.glb'), all.glb.toBuffer());

console.log(`wrote ${goals.length} boxes and sdg-boxes-all.glb to ${out}`);
