import type { CollectionConfig } from "payload"

export const Features: CollectionConfig = {
  slug: "features",
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
      name: "slug",
      type: "select",
      required: true,
      unique: true,
      options: [
        {
          label: "Welcome User",
          value: "welcome-user",
        },
        {
          label: "Pro Subscription",
          value: "pro-subscription",
        },
        {
          label: "Team Subscription",
          value: "team-subscription",
        },
        {
          label: "Role System",
          value: "role-system",
        },
        {
          label: "Member Management",
          value: "member-management",
        },
        {
          label: "Organizations",
          value: "organizations",
        },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      required: false,
      localized: true,
    },
    {
      name: "link",
      label: "Link",
      type: "group",
      required: false,
      fields: [
        {
          name: "label",
          type: "text",
          required: false,
          localized: true,
        },
        {
          name: "url",
          type: "text",
          required: false,
        },
      ],
    },
  ],
}
