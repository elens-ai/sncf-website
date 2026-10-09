/** Empty optional defaults (for example an unconfigured film URL) need no
 * published override. Content slots require text; the frontend keeps its
 * empty fallback until an editor supplies a value. */
export function seedCopyEntries(copy: Record<string, unknown>): [string, string][] {
  return Object.entries(copy).filter((entry): entry is [string, string] =>
    typeof entry[1] === 'string' && entry[1].trim().length > 0,
  )
}
