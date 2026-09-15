import * as T from 'three';
import { pavilionDefaults, type PavilionSettings } from '../cms/pavilionDefaults';
import { resolveCMSAsset } from '../cms/runtime';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A fixed glazed window with a local film decoded only while visitors can see it. */
export function createAmritFilm(frame: T.Group, picture: T.Mesh, refresh: () => void, oneness = false, settings: PavilionSettings['windows']['amrit'] = pavilionDefaults.windows[oneness ? 'oneness' : 'amrit']) {
  const assetKey = `pavilion.window.${oneness ? 'oneness' : 'amrit'}`;
  let disposed = false, playingRequest = false, wantsPlayback = false, playbackBlocked = false;
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  const film = new T.VideoTexture(video);
  film.colorSpace = T.SRGBColorSpace;
  const material = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
  // The caller creates a separate placeholder material for each photograph.
  for (const previous of Array.isArray(picture.material) ? picture.material : [picture.material]) previous.dispose();
  picture.material = material;
  const poster = new T.TextureLoader().load(
    resolveCMSAsset(`${assetKey}.poster`, settings.poster),
    () => { if (!disposed) refresh(); },
  );
  poster.colorSpace = T.SRGBColorSpace;
  material.map = poster;

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 64;
  grainCanvas.height = 256;
  const grain = grainCanvas.getContext('2d')!;
  grain.fillStyle = settings.grainColor;
  grain.fillRect(0, 0, 64, 256);
  for (let x = 0; x < 64; x++) {
    grain.strokeStyle = `rgba(105,108,103,${.015 + (Math.sin(x * 12.9) + 1) * .018})`;
    grain.beginPath();
    for (let y = 0; y < 256; y += 4) {
      const dx = x + Math.sin(y / 42 + x) * .7;
      if (y === 0) grain.moveTo(dx, y);
      else grain.lineTo(dx, y);
    }
    grain.stroke();
  }
  const grainMap = new T.CanvasTexture(grainCanvas);
  grainMap.colorSpace = T.SRGBColorSpace;
  const timber = new T.MeshStandardMaterial({ map: grainMap, roughness: settings.woodRoughness, color: settings.woodColor });
  const timberParts: T.BufferGeometry[] = [];
  const rail = (w: number, h: number, x: number, y: number, depth = .14, z = .24) => {
    timberParts.push(new T.BoxGeometry(w, h, depth).translate(x, y, z));
  };
  // Four closed white-timber sashes, transoms and slender divided-light bars.
  rail(3.48, .14, 0, 1.16, .23);
  rail(3.55, .15, 0, -1.16, .36, .3);
  for (const x of [-1.63, -.815, 0, .815, 1.63]) rail(.085, 2.29, x, 0, .19);
  for (let bay = 0; bay < 4; bay++) {
    const center = -1.2225 + bay * .815;
    for (const x of [center - .33, center + .33]) rail(.035, 2.12, x, 0, .075, .335);
    for (const y of [-1.03, -.82, .28, 1.03]) rail(.69, .038, center, y, .075, .335);
    rail(.73, .075, center, .24, .13, .32);
    for (const x of [center - .18, center + .18]) rail(.018, 2.02, x, 0, .045, .32);
    rail(.65, .022, center, .52, .045, .32);
  }
  if (oneness) {
    for (const x of [-.815, .815]) for (const y of [-.96, .96]) rail(1.57, .12, x, y, .07, .285);
    const handles = [-.15, .15].map(x => new T.TorusGeometry(.065, .012, 6, 16).translate(x, -.12, .33));
    frame.add(new T.Mesh(mergeGeometries(handles)!, new T.MeshStandardMaterial({ color: '#bba477', metalness: .8, roughness: .32 })));
    handles.forEach(geometry => geometry.dispose());
  }
  const cornice = new T.Mesh(new T.BoxGeometry(3.65, .11, .42), new T.MeshStandardMaterial({ color: settings.grainColor, roughness: settings.woodRoughness }));
  cornice.position.set(0, 1.29, .31);
  frame.add(cornice);
  const glass = new T.Mesh(new T.PlaneGeometry(3.2, 2.22), new T.MeshPhysicalMaterial({
    color: settings.glassColor, transparent: true, opacity: settings.glassOpacity, roughness: .08, metalness: .05, depthWrite: false,
  }));
  glass.position.z = .19;
  frame.add(glass);

  const frostedMaterials: T.ShaderMaterial[] = [];
  // Nine weighted taps retain the previous blur radius at 36% of its texture reads.
  for (const y of (settings.frost ? [-.87, .87] : [])) {
    const frost = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        image: { value: poster },
        uvCenter: { value: new T.Vector2(.5, .5 + y / 2.29) },
        uvScale: { value: new T.Vector2(3.2 / 3.26, .48 / 2.29) },
        videoCrop: { value: new T.Vector4(1, 1, 0, 0) },
        frostBlur: { value: settings.frostBlur },
        frostOpacity: { value: settings.frostOpacity },
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform sampler2D image; uniform float frostBlur; uniform float frostOpacity; uniform vec2 uvCenter; uniform vec2 uvScale; uniform vec4 videoCrop; varying vec2 vUv;
        void main(){
          vec2 uv=((vUv-.5)*uvScale+uvCenter)*videoCrop.xy+videoCrop.zw;
          vec3 color=vec3(0.);
          for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){
            float weight=(x==0?2.:1.)*(y==0?2.:1.);
            color+=texture2D(image,uv+vec2(float(x),float(y))*frostBlur*videoCrop.xy).rgb*weight;
          }}
          color/=16.;gl_FragColor=vec4(mix(color,vec3(.84,.91,.90),.28),frostOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    frostedMaterials.push(frost);
    const pane = new T.Mesh(new T.PlaneGeometry(3.2, .48), frost);
    pane.position.set(0, y, .205);
    frame.add(pane);
    rail(3.2, .035, 0, y > 0 ? y - .24 : y + .24);
  }
  // The windows stay closed, so all their timber can share one draw call.
  frame.add(new T.Mesh(mergeGeometries(timberParts)!, timber));
  timberParts.forEach(geometry => geometry.dispose());

  const onLoadedData = () => {
    if (disposed || !video.videoWidth || !video.videoHeight) return;
    const aspect = video.videoWidth / video.videoHeight, target = 3.26 / 2.29;
    film.repeat.set(1, 1);
    film.offset.set(0, 0);
    if (aspect > target) {
      film.repeat.x = target / aspect;
      film.offset.x = (1 - film.repeat.x) / 2;
    } else {
      film.repeat.y = aspect / target;
      film.offset.y = (1 - film.repeat.y) / 2;
    }
    material.map = film;
    material.needsUpdate = true;
    for (const frost of frostedMaterials) {
      frost.uniforms.image.value = film;
      frost.uniforms.videoCrop.value.set(film.repeat.x, film.repeat.y, film.offset.x, film.offset.y);
    }
    refresh();
  };
  video.addEventListener('loadeddata', onLoadedData);
  const start = oneness ? 3.57 : 3.28, end = oneness ? 3.72 : 3.56;
  return {
    update(progress: number, active: boolean, paused: boolean) {
      if (disposed) return;
      const visible = settings.autoplay && active && !paused && progress > start && progress < end;
      // Fetch metadata just before arrival; retain the poster until a real frame is ready.
      if (active && !paused && progress > start - .05 && progress < end && !video.getAttribute('src')) {
        video.crossOrigin = 'anonymous';
        video.src = resolveCMSAsset(`${assetKey}.video`, settings.video);
      }
      wantsPlayback = visible;
      if (visible) {
        if (video.paused && !playingRequest && !playbackBlocked) {
          playingRequest = true;
          video.play().then(() => {
            playingRequest = false;
            if (disposed || !wantsPlayback) video.pause();
            else refresh();
          }).catch((error: DOMException) => {
            playingRequest = false;
            // Retry interruptions on re-entry, without repeating denied autoplay each frame.
            playbackBlocked = wantsPlayback && error.name !== 'AbortError';
          });
        }
      } else {
        playbackBlocked = false;
        if (!video.paused) video.pause();
      }
    },
    get playing() { return !video.paused; },
    dispose() {
      disposed = true;
      wantsPlayback = false;
      video.removeEventListener('loadeddata', onLoadedData);
      video.pause();
      film.dispose();
      video.removeAttribute('src');
      video.load();
      poster.dispose();
      grainMap.dispose();
      // Scene traversal owns the remaining attached geometry and materials.
    },
  };
}
