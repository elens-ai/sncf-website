import React from 'react'
import type { DefaultServerCellComponentProps } from 'payload'

const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i

/** List-view thumbnail for an upload column, falling back to the row's file path. */
export async function MediaThumbCell({ cellData, rowData, payload, field }: DefaultServerCellComponentProps) {
  const siteURL = process.env.PAYLOAD_PUBLIC_SITE_URL || 'http://localhost:3000'
  const sourceName = ((field as { admin?: { custom?: { sourceName?: string } } }).admin?.custom?.sourceName) ?? 'src'
  let url: string | undefined
  let name: string | undefined
  const id = cellData && typeof cellData === 'object' ? (cellData as { id?: string | number }).id : cellData
  if (id) {
    try {
      const doc = await payload.findByID({ collection: 'media', id: id as string, depth: 0, overrideAccess: true })
      name = doc.filename ?? undefined
      if (doc.mimeType?.startsWith('image/')) url = doc.sizes?.thumb?.url || doc.url || undefined
    } catch { /* deleted upload: fall through to the path */ }
  }
  const source = typeof rowData?.[sourceName] === 'string' ? rowData[sourceName] as string : undefined
  if (!url && source) {
    name ??= source.split('/').pop()
    if (IMAGE.test(source)) url = source.startsWith('/') && !source.startsWith('//') ? `${siteURL}${source}` : source
  }
  if (url) return <img className="sncf-thumb" src={url} alt="" loading="lazy" />
  return <span className="sncf-thumb sncf-thumb--file">{name ?? '—'}</span>
}
