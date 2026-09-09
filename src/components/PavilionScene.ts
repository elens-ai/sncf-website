import * as T from 'three';
import { getPavilionSettings } from '../cms/pavilionSettings';
import { resolveCMSAsset } from '../cms/runtime';
import { createAmritFilm } from './amritFilm';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createFrameClock } from '../utils/frameClock';
import { createRenderQuality } from '../utils/renderQuality';
import { pavilionFraming } from '../utils/pavilionFraming';
import { pillarModelUrl } from '../utils/modelAssets';
import { createBookOpening } from '../utils/bookOpening';
import { PAGE_ACTIVITY_EVENT, pageIsActive } from '../utils/pageActivity';
import { PAVILION_GALLERY, pavilionExhibitReveal } from '../data/pavilionGallery';

/** One modest scene for the whole walk. No post-processing or real-time shadows. */
export function createPavilion(host: HTMLElement) {
  const settings = getPavilionSettings();
  const { materials: finishes, lighting, components } = settings;
  let framing = pavilionFraming(host.clientWidth || 1280, host.clientHeight || 800, settings.camera.fieldOfView, settings.finale.modelSize, settings.finale.modelHeight);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = lighting.exposure;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.dataset.renderer = 'pavilion';
  host.append(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color(lighting.background);
  scene.fog = new T.Fog(lighting.background, lighting.fogNear, lighting.fogFar);
  // A corridor needs distance precision, not a macro lens's tiny near plane.
  const camera = new T.PerspectiveCamera(settings.camera.fieldOfView, 1, .5, 130);
  const compilationTasks = new Set<Promise<unknown>>();
  const compile = (object: T.Object3D) => {
    const task = renderer.compileAsync(object, camera, scene);
    compilationTasks.add(task);
    task.then(() => compilationTasks.delete(task), () => compilationTasks.delete(task));
    return task;
  };
  const stone = new T.MeshStandardMaterial({ color: finishes.stone.color, roughness: finishes.stone.roughness });
  const trim = new T.MeshStandardMaterial({ color: finishes.trim.color, roughness: finishes.trim.roughness });
  const pale = new T.MeshStandardMaterial({ color: finishes.plaster.color, roughness: finishes.plaster.roughness });
  const bronze = new T.MeshStandardMaterial({ color: finishes.brass.color, roughness: finishes.brass.roughness, metalness: finishes.brass.metalness });
  const wall = new T.MeshStandardMaterial({ color: finishes.wall.color, roughness: finishes.wall.roughness });
  const walnut = new T.MeshStandardMaterial({ color: finishes.wood.color, roughness: finishes.wood.roughness });
  const galleryInk = new T.MeshStandardMaterial({ color: finishes.displayBase.color, roughness: finishes.displayBase.roughness });
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
    // Irregular mineral veins and fine pores; wood gets long, wandering grain.
    for(let line=0;line<(wood?26:9);line++){
      pen.beginPath();const origin=random()*256;
      for(let q=0;q<=256;q+=4){const drift=Math.sin(q/(wood?55:31)+line)* (wood?2:9)+Math.sin(q/11+line)* (wood?.35:1.2);if(q===0)pen.moveTo(origin+drift,q);else pen.lineTo(origin+drift,q);}
      pen.strokeStyle=wood?'rgba(58,33,15,.08)':'rgba(118,110,95,.055)';pen.lineWidth=wood?.6:1.1;pen.stroke();
    }
    const map = new T.CanvasTexture(canvas); map.wrapS = map.wrapT = T.RepeatWrapping; map.colorSpace = T.SRGBColorSpace; map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    surfaceTextures.push(map); return map;
  };
  const limestone = surface(); limestone.repeat.set(3, 3);
  stone.map = limestone; stone.bumpMap = limestone; stone.bumpScale = .025;
  wall.map = limestone; wall.bumpMap = limestone; wall.bumpScale = .012;
  walnut.map = surface(true); walnut.bumpMap = walnut.map; walnut.bumpScale = .018;
  const floorMaterial = new T.MeshStandardMaterial({ color: finishes.floor.color, map: surface(), roughness: finishes.floor.roughness, metalness: .04 });
  floorMaterial.map!.repeat.set(5, 110);
  const box = new T.BoxGeometry(1, 1, 1);
  const softenedBox=new RoundedBoxGeometry(1,1,1,2,.025);
  const longBox = new T.BoxGeometry(1, 1, 1, 1, 1, 160);
  // A broad bend measured along the original promenade's distance.
  const bendRadius = 155;
  const bend = (point: T.Vector3) => {
    const angle=(65-point.z)/bendRadius, lateral=point.x;
    point.set(bendRadius*(1-Math.cos(angle))+lateral*Math.cos(angle),point.y,65-bendRadius*Math.sin(angle)+lateral*Math.sin(angle));
    return point;
  };
  const cylinder = new T.CylinderGeometry(1, 1, 1, 32);
  const put = (geometry: T.BufferGeometry, material: T.Material, pos: number[], scale: number[]) => {
    const mesh = new T.Mesh(geometry === box && scale[2] > 20 ? longBox : geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]); scene.add(mesh); return mesh;
  };
  put(box, stone, [0, -.2, -90], [25, .4, 320]);
  // A quiet museum promenade: stone, walnut, brass and softly lit display walls.
  put(box, floorMaterial, [0, .012, -90], [8, .03, 320]);
  for (let z = 68; z > -250; z -= 4) put(box, trim, [0, .032, z], [8, .009, .015]);
  for (const x of [-3.9, 3.9]) put(box, bronze, [x, .04, -90], [.035, .01, 320]);
  for (const x of [-1.3, 1.3]) put(box, trim, [x, .032, -90], [.012, .008, 320]);
  // The inset runner follows the same curve as the visitor route.
  const carpetMaterial = new T.MeshStandardMaterial( {color:finishes.carpet.color,roughness:finishes.carpet.roughness,metalness:0});
  const weaveCanvas=document.createElement('canvas');weaveCanvas.width=weaveCanvas.height=128;
  const weavePen=weaveCanvas.getContext('2d')!,weavePixels=weavePen.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const v=220+Math.sin(x*Math.PI/2)*8+Math.cos(y*Math.PI/3)*7+random()*14;
    const offset=(y*128+x)*4;weavePixels.data[offset]=weavePixels.data[offset+1]=weavePixels.data[offset+2]=v;weavePixels.data[offset+3]=255;
  }
  weavePen.putImageData(weavePixels,0,0);
  const weaveMap=new T.CanvasTexture(weaveCanvas);weaveMap.wrapS=weaveMap.wrapT=T.RepeatWrapping;weaveMap.repeat.set(6,180);surfaceTextures.push(weaveMap);
  carpetMaterial.bumpMap=weaveMap;carpetMaterial.bumpScale=.008;carpetMaterial.roughnessMap=weaveMap;
  floorMaterial.bumpMap=floorMaterial.map;floorMaterial.bumpScale=.008;
  pale.bumpMap=limestone;pale.bumpScale=.004;pale.roughness=finishes.plaster.roughness;
  if(components.carpet) put(box,carpetMaterial,[0,.063,-64],[4.65,.035,258]);
  const chapterLEDColors=settings.chapters.map(chapter=>chapter.led);
  const chapterWallMaterials=settings.chapters.map(chapter=>chapter.wall).map(color=>{const material=wall.clone();material.color.set(color);return material;});
  const chapterPanelMaterials=settings.chapters.map(chapter=>chapter.panel).map(color=>{const material=pale.clone();material.color.set(color);return material;});
  const wallChapter=(z:number)=>Math.max(0,Math.min(3,Math.floor((65-z)/60)));
  // Each chapter has its own cove strips and restrained reflected colour.
  if(components.edgeStrips) for(let chapter=0;chapter<4;chapter++){
    const led=new T.MeshBasicMaterial({color:chapterLEDColors[chapter],toneMapped:false});
    const centreZ=35-chapter*60;
    for(const side of [-1,1]){
      put(box,led,[side*7.01,6.88,centreZ],[.065,.07,60]);
      put(box,led,[side*6.94,.14,centreZ],[.07,.045,60]);
    }
  }
  for (const x of [-7.2, 7.2]) {
    for(let chapter=0;chapter<4;chapter++)put(box,chapterWallMaterials[chapter],[x,3.5,35-chapter*60],[.3,7,60]);
    put(box,chapterWallMaterials[0],[x,3.5,67.5],[.3,7,5]);
    put(box,chapterWallMaterials[3],[x,3.5,-212.5],[.3,7,75]);
    put(box, walnut, [x * .97, .4, -90], [.15, .8, 320]);
  }
  // Static luminous surfaces suggest concealed lighting without extra GPU lights.
  for (const x of [-3.7, 3.7]) {
    put(box, walnut, [x, 6.95, -90], [.22, .16, 320]);
  }
  for (let z = 63; z > -243; z -= 9) {
    for (const x of [-5.5, 5.5]) {
      put(cylinder, stone, [x, 3.5, z], [.34, 7, .34]);
      put(softenedBox, pale, [x, .16, z], [1, .32, 1]);
      put(cylinder,stone,[x,.38,z],[.39,.12,.39]);
      put(cylinder,stone,[x,6.55,z],[.39,.12,.39]);
      put(softenedBox, pale, [x, 6.8, z], [1.05, .4, 1.05]);
      put(box, trim, [x, 7.2, z], [.8, .35, 9.1]);
    }
    put(box, pale, [0, 7.05, z], [12.1, .38, .8]);
    for (const x of [-6.8, 6.8]) {
      put(box, chapterPanelMaterials[wallChapter(z-4.5)], [x, 3.5, z - 4.5], [.12, 6, 7.2]);
      if (components.benches && (z % 18 === 9 || z % 18 === -9)) {
        put(box, walnut, [x * .88, .55, z - 3], [.9, .18, 2.7]);
        for (const offset of [-.9, .9]) put(box, galleryInk, [x * .88, .25, z - 3 + offset], [.6, .5, .14]);
      }
    }
  }
  // Reusable soft contact shadows, baked into a tiny procedural texture.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(18,25,21,.48)'); gradient.addColorStop(.35,'rgba(18,25,21,.22)'); gradient.addColorStop(1, 'rgba(28,34,27,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const texture = new T.CanvasTexture(shadowCanvas);
  const shadowMaterial = new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const plane = new T.PlaneGeometry(1, 1);
  // Soft baked contact shadows anchor columns and benches without shadow-map passes.
  const contactPoints: [number, number, number, number][] = [];
  for (let z = 63; z > -243; z -= 9) for (const side of [-1, 1]) {
    contactPoints.push([side * 5.5, z, 2.5, 2.5]);
    if (components.benches && Math.abs(z % 18) === 9) contactPoints.push([side * 6.8 * .88, z - 3, 2, 4]);
  }
  const contacts = new T.InstancedMesh(plane, shadowMaterial, contactPoints.length);
  const contactTransform = new T.Object3D();
  contactPoints.forEach(([x, z, width, depth], i) => {
    contactTransform.position.set(x, .045, z); contactTransform.rotation.set(-Math.PI / 2, 0, 0); contactTransform.scale.set(width, depth, 1); contactTransform.updateMatrix(); contacts.setMatrixAt(i, contactTransform.matrix);
  });
  contacts.instanceMatrix.needsUpdate = true; scene.add(contacts);
  // Quiet human-scale details: planted alcoves and a few reading benches.
  // All repeated furnishings are instanced; none add animation or shadow passes.
  const furnishingBatches: T.InstancedMesh[] = [];
  const batch = (geometry: T.BufferGeometry, material: T.Material, transforms: T.Matrix4[], colors?: T.Color[]) => {
    const mesh = new T.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); if (colors) mesh.setColorAt(i, colors[i]); });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    scene.add(mesh); furnishingBatches.push(mesh); return mesh;
  };
  const matrixAt = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rotation = new T.Quaternion()) => new T.Matrix4().compose(new T.Vector3(x,y,z), rotation, new T.Vector3(sx,sy,sz));
  // Suspended halo pendants track the carpet centreline through the bend.
  // Shared instances keep the repeated ceiling fixtures inexpensive to render.
  const haloBodies:T.Matrix4[]=[],haloDiffusers:T.Matrix4[]=[],haloCables:T.Matrix4[]=[],haloMounts:T.Matrix4[]=[];
  const haloMetal=new T.MeshStandardMaterial({color:'#222724',roughness:.38,metalness:.65});
  const haloWhite=new T.MeshBasicMaterial({color:lighting.pendantColor,toneMapped:false,side:T.DoubleSide});
  const horizontalRing=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
  if(components.pendants) for(let z=57;z>=-195;z-=18){
    haloBodies.push(matrixAt(0,5.95,z,1,1,1));
    haloDiffusers.push(matrixAt(0,5.82,z,1,1,1,horizontalRing));
    haloMounts.push(matrixAt(0,7.04,z,.18,.055,.18));
    for(let i=0;i<3;i++){
      const angle=i*Math.PI*2/3;
      haloCables.push(matrixAt(Math.cos(angle)*1.18,6.55,z+Math.sin(angle)*1.18,.009,1.05,.009));
    }
  }
  const haloShape=new T.Shape();haloShape.absarc(0,0,1.38,0,Math.PI*2,false);
  const haloHole=new T.Path();haloHole.absarc(0,0,1.13,0,Math.PI*2,true);haloShape.holes.push(haloHole);
  const haloGeometry=new T.ExtrudeGeometry(haloShape,{depth:.25,bevelEnabled:false,curveSegments:32});
  haloGeometry.rotateX(Math.PI/2);haloGeometry.translate(0,.125,0);
  batch(haloGeometry,haloMetal,haloBodies);
  batch(new T.RingGeometry(1.145,1.365,64),haloWhite,haloDiffusers);
  batch(cylinder,haloMetal,haloCables);
  batch(cylinder,haloMetal,haloMounts);
  // A continuous visitor lane: low queue posts and fabric belts leave
  // the exhibits visible while keeping the camera comfortably inside the route.
  const queueBases: T.Matrix4[] = [], queuePosts: T.Matrix4[] = [], queueCaps: T.Matrix4[] = [];
  const queueBelts: T.Matrix4[] = [], queueShadows: T.Matrix4[] = [];
  const queueMetal = new T.MeshStandardMaterial({color:finishes.queueMetal.color,metalness:finishes.queueMetal.metalness,roughness:finishes.queueMetal.roughness});
  const queueFabric = new T.MeshStandardMaterial({color:finishes.queueBelt.color,roughness:finishes.queueBelt.roughness});
  const floorRotation = new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
  if(components.barriers) for (const side of [-1,1]) {
    const x=side*2.65;
    const exhibitStops=[52,-8,-68,-128].filter((_,i)=>(i%2===0?1:-1)===side);
    const besideIcon=(z:number)=>exhibitStops.some(stop=>Math.abs(z-stop)<2.5);
    for(let z=65;z>=-193;z-=6){
      if(!besideIcon(z)){
      queueBases.push(matrixAt(x,.095,z,.28,.12,.28));
      queuePosts.push(matrixAt(x,.68,z,.045,1.12,.045));
      queueCaps.push(matrixAt(x,1.25,z,.09,.12,.09));
      queueShadows.push(matrixAt(x,.049,z,.88,.88,1,floorRotation));
      }
      // End each opening at a real post; no floating belt ends near the plinth.
      const crossesExhibit=exhibitStops.some(stop=>z>stop-2.5&&z-6<stop+2.5);
      if(z>-193&&!crossesExhibit) for(let segment=0;segment<8;segment++){
        // Short belt spans follow the same bend as the architecture.
        queueBelts.push(matrixAt(x,1.22,z-(segment+.5)*.75,.025,.095,.755));
      }
    }
  }
  batch(cylinder,queueMetal,queueBases);
  batch(cylinder,queueMetal,queuePosts);
  batch(cylinder,queueMetal,queueCaps);
  batch(box,queueFabric,queueBelts);
  batch(plane,shadowMaterial,queueShadows);
  const potMatrices: T.Matrix4[] = [], soilMatrices: T.Matrix4[] = [], stemMatrices: T.Matrix4[] = [], leafMatrices: T.Matrix4[] = [], leafColors: T.Color[] = [], plantShadows: T.Matrix4[] = [];
  const up = new T.Vector3(0,1,0);
  if(components.planters) for (let z = 54; z >= -180; z -= 18) for (const side of [-1,1]) {
    // Open furnishing lane: 1.45 units from columns and 1.4 from the barriers.
    // Align with column lines so the picture bays stay unobstructed.
    const x = side * 4.05, plantZ = z;
    const pedestalNearby=[52,-8,-68,-128].some((exhibitZ,i)=>(i%2===0?1:-1)===side&&Math.abs(plantZ-exhibitZ)<7);
    if(pedestalNearby)continue;
    const variant=potMatrices.length%3;
    const width=variant===1?.8:variant===2?1.35:1,heightScale=variant===1?1.55:variant===2?.72:1;
    const soilY=.015+.685*heightScale,stemY=soilY+.04;
    potMatrices.push(matrixAt(x,.015+.375*heightScale,plantZ,width,heightScale,width));
    soilMatrices.push(matrixAt(x,soilY,plantZ,.375*width,.035,.375*width));
    plantShadows.push(matrixAt(x,.047,plantZ,1.7,1.7,1,new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2)));
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4 + side, height = stemY+.37 + random() * .65;
      const start = new T.Vector3(x,stemY,plantZ), end = new T.Vector3(x+Math.cos(angle)*.25,height,plantZ+Math.sin(angle)*.25);
      const stemDirection = end.clone().sub(start);
      stemMatrices.push(matrixAt((x+end.x)/2,(stemY+height)/2,(plantZ+end.z)/2,.014,stemDirection.length(),.014,new T.Quaternion().setFromUnitVectors(up,stemDirection.normalize())));
      const direction = new T.Vector3(Math.cos(angle)*.8,.25+random()*.6,Math.sin(angle)*.8).normalize();
      leafMatrices.push(matrixAt(end.x,end.y,end.z,.28+random()*.176,.52+random()*.32,1,new T.Quaternion().setFromUnitVectors(up,direction)));
      leafColors.push(new T.Color().setHSL(.27+random()*.06,.25+random()*.15,.19+random()*.13));
    }
  }
  // A curved, tapered leaf surface catches light naturally from either side.
  const leafPositions: number[] = [], leafUV: number[] = [], leafIndices: number[] = [];
  for (let row=0;row<=10;row++) for(let col=0;col<=4;col++) {
    const t=row/10, across=col/4*2-1, width=Math.pow(Math.sin(Math.PI*t),.8)*.5;
    leafPositions.push(across*width,t,.14*Math.sin(Math.PI*t)-Math.abs(across)*width*.2);
    leafUV.push(col/4,t);
    if(row<10&&col<4){const a=row*5+col;leafIndices.push(a,a+5,a+1,a+1,a+5,a+6);}
  }
  const leafGeometry=new T.BufferGeometry();leafGeometry.setAttribute('position',new T.Float32BufferAttribute(leafPositions,3));leafGeometry.setAttribute('uv',new T.Float32BufferAttribute(leafUV,2));leafGeometry.setIndex(leafIndices);leafGeometry.computeVertexNormals();
  // Revolved ceramic cross-section: foot, gently curved body and a rolled,
  // hollow rim. The soil sits below the lip instead of covering the opening.
  const potProfile=[
    [.27,-.375],[.31,-.375],[.32,-.35],[.315,-.30],[.325,-.23],
    [.35,-.05],[.385,.17],[.425,.32],[.437,.355],[.433,.385],
    [.416,.397],[.397,.386],[.389,.36],[.388,.325],[.353,.17],
    [.32,-.05],[.287,-.29],[0,-.29],
  ].map(([radius,height])=>new T.Vector2(radius,height));
  const ceramicCanvas=document.createElement('canvas');ceramicCanvas.width=ceramicCanvas.height=256;
  const ceramicPen=ceramicCanvas.getContext('2d')!;
  ceramicPen.fillStyle='#d6c7af';ceramicPen.fillRect(0,0,256,256);
  for(let i=0;i<6500;i++){
    ceramicPen.fillStyle=`rgba(90,66,43,${.025+random()*.10})`;
    ceramicPen.fillRect(random()*256,random()*256,.5+random(),.5+random());
  }
  for(let y=0;y<256;y+=5){ceramicPen.fillStyle='rgba(255,248,230,.08)';ceramicPen.fillRect(0,y,256,.6);}
  const ceramicMap=new T.CanvasTexture(ceramicCanvas);ceramicMap.colorSpace=T.SRGBColorSpace;surfaceTextures.push(ceramicMap);
  const planterFinishes=finishes.planterColors;
  planterFinishes.forEach((color,variant)=>{
    const profile=variant===1?potProfile.map(p=>new T.Vector2(p.x*(1+.055*Math.sin(p.y*40)),p.y)):potProfile;
    batch(new T.LatheGeometry(profile,40),new T.MeshStandardMaterial({color,roughness:variant===1?.8:.66,metalness:0,map:ceramicMap,bumpMap:ceramicMap,bumpScale:.009}),potMatrices.filter((_,i)=>i%3===variant));
  });
  const pebbles:T.Matrix4[]=[];
  for(const matrix of potMatrices){
    const centre=new T.Vector3().setFromMatrixPosition(matrix);
    const potScale=new T.Vector3().setFromMatrixScale(matrix);
    for(let i=0;i<22;i++){
      const angle=random()*Math.PI*2,radius=Math.sqrt(random())*.34*potScale.x;
      pebbles.push(matrixAt(centre.x+Math.cos(angle)*radius,.015+.711*potScale.y,centre.z+Math.sin(angle)*radius,.022+random()*.018,.012+random()*.009,.02+random()*.015));
    }
  }
  batch(new T.SphereGeometry(1,7,5),new T.MeshStandardMaterial({color:'#8b7760',roughness:.98}),pebbles);
  batch(cylinder,new T.MeshStandardMaterial({color:'#423d2b',roughness:1}),soilMatrices);
  batch(cylinder,new T.MeshStandardMaterial({color:'#536044',roughness:.85}),stemMatrices);
  const leafCanvas=document.createElement('canvas');leafCanvas.width=leafCanvas.height=128;
  const leafPen=leafCanvas.getContext('2d')!;
  const leafShade=leafPen.createLinearGradient(0,0,128,0);leafShade.addColorStop(0,'#98ae86');leafShade.addColorStop(.5,'#f3f6d7');leafShade.addColorStop(1,'#a0b48c');
  leafPen.fillStyle=leafShade;leafPen.fillRect(0,0,128,128);
  leafPen.strokeStyle='#dbe6b6';leafPen.lineWidth=1.2;leafPen.beginPath();leafPen.moveTo(64,0);leafPen.lineTo(64,128);leafPen.stroke();
  leafPen.lineWidth=.55;leafPen.strokeStyle='#c1d09c';
  for(let y=14;y<120;y+=12){leafPen.beginPath();leafPen.moveTo(12,y-11);leafPen.quadraticCurveTo(34,y-6,64,y+8);leafPen.quadraticCurveTo(94,y-6,116,y-11);leafPen.stroke();}
  const leafMap=new T.CanvasTexture(leafCanvas);leafMap.colorSpace=T.SRGBColorSpace;surfaceTextures.push(leafMap);
  batch(leafGeometry,new T.MeshStandardMaterial({color:'#ffffff',map:leafMap,bumpMap:leafMap,bumpScale:.004,roughness:.58,side:T.DoubleSide}),leafMatrices,leafColors);
  batch(plane,shadowMaterial,plantShadows);

  const cushions: T.Matrix4[] = [], books: T.Matrix4[] = [], pages: T.Matrix4[] = [];
  if(components.benches) for(const z of [27,-45,-117,-189]) {
    const x=-6.8*.88, seatZ=z-3;
    cushions.push(matrixAt(x,.68,seatZ-.65,.72,.12,.92));
    books.push(matrixAt(x,.675,seatZ+.65,.46,.055,.65,new T.Quaternion().setFromAxisAngle(up,.12)));
    pages.push(matrixAt(x,.713,seatZ+.65,.42,.028,.61,new T.Quaternion().setFromAxisAngle(up,.12)));
  }
  batch(softenedBox,new T.MeshStandardMaterial({color:'#a7aea0',roughness:1,map:limestone}),cushions);
  batch(box,galleryInk,books);batch(box,pale,pages);
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
  // Shared theatre fixtures and a soft, baked beam keep all twenty displays light.
  const lampMetal=new T.MeshStandardMaterial({color:'#242b2a',metalness:.65,roughness:.38});
  const lampLens=new T.MeshBasicMaterial({color:lighting.pictureColor,toneMapped:false});
  const beamCanvas=document.createElement('canvas');beamCanvas.width=128;beamCanvas.height=256;
  const beamPen=beamCanvas.getContext('2d')!;
  const beamPixels=beamPen.createImageData(128,256);
  for(let y=0;y<256;y++)for(let x=0;x<128;x++){
    const u=(x/127-.5)*2,v=y/255,offset=(y*128+x)*4;
    const edge=Math.pow(Math.max(0,1-u*u),2);
    beamPixels.data[offset]=255;beamPixels.data[offset+1]=245;beamPixels.data[offset+2]=220;
    beamPixels.data[offset+3]=Math.round(100*edge*Math.pow(1-v,1.5)*Math.min(1,v*20));
  }
  beamPen.putImageData(beamPixels,0,0);
  const beamTexture=new T.CanvasTexture(beamCanvas);beamTexture.colorSpace=T.SRGBColorSpace;surfaceTextures.push(beamTexture);
  const beamMaterial=new T.MeshBasicMaterial({map:beamTexture,opacity:lighting.beamOpacity,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});
  const beamGeometry=new T.BufferGeometry();
  beamGeometry.setAttribute('position',new T.Float32BufferAttribute([-.09,1.96,.62,.09,1.96,.62,-.88,-1.05,.16,.88,-1.05,.16],3));
  beamGeometry.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,0,0,1,0],2));
  beamGeometry.setIndex([0,2,1,1,2,3]);beamGeometry.computeVertexNormals();
  // One shared falloff texture creates a wall halo without extra live lights.
  const frameGlowCanvas=document.createElement('canvas');frameGlowCanvas.width=256;frameGlowCanvas.height=192;
  const glowPen=frameGlowCanvas.getContext('2d')!;
  const glowPixels=glowPen.createImageData(256,192);
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){
    const dx=Math.max(0,Math.abs(x-127.5)-98.7),dy=Math.max(0,Math.abs(y-95.5)-68.6);
    const distance=Math.hypot(dx,dy);
    const fade=Math.exp(-distance*distance/180)*Math.min(1,Math.min(x,255-x,y,191-y)/8),a=(y*256+x)*4;
    glowPixels.data[a]=glowPixels.data[a+1]=glowPixels.data[a+2]=255;
    glowPixels.data[a+3]=Math.round(155*fade);
  }
  glowPen.putImageData(glowPixels,0,0);
  const frameGlowTexture=new T.CanvasTexture(frameGlowCanvas);surfaceTextures.push(frameGlowTexture);
  const frameGlowMaterials=chapterLEDColors.map(color=>new T.MeshBasicMaterial({color:new T.Color(color).lerp(new T.Color('#fff0df'),.25),map:frameGlowTexture,opacity:lighting.frameGlow,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const frameLEDMaterials=chapterLEDColors.map(color=>new T.MeshBasicMaterial({color,toneMapped:false}));
  const pictureGroups:T.Group[]=[];
  const projectFilms:ReturnType<typeof createAmritFilm>[]=[];
  const blankPhoto=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);blankPhoto.needsUpdate=true;blankPhoto.colorSpace=T.SRGBColorSpace;surfaceTextures.push(blankPhoto);
  const photoFrames: { material: T.MeshStandardMaterial; src: string; loaded: boolean; position: T.Vector3 }[][] = [];
  let book: ReturnType<typeof createBookOpening>, bookVisible = false;
  let disposed = false, active = false, reduced = false, paused = false, target = 0, current = 0, prepared = false;
  const pendingPhotos:{material:T.MeshStandardMaterial;map:T.Texture}[]=[];
  const materialSlots: [keyof typeof finishes, T.MeshStandardMaterial[]][] = [
    ['stone', [stone]], ['trim', [trim]], ['plaster', [pale, ...chapterPanelMaterials]],
    ['brass', [bronze]], ['wall', [wall, ...chapterWallMaterials]], ['wood', [walnut]],
    ['displayBase', [galleryInk]], ['floor', [floorMaterial]], ['carpet', [carpetMaterial]],
    ['queueMetal', [queueMetal]], ['queueBelt', [queueFabric]],
  ];
  for (const [name, targets] of materialSlots) {
    const finish = finishes[name];
    const url = resolveCMSAsset(`pavilion.material.${name}.texture`, 'texture' in finish ? finish.texture : '');
    if (!url) continue;
    new T.TextureLoader().load(url, map => {
      if (disposed) { map.dispose(); return; }
      map.colorSpace = T.SRGBColorSpace; map.wrapS = map.wrapT = T.RepeatWrapping;
      map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      surfaceTextures.push(map);
      for (const material of targets) { material.map = map; material.needsUpdate = true; }
      if (active && prepared && pageIsActive(host)) clock.start();
    }, undefined, () => { /* Keep the procedural finish if media is unavailable. */ });
  }

  const modelTimes = [0, 0, 0, 0];
  const hasLiveExhibit = () => projectFilms.some(film=>film.playing) || models.some((model, i) => model.visible && pavilionExhibitReveal(current, i) > 0);
  const ids = ['heal', 'enrich', 'empower', 'projects'];
  const disposeModel = (model: T.Object3D) => model.traverse(child => {
    if (child instanceof T.Mesh) {
      child.geometry.dispose();
      for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
        for (const value of Object.values(material)) if (value instanceof T.Texture) value.dispose();
        material.dispose();
      }
    }
  });
  ids.forEach((id, i) => {
    const z = 52-i * 60, side = i % 2 === 0 ? 1 : -1, x = 3.5 * side;
    const chapterInks = settings.chapters.map(chapter=>chapter.ink);
    put(cylinder, pale, [x, .55, z], [1.6, 1.1, 1.6]);
    put(cylinder, galleryInk, [x, .08, z], [1.67, .16, 1.67]);
    put(cylinder, bronze, [x, 1.105, z], [1.58, .035, 1.58]);
    const floorContact=put(plane,shadowMaterial,[x,.048,z],[4.8,4.8,1]);floorContact.rotation.x=-Math.PI/2;
    const shadow = put(plane, shadowMaterial, [x, 1.13, z], [3.8, 3.8, 1]); shadow.rotation.x = -Math.PI / 2;
    const spot = new T.SpotLight(lighting.exhibitColor, 0, 15, Math.PI / 5, 1, 1);
    spot.position.set(x, 6.5, z + 2.4); spot.target.position.set(x, 3.4, z); scene.add(spot, spot.target); spots.push(spot);
    put(cylinder, bronze, [x, 6.65, z + 2.4], [.2, .3, .2]);
    const pool = put(cylinder, new T.MeshBasicMaterial({ color: '#ffebbc', transparent: true, opacity: 0, depthWrite: false }), [x, 1.14, z], [1.45, .01, 1.45]); pools.push(pool);
    const pivot = new T.Group(); pivot.position.set(x, 3, z); scene.add(pivot); models.push(pivot);
    photoFrames[i] = [];
    PAVILION_GALLERY[i].forEach((photo, n) => {
      // One wall per chapter. Centre each picture in an architectural bay,
      // leaving a full bay's spacing and keeping every frame clear of columns.
      const photoSide=side;
      const firstBay=58.5-9*Math.round((58.5-(z-10))/9);
      const frame=new T.Group();
      frame.position.set(photoSide*6.45,3.1,firstBay-n*9);
      frame.rotation.y=-photoSide*Math.PI/2;frame.scale.setScalar(1.6);scene.add(frame);pictureGroups.push(frame);
      if(components.frameBacklights){
      const backlight=new T.Mesh(plane,frameGlowMaterials[i]);backlight.scale.set(4.8,3.85,1);backlight.position.z=-.075;frame.add(backlight);
      for(const edgeX of [-1.79,1.79]){
        const strip=new T.Mesh(box,frameLEDMaterials[i]);strip.position.set(edgeX,0,-.08);strip.scale.set(.035,2.78,.025);frame.add(strip);
      }
      for(const edgeY of [-1.32,1.32]){
        const strip=new T.Mesh(box,frameLEDMaterials[i]);strip.position.set(0,edgeY,-.08);strip.scale.set(3.73,.035,.025);frame.add(strip);
      }
      }
      const backing = new T.Mesh(softenedBox, bronze); backing.scale.set(3.7, 2.75, .12); frame.add(backing);
      const mount = new T.Mesh(box, pale); mount.scale.set(3.56, 2.61, .04); mount.position.z = .075; frame.add(mount);
      const mat = new T.MeshStandardMaterial({ color: '#e5dfd0', map:blankPhoto, roughness:.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      const photoPlane = new T.Mesh(plane, mat); photoPlane.scale.set(3.26, 2.29, 1); photoPlane.position.z = .13; frame.add(photoPlane);
      const caption = new T.Mesh(plane, plaque(`${String(n + 1).padStart(2, '0')}  ${photo.caption}`, `${id.toUpperCase()}  /  ILLUSTRATIVE PHOTOGRAPHY`, chapterInks[i]));
      caption.position.set(0, -1.68, .1); caption.scale.set(3.6, .66, 1); frame.add(caption);
      if(components.photoLights){
      const rail=new T.Mesh(box,lampMetal);rail.position.set(0,2.35,.52);rail.scale.set(2.8,.065,.07);frame.add(rail);
      for(const lampX of [-.85,.85]){
        const stem=new T.Mesh(cylinder,lampMetal);stem.position.set(lampX,2.22,.52);stem.scale.set(.025,.24,.025);frame.add(stem);
        const lamp=new T.Group();lamp.position.set(lampX,2.06,.65);lamp.rotation.x=.23;frame.add(lamp);
        const body=new T.Mesh(cylinder,lampMetal);body.scale.set(.14,.32,.14);lamp.add(body);
        const lens=new T.Mesh(cylinder,lampLens);lens.position.y=-.165;lens.scale.set(.113,.015,.113);lamp.add(lens);
        const beam=new T.Mesh(beamGeometry,beamMaterial);beam.position.x=lampX;frame.add(beam);
      }
      }
      if(components.windows&&i===3&&n<2){projectFilms.push(createAmritFilm(frame,photoPlane,()=>{if(active&&pageIsActive(host))clock.start();},n===1,settings.windows[n===1?'oneness':'amrit']));}
      else if (photo.src) photoFrames[i].push({ material: mat, src: photo.src, loaded: false, position: frame.position });
      else {
        const label = document.createElement('canvas'); label.width = 512; label.height = 256;
        const pen = label.getContext('2d')!; pen.fillStyle = '#e5dfd0'; pen.fillRect(0, 0, 512, 256);
        pen.fillStyle = '#466055'; pen.textAlign = 'center'; pen.font = '18px sans-serif'; pen.fillText(`${id.toUpperCase()} / ${String(n + 1).padStart(2, '0')}`, 256, 100);
        pen.font = '15px sans-serif'; pen.fillText('Photograph to be added', 256, 145);
        const map = new T.CanvasTexture(label); map.colorSpace = T.SRGBColorSpace; mat.map = map; photoTextures.push(map);
      }
    });
    if(components.models) new GLTFLoader().load(pillarModelUrl(id), ({ scene: model }) => {
      if (disposed) { disposeModel(model); return; }
      const bounds = new T.Box3().setFromObject(model), size = bounds.getSize(new T.Vector3());
      const extent = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(extent) || extent <= 0) { disposeModel(model); return; }
      model.position.sub(bounds.getCenter(new T.Vector3()));
      const wrapper = new T.Group(); wrapper.add(model); wrapper.scale.setScalar(2.9 / extent);
      if (id === 'enrich') book = createBookOpening(model);
      pivot.add(wrapper);wrapper.visible=false;
      compile(wrapper).then(()=>{if(!disposed){wrapper.visible=true;if(active&&prepared)clock.start();}}).catch(()=>{if(!disposed){wrapper.visible=true;if(active&&prepared)clock.start();}});
    }, undefined, () => { /* The HTML exhibit retains all content if its model fails. */ });
  });
  // A glazed mosaic artwork wall meets the end of the carpet.
  const farewellCanvas=document.createElement('canvas');farewellCanvas.width=2048;farewellCanvas.height=1024;
  const farewellMap=new T.CanvasTexture(farewellCanvas);farewellMap.colorSpace=T.SRGBColorSpace;surfaceTextures.push(farewellMap);
  let farewellModelFailed = false;
  const farewellLogo=new Image();farewellLogo.crossOrigin='anonymous';
  const paintFarewell=()=>{
    if(disposed)return;
    const pen=farewellCanvas.getContext('2d')!;
    pen.fillStyle=settings.finale.background;pen.fillRect(0,0,2048,1024);
    // Bake tiny ceramic tesserae once, with warm grout and varied glazed edges.
    const tile=settings.finale.tileSize;
    if(settings.finale.mosaic) for(let row=0;row<Math.ceil(1024/tile);row++)for(let col=0;col<Math.ceil(2048/tile);col++){
      const x=col*tile,y=row*tile;
      const noise=(Math.sin(col*127.1+row*311.7)*43758.5453)%1;
      const wave=Math.sin(col*.13+Math.sin(row*.17))*3;
      const light=25+Math.abs(noise)*12+wave;
      pen.fillStyle=`hsl(${settings.finale.mosaicHue+noise*13} ${settings.finale.mosaicSaturation}% ${light}%)`;pen.fillRect(x+1,y+1,tile-2,tile-2);
      pen.fillStyle='rgba(222,239,211,.19)';pen.fillRect(x+2,y+2,tile-4,1);pen.fillRect(x+2,y+2,1,tile-4);
      pen.fillStyle='rgba(6,27,23,.25)';pen.fillRect(x+2,y+tile-3,tile-4,1);pen.fillRect(x+tile-3,y+2,1,tile-4);
    }
    // Quiet the centre so the emblem and lettering remain readable.
    const shade=pen.createRadialGradient(1024,500,80,1024,500,630);shade.addColorStop(0,'rgba(10,42,35,.5)');shade.addColorStop(1,'rgba(10,42,35,0)');pen.fillStyle=shade;pen.fillRect(0,0,2048,1024);
    if(farewellModelFailed&&farewellLogo.complete&&farewellLogo.naturalWidth){
      const diameter=settings.finale.modelSize*framing.emblemScale/14.4*2048;
      const centreY=512-(settings.finale.modelHeight+framing.emblemOffsetY-3.5)/7.2*1024;
      pen.save();pen.globalAlpha=.88;pen.drawImage(farewellLogo,1024-diameter/2,centreY-diameter/2,diameter,diameter);pen.restore();
    }
    pen.textAlign='center';pen.fillStyle=settings.finale.textColor;pen.font='64px "Dancing Script", cursive';
    const titleScale = Math.min(1, framing.finaleTextWidth / Math.max(1, pen.measureText(settings.finale.title).width));
    pen.font=`${64 * titleScale}px "Dancing Script", cursive`;pen.fillText(settings.finale.title,1024,680);
    pen.font='15px sans-serif';
    const subtitleScale = Math.min(1, framing.finaleTextWidth / Math.max(1, pen.measureText(settings.finale.subtitle).width));
    pen.font=`${15 * subtitleScale}px sans-serif`;pen.fillText(settings.finale.subtitle,1024,745);
    farewellMap.needsUpdate=true;draw();
  };
  farewellLogo.onload=paintFarewell;
  farewellLogo.src=resolveCMSAsset('pavilion.finale.logo',settings.finale.logo);
  // Defer painting until scene setup finishes; late font/image loads repaint once.
  Promise.resolve().then(paintFarewell);document.fonts.ready.then(paintFarewell);
  const farewell=new T.Mesh(new T.PlaneGeometry(14.4,7.2),new T.MeshBasicMaterial({map:farewellMap,toneMapped:false,fog:false}));
  farewell.position.set(0,3.5,-193);scene.add(farewell);
  put(box,wall,[0,3.5,-193.2],[14.4,7.2,.35]);
  // A shallow sculpted emblem stands proud of the mosaic above its lettering.
  // It shares this renderer and the existing exhibit spotlight, with no extra loop.
  const farewellEmblem = new T.Group();
  farewellEmblem.position.set(0, settings.finale.modelHeight + framing.emblemOffsetY, -192.55);
  farewellEmblem.scale.setScalar(framing.emblemScale);
  scene.add(farewellEmblem);
  const emblemShadow = new T.Mesh(plane, shadowMaterial);
  emblemShadow.position.set(0, -.04, -.32); emblemShadow.scale.setScalar(settings.finale.modelSize * 1.22);
  farewellEmblem.add(emblemShadow);
  new GLTFLoader().load(resolveCMSAsset('pavilion.finale.model', settings.finale.model), ({ scene: model }) => {
    if (disposed) { disposeModel(model); return; }
    const bounds = new T.Box3().setFromObject(model), extent = bounds.getSize(new T.Vector3());
    const size = Math.max(extent.x, extent.y, extent.z);
    if (!Number.isFinite(size) || size <= 0) { disposeModel(model); farewellModelFailed = true; paintFarewell(); return; }
    model.position.sub(bounds.getCenter(new T.Vector3()));
    const mount = new T.Group(); mount.add(model); mount.scale.setScalar(settings.finale.modelSize / size);
    mount.rotation.set(-.025, -.2, 0); farewellEmblem.add(mount); mount.visible = false;
    compile(mount).then(() => {
      if (!disposed) { mount.visible = true; if (active && prepared) clock.start(); }
    }).catch(() => { if (!disposed) { mount.visible = true; if (active && prepared) clock.start(); } });
  }, undefined, () => { if (!disposed) { farewellModelFailed = true; paintFarewell(); } });

  // Bend static architecture once; no geometry work occurs during scrolling.
  const axis = new T.Vector3(0,1,0), rotation = new T.Quaternion();
  const bendPose = (object: T.Object3D) => {
    const angle=(65-object.position.z)/bendRadius;
    bend(object.position);object.quaternion.premultiply(rotation.setFromAxisAngle(axis,-angle));
    object.userData.pathYaw=-angle;
  };
  for(const object of scene.children){
    if(object instanceof T.DirectionalLight || object instanceof T.HemisphereLight)continue;
    if(object instanceof T.InstancedMesh){
      const matrix=new T.Matrix4(),position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();
      for(let i=0;i<object.count;i++){
        object.getMatrixAt(i,matrix);matrix.decompose(position,quaternion,scale);
        const angle=(65-position.z)/bendRadius;bend(position);quaternion.premultiply(rotation.setFromAxisAngle(axis,-angle));
        matrix.compose(position,quaternion,scale);object.setMatrixAt(i,matrix);
      }
      object.instanceMatrix.needsUpdate=true;object.computeBoundingSphere();
    }else if(object instanceof T.Mesh){
      object.updateMatrix();const geometry=object.geometry.clone().applyMatrix4(object.matrix);
      const position=geometry.getAttribute('position'),point=new T.Vector3();
      for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i);bend(point);position.setXYZ(i,point.x,point.y,point.z);}
      geometry.computeVertexNormals();geometry.computeBoundingSphere();object.geometry=geometry;
      object.position.set(0,0,0);object.quaternion.identity();object.scale.set(1,1,1);
    }else bendPose(object);
  }
  // Batch only opaque, static architecture, in spatial cells so culling still
  // works around the bend. Models, photos and animated light pools stay separate.
  const architecture = new Map<string,T.Mesh[]>();
  for(const object of scene.children){
    if(!(object instanceof T.Mesh)||object instanceof T.InstancedMesh||Array.isArray(object.material)||object.material.transparent)continue;
    object.geometry.computeBoundingBox();
    const centre=object.geometry.boundingBox!.getCenter(new T.Vector3());
    const key=`${object.material.uuid}:${Math.floor(centre.x/24)}:${Math.floor(centre.z/24)}`;
    const items=architecture.get(key)||[];items.push(object);architecture.set(key,items);
  }
  for(const items of architecture.values()){
    if(items.length<2)continue;
    const parts=items.map(item=>item.geometry.index?item.geometry.toNonIndexed():item.geometry);
    const geometry=mergeGeometries(parts);
    parts.forEach((part,i)=>{if(part!==items[i].geometry)part.dispose();});
    if(!geometry)continue;
    geometry.computeBoundingSphere();
    scene.add(new T.Mesh(geometry,items[0].material));
    for(const item of items){scene.remove(item);item.geometry.dispose();}
  }
  for(const frame of pictureGroups){
    const batches=new Map<T.Material,T.Mesh[]>();
    frame.traverse(object=>{if(object instanceof T.Mesh&&!Array.isArray(object.material)&&!object.material.transparent&&[bronze,pale,lampMetal,lampLens,...frameLEDMaterials].includes(object.material as T.MeshStandardMaterial)){
      const batch=batches.get(object.material)||[];batch.push(object);batches.set(object.material,batch);
    }});
    frame.updateMatrixWorld(true);const local=new T.Matrix4().copy(frame.matrixWorld).invert();
    for(const [material,items] of batches){
      if(items.length<2)continue;
      const parts=items.map(item=>{const geometry=item.geometry.index?item.geometry.toNonIndexed():item.geometry.clone();return geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(local,item.matrixWorld));});
      const merged=mergeGeometries(parts);parts.forEach(part=>part.dispose());if(!merged)continue;
      frame.add(new T.Mesh(merged,material));items.forEach(item=>item.removeFromParent());
    }
  }
  longBox.dispose();
  // A fixed pool of nearby fixture lights keeps shader cost bounded.
  const pendantPositions=haloBodies.map(matrix=>bend(new T.Vector3().setFromMatrixPosition(matrix)).add(new T.Vector3(0,-.2,0)));
  const pendantLights=Array.from({length:components.pendants?2:0},()=>{
    const light=new T.PointLight(lighting.pendantColor,lighting.pendantIntensity,38,1.5);scene.add(light);return light;
  });
  const edgeLights=Array.from({length:components.edgeStrips?2:0},()=>{
    const light=new T.PointLight(chapterLEDColors[0],lighting.edgeIntensity,16,1.3);scene.add(light);return light;
  });
  // Only one exhibit is featured at a time; reuse its spotlight instead of
  // evaluating four spotlight shaders on every surface in the hall.
  spots.forEach(spot=>scene.remove(spot));
  const exhibitLight=new T.SpotLight(lighting.exhibitColor,0,15,Math.PI/5,1,1);
  scene.add(exhibitLight,exhibitLight.target);
  const finaleLightPosition = bend(new T.Vector3(-1.1, 6.3, -188));
  const finaleLightTarget = bend(new T.Vector3(0, settings.finale.modelHeight, -192.55));
  // Real illumination is attached to the visible lamp lenses. Reuse four
  // spotlights for the nearest two photographs instead of forty live lights.
  scene.updateMatrixWorld(true);
  const pictureFixtures=pictureGroups.map(frame=>({
    centre:frame.localToWorld(new T.Vector3(0,0,.14)),
    sources:[-.85,.85].map(x=>frame.localToWorld(new T.Vector3(x,1.9,.61))),
    targets:[-.85,.85].map(x=>frame.localToWorld(new T.Vector3(x*.4,-.15,.14))),
  }));
  const pictureLights=Array.from({length:components.photoLights?4:0},()=>{
    const light=new T.SpotLight(lighting.pictureColor,0,10,Math.PI/3,1,2);
    scene.add(light,light.target);return light;
  });
  const ledPalette=chapterLEDColors.map(color=>new T.Color(color));
  const edgePosition=new T.Vector3();
  const look = new T.Vector3();
  const rigPosition=new T.Vector3(),desiredPosition=new T.Vector3(),rigRotation=new T.Quaternion(),desiredRotation=new T.Quaternion(),viewRotation=new T.Matrix4();
  let rigReady=false,rigSettled=true;
  const quality=createRenderQuality(settings.performance.fps);let viewportWidth=1,viewportHeight=1;
  const sizeRenderer=()=>{const ratio=Math.min(1,settings.performance.maxWidth/viewportWidth,settings.performance.maxHeight/viewportHeight)*Math.max(settings.performance.minScale,Math.min(settings.performance.maxScale,settings.performance.adaptiveQuality?quality.scale:settings.performance.maxScale));renderer.setSize(Math.round(viewportWidth*ratio),Math.round(viewportHeight*ratio),false);};
  const viewFrustum = new T.Frustum(), viewMatrix = new T.Matrix4();
  const exhibitBounds = new T.Sphere(new T.Vector3(), 2.3);
  function draw(delta=1/60) {
    if (disposed || !prepared || !active || !pageIsActive(host)) return;
    // Upload at most one arriving photograph per frame to avoid a burst of GPU work.
    const photo=pendingPhotos.shift();
    if(photo){renderer.initTexture(photo.map);photo.material.map=photo.map;photo.material.color.set('#ffffff');}
    if (book) {
      const viewingBook = current > 1.06 && current < 1.4;
      if (viewingBook && !bookVisible) book.restart(!paused && !reduced);
      if (reduced) book.finish();
      bookVisible = viewingBook;
    }
    projectFilms.forEach(film=>film.update(current,active&&pageIsActive(host),paused||reduced));
    const index = Math.min(4, Math.floor(current)), fraction = Math.min(1, current - index);
    const easePath=(v:number)=>{const t=T.MathUtils.clamp(v,0,1);return t*t*t*(t*(t*6-15)+10);};
    let pathZ:number;
    let targetFOV = settings.camera.fieldOfView;
    if(index<4){
      const startZ=65-index*60,iconZ=52-index*60;
      const arrival=easePath(fraction/.12),wallArrival=easePath((fraction-.3)/.12);
      const side=index%2===0?1:-1;
      const firstBay=58.5-9*Math.round((58.5-(iconZ-10))/9);
      // Each leg spends its final quarter stationary, facing the photograph.
      // Progress remains scroll-driven; scrolling back retraces the same stops.
      const leg=Math.max(0,Math.min(4,(fraction-.5)/.11));
      const legIndex=Math.min(3,Math.floor(leg));
      const legProgress=easePath((leg-legIndex)/(1-settings.camera.photoPause));
      const galleryStep=fraction<.5?0:legIndex+legProgress;
      const onward=easePath((fraction-.94)/.06);
      const galleryZ=firstBay-galleryStep*9;
      pathZ=startZ-5.5*arrival+(firstBay-(startZ-5.5))*wallArrival-galleryStep*9;
      pathZ+=(startZ-60-pathZ)*onward;
      camera.position.set(-side*(.9*arrival*(1-wallArrival)+framing.lateralStep*wallArrival*(1-onward)),2.35,pathZ);
      const desktopIconLook=index===0?1:side===1?1.8:-1;
      const iconLookX=T.MathUtils.lerp(desktopIconLook,side*3.5,framing.portrait)*arrival;
      targetFOV=T.MathUtils.lerp(framing.iconFOV,framing.photoFOV,wallArrival*(1-onward));
      look.set((iconLookX+(side*6.67-iconLookX)*wallArrival)*(1-onward),
        (2.35+.35*arrival+.4*wallArrival)*(1-onward)+2.35*onward,
        (iconZ+(galleryZ-iconZ)*wallArrival)*(1-onward)+(startZ-73)*onward);
    }else{
      pathZ=-175-13*easePath(fraction);
      const eyeHeight=2.35+1.15*easePath(fraction);
      camera.position.set(0,eyeHeight,pathZ);look.set(0,eyeHeight,-193);
    }
    bend(camera.position);bend(look);desiredPosition.copy(camera.position);
    desiredRotation.setFromRotationMatrix(viewRotation.lookAt(desiredPosition,look,camera.up));
    if(!rigReady||reduced){rigPosition.copy(desiredPosition);rigRotation.copy(desiredRotation);rigReady=true;}
    else{rigPosition.lerp(desiredPosition,1-Math.exp(-settings.camera.positionSmoothing*delta));rigRotation.slerp(desiredRotation,1-Math.exp(-settings.camera.turnSmoothing*delta));}
    const nextFOV = reduced ? targetFOV : T.MathUtils.damp(camera.fov, targetFOV, 10, delta);
    if (Math.abs(camera.fov - nextFOV) > .001) { camera.fov = nextFOV; camera.updateProjectionMatrix(); }
    rigSettled=Math.abs(camera.fov-targetFOV)<.01&&rigPosition.distanceToSquared(desiredPosition)<.00001&&rigRotation.angleTo(desiredRotation)<.0002;
    camera.position.copy(rigPosition);camera.quaternion.copy(rigRotation);
    const nearestPendants=pendantPositions.map((position,index)=>({index,distance:position.distanceToSquared(camera.position)})).sort((a,b)=>a.distance-b.distance);
    pendantLights.forEach((light,i)=>light.position.copy(pendantPositions[nearestPendants[i].index]));
    edgeLights.forEach((light,i)=>{
      const side=i%2===0?-1:1,lightZ=pathZ+(i<2?5:-9);
      light.color.copy(ledPalette[0]);
      for(let boundary=0;boundary<3;boundary++){
        const blend=T.MathUtils.smoothstep(69-(boundary+1)*60-lightZ,0,8);
        light.color.lerp(ledPalette[boundary+1],blend);
      }
      light.position.copy(bend(edgePosition.set(side*6.6,4.8,lightZ)));
    });
    const nearestPictures=pictureFixtures.map((fixture,index)=>({index,distance:fixture.centre.distanceToSquared(camera.position)})).sort((a,b)=>a.distance-b.distance);
    pictureLights.forEach((light,i)=>{
      const entry=nearestPictures[Math.floor(i/2)],fixture=pictureFixtures[entry.index];
      light.position.copy(fixture.sources[i%2]);light.target.position.copy(fixture.targets[i%2]);
      light.intensity=lighting.pictureIntensity*(1-T.MathUtils.smoothstep(Math.sqrt(entry.distance),10,22));
    });
    camera.updateMatrixWorld();
    viewFrustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    models.forEach((model, i) => {
      exhibitBounds.center.set(model.position.x, 3.4, model.position.z);
      model.visible = components.models && viewFrustum.intersectsSphere(exhibitBounds);
      if (!model.visible) { spots[i].intensity = 0; return; }
      const reveal = pavilionExhibitReveal(current, i);
      const elapsed = modelTimes[i];
      model.rotation.y = (model.userData.pathYaw || 0) -.15 + Math.sin(elapsed * .25 + i) * settings.camera.modelSway;
      model.position.y = 2.65 + reveal * .75 + Math.sin(elapsed * .7 + i) * settings.camera.modelFloat;
      model.scale.setScalar(.72 + reveal * .38);
      spots[i].intensity = reveal * lighting.exhibitIntensity;
      (pools[i].material as T.MeshBasicMaterial).opacity = reveal * .22;
    });
    const litExhibit=spots.reduce((best,spot,i)=>spot.intensity>spots[best].intensity?i:best,0);
    exhibitLight.position.copy(spots[litExhibit].position);
    exhibitLight.target.position.copy(spots[litExhibit].target.position);
    exhibitLight.intensity=spots[litExhibit].intensity;
    if (current > 3.94) {
      exhibitLight.position.copy(finaleLightPosition); exhibitLight.target.position.copy(finaleLightTarget);
      exhibitLight.target.position.y = farewellEmblem.position.y;
      exhibitLight.intensity = settings.finale.modelLightIntensity * T.MathUtils.smoothstep(current, 3.94, 4.12);
    }
    // Photos must be ready before they emerge from the 100-unit fog, even
    // when their chapter is not yet active. Retain loaded textures on return.
    for (const frames of photoFrames) for (const item of frames) if (!item.loaded && item.position.distanceToSquared(camera.position) < settings.performance.photoLoadDistance ** 2) {
      item.loaded = true;
      new T.TextureLoader().load(item.src, map => {
        if (disposed) { map.dispose(); return; }
        map.colorSpace = T.SRGBColorSpace;
        const imageAspect = map.image.width / map.image.height, frameAspect = 3.26 / 2.29;
        if (imageAspect > frameAspect) { map.repeat.x = frameAspect / imageAspect; map.offset.x = (1 - map.repeat.x) / 2; }
        else { map.repeat.y = imageAspect / frameAspect; map.offset.y = (1 - map.repeat.y) / 2; }
        photoTextures.push(map);pendingPhotos.push({material:item.material,map});
        // Batch simultaneous image completions into the next animation frame.
        if (active && pageIsActive(host)) clock.start();
      }, undefined, () => { /* Keep the frame if its archive image is unavailable. */ });
    }
    renderer.render(scene, camera);
  }
  const clock = createFrameClock(delta => {
    if (!prepared || !active || !pageIsActive(host)) { clock.stop(); return; }
    current = reduced ? target : T.MathUtils.damp(current, target, settings.camera.scrollSmoothing, delta);
    if (!paused && !reduced) {
      models.forEach((model, i) => { if (model.visible && pavilionExhibitReveal(current, i) > 0) modelTimes[i] += delta; });
      if (bookVisible) book?.advance(delta);
    }
    const started=performance.now();draw(delta);
    if(settings.performance.adaptiveQuality&&quality.sample(delta,performance.now()-started))sizeRenderer();
    if (pendingPhotos.length===0 && rigSettled && (paused || reduced || !hasLiveExhibit()) && Math.abs(target - current) < .001) {
      clock.stop(); renderer.domElement.dataset.renderState = 'paused';
    }
  }, settings.performance.fps);
  const sync = () => {
    clock.stop();
    projectFilms.forEach(film=>film.update(current,active&&pageIsActive(host),paused||reduced));
    if (!active || !pageIsActive(host)) bookVisible = false;
    renderer.domElement.dataset.renderState = 'paused';
    if (active && pageIsActive(host)) {
      draw();
      if (!reduced && !paused && hasLiveExhibit() || pendingPhotos.length>0 || !rigSettled || Math.abs(target - current) > .001) {
        renderer.domElement.dataset.renderState = 'running'; clock.start();
      }
    }
  };
  const resize = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    viewportWidth=w;viewportHeight=h;
    framing=pavilionFraming(w,h,settings.camera.fieldOfView,settings.finale.modelSize, settings.finale.modelHeight);
    farewellEmblem.scale.setScalar(framing.emblemScale);
    farewellEmblem.position.y = settings.finale.modelHeight + framing.emblemOffsetY;
    sizeRenderer(); camera.aspect = w / h; camera.updateProjectionMatrix(); paintFarewell(); draw();
  });
  const warmScene=()=>{
    compile(scene).then(()=>{if(!disposed){prepared=true;sync();}}).catch(()=>{if(!disposed){prepared=true;sync();}});
  };
  // Prepare shader variants under the entrance, before the visitor starts walking.
  queueMicrotask(()=>{if(!disposed)warmScene();});
  resize.observe(host); document.addEventListener('visibilitychange', sync);
  document.addEventListener(PAGE_ACTIVITY_EVENT, sync);
  const lost = (event: Event) => { event.preventDefault(); clock.stop(); host.dataset.failed = 'true'; };
  const restored = () => { delete host.dataset.failed; prepared=false;warmScene(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);
  return {
    update(progress: number, visible: boolean, calm: boolean, stopped: boolean) {
      const changed = active !== visible || reduced !== calm || paused !== stopped;
      target = Math.max(0, Math.min(5, progress)); active = visible; reduced = calm; paused = stopped;
      if (!rigReady) current = target;
      if (reduced) current = Math.round(target);
      if (changed) sync();
      else if (active && pageIsActive(host)) {
        if (reduced) draw();
        else if (!paused && hasLiveExhibit() || pendingPhotos.length>0 || !rigSettled || Math.abs(target - current) > .001) {
          renderer.domElement.dataset.renderState = 'running'; clock.start();
        }
      }
    },
    dispose() {
      disposed = true; projectFilms.forEach(film=>film.dispose()); clock.stop(); resize.disconnect(); document.removeEventListener('visibilitychange', sync);
      document.removeEventListener(PAGE_ACTIVITY_EVENT, sync);
      renderer.domElement.removeEventListener('webglcontextlost', lost); renderer.domElement.removeEventListener('webglcontextrestored', restored);
      renderer.domElement.remove();
      const releaseGPU = () => {
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
      const textures = new Set<T.Texture>([...photoTextures, ...surfaceTextures, texture]);
      scene.traverse(child => { if (child instanceof T.Mesh) { geometries.add(child.geometry); for (const m of Array.isArray(child.material) ? child.material : [child.material]) materials.add(m); } });
      // Uploaded GLB textures belong to this scene too. Repeated publications must
      // release them along with procedural surfaces, films and photo textures.
      for (const material of materials) {
        for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
      }
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(map => map.dispose()); contacts.dispose(); furnishingBatches.forEach(mesh=>mesh.dispose()); renderer.dispose(); renderer.forceContextLoss();
      };
      // Three's asynchronous shader readiness poll still owns its programs until
      // compilation settles. Releasing those programs early breaks rapid CMS updates.
      if (compilationTasks.size) void Promise.allSettled([...compilationTasks]).then(releaseGPU);
      else releaseGPU();
    },
  };
}
