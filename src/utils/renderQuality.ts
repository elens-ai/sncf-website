/** Hysteresis avoids visible resolution changes while responding to sustained load. */
export function createRenderQuality(targetFPS = 60) {
  const frameBudget = 1000 / Math.max(24, Math.min(60, targetFPS));
  let scale = 1, elapsed = 0, cost = 0, frames = 0, healthySeconds = 0;
  return {
    get scale() { return scale; },
    sample(frameSeconds: number, renderMs: number) {
      if (frameSeconds <= 0 || frameSeconds > .08) return false;
      elapsed += frameSeconds; cost += renderMs; frames++;
      if (elapsed < 1.5) return false;
      const averageFrame = elapsed * 1000 / frames, averageCost = cost / frames;
      const previous = scale;
      if (averageFrame > frameBudget * 1.5 || averageCost > frameBudget * .9) {
        scale = Math.max(.65, scale - .1); healthySeconds = 0;
      } else if (averageFrame < frameBudget * 1.14 && averageCost < frameBudget * .54) {
        healthySeconds += elapsed;
        if (healthySeconds > 6) { scale = Math.min(1, scale + .05); healthySeconds = 0; }
      } else healthySeconds = 0;
      elapsed = 0; cost = 0; frames = 0;
      return scale !== previous;
    },
  };
}
