/** Only browser-safe asset/navigation URLs are accepted; the CMS never fetches arbitrary URLs. */
export const safeURL = (value: unknown): true | string => {
  if (value == null || value === '') return true
  if (typeof value !== 'string') return 'Enter a URL or a root-relative file path.'
  if (/^\/(?!\/)[^\u0000-\u001f]*$/.test(value)) return true
  try { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return true } catch {}
  return 'Use an https:// URL or a path beginning with /.'
}
export const safeColor = (value: unknown): true | string => value == null || value === '' || (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) ? true : 'Use a six-digit hex colour, for example #24785b.'
export const safeKey = (value: unknown): true | string => typeof value === 'string' && /^[a-zA-Z0-9/][a-zA-Z0-9_:.\/-]{0,299}$/.test(value) ? true : 'Use a stable key with letters, numbers, dots, colons, slashes, underscores or hyphens.'
export function validateAnnualDate(data: Record<string, unknown>) {
  if (data.kind !== 'annual') return true
  const m = Number(data.month), d = Number(data.day)
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > new Date(2024,m,0).getDate()) return 'Annual events need a valid month and day.'
  return true
}
