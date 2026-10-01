import { getCMSSnapshot, isRecord, resolveCMSAsset, safeCMSURL } from './runtime';
import { SOCIAL_PLATFORMS, siteDefaults, type FooterColumn, type SocialLink } from './siteDefaults';

export function getSiteSettings() {
  const published = getCMSSnapshot().site;
  const output = structuredClone(siteDefaults);
  for (const group of ['branding', 'contact', 'seo'] as const) {
    const values = published?.[group];
    if (!isRecord(values)) continue;
    for (const field of Object.keys(output[group])) {
      const value = values[field];
      if (typeof value === 'string' && value.length <= 5000) (output[group] as Record<string, string>)[field] = value;
    }
  }
  if (!safeCMSURL(output.branding.logo)) output.branding.logo = siteDefaults.branding.logo;
  if (!safeCMSURL(output.seo.image)) output.seo.image = siteDefaults.seo.image;
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(output.contact.email)) output.contact.email = siteDefaults.contact.email;
  /* Lists replace the defaults only when every entry is usable, so one bad row cannot blank the footer. */
  const social = published?.social;
  if (Array.isArray(social) && social.every(item => isRecord(item) && SOCIAL_PLATFORMS.includes(item.platform as SocialLink['platform']) && (item.url === undefined || item.url === null || item.url === '' || safeCMSURL(item.url, true))))
    output.social = (social as SocialLink[]).filter(item => item.url);
  const columns = published?.footerColumns;
  if (Array.isArray(columns) && columns.length && columns.every(column => isRecord(column) && typeof column.title === 'string' && Array.isArray(column.links) &&
      column.links.every(link => isRecord(link) && typeof link.label === 'string' && safeCMSURL(link.href, true))))
    output.footerColumns = columns as FooterColumn[];
  output.branding.logo = resolveCMSAsset(output.branding.logo, output.branding.logo);
  output.seo.image = resolveCMSAsset(output.seo.image, output.seo.image);
  return output;
}

/** Existing per-component slots remain effective until a global override is authored. */
export function siteOverride(group: keyof typeof siteDefaults, field: string, fallback: string) {
  const value = getSiteSettings()[group] as Record<string, string>;
  const baseline = siteDefaults[group] as Record<string, string>;
  return value[field] !== baseline[field] ? value[field] ?? fallback : fallback;
}
