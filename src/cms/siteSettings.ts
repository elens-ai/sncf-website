import { getCMSSnapshot, isRecord, resolveCMSAsset, safeCMSURL } from './runtime';
import { siteDefaults } from './siteDefaults';

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
