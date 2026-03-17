import type { Block } from "payload"

export const FaqBlock: Block = {
  slug: "faq",
  labels: {
    singular: "FAQ",
    plural: "FAQ Blocks",
  },
  fields: [
    {
      name: "items",
      label: "FAQ Items",
      type: "array",
      required: true,
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "answer",
          type: "textarea",
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
