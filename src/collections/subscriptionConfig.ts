import type { CollectionConfig } from "payload"

const accentColorOptions = [
  { label: "Brand", value: "brand" },
  { label: "Pink", value: "pink" },
  { label: "Yellow", value: "yellow" },
  { label: "Aqua", value: "aqua" },
  { label: "Blue", value: "blue" },
]

const iconFieldDescription = 'Tabler Icon Name ohne "Icon"-Praefix, z. B. "server", "cloud" oder "users-group". Unbekannte Werte fallen auf "cube" zurueck.'

const iconField = {
  name: "icon",
  type: "text",
  required: true,
  admin: {
    description: iconFieldDescription,
  },
} as const

const colorField = {
  name: "color",
  type: "select",
  required: true,
  options: accentColorOptions,
  defaultValue: "aqua",
} as const

export const SubscriptionCollection: CollectionConfig = {
  slug: "subscriptionConfig",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "updatedAt"],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "Subscription Config",
    },
    {
      name: "pageIntro",
      type: "group",
      fields: [
        {
          name: "heading",
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
      ],
    },
    {
      name: "featureOverview",
      type: "array",
      required: true,
      minRows: 1,
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
        iconField,
      ],
    },
    {
      name: "optionsPanelHeading",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "deployment",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "selfHosted",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "yellow" },
          ],
        },
        {
          name: "cloud",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "aqua" },
          ],
        },
      ],
    },
    {
      name: "customerType",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "b2b",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "blue" },
          ],
        },
        {
          name: "b2c",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "pink" },
          ],
        },
      ],
    },
    {
      name: "subscriptionTier",
      type: "group",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "pro",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "brand" },
          ],
        },
        {
          name: "team",
          type: "group",
          fields: [
            { name: "title", type: "text", required: true, localized: true },
            { name: "description", type: "textarea", required: true, localized: true },
            iconField,
            { ...colorField, defaultValue: "aqua" },
          ],
        },
      ],
    },
    {
      name: "workflowExecutions",
      type: "group",
      fields: [
        { name: "title", type: "text", required: true, localized: true },
        { name: "description", type: "textarea", required: true, localized: true },
        { name: "min", type: "number", required: true, defaultValue: 200 },
        { name: "max", type: "number", required: true, defaultValue: 10000 },
        { name: "step", type: "number", required: true, defaultValue: 100 },
        { name: "minLabel", type: "text", required: true, localized: true },
        { name: "maxLabel", type: "text", required: true, localized: true },
        { name: "centerSuffix", type: "text", required: true, localized: true },
      ],
    },
    {
      name: "contactSales",
      type: "group",
      fields: [
        { name: "prompt", type: "text", required: true, localized: true },
        { name: "label", type: "text", required: true, localized: true },
        { name: "href", type: "text", required: true },
      ],
    },
    {
      name: "subscribe",
      type: "group",
      fields: [
        { name: "label", type: "text", required: true, localized: true },
        { name: "baseUrl", type: "text", required: true },
      ],
    },
    {
      name: "price",
      type: "group",
      fields: [
        { name: "heading", type: "text", required: true, localized: true },
        { name: "caption", type: "text", required: true, localized: true },
      ],
    },
    {
      name: "additionalFeaturesLabel",
      type: "text",
      localized: true,
      admin: {
        description: "Optional section heading shown above the additional features list.",
      },
    },
    {
      name: "additionalFeatures",
      type: "array",
      admin: {
        description: "Leave empty to hide the section entirely.",
      },
      fields: [
        { name: "title", type: "text", required: true, localized: true },
        { name: "description", type: "textarea", required: true, localized: true },
        {
          name: "icon",
          type: "text",
          required: true,
          admin: {
            description: 'Tabler Icon Name ohne "Icon"-Praefix, z. B. "server", "cloud" oder "users-group". Unbekannte Werte fallen auf "cube" zurueck.',
          },
        },
        { name: "price", type: "number", required: true, defaultValue: 0, admin: { description: "Monthly price in EUR." } },
      ],
    },
  ],
}
