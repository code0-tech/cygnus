import { iconField as payloadIconField } from "@mvriu5/payload-icon-picker"
import type { Field, GlobalConfig } from "payload"

const accentColorOptions = [
    { label: "Brand", value: "brand" },
    { label: "Pink", value: "pink" },
    { label: "Yellow", value: "yellow" },
    { label: "Aqua", value: "aqua" },
    { label: "Blue", value: "blue" },
    { label: "Lime", value: "lime" },
    { label: "Magenta", value: "magenta" },
]

const iconField = payloadIconField({
    name: "icon",
    label: "Icon",
    required: true,
    placeholder: "Search icons",
    noResultsLabel: "No icons found",
    admin: {
        position: "sidebar",
    },
})

const colorField = {
    name: "color",
    type: "select",
    required: false,
    options: accentColorOptions,
    defaultValue: "aqua",
} as const

const optionImageField = (): Field => ({
    name: "image",
    label: "Image",
    type: "upload",
    relationTo: "media",
    required: false,
})

const usageRangeFields = (defaults: { default: number; min: number; max: number; step: number }): Field[] => [
    { name: "default", label: "Default (shown when the slider opens)", type: "number", required: false, defaultValue: defaults.default },
    { name: "step", type: "number", required: false, defaultValue: defaults.step },
    { name: "min", type: "number", required: false, defaultValue: defaults.min },
    { name: "max", type: "number", required: false, defaultValue: defaults.max },
]

const packagePriceFields = (): Field[] => [
    { name: "weekly", label: "Weekly", type: "number", required: false, defaultValue: 0, min: 0 },
    { name: "monthly", label: "Monthly", type: "number", required: false, defaultValue: 0, min: 0 },
    { name: "quarterly", label: "Quarterly", type: "number", required: false, defaultValue: 0, min: 0 },
    { name: "yearly", label: "Yearly", type: "number", required: false, defaultValue: 0, min: 0 },
]

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
            name: "optionsPanelHeading",
            type: "text",
            required: false,
            localized: true,
            defaultValue: "Build the subscription shape",
        },
        {
            name: "defaults",
            label: "Configurator Defaults",
            type: "group",
            fields: [
                {
                    name: "deployment",
                    type: "select",
                    required: false,
                    defaultValue: "self_hosted",
                    options: [
                        { label: "Self-hosted", value: "self_hosted" },
                        { label: "Cloud", value: "cloud" },
                    ],
                },
                {
                    name: "customerType",
                    type: "select",
                    required: false,
                    defaultValue: "b2b",
                    options: [
                        { label: "B2B", value: "b2b" },
                        { label: "B2C", value: "b2c" },
                    ],
                },
                {
                    name: "paymentPeriod",
                    label: "Payment Period",
                    type: "group",
                    fields: [
                        {
                            name: "b2b",
                            label: "B2B",
                            type: "select",
                            required: false,
                            defaultValue: "monthly",
                            options: [
                                { label: "Monthly", value: "monthly" },
                                { label: "Quarterly", value: "quarterly" },
                                { label: "Yearly", value: "yearly" },
                            ],
                        },
                        {
                            name: "b2c",
                            label: "B2C",
                            type: "select",
                            required: false,
                            defaultValue: "monthly",
                            options: [
                                { label: "Weekly", value: "weekly" },
                                { label: "Monthly", value: "monthly" },
                                { label: "Yearly", value: "yearly" },
                            ],
                        },
                    ],
                },
            ],
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
                    defaultValue: "Choose where your code0 instance will run.",
                },
                { name: "description", type: "textarea", required: false, localized: true },
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
                        optionImageField(),
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
                        optionImageField(),
                    ],
                },
            ],
        },
        {
            name: "plan",
            label: "Plan",
            type: "group",
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Choose the plan that best matches your requirements.",
                },
                { name: "description", type: "textarea", required: false, localized: true },
                {
                    name: "pro",
                    label: "Pro",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Pro" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "A ready-to-use plan for individuals and smaller teams.",
                        },
                        { ...iconField, defaultValue: "sparkles" },
                        optionImageField(),
                    ],
                },
                {
                    name: "max",
                    label: "Max",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Max" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "A ready-to-use plan for organizations with higher requirements.",
                        },
                        { ...iconField, defaultValue: "rocket" },
                        optionImageField(),
                    ],
                },
                {
                    name: "custom",
                    label: "Custom",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Custom" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "Configure usage and additional features for an individual setup.",
                        },
                        { ...iconField, defaultValue: "settings" },
                        optionImageField(),
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
                    defaultValue: "Choose the customer model that best matches your use case.",
                },
                { name: "description", type: "textarea", required: false, localized: true },
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
                        optionImageField(),
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
                        optionImageField(),
                    ],
                },
            ],
        },
        {
            name: "packages",
            label: "Pricing Packages",
            type: "group",
            fields: [
                {
                    name: "pro",
                    label: "Pro",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Pro" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "For individuals and smaller teams.",
                        },
                        {
                            name: "prices",
                            label: "Prices",
                            type: "group",
                            fields: packagePriceFields(),
                        },
                    ],
                },
                {
                    name: "max",
                    label: "Max",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Max" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "For organizations with higher requirements.",
                        },
                        {
                            name: "prices",
                            label: "Prices",
                            type: "group",
                            fields: packagePriceFields(),
                        },
                    ],
                },
                {
                    name: "custom",
                    label: "Custom",
                    type: "group",
                    fields: [
                        { name: "title", type: "text", required: false, localized: true, defaultValue: "Custom" },
                        {
                            name: "description",
                            type: "textarea",
                            required: false,
                            localized: true,
                            defaultValue: "A tailored package for individual requirements.",
                        },
                    ],
                },
            ],
        },
        {
            name: "paymentPeriod",
            label: "Payment Period",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Choose how often you want to be billed.",
                },
                { name: "description", type: "textarea", required: false, localized: true },
                { name: "weeklyText", type: "text", required: false, localized: true, defaultValue: "Weekly" },
                { name: "monthlyText", type: "text", required: false, localized: true, defaultValue: "Monthly" },
                { name: "quarterlyText", type: "text", required: false, localized: true, defaultValue: "Quarterly" },
                { name: "yearlyText", type: "text", required: false, localized: true, defaultValue: "Yearly" },
                { name: "weeklyPeriodSuffix", type: "text", required: false, localized: true, defaultValue: "per week" },
                { name: "monthlyPeriodSuffix", type: "text", required: false, localized: true, defaultValue: "per month" },
                { name: "quarterlyPeriodSuffix", type: "text", required: false, localized: true, defaultValue: "per quarter" },
                { name: "yearlyPeriodSuffix", type: "text", required: false, localized: true, defaultValue: "per year" },
                { ...colorField, name: "weeklyColor", defaultValue: "lime" },
                { ...colorField, name: "monthlyColor", defaultValue: "brand" },
                { ...colorField, name: "quarterlyColor", defaultValue: "aqua" },
                { ...colorField, name: "yearlyColor", defaultValue: "magenta" },
                {
                    name: "quarterlyDiscount",
                    label: "Quarterly Discount",
                    type: "number",
                    required: false,
                    defaultValue: 0,
                    min: 0,
                    max: 1,
                },
                {
                    name: "yearlyDiscount",
                    label: "Yearly Discount",
                    type: "number",
                    required: false,
                    defaultValue: 0,
                    min: 0,
                    max: 1,
                },
            ],
        },
        {
            name: "workflowExecutions",
            type: "group",
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "How many workflow executions do you expect per month?",
                },
                { name: "description", type: "textarea", required: false, localized: true },
                {
                    name: "b2b",
                    label: "B2B",
                    type: "group",
                    fields: usageRangeFields({ default: 1000, min: 200, max: 10000, step: 100 }),
                },
                {
                    name: "b2c",
                    label: "B2C",
                    type: "group",
                    fields: usageRangeFields({ default: 100, min: 10, max: 1000, step: 10 }),
                },
                { name: "suffix", type: "text", required: false, localized: true, defaultValue: "exec" },
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
                { name: "title", type: "text", required: false, localized: true, defaultValue: "How many AI tokens do you expect to consume per month?" },
                { name: "description", type: "textarea", required: false, localized: true },
                {
                    name: "b2b",
                    label: "B2B",
                    type: "group",
                    fields: usageRangeFields({ default: 1000000, min: 100000, max: 10000000, step: 100000 }),
                },
                {
                    name: "b2c",
                    label: "B2C",
                    type: "group",
                    fields: usageRangeFields({ default: 100000, min: 10000, max: 1000000, step: 10000 }),
                },
                { name: "suffix", type: "text", required: false, localized: true, defaultValue: "tokens" },
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
            name: "additionalFeaturesDescription",
            type: "textarea",
            localized: true,
            admin: {
                description: "Optional description shown below the additional features heading.",
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
                iconField,
                { name: "price", type: "number", required: false, defaultValue: 0, admin: { description: "Monthly price in EUR." } },
            ],
        },
    ],
}
