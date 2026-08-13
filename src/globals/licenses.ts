import type { DefaultValue, GlobalConfig } from "payload"

const localizedDefault =
    (en: string, de: string): DefaultValue =>
    ({ locale }) =>
        locale === "de" ? de : en

export const Licenses: GlobalConfig = {
    slug: "licenses",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "licenses",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("Licenses", "Lizenzen"),
        },
        {
            name: "license",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("License", "Lizenz"),
        },
        {
            name: "emptyLicenses",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("No licenses yet", "Noch keine Lizenzen"),
        },
        {
            name: "redirectUrl",
            type: "text",
            required: true,
            defaultValue: "http://localhost:3001",
            validate: (value: unknown) => {
                if (typeof value !== "string") return "Enter a valid HTTP(S) URL."

                try {
                    const url = new URL(value)
                    return url.protocol === "http:" || url.protocol === "https:" ? true : "Enter a valid HTTP(S) URL."
                } catch {
                    return "Enter a valid HTTP(S) URL."
                }
            },
            admin: {
                description: "Sculptor URL used when no valid Crater session token was supplied.",
            },
        },
        {
            name: "sidebar",
            type: "group",
            fields: [
                {
                    name: "dashboard",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Dashboard", "Dashboard"),
                },
                {
                    name: "logout",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Log out", "Abmelden"),
                },
                {
                    name: "loggingOut",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Logging out…", "Wird abgemeldet …"),
                },
            ],
        },
        {
            name: "dashboard",
            type: "group",
            fields: [
                {
                    name: "customers",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Customers", "Kunden"),
                },
                {
                    name: "emptyCustomers",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("No customers yet", "Noch keine Kunden"),
                },
                {
                    name: "recentLicenses",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Last edited licenses", "Zuletzt bearbeitete Lizenzen"),
                },
                {
                    name: "customerLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Customer", "Kunde"),
                },
                {
                    name: "typeLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Type", "Typ"),
                },
                {
                    name: "emailLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Email", "E-Mail"),
                },
                {
                    name: "lastEditedLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Last edited", "Zuletzt bearbeitet"),
                },
                {
                    name: "editLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Edit", "Bearbeiten"),
                },
                {
                    name: "statusLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Status", "Status"),
                },
                {
                    name: "deploymentLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Deployment", "Bereitstellung"),
                },
                {
                    name: "paymentPeriodLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Payment period", "Zahlungsintervall"),
                },
                {
                    name: "workflowExecutionsLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Workflow executions", "Workflow-Ausführungen"),
                },
                {
                    name: "aiTokensLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("AI tokens", "KI-Tokens"),
                },
            ],
        },
        {
            name: "values",
            type: "group",
            fields: [
                {
                    name: "customerTypes",
                    type: "group",
                    fields: [
                        { name: "personal", type: "text", required: true, localized: true, defaultValue: localizedDefault("Personal", "Privat") },
                        { name: "business", type: "text", required: true, localized: true, defaultValue: localizedDefault("Business", "Geschäftlich") },
                    ],
                },
                {
                    name: "deploymentTypes",
                    type: "group",
                    fields: [
                        { name: "cloud", type: "text", required: true, localized: true, defaultValue: localizedDefault("Cloud", "Cloud") },
                        { name: "selfHosted", type: "text", required: true, localized: true, defaultValue: localizedDefault("Self-hosted", "Self-hosted") },
                    ],
                },
                {
                    name: "paymentPeriods",
                    type: "group",
                    fields: [
                        { name: "weekly", type: "text", required: true, localized: true, defaultValue: localizedDefault("Weekly", "Wöchentlich") },
                        { name: "monthly", type: "text", required: true, localized: true, defaultValue: localizedDefault("Monthly", "Monatlich") },
                        { name: "quarterly", type: "text", required: true, localized: true, defaultValue: localizedDefault("Quarterly", "Vierteljährlich") },
                        { name: "yearly", type: "text", required: true, localized: true, defaultValue: localizedDefault("Yearly", "Jährlich") },
                    ],
                },
                {
                    name: "statuses",
                    type: "group",
                    fields: [
                        { name: "active", type: "text", required: true, localized: true, defaultValue: localizedDefault("Active", "Aktiv") },
                        { name: "paid", type: "text", required: true, localized: true, defaultValue: localizedDefault("Paid", "Bezahlt") },
                        { name: "paymentFailed", type: "text", required: true, localized: true, defaultValue: localizedDefault("Payment failed", "Zahlung fehlgeschlagen") },
                        { name: "canceled", type: "text", required: true, localized: true, defaultValue: localizedDefault("Canceled", "Gekündigt") },
                        { name: "expired", type: "text", required: true, localized: true, defaultValue: localizedDefault("Expired", "Abgelaufen") },
                    ],
                },
                {
                    name: "plans",
                    type: "group",
                    fields: [
                        { name: "pro", type: "text", required: true, localized: true, defaultValue: localizedDefault("Pro", "Pro") },
                        { name: "max", type: "text", required: true, localized: true, defaultValue: localizedDefault("Max", "Max") },
                        { name: "custom", type: "text", required: true, localized: true, defaultValue: localizedDefault("Custom", "Individuell") },
                    ],
                },
                { name: "unknown", type: "text", required: true, localized: true, defaultValue: localizedDefault("Unknown", "Unbekannt") },
            ],
        },
        {
            name: "errors",
            type: "group",
            fields: [
                {
                    name: "dashboardLoad",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The license dashboard could not be loaded.", "Das Lizenz-Dashboard konnte nicht geladen werden."),
                },
                { name: "retry", type: "text", required: true, localized: true, defaultValue: localizedDefault("Try again", "Erneut versuchen") },
            ],
        },
        {
            name: "editor",
            type: "group",
            fields: [
                { name: "customerTitle", type: "text", required: true, localized: true, defaultValue: localizedDefault("Edit customer", "Kunden bearbeiten") },
                {
                    name: "customerDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Update the customer's contact details.", "Aktualisiere die Kontaktdaten des Kunden."),
                },
                { name: "licenseTitle", type: "text", required: true, localized: true, defaultValue: localizedDefault("Edit license", "Lizenz bearbeiten") },
                {
                    name: "licenseDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Link this cloud license to a namespace.", "Verknüpfe diese Cloud-Lizenz mit einem Namespace."),
                },
                { name: "nameLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Name", "Name") },
                { name: "namespaceLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Namespace ID", "Namespace-ID") },
                { name: "saveLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Save", "Speichern") },
                { name: "cancelLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Cancel", "Abbrechen") },
                { name: "closeLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Close", "Schließen") },
                {
                    name: "customerError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The customer could not be updated.", "Der Kunde konnte nicht aktualisiert werden."),
                },
                {
                    name: "licenseError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The license could not be updated.", "Die Lizenz konnte nicht aktualisiert werden."),
                },
                {
                    name: "selfHostedDescription",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault(
                        "Self-hosted licenses have no editable namespace.",
                        "Self-hosted-Lizenzen besitzen keinen bearbeitbaren Namespace."
                    ),
                },
            ],
        },
    ],
}
