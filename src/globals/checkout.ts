import type { GlobalConfig } from "payload"

export const Checkout: GlobalConfig = {
    slug: "checkout",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            defaultValue: "Checkout Content",
        },
        {
            name: "navigation",
            type: "group",
            fields: [{ name: "backLabel", type: "text", required: true, localized: true }],
        },
        {
            name: "summary",
            type: "group",
            fields: [
                { name: "eyebrow", type: "text", required: true, localized: true },
                { name: "heading", type: "text", required: true, localized: true },
                { name: "description", type: "textarea", required: true, localized: true },
                { name: "deploymentLabel", type: "text", required: true, localized: true },
                { name: "customerTypeLabel", type: "text", required: true, localized: true },
                { name: "workflowExecutionsLabel", type: "text", required: true, localized: true },
                { name: "additionalFeaturesLabel", type: "text", required: true, localized: true },
                { name: "additionalFeaturesDescription", type: "textarea", required: true, localized: true },
                {
                    name: "pricing",
                    type: "group",
                    fields: [
                        { name: "label", type: "text", required: true, localized: true },
                        { name: "description", type: "textarea", required: true, localized: true },
                        { name: "baseLabel", type: "text", required: true, localized: true },
                        { name: "workflowExecutionsLabel", type: "text", required: true, localized: true },
                        { name: "additionalFeaturesLabel", type: "text", required: true, localized: true },
                        { name: "totalLabel", type: "text", required: true, localized: true },
                        { name: "perMonthSuffix", type: "text", required: true, localized: true },
                    ],
                },
            ],
        },
        {
            name: "form",
            type: "group",
            fields: [
                { name: "billingHeading", type: "text", required: true, localized: true },
                { name: "paymentHeading", type: "text", required: true, localized: true },
                { name: "continueLabel", type: "text", required: true, localized: true },
                { name: "backToBillingLabel", type: "text", required: true, localized: true },
                { name: "payNowLabel", type: "text", required: true, localized: true },
                { name: "processingLabel", type: "text", required: true, localized: true },
                { name: "paymentErrorFallback", type: "text", required: true, localized: true },
            ],
        },
        {
            name: "success",
            type: "group",
            fields: [
                { name: "heading", type: "text", required: true, localized: true },
                { name: "description", type: "textarea", required: true, localized: true },
                { name: "backToHomepageLabel", type: "text", required: true, localized: true },
            ],
        },
    ],
}
