import type { Block } from "payload"

export const AboutBlock: Block = {
  slug: "about",
  labels: {
    singular: "About",
    plural: "About Blocks",
  },
    fields: [
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
