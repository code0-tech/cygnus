import type { Block } from "payload"

export const DeploymentBlock: Block = {
  slug: "deployment",
  labels: {
    singular: "Deployment",
    plural: "Deployment Blocks",
  },
  fields: [
    {
      name: "cloudTitle",
      type: "text",
      required: false,
      localized: true,
    },
    {
      name: "cloudDescription",
      type: "textarea",
      required: false,
      localized: true,
    },
    {
      name: "cloudLink",
      label: "Cloud Link",
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
      name: "selfhostTitle",
      type: "text",
      required: false,
      localized: true,
    },
    {
      name: "selfhostDescription",
      type: "textarea",
      required: false,
      localized: true,
    },
    {
      name: "selfhostLink",
      label: "Selfhost Link",
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
      name: "dynamicTitle",
      type: "text",
      required: false,
      localized: true,
    },
    {
      name: "dynamicDescription",
      type: "textarea",
      required: false,
      localized: true,
    },
    {
      name: "dynamicLink",
      label: "Dynamic Link",
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
}
