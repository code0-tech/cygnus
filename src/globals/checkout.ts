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
            fields: [{ name: "backLabel", type: "text", required: true, localized: true, defaultValue: "Back" }],
        },
        {
            name: "summary",
            type: "group",
            fields: [
                { name: "eyebrow", type: "text", required: true, localized: true, defaultValue: "Order Summary" },
                { name: "heading", type: "text", required: true, localized: true, defaultValue: "Review your configuration" },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "This checkout reflects the subscription shape you configured, including runtime and optional add-ons.",
                },
                { name: "deploymentLabel", type: "text", required: true, localized: true, defaultValue: "Deployment" },
                { name: "customerTypeLabel", type: "text", required: true, localized: true, defaultValue: "Customer Type" },
                { name: "workflowExecutionsLabel", type: "text", required: true, localized: true, defaultValue: "Workflow Executions" },
                { name: "additionalFeaturesLabel", type: "text", required: true, localized: true, defaultValue: "Additional Features" },
                {
                    name: "additionalFeaturesDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Selected add-ons that extend the base subscription.",
                },
                {
                    name: "pricing",
                    type: "group",
                    fields: [
                        { name: "label", type: "text", required: true, localized: true, defaultValue: "Pricing" },
                        {
                            name: "description",
                            type: "textarea",
                            required: true,
                            localized: true,
                            defaultValue: "Monthly breakdown based on your current setup.",
                        },
                        { name: "baseLabel", type: "text", required: true, localized: true, defaultValue: "AI Tokens" },
                        { name: "workflowExecutionsLabel", type: "text", required: true, localized: true, defaultValue: "Workflow Executions" },
                        { name: "additionalFeaturesLabel", type: "text", required: true, localized: true, defaultValue: "Additional Features" },
                        { name: "totalLabel", type: "text", required: true, localized: true, defaultValue: "Total" },
                        { name: "perMonthSuffix", type: "text", required: true, localized: true, defaultValue: "/mo" },
                    ],
                },
            ],
        },
        {
            name: "form",
            type: "group",
            fields: [
                { name: "billingHeading", type: "text", required: true, localized: true, defaultValue: "Billing Address" },
                { name: "paymentHeading", type: "text", required: true, localized: true, defaultValue: "Payment Details" },
                { name: "continueLabel", type: "text", required: true, localized: true, defaultValue: "Continue to Payment" },
                { name: "backToBillingLabel", type: "text", required: true, localized: true, defaultValue: "Back to Billing" },
                { name: "payNowLabel", type: "text", required: true, localized: true, defaultValue: "Pay now" },
                { name: "processingLabel", type: "text", required: true, localized: true, defaultValue: "Processing..." },
                { name: "paymentErrorFallback", type: "text", required: true, localized: true, defaultValue: "An unexpected error occurred." },
            ],
        },
        {
            name: "success",
            type: "group",
            fields: [
                { name: "heading", type: "text", required: true, localized: true, defaultValue: "Payment submitted" },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Stripe has received your payment confirmation. You can close this page or return to the site.",
                },
                { name: "backToHomepageLabel", type: "text", required: true, localized: true, defaultValue: "Return to homepage" },
            ],
        },
    ],
}
