import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFoundationStories, hasUnseenStories, markStoryFrameSeen, storyFrameKey } from './stories';
import { ACTIVITIES } from './activities';

test('viewing the latest three clears the ring; changed content returns it and rises first', () => {
  const store = new Map<string, string>();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: () => true } });
  const activity = ACTIVITIES.find(item => item.images.length && item.id === 'cleanliness')!;
  const original = activity.blurb;
  try {
    const stories = getFoundationStories();
    assert.ok(stories.length > 3);
    assert.equal(hasUnseenStories(), true);
    stories.slice(0, 3).forEach(story => story.photos.forEach((_, frame) => markStoryFrameSeen(story, frame)));
    assert.equal(hasUnseenStories(), false);
    activity.blurb = `${original} Updated report.`;
    assert.equal(getFoundationStories()[0].id, activity.id);
    assert.equal(hasUnseenStories(), true);
    const updated = getFoundationStories()[0];
    assert.notEqual(storyFrameKey(updated, 0), storyFrameKey({ ...updated, description: original }, 0));
    updated.photos.forEach((_, frame) => markStoryFrameSeen(updated, frame));
    assert.equal(hasUnseenStories(), false);
  } finally {
    activity.blurb = original;
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
