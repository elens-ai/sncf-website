import { resolveCMSAsset } from './runtime';

/** Resolve shared asset assignments without evaluating a dynamic source twice. */
export function resolveCMSMedia(source: string): string {
  return source ? resolveCMSAsset(source, source) : source;
}
