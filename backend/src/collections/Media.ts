import type { CollectionConfig } from 'payload'
import { isEditor, isLoggedIn } from '../access/roles'
import { invalidateContent } from '../cms/cache'

/**
 * THE MEDIA LIBRARY — every photograph and film the site shows.
 *
 * The site currently ships 24 files in public/images referenced by hand-typed
 * paths, which is why a missing file shows as a silent gap rather than an
 * error. Uploads move here so a path cannot be mistyped and an editor can see
 * what exists.
 *
 * ALT TEXT IS REQUIRED and that is deliberate: this is a charity's site, its
 * audience includes people using screen readers, and an optional field would
 * be left empty. `credit` is separate because photographs of Satsang and of
 * volunteers frequently need attribution.
 *
 * The sizes below are the ones the site actually asks for — a card, a plate
 * in the drifting media strip, and the lightbox that strip opens into.
 * Generating more would cost storage for images nothing requests.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { useAsTitle: 'alt', group: 'Library' },
  access: {
    read: () => true, // the site is public; so are its pictures
    create: isLoggedIn,
    update: isEditor,
    delete: isEditor,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 900 },
      { name: 'full', width: 1800 },
    ],
    focalPoint: true,
  },
  hooks: {beforeOperation: [({args, operation, req}) => {
    if (operation === 'create' || operation === 'update') {
      const file = req.file
      if (file && file.size > 150 * 1024 * 1024) throw new Error('Media must be smaller than 150 MB.')
      if (file && !/\.(jpe?g|png|webp|avif|gif|mp4|webm|mp3|m4a|ogg|wav|glb|gltf)$/i.test(file.name)) throw new Error('Upload a supported image, video, audio or glTF model file.')
    }
    return args
  }],afterChange:[({doc})=>{invalidateContent();return doc}],afterDelete:[({doc})=>{invalidateContent();return doc}]},
  fields: [
    {name:'folder',type:'text',index:true,admin:{description:'For example Pavilion / Heal or Projects / Amrit.'}},
    {name:'tags',type:'array',fields:[{name:'tag',type:'text',required:true}]},
    {name:'illustrative',type:'checkbox',defaultValue:false},
    {name:'license',type:'text'},
    {name:'sourceURL',type:'text'},
    {name:'duration',type:'number',min:0},
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'What the picture shows, for readers who cannot see it. Describe the scene, not the file.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Shown under the image where the design allows it.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer or source, where one should be named.' },
    },
  ],
}
