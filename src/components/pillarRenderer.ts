import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createFrameClock } from '../utils/frameClock';
import { pillarModelUrl } from '../utils/modelAssets';
import { createBookOpening } from '../utils/bookOpening';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';

type ViewState = { active: boolean; animate: boolean; visible: boolean };
export interface ModelView { update(state: Partial<ViewState>): void; dispose(): void }
/** How a model is coloured: as its file paints it, or deepened for a white
    ground — the hero's plates want the dark one, the mosaic's medallions on
    their dark water want the light one. Posters are kept per look. */
export type Look = 'light' | 'dark';
type Tint = { material: T.MeshStandardMaterial; light: T.Color; dark: T.Color };
type Asset = {
  pivot: T.Group; extent: number; elapsed: number; phase: number; tints: Tint[]; look: Look;
  poster: Partial<Record<Look, string>>; book?: ReturnType<typeof createBookOpening>;
};
type Client = ViewState & {
  host: HTMLElement; id: string; assetKey: string; look: Look; poster: (url: string) => void; live: (value: boolean) => void;
  rotation: () => number;
};

/** The dark look, derived from each material's own colour so every model
    keeps its hue: saturated colours drop to a deep, richer tone; whites and
    pale tints only dim a little, so pages and rims still read on white. */
function deepen(color: T.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl, T.SRGBColorSpace);
  const pale = hsl.s < .25 && hsl.l > .8;
  const s = pale ? hsl.s : Math.min(1, hsl.s * 1.1 + .05);
  const l = pale ? .9 : Math.min(.34, Math.max(.14, hsl.l * .5));
  return new T.Color().setHSL(hsl.h, s, l, T.SRGBColorSpace);
}
function collectTints(root: T.Group) {
  const tints: Tint[] = [];
  const seen = new Set<T.Material>();
  root.traverse(object => {
    const mesh = object as T.Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const standard = material as T.MeshStandardMaterial;
      if (seen.has(material) || !standard.color || standard.map) continue;
      seen.add(material);
      tints.push({ material: standard, light: standard.color.clone(), dark: deepen(standard.color) });
    }
  });
  return tints;
}

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
    if (!this.current || this.lost || !pageIsActive(this.current.host)) { this.stop(); return; }
    const asset = this.assets.get(this.current.assetKey)!;
    asset.elapsed += delta;
    asset.book?.advance(delta);
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
    document.addEventListener(PAGE_ACTIVITY_EVENT, this.sync);
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
  paint(asset: Asset, pixels: number, rotation = 0, look: Look = 'light') {
    if (asset.look !== look) {
      for (const tint of asset.tints) tint.material.color.copy(tint[look]);
      asset.look = look;
    }
    for (const value of this.assets.values()) value.pivot.visible = value === asset;
    const t = asset.elapsed;
    asset.pivot.rotation.y = -.18 + Math.sin(t * .42 + asset.phase) * .42 + rotation;
    asset.pivot.rotation.x = .08 + Math.sin(t * .45 + asset.phase) * .035;
    asset.pivot.position.y = Math.sin(t * .8 + asset.phase) * .065;
    this.camera.left = this.camera.bottom = -asset.extent;
    this.camera.right = this.camera.top = asset.extent;
    this.camera.updateProjectionMatrix();
    if (this.renderer.domElement.width !== pixels) this.renderer.setSize(pixels, pixels, false);
    this.renderer.render(this.scene, this.camera);
  }
  snapshot(asset: Asset, rotation = 0, look: Look = 'light') {
    asset.book?.finish();
    this.paint(asset, 384, rotation, look);
    const poster = asset.poster[look] = this.renderer.domElement.toDataURL('image/png');
    for (const client of this.clients) if (this.assets.get(client.assetKey) === asset && client.look === look) client.poster(poster);
  }
  async load(id: string, url: string, assetKey: string) {
    if (this.loads.has(assetKey)) return this.loads.get(assetKey);
    const promise = new GLTFLoader().loadAsync(url).then(({ scene: model }) => {
      if (this.disposed || ![...this.clients].some(client => client.assetKey === assetKey)) { release(model); this.loads.delete(assetKey); return; }
      if (id === 'sncf-emblem') {
        // Preserve the official artwork's colours; only the rounded rim receives studio lighting.
        const faces = new Map<T.MeshStandardMaterial, T.MeshBasicMaterial>();
        model.traverse(node => {
          if (!(node instanceof T.Mesh)) return;
          const original = Array.isArray(node.material) ? node.material : [node.material];
          const materials = original.map(material => {
            if (!(material instanceof T.MeshStandardMaterial) || !material.map) return material;
            if (!faces.has(material)) faces.set(material, new T.MeshBasicMaterial({ map: material.map, toneMapped: false, side: material.side }));
            return faces.get(material)!;
          });
          node.material = Array.isArray(node.material) ? materials : materials[0];
        });
        for (const material of faces.keys()) material.dispose();
      }
      const bounds = new T.Box3().setFromObject(model);
      model.position.sub(bounds.getCenter(new T.Vector3()));
      const size = bounds.getSize(new T.Vector3());
      const radius = Math.hypot(size.x, size.z) / 2;
      const pivot = new T.Group(); pivot.add(model);
      const asset: Asset = {
        pivot, extent: Math.max(size.y / 2 + radius * .14 + .1, radius) * 1.015, elapsed: 0, phase: id === 'heal' ? 0 : id === 'enrich' ? 1.8 : 3.6,
        tints: collectTints(model), look: 'light', poster: {},
      };
      if (id === 'enrich' && url.includes('/models/core-values/')) {
        // Keep the supplied icon intact; extra animated paper planes overlap
        // its white pages and make the centre flicker as the model turns.
        model.traverse(node => {
          if (!(node instanceof T.Mesh) || !/white[ _]open[ _]page/i.test(node.name)) return;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(material => {
            if (material instanceof T.MeshBasicMaterial || material instanceof T.MeshStandardMaterial) {
              material.color.set('#f8f8ff');
              material.toneMapped = false;
              const tint = asset.tints.find(entry => entry.material === material);
              tint?.light.copy(material.color);
              tint?.dark.copy(material.color);
            }
            material.polygonOffset = true;
            material.polygonOffsetFactor = -1;
            material.polygonOffsetUnits = -4;
            material.depthWrite = true;
            material.transparent = false;
            material.opacity = 1;
            material.needsUpdate = true;
          });
        });
      } else if (id === 'enrich') asset.book = createBookOpening(model);
      this.assets.set(assetKey, asset); this.scene.add(pivot);
      if (!this.lost) for (const look of new Set([...this.clients].filter(client => client.assetKey === assetKey).map(client => client.look))) this.snapshot(asset, 0, look);
      this.sync();
    }).catch(error => console.warn(`Unable to load ${id} model`, error));
    this.loads.set(assetKey, promise);
    return promise;
  }
  sync = () => {
    if (this.disposed || this.lost) return;
    this.stop();
    const next = [...this.clients].find(c => c.active && c.visible && pageIsActive(c.host) && this.assets.has(c.assetKey));
    if (this.current !== next) {
      if (this.current) {
        const asset = this.assets.get(this.current.assetKey);
        if (asset) this.snapshot(asset, this.current.rotation(), this.current.look);
        this.current.live(false);
      }
      this.current = next;
      if (next) this.assets.get(next.assetKey)?.book?.restart(next.animate);
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
    const asset = this.assets.get(this.current.assetKey)!;
    // A larger CSS icon must never allocate a multi-megapixel render target.
    this.paint(asset, this.pixels, this.current.rotation(), this.current.look);
  }
  dispose() {
    this.disposed = true; this.stop();
    document.removeEventListener('visibilitychange', this.sync);
    document.removeEventListener(PAGE_ACTIVITY_EVENT, this.sync);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onRestored);
    for (const asset of this.assets.values()) release(asset.pivot);
    this.environment.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
function release(root: T.Group) {
  const textures = new Set<T.Texture>();
  root.traverse(object => {
    const mesh = object as T.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
      material.dispose();
    }
  });
  for (const texture of textures) texture.dispose();
}
let shared: PillarRenderer | undefined;
let cleanup: ReturnType<typeof setTimeout> | undefined;
export function attachModel(host: HTMLElement, id: string, poster: Client['poster'], live: Client['live'], rotation: Client['rotation'] = () => 0, url = pillarModelUrl(id), look: Look = 'light'): ModelView {
  clearTimeout(cleanup);
  const renderer = shared ??= new PillarRenderer();
  const assetKey = `${id}:${url}`;
  const client: Client = { host, id, assetKey, look, poster, live, rotation, active: false, animate: false, visible: false };
  renderer.clients.add(client);
  const loaded = renderer.assets.get(assetKey);
  const cached = loaded?.poster[look];
  if (cached) poster(cached);
  else if (loaded && !renderer.lost) renderer.snapshot(loaded, 0, look);
  void renderer.load(id, url, assetKey);
  const observer = new ResizeObserver(() => { if (renderer.current === client) renderer.sync(); });
  observer.observe(host);
  return {
    update(state) { Object.assign(client, state); renderer.sync(); },
    dispose() {
      observer.disconnect(); renderer.clients.delete(client);
      if (renderer.current === client) renderer.current = undefined;
      renderer.sync();
      if (![...renderer.clients].some(other => other.assetKey === assetKey)) {
        const asset = renderer.assets.get(assetKey);
        if (asset) { renderer.scene.remove(asset.pivot); release(asset.pivot); renderer.assets.delete(assetKey); renderer.loads.delete(assetKey); }
      }
      if (!renderer.clients.size) cleanup = setTimeout(() => {
        renderer.dispose(); if (shared === renderer) shared = undefined;
      }, 0);
    },
  };
}
