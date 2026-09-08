import type { Access, FieldAccess } from 'payload'

/**
 * WHO MAY DO WHAT.
 *
 * Three roles, because a charity's website is edited by volunteers and the
 * figures on it are the foundation's public record:
 *
 *   contributor — may write, may not publish. Their work sits as a draft
 *                 until someone else looks at it.
 *   editor      — may publish content, and may manage the media library.
 *   admin       — may additionally manage users and see donation records.
 *
 * The split exists because the damaging action here is not editing, it is
 * PUBLISHING: this site is the foundation's record of itself, and a wrong
 * figure on it is worse than a missing one. Draft-by-default plus a second
 * pair of eyes is the cheapest protection against that.
 */
export type Role = 'admin' | 'editor' | 'contributor'

/** Ranked, so a check can ask "at least an editor?" rather than list roles. */
const RANK: Record<Role, number> = { contributor: 1, editor: 2, admin: 3 }

interface MaybeUser {
  role?: Role
}

const rankOf = (user: unknown): number => {
  const role = (user as MaybeUser | null | undefined)?.role
  return role ? (RANK[role] ?? 0) : 0
}

/** Anyone signed in, whatever their role. */
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

/** Editors and admins. */
export const isEditor: Access = ({ req }) => rankOf(req.user) >= RANK.editor

/** Admins only. */
export const isAdmin: Access = ({ req }) => rankOf(req.user) >= RANK.admin

/** Field-level twin of isAdmin — used to stop a user editing their own role. */
export const isAdminField: FieldAccess = ({ req }) => rankOf(req.user) >= RANK.admin

/**
 * PUBLIC READ, BUT ONLY OF PUBLISHED DOCUMENTS.
 *
 * Payload's own drafts feature hides unpublished documents from
 * unauthenticated reads only if the query asks it to. Returning a WHERE
 * clause here makes it structural instead: an anonymous caller cannot see a
 * draft even by asking for one directly, which matters because the build-time
 * export and the preview link both hit the same API.
 *
 * Signed-in users see everything, which is what makes preview work.
 */
export const publishedOrSignedIn: Access = ({ req }) => {
  if (req.user) return true
  return {
    _status: { equals: 'published' },
  }
}
