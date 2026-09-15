import { resolveCMSAsset } from '../cms/runtime';
import { PETAL_ART, PALM_ART } from './petalArt';
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import './curtain-entrance.css';
/** Smooth source alpha explicitly: Canvas filters are not supported in every browser.
 * Three separable box passes approximate a Gaussian, once per loaded asset. */
function smoothContour(image: HTMLImageElement, palm: boolean) {
  const mask = document.createElement('canvas');
  mask.width = 512; mask.height = Math.round(512 * image.naturalHeight / image.naturalWidth);
  const context = mask.getContext('2d')!;
  context.drawImage(image, 0, 0, mask.width, mask.height);
  const pixels = context.getImageData(0, 0, mask.width, mask.height);
  const { width: w, height: h } = mask;
  let alpha = Float32Array.from({ length: w * h }, (_, i) => pixels.data[i * 4 + 3]);
  let next = new Float32Array(alpha.length);
  const radius = palm ? 2 : 6;
  const span = radius * 2 + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += alpha[y * w + Math.max(0, Math.min(w - 1, k))];
      for (let x = 0; x < w; x++) {
        next[y * w + x] = sum / span;
        sum += alpha[y * w + Math.min(w - 1, x + radius + 1)] - alpha[y * w + Math.max(0, x - radius)];
      }
    }
    [alpha, next] = [next, alpha];
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += alpha[Math.max(0, Math.min(h - 1, k)) * w + x];
      for (let y = 0; y < h; y++) {
        next[y * w + x] = sum / span;
        sum += alpha[Math.min(h - 1, y + radius + 1) * w + x] - alpha[Math.max(0, y - radius) * w + x];
      }
    }
    [alpha, next] = [next, alpha];
  }
  for (let i = 0; i < alpha.length; i++) {
    pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = 255;
    pixels.data[i * 4 + 3] = Math.round(alpha[i]);
  }
  context.putImageData(pixels, 0, 0);
  return mask;
}

export const PAVILION_ENTRANCE_VH = 1.4;
export const entranceDistance = () => Math.max(0, (document.getElementById('hero-clone-stage')?.offsetHeight || innerHeight) - innerHeight) + innerHeight * PAVILION_ENTRANCE_VH;
export interface CurtainEntranceHandle { update(top: number, viewport: number, reduced: boolean): void }
/** Scroll drives existing DOM layers; the 3D icon keeps its original renderer. */
export const CurtainEntrance = forwardRef<CurtainEntranceHandle, Record<string, never>>((_props, ref) => {
  const tiles = useRef<HTMLCanvasElement[]>([]);
  const lastFrame = useRef('');
  const composition = useRef<HTMLCanvasElement | null>(null);
  const compositionFrame = useRef('');
  const dimensions = useRef<{ hero: HTMLElement; width: number; height: number; outerHeight: number; canvas: HTMLCanvasElement | null } | null>(null);
  const styleValues = useRef(new WeakMap<HTMLElement, Map<string, string>>());
  useEffect(() => {
    const hero = document.getElementById('hero-clone-stage');
    if (!hero) return;
    const measure = () => {
      dimensions.current = { hero, width: hero.clientWidth, height: hero.clientHeight, outerHeight: hero.offsetHeight,
        canvas: hero.querySelector<HTMLCanvasElement>('.hero-petal-transition-canvas') };
      lastFrame.current = '';
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero); measure();
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); dimensions.current = null; };
  }, []);
  useEffect(() => {
    let disposed = false;
    Promise.all([...PETAL_ART,{...PALM_ART,src:resolveCMSAsset("asset.CurtainEntrance.2aec77b1523f", "/images/curtain-ghost-palm.svg")}].map(art => new Promise<HTMLCanvasElement>(resolve => {
      const image = new Image(); image.onload = () => {
        const tile = document.createElement('canvas'); tile.width = 2048; tile.height = Math.round(2048*image.naturalHeight/image.naturalWidth);
        const ctx = tile.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Upscale the smoothed coverage first, then restore the clean white edge.
        ctx.drawImage(smoothContour(image, art.src.includes('curtain-ghost-palm')), 0, 0, tile.width, tile.height);
        const ink=ctx.getImageData(0,0,tile.width,tile.height);
        // Remove the source mask's broad blur without creating a hard stair-step edge.
        // A narrow smooth coverage ramp keeps the silhouette antialiased.
        const isPalm=art.src.includes('curtain-ghost-palm');
        const coverageRamp = new Uint8Array(256);
        for (let alpha = 0; alpha < 256; alpha++) {
          const edge = Math.max(0, Math.min(1, (alpha / 255 - (isPalm ? .42 : .38)) / (isPalm ? .16 : .24)));
          coverageRamp[alpha] = Math.round(255 * edge * edge * (3 - 2 * edge));
        }
        for (let a = 3; a < ink.data.length; a += 4) ink.data[a] = coverageRamp[ink.data[a]];
        ctx.putImageData(ink,0,0);
        if(isPalm){
          // Reuse the pixels already in memory instead of reading the large
          // canvas back from the GPU a second time just to find its bounds.
          const pixels=ink.data;
          let x0=tile.width,y0=tile.height,x1=0,y1=0;
          for(let y=0;y<tile.height;y++)for(let x=0;x<tile.width;x++)if(pixels[(y*tile.width+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
          const crop=document.createElement('canvas');crop.width=x1-x0+1;crop.height=y1-y0+1;
          crop.getContext('2d')!.drawImage(tile,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);resolve(crop);
        }else resolve(tile);
      }; image.src=art.src;
    }))).then(result => {if(!disposed){tiles.current=result;window.dispatchEvent(new Event("resize"));}});
    return () => {
      disposed=true;
      const header=document.getElementById('site-header');
      if(header){header.style.removeProperty('--entrance-header-opacity');header.removeAttribute('data-entrance-hidden');header.inert=false;}
    };
  },[]);
  useImperativeHandle(ref, () => ({ update(top, viewport, reduced) {
    const measured = dimensions.current;
    if (!measured) return;
    const { hero, width: w, height: h, canvas } = measured;
    const extra = Math.max(0, measured.outerHeight - viewport);
    const p = Math.max(0, Math.min(1, (-top - extra) / (viewport * PAVILION_ENTRANCE_VH)));
    // Once the entrance is offscreen its clamped progress does not change.
    // Keep the high-resolution artwork, without clearing two large canvases.
    const frameKey=`${p}:${viewport}:${w}:${h}:${reduced}:${tiles.current.length}:${devicePixelRatio}`;
    if(lastFrame.current===frameKey)return;
    lastFrame.current=frameKey;
    const setStyle = (element: HTMLElement, name: string, value: string) => {
      let values = styleValues.current.get(element);
      if (!values) { values = new Map(); styleValues.current.set(element, values); }
      if (values.get(name) === value) return;
      values.set(name, value); element.style.setProperty(name, value);
    };
    const ease = (value: number) => { const x = Math.max(0, Math.min(1, value)); return x*x*x*(x*(x*6-15)+10); };
    const opening = Math.max(0, Math.min(1, (p - .66) / .34));
    const t = reduced ? (p > .7 ? 1 : 0) : ease(opening);
    const header=document.getElementById('site-header');
    if(header){
      const headerOpacity=reduced?(p>0&&p<.9?0:1):Math.max(1-ease(p/.045),ease((opening-.55)/.35));
      setStyle(header, '--entrance-header-opacity', String(headerOpacity));
      if (header.dataset.entranceHidden !== String(headerOpacity < .01)) header.dataset.entranceHidden = String(headerOpacity < .01);
      if (header.inert !== (headerOpacity < .5)) header.inert = headerOpacity < .5;
    }

    setStyle(hero, '--hero-scene-opacity', String(1 - ease((p - .44) / .04)));
    setStyle(hero, '--hero-copy-opacity', String(1 - ease(p / .19)));
    setStyle(hero, '--curtain-arrival', String(ease((p - .27) / .17)));
    setStyle(hero, '--curtain-breeze', String(reduced ? 0 : ease((p - .3) / .14) * (1 - ease(opening))));

    setStyle(hero, '--ghost-alpha',tiles.current.length===6?'0':'.09');
    const output=canvas?.getContext('2d');
    if(canvas && output && tiles.current.length===6){
      if(!composition.current)composition.current=document.createElement('canvas');
      const buffer=composition.current,ctx=buffer.getContext('2d')!;
      const ratio=Math.min(devicePixelRatio,2);
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
      if(buffer.width!==canvas.width||buffer.height!==canvas.height){buffer.width=canvas.width;buffer.height=canvas.height;}
      // Once the leaves and palm have reunited their composition is static.
      // Opening the curtain only copies the two cached halves of this artwork.
      const compositionKey = `${Math.min(p, .42)}:${viewport}:${w}:${h}:${ratio}:${reduced}:${tiles.current.length}`;
      if (compositionFrame.current !== compositionKey) {
      compositionFrame.current = compositionKey;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      output.imageSmoothingEnabled=true;output.imageSmoothingQuality='high';
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
      const petalBottom=Math.max(...PETAL_ART.map(a=>a.y+a.h));
      const hand={...PALM_ART,y:petalBottom-5,h:PALM_ART.w*tiles.current[5].height/tiles.current[5].width};
      const parts=[...PETAL_ART,hand],left=Math.min(...parts.map(a=>a.x)),top=Math.min(...parts.map(a=>a.y));
      const aw=Math.max(...parts.map(a=>a.x+a.w))-left,ah=Math.max(...parts.map(a=>a.y+a.h))-top;
      const scale=Math.min(w*.7/aw,viewport*.65/ah);
      const pl=Math.min(...PETAL_ART.map(a=>a.x)),pt=Math.min(...PETAL_ART.map(a=>a.y));
      const pw=Math.max(...PETAL_ART.map(a=>a.x+a.w))-pl,ph=Math.max(...PETAL_ART.map(a=>a.y+a.h))-pt;
      const initialScale=Math.min(w*.6/pw,viewport*.6/ph);
      parts.forEach((art,i)=>{
        // Every leaf begins in its visible hero position. Stagger only its motion.
        const land=reduced?ease(p/.42):ease((p-i*.025)/.32);

        const endX=(w-aw*scale)/2+(art.x-left+art.w/2)*scale,endY=(h-ah*scale)/2+(art.y-top+art.h/2)*scale;
        const startX=(w-pw*initialScale)/2+(art.x-pl+art.w/2)*initialScale,startY=(h-ph*initialScale)/2+(art.y-pt+art.h/2)*initialScale;
        const size=i===5?scale:initialScale+(scale-initialScale)*land;
        // A leftward falling arc gathers back into the original flower.
        // Each leaf stays visible; there is no respawn or full-circle spin.
        const u=1-land;
        const laneX=w*(.13+i*.026);
        const controlY=Math.min(h*.86,Math.max(startY,endY)+h*(.2+i*.012));
        const x=i===5?endX:reduced?startX+(endX-startX)*land:
          u*u*u*startX+3*u*u*land*laneX+3*u*land*land*laneX+land*land*land*endX;
        const y=i===5?endY:reduced?startY+(endY-startY)*land:
          u*u*u*startY+3*u*u*land*(startY+h*.12)+3*u*land*land*controlY+land*land*land*endY;
        ctx.save();ctx.globalAlpha=i===5?ease((p-.3)/.12):.09+.91*ease(p/.16);
        ctx.translate(x,y);
        if(i<5&&!reduced)ctx.rotate(Math.sin(land*Math.PI)*(-.55+i*.09)+Math.sin(land*Math.PI*3)*.07);
        ctx.drawImage(tiles.current[i],-art.w*size/2,-art.h*size/2,art.w*size,art.h*size);ctx.restore();
      });
      }
      // Keep this exact drawing alive on the fabric, then carry its halves away.
      output.setTransform(1,0,0,1,0,0);output.clearRect(0,0,canvas.width,canvas.height);
      const shift=t*w*.58*ratio,lift=Math.sin(opening*Math.PI)*viewport*-.03*ratio;
      const half=Math.floor(canvas.width/2);
      const billow=Math.tan(Math.sin(opening*Math.PI)*5*Math.PI/180);
      output.setTransform(1,0,-billow,1,-shift,lift);
      output.drawImage(buffer,0,0,half,buffer.height,0,0,half,buffer.height);
      output.setTransform(1,0,billow,1,shift,lift);
      output.drawImage(buffer,half,0,buffer.width-half,buffer.height,half,0,buffer.width-half,buffer.height);
      output.setTransform(1,0,0,1,0,0);
    }
    setStyle(hero, '--woven-opacity', '0');
    setStyle(hero, '--curtain-travel', `${t * 58}vw`);
    setStyle(hero, '--curtain-billow', `${Math.sin(opening * Math.PI) * 5}deg`);
    setStyle(hero, '--curtain-lift', `${Math.sin(opening * Math.PI) * -3}vh`);
    setStyle(hero, '--curtain-detail', String(ease((p - .49) / .1) * (1 - ease(opening / .3))));
    if (hero.dataset.curtainActive !== String(p > .26 && p < 1)) hero.dataset.curtainActive = String(p > .26 && p < 1);
    if (hero.style.visibility !== (t >= 1 ? 'hidden' : 'visible')) hero.style.visibility = t >= 1 ? 'hidden' : 'visible';
    if (hero.inert !== (p > .12)) hero.inert = p > .12;
    if (hero.dataset.curtainOpen !== String(t >= 1)) hero.dataset.curtainOpen = String(t >= 1);
  } }), []);
  return null;
});
