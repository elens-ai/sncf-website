import type { CollectionConfig } from 'payload'
import { isEditor, isLoggedIn } from '../access/roles'

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
    mimeTypes: ['image/*', 'video/*'],
    imageSizes: [
      { name: 'thumb', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 900 },
      { name: 'full', width: 1800 },
    ],
    focalPoint: true,
  },
  fields: [
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
