import type { GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

export const Licenses: GlobalConfig = {
    slug: "licenses",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "General",
                    fields: [
                        localizedText("licenses", "Licenses", "Lizenzen"),
                        localizedText("license", "License", "Lizenz"),
                        localizedText("licenseDescription", "View the license configuration and current access status.", "Sieh dir die Lizenzkonfiguration und den aktuellen Zugriffsstatus an.", { type: "textarea" }),
                        localizedText("emptyLicenses", "No licenses yet", "Noch keine Lizenzen"),
                    ],
                },
                {
                    label: "Navigation",
                    fields: [
                        {
                            name: "sidebar",
                            type: "group",
                            fields: [
                localizedText("logout", "Log out", "Abmelden"),
                localizedText("loggingOut", "Logging out…", "Wird abgemeldet …"),
                localizedText("backToCustomerLabel", "Back to customer", "Zurück zum Kunden"),
                localizedText("backToCustomersLabel", "All customers", "Alle Kunden"),
                localizedText("downloadLicenseLabel", "Download license", "Lizenz herunterladen"),
                localizedText("homeLabel", "Home", "Startseite"),
                localizedText("applicationSettingsLabel", "Application settings", "Anwendungseinstellungen"),
                localizedText("userMenuLabel", "User menu", "Benutzermenü"),
                localizedText("profileLabel", "Profile", "Profil"),
                localizedText("settingsLabel", "Settings", "Einstellungen"),
                localizedText("workspacesLabel", "Workspaces", "Workspaces"),
                            ],
                        },
                    ],
                },
                {
                    label: "Dashboard",
                    fields: [
                        {
                            name: "dashboard",
                            type: "group",
                            fields: [
                localizedText("customersLabel", "Customers", "Kunden"),
                localizedText("customersDescription", "Select a customer to see its licenses.", "Wähle einen Kunden, um seine Lizenzen zu sehen.", { type: "textarea" }),
                localizedText("emptyCustomers", "No customers yet", "Noch keine Kunden"),
                localizedText("recentLicensesLabel", "Recently edited licenses", "Zuletzt bearbeitete Lizenzen"),
                localizedText("recentLicensesDescription", "The five licenses changed most recently across all customers.", "Die fünf zuletzt geänderten Lizenzen aller Kunden.", { type: "textarea" }),
                localizedText("typeLabel", "Type", "Typ"),
                localizedText("customerLabel", "Customer", "Kunde"),
                localizedText("nameLabel", "Name", "Name"),
                localizedText("emailLabel", "Email", "E-Mail"),
                localizedText("lastEditedLabel", "Last edited", "Zuletzt bearbeitet"),
                localizedText("statusLabel", "Status", "Status"),
                localizedText("paymentPeriodLabel", "Payment period", "Zahlungsintervall"),
                localizedText("workflowExecutionsLabel", "Workflow executions", "Workflow-Ausführungen"),
                localizedText("aiTokensLabel", "AI tokens", "KI-Tokens"),
                localizedText("editionLabel", "Edition", "Edition"),
                localizedText("nextBillingDateLabel", "Next billing date", "Nächste Abrechnung"),
                            ],
                        },
                    ],
                },
                {
                    label: "Values",
                    fields: [
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
                    ],
                },
                {
                    label: "Invoices and withdrawal",
                    fields: [
                        {
                            name: "invoices",
                            type: "group",
                            fields: [
                localizedText("title", "Invoices", "Rechnungen"),
                localizedText(
                    "description",
                    "View and download every invoice issued for this license, or open any of them as a PDF.",
                    "Sieh dir alle für diese Lizenz ausgestellten Rechnungen an und lade jede davon als PDF herunter.",
                    {
                        type: "textarea",
                    }
                ),
                localizedText("empty", "No invoices yet", "Noch keine Rechnungen"),
                localizedText("taxLabel", "Tax", "Steuer"),
                localizedText("numberLabel", "Invoice", "Rechnung"),
                localizedText("numberPendingLabel", "Not yet available", "Noch nicht verfügbar"),
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
                },
            ],
        },
    ],
}
