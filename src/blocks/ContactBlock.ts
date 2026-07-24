import type { Block } from "payload"

export const ContactBlock: Block = {
    slug: "contact",
    labels: {
        singular: "Contact",
        plural: "Contact Blocks",
    },
    fields: [
        {
            name: "heading",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Contact us",
        },
        {
            name: "description",
            type: "textarea",
            required: true,
            localized: true,
        },
        {
            name: "nameLabel",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Name",
        },
        {
            name: "namePlaceholder",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Your name",
        },
        {
            name: "emailLabel",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Email",
        },
        {
            name: "emailPlaceholder",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "you@example.com",
        },
        {
            name: "messageLabel",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Message",
        },
        {
            name: "messagePlaceholder",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "How can we help you?",
        },
        {
            name: "submitLabel",
            type: "text",
            required: true,
            localized: true,
            defaultValue: "Send message",
        },
    ],
}
