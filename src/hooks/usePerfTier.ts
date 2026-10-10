import { useSyncExternalStore } from 'react';
import { onPerfTier, perfTier, type PerfTier } from '../utils/perfTier';

const subscribe = (changed: () => void) => onPerfTier(changed);

/** The device's tier (utils/perfTier), for the components that draw for themselves; it only ever steps down. */
export function usePerfTier(): PerfTier {
  return useSyncExternalStore(subscribe, perfTier, perfTier);
}
