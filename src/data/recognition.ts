import { DEFAULT_AWARDS, type Award, type RecognitionCategory } from './awards';

const legacyCategories = new Map(DEFAULT_AWARDS.map(item => [item.id, item.category]));

/** Older CMS publications keep their curated classification until edited. */
export function recognitionCategory(item: Award): RecognitionCategory {
  return item.category ?? legacyCategories.get(item.id) ?? 'awards';
}

export function groupRecognitions(items: Award[]): Record<RecognitionCategory, Award[]> {
  const groups: Record<RecognitionCategory, Award[]> = { tweets: [], awards: [], press: [] };
  for (const item of items) groups[recognitionCategory(item)].push(item);
  return groups;
}
