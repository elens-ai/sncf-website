/** Scroll stages: leave Health City, notice, run right, think, then chase the reversing van. */
export function ambulanceScene(roadWidth: number, vehicleWidth: number, progress: number, reduced = false, doorway?: { left: number; rise: number; scale: number }) {
  const p = Math.min(1, Math.max(0, progress));
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const start = roadWidth / 3 - 18;
  const meetingCentre = roadWidth * .605;
  const gap = Math.max(60, roadWidth * .08);
  const frontOffset = vehicleWidth * 455 / 480;
  const meetingX = meetingCentre - gap - frontOffset;
  const initialBumper = roadWidth / 3 - Math.max(60, roadWidth * .12);
  const initialX = initialBumper - frontOffset;
  const exit = reduced ? 1 : clamp(p / .12);
  const run = reduced ? 0 : clamp((p - .18) / .24);
  const reverse = reduced ? 0 : clamp((p - .50) / .50);
  const reversing = reverse > 0;
  const thinking = !reduced && p >= .42 && p <= .50;
  const frozen = thinking;
  const exiting = !!doorway && exit < 1;
  const noticing = !reduced && p >= .12 && p <= .18;
  // Both move left by the same distance, maintaining separation as the van backs away.
  const retreat = reverse * Math.max(meetingCentre + 60, meetingX + vehicleWidth + 60);
  const x = reduced ? (roadWidth - vehicleWidth) / 2
    : p < .18 ? -vehicleWidth + (initialX + vehicleWidth) * clamp(p / .18)
    : initialX + (meetingX - initialX) * run - retreat;
  const pedestrianLeft = exiting ? doorway.left + (start - doorway.left) * exit
    : start + (meetingCentre - 18 - start) * run - retreat;
  const running = !reduced && ((p > .18 && p < .42) || (p > .50 && p < 1));
  const phase = exiting ? exit * 24 : (pedestrianLeft - start) / 7;
  return {
    x, pedestrianLeft, running, exiting, noticing, thinking, frozen, reversing,
    rise: exiting ? doorway.rise * (1 - exit) : 0,
    scale: exiting ? doorway.scale + (1 - doorway.scale) * exit : 1,
    opacity: exiting ? Math.min(1, exit * 10) : 1,
    stride: running || exiting ? Math.sin(phase) * 38 : 0,
    bounce: running || exiting ? Math.abs(Math.sin(phase)) * 4 : 0,
    wheel: reduced ? 0 : (x + vehicleWidth) / (vehicleWidth * 23 / 480) * 180 / Math.PI,
  };
}
