import type { GlobalConfig } from "payload"

const accentColorOptions = [
    { label: "Brand", value: "brand" },
    { label: "Pink", value: "pink" },
    { label: "Yellow", value: "yellow" },
    { label: "Aqua", value: "aqua" },
    { label: "Blue", value: "blue" },
]

const iconFieldDescription = 'Tabler Icon Name ohne "Icon"-Praefix, z. B. "server", "cloud" oder "users-group". Unbekannte Werte fallen auf "cube" zurueck.'

const iconField = {
    name: "icon",
    type: "text",
    required: false,
    admin: {
        description: iconFieldDescription,
    },
} as const

const colorField = {
    name: "color",
    type: "select",
    required: false,
    options: accentColorOptions,
    defaultValue: "aqua",
} as const

export const SubscriptionCollection: GlobalConfig = {
    slug: "subscriptionConfig",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: false,
            defaultValue: "Subscription Config",
        },
        {
            name: "pageIntro",
            type: "group",
            fields: [
                {
                    name: "heading",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Configure your setup before you talk pricing.",
                },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                    defaultValue:
                        "Pick your operating model, customer shape, and usage pattern. The right-hand side updates into a purchase-ready configuration flow instead of a generic pricing table.",
                },
            ],
        },
        {
            name: "featureOverview",
            type: "array",
            required: false,
            minRows: 1,
            defaultValue: [
                {
                    title: "Fast onboarding",
                    description: "Move from evaluation to a concrete subscription path without guessing which packaging model fits your rollout.",
                    icon: "rocket",
                },
                {
                    title: "Commercial clarity",
                    description: "Separate customer type, hosting model, and runtime expectations before a plan is proposed.",
                    icon: "user-shield",
                },
                {
                    title: "Usage visibility",
                    description: "Shape your quote around expected workflow execution volume instead of a generic flat plan.",
                    icon: "gauge",
                },
            ],
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: false,
                    localized: true,
                },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
                iconField,
            ],
        },
        {
            name: "optionsPanelHeading",
            type: "text",
            required: false,
            localized: true,
            defaultValue: "Build the subscription shape",
        },
        {
            name: "deployment",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Deployment",
                },
                {
                    name: "selfHosted",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Self-hosted" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Deploy on your own infrastructure with full operational control.",
                        },
                        { ...iconField, defaultValue: "server" },
                        { ...colorField, defaultValue: "yellow" },
                    ],
                },
                {
                    name: "cloud",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Cloud" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Use managed infrastructure with selectable runtime consumption.",
                        },
                        { ...iconField, defaultValue: "cloud" },
                        { ...colorField, defaultValue: "aqua" },
                    ],
                },
            ],
        },
        {
            name: "customerType",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Customer Type",
                },
                {
                    name: "b2b",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "B2B" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Organization purchase flow with tailored commercial handling.",
                        },
                        { ...iconField, defaultValue: "briefcase-2" },
                        { ...colorField, defaultValue: "blue" },
                    ],
                },
                {
                    name: "b2c",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "B2C" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Standardized subscription flow with directly selectable plans.",
                        },
                        { ...iconField, defaultValue: "building-store" },
                        { ...colorField, defaultValue: "pink" },
                    ],
                },
            ],
        },
        {
            name: "subscriptionTier",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Subscription tier",
                },
                {
                    name: "pro",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "PRO" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Single-owner setup for advanced personal or expert workflows.",
                        },
                        { ...iconField, defaultValue: "sparkles" },
                        { ...colorField, defaultValue: "brand" },
                    ],
                },
                {
                    name: "team",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "TEAM" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Shared workspace model with seat-based team access.",
                        },
                        { ...iconField, defaultValue: "users-group" },
                        { ...colorField, defaultValue: "aqua" },
                    ],
                },
            ],
        },
        {
            name: "workflowExecutions",
            type: "group",
            fields: [
                { name: "title", type: "text", required: false, localized: true, defaultValue: "Workflow Executions" },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                    defaultValue: "How many workflow executions do you expect per month?",
                },
                { name: "min", type: "number", required: false, defaultValue: 200 },
                { name: "max", type: "number", required: false, defaultValue: 10000 },
                { name: "step", type: "number", required: false, defaultValue: 100 },
                { name: "minLabel", type: "text", required: false, localized: true, defaultValue: "200 exec" },
                { name: "maxLabel", type: "text", required: false, localized: true, defaultValue: "10,000 exec" },
                { name: "centerSuffix", type: "text", required: false, localized: true, defaultValue: "exec" },
            ],
        },
        {
            name: "workflowCalculator",
            label: "Workflow Calculator",
            type: "group",
            fields: [
                { name: "triggerLabel", type: "text", required: false, localized: true, defaultValue: "Calculate" },
                { name: "title", type: "text", required: false, localized: true, defaultValue: "Calculate workflow executions" },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                    defaultValue: "Estimate monthly volume from your active workflows and their average execution frequency.",
                },
                { name: "closeLabel", type: "text", required: false, localized: true, defaultValue: "Close dialog" },
                { name: "businessTypeLabel", type: "text", required: false, localized: true, defaultValue: "Business type" },
                { name: "businessTypeSearchPlaceholder", type: "text", required: false, localized: true, defaultValue: "Search business types" },
                { name: "noBusinessTypesFoundLabel", type: "text", required: false, localized: true, defaultValue: "No business types found." },
                { name: "activeWorkflowsLabel", type: "text", required: false, localized: true, defaultValue: "Active workflows" },
                { name: "runsPerDayLabel", type: "text", required: false, localized: true, defaultValue: "Runs per month" },
                { name: "daysPerMonthLabel", type: "text", required: false, localized: true, defaultValue: "Days per month" },
                { name: "estimateLabel", type: "text", required: false, localized: true, defaultValue: "Estimated monthly volume" },
                { name: "cancelLabel", type: "text", required: false, localized: true, defaultValue: "Cancel" },
                { name: "applyLabel", type: "text", required: false, localized: true, defaultValue: "Apply value" },
                {
                    name: "businessTypes",
                    label: "Business Types",
                    type: "array",
                    required: false,
                    minRows: 1,
                    defaultValue: [
                        {
                            name: "General",
                            conversion_rate: 1,
                            conversion_unit: "executions",
                            icon: "building",
                        },
                    ],
                    fields: [
                        { name: "name", type: "text", required: false, localized: true },
                        { name: "conversion_unit", label: "Conversion Unit", type: "text", required: false, localized: true, defaultValue: "executions" },
                        { ...iconField, defaultValue: "building" },
                        {
                            name: "conversion_rate",
                            label: "Conversion Rate",
                            type: "number",
                            required: false,
                            defaultValue: 1,
                            min: 0,
                        },
                    ],
                },
            ],
        },
        {
            name: "workflowExecutionPriceFactor",
            label: "Workflow Execution Price Factor",
            type: "number",
            required: false,
            defaultValue: 0.001,
            min: 0,
        },
        {
            name: "aiTokens",
            label: "AI Tokens",
            type: "group",
            fields: [
                { name: "title", type: "text", required: false, localized: true, defaultValue: "AI Tokens" },
                { name: "description", type: "textarea", required: false, localized: true, defaultValue: "How many AI tokens do you expect to consume per month?" },
                { name: "min", type: "number", required: false, defaultValue: 100000 },
                { name: "max", type: "number", required: false, defaultValue: 10000000 },
                { name: "step", type: "number", required: false, defaultValue: 100000 },
                { name: "minLabel", type: "text", required: false, localized: true, defaultValue: "100K tokens" },
                { name: "maxLabel", type: "text", required: false, localized: true, defaultValue: "10M tokens" },
                { name: "centerSuffix", type: "text", required: false, localized: true, defaultValue: "tokens" },
            ],
        },
        {
            name: "aiTokenPriceFactor",
            label: "AI Token Price Factor",
            type: "number",
            required: false,
            defaultValue: 0.000001,
            min: 0,
        },
        {
            name: "contactSales",
            type: "group",
            fields: [
                { name: "prompt", type: "text", required: false, localized: true, defaultValue: "Need more?" },
                { name: "label", type: "text", required: false, localized: true, defaultValue: "Contact sales" },
                { name: "href", type: "text", required: false, defaultValue: "/contact" },
            ],
        },
        {
            name: "subscribe",
            type: "group",
            fields: [
                { name: "label", type: "text", required: false, localized: true, defaultValue: "Buy now" },
                { name: "baseUrl", type: "text", required: false, defaultValue: "" },
            ],
        },
        {
            name: "price",
            type: "group",
            fields: [
                { name: "heading", type: "text", required: false, localized: true, defaultValue: "Price" },
                { name: "caption", type: "text", required: false, localized: true, defaultValue: "per month" },
            ],
        },
        {
            name: "additionalFeaturesLabel",
            type: "text",
            localized: true,
            admin: {
                description: "Optional section heading shown above the additional features list.",
            },
        },
        {
            name: "additionalFeatures",
            type: "array",
            admin: {
                description: "Leave empty to hide the section entirely.",
            },
            fields: [
                { name: "title", type: "text", required: false, localized: true },
                { name: "description", type: "textarea", required: false, localized: true },
                {
                    name: "icon",
                    type: "text",
                    required: false,
                    admin: {
                        description: 'Tabler Icon Name ohne "Icon"-Praefix, z. B. "server", "cloud" oder "users-group". Unbekannte Werte fallen auf "cube" zurueck.',
                    },
                },
                { name: "price", type: "number", required: false, defaultValue: 0, admin: { description: "Monthly price in EUR." } },
            ],
        },
    ],
}
