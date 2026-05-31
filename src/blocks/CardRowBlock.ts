import type { Block } from "payload"

export const CardRowBlock: Block = {
  slug: "cardRow",
  labels: {
    singular: "Card Row",
    plural: "Card Rows",
  },
  fields: [
    {
      type: "collapsible",
      label: "Section",
      fields: [
        {
          name: "sectionHeading",
          label: "Section Heading",
          type: "text",
          required: false,
          localized: true,
        },
        {
          name: "sectionLayout",
          label: "Section Layout",
          type: "select",
          required: true,
          defaultValue: "center",
          options: [
            {
              label: "Center",
              value: "center",
            },
            {
              label: "Left",
              value: "left",
            },
          ],
        },
        {
          name: "sectionDescription",
          label: "Section Description",
          type: "textarea",
          required: false,
          localized: true,
        },
        {
          name: "sectionLinkButton",
          label: "Section Link Button",
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
    {
      name: "cards",
      label: "Cards",
      type: "array",
      required: false,
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "description",
          type: "textarea",
          required: false,
          localized: true,
        },
        {
          name: "link",
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
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: false,
        },
      ],
    },
  ],
}
