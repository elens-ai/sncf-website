/** A bounded render clock. Stopping cancels the callback, rather than waking
 * every frame just to discover that the scene is paused. */
export function createFrameClock(draw: (delta: number) => void, fps = 30, scheduler = {
  request: (callback: FrameRequestCallback) => requestAnimationFrame(callback),
  cancel: (id: number) => cancelAnimationFrame(id),
}) {
  let running = false;
  let frame = 0;
  let last: number | null = null;
  let lastDraw: number | null = null;
  const interval = 1000 / fps;
  const tick = (time: number) => {
    frame = 0;
    if (!running) return;
    const delta = last === null ? interval : time - last;
    if (delta >= interval - .01) {
      const elapsed = lastDraw === null ? interval : time - lastDraw;
      lastDraw = time;
      last = last === null ? time : last + Math.max(1, Math.floor((delta + .01) / interval)) * interval;
      draw(Math.min(elapsed / 1000, .1));
    }
    if (running) frame = scheduler.request(tick);
  };
  return {
    start() {
      if (running) return;
      running = true; last = null; lastDraw = null; frame = scheduler.request(tick);
    },
    stop() {
      running = false; scheduler.cancel(frame); frame = 0; last = null; lastDraw = null;
    },
  };
}
