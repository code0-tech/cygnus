import type { Block } from "payload"

export const RoadmapBlock: Block = {
  slug: "roadmap",
  labels: {
    singular: "Roadmap",
    plural: "Roadmap Blocks",
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
      name: "items",
      label: "Items",
      type: "array",
      required: true,
      fields: [
        {
          name: "time",
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
          type: "text",
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
