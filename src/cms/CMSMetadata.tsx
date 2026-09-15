import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCMSRevision } from './CMSContentProvider';
import { getCMSSnapshot, isRecord } from './runtime';
import { getSiteSettings } from './siteSettings';

export function CMSMetadata() {
  const { pathname } = useLocation();
  const revision = useCMSRevision();
  useEffect(() => {
    const site = getSiteSettings();
    const slug = pathname.replace(/^\/(?:pages\/)?|\/$/g, '');
    const page = getCMSSnapshot().pages?.find(value => isRecord(value) && value.slug === slug);
    const title = isRecord(page) && typeof page.title === 'string' && page.title ? page.title : site.seo.title;
    const description = isRecord(page) && typeof page.description === 'string' ? page.description : site.seo.description;
    document.title = title;
    const meta = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
      element.content = content;
    };
    meta('description', description);
    meta('og:title', title, true);
    meta('og:description', description, true);
    meta('og:image', new URL(site.seo.image, window.location.origin).href, true);
  }, [pathname, revision]);
  return null;
}
