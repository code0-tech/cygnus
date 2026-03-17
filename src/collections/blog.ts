import { lexicalEditor } from "@payloadcms/richtext-lexical"
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
      relationTo: "users",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
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
    {
      name: "ogImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "twitterImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "meta",
      type: "group",
      fields: [
        {
          name: "description",
          type: "textarea",
          localized: true,
        },
        {
          name: "keywords",
          type: "text",
          localized: true,
          admin: {
            description: "Comma-separated keywords for SEO metadata.",
          },
        },
      ],
    },
  ],
}
