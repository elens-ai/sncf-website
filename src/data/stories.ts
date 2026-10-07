import { ACTIVITIES, type Activity } from './activities';
import { PILLARS } from './pillars';

export interface FoundationStory {
  id: string;
  title: string;
  pillar: string;
  ink: string;
  period: string;
  description: string;
  figure: Activity['headline'];
  photos: Activity['images'];
  href: string;
}

/** Use the latest published programme records; photo dates are not inferred. */
export function getFoundationStories(): FoundationStory[] {
  const featured = ['blood-donation', 'schools-colleges', 'tree-plantation', 'project-amrit', 'skill-trades', 'oneness-vann'];
  const available = ACTIVITIES.filter(activity => activity.images.length > 0);
  const rank = (id: string) => featured.includes(id) ? featured.indexOf(id) : featured.length;
  const stories = [...available].sort((a, b) => rank(a.id) - rank(b.id)).map(activity => {
    const pillar = PILLARS.find(item => item.id === activity.pillarId)!;
    return {
      id: activity.id,
      title: activity.menuLabel ?? activity.title,
      pillar: pillar.label,
      ink: pillar.accentA,
      period: activity.period,
      description: activity.blurb,
      figure: activity.headline,
      photos: activity.images.slice(0, 3),
      href: `${activity.pillarId === 'projects' ? '/projects' : '/core-values'}#${activity.id}`,
    };
  });
  return newestUpdatesFirst(stories);
}

const SEEN_KEY = 'sncf.stories.seen.v1';
export const STORIES_SEEN_EVENT = 'sncf-stories-seen';
let memorySeen: string[] = [];

/** Content-based versions make a changed photograph, report or caption a new update. */
export function storyFrameKey(story: FoundationStory, frame: number): string {
  const content = JSON.stringify([story.id, story.title, story.period, story.description, story.figure, story.photos[frame]]);
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  return `${story.id}:${frame}:${(hash >>> 0).toString(36)}`;
}

function readSeen(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : [];
  } catch { return memorySeen; }
}

export function hasUnseenStories(): boolean {
  const seen = new Set(readSeen());
  return getFoundationStories().slice(0, 3).some(story => story.photos.some((_, frame) => !seen.has(storyFrameKey(story, frame))));
}

export function markStoryFrameSeen(story: FoundationStory, frame: number) {
  const key = storyFrameKey(story, frame);
  const seen = readSeen();
  if (seen.includes(key)) return;
  memorySeen = [...seen, key].slice(-500);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(memorySeen)); } catch { /* Remember within this visit when storage is unavailable. */ }
  window.dispatchEvent(new Event(STORIES_SEEN_EVENT));
}


// Reporting records have no publication timestamp. Remember content revisions locally
// so new or edited stories rise above the initial report's featured selection.
const CATALOG_KEY = 'sncf.stories.catalog.v1';
type Catalog = Record<string, { version: string; updated: number }>;
let memoryCatalog: Catalog = {};
function newestUpdatesFirst(stories: FoundationStory[]): FoundationStory[] {
  let previous = memoryCatalog;
  try {
    const stored = JSON.parse(localStorage.getItem(CATALOG_KEY) ?? 'null');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) previous = stored;
  } catch { /* Use the current visit's catalogue. */ }
  const known = Object.keys(previous).length > 0;
  const next: Catalog = {};
  let changed = false;
  for (const story of stories) {
    const version = story.photos.map((_, frame) => storyFrameKey(story, frame)).join('|');
    const old = previous[story.id];
    const same = old?.version === version && typeof old.updated === 'number';
    next[story.id] = { version, updated: same ? old.updated : known ? Date.now() : 0 };
    if (!same) changed = true;
  }
  memoryCatalog = next;
  if (changed) {
    try { localStorage.setItem(CATALOG_KEY, JSON.stringify(next)); } catch { /* Keep the in-memory catalogue. */ }
  }
  return stories.sort((a, b) => next[b.id].updated - next[a.id].updated);
}
