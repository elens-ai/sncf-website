import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * THE SNCF CMS.
 *
 * Postgres rather than Mongo (the template's default): the content here is
 * relational — an activity belongs to a pillar, a plate belongs to a section,
 * a donation belongs to a campaign — and the figures are a public record that
 * benefits from constraints the database itself enforces.
 *
 * This server is NOT in a visitor's request path. The site is a static Vite
 * bundle on CloudFront; content is pulled from here at BUILD time by
 * scripts/export-content.ts and written into the frontend. That is why the
 * admin can live on a modest self-hosted VM without being a availability risk
 * for the public site.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '— SNCF',
    },
  },

  collections: [Users, Media],

  editor: lexicalEditor(),

  /* Empty is a hard failure rather than a default: an unset secret silently
     produces sessions that anyone who knows the default can forge. */
  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    /* Schema changes are applied by an explicit, reviewable migration rather
       than inferred at boot. `push` is convenient in development and is how
       production schemas drift. */
    push: process.env.NODE_ENV !== 'production',
  }),

  sharp,

  /* Who may call this API from a browser. The site is the only intended
     caller; anything else is either the admin itself or a build script using
     the Local API, which does not go through CORS. */
  cors: [process.env.PAYLOAD_PUBLIC_SITE_URL || 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SITE_URL || 'http://localhost:3000'].filter(Boolean),
})
