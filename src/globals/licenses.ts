import type { GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

export const Licenses: GlobalConfig = {
    slug: "licenses",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        localizedText("licenses", "Licenses", "Lizenzen"),
        localizedText("license", "License", "Lizenz"),
        localizedText("licenseDescription", "View the license configuration and current access status.", "Sieh dir die Lizenzkonfiguration und den aktuellen Zugriffsstatus an.", { type: "textarea" }),
        localizedText("emptyLicenses", "No licenses yet", "Noch keine Lizenzen"),
        {
            name: "sidebar",
            type: "group",
            fields: [
                localizedText("logout", "Log out", "Abmelden"),
                localizedText("loggingOut", "Logging out…", "Wird abgemeldet …"),
                localizedText("backToCustomerLabel", "Back to customer", "Zurück zum Kunden"),
                localizedText("homeLabel", "Home", "Startseite"),
                localizedText("applicationSettingsLabel", "Application settings", "Anwendungseinstellungen"),
                localizedText("userSettingsLabel", "User settings", "Benutzereinstellungen"),
                localizedText("userMenuLabel", "User menu", "Benutzermenü"),
                localizedText("profileLabel", "Profile", "Profil"),
                localizedText("settingsLabel", "Settings", "Einstellungen"),
                localizedText("workspacesLabel", "Workspaces", "Workspaces"),
            ],
        },
        {
            name: "dashboard",
            type: "group",
            fields: [
                localizedText("emptyCustomers", "No customers yet", "Noch keine Kunden"),
                localizedText("customerLabel", "Customer", "Kunde"),
                localizedText("nameLabel", "Name", "Name"),
                localizedText("emailLabel", "Email", "E-Mail"),
                localizedText("lastEditedLabel", "Last edited", "Zuletzt bearbeitet"),
                localizedText("editLabel", "Edit", "Bearbeiten"),
                localizedText("statusLabel", "Status", "Status"),
                localizedText("paymentPeriodLabel", "Payment period", "Zahlungsintervall"),
                localizedText("workflowExecutionsLabel", "Workflow executions", "Workflow-Ausführungen"),
                localizedText("aiTokensLabel", "AI tokens", "KI-Tokens"),
                localizedText("editionLabel", "Edition", "Edition"),
                localizedText("nextBillingDateLabel", "Next billing date", "Nächste Abrechnung"),
            ],
        },
        {
            name: "values",
            type: "group",
            fields: [
                {
                    name: "customerTypes",
                    type: "group",
                    fields: [localizedText("personal", "Personal", "Privat"), localizedText("business", "Business", "Geschäftlich")],
                },
                {
                    name: "deploymentTypes",
                    type: "group",
                    fields: [localizedText("cloud", "Cloud", "Cloud"), localizedText("selfHosted", "Self-hosted", "Self-hosted")],
                },
                {
                    name: "paymentPeriods",
                    type: "group",
                    fields: [localizedText("monthly", "Monthly", "Monatlich"), localizedText("quarterly", "Quarterly", "Vierteljährlich"), localizedText("yearly", "Yearly", "Jährlich")],
                },
                {
                    name: "statuses",
                    type: "group",
                    fields: [
                        localizedText("active", "Active", "Aktiv"),
                        localizedText("pending", "Pending", "Ausstehend"),
                        localizedText("incomplete", "Incomplete", "Unvollst?ndig"),
                        localizedText("paused", "Paused", "Pausiert"),
                        localizedText("trialing", "Trial", "Testphase"),
                        localizedText("unpaid", "Unpaid", "Unbezahlt"),
                        localizedText("pastDue", "Past due", "Überfällig"),
                        localizedText("canceled", "Canceled", "Gekündigt"),
                        localizedText("incompleteExpired", "Incomplete expired", "Unvollständig abgelaufen"),
                    ],
                },
                {
                    name: "invoiceStatuses",
                    type: "group",
                    fields: [
                        localizedText("paid", "Paid", "Bezahlt"),
                        localizedText("draft", "Draft", "Entwurf"),
                        localizedText("open", "Open", "Offen"),
                        localizedText("uncollectible", "Uncollectible", "Uneinbringlich"),
                        localizedText("void", "Void", "Storniert"),
                    ],
                },
                {
                    name: "plans",
                    type: "group",
                    fields: [localizedText("pro", "Pro", "Pro"), localizedText("max", "Max", "Max"), localizedText("custom", "Custom", "Individuell")],
                },
                {
                    name: "editions",
                    type: "group",
                    fields: [localizedText("cloud", "Cloud Edition", "Cloud Edition"), localizedText("selfHosted", "Enterprise Edition", "Enterprise Edition")],
                },
                localizedText("unknown", "Unknown", "Unbekannt"),
            ],
        },
        {
            name: "invoices",
            type: "group",
            fields: [
                localizedText("title", "Invoices", "Rechnungen"),
                localizedText(
                    "description",
                    "View and download every invoice issued for this license, including earlier billing periods, and open any of them as a PDF.",
                    "Sieh dir alle für diese Lizenz ausgestellten Rechnungen an, auch die vergangener Abrechnungszeiträume, und lade jede davon als PDF herunter.",
                    {
                        type: "textarea",
                    }
                ),
                localizedText("empty", "No invoices yet", "Noch keine Rechnungen"),
                localizedText("lineItemsLabel", "Line items", "Rechnungspositionen"),
                localizedText("quantityLabel", "Quantity", "Menge"),
                localizedText("netLabel", "Net", "Netto"),
                localizedText("taxLabel", "Tax", "Steuer"),
                localizedText("numberLabel", "Invoice", "Rechnung"),
                localizedText("billingDateLabel", "Billing date", "Rechnungsdatum"),
                localizedText("amountLabel", "Total", "Gesamt"),
                localizedText("statusLabel", "Payment status", "Zahlungsstatus"),
                localizedText("downloadLabel", "Download", "Herunterladen"),
                localizedText("viewLabel", "View", "Ansehen"),
                localizedText("unavailableLabel", "Not available", "Nicht verfügbar"),
            ],
        },
        {
            name: "pagination",
            type: "group",
            fields: [
                localizedText("loadMoreLabel", "Load more", "Mehr laden"),
                localizedText("loadingLabel", "Loading…", "Wird geladen …"),
                localizedText("previousPageLabel", "Previous page", "Vorherige Seite"),
                localizedText("nextPageLabel", "Next page", "Nächste Seite"),
            ],
        },
        {
            name: "withdrawal",
            type: "group",
            admin: {
                description: "Notice shown on the license detail page while the customer's statutory 14-day right of withdrawal is still running. Only shown for personal (B2C) customers.",
            },
            fields: [
                localizedText("text", "You can withdraw from this purchase free of charge until {date}.", "Du kannst diesen Kauf bis zum {date} kostenlos widerrufen.", {
                    description: "Use {date} as a placeholder for the withdrawal deadline.",
                }),
            ],
        },
    ],
}
