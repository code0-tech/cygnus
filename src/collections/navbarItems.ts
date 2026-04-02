import type { CollectionConfig } from "payload"

export const NavbarItems: CollectionConfig = {
  slug: "navbarItems",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "href", "order", "updatedAt"],
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
      admin: {
        description: "Leer lassen, wenn ein Submenu angezeigt werden soll.",
      },
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
    },
    {
      name: "subMenu",
      type: "array",
      required: false,
      fields: [
        {
          name: "key",
          type: "text",
          required: true,
        },
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
          name: "description",
          type: "textarea",
          required: true,
          localized: true,
        },
        {
          name: "icon",
          type: "text",
          required: true,
          admin: {
            description:
              'Tabler Icon Name. Unbekannte Werte fallen auf "cube" zurück.',
          },
        },
      ],
    },
  ],
}
