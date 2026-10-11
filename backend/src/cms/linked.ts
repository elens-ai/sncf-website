/**
 * WHAT THE SERVERLESS DEPLOYMENT LINKS TO THE CMS (sst.config.ts): the
 * database, the media bucket and the secret. SST hands each linked resource to
 * the running function as an environment variable, SST_RESOURCE_<Name>, holding
 * its properties as JSON; that is read here directly, so the CMS needs nothing
 * from SST's own package to run. Locally and in CI nothing is linked, and each
 * value falls back to the plain environment (backend/.env).
 */
function linked<T = string>(name: string, key: string): T | undefined {
  const raw = process.env[`SST_RESOURCE_${name}`]
  if (!raw) return undefined
  try { return (JSON.parse(raw) as Record<string, T>)[key] } catch { return undefined }
}

/** postgres://… from the linked Aurora cluster, else DATABASE_URI, else the local SQLite file. */
export function databaseURI(): string {
  const host = linked('CmsDatabase', 'host')
  if (host) {
    const port = linked<number>('CmsDatabase', 'port') ?? 5432
    const user = encodeURIComponent(linked('CmsDatabase', 'username') ?? 'postgres')
    const password = encodeURIComponent(linked('CmsDatabase', 'password') ?? '')
    const database = linked('CmsDatabase', 'database') ?? 'sncf_cms'
    return `postgres://${user}:${password}@${host}:${port}/${database}`
  }
  return process.env.DATABASE_URI || 'file:./cms-dev.db'
}

export const payloadSecret = () => linked('PayloadSecret', 'value') || process.env.PAYLOAD_SECRET || ''

/** The media bucket's name, when uploads go to S3 (the serverless CMS); nothing locally, where they go to backend/media. */
export const mediaBucket = () => linked('CmsMedia', 'name') || process.env.CMS_MEDIA_BUCKET || ''
