import type { Block } from "payload"

export const BentoBlock: Block = {
  slug: "bento",
  labels: {
    singular: "Bento",
    plural: "Bento Blocks",
  },
  fields: [
    {
      name: "variant",
      label: "Variant",
      type: "select",
      required: true,
      defaultValue: "feature",
      options: [
        {
          label: "Feature",
          value: "feature",
        },
        {
          label: "Runtime",
          value: "runtime",
        },
      ],
    },
  ],
}
