import type { Block } from "payload"

export const CtaBlock: Block = {
  slug: "cta",
  labels: {
    singular: "CTA",
    plural: "CTA Blocks",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "subheading",
      type: "text",
      required: true,
    },
    {
      name: "ctaLink",
      label: "CTA Link",
      type: "group",
      required: true,
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
  ],
}
