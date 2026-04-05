import type { Block } from "payload"

export const EditionUseCaseBlock: Block = {
  slug: "editionUseCases",
  labels: {
    singular: "Edition UseCases",
    plural: "Edition UseCase Blocks",
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
      name: "useCases",
      label: "UseCases",
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
