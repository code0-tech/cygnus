import type { Block } from "payload"

export const ActionBlock: Block = {
  slug: "actions",
  labels: {
    singular: "Actions",
    plural: "Actions Blocks",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Actions",
    },
    {
      name: "description",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Browse available actions and integrations.",
    },
    {
      name: "searchPlaceholder",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Search actions",
    },
    {
      name: "noActionsFoundLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "No actions found for your search.",
    },
    {
      name: "referencesLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "References",
    },
    {
      name: "noFlowTypesFoundLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "No flow types found.",
    },
    {
      name: "noFunctionDefinitionsFoundLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "No function definitions found.",
    },
    {
      name: "noActionDefinitionsFoundLabel",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "No flow types or function definitions found.",
    },
  ],
}
