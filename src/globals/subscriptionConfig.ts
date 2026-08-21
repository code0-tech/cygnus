import { iconField as payloadIconField } from "@mvriu5/payload-icon-picker"
import type { Field, GlobalConfig } from "payload"

type LocalizedFeature = { de: string; en: string }

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

const planFeaturesField = (features: LocalizedFeature[]): Field => ({
    name: "features",
    label: "Features",
    type: "array",
    localized: true,
    required: true,
    minRows: 1,
    defaultValue: ({ locale }) => features.map((feature) => ({ text: locale === "de" ? feature.de : feature.en })),
    fields: [{ name: "text", label: "Feature", type: "text", required: true }],
})

export const SubscriptionCollection: GlobalConfig = {
    slug: "subscriptionConfig",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
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
                        planFeaturesField([
                            { en: "Essential workflow automation", de: "Grundlegende Workflow-Automatisierung" },
                            { en: "AI-assisted workflows", de: "KI-unterstützte Workflows" },
                            { en: "Cloud or self-hosted deployment", de: "Cloud- oder Self-hosted-Bereitstellung" },
                        ]),
                        { ...iconField, defaultValue: "sparkles" },
                        { ...colorField, defaultValue: "lime" },
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
                        planFeaturesField([
                            { en: "Everything included in Pro", de: "Alle Funktionen aus Pro" },
                            { en: "Advanced automation capabilities", de: "Erweiterte Automatisierungsfunktionen" },
                            { en: "Designed for higher workflow demand", de: "Für einen höheren Workflow-Bedarf ausgelegt" },
                        ]),
                        { ...iconField, defaultValue: "rocket" },
                        { ...colorField, defaultValue: "magenta" },
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
                            defaultValue: "Configure usage for an individual setup.",
                        },
                        planFeaturesField([
                            { en: "Configurable AI token volume", de: "Konfigurierbares KI-Token-Volumen" },
                            { en: "Configurable workflow executions", de: "Konfigurierbare Workflow-Ausführungen" },
                            { en: "Tailored usage configuration", de: "Individuelle Nutzungskonfiguration" },
                        ]),
                        { ...iconField, defaultValue: "settings" },
                        { ...colorField, defaultValue: "yellow" },
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
                {
                    name: "weeklyPaidLabel",
                    label: "Weekly Paid Label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "paid weekly",
                    admin: { description: "Shown next to the price when weekly billing is selected." },
                },
                {
                    name: "quarterlyPaidLabel",
                    label: "Quarterly Paid Label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "paid quarterly",
                    admin: { description: "Shown next to the price when quarterly billing is selected." },
                },
                {
                    name: "yearlyPaidLabel",
                    label: "Yearly Paid Label",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "paid yearly",
                    admin: { description: "Shown next to the price when yearly billing is selected." },
                },
                { ...colorField, name: "weeklyColor", defaultValue: "lime" },
                { ...colorField, name: "monthlyColor", defaultValue: "brand" },
                { ...colorField, name: "quarterlyColor", defaultValue: "aqua" },
                { ...colorField, name: "yearlyColor", defaultValue: "magenta" },
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
    ],
}
