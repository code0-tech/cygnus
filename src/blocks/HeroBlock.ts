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
      localized: true,
    },
    {
      name: "heading",
      type: "text",
      required: true,
      localized: true,
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
          localized: true,
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
          localized: true,
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
          defaultValue: "normal",
          options: [
            {
              label: "None",
              value: "none",
            },
            {
              label: "Normal",
              value: "normal",
            },
            {
              label: "Outlined",
              value: "outlined",
            },
            {
              label: "Filled",
              value: "filled",
              },
          ],
        },
      ],
    },
  ],
}
