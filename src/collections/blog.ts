import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { sanitizeLexicalUploadValues } from "@/lib/sanitizeLexicalUploadValues"
import type { CollectionConfig } from "payload"

export const Blog: CollectionConfig = {
  slug: "blog",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
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
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "team-members",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
      hooks: {
        afterRead: [
          ({ value }) => sanitizeLexicalUploadValues(value),
        ],
        beforeChange: [
          ({ value }) => sanitizeLexicalUploadValues(value),
        ],
      },
    },
    {
      name: "shortDescription",
      type: "textarea",
      localized: true,
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
  ],
}
