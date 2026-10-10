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
            name: "licenseDescription",
            type: "textarea",
            required: true,
            localized: true,
            defaultValue: localizedDefault("View the license configuration and current access status.", "Sieh dir die Lizenzkonfiguration und den aktuellen Zugriffsstatus an."),
        },
        {
            name: "emptyLicenses",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("No licenses yet", "Noch keine Lizenzen"),
        },
        {
            name: "sidebar",
            type: "group",
            fields: [
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
                { name: "backToCustomerLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Back to customer", "Zurück zum Kunden") },
                { name: "homeLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Home", "Startseite") },
                { name: "applicationSettingsLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Application settings", "Anwendungseinstellungen") },
                { name: "userSettingsLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("User settings", "Benutzereinstellungen") },
                { name: "userMenuLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("User menu", "Benutzermenü") },
                { name: "profileLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Profile", "Profil") },
                { name: "settingsLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Settings", "Einstellungen") },
                { name: "workspacesLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Workspaces", "Workspaces") },
            ],
        },
        {
            name: "dashboard",
            type: "group",
            fields: [
                {
                    name: "emptyCustomers",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("No customers yet", "Noch keine Kunden"),
                },
                {
                    name: "customerLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Customer", "Kunde"),
                },
                {
                    name: "nameLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Name", "Name"),
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
                { name: "editionLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Edition", "Edition") },
                { name: "nextBillingDateLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Next billing date", "Nächste Abrechnung") },
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
                        { name: "pending", type: "text", required: true, localized: true, defaultValue: localizedDefault("Pending", "Ausstehend") },
                        { name: "incomplete", type: "text", required: true, localized: true, defaultValue: localizedDefault("Incomplete", "Unvollst?ndig") },
                        { name: "paused", type: "text", required: true, localized: true, defaultValue: localizedDefault("Paused", "Pausiert") },
                        { name: "trialing", type: "text", required: true, localized: true, defaultValue: localizedDefault("Trial", "Testphase") },
                        { name: "unpaid", type: "text", required: true, localized: true, defaultValue: localizedDefault("Unpaid", "Unbezahlt") },
                        { name: "pastDue", type: "text", required: true, localized: true, defaultValue: localizedDefault("Past due", "Überfällig") },
                        { name: "canceled", type: "text", required: true, localized: true, defaultValue: localizedDefault("Canceled", "Gekündigt") },
                        { name: "incompleteExpired", type: "text", required: true, localized: true, defaultValue: localizedDefault("Incomplete expired", "Unvollständig abgelaufen") },
                    ],
                },
                {
                    name: "invoiceStatuses",
                    type: "group",
                    fields: [
                        { name: "paid", type: "text", required: true, localized: true, defaultValue: localizedDefault("Paid", "Bezahlt") },
                        { name: "draft", type: "text", required: true, localized: true, defaultValue: localizedDefault("Draft", "Entwurf") },
                        { name: "open", type: "text", required: true, localized: true, defaultValue: localizedDefault("Open", "Offen") },
                        { name: "uncollectible", type: "text", required: true, localized: true, defaultValue: localizedDefault("Uncollectible", "Uneinbringlich") },
                        { name: "void", type: "text", required: true, localized: true, defaultValue: localizedDefault("Void", "Storniert") },
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
                {
                    name: "editions",
                    type: "group",
                    fields: [
                        { name: "cloud", type: "text", required: true, localized: true, defaultValue: localizedDefault("Cloud Edition", "Cloud Edition") },
                        { name: "selfHosted", type: "text", required: true, localized: true, defaultValue: localizedDefault("Enterprise Edition", "Enterprise Edition") },
                    ],
                },
                { name: "unknown", type: "text", required: true, localized: true, defaultValue: localizedDefault("Unknown", "Unbekannt") },
            ],
        },
        {
            name: "invoices",
            type: "group",
            fields: [
                { name: "title", type: "text", required: true, localized: true, defaultValue: localizedDefault("Invoices", "Rechnungen") },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("View and download invoices issued for this license.", "Sieh dir die für diese Lizenz ausgestellten Rechnungen an und lade sie herunter."),
                },
                { name: "empty", type: "text", required: true, localized: true, defaultValue: localizedDefault("No invoices yet", "Noch keine Rechnungen") },
                { name: "lineItemsLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Line items", "Rechnungspositionen") },
                { name: "quantityLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Quantity", "Menge") },
                { name: "netLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Net", "Netto") },
                { name: "taxLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Tax", "Steuer") },
                { name: "numberLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Invoice", "Rechnung") },
                { name: "billingDateLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Billing date", "Rechnungsdatum") },
                { name: "amountLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Total", "Gesamt") },
                { name: "statusLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Payment status", "Zahlungsstatus") },
                { name: "downloadLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Download", "Herunterladen") },
                { name: "viewLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("View", "Ansehen") },
                { name: "unavailableLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Not available", "Nicht verfügbar") },
            ],
        },
        {
            name: "pagination",
            type: "group",
            fields: [
                { name: "loadMoreLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Load more", "Mehr laden") },
                { name: "loadingLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Loading…", "Wird geladen …") },
                { name: "previousPageLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Previous page", "Vorherige Seite") },
                { name: "nextPageLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Next page", "Nächste Seite") },
            ],
        },
        {
            name: "withdrawal",
            type: "group",
            admin: {
                description: "Notice shown on the license detail page while the customer's statutory 14-day right of withdrawal is still running. Only shown for personal (B2C) customers.",
            },
            fields: [
                {
                    name: "text",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("You can withdraw from this purchase free of charge until {date}.", "Du kannst diesen Kauf bis zum {date} kostenlos widerrufen."),
                    admin: { description: "Use {date} as a placeholder for the withdrawal deadline." },
                },
            ],
        },
    ],
}
