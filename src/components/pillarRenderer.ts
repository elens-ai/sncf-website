import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createFrameClock } from '../utils/frameClock';

type ViewState = { active: boolean; animate: boolean; visible: boolean };
export interface ModelView { update(state: Partial<ViewState>): void; dispose(): void }
type Asset = { pivot: T.Group; extent: number; elapsed: number; phase: number; poster?: string };
type Client = ViewState & {
  host: HTMLElement; id: string; poster: (url: string) => void; live: (value: boolean) => void;
};

// One GPU context, lighting environment and clock for the entire carousel.
// Side cards float as cached renders; only the centre needs live shading.
class PillarRenderer {
  renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  scene = new T.Scene();
  camera = new T.OrthographicCamera(-2, 2, 2, -2, .1, 50);
  environment: T.WebGLRenderTarget;
  clients = new Set<Client>();
  assets = new Map<string, Asset>();
  loads = new Map<string, Promise<void>>();
  current: Client | undefined;
  clock = createFrameClock(delta => {
    if (!this.current || this.lost || document.hidden) { this.stop(); return; }
    this.assets.get(this.current.id)!.elapsed += delta;
    this.drawCurrent();
  });
  disposed = false;
  lost = false;
  pixels = 384;
  constructor() {
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.dataset.renderer = 'shared-pillars';
    this.camera.position.z = 10;
    const room = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, .04);
    room.dispose(); pmrem.dispose();
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .65;
    this.scene.add(new T.HemisphereLight(0xffffff, 0x727782, .65));
    const key = new T.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 5, 6);
    const rim = new T.DirectionalLight(0xffffff, 1.5);
    rim.position.set(4, 2, -4);
    this.scene.add(key, rim);
    document.addEventListener('visibilitychange', this.sync);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onRestored);
  }
  onLost = (event: Event) => {
    event.preventDefault(); this.lost = true; this.stop();
    this.current?.live(false);
    this.renderer.domElement.style.visibility = 'hidden';
  };
  onRestored = () => {
    this.lost = false;
    this.renderer.domElement.style.visibility = 'visible';
    this.sync();
  };
  stop() {
    this.clock.stop();
    this.renderer.domElement.dataset.renderState = 'paused';
  }
  paint(asset: Asset, pixels: number) {
    for (const value of this.assets.values()) value.pivot.visible = value === asset;
    const t = asset.elapsed;
    asset.pivot.rotation.y = -.18 + Math.sin(t * .42 + asset.phase) * .42;
    asset.pivot.rotation.x = .08 + Math.sin(t * .45 + asset.phase) * .035;
    asset.pivot.position.y = Math.sin(t * .8 + asset.phase) * .065;
    this.camera.left = this.camera.bottom = -asset.extent;
    this.camera.right = this.camera.top = asset.extent;
    this.camera.updateProjectionMatrix();
    if (this.renderer.domElement.width !== pixels) this.renderer.setSize(pixels, pixels, false);
    this.renderer.render(this.scene, this.camera);
  }
  snapshot(asset: Asset) {
    this.paint(asset, 384);
    asset.poster = this.renderer.domElement.toDataURL('image/png');
    for (const client of this.clients) if (this.assets.get(client.id) === asset) client.poster(asset.poster);
  }
  async load(id: string) {
    if (this.loads.has(id)) return this.loads.get(id);
    const promise = new GLTFLoader().loadAsync(`/models/${id}.glb`).then(({ scene: model }) => {
      if (this.disposed) { release(model); return; }
      const bounds = new T.Box3().setFromObject(model);
      model.position.sub(bounds.getCenter(new T.Vector3()));
      const size = bounds.getSize(new T.Vector3());
      const radius = Math.hypot(size.x, size.z) / 2;
      const pivot = new T.Group(); pivot.add(model);
      const asset: Asset = { pivot, extent: Math.max(size.y / 2 + radius * .14 + .1, radius) * 1.015, elapsed: 0, phase: id === 'heal' ? 0 : id === 'enrich' ? 1.8 : 3.6 };
      this.assets.set(id, asset); this.scene.add(pivot);
      if (!this.lost) this.snapshot(asset);
      this.sync();
    }).catch(error => console.warn(`Unable to load ${id} model`, error));
    this.loads.set(id, promise);
    return promise;
  }
  sync = () => {
    if (this.disposed || this.lost) return;
    this.stop();
    const next = document.hidden ? undefined : [...this.clients].find(c => c.active && c.visible && this.assets.has(c.id));
    if (this.current !== next) {
      if (this.current) {
        const asset = this.assets.get(this.current.id);
        if (asset) this.snapshot(asset);
        this.current.live(false);
      }
      this.current = next;
    }
    if (!next) { this.renderer.domElement.remove(); return; }
    next.host.appendChild(this.renderer.domElement);
    this.pixels = Math.min(768, Math.max(128, Math.round(next.host.clientWidth * Math.min(devicePixelRatio, 1.25))));
    this.drawCurrent(); next.live(true);
    if (next.animate) {
      this.renderer.domElement.dataset.renderState = 'running';
      this.clock.start();
    }
  };
  drawCurrent() {
    if (!this.current) return;
    const asset = this.assets.get(this.current.id)!;
    // A larger CSS icon must never allocate a multi-megapixel render target.
    this.paint(asset, this.pixels);
  }
  dispose() {
    this.disposed = true; this.stop();
    document.removeEventListener('visibilitychange', this.sync);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onRestored);
    for (const asset of this.assets.values()) release(asset.pivot);
    this.environment.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
function release(root: T.Group) {
  root.traverse(object => {
    const mesh = object as T.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
  });
}
let shared: PillarRenderer | undefined;
let cleanup: ReturnType<typeof setTimeout> | undefined;
export function attachModel(host: HTMLElement, id: string, poster: Client['poster'], live: Client['live']): ModelView {
  clearTimeout(cleanup);
  const renderer = shared ??= new PillarRenderer();
  const client: Client = { host, id, poster, live, active: false, animate: false, visible: false };
  renderer.clients.add(client);
  const cached = renderer.assets.get(id)?.poster;
  if (cached) poster(cached);
  void renderer.load(id);
  const observer = new ResizeObserver(() => { if (renderer.current === client) renderer.sync(); });
  observer.observe(host);
  return {
    update(state) { Object.assign(client, state); renderer.sync(); },
    dispose() {
      observer.disconnect(); renderer.clients.delete(client);
      if (renderer.current === client) renderer.current = undefined;
      renderer.sync();
      if (!renderer.clients.size) cleanup = setTimeout(() => {
        renderer.dispose(); if (shared === renderer) shared = undefined;
      }, 0);
    },
  };
}
