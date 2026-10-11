/**
 * THE FIRST START ON AN EMPTY DATABASE seeds it with the site's bundled content
 * (seed/site-content.json, the same file `npm run seed` uses), then publishes
 * the first snapshot to the website. Only the serverless CMS does this
 * (CMS_SEED_ON_INIT, sst.config.ts): its database can be reached from the
 * function alone, so nobody can run the seed from outside. The seed only ever
 * creates what is missing, so a database with content is left exactly as it
 * is after one quick count; and a database lock keeps two functions starting
 * at once from seeding side by side.
 */
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { seedContent } from './seed'
import { publishSiteSnapshot } from './publish'
import seed from '../../seed/site-content.json'

const LOCK = 7_210_911

export async function seedOnInit(payload: Payload) {
  const pillars = await payload.count({ collection: 'pillars', overrideAccess: true })
  if (pillars.totalDocs > 0) return
  const db = payload.db as unknown as { drizzle?: { execute: (query: unknown) => Promise<{ rows: Array<Record<string, unknown>> }> } }
  if (!db.drizzle) { payload.logger.warn('No PostgreSQL connection: the first-start seed was skipped'); return }
  const lock = await db.drizzle.execute(sql`select pg_try_advisory_lock(${LOCK}) as locked`)
  if (!lock.rows[0]?.locked) { payload.logger.info('Another start is seeding the database'); return }
  try {
    payload.logger.info('Empty database: seeding it with the site\'s bundled content')
    const result = await seedContent(payload, seed, { log: message => payload.logger.info(message) })
    payload.logger.info(result.summary)
    await publishSiteSnapshot(payload)
  } finally {
    await db.drizzle.execute(sql`select pg_advisory_unlock(${LOCK})`)
  }
}
