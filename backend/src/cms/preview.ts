/** Live preview opens the page where the record being edited actually appears. */
const SITE = process.env.PAYLOAD_PUBLIC_SITE_URL || 'http://localhost:3000'
const PAGE_PATHS: Record<string, string> = {
  home: '/', 'core-values': '/core-values', projects: '/projects', 'who-we-are': '/who-we-are',
  'guiding-force': '/our-guiding-force', contribute: '/contribute', everywhere: '/', other: '/',
}
type Data = Record<string, any> | undefined

export function previewPath(slug: string | undefined, data: Data): string {
  const key = typeof data?.key === 'string' ? data.key : ''
  switch (slug) {
    case 'activities': return data?.pillarId === 'projects' ? '/projects' : `/core-values${key ? `#${key}` : ''}`
    case 'pillars': return key === 'projects' ? '/projects' : `/core-values${key ? `#${key}` : ''}`
    case 'awards': return '/#awards'
    case 'partners': return '/who-we-are#partners'
    case 'content-slots': case 'asset-slots': return PAGE_PATHS[data?.page as string] ?? '/'
    case 'gallery-items': {
      const group = String(data?.group ?? '')
      if (group === 'media:who-we-are') return '/who-we-are'
      if (group === 'media:guiding-force') return '/our-guiding-force'
      return group.startsWith('media:') ? '/projects' : '/'
    }
    case 'pages': return typeof data?.slug === 'string' && data.slug ? `/${data.slug.replace(/^\/+/, '')}` : '/'
    default: return '/'
  }
}

/** `?cms-preview=true` must come before any #anchor. */
export function previewURL(slug: string | undefined, data: Data): string {
  const [path, hash] = previewPath(slug, data).split('#')
  return `${SITE}${path}?cms-preview=true${hash ? `#${hash}` : ''}`
}
