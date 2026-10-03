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
import { DEFAULT_PAVILION_GALLERY, PAVILION_IDS } from '../src/data/pavilionGallery';
import { DEFAULT_NAV_ITEMS } from '../src/data/navigation';
import { DEFAULT_BRAND } from '../src/data/partnerBrand';
import { statisticKey } from '../src/cms/data';
import { siteDefaults } from '../src/cms/siteDefaults';
import { pavilionDefaults } from '../src/cms/pavilionDefaults';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = async (name: string) => JSON.parse(await readFile(resolve(root, 'src/cms', name), 'utf8'));
const [copy, assets, components] = await Promise.all([
  registry('generatedCopy.json'), registry('generatedAssets.json'), registry('generatedComponents.json'),
]);

/* The report the figures in src/data are transcribed from: change it with them. */
const REPORT = 'SNCF Activity Report, September 2026';
const stats: Record<string, { label: string; value: string; period?: string; source: string }> = {};
for (const activity of DEFAULT_ACTIVITIES) {
  for (const metric of activity.dataPoints) {
    stats[`activity:${activity.id}:metric:${statisticKey(metric.label)}`] = { ...metric, period: activity.period, source: REPORT };
  }
  if (!activity.dataPoints.some(metric => metric.label === activity.headline.label)) {
    stats[`activity:${activity.id}:headline`] = { ...activity.headline, period: activity.period, source: REPORT };
  }
}
for (const pillar of DEFAULT_EXTENDED_PILLARS) {
  for (const metric of pillar.stats) stats[`pillar:${pillar.id}:stat:${statisticKey(metric.label)}`] = {
    ...metric, source: `${REPORT} (pillar summary)`,
  };
}

const gallery = [
  ...DEFAULT_PAVILION_GALLERY.flatMap((photos, index) => photos.map(photo => ({ ...photo, group: `pavilion:${PAVILION_IDS[index]}`, kind: 'photo' }))),
  ...Object.entries(DEFAULT_MEDIA).flatMap(([group, photos]) => photos.map(photo => ({ ...photo, group: `media:${group}` }))),
];

/* Where each component's text and images appear, so editors can filter the
   CMS by page and recognise a slot by its section rather than its code. */
const PAGE = { home: 'home', core: 'core-values', projects: 'projects', who: 'who-we-are', guiding: 'guiding-force', contribute: 'contribute', everywhere: 'everywhere', other: 'other' } as const;
const COMPONENT_AREAS: Record<string, [string, string]> = {
  HeroSection: [PAGE.home, 'Hero'], WelcomeSplashScreen: [PAGE.home, 'Welcome screen'],
  PillarPhotoMosaic: [PAGE.home, 'Hero · Heal emblem photos'], PillarHeroBackdrop: [PAGE.home, 'Hero · Heal background'],
  ImpactMosaic: [PAGE.home, 'Our work'], MosaicOverture: [PAGE.home, 'Our work'], MosaicChapter: [PAGE.home, 'Our work'], MosaicTile: [PAGE.home, 'Our work'],
  PillarModal: [PAGE.home, 'Pillar details pop-up'],
  EventsJournal: [PAGE.home, 'Events'], EventsSection: [PAGE.home, 'Events'], EventsCalendarModal: [PAGE.home, 'Events calendar'], InvitationCard: [PAGE.home, 'Event invitation'],
  AwardsSection: [PAGE.home, 'Awards'], AwardLightbox: [PAGE.home, 'Awards'], PartnersSection: [PAGE.home, 'Partners'],
  CoreValuesPage: [PAGE.core, 'Page'], ValueAnalytics: [PAGE.core, 'Charts'], EnrichScrapbook: [PAGE.core, 'Enrich scrapbook'],
  ProjectsPage: [PAGE.projects, 'Page'], ProjectAnalytics: [PAGE.projects, 'Charts'],
  WhoWeArePage: [PAGE.who, 'Page'], MissionVision: [PAGE.who, 'Mission & vision'], ServiceStory: [PAGE.who, 'Service story'], EditorialContent: [PAGE.who, 'Timeline & partners'],
  GuidingForcePage: [PAGE.guiding, 'Page'],
  ContributionPage: [PAGE.contribute, 'Contribute page'], DonationExperience: [PAGE.contribute, 'Donation form'], DonateModal: [PAGE.contribute, 'Donate pop-up'],
  Header: [PAGE.everywhere, 'Header'], MainNav: [PAGE.everywhere, 'Menu'], SiteFooter: [PAGE.everywhere, 'Footer'], SocialSidebar: [PAGE.everywhere, 'Social links'],
  SearchModal: [PAGE.everywhere, 'Search'], AnthemPlayer: [PAGE.everywhere, 'Anthem player'],
  GalleryModal: [PAGE.everywhere, 'Gallery pop-up'], CardIllustration: [PAGE.everywhere, 'Gallery pop-up'], DevotionalPhotoCard: [PAGE.everywhere, 'Gallery pop-up'], DevotionalLightboxModal: [PAGE.everywhere, 'Gallery pop-up'],
  MediaGallery: [PAGE.other, 'Photo & film galleries'], PillarModelCard: [PAGE.other, '3D model cards'], projects: [PAGE.other, '3D model cards'], CMSPage: [PAGE.other, 'Extra pages'],
};
const excerpt = (value: string) => { const text = value.replace(/\s+/g, ' ').trim(); return text.length > 70 ? `${text.slice(0, 69)}…` : text || '(blank)'; };
/* The welcome intro is one component but three screens, plus the settings that
   time it and centre its photographs: each part gets its own section, named so
   an editor knows what a value means (the label then quotes the value). */
const INTRO_SECTIONS: [RegExp, string][] = [
  [/\.welcome-seconds$/, 'Intro · Welcome page time (seconds)'],
  [/\.mission-seconds$/, 'Intro · Mission page time (seconds)'],
  [/\.welcome-photo-focus$/, 'Intro · Welcome photo focus (across% down%)'],
  [/\.satguru-photo-focus$/, 'Intro · Satguru portrait focus (across% down%)'],
  [/\.(welcome-|next-label)/, 'Intro · Welcome page'],
  [/\.(mission-|vision-|satguru-)/, 'Intro · Mission & vision page'],
];
const area = (key: string) => {
  if (key.startsWith('/images/petals/')) return { page: PAGE.home, section: 'Our work petals' };
  if (key.includes('.WelcomeSplashScreen.')) {
    return { page: PAGE.home, section: INTRO_SECTIONS.find(([pattern]) => pattern.test(key))?.[1] ?? 'Intro · First screen' };
  }
  if (key.startsWith('/')) return { page: PAGE.everywhere, section: 'Shared images' };
  const parts = key.split('.');
  const component = parts[1] === 'Link' ? parts[2] : parts[1];
  const [page, section] = COMPONENT_AREAS[component] ?? [PAGE.other, component.replace(/([a-z])([A-Z])/g, '$1 $2')];
  return { page, section, link: parts[1] === 'Link' };
};
const slots = {
  copy: Object.fromEntries(Object.entries(copy as Record<string, string>).map(([key, value]) => {
    const where = area(key);
    return [key, { page: where.page, section: where.section, label: `${where.section} · ${where.link ? 'Link: ' : ''}${excerpt(value)}` }];
  })),
  assets: Object.fromEntries(Object.entries(assets as Record<string, { source: string }>).map(([key, entry]) => {
    const where = area(key);
    return [key, { page: where.page, section: where.section, label: `${where.section} · ${entry.source.split('/').pop()}` }];
  })),
};

const seed = {
  version: 'bundled-content-v2',
  pillars: DEFAULT_EXTENDED_PILLARS,
  activities: DEFAULT_ACTIVITIES,
  events: DEFAULT_EVENTS,
  // Each partner carries its own wall name, initials, colour and logo.
  partners: DEFAULT_PARTNERS.map(partner => ({ ...partner, ...DEFAULT_BRAND[partner.id] })),
  awards: DEFAULT_AWARDS,
  gallery,
  pages: [
    { id: 'home', slug: '', title: 'Sant Nirankari Charitable Foundation', description: 'Service with humility — Heal, Enrich, Empower.', sections: [] },
    { id: 'core-values', slug: 'core-values', title: 'Core Values', description: 'Heal, Enrich and Empower — the foundation’s core values.', sections: [] },
    { id: 'projects', slug: 'projects', title: 'Projects', description: 'The foundation’s flagship projects.', sections: [] },
    { id: 'who-we-are', slug: 'who-we-are', title: 'Who We Are', description: 'About Sant Nirankari Charitable Foundation.', sections: [] },
    { id: 'our-guiding-force', slug: 'our-guiding-force', title: 'Our Guiding Force', description: 'The guidance behind a life of service.', sections: [] },
  ],
  copy, assets, slots, components, stats,
  // The CMS shows an item's drop-down links only when its drop-down is set to "links".
  site: { ...siteDefaults, navigation: DEFAULT_NAV_ITEMS.map(item => ({ ...item, menu: item.menu ?? (item.links?.length ? 'links' : 'none') })) },
  pavilion: pavilionDefaults,
};
const destination = resolve(root, process.argv[2] ?? 'backend/seed/site-content.json');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, JSON.stringify(seed, null, 2) + '\n');
console.log(`CMS seed: ${Object.keys(copy).length} text slots, ${Object.keys(assets).length} assets, ${gallery.length} gallery entries, ${Object.keys(stats).length} statistics.\n${destination}`);
