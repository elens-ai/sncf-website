/// <reference types="vite/client" />
import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import './local-opacity-controls.css';

const KEY = 'sncf.local.empower-opacity';
const DEFAULTS = { top: 40, bottom: 10 };
const clamp = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;

function OpacityBar() {
  const id = useId();
  const [values, setValues] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      return { top: clamp(saved?.top, 40), bottom: clamp(saved?.bottom, 10) };
    } catch { return DEFAULTS; }
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--empower-companion-top', String(values.top / 100));
    document.documentElement.style.setProperty('--empower-companion-bottom', String(values.bottom / 100));
    try { localStorage.setItem(KEY, JSON.stringify(values)); } catch { /* sliders still work without storage */ }
  }, [values]);
  return createPortal(<details className="local-opacity-controls" open>
    <summary>Companion opacity <span>Local preview</span></summary>
    <fieldset>
      <legend className="sr-only">Empower background icon gradient</legend>
      {(['top', 'bottom'] as const).map(edge => <label key={edge} htmlFor={`${id}-${edge}`}>
        <span>{edge === 'top' ? 'Top' : 'Bottom'} <output>{values[edge]}%</output></span>
        <input id={`${id}-${edge}`} type="range" min="0" max="100" step="1" value={values[edge]}
          onChange={event => setValues(previous => ({ ...previous, [edge]: Number(event.target.value) }))} />
      </label>)}
      <button type="button" onClick={() => setValues(DEFAULTS)}>Reset</button>
    </fieldset>
  </details>, document.body);
}

export function LocalOpacityControls() {
  if (!import.meta.env.DEV || typeof window === 'undefined' || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname)) return null;
  return <OpacityBar />;
}

const CIRCLE_KEY = 'sncf.local.value-circle-opacity';

function CircleOpacityBar() {
  const id = useId();
  const [opacity, setOpacity] = useState(() => {
    try { return clamp(JSON.parse(localStorage.getItem(CIRCLE_KEY) ?? 'null'), 100); }
    catch { return 100; }
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--value-circle-opacity', String(opacity / 100));
    try { localStorage.setItem(CIRCLE_KEY, JSON.stringify(opacity)); } catch { /* Keep the live preview usable without storage. */ }
  }, [opacity]);
  useEffect(() => () => document.documentElement.style.removeProperty('--value-circle-opacity'), []);

  return createPortal(<details className="local-opacity-controls local-circle-controls" open>
    <summary>Circle settings <span>Local preview</span></summary>
    <fieldset>
      <legend className="sr-only">Core Values circle background</legend>
      <label htmlFor={id}>
        <span>Circle opacity <output htmlFor={id}>{opacity}%</output></span>
        <input id={id} aria-label="Circle opacity" type="range" min="0" max="100" step="1" value={opacity}
          onChange={event => setOpacity(Number(event.target.value))} />
      </label>
      <button type="button" onClick={() => setOpacity(100)}>Reset</button>
    </fieldset>
  </details>, document.body);
}

export function LocalCircleOpacityControls() {
  if (!import.meta.env.DEV || typeof window === 'undefined' || !['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname)) return null;
  return <CircleOpacityBar />;
}
