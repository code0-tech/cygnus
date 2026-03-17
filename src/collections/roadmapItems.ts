import type { CollectionConfig } from "payload"

export const RoadmapItems: CollectionConfig = {
  slug: "roadmapItems",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["time", "title", "updatedAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "time",
      type: "text",
        required: true,
        localized: true,
    },
    {
      name: "title",
      type: "text",
        required: true,
        localized: true,
    },
    {
      name: "description",
      type: "text",
        required: true,
        localized: true,
    },
  ],
}
