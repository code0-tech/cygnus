import type { Block } from "payload"

export const InstallBlock: Block = {
  slug: "install",
  labels: {
    singular: "Install",
    plural: "Install Blocks",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "subheading",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "label",
      type: "text",
      required: false,
      localized: true,
    },
    {
      name: "code",
      type: "textarea",
      required: true,
      localized: true,
      admin: {
        rows: 10,
      },
    },
  ],
}
