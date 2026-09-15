/** Compile the site's actual bundled content into the CMS's idempotent initial import. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_EXTENDED_PILLARS } from '../src/data/pillars';
import { DEFAULT_ACTIVITIES } from '../src/data/activities';
import { DEFAULT_EVENTS } from '../src/data/events';
import { DEFAULT_PARTNERS } from '../src/data/partners';
import { DEFAULT_AWARDS } from '../src/data/awards';
import { DEFAULT_MEDIA } from '../src/data/media';
import { DEFAULT_PILLAR_PLATES } from '../src/data/pillarMedia';
import { DEFAULT_PAVILION_GALLERY, PAVILION_IDS } from '../src/data/pavilionGallery';
import { DEFAULT_NAV_ITEMS, DEFAULT_CORE_VALUE_GROUPS } from '../src/data/navigation';
import { DEFAULT_BRAND } from '../src/data/partnerBrand';
import { statisticKey } from '../src/cms/data';
import { siteDefaults } from '../src/cms/siteDefaults';
import { pavilionDefaults } from '../src/cms/pavilionDefaults';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = async (name: string) => JSON.parse(await readFile(resolve(root, 'src/cms', name), 'utf8'));
const [copy, assets, components] = await Promise.all([
  registry('generatedCopy.json'), registry('generatedAssets.json'), registry('generatedComponents.json'),
]);

const stats: Record<string, { label: string; value: string; period?: string; source: string }> = {};
for (const activity of DEFAULT_ACTIVITIES) {
  for (const metric of activity.dataPoints) {
    stats[`activity:${activity.id}:metric:${statisticKey(metric.label)}`] = { ...metric, period: activity.period, source: 'SNCF activity report — existing website data' };
  }
  if (!activity.dataPoints.some(metric => metric.label === activity.headline.label)) {
    stats[`activity:${activity.id}:headline`] = { ...activity.headline, period: activity.period, source: 'SNCF activity report — existing website data' };
  }
}
for (const pillar of DEFAULT_EXTENDED_PILLARS) {
  for (const metric of pillar.stats) stats[`pillar:${pillar.id}:stat:${statisticKey(metric.label)}`] = {
    ...metric, source: 'Existing website pillar summary',
  };
}

const gallery = [
  ...DEFAULT_PAVILION_GALLERY.flatMap((photos, index) => photos.map(photo => ({ ...photo, group: `pavilion:${PAVILION_IDS[index]}`, kind: 'photo' }))),
  ...Object.entries(DEFAULT_MEDIA).flatMap(([group, photos]) => photos.map(photo => ({ ...photo, group: `media:${group}` }))),
  ...Object.entries(DEFAULT_PILLAR_PLATES).flatMap(([group, photos]) => photos.map((photo, index) => ({
    ...photo, id: `plate-${group}-${index}`, group: `plates:${group}`, kind: 'photo', src: photo.image, caption: photo.title,
  }))),
];

const seed = {
  version: 'initial-bundled-content-v1',
  pillars: DEFAULT_EXTENDED_PILLARS,
  activities: DEFAULT_ACTIVITIES,
  events: DEFAULT_EVENTS,
  partners: DEFAULT_PARTNERS,
  awards: DEFAULT_AWARDS,
  gallery,
  pages: [
    { id: 'home', slug: '', title: 'Sant Nirankari Charitable Foundation', description: 'Service with humility — Heal, Enrich, Empower.', sections: [] },
    { id: 'core-values', slug: 'core-values', title: 'Core Values', description: 'Heal, Enrich and Empower — the foundation’s core values.', sections: [] },
    { id: 'projects', slug: 'projects', title: 'Projects', description: 'The foundation’s flagship projects.', sections: [] },
    { id: 'who-we-are', slug: 'who-we-are', title: 'Who We Are', description: 'About Sant Nirankari Charitable Foundation.', sections: [] },
    { id: 'our-guiding-force', slug: 'our-guiding-force', title: 'Our Guiding Force', description: 'The guidance behind a life of service.', sections: [] },
  ],
  copy, assets, components, stats,
  site: { ...siteDefaults, navigation: DEFAULT_NAV_ITEMS, coreValueGroups: DEFAULT_CORE_VALUE_GROUPS, partnerBrands: DEFAULT_BRAND },
  pavilion: pavilionDefaults,
};
const destination = resolve(root, process.argv[2] ?? 'backend/seed/site-content.json');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(seed, null, 2) + '\n');
console.log(`CMS seed: ${Object.keys(copy).length} text slots, ${Object.keys(assets).length} assets, ${gallery.length} gallery entries, ${Object.keys(stats).length} statistics.\n${destination}`);
