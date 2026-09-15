import { Mesh, MeshBasicMaterial, type Object3D } from 'three';

/** Animate the supplied book's spine hinges, without deforming its covers or pages. */
export function createBookOpening(root: Object3D) {
  let left: Object3D | undefined, right: Object3D | undefined;
  root.traverse(node => {
    // These pages are authored as unlit white. Filmic tone mapping otherwise
    // maps their white to grey; retain the cover's normal lighting response.
    if (/white[ _]open[ _]page/i.test(node.name)) node.traverse(part => {
      if (!(part instanceof Mesh)) return;
      for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
        if (material instanceof MeshBasicMaterial) {
          material.color.set(0xffffff);
          material.toneMapped = false;
          // The supplied page is only .001 units above the cover. Keep the
          // decal stable at gallery distances while retaining depth occlusion.
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -4;
          material.needsUpdate = true;
        }
      }
    });
    if (/book[ _]left[ _]hinge/i.test(node.name)) left = node;
    if (/book[ _]right[ _]hinge/i.test(node.name)) right = node;
  });
  if (!left || !right) return undefined;
  const leftBase = left.rotation.y, rightBase = right.rotation.y;
  const duration = 2.5;
  let elapsed = duration;
  const apply = () => {
    const angleAt = (delay: number) => {
      const t = Math.max(0, Math.min(1, (elapsed - delay) / (duration - delay)));
      // Zero velocity and acceleration at both ends prevent a hard start or stop.
      const eased = t * t * t * (t * (t * 6 - 15) + 10);
      return (1 - eased) * Math.PI * .43;
    };
    left!.rotation.y = leftBase + angleAt(0);
    right!.rotation.y = rightBase - angleAt(.08);
  };
  return {
    restart(animate = true) { elapsed = animate ? 0 : duration; apply(); },
    advance(delta: number) { if (elapsed < duration) { elapsed = Math.min(duration, elapsed + delta); apply(); } },
    finish() { elapsed = duration; apply(); },
  };
}
