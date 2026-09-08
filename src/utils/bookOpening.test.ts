import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, Vector3, Mesh, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBookOpening } from './bookOpening';

test('supplied Enrich model opens at its hinges and can replay without changing its resting shape', async () => {
  const bytes = await readFile(new URL('../../public/models/enrich.glb', import.meta.url));
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const width = () => new Box3().setFromObject(scene).getSize(new Vector3()).x;
  const openWidth = width();
  const book = createBookOpening(scene);
  assert.ok(book, 'both supplied hinge nodes must be found');
  let whitePages = 0;
  scene.traverse(node => {
    if (!(node instanceof Mesh) || !(node.material instanceof MeshBasicMaterial)) return;
    whitePages++;
    assert.equal(node.material.toneMapped, false, 'unlit pages must bypass filmic greying');
    assert.equal(node.material.color.getHex(), 0xffffff);
  });
  assert.equal(whitePages, 2);
  book.restart();
  const closedWidth = width();
  assert.ok(closedWidth < openWidth * .6, 'covers fold towards the spine');
  book.advance(.8);
  assert.ok(width() > closedWidth && width() < openWidth);
  book.advance(10);
  assert.ok(Math.abs(width() - openWidth) < 1e-6);
  book.restart();
  assert.ok(Math.abs(width() - closedWidth) < 1e-6, 're-entering replays the same opening');
  book.restart(false);
  assert.ok(Math.abs(width() - openWidth) < 1e-6, 'motion-disabled view stays fully open');
});
