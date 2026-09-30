import {
  AdditiveBlending, BufferAttribute, CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial,
  PlaneGeometry, Points, PointsMaterial, SRGBColorSpace, type BufferGeometry, type Object3D,
} from 'three';

/**
 * THE BOOK, OPENED — AND DRESSED.
 *
 * The supplied Enrich model is two hinged covers with a flat white page on
 * each. This animates its spine hinges (without deforming covers or pages)
 * and, because a blank grey book says little about learning, dresses it:
 *
 *  - the PAGES become paper — cream, faintly ruled, a chapter ornament at
 *    the head, a gutter shadow toward the spine, and the foundation's own
 *    mark as a watermark on the right-hand page;
 *  - LEAVES mid-turn fan out of the spine as the book opens, translucent
 *    paper standing between the two pages, swaying a little after;
 *  - MOTES of warm light rise from the open pages and fade — ideas leaving
 *    the book — respawning as they go.
 *
 * Everything is procedural (canvas textures, plane geometry, a point cloud)
 * so the GLB stays the foundation's file as supplied. The dressing joins
 * the model's own group, so the renderer's disposal frees it with the rest.
 */
const PAGE = /white[ _]open[ _]page/i;
const LEFT = /book[ _]left[ _]hinge/i, RIGHT = /book[ _]right[ _]hinge/i;
const LEAF_ANGLES = [-.5, -.95, -1.4, -1.85, -2.3];
const MOTES = 32;

/** A small deterministic random, so the dressing is the same on every visit. */
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

/** Paper for one page: ruled, with a head ornament and a shadow toward the gutter. */
function paper(side: 'left' | 'right', mark: HTMLImageElement | null) {
  const canvas = document.createElement('canvas');
  const W = canvas.width = 512, H = canvas.height = 768;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f7f0e2'; ctx.fillRect(0, 0, W, H);
  const random = seeded(side === 'left' ? 7 : 11);
  ctx.fillStyle = 'rgba(120, 100, 70, .07)';
  for (let i = 0; i < 900; i++) { ctx.fillRect(random() * W, random() * H, 1.5, 1.5); }
  /* the head ornament: a double rule with a diamond */
  const ink = 'rgba(48, 92, 112, .32)';
  ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(70, 92); ctx.lineTo(W / 2 - 22, 92); ctx.moveTo(W / 2 + 22, 92); ctx.lineTo(W - 70, 92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(70, 98); ctx.lineTo(W / 2 - 22, 98); ctx.moveTo(W / 2 + 22, 98); ctx.lineTo(W - 70, 98); ctx.stroke();
  ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(W / 2, 87); ctx.lineTo(W / 2 + 8, 95); ctx.lineTo(W / 2, 103); ctx.lineTo(W / 2 - 8, 95); ctx.closePath(); ctx.fill();
  /* the rules */
  ctx.strokeStyle = 'rgba(48, 92, 112, .13)'; ctx.lineWidth = 1;
  for (let y = 150; y < H - 70; y += 36) { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(W - 64, y); ctx.stroke(); }
  /* the margin, on the outer edge */
  ctx.strokeStyle = 'rgba(196, 84, 112, .22)'; ctx.lineWidth = 1.2;
  const margin = side === 'left' ? 92 : W - 92;
  ctx.beginPath(); ctx.moveTo(margin, 130); ctx.lineTo(margin, H - 60); ctx.stroke();
  /* the mark, faint, on the right-hand page */
  if (mark && side === 'right') {
    ctx.save(); ctx.globalAlpha = .13;
    const size = 300; ctx.drawImage(mark, W / 2 - size / 2, H / 2 - size / 2 + 40, size, size * (mark.naturalHeight / Math.max(1, mark.naturalWidth)));
    ctx.restore();
  }
  /* the gutter: a shadow toward the spine */
  const gutter = ctx.createLinearGradient(side === 'left' ? W - 110 : 110, 0, side === 'left' ? W : 0, 0);
  gutter.addColorStop(0, 'rgba(40, 62, 70, 0)'); gutter.addColorStop(1, 'rgba(40, 62, 70, .26)');
  ctx.fillStyle = gutter; ctx.fillRect(side === 'left' ? W - 110 : 0, 0, 110, H);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** UVs from the page's own bounds, so the paper lands square whatever the file's mapping. */
function planarUVs(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position');
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < position.count; i++) { const x = position.getX(i), y = position.getY(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) { uv[i * 2] = (position.getX(i) - x0) / Math.max(1e-6, x1 - x0); uv[i * 2 + 1] = (position.getY(i) - y0) / Math.max(1e-6, y1 - y0); }
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  return { x0, x1, y0, y1 };
}

/** A soft round sprite for the motes. */
function spark() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255, 244, 214, 1)'); glow.addColorStop(.35, 'rgba(255, 228, 168, .55)'); glow.addColorStop(1, 'rgba(255, 220, 150, 0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createBookOpening(root: Object3D) {
  let left: Object3D | undefined, right: Object3D | undefined;
  const pages: Mesh[] = [];
  root.traverse(node => {
    if (PAGE.test(node.name)) node.traverse(part => { if (part instanceof Mesh) pages.push(part); });
    if (LEFT.test(node.name)) left = node;
    if (RIGHT.test(node.name)) right = node;
  });
  if (!left || !right) return undefined;
  /* The dressing needs a canvas and images; without a DOM (the node tests)
     the book still opens, its pages simply set to unlit white as supplied. */
  const dom = typeof document !== 'undefined' && typeof Image !== 'undefined';

  /* the paper */
  const textures: { side: 'left' | 'right'; texture: CanvasTexture }[] = [];
  let bounds = { x0: -1.27, x1: 1.28, y0: -.83, y1: 1.08 };
  for (const page of pages) {
    const b = planarUVs(page.geometry);
    bounds = { x0: Math.min(bounds.x0, b.x0), x1: Math.max(bounds.x1, b.x1), y0: Math.min(bounds.y0, b.y0), y1: Math.max(bounds.y1, b.y1) };
    const side: 'left' | 'right' = (b.x0 + b.x1) / 2 < 0 ? 'left' : 'right';
    if (!dom) {
      for (const material of Array.isArray(page.material) ? page.material : [page.material]) {
        if (!(material instanceof MeshBasicMaterial)) continue;
        material.color.set(0xffffff); material.toneMapped = false;
        material.polygonOffset = true; material.polygonOffsetFactor = -1; material.polygonOffsetUnits = -4; material.needsUpdate = true;
      }
      continue;
    }
    const texture = paper(side, null);
    textures.push({ side, texture });
    const old = Array.isArray(page.material) ? page.material : [page.material];
    old.forEach(material => material.dispose());
    page.material = new MeshBasicMaterial({ map: texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  }
  if (dom) {
    const mark = new Image();
    mark.onload = () => { for (const { side, texture } of textures) { if (side !== 'right') continue; const fresh = paper(side, mark); texture.image = fresh.image; texture.needsUpdate = true; fresh.dispose(); } };
    mark.src = '/images/sncf-mark.svg';
  }
  const leaves: Mesh[] = [];
  let cloud: Points | null = null;
  const random = seeded(3);
  const motes = new Float32Array(MOTES * 3);
  const speed = new Float32Array(MOTES), phase = new Float32Array(MOTES);
  const spawn = (i: number, fromBottom: boolean) => {
    motes[i * 3] = bounds.x0 + random() * (bounds.x1 - bounds.x0);
    motes[i * 3 + 1] = fromBottom ? bounds.y0 + random() * .3 : bounds.y0 + random() * (bounds.y1 - bounds.y0);
    motes[i * 3 + 2] = .06 + random() * .25;
    speed[i] = .16 + random() * .22; phase[i] = random() * Math.PI * 2;
  };
  if (dom) {
  /* the leaves mid-turn, fanning out of the spine */
  const dressing = new Group();
  dressing.name = 'Book dressing';
  const leafWidth = Math.min(1.0, bounds.x1 * .8), leafHeight = (bounds.y1 - bounds.y0) * .9;
  const leafGeometry = new PlaneGeometry(leafWidth, leafHeight, 18, 1);
  leafGeometry.translate(leafWidth / 2, (bounds.y0 + bounds.y1) / 2, 0);
  {
    const position = leafGeometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) { const u = position.getX(i) / leafWidth; position.setZ(i, .16 * u * u + .05 * Math.sin(u * Math.PI)); }
    leafGeometry.computeVertexNormals();
  }
  const leafPaper = textures.find(t => t.side === 'left')?.texture ?? paper('left', null);
  LEAF_ANGLES.forEach((angle, i) => {
    const leaf = new Mesh(leafGeometry, new MeshBasicMaterial({ map: leafPaper, transparent: true, opacity: .34 - i * .03, side: DoubleSide, depthWrite: false, toneMapped: false }));
    leaf.rotation.y = angle;
    dressing.add(leaf);
    leaves.push(leaf);
  });

  /* the motes: warm light rising from the pages */
  for (let i = 0; i < MOTES; i++) spawn(i, false);
  cloud = new Points(
    (() => { const g = new PlaneGeometry(0, 0); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g.setIndex(null); g.setAttribute('position', new BufferAttribute(motes, 3)); return g; })(),
    /* world-sized, so a mote is the same fraction of the book at any render size: ~5px at the hero's, ~3px in a medallion */
    new PointsMaterial({ map: spark(), size: .3, sizeAttenuation: true, color: 0xffd98a, transparent: true, opacity: .8, depthWrite: false, blending: AdditiveBlending, toneMapped: false }),
  );
  dressing.add(cloud);
  root.add(dressing);
  }

  /* the opening */
  const leftBase = left.rotation.y, rightBase = right.rotation.y;
  const duration = 2.5;
  let elapsed = duration, time = 0;
  const eased = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const apply = () => {
    const angleAt = (delay: number) => (1 - eased(Math.max(0, Math.min(1, (elapsed - delay) / (duration - delay))))) * Math.PI * .43;
    left!.rotation.y = leftBase + angleAt(0);
    right!.rotation.y = rightBase - angleAt(.08);
    /* the leaves rise with the book — all upright while it is shut, fanning as it opens — then sway */
    const open = eased(Math.max(0, Math.min(1, (elapsed - .3) / (duration - .3))));
    leaves.forEach((leaf, i) => { leaf.rotation.y = -Math.PI / 2 + (LEAF_ANGLES[i] + Math.PI / 2) * open + Math.sin(time * .7 + i * 1.1) * .045 * open; });
  };
  const drift = (delta: number) => {
    if (!cloud) return;
    const position = cloud.geometry.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < MOTES; i++) {
      motes[i * 3 + 1] += speed[i] * delta;
      motes[i * 3] += Math.sin(time * 1.3 + phase[i]) * .0025;
      motes[i * 3 + 2] += .12 * delta;
      if (motes[i * 3 + 1] > bounds.y1 + .25) spawn(i, true);
    }
    position.needsUpdate = true;
  };
  apply();
  return {
    restart(animate = true) { elapsed = animate ? 0 : duration; apply(); },
    advance(delta: number) {
      time += delta;
      if (elapsed < duration) elapsed = Math.min(duration, elapsed + delta);
      apply(); drift(delta);
    },
    finish() { elapsed = duration; apply(); },
  };
}
