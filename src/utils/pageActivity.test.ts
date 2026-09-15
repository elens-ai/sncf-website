import test from 'node:test';
import assert from 'node:assert/strict';
import { pageIsActive } from './pageActivity';

test('background work stops under overlays and hidden tabs, then resumes', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const state = { hidden: false, documentElement: { dataset: { backgroundPaused: 'false' } } };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: state });
  try {
    assert.equal(pageIsActive(), true);
    state.documentElement.dataset.backgroundPaused = 'true';
    assert.equal(pageIsActive(), false);
    const modalContent = { closest: () => ({}) } as unknown as HTMLElement;
    assert.equal(pageIsActive(modalContent), true);
    state.hidden = true;
    assert.equal(pageIsActive(modalContent), false);
    state.hidden = false;
    state.documentElement.dataset.backgroundPaused = 'false';
    assert.equal(pageIsActive(), true);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
