import type { CollectionConfig } from "payload"

export const Actions: CollectionConfig = {
    slug: "actions",
    admin: {
        useAsTitle: "identifier",
        defaultColumns: ["identifier", "module", "tags", "updatedAt"],
    },
    access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "identifier",
            type: "text",
            required: true,
            unique: true,
            index: true,
        },
        {
            name: "module",
            type: "upload",
            relationTo: "media",
            required: true,
        },
        {
            name: "tags",
            type: "text",
            hasMany: true,
        },
        {
            name: "references",
            type: "relationship",
            relationTo: "actions",
            hasMany: true,
        },
    ],
}
