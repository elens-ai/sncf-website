import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createFrameClock } from '../utils/frameClock';
import { pillarModelUrl } from '../utils/modelAssets';
import { createBookOpening } from '../utils/bookOpening';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';
import { PAVILION_GALLERY, pavilionExhibitReveal } from '../data/pavilionGallery';

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
  const studio = new RoomEnvironment();
  const environmentGenerator = new T.PMREMGenerator(renderer);
  const environment = environmentGenerator.fromScene(studio, .04);
  scene.environment = environment.texture; scene.environmentIntensity = .4;
  studio.dispose(); environmentGenerator.dispose();
  scene.background = new T.Color('#d6d0c2');
  scene.fog = new T.Fog('#d6d0c2', 34, 100);
  // A corridor needs distance precision, not a macro lens's tiny near plane.
  const camera = new T.PerspectiveCamera(48, 1, .5, 130);
  scene.add(new T.HemisphereLight('#fff5e7', '#555b51', 1.8));
  const sun = new T.DirectionalLight('#fff0d5', 2.4);
  sun.position.set(-10, 18, 10); scene.add(sun);
  const fill = new T.DirectionalLight('#bedad9', 1.2);
  fill.position.set(7, 5, -40); scene.add(fill);
  const stone = new T.MeshStandardMaterial({ color: '#d8cdb8', roughness: .85 });
  const trim = new T.MeshStandardMaterial({ color: '#80745e', roughness: .7 });
  const pale = new T.MeshStandardMaterial({ color: '#f2eadb', roughness: .6 });
  const bronze = new T.MeshStandardMaterial({ color: '#88724b', roughness: .4, metalness: .55 });
  const wall = new T.MeshStandardMaterial({ color: '#bcbcaf', roughness: .9 });
  const walnut = new T.MeshStandardMaterial({ color: '#544738', roughness: .65 });
  const galleryInk = new T.MeshStandardMaterial({ color: '#243e38', roughness: .8 });
  const warmLight = new T.MeshBasicMaterial({ color: '#ffe5b1', toneMapped: false });
  // Small, reusable material textures give the architecture surface detail.
  const surfaceTextures: T.Texture[] = [];
  let seed = 41;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const surface = (wood = false) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const pen = canvas.getContext('2d')!; pen.fillStyle = wood ? '#b3a08a' : '#dfd8ca'; pen.fillRect(0, 0, 256, 256);
    for (let n = 0; n < 7000; n++) {
      pen.fillStyle = `rgba(${wood ? '60,38,20' : '76,65,48'},${random() * (wood ? .09 : .07)})`;
      pen.fillRect(random() * 256, random() * 256, wood ? 30 + random() * 100 : 1.5, .5 + random());
    }
    const map = new T.CanvasTexture(canvas); map.wrapS = map.wrapT = T.RepeatWrapping; map.colorSpace = T.SRGBColorSpace;
    surfaceTextures.push(map); return map;
  };
  const limestone = surface(); limestone.repeat.set(3, 3);
  stone.map = limestone; stone.bumpMap = limestone; stone.bumpScale = .025;
  wall.map = limestone; wall.bumpMap = limestone; wall.bumpScale = .012;
  walnut.map = surface(true); walnut.bumpMap = walnut.map; walnut.bumpScale = .018;
  const floorMaterial = new T.MeshStandardMaterial({ color: '#f4ead9', map: surface(), roughness: .68, metalness: .04 });
  floorMaterial.map!.repeat.set(5, 110);
  const box = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 20);
  const put = (geometry: T.BufferGeometry, material: T.Material, pos: number[], scale: number[]) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]); scene.add(mesh); return mesh;
  };
  put(box, stone, [0, -.2, -90], [25, .4, 320]);
  // A quiet museum promenade: stone, walnut, brass and softly lit display walls.
  put(box, floorMaterial, [0, .012, -90], [8, .03, 320]);
  for (let z = 68; z > -250; z -= 4) put(box, trim, [0, .032, z], [8, .009, .015]);
  for (const x of [-3.9, 3.9]) put(box, bronze, [x, .04, -90], [.035, .01, 320]);
  for (const x of [-1.3, 1.3]) put(box, trim, [x, .032, -90], [.012, .008, 320]);
  for (const x of [-7.2, 7.2]) {
    put(box, wall, [x, 3.5, -90], [.3, 7, 320]);
    put(box, walnut, [x * .97, .4, -90], [.15, .8, 320]);
    put(box, warmLight, [x * .965, .84, -90], [.04, .035, 320]);
  }
  // Static luminous surfaces suggest concealed lighting without extra GPU lights.
  for (const x of [-3.7, 3.7]) {
    put(box, walnut, [x, 6.95, -90], [.22, .16, 320]);
    put(box, warmLight, [x, 6.85, -90], [.09, .035, 320]);
  }
  for (let z = 63; z > -243; z -= 9) {
    for (const x of [-5.5, 5.5]) {
      put(cylinder, stone, [x, 3.5, z], [.34, 7, .34]);
      put(box, pale, [x, .16, z], [1, .32, 1]);
      put(box, pale, [x, 6.8, z], [1.05, .4, 1.05]);
      put(box, trim, [x, 7.2, z], [.8, .35, 9.1]);
    }
    put(box, pale, [0, 7.05, z], [12.1, .38, .8]);
    for (const x of [-6.8, 6.8]) {
      put(box, pale, [x, 3.6, z - 3], [.12, 5.4, 5.7]);
      put(box, warmLight, [x * .99, 6.35, z - 3], [.06, .05, 5.4]);
      if (z % 18 === 9 || z % 18 === -9) {
        put(box, walnut, [x * .88, .55, z - 3], [.9, .18, 2.7]);
        for (const offset of [-.9, .9]) put(box, galleryInk, [x * .88, .25, z - 3 + offset], [.6, .5, .14]);
      }
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
  // Soft baked contact shadows anchor columns and benches without shadow-map passes.
  const contactPoints: [number, number, number, number][] = [];
  for (let z = 63; z > -243; z -= 9) for (const side of [-1, 1]) {
    contactPoints.push([side * 5.5, z, 2.5, 2.5]);
    if (Math.abs(z % 18) === 9) contactPoints.push([side * 6.8 * .88, z - 3, 2, 4]);
  }
  const contacts = new T.InstancedMesh(plane, shadowMaterial, contactPoints.length);
  const contactTransform = new T.Object3D();
  contactPoints.forEach(([x, z, width, depth], i) => {
    contactTransform.position.set(x, .045, z); contactTransform.rotation.set(-Math.PI / 2, 0, 0); contactTransform.scale.set(width, depth, 1); contactTransform.updateMatrix(); contacts.setMatrixAt(i, contactTransform.matrix);
  });
  contacts.instanceMatrix.needsUpdate = true; scene.add(contacts);
  const models: T.Group[] = [];
  const spots: T.SpotLight[] = [];
  const pools: T.Mesh[] = [];
  const photoTextures: T.Texture[] = [];
  const plaque = (title: string, subtitle: string, ink = '#e9ddbf') => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
    const pen = canvas.getContext('2d')!;
    pen.fillStyle = '#213c35'; pen.fillRect(0, 0, 768, 160);
    pen.fillStyle = ink;
    if (subtitle) {
      pen.font = '500 32px sans-serif'; pen.fillText(title, 28, 63, 710);
      pen.fillStyle = '#d5dbcf'; pen.font = '17px sans-serif'; pen.fillText(subtitle, 28, 111, 710);
    } else {
      pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.font = '500 62px sans-serif'; pen.fillText(title, 384, 84, 710);
    }
    const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace; photoTextures.push(map);
    return new T.MeshBasicMaterial({ map, toneMapped: false });
  };
  const photoFrames: { material: T.MeshBasicMaterial; src: string; loaded: boolean; position: T.Vector3 }[][] = [];
  let book: ReturnType<typeof createBookOpening>, bookVisible = false;
  let disposed = false, active = false, reduced = false, paused = false, target = 0, current = 0;
  const modelTimes = [0, 0, 0, 0];
  const finale = new T.Group(); finale.position.set(0, 2.6, -201); finale.visible = false; scene.add(finale);
  let finaleRequested = false, finaleTime = 0;
  const hasLiveExhibit = () => (finale.visible && finale.children.length > 0) || models.some((model, i) => model.visible && pavilionExhibitReveal(current, i) > 0);
  const ids = ['heal', 'enrich', 'empower', 'projects'];
  const disposeModel = (model: T.Object3D) => model.traverse(child => {
    if (child instanceof T.Mesh) { child.geometry.dispose(); for (const material of Array.isArray(child.material) ? child.material : [child.material]) material.dispose(); }
  });
  ids.forEach((id, i) => {
    const z = -i * 60, side = i % 2 === 0 ? 1 : -1, x = 3.5 * side;
    const chapterInks = ['#91d6ae', '#92c8ed', '#e6a4be', '#9cd5da'];
    put(plane, plaque(id.toUpperCase(), '', chapterInks[i]), [0, 5.5, z + 57], [5.2, 1.08, 1]);
    for (const cableX of [-2.2, 2.2]) put(box, bronze, [cableX, 6.4, z + 57], [.025, .75, .025]);
    put(cylinder, pale, [x, .55, z], [1.6, 1.1, 1.6]);
    put(cylinder, galleryInk, [x, .08, z], [1.67, .16, 1.67]);
    put(cylinder, bronze, [x, 1.105, z], [1.58, .035, 1.58]);
    const shadow = put(plane, shadowMaterial, [x, 1.13, z], [3.8, 3.8, 1]); shadow.rotation.x = -Math.PI / 2;
    const spot = new T.SpotLight('#fff5e3', 0, 15, Math.PI / 6, .65, 1);
    spot.position.set(x, 6.5, z + 2.4); spot.target.position.set(x, 3.4, z); scene.add(spot, spot.target); spots.push(spot);
    put(cylinder, bronze, [x, 6.65, z + 2.4], [.2, .3, .2]);
    const pool = put(cylinder, new T.MeshBasicMaterial({ color: '#ffebbc', transparent: true, opacity: 0, depthWrite: false }), [x, 1.14, z], [1.45, .01, 1.45]); pools.push(pool);
    const pivot = new T.Group(); pivot.position.set(x, 3, z); scene.add(pivot); models.push(pivot);
    photoFrames[i] = [];
    PAVILION_GALLERY[i].forEach((photo, n) => {
      const photoSide = n % 2 === 0 ? -1 : 1;
      const frame = new T.Group(); frame.position.set(photoSide * 3.65, 3.1, z + 52 - n * 8); frame.rotation.y = -photoSide * .85; scene.add(frame);
      const backing = new T.Mesh(box, bronze); backing.scale.set(3.7, 2.75, .12); frame.add(backing);
      const mount = new T.Mesh(box, pale); mount.scale.set(3.56, 2.61, .04); mount.position.z = .075; frame.add(mount);
      const mat = new T.MeshBasicMaterial({ color: '#e5dfd0', toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      const photoPlane = new T.Mesh(plane, mat); photoPlane.scale.set(3.26, 2.29, 1); photoPlane.position.z = .13; frame.add(photoPlane);
      const caption = new T.Mesh(plane, plaque(`${String(n + 1).padStart(2, '0')}  ${photo.caption}`, `${id.toUpperCase()}  /  ILLUSTRATIVE PHOTOGRAPHY`, chapterInks[i]));
      caption.position.set(0, -1.68, .1); caption.scale.set(3.6, .66, 1); frame.add(caption);
      const pictureLight = new T.Mesh(box, warmLight); pictureLight.position.set(0, 1.48, .15); pictureLight.scale.set(2.8, .035, .12); frame.add(pictureLight);
      if (photo.src) photoFrames[i].push({ material: mat, src: photo.src, loaded: false, position: frame.position });
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
  put(cylinder, bronze, [0, .09, -201], [3.5, .16, 3.5]);
  put(cylinder, new T.MeshStandardMaterial({ color: '#5f9b9b', metalness: .45, roughness: .2 }), [0, .19, -201], [3.35, .03, 3.35]);
  const stops = [new T.Vector3(0, 2.6, 65), ...ids.map((_, i) => new T.Vector3((i % 2 === 0 ? -1 : 1) * .9, 2.5, 7.5 - i * 60)), new T.Vector3(0, 3.1, -190)];
  const looks = [new T.Vector3(0, 2.8, 40), ...ids.map((_, i) => new T.Vector3(i === 0 ? 1 : i % 2 === 0 ? 1.8 : -1, 2.7, -i * 60)), new T.Vector3(0, 1.4, -202)];
  const look = new T.Vector3();
  const viewFrustum = new T.Frustum(), viewMatrix = new T.Matrix4();
  const exhibitBounds = new T.Sphere(new T.Vector3(), 2.3);
  function draw() {
    if (disposed || !active || !pageIsActive(host)) return;
    // Prepare the closing emblem before the pool comes into sight.
    if (current > 2 && !finaleRequested) {
      finaleRequested = true;
      new GLTFLoader().load('/models/sncf-emblem.glb', ({ scene: emblem }) => {
        if (disposed) { disposeModel(emblem); return; }
        const bounds = new T.Box3().setFromObject(emblem), size = bounds.getSize(new T.Vector3());
        emblem.position.sub(bounds.getCenter(new T.Vector3()));
        const wrapper = new T.Group(); wrapper.add(emblem); wrapper.scale.setScalar(3.4 / Math.max(size.x, size.y, size.z));
        finale.add(wrapper); sync();
      });
    }
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
    camera.updateMatrixWorld();
    viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    exhibitBounds.center.copy(finale.position);
    // It belongs to the scene throughout the approach, not only after the
    // farewell chapter activates. Cull only outside the view / beyond fog.
    finale.visible = camera.position.distanceToSquared(finale.position) < 100 * 100 && viewFrustum.intersectsSphere(exhibitBounds);
    finale.rotation.y = Math.sin(finaleTime * .45) * .16;
    finale.position.y = 2.6 + Math.sin(finaleTime * .8) * .08;
    models.forEach((model, i) => {
      exhibitBounds.center.set(model.position.x, 3.4, -i * 60);
      model.visible = viewFrustum.intersectsSphere(exhibitBounds);
      if (!model.visible) { spots[i].intensity = 0; return; }
      const reveal = pavilionExhibitReveal(current, i);
      const elapsed = modelTimes[i];
      model.rotation.y = -.15 + Math.sin(elapsed * .25 + i) * .35;
      model.position.y = 2.65 + reveal * .75 + Math.sin(elapsed * .7 + i) * .09;
      model.scale.setScalar(.72 + reveal * .38);
      spots[i].intensity = reveal * 42;
      (pools[i].material as T.MeshBasicMaterial).opacity = reveal * .22;
    });
    // Photos must be ready before they emerge from the 100-unit fog, even
    // when their chapter is not yet active. Retain loaded textures on return.
    for (const frames of photoFrames) for (const item of frames) if (!item.loaded && item.position.distanceToSquared(camera.position) < 120 * 120) {
      item.loaded = true;
      new T.TextureLoader().load(item.src, map => {
        if (disposed) { map.dispose(); return; }
        map.colorSpace = T.SRGBColorSpace;
        const imageAspect = map.image.width / map.image.height, frameAspect = 3.26 / 2.29;
        if (imageAspect > frameAspect) { map.repeat.x = frameAspect / imageAspect; map.offset.x = (1 - map.repeat.x) / 2; }
        else { map.repeat.y = imageAspect / frameAspect; map.offset.y = (1 - map.repeat.y) / 2; }
        item.material.map = map; item.material.color.set('#ffffff'); item.material.needsUpdate = true; photoTextures.push(map);
        // Batch simultaneous image completions into the next animation frame.
        if (active && pageIsActive(host)) clock.start();
      }, undefined, () => { /* Keep the frame if its archive image is unavailable. */ });
    }
    renderer.render(scene, camera);
  }
  const clock = createFrameClock(delta => {
    if (!active || !pageIsActive(host)) { clock.stop(); return; }
    current = reduced ? target : T.MathUtils.damp(current, target, 8, delta);
    if (!paused && !reduced) {
      if (finale.visible) finaleTime += delta;
      models.forEach((model, i) => { if (model.visible && pavilionExhibitReveal(current, i) > 0) modelTimes[i] += delta; });
      if (bookVisible) book?.advance(delta);
    }
    draw();
    if ((paused || reduced || !hasLiveExhibit()) && Math.abs(target - current) < .001) {
      clock.stop(); renderer.domElement.dataset.renderState = 'paused';
    }
  }, 30);
  const sync = () => {
    clock.stop();
    if (!active || !pageIsActive(host)) bookVisible = false;
    renderer.domElement.dataset.renderState = 'paused';
    if (active && pageIsActive(host)) {
      draw();
      if (!reduced && !paused && hasLiveExhibit() || Math.abs(target - current) > .001) {
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
  document.addEventListener(PAGE_ACTIVITY_EVENT, sync);
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
      else if (active && pageIsActive(host)) {
        if (reduced) draw();
        else if (!paused && hasLiveExhibit() || Math.abs(target - current) > .001) {
          renderer.domElement.dataset.renderState = 'running'; clock.start();
        }
      }
    },
    dispose() {
      disposed = true; clock.stop(); resize.disconnect(); document.removeEventListener('visibilitychange', sync);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, sync);
      renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.domElement.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
      scene.traverse(child => { if (child instanceof T.Mesh) { geometries.add(child.geometry); for (const m of Array.isArray(child.material) ? child.material : [child.material]) materials.add(m); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); photoTextures.forEach(map => map.dispose()); surfaceTextures.forEach(map => map.dispose()); environment.dispose(); contacts.dispose(); texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
