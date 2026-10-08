/// <reference types="vite/client" />
import { useState } from 'react';

const KEY = 'sncf.dev.illustration-seconds';
export const DEFAULT_ILLUSTRATION_SECONDS = 4;
export const localIllustrationSettings = import.meta.env.DEV && typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname);
const validSeconds = (value: number) => Number.isFinite(value) && value >= 1 && value <= 60;

export function useIllustrationTiming() {
  const [seconds, setSeconds] = useState(() => {
    if (!localIllustrationSettings) return DEFAULT_ILLUSTRATION_SECONDS;
    try {
      const saved = Number(localStorage.getItem(KEY));
      return validSeconds(saved) ? saved : DEFAULT_ILLUSTRATION_SECONDS;
    } catch { return DEFAULT_ILLUSTRATION_SECONDS; }
  });
  const updateSeconds = (value: number) => {
    if (!localIllustrationSettings || !validSeconds(value)) return;
    setSeconds(value);
    try { localStorage.setItem(KEY, String(value)); } catch { /* Preview still works without storage. */ }
  };
  return { seconds, updateSeconds };
}
