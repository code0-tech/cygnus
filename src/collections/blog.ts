import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { sanitizeLexicalUploadValues } from "@/lib/sanitizeLexicalUploadValues"
import type { CollectionConfig } from "payload"

export const Blog: CollectionConfig = {
  slug: "blog",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "isPinned", "slug", "updatedAt"],
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (!data?.isPinned) {
          return data
        }

        const currentDocId = operation === "update" ? originalDoc?.id : undefined
        const pinnedPosts = await req.payload.find({
          collection: "blog",
          where: currentDocId
            ? {
              and: [
                { isPinned: { equals: true } },
                { id: { not_equals: currentDocId } },
              ],
            }
            : { isPinned: { equals: true } },
          pagination: false,
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        })

        await Promise.all(
          pinnedPosts.docs.map((post) =>
            req.payload.update({
              collection: "blog",
              id: post.id,
              data: { isPinned: false },
              depth: 0,
              overrideAccess: true,
            }),
          ),
        )

        return data
      },
    ],
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
      name: "isPinned",
      label: "Pin this post",
      type: "checkbox",
      defaultValue: false,
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
