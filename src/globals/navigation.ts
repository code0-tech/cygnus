import { iconField } from "@mvriu5/payload-icon-picker"
import type { GlobalConfig } from "payload"

const pickerIconField = iconField({
  name: "icon",
  label: "Icon",
  required: true,
  placeholder: "Search icons",
  noResultsLabel: "No icons found",
  admin: {
    position: "sidebar",
  },
})

export const Navigation: GlobalConfig = {
  slug: "navigation",
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Optionales Navigationslogo. Wenn leer, wird das hardcoded Code0 Logo verwendet.",
      },
    },
    {
      name: "items",
      type: "group",
      fields: [
        {
          name: "items",
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
                pickerIconField,
              ],
            },
          ],
        },
      ],
    },
    {
      name: "buttons",
      type: "group",
      fields: [
        {
          name: "buttons",
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
            pickerIconField,
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
        },
      ],
    },
  ],
}
