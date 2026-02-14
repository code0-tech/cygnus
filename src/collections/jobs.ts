import type { CollectionConfig } from "payload"

export const Jobs: CollectionConfig = {
  slug: "jobs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "type", "location", "updatedAt"],
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
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        {
          label: "Engineering",
          value: "engineering",
        },
        {
          label: "Marketing",
          value: "marketing",
        },
        {
          label: "Design",
          value: "design",
        },
        {
          label: "Product",
          value: "product",
        },
        {
          label: "Sales",
          value: "sales",
        },
        {
          label: "Operations",
          value: "operations",
        },
      ],
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        {
          label: "Full-time",
          value: "full-time",
        },
        {
          label: "Part-time",
          value: "part-time",
        },
        {
          label: "Contract",
          value: "contract",
        },
        {
          label: "Internship",
          value: "internship",
        },
        {
          label: "Working Student",
          value: "working-student",
        },
        {
          label: "Freelance",
          value: "freelance",
        },
      ],
    },
    {
      name: "location",
      type: "select",
      required: true,
      options: [
        {
          label: "Remote",
          value: "remote",
        },
        {
          label: "Hybrid",
          value: "hybrid",
        },
        {
          label: "Leipzig",
          value: "leipzig",
        },
        {
          label: "Solingen",
          value: "solingen",
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    {
      name: "order",
      type: "number",
      required: false,
      admin: {
        description: "Optional manual sort order. Lower values appear first.",
      },
    },
  ],
}
