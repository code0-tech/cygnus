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
          name: "bulletPoints",
          label: "Bullet Points",
          type: "text",
          required: true,
          hasMany: true,
          localized: true,
        },
        {
          name: "actions",
          label: "Actions",
          type: "text",
          required: true,
          hasMany: true,
          localized: true,
        },
      ],
    },
  ],
}
