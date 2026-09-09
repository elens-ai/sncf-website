import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access/roles'

/**
 * THE PEOPLE WHO EDIT THE SITE.
 *
 * Only admins may create or delete accounts — on a volunteer-run site the
 * common failure is not malice but an account handed round, so accounts are
 * deliberately administered rather than self-served. There is no public
 * registration.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: { useAPIKey: true },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
  },
  access: {
    // A user may always read and update THEMSELVES (to change their password
    // or name); everything else is an admin action.
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as { role?: string }).role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    create: isAdmin,
    unlock: isAdmin,
    delete: isAdmin,
    update: ({ req }) => {
      if (!req.user) return false
      if ((req.user as { role?: string }).role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
  },
  hooks: {
    beforeChange: [
      /**
       * THE FIRST USER IS ALWAYS AN ADMIN.
       *
       * Without this the system cannot be set up at all: `role` defaults to
       * contributor and only an admin may change it, so the very first
       * account would be created unable to publish or to create anyone who
       * can — a locked door with the key inside. Payload's first-user screen
       * is the one moment there is nobody to grant the role, so it is granted
       * here instead of being asked for.
       *
       * The count is cheap and the condition is exact: it can only ever be
       * true once, because after this there is at least one user.
       */
      async ({ req, operation, data }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({
          collection: 'users',
          req,
        })
        if (totalDocs === 0) return { ...data, role: 'admin' }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'contributor',
      options: [
        { label: 'Contributor — writes drafts, cannot publish', value: 'contributor' },
        { label: 'Editor — publishes content and manages media', value: 'editor' },
        { label: 'Admin — also manages people and donations', value: 'admin' },
      ],
      /* A user updating their own record must not be able to promote
         themselves; without this, the self-update rule above would be a
         privilege-escalation path rather than a convenience. */
      access: { create: isAdminField, update: isAdminField },
      admin: { description: 'Only an admin can change this.' },
    },
  ],
}
