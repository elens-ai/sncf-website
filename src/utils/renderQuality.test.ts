import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderQuality } from './renderQuality';

test('sustained slow frames lower resolution within the legibility floor',()=>{
  const quality=createRenderQuality();
  for(let i=0;i<600;i++)quality.sample(1/30,20);
  assert.equal(quality.scale,.65);
});
test('isolated stalls do not cause resolution pumping',()=>{
  const quality=createRenderQuality();
  quality.sample(2,800);
  for(let i=0;i<120;i++)quality.sample(1/60,5);
  assert.equal(quality.scale,1);
});
test('recovery requires sustained headroom and raises quality gradually',()=>{
  const quality=createRenderQuality();
  for(let i=0;i<60;i++)quality.sample(1/30,20);
  const low=quality.scale;
  for(let i=0;i<120;i++)quality.sample(1/60,5);
  assert.equal(quality.scale,low);
  for(let i=0;i<600;i++)quality.sample(1/60,5);
  assert.ok(quality.scale>low&&quality.scale<=1);
});

test('an authored 30 fps target does not lower quality when meeting its budget',()=>{
  const quality=createRenderQuality(30);
  for(let i=0;i<600;i++)quality.sample(1/30,20);
  assert.equal(quality.scale,1);
});
