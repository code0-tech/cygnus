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
            type: "select",
            hasMany: true,
            options: [
                { label: "AI", value: "AI" },
                { label: "Analytics", value: "Analytics" },
                { label: "Communication", value: "Communication" },
                { label: "Cybersecurity", value: "Cybersecurity" },
                { label: "Data & Storage", value: "Data & Storage" },
                { label: "Developer Tools", value: "Developer Tools" },
                { label: "Development", value: "Development" },
                { label: "Finance & Accounting", value: "Finance & Accounting" },
                { label: "HTL", value: "HTL" },
                { label: "Marketing", value: "Marketing" },
                { label: "Miscellaneous", value: "Miscellaneous" },
                { label: "Productivity", value: "Productivity" },
                { label: "Sales", value: "Sales" },
                { label: "Utility", value: "Utility" },
            ],
        },
        {
            name: "references",
            type: "relationship",
            relationTo: "actions",
            hasMany: true,
        },
    ],
}
