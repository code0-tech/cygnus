import type { Field, GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

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

const paymentPeriodOptions = [
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" },
]

const colorField = {
    name: "color",
    type: "select",
    required: true,
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

// Section descriptions are optional intro copy; everything else the configurator renders is required.
const sectionDescriptionField: Field = { name: "description", type: "textarea", required: false, localized: true }

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
            // Unnamed tabs only group the admin view; the stored data keeps its top-level shape.
            type: "tabs",
            tabs: [
                {
                    label: "General",
                    description: "Defaults for the configurator and the actions below it.",
                    fields: [
                        {
                            name: "defaults",
                            label: "Configurator Defaults",
                            type: "group",
                            fields: [
                                {
                                    name: "deployment",
                                    type: "select",
                                    required: true,
                                    defaultValue: "self_hosted",
                                    options: [
                                        { label: "Self-hosted", value: "self_hosted" },
                                        { label: "Cloud", value: "cloud" },
                                    ],
                                },
                                {
                                    name: "customerType",
                                    type: "select",
                                    required: true,
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
                                        { name: "b2b", label: "B2B", type: "select", required: true, defaultValue: "monthly", options: paymentPeriodOptions },
                                        { name: "b2c", label: "B2C", type: "select", required: true, defaultValue: "monthly", options: paymentPeriodOptions },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "subscribe",
                            type: "group",
                            fields: [localizedText("label", "Buy now", "Jetzt kaufen"), { name: "baseUrl", type: "text", required: true, defaultValue: "/checkout" }],
                        },
                        {
                            name: "contactSales",
                            type: "group",
                            fields: [
                                localizedText("prompt", "Need more?", "Du brauchst mehr?"),
                                localizedText("label", "Contact sales", "Vertrieb kontaktieren"),
                                { name: "href", type: "text", required: true, defaultValue: "/contact" },
                            ],
                        },
                    ],
                },
                {
                    label: "Configurator steps",
                    description: "Texts and options of the deployment, customer type and payment period steps.",
                    fields: [
                        {
                            name: "deployment",
                            type: "group",
                            fields: [
                                localizedText("label", "Choose where your code0 instance will run.", "Wähle, wo deine code0-Instanz laufen soll."),
                                sectionDescriptionField,
                                { ...colorField, label: "Selected color", defaultValue: "aqua", admin: { description: "Highlight color of the selected option in this step." } },
                                {
                                    name: "selfHosted",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Self-hosted", "Self-hosted"),
                                        localizedText(
                                            "description",
                                            "Deploy on your own infrastructure with full operational control.",
                                            "Betreibe code0 auf deiner eigenen Infrastruktur mit voller Kontrolle über den Betrieb.",
                                            {
                                                type: "textarea",
                                            }
                                        ),
                                        optionImageField(),
                                    ],
                                },
                                {
                                    name: "cloud",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Cloud", "Cloud"),
                                        localizedText(
                                            "description",
                                            "Use managed infrastructure with selectable runtime consumption.",
                                            "Nutze verwaltete Infrastruktur mit wählbarem Laufzeitverbrauch.",
                                            {
                                                type: "textarea",
                                            }
                                        ),
                                        optionImageField(),
                                    ],
                                },
                            ],
                        },
                        {
                            name: "customerType",
                            type: "group",
                            fields: [
                                localizedText("label", "Choose the customer model that best matches your use case.", "Wähle das Kundenmodell, das am besten zu deinem Anwendungsfall passt."),
                                sectionDescriptionField,
                                { ...colorField, label: "Selected color", defaultValue: "blue", admin: { description: "Highlight color of the selected option in this step." } },
                                {
                                    name: "b2b",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "B2B", "B2B"),
                                        localizedText(
                                            "description",
                                            "Organization purchase flow with tailored commercial handling.",
                                            "Kaufprozess für Organisationen mit individueller kaufmännischer Abwicklung.",
                                            {
                                                type: "textarea",
                                            }
                                        ),
                                        optionImageField(),
                                    ],
                                },
                                {
                                    name: "b2c",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "B2C", "B2C"),
                                        localizedText("description", "Standardized subscription flow with directly selectable plans.", "Standardisierter Abo-Prozess mit direkt wählbaren Plänen.", {
                                            type: "textarea",
                                        }),
                                        optionImageField(),
                                    ],
                                },
                            ],
                        },
                        {
                            name: "paymentPeriod",
                            label: "Payment Period",
                            type: "group",
                            fields: [
                                localizedText("label", "Choose how often you want to be billed.", "Wähle, wie oft du abgerechnet werden möchtest."),
                                sectionDescriptionField,
                                localizedText("monthlyText", "Monthly", "Monatlich"),
                                localizedText("savingsLabel", "Save", "Spare", {
                                    label: "Savings Label",
                                    description: "Text before what the whole payment period saves compared to paying monthly, for example Save €30.",
                                }),
                                localizedText("quarterlyText", "Quarterly", "Vierteljährlich"),
                                localizedText("yearlyText", "Yearly", "Jährlich"),
                                localizedText("monthlyPeriodSuffix", "per month", "pro Monat"),
                                localizedText("quarterlyPeriodSuffix", "per quarter", "pro Quartal"),
                                localizedText("yearlyPeriodSuffix", "per year", "pro Jahr"),
                                { ...colorField, label: "Selected color", defaultValue: "brand", admin: { description: "Highlight color of the selected option in this step." } },
                            ],
                        },
                    ],
                },
                {
                    label: "Plans",
                    description: "Pro, Max and Custom as offered in the configurator and the upgrade dialog.",
                    fields: [
                        {
                            name: "plan",
                            label: "Plan",
                            type: "group",
                            fields: [
                                localizedText("title", "Choose the plan that best matches your requirements.", "Wähle den Plan, der am besten zu deinen Anforderungen passt."),
                                sectionDescriptionField,
                                { ...colorField, label: "Selected color", defaultValue: "lime", admin: { description: "Highlight color of the selected option in this step." } },
                                localizedText("aiTokensLabel", "AI Tokens", "AI Tokens", { label: "AI tokens label", description: "Name of the AI token quantity in the plan options." }),
                                localizedText("workflowExecutionsLabel", "Workflow Executions", "Workflow-Ausführungen", {
                                    label: "Workflow executions label",
                                    description: "Name of the workflow execution quantity in the plan options.",
                                }),
                                localizedText("moreWorkflowsLabel", "more workflows", "mehr Workflows", {
                                    label: "More workflows label",
                                    description: "Shown below how many times the workflow executions of Pro a plan includes, for example 12.5× more workflows.",
                                }),
                                {
                                    name: "pro",
                                    label: "Pro",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Pro", "Pro"),
                                        localizedText("description", "A ready-to-use plan for individuals and smaller teams.", "Ein sofort nutzbarer Plan für Einzelpersonen und kleinere Teams.", {
                                            type: "textarea",
                                        }),
                                        planFeaturesField([
                                            { en: "Essential workflow automation", de: "Grundlegende Workflow-Automatisierung" },
                                            { en: "AI-assisted workflows", de: "KI-unterstützte Workflows" },
                                            { en: "Cloud or self-hosted deployment", de: "Cloud- oder Self-hosted-Bereitstellung" },
                                        ]),
                                        { ...colorField, defaultValue: "lime" },
                                        optionImageField(),
                                    ],
                                },
                                {
                                    name: "max",
                                    label: "Max",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Max", "Max"),
                                        localizedText(
                                            "description",
                                            "A ready-to-use plan for organizations with higher requirements.",
                                            "Ein sofort nutzbarer Plan für Organisationen mit höheren Anforderungen.",
                                            {
                                                type: "textarea",
                                            }
                                        ),
                                        planFeaturesField([
                                            { en: "Everything included in Pro", de: "Alle Funktionen aus Pro" },
                                            { en: "Advanced automation capabilities", de: "Erweiterte Automatisierungsfunktionen" },
                                            { en: "Designed for higher workflow demand", de: "Für einen höheren Workflow-Bedarf ausgelegt" },
                                        ]),
                                        localizedText("comparisonText", "{multiplier} more than Pro", "{multiplier} mehr als Pro", {
                                            label: "Comparison text",
                                            description: "Compares a quantity of the selected Max plan with Pro. Use {multiplier} to insert how many times the Pro quantity it is, for example 8×.",
                                        }),
                                        localizedText("priceDifferenceText", "only {amount} more than Pro", "nur {amount} mehr als Pro", {
                                            label: "Price difference text",
                                            description: "Shown below the price of the selected Max plan. Use {amount} to insert what Max costs more than Pro in the same payment period.",
                                        }),
                                        { ...colorField, defaultValue: "magenta" },
                                        optionImageField(),
                                    ],
                                },
                                {
                                    name: "custom",
                                    label: "Custom",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Custom", "Custom"),
                                        localizedText("description", "Configure usage for an individual setup.", "Konfiguriere die Nutzung für ein individuelles Setup.", { type: "textarea" }),
                                        planFeaturesField([
                                            { en: "Configurable AI token volume", de: "Konfigurierbares KI-Token-Volumen" },
                                            { en: "Configurable workflow executions", de: "Konfigurierbare Workflow-Ausführungen" },
                                            { en: "Tailored usage configuration", de: "Individuelle Nutzungskonfiguration" },
                                        ]),
                                        localizedText("quantitiesText", "From {quantities}", "Ab {quantities}", {
                                            label: "Quantities text",
                                            description: "Shown while Custom is not selected. Use {quantities} to insert the smallest AI token and workflow execution packages.",
                                        }),
                                        localizedText("priceFallbackText", "Price depends on your configuration", "Preis hängt von deiner Konfiguration ab", {
                                            label: "Price fallback text",
                                            description: "Shown instead of a price while Custom is not selected.",
                                        }),
                                        { ...colorField, defaultValue: "yellow" },
                                        optionImageField(),
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Usage",
                    description: "Usage steps of the custom plan.",
                    fields: [
                        {
                            name: "workflowExecutions",
                            type: "group",
                            fields: [
                                localizedText("title", "How many workflow executions do you expect per month?", "Wie viele Workflow-Ausführungen erwartest du pro Monat?"),
                                sectionDescriptionField,
                                localizedText("suffix", "exec", "Ausf."),
                            ],
                        },
                        {
                            name: "aiTokens",
                            label: "AI Tokens",
                            type: "group",
                            fields: [
                                localizedText("title", "How many AI tokens do you expect to consume per month?", "Wie viele KI-Tokens erwartest du pro Monat zu verbrauchen?"),
                                sectionDescriptionField,
                                localizedText("suffix", "tokens", "Tokens"),
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}
