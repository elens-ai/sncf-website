import { APIError, type CollectionConfig, type Field, type CollectionBeforeChangeHook } from 'payload'
import { isEditor, isLoggedIn, publishedOrSignedIn } from '../access/roles'
import { invalidateContent } from './cache'
import { safeColor, safeKey, safeURL } from './validation'

export const keyField: Field = {
  name: 'key', label: 'Website ID', type: 'text', required: true, unique: true, index: true, validate: safeKey,
  access: { update: ({ req }) => (req.user as { role?: string } | null)?.role === 'admin' },
  admin: { position: 'sidebar', description: 'How the website finds this item. Set once; only an administrator can change it.' },
}
export const orderField: Field = { name: 'order', label: 'Display order', type: 'number', defaultValue: 0, index: true, admin: { position: 'sidebar', description: 'Lower numbers come first.' } }

type Options = { label?: string, description?: string, placeholder?: string }
export const text = (name: string, required = false, options: Options = {}): Field => ({ name, type: 'text', required, label: options.label, admin: { description: options.description, placeholder: options.placeholder } })
export const area = (name: string, required = false, options: Options = {}): Field => ({ name, type: 'textarea', required, label: options.label, admin: { description: options.description } })
export const colorField = (name: string, options: Options = {}): Field => ({
  name, type: 'text', validate: safeColor, label: options.label,
  admin: { description: options.description ?? 'Hex colour such as #24785b. Pick it with the swatch.', components: { Field: './components/ColorField#ColorField' } },
})
export const sourceField = (name = 'src', options: Options = {}): Field => ({
  name, type: 'text', validate: safeURL, label: options.label ?? 'Or a file path / link',
  admin: { description: options.description ?? 'Only if you are not choosing an upload: a site path such as /images/photo.jpg, or an https:// link.' },
})
const SITE_URL = process.env.PAYLOAD_PUBLIC_SITE_URL || 'http://localhost:3000'
export const mediaField = (name = 'media', options: Options & { sourceName?: string } = {}): Field => ({
  name, type: 'upload', relationTo: 'media', label: options.label ?? 'Image',
  admin: {
    description: options.description ?? 'Choose from the Media library, or upload a new file. This wins over a path.',
    components: { Cell: './components/MediaThumbCell#MediaThumbCell' }, custom: { sourceName: options.sourceName ?? 'src' },
  },
})
/** Live thumbnail of whatever the sibling upload / path fields currently point to. */
export const previewField = (mediaName = 'media', sourceName = 'src'): Field => ({
  name: `${mediaName}Preview`, type: 'ui', label: 'Preview',
  admin: { components: { Field: { path: './components/ImagePreviewField#ImagePreviewField', clientProps: { mediaName, sourceName, siteURL: SITE_URL } } } },
})
/** Upload-or-path pair with a preview: the standard way to set an image anywhere in the studio. */
export const imagePicker = (mediaName = 'media', sourceName = 'src', options: { label?: string, description?: string } = {}): Field[] => [
  previewField(mediaName, sourceName),
  { type: 'row', fields: [mediaField(mediaName, { label: options.label, description: options.description, sourceName }), sourceField(sourceName)] },
]
export const statFields: Field[] = [{ type: 'row', fields: [text('label', true, { label: 'Label' }), text('value', true, { label: 'Figure', description: 'Exactly as reported, e.g. 1,500,230.' })] }]
export const imageFields: Field[] = [
  ...imagePicker(),
  text('alt', false, { label: 'Description for screen readers', description: 'What the picture shows, for visitors who cannot see it.' }),
  text('caption', false, { label: 'Caption' }),
  { type: 'row', fields: [
    { name: 'width', type: 'number', min: 1, label: 'Width (px)', admin: { description: 'Filled in automatically for uploads.' } },
    { name: 'height', type: 'number', min: 1, label: 'Height (px)', admin: { description: 'Filled in automatically for uploads.' } },
    text('focal', false, { label: 'Focus point', description: 'Keeps this spot in view when cropped, e.g. 50% 30%.' }),
  ] },
]
export const PILLAR_OPTIONS = [
  { label: 'Heal', value: 'heal' }, { label: 'Enrich', value: 'enrich' }, { label: 'Empower', value: 'empower' }, { label: 'Projects', value: 'projects' },
]
export const pillarField: Field = { name: 'pillarId', label: 'Pillar', type: 'select', required: true, index: true, options: PILLAR_OPTIONS }

export const enforcePublishing: CollectionBeforeChangeHook = ({ data, req, originalDoc }) => {
  if (req.user && !['admin', 'editor'].includes((req.user as { role?: string }).role || '')) {
    if (data._status === 'published' || (originalDoc?._status === 'published' && data._status !== 'draft')) throw new APIError('Only an editor or administrator can publish content. Save a draft for review.', 403)
    data._status = 'draft'
  }
  return data
}

type CollectionOptions = {
  singular: string, plural?: string, group: string, description?: string,
  title: string, columns: string[], search?: string[], hidden?: boolean,
}
export function contentCollection(slug: string, options: CollectionOptions, fields: Field[]): CollectionConfig {
  return {
    slug, labels: { singular: options.singular, plural: options.plural ?? options.singular },
    admin: {
      useAsTitle: options.title, group: options.group, description: options.description,
      defaultColumns: [...options.columns, '_status', 'updatedAt'], listSearchableFields: options.search ?? [options.title],
      pagination: { defaultLimit: 50, limits: [25, 50, 100, 250] },
    },
    access: { read: publishedOrSignedIn, create: isLoggedIn, update: isLoggedIn, delete: isEditor },
    // Autosave keeps work safe without a version for every keystroke.
    versions: { drafts: { autosave: { interval: 4000 } }, maxPerDoc: 30 },
    hooks: { beforeChange: [enforcePublishing], afterChange: [({ doc }) => { invalidateContent(); return doc }], afterDelete: [({ doc }) => { invalidateContent(); return doc }] },
    fields: [keyField, orderField, ...fields],
  }
}
