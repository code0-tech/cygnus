import type { Block } from "payload"

export const OffsetCardsBlock: Block = {
  slug: "offsetCards",
  labels: {
    singular: "Offset Cards",
    plural: "Offset Cards Blocks",
  },
  fields: [
    {
      name: "showSectionHeader",
      label: "Show Section Header",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "cards",
      label: "Cards",
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
