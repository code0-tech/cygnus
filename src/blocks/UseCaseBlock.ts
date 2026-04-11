import type { Block } from "payload"

export const UseCaseBlock: Block = {
  slug: "usecase",
  labels: {
    singular: "Use Case",
    plural: "Use Case Blocks",
  },
  fields: [
    {
      name: "useCases",
      label: "Use Cases",
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
          name: "title",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          localized: true,
        },
        {
          name: "image",
          label: "Image",
          type: "upload",
          relationTo: "media",
          required: false,
        },
        {
          name: "bulletPoints",
          label: "Bullet Points",
          type: "text",
          required: false,
          hasMany: true,
          localized: true,
        },
        {
          name: "link",
          label: "Link",
          type: "group",
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
    },
  ],
}
