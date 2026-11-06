import type { GlobalConfig } from "payload"

export const Footer: GlobalConfig = {
    slug: "footer",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "company_name",
            type: "text",
            required: true,
            defaultValue: "CodeZero GmbH",
            localized: true,
        },
        {
            name: "description",
            type: "textarea",
            localized: true,
        },
        {
            name: "image",
            label: "Image",
            type: "upload",
            relationTo: "media",
            required: false,
        },
        {
            name: "contactEmail",
            label: "Contact Mail",
            type: "email",
        },
        {
            name: "legalLinks",
            label: "Legal Links",
            type: "group",
            fields: [
                {
                    name: "privacy",
                    label: "Privacy",
                    type: "group",
                    fields: [
                        {
                            name: "label",
                            type: "text",
                            required: true,
                            localized: true,
                            defaultValue: "Privacy Policy",
                        },
                        {
                            name: "url",
                            type: "text",
                            required: true,
                            defaultValue: "/privacy",
                        },
                    ],
                },
                {
                    name: "legalNotice",
                    label: "Legal Notice",
                    type: "group",
                    fields: [
                        {
                            name: "label",
                            type: "text",
                            required: true,
                            localized: true,
                            defaultValue: "Legal Notice",
                        },
                        {
                            name: "url",
                            type: "text",
                            required: true,
                            defaultValue: "/legal-notice",
                        },
                    ],
                },
                {
                    name: "terms",
                    label: "Terms & Conditions",
                    type: "group",
                    fields: [
                        {
                            name: "label",
                            type: "text",
                            required: true,
                            localized: true,
                            defaultValue: "Terms & Conditions",
                        },
                        {
                            name: "url",
                            type: "text",
                            required: true,
                            defaultValue: "/terms",
                        },
                    ],
                },
            ],
        },
        {
            name: "socialLinks",
            label: "Social Links",
            type: "array",
            fields: [
                {
                    name: "platform",
                    type: "select",
                    required: true,
                    options: [
                        { label: "Instagram", value: "instagram" },
                        { label: "Discord", value: "discord" },
                        { label: "X", value: "x" },
                        { label: "LinkedIn", value: "linkedin" },
                        { label: "GitHub", value: "github" },
                    ],
                },
                {
                    name: "url",
                    type: "text",
                    required: true,
                },
            ],
        },
        {
            name: "groups",
            label: "Groups",
            type: "array",
            required: true,
            fields: [
                {
                    name: "heading",
                    label: "Heading",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "items",
                    label: "Items",
                    type: "array",
                    required: true,
                    fields: [
                        {
                            name: "label",
                            type: "text",
                            required: true,
                            localized: true,
                        },
                        {
                            name: "url",
                            type: "text",
                            required: true,
                        },
                    ],
                },
            ],
        },
    ],
}
