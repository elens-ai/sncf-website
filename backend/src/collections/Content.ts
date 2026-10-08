import { APIError, type CollectionBeforeChangeHook, type CollectionConfig, type Field } from 'payload'
import { contentCollection, text, area, colorField, imagePicker, imageFields, statFields, pillarField, sourceField } from '../cms/fields'
import { validateAnnualDate, validatePastEvent } from '../cms/validation'
import { syncPublishedStats } from '../cms/statSync'

/* Sidebar groups, in the order an editor reaches for them. */
export const GROUP = { content: 'Content', words: 'Website text & images', setup: 'Site setup', stats: 'Statistics', admin: 'Administration' } as const

export const PAGE_OPTIONS = [
  { label: 'Home page', value: 'home' }, { label: 'Core Values', value: 'core-values' }, { label: 'Projects', value: 'projects' },
  { label: 'Who We Are', value: 'who-we-are' }, { label: 'Our Guiding Force', value: 'guiding-force' }, { label: 'Contribute & donate', value: 'contribute' },
  { label: 'Every page (header, footer, menus)', value: 'everywhere' }, { label: 'Other', value: 'other' },
]
const where: Field[] = [{ type: 'row', fields: [
  { name: 'page', label: 'Page', type: 'select', index: true, options: PAGE_OPTIONS, admin: { readOnly: true, description: 'Filter the list by this to find a page’s text.' } },
  { name: 'section', label: 'Section', type: 'text', admin: { readOnly: true } },
] }]

export const Pillars = contentCollection('pillars', {
  singular: 'Pillar', plural: 'Pillars', group: GROUP.content, title: 'label', columns: ['label', 'headline'], search: ['label', 'headline'],
  description: 'Heal, Enrich, Empower and Projects: the words, colours and summary figures used across the site.',
}, [{ type: 'tabs', tabs: [
  { label: 'Words', fields: [
    text('label', true, { label: 'Name' }), text('headline', true, { label: 'Headline' }), area('body', false, { label: 'Introduction' }),
    text('shortTagline', false, { label: 'Short tagline' }), area('subText', false, { label: 'Supporting line' }),
    text('emblemCaption', false, { label: 'Emblem caption', description: 'Script line under the photo emblem, e.g. “Care, in every leaf.”' }),
    text('cardImageAlt', false, { label: 'Emblem description for screen readers' }),
  ] },
  { label: 'Figures & highlights', fields: [
    { name: 'stats', label: 'Summary figures', type: 'array', labels: { singular: 'Figure', plural: 'Figures' }, fields: statFields },
    { name: 'keyHighlights', label: 'Highlights', type: 'array', labels: { singular: 'Highlight', plural: 'Highlights' }, fields: [text('text', true, { label: 'Highlight' })] },
  ] },
  { label: 'Colours', fields: [{ type: 'row', fields: [colorField('accentA', { label: 'Main colour' }), colorField('accentB', { label: 'Light colour' })] }] },
] }])

const ICON_OPTIONS = [
  ['droplets', 'Droplets (blood donation)'], ['droplet', 'Droplet (blood bank)'], ['stethoscope', 'Stethoscope'], ['eye', 'Eye'], ['hospital', 'Hospital'],
  ['graduation-cap', 'Graduation cap'], ['award', 'Award'], ['book-open', 'Open book'], ['laptop', 'Laptop'], ['scissors', 'Scissors'],
  ['trees', 'Trees'], ['sparkles', 'Sparkles'], ['package-check', 'Relief package'], ['heart', 'Heart'], ['hand-coins', 'Hand with coins'],
  ['waves', 'Waves'], ['sprout', 'Sprout'], ['mountain', 'Mountain'], ['house', 'House'], ['heart-handshake', 'Heart & handshake'],
  ['spine', 'Spine (chiropractic)'],
].map(([value, label]) => ({ value, label }))
const percent = (name: string, label: string): Field => ({ name, label, type: 'number', min: 0, max: 100 })

export const Activities = contentCollection('activities', {
  singular: 'Programme', plural: 'Programmes & projects', group: GROUP.content, title: 'title', columns: ['title', 'pillarId', 'period'], search: ['title', 'key'],
  description: 'Every programme and project: its reported figures, and how it looks on the website.',
}, [{ type: 'tabs', tabs: [
  { label: 'Details', fields: [
    pillarField, text('title', true, { label: 'Title' }),
    text('period', true, { label: 'Reporting period', placeholder: 'As on March 2026' }),
    area('blurb', false, { label: 'One-line description' }),
  ] },
  { label: 'Figures', description: 'Changing a figure here also updates Live statistics when you publish.', fields: [
    { name: 'headline', label: 'Headline figure (on the tile)', type: 'group', fields: statFields },
    { name: 'dataPoints', label: 'All figures', type: 'array', labels: { singular: 'Figure', plural: 'Figures' }, fields: statFields },
  ] },
  { label: 'On the website', fields: [
    { type: 'row', fields: [
      { name: 'icon', label: 'Tile symbol', type: 'select', options: ICON_OPTIONS, admin: { description: 'Shown on the home page tile.' } },
      text('menuLabel', false, { label: 'Short name for menus', description: 'Leave empty to use the title.' }),
    ] },
    { name: 'hoverPhotos', label: 'Hover photos (home page)', type: 'array', maxRows: 4, labels: { singular: 'Photo', plural: 'Photos' },
      admin: { description: 'Up to 4 photos that blend in behind the section while a visitor points at this programme’s tile. Order sets the place: 1 top left, 2 bottom, 3 right, 4 left.' },
      fields: [...imagePicker(), text('alt', false, { label: 'Description for screen readers' })] },
    { name: 'hoverFocus', label: 'Keep one spot clear', type: 'group',
      admin: { description: 'Optional: shows one area of a hover photo at full strength, e.g. the people at its centre. Positions are percentages of that photo’s area.' },
      fields: [{ type: 'row', fields: [
        { name: 'photo', label: 'Photo number', type: 'number', min: 1, max: 4 },
        percent('x', 'Across %'), percent('y', 'Down %'), percent('width', 'Width %'), percent('height', 'Height %'),
      ] }] },
    { name: 'cardPhoto', label: 'Core Values card photo', type: 'group', admin: { description: 'Faint photo behind this programme’s card on the Core Values page.' },
      fields: [...imagePicker(), text('alt', false, { label: 'Description for screen readers' })] },
    { name: 'images', label: 'Detail photos', type: 'array', labels: { singular: 'Photo', plural: 'Photos' }, fields: imageFields },
  ] },
] }])

export const Events = contentCollection('events', {
  singular: 'Event', plural: 'Events', group: GROUP.content, title: 'title', columns: ['title', 'kind', 'occurredOn', 'month', 'day'], search: ['title'],
  description: 'Annual observances, ongoing programmes and past events with photographs and reported figures.',
}, [
  text('title', true, { label: 'Title' }),
  { type: 'row', fields: [
    { name: 'kind', label: 'When', type: 'select', required: true, options: [{ label: 'Every year on a date', value: 'annual' }, { label: 'Ongoing', value: 'ongoing' }, { label: 'Past event', value: 'past' }] },
    { name: 'month', label: 'Month (1–12)', type: 'number', min: 1, max: 12, admin: { condition: data => data?.kind === 'annual' } },
    { name: 'day', label: 'Day', type: 'number', min: 1, max: 31, admin: { condition: data => data?.kind === 'annual' } },
  ] },
  { name: 'occurredOn', label: 'Date held', type: 'text', admin: { condition: data => data?.kind === 'past', placeholder: '2026-06-21', description: 'The exact event date in YYYY-MM-DD format. This date does not repeat each year.' } },
  { type: 'row', fields: [pillarField, text('tag', false, { label: 'Tag' })] },
  area('blurb', false, { label: 'Description' }),
  { type: 'row', fields: [text('location', false, { label: 'Venue' }), text('time', false, { label: 'Time' })] },
  sourceField('href', { label: 'Link (optional)', description: 'A page on this site such as /projects, or an https:// link.' }),
  { type: 'collapsible', label: 'Past-event record', admin: { condition: data => data?.kind === 'past' }, fields: [
    { name: 'photos', label: 'Event photographs', type: 'array', labels: { singular: 'Photograph', plural: 'Photographs' }, fields: [...imagePicker(), text('alt', true, { label: 'Photo description', description: 'Describe this photograph from the event.' })] },
    { name: 'facts', label: 'Reported figures', type: 'array', labels: { singular: 'Figure', plural: 'Figures' }, admin: { description: 'Only use figures documented for this event. Leave empty when no figures were reported.' }, fields: statFields },
    sourceField('source', { label: 'Original event report', description: 'Link to the report supporting the event date, photographs and figures.' }),
  ] },
])
Events.hooks!.beforeValidate = [({ data, originalDoc }) => {
  if (data) {
    const record = { ...originalDoc, ...data }
    for (const validate of [validateAnnualDate, validatePastEvent]) {
      const valid = validate(record)
      if (valid !== true) throw new APIError(valid, 400)
    }
  }
  return data
}]

export const Partners = contentCollection('partners', {
  singular: 'Partner', plural: 'Partners', group: GROUP.content, title: 'name', columns: ['name', 'short'], search: ['name', 'short'],
  description: 'Organisations the foundation works with: what they did together, and how their logo appears.',
}, [
  text('name', true, { label: 'Organisation' }), area('contribution', true, { label: 'What we did together' }), area('note', false, { label: 'Note' }),
  { type: 'collapsible', label: 'Logo & branding', fields: [
    ...imagePicker('logoMedia', 'logo', { label: 'Logo' }),
    { type: 'row', fields: [
      text('short', false, { label: 'Short name', description: 'For the partner wall, e.g. “Indian Red Cross”.' }),
      text('initials', false, { label: 'Initials', description: 'Shown when there is no logo.' }),
      colorField('color', { label: 'Brand colour' }),
    ] },
  ] },
  sourceField('href', { label: 'Website (optional)' }),
])

export const Awards = contentCollection('awards', {
  singular: 'Award', plural: 'Awards', group: GROUP.content, title: 'title', columns: ['title', 'awardedBy', 'year'], search: ['title', 'awardedBy'],
  description: 'Verified tweets, awards, certificates and media coverage. Leave the year empty when the source does not give one.',
}, [
  { name: 'category', label: 'Archive section', type: 'select', options: [{ label: 'Tweets', value: 'tweets' }, { label: 'Awards & Certificates', value: 'awards' }, { label: 'Press & Media', value: 'press' }] },
  text('title', true, { label: 'Honour' }), { type: 'row', fields: [text('awardedBy', true, { label: 'Awarded by' }), text('year', false, { label: 'Year' })] },
  area('note', false, { label: 'Note' }), { name: 'featured', label: 'Feature this award', type: 'checkbox' },
  { name: 'photos', label: 'Photos', type: 'array', labels: { singular: 'Photo', plural: 'Photos' }, fields: imageFields },
])

const PILLAR_PHOTO_GROUPS = ['heal', 'enrich', 'empower', 'projects'].map(id => ({ value: `pavilion:${id}`, label: `Pillar photos — ${id[0].toUpperCase()}${id.slice(1)} (tiles, emblem & collage)` }))
export const GALLERY_GROUPS = [
  ...PILLAR_PHOTO_GROUPS,
  { value: 'media:project-amrit', label: 'Gallery — Project Amrit' }, { value: 'media:oneness-vann', label: 'Gallery — Oneness Vann' },
  { value: 'media:watershed', label: 'Gallery — Watershed Programme' }, { value: 'media:adopted-villages', label: 'Gallery — Adopted Villages' },
  { value: 'media:who-we-are', label: 'Gallery — Who We Are' }, { value: 'media:guiding-force', label: 'Gallery — Our Guiding Force' },
]
export const GalleryItems = contentCollection('gallery-items', {
  singular: 'Gallery photo', plural: 'Galleries', group: GROUP.words, title: 'caption', columns: ['media', 'caption', 'group', 'kind'], search: ['caption', 'alt', 'group'],
  description: 'Photos and films for each gallery. Pillar photos are five per pillar, in order: they fill the home page tiles, the photo emblem and the Core Values collage.',
}, [
  { type: 'row', fields: [
    { name: 'group', label: 'Shown in', type: 'select', required: true, index: true, options: GALLERY_GROUPS },
    { name: 'kind', label: 'Type', type: 'select', defaultValue: 'photo', options: [{ label: 'Photo', value: 'photo' }, { label: 'Film', value: 'film' }] },
  ] },
  ...imageFields,
  { type: 'collapsible', label: 'Film, credit & layout', admin: { initCollapsed: true }, fields: [
    ...imagePicker('posterMedia', 'poster', { label: 'Film poster image', description: 'Still shown before a film plays.' }),
    sourceField('source', { label: 'Credit / source link' }),
    { type: 'row', fields: [
      { name: 'wide', label: 'Show wider', type: 'checkbox' },
      { name: 'illustrative', label: 'Illustrative (not an SNCF photo)', type: 'checkbox', defaultValue: false },
    ] },
  ] },
])

export const Pages = contentCollection('pages', {
  singular: 'Page', plural: 'Page titles & SEO', group: GROUP.setup, title: 'title', columns: ['title', 'slug'], search: ['title', 'slug'],
  description: 'The title and description search engines and link previews show for each page. Extra pages at /pages/<address> are built from sections.',
}, [
  { type: 'row', fields: [text('title', true, { label: 'Title' }), text('slug', false, { label: 'Address', description: 'core-values for /core-values; empty for the home page.' })] },
  area('description', false, { label: 'Description', description: 'One or two sentences shown in search results.' }),
  { name: 'sections', label: 'Sections (extra pages only)', type: 'blocks', blocks: [
    { slug: 'text', labels: { singular: 'Text section', plural: 'Text sections' }, fields: [text('key', true, { label: 'Section ID' }), text('heading', false, { label: 'Heading' }), area('body', false, { label: 'Text' }), { name: 'enabled', label: 'Show', type: 'checkbox', defaultValue: true }] },
    { slug: 'media', labels: { singular: 'Photo or film section', plural: 'Photo or film sections' }, fields: [text('key', true, { label: 'Section ID' }), ...imageFields, sourceField('video', { label: 'Film (path or link)' }), text('heading', false, { label: 'Heading' }), area('body', false, { label: 'Text' })] },
    { slug: 'cards', labels: { singular: 'Cards section', plural: 'Cards sections' }, fields: [text('key', true, { label: 'Section ID' }), text('heading', false, { label: 'Heading' }), { name: 'cards', type: 'array', labels: { singular: 'Card', plural: 'Cards' }, fields: [text('title', false, { label: 'Title' }), area('body', false, { label: 'Text' }), sourceField('href', { label: 'Link' }), ...imageFields] }] },
    { slug: 'custom', labels: { singular: 'Existing component', plural: 'Existing components' }, fields: [text('key', true, { label: 'Section ID' }), { name: 'component', label: 'Component', type: 'select', options: [{ label: 'Events journal', value: 'events' }, { label: 'Awards', value: 'awards' }] }, { name: 'enabled', label: 'Show', type: 'checkbox', defaultValue: true }] },
  ] },
])

/* Slot labels name the section and quote the current text, so they stay findable after edits. */
const excerpt = (value: unknown) => { const text = String(value ?? '').replace(/\s+/g, ' ').trim(); return text.length > 70 ? `${text.slice(0, 69)}…` : text || '(blank)' }
const relabelText: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const section = data.section ?? originalDoc?.section
  if (section && data.value !== undefined) data.label = `${section} · ${String(data.key ?? originalDoc?.key ?? '').startsWith('copy.Link.') ? 'Link: ' : ''}${excerpt(data.value)}`
  return data
}
export const ContentSlots = contentCollection('content-slots', {
  singular: 'Website text', plural: 'Website text', group: GROUP.words, title: 'label', columns: ['label', 'page', 'value'], search: ['label', 'value', 'section', 'key'],
  description: 'Every heading, sentence, button and label on the site. Filter by Page, or search for the words you see on the website.',
}, [
  area('value', true, { label: 'Text', description: 'Shown on the website exactly as written. Links: a page such as /projects or an https:// address.' }),
  ...where,
  { name: 'label', label: 'Where it appears', type: 'text', required: true, admin: { readOnly: true } },
])
ContentSlots.hooks!.beforeChange!.push(relabelText)

export const AssetSlots = contentCollection('asset-slots', {
  singular: 'Website image', plural: 'Website images', group: GROUP.words, title: 'label', columns: ['media', 'label', 'page'], search: ['label', 'section', 'key'],
  description: 'Logos, portraits and artwork built into the page design. Programme, partner and gallery photos are edited on their own records.',
}, [
  ...imagePicker('media', 'source', { label: 'Image or file' }),
  { name: 'kind', label: 'Type', type: 'select', options: [{ label: 'Image', value: 'image' }, { label: 'Video', value: 'video' }, { label: 'Audio', value: 'audio' }, { label: 'Other', value: 'other' }] },
  ...where,
  { name: 'label', label: 'Where it appears', type: 'text', required: true, admin: { readOnly: true } },
])

export const ComponentSettings = contentCollection('component-settings', {
  singular: 'Section', plural: 'Sections on/off', group: GROUP.setup, title: 'label', columns: ['label', 'enabled', 'order'], search: ['label', 'key'],
  description: 'Show or hide whole sections. For home page sections, Display order sets their position from the top.',
}, [
  { name: 'label', label: 'Section', type: 'text', admin: { readOnly: true } },
  { name: 'enabled', label: 'Show this section', type: 'checkbox', defaultValue: true },
])

export const contentCollections: CollectionConfig[] = [Pillars, Activities, Events, Partners, Awards, ContentSlots, AssetSlots, GalleryItems, Pages, ComponentSettings]

// Both authoring forms write to the same live figures when a value changes.
Activities.hooks!.afterChange!.push(syncPublishedStats)
Pillars.hooks!.afterChange!.push(syncPublishedStats)
