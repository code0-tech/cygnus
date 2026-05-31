import type { CollectionConfig } from "payload"

export const NavbarButtons: CollectionConfig = {
  slug: "navbarButtons",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "href", "order", "variant", "updatedAt"],
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
      localized: true,
    },
    {
      name: "href",
      type: "text",
      required: true,
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
    },
    {
      name: "icon",
      type: "text",
      required: false,
      admin: {
        description: 'Tabler Icon Name, z.B. "brand-github", oder Simple Icon mit "si", z.B. "siGithub". Leer lassen für kein Icon.',
      },
    },
    {
      name: "newTab",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "variant",
      type: "select",
      required: true,
      defaultValue: "normal",
      options: [
        { label: "None", value: "none" },
        { label: "Normal", value: "normal" },
        { label: "Outlined", value: "outlined" },
        { label: "Filled", value: "filled" },
      ],
    },
  ],
}
