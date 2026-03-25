import type { CollectionConfig } from "payload"

export const Footer: CollectionConfig = {
  slug: "footer",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "company_name",
      type: "text",
      required: true,
      defaultValue: "CodeZero GmbH",
      localized: true,
    },
    {
      name: "socialLinks",
      label: "Social Links",
      type: "array",
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Discord", value: "discord" },
            { label: "X", value: "x" },
            { label: "GitHub", value: "github" },
          ],
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "groups",
      label: "Groups",
      type: "array",
      required: true,
      fields: [
        {
          name: "heading",
          label: "Heading",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "items",
          label: "Items",
          type: "array",
          required: true,
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              localized: true,
            },
            {
              name: "url",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
