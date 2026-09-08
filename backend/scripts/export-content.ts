/**
 * THE BUILD-TIME EXPORT — Postgres out to src/data/*.ts.
 *
 * Run it beside the database, not in CI:
 *
 *   docker compose --profile export run --rm cms-export
 *
 * WHY IT LOOKS LIKE THIS
 *
 * The site is a static Vite bundle on CloudFront and its pages import content
 * synchronously from src/data/*.ts. So the CMS's job is not to serve those
 * pages — it is to REGENERATE those files. Everything downstream (the Vite
 * build, the S3 sync, the CloudFront invalidation) stays exactly as it is.
 *
 * It uses Payload's LOCAL API: `getPayload({ config })` talks to Postgres
 * directly, with no HTTP server and no admin container running. That is what
 * lets this be a one-shot container next to the database rather than a network
 * client of a live CMS.
 *
 * The generated files are COMMITTED. That is deliberate and it is the safety
 * mechanism: this foundation's figures are its public record, so a changed
 * number has to arrive as a reviewable git diff rather than appear on the site
 * because someone saved a form. It also means CI needs no database credential,
 * and a CMS that is down cannot block a deploy of the site.
 *
 * STATUS: the harness is real and runs. `media` is exported because Media is
 * the only content collection that exists so far. The remaining writers land
 * as the collections do — one per file in src/data, each mirroring the
 * TypeScript shape the frontend already imports.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

/* Written into every generated file. The frontend's data files are hand-edited
   today; once a file is generated, a hand edit is silently reverted by the next
   export, and the person who lost their work deserves to have been warned. */
const BANNER = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Written by backend/scripts/export-content.ts from the Payload CMS.
 * Edit the content in the admin and re-run the export; anything typed here is
 * overwritten the next time it runs.
 */
`

/** Where the .ts files land. The compose service mounts the repo's src/data here. */
const OUT_DIR = process.env.EXPORT_OUT_DIR ?? path.resolve(process.cwd(), '../src/data')

/**
 * Serialises a value as a TypeScript literal.
 *
 * JSON.stringify rather than a bespoke printer, because the output has to
 * survive `tsc --noEmit` and hand-rolled quoting is where that breaks. The one
 * thing JSON cannot express that this content model needs is `undefined`, and
 * the frontend's shapes use `null` for "awaiting" (MEDIA plates carry
 * `src: null`), so nothing is lost.
 */
const literal = (value: unknown): string => JSON.stringify(value, null, 2)

const writeFile = async (filename: string, body: string): Promise<void> => {
  const target = path.join(OUT_DIR, filename)
  await fs.writeFile(target, `${BANNER}\n${body}`, 'utf8')
  console.log(`  wrote ${target}`)
}

const main = async (): Promise<void> => {
  const payload = await getPayload({ config })

  try {
    await fs.mkdir(OUT_DIR, { recursive: true })
    console.log(`Exporting into ${OUT_DIR}`)

    /* depth: 0 keeps relationships as ids rather than inlining whole documents,
       which is what the frontend's flat shapes expect.

       limit: 0 means NO LIMIT in Payload's Local API. Without it the default
       page size of 10 applies and the export silently truncates — the kind of
       failure that looks like missing content rather than a broken script. */
    const media = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 0,
      /* Sorted so the generated file is stable. An unsorted export reorders
         rows between runs and every export becomes a noisy diff, which defeats
         the point of reviewing the diff. */
      sort: 'id',
    })

    const plates = media.docs.map((doc) => ({
      id: doc.id,
      src: doc.url ?? null,
      alt: doc.alt,
      caption: doc.caption ?? null,
      credit: doc.credit ?? null,
      width: doc.width ?? null,
      height: doc.height ?? null,
    }))

    await writeFile(
      'mediaLibrary.ts',
      `export interface MediaPlate {\n` +
        `  id: number | string\n` +
        `  src: string | null\n` +
        `  alt: string\n` +
        `  caption: string | null\n` +
        `  credit: string | null\n` +
        `  width: number | null\n` +
        `  height: number | null\n` +
        `}\n\n` +
        `export const MEDIA_LIBRARY: MediaPlate[] = ${literal(plates)}\n`,
    )

    console.log(`Done — ${plates.length} media record(s).`)
  } finally {
    /* Closes the Postgres pool. Without it the container hangs on an open
       connection instead of exiting, and `compose run` never returns. */
    await payload.destroy()
  }
}

await main()
