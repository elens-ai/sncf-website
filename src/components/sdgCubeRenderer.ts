import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createFrameClock } from '../utils/frameClock';

/**
 * ONE GOAL'S BOX, turning in the flags' window (SdgRow): the foundation's
 * printed box for the goal (public/models/sdg, a unit cube standing on the
 * origin, built by `npm run models:sdg-boxes`), seen a little from above so
 * its lid shows, lit as the boxes' own preview lights them (a room's light, a
 * soft key light, neutral tone mapping, so the UN's colours stay true). One
 * renderer serves the row's one window; it turns only while the window is
 * open, and not at all where motion is unwelcome.
 */
const SPIN = .9; // rad/s
const ELEVATION = T.MathUtils.degToRad(20);

export interface SdgCubeView { show(goal: number): void; play(on: boolean): void; dispose(): void }

const modelUrl = (goal: number) => `/models/sdg/sdg-${String(goal).padStart(2, '0')}.glb`;

export function attachSdgCube(host: HTMLElement, ready: (goal: number) => void): SdgCubeView {
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NeutralToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  host.append(canvas);

  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  room.dispose(); pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = .8;
  const key = new T.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 5, 4);
  scene.add(key);
  const pivot = new T.Group();
  scene.add(pivot);
  /* framed so the box, at any turn (1.41 across its corners) and with its lid, fits the window */
  const camera = new T.PerspectiveCamera(26, 1, .1, 50);
  const target = new T.Vector3(0, .5, 0);
  camera.position.copy(target).add(new T.Vector3(0, Math.sin(ELEVATION), Math.cos(ELEVATION)).multiplyScalar(3.5));
  camera.lookAt(target);

  const loader = new GLTFLoader();
  const models = new Map<number, Promise<T.Object3D>>();
  const load = (goal: number) => {
    let model = models.get(goal);
    if (!model) {
      model = loader.loadAsync(modelUrl(goal)).then(({ scene: root }) => {
        root.traverse(node => {
          const mesh = node as T.Mesh;
          if (!mesh.isMesh) return;
          for (const material of [mesh.material].flat()) {
            const map = (material as T.MeshStandardMaterial).map;
            if (map) map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          }
        });
        return root;
      });
      models.set(goal, model);
    }
    return model;
  };

  let wanted = 0, angle = -.5, disposed = false;
  const draw = () => { pivot.rotation.y = angle; renderer.render(scene, camera); };
  const clock = createFrameClock(delta => { angle += delta * SPIN; draw(); }, 60);
  const size = () => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  };
  const resize = new ResizeObserver(size);
  resize.observe(host);
  size();

  return {
    show(goal) {
      wanted = goal;
      load(goal).then(model => {
        if (disposed || wanted !== goal) return;
        pivot.clear();
        pivot.add(model.clone());
        draw();
        ready(goal);
      }).catch(error => console.warn(`Unable to load the box for goal ${goal}`, error));
    },
    play(on) {
      if (on && !still.matches) clock.start();
      else { clock.stop(); draw(); }
    },
    dispose() {
      disposed = true;
      clock.stop();
      resize.disconnect();
      for (const model of models.values()) void model.then(root => root.traverse(node => {
        const mesh = node as T.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const material of [mesh.material].flat()) {
          for (const value of Object.values(material)) if (value instanceof T.Texture) value.dispose();
          material.dispose();
        }
      }), () => {});
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
