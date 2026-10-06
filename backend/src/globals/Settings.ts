import type { Field, GlobalConfig } from 'payload'
import { isEditor, isLoggedIn } from '../access/roles'
import { invalidateContent } from '../cms/cache'
import { area, imagePicker, sourceField, text } from '../cms/fields'

function settingsGlobal(slug: string, label: string, description: string, fields: Field[]): GlobalConfig {
  return {
    slug, label, admin: { group: 'Site setup', description },
    access: { read: isLoggedIn, update: isEditor }, versions: { drafts: true, max: 20 },
    hooks: { afterChange: [({ doc }) => { invalidateContent(); return doc }] }, fields,
  }
}

const link = (labelText = 'Text'): Field[] => [{ type: 'row', fields: [
  text('label', true, { label: labelText }),
  sourceField('href', { label: 'Goes to', description: 'A page on this site such as /projects or /who-we-are#partners, or an https:// address.' }),
] }]

export const SOCIAL_PLATFORMS = [
  { label: 'Instagram', value: 'instagram' }, { label: 'YouTube', value: 'youtube' }, { label: 'Spotify', value: 'spotify' },
  { label: 'Facebook', value: 'facebook' }, { label: 'X (Twitter)', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }, { label: 'WhatsApp', value: 'whatsapp' },
]

export const SiteSettings = settingsGlobal('site-settings', 'Site settings', 'Name, logo, contact details, menu, footer, social links and search-engine text.', [{ type: 'tabs', tabs: [
  { label: 'Identity & contact', fields: [
    { name: 'branding', label: 'Identity', type: 'group', fields: [
      text('name', false, { label: 'Organisation name' }), text('tagline', false, { label: 'Tagline' }),
      ...imagePicker('logoMedia', 'logo', { label: 'Logo', description: 'Shown in the header and footer.' }),
    ] },
    { name: 'contact', label: 'Contact details', type: 'group', fields: [
      { type: 'row', fields: [text('email', false, { label: 'Email' }), text('telephone', false, { label: 'Telephone' })] },
      area('address', false, { label: 'Address' }),
    ] },
  ] },
  { label: 'Menu', description: 'The main menu, left to right.', fields: [
    { name: 'navigation', label: 'Menu items', type: 'array', labels: { singular: 'Menu item', plural: 'Menu items' }, fields: [
      ...link('Label'),
      { type: 'row', fields: [
        { name: 'menu', label: 'Drop-down', type: 'select', defaultValue: 'none', options: [
          { label: 'None', value: 'none' }, { label: 'Links listed below', value: 'links' }, { label: 'Programmes by pillar (automatic)', value: 'programmes' },
        ], admin: { description: '“Programmes by pillar” lists every programme, grouped under Heal, Enrich and Empower.' } },
        { name: 'external', label: 'Opens another website', type: 'checkbox' },
      ] },
      { name: 'links', label: 'Drop-down links', type: 'array', labels: { singular: 'Link', plural: 'Links' }, admin: { condition: (_data, sibling) => sibling?.menu === 'links' },
        fields: [...link(), { name: 'external', label: 'Opens another website', type: 'checkbox' }] },
    ] },
  ] },
  { label: 'Footer', fields: [
    { name: 'footerColumns', label: 'Footer columns', type: 'array', maxRows: 4, labels: { singular: 'Column', plural: 'Columns' }, fields: [
      text('title', true, { label: 'Column heading' }),
      { name: 'links', label: 'Links', type: 'array', labels: { singular: 'Link', plural: 'Links' }, fields: link() },
    ] },
  ] },
  { label: 'Social links', fields: [
    { name: 'social', label: 'Social links', type: 'array', labels: { singular: 'Platform', plural: 'Platforms' },
      admin: { description: 'Icons down the left edge of the site and in the footer, in this order (LinkedIn appears in the footer only). Leave a link empty to hide that icon.' },
      fields: [{ type: 'row', fields: [
        { name: 'platform', label: 'Platform', type: 'select', required: true, options: SOCIAL_PLATFORMS },
        sourceField('url', { label: 'Profile link', description: 'The full https:// address of the profile or channel.' }),
      ] }] },
  ] },
  { label: 'Search & sharing', description: 'Used by search engines and link previews when a page has no text of its own.', fields: [
    { name: 'seo', label: 'Defaults', type: 'group', fields: [
      text('title', false, { label: 'Title' }), area('description', false, { label: 'Description' }),
      ...imagePicker('imageMedia', 'image', { label: 'Sharing image', description: 'Shown when the site is shared on social media.' }),
    ] },
  ] },
] }])

const MODELS = [['heal', 'Heal'], ['enrich', 'Enrich'], ['empower', 'Empower'], ['projects', 'Projects'], ['amrit', 'Project Amrit'], ['oneness', 'Oneness Vann']] as const
export const PavilionSettings = settingsGlobal('pavilion-settings', '3D models', 'The 3D models shown in the pillar cards and on the Projects page. Upload a .glb file to the Media library and choose it here.', [
  { name: 'settings', label: 'Models', type: 'group', fields: [
    { name: 'models', label: false, type: 'group', fields: MODELS.map(([id, label]): Field => ({ type: 'collapsible', label, fields: [{ type: 'row', fields: [
      { name: `${id}Media`, label: 'Model file', type: 'upload', relationTo: 'media', admin: { description: 'A .glb upload. This wins over a path.' } },
      sourceField(id, { label: 'Or a file path / link', description: 'For example /models/heal.glb.' }),
    ] }] })) },
  ] },
])
