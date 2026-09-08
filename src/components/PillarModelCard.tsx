import React, { useEffect, useRef, useState } from 'react';
import type { Group, Mesh, WebGLRenderer, WebGLRenderTarget } from 'three';

export const MODEL_PILLARS = new Set(['heal', 'enrich', 'empower', 'projects']);

export function PillarModelCard({ id, label, animate }: { id: string; label: string; animate: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(animate);
  motionRef.current = animate;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let renderer: WebGLRenderer | undefined;
    let model: Group | undefined;
    let environment: WebGLRenderTarget | undefined;
    let resize: ResizeObserver | undefined;
    let visibility: IntersectionObserver | undefined;
    let visible = true;
    let frame = 0;
    setReady(false);
    const release = (root: Group) => root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => material.dispose());
    });

    const load = async () => {
      const [T, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js'),
      ]);
      if (disposed) return;
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0xffffff, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.OrthographicCamera(-2, 2, 2, -2, 0.1, 50);
      camera.position.z = 10;
      const room = new RoomEnvironment();
      const pmrem = new T.PMREMGenerator(renderer);
      environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.65;
      room.dispose();
      pmrem.dispose();
      scene.add(new T.HemisphereLight(0xffffff, 0x727782, 0.65));
      const key = new T.DirectionalLight(0xffffff, 2.5);
      key.position.set(-3, 5, 6);
      scene.add(key);
      const rim = new T.DirectionalLight(0xffffff, 1.5);
      rim.position.set(4, 2, -4);
      scene.add(rim);
      const gltf = await new GLTFLoader().loadAsync(`/models/${id}.glb`);
      if (disposed) { release(gltf.scene); return; }
      model = gltf.scene;
      const bounds = new T.Box3().setFromObject(model);
      model.position.sub(bounds.getCenter(new T.Vector3()));
      const pivot = new T.Group();
      pivot.add(model);
      pivot.rotation.set(0.1, -0.35, 0);
      scene.add(pivot);
      const size = bounds.getSize(new T.Vector3());
      const radius = Math.hypot(size.x, size.z) / 2;
      const resizeCanvas = () => {
        if (!renderer || disposed || !host.clientWidth || !host.clientHeight) return;
        const aspect = host.clientWidth / host.clientHeight;
        // Fit the enlarged canvas, which extends beyond the card's edges.
        const extent = Math.max(size.y / 2 + radius * 0.14 + 0.1, radius / aspect) * 1.015;
        camera.left = -extent * aspect;
        camera.right = extent * aspect;
        camera.top = extent;
        camera.bottom = -extent;
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight, false);
        renderer.render(scene, camera);
      };
      resize = new ResizeObserver(resizeCanvas);
      resize.observe(host);
      visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      visibility.observe(host);
      resizeCanvas();
      setReady(true);
      let lastTime = 0;
      let elapsed = 0;
      const phase = id === 'heal' ? 0 : id === 'enrich' ? 1.8 : 3.6;
      const tick = (time: number) => {
        if (disposed) return;
        frame = requestAnimationFrame(tick);
        if (time - lastTime < 1000 / 60) return;
        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        if (!visible || document.hidden || !motionRef.current) return;
        elapsed += delta;
        // Gentle sculptural movement keeps each mark readable while the
        // showcase itself supplies the larger forward/backward transition.
        pivot.rotation.y = -0.18 + Math.sin(elapsed * 0.42 + phase) * 0.42;
        pivot.rotation.x = 0.08 + Math.sin(elapsed * 0.45 + phase) * 0.035;
        pivot.position.y = Math.sin(elapsed * 0.8 + phase) * 0.065;
        renderer?.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);
    };
    void load().catch((error) => { if (!disposed) console.warn(`Unable to load ${id} model`, error); });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      visibility?.disconnect();
      if (model) release(model);
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
  }, [id]);

  return (
    <div className="relative w-full h-full overflow-visible pointer-events-none" role="img" aria-label={`${label} floating 3D icon`}>
      {!ready && id !== 'projects' && <img src={`/images/vertical-${id}.webp`} alt="" className="absolute w-[60%] left-[20%] top-1/2 -translate-y-1/2 rounded-full" />}
      <div key="model-canvas" ref={hostRef} className="absolute -inset-[22%] z-[1]" style={{ opacity: ready ? 1 : 0, transition: 'opacity 600ms ease', filter: 'drop-shadow(0 18px 12px rgba(8, 18, 24, 0.26))' }} />
    </div>
  );
}
