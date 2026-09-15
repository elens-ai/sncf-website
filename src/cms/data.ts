import type { Activity, DataPoint } from '../data/activities';
import type { Award } from '../data/awards';
import type { SNCFEvent } from '../data/events';
import type { Partner } from '../data/partners';
import type { PillarState } from '../types';
import { getCMSSnapshot, isRecord, registerCMSAdapter, safeCMSURL, type CMSPublication } from './runtime';

const rooms = ['heal', 'enrich', 'empower', 'projects'];
const text = (value: unknown): value is string => typeof value === 'string';
const recordID = (value: unknown) => text(value) && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,160}$/.test(value);
const color = (value: unknown) => text(value) && /^#[\da-f]{6}$/i.test(value);
const fields = (record: Record<string, unknown>, keys: string[]) => keys.every(key => text(record[key]));
const optionalFields = (record: Record<string, unknown>, keys: string[]) => keys.every(key => record[key] === undefined || record[key] === null || text(record[key]));
const point = (item: unknown): item is DataPoint => isRecord(item) && text(item.label) && text(item.value);
const image = (item: unknown) => isRecord(item) && safeCMSURL(item.src) && text(item.alt);

/** Keep selected records alive in open dialogs while replacing array references for memo dependencies. */
function reconcile(previous: unknown, next: unknown): any {
  if (Array.isArray(next)) {
    const old = Array.isArray(previous) ? previous : [];
    const byId = new Map(old.filter(isRecord).filter(item => text(item.id)).map(item => [item.id, item]));
    return next.map((item, index) => reconcile(isRecord(item) && text(item.id) ? byId.get(item.id) : old[index], item));
  }
  if (isRecord(next)) {
    const result = isRecord(previous) ? previous : {};
    for (const key of Object.keys(result)) if (!(key in next)) delete result[key];
    for (const [key, value] of Object.entries(next)) result[key] = reconcile(result[key], value);
    return result;
  }
  return next;
}

export function bindCMSData<T>(defaults: T, resolve: (publication: CMSPublication, fallback: T) => T, update: (value: T) => void): T {
  const bundled = structuredClone(defaults);
  let current = resolve(getCMSSnapshot(), structuredClone(bundled));
  registerCMSAdapter(publication => {
    current = reconcile(current, resolve(publication, structuredClone(bundled)));
    update(current);
  });
  return current;
}

function collection<T extends { id: string }>(input: unknown, defaults: T[], valid: (item: unknown) => item is T): T[] {
  if (!Array.isArray(input)) return defaults;
  const used = new Set<string>();
  const fallback = new Map(defaults.map(item => [item.id, item]));
  const values: T[] = [];
  for (const item of input) {
    if (!isRecord(item) || !recordID(item.id) || used.has(item.id as string)) continue;
    const value = { ...fallback.get(item.id as string), ...item };
    if (!valid(value)) continue;
    used.add(value.id);
    values.push(value);
  }
  // A malformed response must not erase a working site; an explicitly empty collection may.
  return input.length > 0 && values.length === 0 ? defaults : values;
}

export function statisticKey(label: string) {
  return label.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function statistic(publication: CMSPublication, key: string, fallback: DataPoint): DataPoint {
  const value = publication.stats?.[key];
  if (!isRecord(value) || (!text(value.value) && !(typeof value.value === 'number' && Number.isFinite(value.value)))) return fallback;
  return { label: text(value.label) ? value.label : fallback.label, value: String(value.value) };
}
function validPillar(item: unknown): item is PillarState {
  return isRecord(item) && recordID(item.id) && fields(item, ['label', 'headline', 'body', 'cardImageAlt', 'shortTagline', 'subText']) &&
    color(item.accentA) && color(item.accentB) && Array.isArray(item.stats) && item.stats.every(point) &&
    Array.isArray(item.keyHighlights) && item.keyHighlights.every(text);
}
export function resolvePillars(publication: CMSPublication, defaults: PillarState[]) {
  const incoming = collection(publication.pillars, defaults, validPillar);
  // The physical tour has four rooms: editors can change them, never break their ordering/count.
  return defaults.map(defaultPillar => {
    const pillar = incoming.find(item => item.id === defaultPillar.id) ?? defaultPillar;
    return { ...pillar, stats: pillar.stats.map(value => statistic(publication, `pillar:${pillar.id}:stat:${statisticKey(value.label)}`, value)) };
  });
}

function validActivity(item: unknown): item is Activity {
  return isRecord(item) && recordID(item.id) && rooms.includes(item.pillarId as string) &&
    fields(item, ['title', 'period', 'blurb']) && point(item.headline) && Array.isArray(item.dataPoints) &&
    item.dataPoints.every(point) && Array.isArray(item.images) && item.images.every(image);
}
export function resolveActivities(publication: CMSPublication, defaults: Activity[]) {
  const incoming = collection(publication.activities, defaults, validActivity);
  for (const room of rooms) if (!incoming.some(item => item.pillarId === room)) {
    const fallback = defaults.find(item => item.pillarId === room);
    if (fallback) incoming.push(fallback);
  }
  return incoming.map(activity => {
    const key = `activity:${activity.id}:metric:${statisticKey(activity.headline.label)}`;
    const headline = statistic(publication, `activity:${activity.id}:headline`, statistic(publication, key, activity.headline));
    const headlineStat = publication.stats?.[`activity:${activity.id}:headline`] ?? publication.stats?.[key];
    const period = headlineStat?.period ?? headlineStat?.asOf;
    return { ...activity, headline, period: text(period) ? period : activity.period,
      dataPoints: activity.dataPoints.map(value => statistic(publication, `activity:${activity.id}:metric:${statisticKey(value.label)}`, value)) };
  });
}

export function resolveEvents(publication: CMSPublication, defaults: SNCFEvent[]) {
  return collection(publication.events, defaults, (item): item is SNCFEvent => {
    if (!isRecord(item) || !recordID(item.id) || !fields(item, ['title', 'tag', 'blurb']) || !rooms.includes(item.pillarId as string)) return false;
    if (!optionalFields(item, ['location', 'time'])) return false;
    if (item.href !== undefined && !safeCMSURL(item.href, true)) return false;
    if (item.kind === 'ongoing') return true;
    if (item.kind !== 'annual' || !Number.isInteger(item.month) || !Number.isInteger(item.day)) return false;
    const month = item.month as number, day = item.day as number;
    return month >= 1 && month <= 12 && day >= 1 && day <= new Date(2024, month, 0).getDate();
  });
}

export function resolvePartners(publication: CMSPublication, defaults: Partner[]) {
  return collection(publication.partners, defaults, (item): item is Partner =>
    isRecord(item) && recordID(item.id) && fields(item, ['name', 'contribution']) && optionalFields(item, ['note']));
}
export function resolveAwards(publication: CMSPublication, defaults: Award[]) {
  return collection(publication.awards, defaults, (item): item is Award => isRecord(item) && recordID(item.id) && fields(item, ['title', 'awardedBy', 'year']) && optionalFields(item, ['note']) &&
    (item.photos === undefined || (Array.isArray(item.photos) && item.photos.every(photo => image(photo) && isRecord(photo) &&
      typeof photo.width === 'number' && Number.isFinite(photo.width) && photo.width > 0 && typeof photo.height === 'number' && Number.isFinite(photo.height) && photo.height > 0 && optionalFields(photo, ['focal', 'caption'])))));
}

export function resolveGalleryGroups<T>(publication: CMSPublication, defaults: Record<string, T[]>, prefix: string, valid: (item: Record<string, unknown>) => boolean): Record<string, T[]> {
  if (!Array.isArray(publication.gallery)) return defaults;
  const result: Record<string, T[]> = Object.fromEntries(Object.keys(defaults).map(key => [key, []]));
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const original of publication.gallery) {
    if (!isRecord(original) || !text(original.group) || !original.group.startsWith(`${prefix}:`)) continue;
    // Gallery editors use one source field; legacy plates call that field `image`.
    const item = prefix === 'plates' ? { ...original, image: original.src ?? original.image ?? null, highlight: original.highlight ?? null, title: original.title ?? original.caption } : original;
    const group = original.group.slice(prefix.length + 1);
    if (!recordID(group)) continue;
    if (!valid(item)) { result[group] = defaults[group] ?? []; continue; }
    const records = groups.get(group) ?? [];
    records.push(item);
    groups.set(group, records);
  }
  for (const [group, values] of groups) result[group] = values as T[];
  return result;
}

export const validMedia = (item: Record<string, unknown>) => recordID(item.id) && ['photo', 'film'].includes(item.kind as string) &&
  (item.src === null || safeCMSURL(item.src)) && (item.poster === undefined || item.poster === null || safeCMSURL(item.poster)) && fields(item, ['alt', 'caption']);
export const validPavilionPhoto = (item: Record<string, unknown>) => recordID(item.id) && safeCMSURL(item.src) && fields(item, ['alt', 'caption', 'source']);
export const validPlate = (item: Record<string, unknown>) => fields(item, ['title', 'alt']) && (item.image === null || safeCMSURL(item.image)) &&
  (item.highlight === null || (Number.isInteger(item.highlight) && (item.highlight as number) >= 0 && (item.highlight as number) < 4));

export function resolvePavilionGallery<T extends { id: string }>(publication: CMSPublication, defaults: T[][]): T[][] {
  const grouped = resolveGalleryGroups(publication, Object.fromEntries(rooms.map((room, index) => [room, defaults[index]])), 'pavilion', validPavilionPhoto);
  // Camera stops and film windows are anchored to five bays in each of four rooms.
  return rooms.map((room, index) => defaults[index].map((fallback, slot) => grouped[room]?.[slot] ?? fallback));
}

export function validNavLink(item: unknown): boolean {
  return isRecord(item) && text(item.label) && safeCMSURL(item.href, true) &&
    (item.external === undefined || typeof item.external === 'boolean');
}
export function validNavGroup(item: unknown): boolean {
  return isRecord(item) && rooms.slice(0, 3).includes(item.pillarId as string) && fields(item, ['title', 'blurb']) &&
    Array.isArray(item.links) && item.links.every(validNavLink);
}
export function validNavigation(item: unknown): boolean {
  return isRecord(item) && text(item.label) && (item.href === undefined || safeCMSURL(item.href, true)) &&
    (item.links === undefined || (Array.isArray(item.links) && item.links.every(validNavLink))) &&
    (item.groups === undefined || (Array.isArray(item.groups) && item.groups.every(validNavGroup)));
}

export function resolveSiteList<T>(publication: CMSPublication, fallback: T[], key: string, validator: (value: unknown) => boolean): T[] {
  const values = publication.site?.[key];
  return Array.isArray(values) && values.every(validator) ? values as T[] : fallback;
}
