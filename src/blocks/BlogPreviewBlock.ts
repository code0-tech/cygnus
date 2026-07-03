import type { Block } from "payload"

export const BlogPreviewBlock: Block = {
  slug: "blogPreview",
  labels: {
    singular: "Blog Preview",
    plural: "Blog Previews",
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
          defaultValue: "imageCenter",
          options: [
            {
              label: "Image center",
              value: "imageCenter",
            },
            {
              label: "Image left",
              value: "imageLeft",
            },
            {
              label: "Image right",
              value: "imageRight",
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
      name: "blog",
      label: "Blog",
      type: "relationship",
      relationTo: "blog",
      required: true,
    },
  ],
}
