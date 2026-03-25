import type { CollectionConfig } from "payload"

const localizedText = (name: string, label: string) => ({
  name,
  label,
  type: "text" as const,
  required: true,
  localized: true,
})

export const CookieBanner: CollectionConfig = {
  slug: "cookie-banner",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "common",
      label: "Common",
      type: "group",
      fields: [
        localizedText("acceptAll", "Accept all"),
        localizedText("rejectAll", "Reject all"),
        localizedText("customize", "Customize"),
        localizedText("save", "Save"),
      ],
    },
    {
      name: "cookieBanner",
      label: "Cookie Banner",
      type: "group",
      fields: [
        localizedText("title", "Title"),
        localizedText("description", "Description"),
      ],
    },
    {
      name: "consentManagerDialog",
      label: "Consent Manager Dialog",
      type: "group",
      fields: [
        localizedText("title", "Title"),
        localizedText("description", "Description"),
      ],
    },
    {
      name: "consentTypes",
      label: "Consent Types",
      type: "group",
      fields: [
        {
          name: "necessary",
          label: "Necessary",
          type: "group",
          fields: [
            localizedText("title", "Title"),
            localizedText("description", "Description"),
          ],
        },
        {
          name: "measurement",
          label: "Measurement",
          type: "group",
          fields: [
            localizedText("title", "Title"),
            localizedText("description", "Description"),
          ],
        },
        {
          name: "marketing",
          label: "Marketing",
          type: "group",
          fields: [
            localizedText("title", "Title"),
            localizedText("description", "Description"),
          ],
        },
      ],
    },
    {
      name: "legalLinks",
      label: "Legal Links",
      type: "group",
      fields: [
        {
          name: "privacyPolicy",
          label: "Privacy Policy",
          type: "group",
          fields: [
            localizedText("label", "Label"),
            localizedText("href", "Href"),
          ],
        },
        {
          name: "termsOfService",
          label: "Terms of Service",
          type: "group",
          fields: [
            localizedText("label", "Label"),
            localizedText("href", "Href"),
          ],
        },
      ],
    },
  ],
}
