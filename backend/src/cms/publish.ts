/**
 * THE PUBLISHED SNAPSHOT, COPIED TO THE WEBSITE'S OWN BUCKET.
 *
 * The website reads one JSON snapshot of everything published (`/api/site-content`,
 * endpoints.ts). On the serverless CMS that route runs on a Lambda in front of a
 * database that pauses when idle, so a visitor's first request could wait
 * longer than the website's 1.2-second deadline and fall back to its bundled
 * content. So every publication is also written, as a plain file, into the
 * website's own S3 bucket at the same path: visitors read it from the site's
 * CloudFront, same-origin, with nothing to wake, and the CMS could be asleep or
 * even gone. The file carries the same ETag and a one-minute cache life, so
 * the site's conditional polling (runtime.ts) sees a change within a minute.
 *
 * Nothing happens unless SITE_SNAPSHOT_BUCKET is set (the local CMS has none).
 * Writes coalesce: a burst of saves makes one write of the latest snapshot,
 * and a save during a write queues exactly one more.
 */
import type { Payload } from 'payload'
import { getSnapshot } from './snapshot'

const BUCKET = process.env.SITE_SNAPSHOT_BUCKET || ''
const KEY = (process.env.SITE_SNAPSHOT_KEY || 'api/site-content').replace(/^\/+/, '')
const REGION = process.env.SITE_SNAPSHOT_REGION || process.env.AWS_REGION || 'ap-south-1'

let writing: Promise<void> | null = null
let again = false

export const siteSnapshotEnabled = () => Boolean(BUCKET)

async function write(payload: Payload) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const snapshot = await getSnapshot(payload)
  const body = JSON.stringify(snapshot)
  await new S3Client({ region: REGION }).send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: body,
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'public, max-age=60, must-revalidate',
    Metadata: { version: snapshot.version },
  }))
  payload.logger.info(`Published site snapshot ${snapshot.version} (${body.length} bytes) to s3://${BUCKET}/${KEY}`)
}

/** Writes the current published snapshot to the website's bucket; returns once this write (and any queued repeat) is done. */
export function publishSiteSnapshot(payload: Payload): Promise<void> {
  if (!BUCKET) return Promise.resolve()
  if (writing) { again = true; return writing }
  writing = (async () => {
    do {
      again = false
      try { await write(payload) }
      catch (error) { payload.logger.error({ err: error }, 'Could not publish the site snapshot') }
    } while (again)
  })().finally(() => { writing = null })
  return writing
}

/** For hooks: publish after the change, without holding the save up or failing it. */
export function publishSiteSnapshotSoon(payload: Payload) {
  if (!BUCKET) return
  void publishSiteSnapshot(payload)
}
