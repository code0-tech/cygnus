import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      localized: true,
      required: false,
    },
    {
      name: 'about',
      type: 'textarea',
      localized: true,
      required: false,
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      required: false,
    },
    {
      name: 'joinedAt',
      type: 'date',
      required: false,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
  ],
}
