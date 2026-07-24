import type { CollectionConfig } from "payload"

export const TeamMembers: CollectionConfig = {
    slug: "team-members",
    access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
    admin: {
        useAsTitle: "name",
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "image",
            type: "upload",
            relationTo: "media",
            required: false,
        },
        {
            name: "shortDescription",
            type: "textarea",
            localized: true,
            required: false,
        },
        {
            name: "about",
            type: "textarea",
            localized: true,
            required: false,
        },
        {
            name: "role",
            type: "text",
            localized: true,
            required: false,
        },
        {
            name: "joinedAt",
            type: "date",
            required: false,
            admin: {
                date: {
                    pickerAppearance: "dayOnly",
                },
            },
        },
    ],
}
