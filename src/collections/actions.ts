import type { CollectionConfig } from "payload"

export const Actions: CollectionConfig = {
  slug: "actions",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "updatedAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "URL slug for the action subpage, e.g. 'slack-sync'.",
      },
    },
    {
      name: "shortDescription",
      type: "textarea",
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "icon",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },
    {
      name: "documentation",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          localized: true,
        },
        {
          name: "url",
          type: "text",
        },
      ],
    },
    {
      name: "references",
      type: "relationship",
      relationTo: "actions",
      hasMany: true,
    },
  ],
}
