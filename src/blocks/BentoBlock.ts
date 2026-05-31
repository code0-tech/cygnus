import type { Block } from "payload"

export const BentoBlock: Block = {
  slug: "bento",
  labels: {
    singular: "Bento",
    plural: "Bento Blocks",
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
