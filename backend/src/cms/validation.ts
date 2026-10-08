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

/** Archive dates are exact civil dates, never next year's recurring observance. */
export function validatePastEvent(data: Record<string, unknown>, today = new Date()): true | string {
  if (data.kind !== 'past') return true
  const date = data.occurredOn
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Past events need an exact date in YYYY-MM-DD format.'
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (year < 1000 || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return 'Enter a real calendar date for the past event.'
  const latest = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (date > latest) return 'Past events cannot have a future date.'
  if (!Array.isArray(data.photos) || !data.photos.length) return 'Add at least one photograph of the past event.'
  for (const photo of data.photos) {
    if (!photo || typeof photo !== 'object' || typeof photo.alt !== 'string' || !photo.alt.trim()) return 'Every past-event photograph needs a description.'
    if (photo.src != null && photo.src !== '' && safeURL(photo.src) !== true) return 'Past-event photographs need safe image URLs.'
    if (!photo.media && (typeof photo.src !== 'string' || !photo.src.trim())) return 'Choose an upload or image URL for each past-event photograph.'
  }
  if (data.source != null && data.source !== '' && safeURL(data.source) !== true) return 'Use a safe URL for the event report.'
  if (data.facts != null && (!Array.isArray(data.facts) || data.facts.some(fact => !fact || typeof fact.label !== 'string' || !fact.label.trim() || typeof fact.value !== 'string' || !fact.value.trim()))) return 'Every reported figure needs a label and value.'
  return true
}
