import { iconField as payloadIconField } from "@mvriu5/payload-icon-picker"
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
                        {
                            name: "startingPrice",
                            label: "Starting Price",
                            type: "group",
                            admin: {
                                description: "Cheapest monthly price shown on the customer type, plan and deployment options, for example: from €8.95/mo.",
                            },
                            fields: [localizedText("label", "from", "ab"), localizedText("suffix", "/mo", "/Monat")],
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
                                        { ...colorField, defaultValue: "yellow" },
                                        optionImageField(),
                                    ],
                                },
                                {
                                    name: "cloud",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "Cloud", "Cloud"),
                                        localizedText("description", "Use managed infrastructure with selectable runtime consumption.", "Nutze verwaltete Infrastruktur mit wählbarem Laufzeitverbrauch.", {
                                            type: "textarea",
                                        }),
                                        { ...colorField, defaultValue: "aqua" },
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
                                {
                                    name: "b2b",
                                    type: "group",
                                    fields: [
                                        localizedText("title", "B2B", "B2B"),
                                        localizedText("description", "Organization purchase flow with tailored commercial handling.", "Kaufprozess für Organisationen mit individueller kaufmännischer Abwicklung.", {
                                            type: "textarea",
                                        }),
                                        { ...colorField, defaultValue: "blue" },
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
                                        { ...colorField, defaultValue: "pink" },
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
                                    description: "Text before the monthly savings amount in payment period badges, for example Save €2.50.",
                                }),
                                localizedText("quarterlyText", "Quarterly", "Vierteljährlich"),
                                localizedText("yearlyText", "Yearly", "Jährlich"),
                                localizedText("monthlyPeriodSuffix", "per month", "pro Monat"),
                                localizedText("quarterlyPeriodSuffix", "per quarter", "pro Quartal"),
                                localizedText("yearlyPeriodSuffix", "per year", "pro Jahr"),
                                { ...colorField, name: "monthlyColor", defaultValue: "brand" },
                                { ...colorField, name: "quarterlyColor", defaultValue: "aqua" },
                                { ...colorField, name: "yearlyColor", defaultValue: "magenta" },
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
                                        localizedText("description", "A ready-to-use plan for organizations with higher requirements.", "Ein sofort nutzbarer Plan für Organisationen mit höheren Anforderungen.", {
                                            type: "textarea",
                                        }),
                                        planFeaturesField([
                                            { en: "Everything included in Pro", de: "Alle Funktionen aus Pro" },
                                            { en: "Advanced automation capabilities", de: "Erweiterte Automatisierungsfunktionen" },
                                            { en: "Designed for higher workflow demand", de: "Für einen höheren Workflow-Bedarf ausgelegt" },
                                        ]),
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
                {
                    label: "Workflow calculator",
                    description: "Dialog that estimates monthly workflow executions from business types.",
                    fields: [
                        {
                            name: "workflowCalculator",
                            label: "Workflow Calculator",
                            type: "group",
                            fields: [
                                localizedText("triggerLabel", "Calculate", "Berechnen"),
                                localizedText("title", "Calculate workflow executions", "Workflow-Ausführungen berechnen"),
                                localizedText(
                                    "description",
                                    "Estimate monthly volume from your active workflows and their average execution frequency.",
                                    "Schätze das monatliche Volumen anhand deiner aktiven Workflows und ihrer durchschnittlichen Ausführungshäufigkeit.",
                                    { type: "textarea" }
                                ),
                                localizedText("closeLabel", "Close dialog", "Dialog schließen"),
                                localizedText("businessTypeLabel", "Business type", "Geschäftsbereich"),
                                localizedText("businessTypeSearchPlaceholder", "Search business types", "Geschäftsbereiche durchsuchen"),
                                localizedText("noBusinessTypesFoundLabel", "No business types found.", "Keine Geschäftsbereiche gefunden."),
                                localizedText("activeWorkflowsLabel", "Active workflows", "Aktive Workflows"),
                                localizedText("runsPerDayLabel", "Runs per month", "Ausführungen pro Monat"),
                                localizedText("daysPerMonthLabel", "Days per month", "Tage pro Monat"),
                                localizedText("estimateLabel", "Estimated monthly volume", "Geschätztes monatliches Volumen"),
                                localizedText("cancelLabel", "Cancel", "Abbrechen"),
                                localizedText("applyLabel", "Apply value", "Wert übernehmen"),
                                {
                                    name: "types",
                                    label: "Business Types",
                                    type: "array",
                                    required: true,
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
                                        localizedText("name", "General", "Allgemein"),
                                        localizedText("conversion_unit", "executions", "Ausführungen", { label: "Conversion Unit" }),
                                        { ...iconField, defaultValue: "building" },
                                        {
                                            name: "conversion_rate",
                                            label: "Conversion Rate",
                                            type: "number",
                                            required: true,
                                            defaultValue: 1,
                                            min: 0,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
}
