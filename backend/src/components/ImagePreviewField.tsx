'use client'
import React, { useEffect, useState } from 'react'
import { useConfig, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientProps } from 'payload'

type Preview = { url: string, name: string, kind: 'image' | 'video' | 'file' }
const kindOf = (name: string, mime?: string): Preview['kind'] =>
  mime?.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(name) ? 'image'
    : mime?.startsWith('video/') || /\.(mp4|webm)(\?|$)/i.test(name) ? 'video' : 'file'

/**
 * Shows what the neighbouring "Image" upload or "file path / link" currently
 * points to, so an editor sees the picture rather than a filename or path.
 */
type Props = UIFieldClientProps & { mediaName?: string, sourceName?: string, siteURL?: string }
export const ImagePreviewField = ({ field, path, mediaName = 'media', sourceName = 'src', siteURL = '' }: Props) => {
  const base = path.includes('.') ? path.slice(0, path.lastIndexOf('.') + 1) : ''
  const media = useFormFields(([fields]) => fields[`${base}${mediaName}`]?.value)
  const source = useFormFields(([fields]) => fields[`${base}${sourceName}`]?.value)
  const { config } = useConfig()
  const [preview, setPreview] = useState<Preview | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = media && typeof media === 'object' ? (media as { id?: string | number }).id : media
    if (id) {
      fetch(`${config.serverURL}${config.routes.api}/media/${id}?depth=0`, { credentials: 'include' })
        .then(response => response.ok ? response.json() : null)
        .then(doc => {
          if (cancelled || !doc) return
          const url = doc.sizes?.thumb?.url || doc.sizes?.card?.url || doc.url
          setPreview({ url, name: doc.filename ?? 'Upload', kind: kindOf(doc.filename ?? '', doc.mimeType) })
        })
        .catch(() => { if (!cancelled) setPreview(null) })
    } else if (typeof source === 'string' && source) {
      const url = source.startsWith('/') && !source.startsWith('//') ? `${siteURL}${source}` : source
      setPreview({ url, name: source.split('/').pop() || source, kind: kindOf(source) })
    } else setPreview(null)
    return () => { cancelled = true }
  }, [media, source, siteURL, config.serverURL, config.routes.api])

  return (
    <div className="sncf-preview">
      <span className="sncf-preview__label">{typeof field.label === 'string' ? field.label : 'Preview'}</span>
      {!preview && <p className="sncf-preview__empty">Nothing chosen yet.</p>}
      {preview?.kind === 'image' && <img className="sncf-preview__image" src={preview.url} alt="" />}
      {preview?.kind === 'video' && <video className="sncf-preview__image" src={preview.url} muted controls preload="metadata" />}
      {preview?.kind === 'file' && <p className="sncf-preview__file">{preview.name}</p>}
    </div>
  )
}
