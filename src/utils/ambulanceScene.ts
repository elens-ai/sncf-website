/** A complete left-to-right pass, with wheel rotation matched to distance. */
export function ambulanceScene(roadWidth: number, vehicleWidth: number, progress: number, reduced = false) {
  const travel = (roadWidth + vehicleWidth) * Math.min(1, Math.max(0, progress));
  return {
    x: reduced ? (roadWidth - vehicleWidth) / 2 : travel - vehicleWidth,
    wheel: reduced ? 0 : travel / (vehicleWidth * 23 / 480) * 180 / Math.PI,
  };
}
