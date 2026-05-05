import type { Block } from "payload"

export const ScrollCardBlock: Block = {
  slug: "scrollCards",
  labels: {
    singular: "Scroll Cards",
    plural: "Scroll Cards Blocks",
  },
  fields: [
    {
      name: "items",
      label: "Items",
      type: "array",
      required: true,
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
          required: true,
          localized: true,
        },
        {
          name: "showImageBorder",
          label: "Show Image Border",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "sectionLayout",
          label: "Section Layout",
          type: "select",
          required: true,
          defaultValue: "imageRight",
          options: [
            {
              label: "Image right",
              value: "imageRight",
            },
            {
              label: "Image left",
              value: "imageLeft",
            },
          ],
        },
        {
          name: "gradient",
          label: "Gradient",
          type: "select",
          required: false,
          defaultValue: "blue",
          options: [
            {
              label: "Blue",
              value: "blue",
            },
            {
              label: "Yellow",
              value: "yellow",
            },
            {
              label: "Pink",
              value: "pink",
            },
            {
              label: "Aqua",
              value: "aqua",
            },
            {
              label: "Brand",
              value: "brand",
            },
            {
              label: "Neutral",
              value: "neutral",
            },
          ],
        },
        {
          name: "gradientDirection",
          label: "Gradient Direction",
          type: "select",
          required: false,
          defaultValue: "topLeft",
          options: [
            {
              label: "Top left",
              value: "topLeft",
            },
            {
              label: "Top right",
              value: "topRight",
            },
            {
              label: "Bottom left",
              value: "bottomLeft",
            },
            {
              label: "Bottom right",
              value: "bottomRight",
            },
          ],
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
          name: "image",
          label: "Image",
          type: "upload",
          relationTo: "media",
          required: false,
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
