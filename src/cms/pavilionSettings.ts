import { getCMSValue } from './runtime';
import { normalizePavilionSettings } from './pavilionDefaults';

/** Read once when building a scene; publishing rebuilds the scene instead of polling each frame. */
export function getPavilionSettings() {
  return normalizePavilionSettings(getCMSValue('pavilion', {}));
}
