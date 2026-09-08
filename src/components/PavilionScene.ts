import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createFrameClock } from '../utils/frameClock';
import { pillarModelUrl } from '../utils/modelAssets';
import { createBookOpening } from '../utils/bookOpening';
import { PAVILION_GALLERY, pavilionPhase } from '../data/pavilionGallery';

/** One modest scene for the whole walk. No post-processing or real-time shadows. */
export function createPavilion(host: HTMLElement) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.dataset.renderer = 'pavilion';
  host.append(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color('#c9d7d3');
  scene.fog = new T.Fog('#c9d7d3', 28, 95);
  const camera = new T.PerspectiveCamera(48, 1, .1, 130);
  scene.add(new T.HemisphereLight('#eff8ff', '#686252', 2.5));
  const sun = new T.DirectionalLight('#fff2d5', 3.2);
  sun.position.set(-10, 18, 10); scene.add(sun);
  const fill = new T.DirectionalLight('#bedad9', 1.2);
  fill.position.set(7, 5, -40); scene.add(fill);
  const stone = new T.MeshStandardMaterial({ color: '#e3ddcd', roughness: .85 });
  const trim = new T.MeshStandardMaterial({ color: '#a69c88', roughness: .7 });
  const pale = new T.MeshStandardMaterial({ color: '#f6f0de', roughness: .7 });
  const bronze = new T.MeshStandardMaterial({ color: '#88724b', roughness: .4, metalness: .55 });
  const leaf = new T.MeshStandardMaterial({ color: '#3f6751', roughness: 1 });
  const box = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 20);
  const sphere = new T.IcosahedronGeometry(1, 1);
  const put = (geometry: T.BufferGeometry, material: T.Material, pos: number[], scale: number[]) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]); scene.add(mesh); return mesh;
  };
  put(box, stone, [0, -.2, -90], [25, .4, 320]);
  // A continuous stone promenade, open to planted courtyards on both sides.
  put(box, pale, [0, .012, -90], [8, .03, 320]);
  for (let z = 68; z > -250; z -= 4) put(box, trim, [0, .032, z], [8, .009, .015]);
  for (const x of [-3.9, 3.9]) put(box, bronze, [x, .04, -90], [.035, .01, 320]);
  for (let z = 63; z > -243; z -= 9) {
    for (const x of [-5.5, 5.5]) {
      put(cylinder, stone, [x, 3.5, z], [.34, 7, .34]);
      put(box, pale, [x, .16, z], [1, .32, 1]);
      put(box, pale, [x, 6.8, z], [1.05, .4, 1.05]);
      put(box, trim, [x, 7.2, z], [.8, .35, 9.1]);
    }
    put(box, pale, [0, 7.05, z], [12.1, .38, .8]);
    // Low garden beds and clustered foliage keep the open-air depth tangible.
    for (const x of [-9, 9]) {
      put(box, trim, [x, .2, z], [3.5, .4, 5]);
      put(cylinder, bronze, [x, 1.8, z], [.09, 3.2, .09]);
      for (let j = 0; j < 4; j++) put(sphere, leaf, [x + Math.sin(j * 2) * .7, 2.9 + (j % 2) * .65, z + Math.cos(j * 2) * .65], [1.05, .95, 1.1]);
    }
  }
  // Reusable soft contact shadows, baked into a tiny procedural texture.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(28,34,27,.35)'); gradient.addColorStop(1, 'rgba(28,34,27,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const texture = new T.CanvasTexture(shadowCanvas);
  const shadowMaterial = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const plane = new T.PlaneGeometry(1, 1);
  const models: T.Group[] = [];
  const spots: T.SpotLight[] = [];
  const pools: T.Mesh[] = [];
  const photoTextures: T.Texture[] = [];
  const photoFrames: { material: T.MeshBasicMaterial; src: string; loaded: boolean }[][] = [];
  let book: ReturnType<typeof createBookOpening>, bookVisible = false;
  let disposed = false, active = false, reduced = false, paused = false, target = 0, current = 0, elapsed = 0;
  const ids = ['heal', 'enrich', 'empower', 'projects'];
  const disposeModel = (model: T.Object3D) => model.traverse(child => {
    if (child instanceof T.Mesh) { child.geometry.dispose(); for (const material of Array.isArray(child.material) ? child.material : [child.material]) material.dispose(); }
  });
  ids.forEach((id, i) => {
    const z = -i * 60, side = i % 2 === 0 ? 1 : -1, x = 2.6 * side;
    put(cylinder, pale, [x, .55, z], [1.6, 1.1, 1.6]);
    put(cylinder, bronze, [x, 1.105, z], [1.58, .035, 1.58]);
    const shadow = put(plane, shadowMaterial, [x, 1.13, z], [3.8, 3.8, 1]); shadow.rotation.x = -Math.PI / 2;
    const spot = new T.SpotLight('#fff2cf', 0, 15, Math.PI / 7, .75, 1);
    spot.position.set(x, 6.5, z + 1.4); spot.target.position.set(x, 2.7, z); scene.add(spot, spot.target); spots.push(spot);
    put(cylinder, bronze, [x, 6.65, z + 1.4], [.2, .3, .2]);
    const pool = put(cylinder, new T.MeshBasicMaterial({ color: '#ffebbc', transparent: true, opacity: 0, depthWrite: false }), [x, 1.14, z], [1.45, .01, 1.45]); pools.push(pool);
    const pivot = new T.Group(); pivot.position.set(x, 3, z); scene.add(pivot); models.push(pivot);
    photoFrames[i] = [];
    PAVILION_GALLERY[i].forEach((photo, n) => {
      const photoSide = n % 2 === 0 ? -1 : 1;
      const frame = new T.Group(); frame.position.set(photoSide * 4.65, 3.1, z + 52 - n * 8); frame.rotation.y = -photoSide * .85; scene.add(frame);
      const backing = new T.Mesh(box, bronze); backing.scale.set(3.7, 2.75, .12); frame.add(backing);
      const mat = new T.MeshBasicMaterial({ color: '#e5dfd0', toneMapped: false });
      const photoPlane = new T.Mesh(plane, mat); photoPlane.scale.set(3.42, 2.45, 1); photoPlane.position.z = .075; frame.add(photoPlane);
      if (photo.src) photoFrames[i].push({ material: mat, src: photo.src, loaded: false });
      else {
        const label = document.createElement('canvas'); label.width = 512; label.height = 256;
        const pen = label.getContext('2d')!; pen.fillStyle = '#e5dfd0'; pen.fillRect(0, 0, 512, 256);
        pen.fillStyle = '#466055'; pen.textAlign = 'center'; pen.font = '18px sans-serif'; pen.fillText(`${id.toUpperCase()} / ${String(n + 1).padStart(2, '0')}`, 256, 100);
        pen.font = '15px sans-serif'; pen.fillText('Photograph to be added', 256, 145);
        const map = new T.CanvasTexture(label); map.colorSpace = T.SRGBColorSpace; mat.map = map; photoTextures.push(map);
      }
    });
    new GLTFLoader().load(pillarModelUrl(id), ({ scene: model }) => {
      if (disposed) { disposeModel(model); return; }
      const bounds = new T.Box3().setFromObject(model), size = bounds.getSize(new T.Vector3());
      model.position.sub(bounds.getCenter(new T.Vector3()));
      const wrapper = new T.Group(); wrapper.add(model); wrapper.scale.setScalar(2.9 / Math.max(size.x, size.y, size.z));
      if (id === 'enrich') book = createBookOpening(model);
      pivot.add(wrapper); draw();
    }, undefined, () => { /* The HTML exhibit retains all content if its model fails. */ });
  });
  // A circular reflecting pool closes the walk, under the final open canopy.
  put(cylinder, bronze, [0, .09, -226], [3.5, .16, 3.5]);
  put(cylinder, new T.MeshStandardMaterial({ color: '#5f9b9b', metalness: .45, roughness: .2 }), [0, .19, -226], [3.35, .03, 3.35]);
  const stops = [new T.Vector3(0, 2.6, 65), ...ids.map((_, i) => new T.Vector3((i % 2 === 0 ? -1 : 1) * .9, 2.5, 7.5 - i * 60)), new T.Vector3(0, 3.1, -215)];
  const looks = [new T.Vector3(0, 2.8, 40), ...ids.map((_, i) => new T.Vector3((i % 2 === 0 ? 1 : -1) * 1.8, 2.7, -i * 60)), new T.Vector3(0, 1.4, -227)];
  const look = new T.Vector3();
  function draw() {
    if (disposed || !active) return;
    if (book) {
      const viewingBook = current > 1.76 && current < 2.15;
      if (viewingBook && !bookVisible) book.restart(!paused && !reduced);
      if (reduced) book.finish();
      bookVisible = viewingBook;
    }
    const index = Math.min(4, Math.floor(current)), fraction = Math.min(1, current - index);
    const travel = index < 4 ? Math.min(1, fraction / .82) : fraction;
    const smooth = travel * travel * (3 - 2 * travel);
    camera.position.lerpVectors(stops[index], stops[index + 1], smooth);
    look.lerpVectors(looks[index], looks[index + 1], smooth); camera.lookAt(look);
    models.forEach((model, i) => {
      const phase = pavilionPhase(current);
      const arriving = phase.room === i && !phase.gallery ? phase.arrival : 0;
      const reveal = arriving * arriving * (3 - 2 * arriving);
      model.rotation.y = -.15 + Math.sin(elapsed * .25 + i) * .35;
      model.position.y = 2.65 + reveal * .35 + Math.sin(elapsed * .7 + i) * .09;
      model.scale.setScalar(.72 + reveal * .38);
      model.visible = Math.abs(camera.position.z + i * 60) < 70;
      spots[i].intensity = reveal * 32;
      (pools[i].material as T.MeshBasicMaterial).opacity = reveal * .22;
    });
    const room = pavilionPhase(current).room;
    // Prepare the next passage while visitors pause at the current exhibit.
    const visibleRooms = current - room > .65 ? [room, room + 1] : [room];
    for (const item of visibleRooms.flatMap(index => photoFrames[index] ?? [])) if (!item.loaded) {
      item.loaded = true;
      new T.TextureLoader().load(item.src, map => {
        if (disposed) { map.dispose(); return; }
        map.colorSpace = T.SRGBColorSpace;
        const imageAspect = map.image.width / map.image.height, frameAspect = 3.42 / 2.45;
        if (imageAspect > frameAspect) { map.repeat.x = frameAspect / imageAspect; map.offset.x = (1 - map.repeat.x) / 2; }
        else { map.repeat.y = imageAspect / frameAspect; map.offset.y = (1 - map.repeat.y) / 2; }
        item.material.map = map; item.material.color.set('#ffffff'); item.material.needsUpdate = true; photoTextures.push(map);
        if (!document.hidden) renderer.render(scene, camera);
      }, undefined, () => { /* Keep the frame if its archive image is unavailable. */ });
    }
    renderer.render(scene, camera);
  }
  const clock = createFrameClock(delta => {
    current = reduced ? target : T.MathUtils.damp(current, target, 8, delta);
    if (!paused && !reduced) { elapsed += delta; if (bookVisible) book?.advance(delta); }
    draw();
    if ((paused || reduced || target < .1 || target > 4.9) && Math.abs(target - current) < .001) {
      clock.stop(); renderer.domElement.dataset.renderState = 'paused';
    }
  }, 30);
  const sync = () => {
    clock.stop();
    if (!active || document.hidden) bookVisible = false;
    renderer.domElement.dataset.renderState = 'paused';
    if (active && !document.hidden) {
      draw();
      if (!reduced && !paused && target >= .1 && target <= 4.9 || Math.abs(target - current) > .001) {
        renderer.domElement.dataset.renderState = 'running'; clock.start();
      }
    }
  };
  const resize = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const ratio = Math.min(1, 1440 / w);
    renderer.setSize(w * ratio, h * ratio, false); camera.aspect = w / h; camera.updateProjectionMatrix(); draw();
  });
  resize.observe(host); document.addEventListener('visibilitychange', sync);
  const lost = (event: Event) => { event.preventDefault(); clock.stop(); host.dataset.failed = 'true'; };
  const restored = () => { delete host.dataset.failed; sync(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  return {
    update(progress: number, visible: boolean, calm: boolean, stopped: boolean) {
      const changed = active !== visible || reduced !== calm || paused !== stopped;
      target = Math.max(0, Math.min(5, progress)); active = visible; reduced = calm; paused = stopped;
      if (reduced) current = Math.round(target);
      if (changed) sync();
      else if (active && !document.hidden) {
        if (reduced) draw();
        else if (!paused && target >= .1 && target <= 4.9 || Math.abs(target - current) > .001) {
          renderer.domElement.dataset.renderState = 'running'; clock.start();
        }
      }
    },
    dispose() {
      disposed = true; clock.stop(); resize.disconnect(); document.removeEventListener('visibilitychange', sync);
      renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.domElement.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
      scene.traverse(child => { if (child instanceof T.Mesh) { geometries.add(child.geometry); for (const m of Array.isArray(child.material) ? child.material : [child.material]) materials.add(m); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); photoTextures.forEach(map => map.dispose()); texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
