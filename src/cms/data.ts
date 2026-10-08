import type { Activity, DataPoint } from '../data/activities';
import { ACTIVITY_ICONS, type ActivityIcon } from '../data/activityIcons';
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
    Array.isArray(item.keyHighlights) && item.keyHighlights.every(text) && optionalFields(item, ['emblemCaption']);
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
const percent = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const photoRef = (value: unknown): value is { src: string; alt?: string } => isRecord(value) && safeCMSURL(value.src) && (value.alt === undefined || value.alt === null || text(value.alt));
/** Presentation extras are optional: a malformed one is dropped on its own instead of hiding the programme. */
function presentation(activity: Activity): Activity {
  const result = { ...activity };
  if (!ACTIVITY_ICONS.includes(result.icon as ActivityIcon)) delete result.icon;
  if (!text(result.menuLabel) || !result.menuLabel.trim()) delete result.menuLabel;
  result.hoverPhotos = Array.isArray(result.hoverPhotos) ? result.hoverPhotos.filter(photoRef).slice(0, 4) : [];
  const focus = result.hoverFocus;
  if (!isRecord(focus) || !Number.isInteger(focus.photo) || focus.photo < 1 || focus.photo > result.hoverPhotos.length ||
      !['x', 'y', 'width', 'height'].every(key => percent(focus[key]))) delete result.hoverFocus;
  if (!photoRef(result.cardPhoto)) delete result.cardPhoto;
  return result;
}
export function resolveActivities(publication: CMSPublication, defaults: Activity[]) {
  const incoming = collection(publication.activities, defaults, validActivity).map(presentation);
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
  const values = collection(publication.events, defaults, (item): item is SNCFEvent => {
    if (!isRecord(item) || !recordID(item.id) || !fields(item, ['title', 'tag', 'blurb']) || !rooms.includes(item.pillarId as string)) return false;
    if (!optionalFields(item, ['location', 'time'])) return false;
    if (item.href != null && item.href !== '' && !safeCMSURL(item.href, true)) return false;
    if (item.source != null && item.source !== '' && !safeCMSURL(item.source)) return false;
    if (item.kind === 'past') {
      if (!text(item.occurredOn) || !/^\d{4}-\d{2}-\d{2}$/.test(item.occurredOn)) return false;
      const [year, month, day] = item.occurredOn.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const today = new Date();
      const latest = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || item.occurredOn > latest) return false;
      if (!Array.isArray(item.photos) || !item.photos.length || !item.photos.every(photo => image(photo) && isRecord(photo) && (photo.alt as string).trim())) return false;
      return item.facts == null || (Array.isArray(item.facts) && item.facts.every(fact => point(fact) && fact.label.trim() && fact.value.trim()));
    }
    if (item.kind === 'ongoing') return true;
    if (item.kind !== 'annual' || !Number.isInteger(item.month) || !Number.isInteger(item.day)) return false;
    const month = item.month as number, day = item.day as number;
    return month >= 1 && month <= 12 && day >= 1 && day <= new Date(2024, month, 0).getDate();
  });
  // Publications created before the archive existed contain only annual/ongoing
  // records. Keep their edits and add the new bundled archive until it is seeded.
  // An explicit empty collection, or a publication with any past record, remains
  // authoritative, including removal of individual archive entries.
  if (Array.isArray(publication.events) && publication.events.length > 0 &&
    publication.events.every(item => isRecord(item) && (item.kind === 'annual' || item.kind === 'ongoing')) &&
    !values.some(item => item.kind === 'past')) {
    return [...values, ...defaults.filter(item => item.kind === 'past')];
  }
  return values;
}

export function resolvePartners(publication: CMSPublication, defaults: Partner[]) {
  return collection(publication.partners, defaults, (item): item is Partner =>
    isRecord(item) && recordID(item.id) && fields(item, ['name', 'contribution']) && optionalFields(item, ['note']) &&
    (item.href === undefined || item.href === null || item.href === '' || safeCMSURL(item.href)));
}
export function resolveAwards(publication: CMSPublication, defaults: Award[]) {
  /* An honour the source lists without a year keeps an empty one — never a plausible one — so `year` is optional here and in the CMS. */
  return collection(publication.awards, defaults, (item): item is Award => isRecord(item) && recordID(item.id) && fields(item, ['title', 'awardedBy']) && optionalFields(item, ['year', 'note']) &&
    (item.category === undefined || item.category === null || ['tweets', 'awards', 'press'].includes(String(item.category))) &&
    (item.photos === undefined || (Array.isArray(item.photos) && item.photos.every(photo => image(photo) && isRecord(photo) &&
      typeof photo.width === 'number' && Number.isFinite(photo.width) && photo.width > 0 && typeof photo.height === 'number' && Number.isFinite(photo.height) && photo.height > 0 && optionalFields(photo, ['focal', 'caption'])))))
    .map(award => ({ ...award, year: award.year ?? '' }));
}

export function resolveGalleryGroups<T>(publication: CMSPublication, defaults: Record<string, T[]>, prefix: string, valid: (item: Record<string, unknown>) => boolean): Record<string, T[]> {
  if (!Array.isArray(publication.gallery)) return defaults;
  const result: Record<string, T[]> = Object.fromEntries(Object.keys(defaults).map(key => [key, []]));
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const original of publication.gallery) {
    if (!isRecord(original) || !text(original.group) || !original.group.startsWith(`${prefix}:`)) continue;
    const item = original;
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
    (item.menu === undefined || ['programmes', 'links', 'none'].includes(item.menu as string)) &&
    (item.links === undefined || (Array.isArray(item.links) && item.links.every(validNavLink))) &&
    (item.groups === undefined || (Array.isArray(item.groups) && item.groups.every(validNavGroup)));
}

export function resolveSiteList<T>(publication: CMSPublication, fallback: T[], key: string, validator: (value: unknown) => boolean): T[] {
  const values = publication.site?.[key];
  return Array.isArray(values) && values.every(validator) ? values as T[] : fallback;
}
