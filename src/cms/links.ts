import { getCMSCopy, safeCMSURL } from './runtime';

/** Editable destinations remain HTTP(S), app routes, anchors, mail or phone links. */
export function getCMSLink(key: string, fallback: string): string {
  const destination = getCMSCopy(key, fallback);
  return safeCMSURL(destination, true) ? destination : fallback;
}
