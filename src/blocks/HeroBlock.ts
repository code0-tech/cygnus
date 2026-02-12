import type { Block } from "payload"

export const HeroBlock: Block = {
  slug: "hero",
  labels: {
    singular: "Hero",
    plural: "Hero Blocks",
  },
  fields: [
    {
      name: "badge",
      type: "text",
      required: false,
    },
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "texts",
      label: "Texts",
      type: "array",
      required: false,
      fields: [
        {
          name: "text",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "buttons",
      label: "Buttons",
      type: "array",
      required: false,
      maxRows: 3,
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
        {
          name: "variant",
          type: "select",
          required: false,
          defaultValue: "default",
          options: [
            {
              label: "Default",
              value: "default",
            },
            {
              label: "Ghost",
              value: "ghost",
            },
            {
              label: "Link",
              value: "link",
            },
          ],
        },
      ],
    },
  ],
}
