import type { GlobalConfig } from "payload"

export const Licenses: GlobalConfig = {
    slug: "licenses",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            defaultValue: "License Collection",
        },
        {
            name: "cards",
            type: "group",
            fields: [
                { name: "licenses", type: "text", localized: true },
                { name: "subscriptions", type: "text", localized: true },
                { name: "paymentProfiles", type: "text", localized: true },
                { name: "invoices", type: "text", localized: true },
            ],
        },
    ],
}
