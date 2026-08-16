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
                {
                    name: "refresh",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Refresh licenses", "Lizenzen aktualisieren"),
                },
                {
                    name: "refreshing",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Refreshing licenses…", "Lizenzen werden aktualisiert …"),
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
                    name: "invoiceStatuses",
                    type: "group",
                    fields: [
                        { name: "draft", type: "text", required: true, localized: true, defaultValue: localizedDefault("Draft", "Entwurf") },
                        { name: "open", type: "text", required: true, localized: true, defaultValue: localizedDefault("Open", "Offen") },
                        { name: "paid", type: "text", required: true, localized: true, defaultValue: localizedDefault("Paid", "Bezahlt") },
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
                { name: "unknown", type: "text", required: true, localized: true, defaultValue: localizedDefault("Unknown", "Unbekannt") },
            ],
        },
        {
            name: "invoices",
            type: "group",
            fields: [
                { name: "title", type: "text", required: true, localized: true, defaultValue: localizedDefault("Invoices", "Rechnungen") },
                { name: "empty", type: "text", required: true, localized: true, defaultValue: localizedDefault("No invoices yet", "Noch keine Rechnungen") },
                { name: "numberLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Invoice", "Rechnung") },
                { name: "periodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Billing period", "Abrechnungszeitraum") },
                { name: "amountLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Total", "Gesamt") },
                { name: "statusLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Payment status", "Zahlungsstatus") },
                { name: "downloadLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Download", "Herunterladen") },
                { name: "unavailableLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Not available", "Nicht verfügbar") },
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
            name: "pagination",
            type: "group",
            fields: [
                { name: "loadMoreLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Load more", "Mehr laden") },
                { name: "loadingLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Loading…", "Wird geladen …") },
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
                    defaultValue: localizedDefault("Update the customer's contact and default billing details.", "Aktualisiere die Kontakt- und Standard-Rechnungsdaten des Kunden."),
                },
                { name: "contactHeading", type: "text", required: true, localized: true, defaultValue: localizedDefault("Contact information", "Kontaktinformationen") },
                { name: "billingAddressHeading", type: "text", required: true, localized: true, defaultValue: localizedDefault("Billing address", "Rechnungsadresse") },
                { name: "paymentMethodHeading", type: "text", required: true, localized: true, defaultValue: localizedDefault("Default payment method", "Standard-Zahlungsmethode") },
                {
                    name: "paymentMethodDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault(
                        "Manage the payment method used for future invoices securely through Stripe.",
                        "Verwalte die Zahlungsmethode für zukünftige Rechnungen sicher über Stripe."
                    ),
                },
                { name: "changePaymentMethodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Change payment method", "Zahlungsmethode ändern") },
                { name: "loadingPaymentMethodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Loading payment form…", "Zahlungsformular wird geladen …") },
                { name: "savePaymentMethodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Save payment method", "Zahlungsmethode speichern") },
                { name: "savingPaymentMethodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Saving payment method…", "Zahlungsmethode wird gespeichert …") },
                {
                    name: "paymentMethodSuccess",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault(
                        "The payment method is now the default for future invoices.",
                        "Die Zahlungsmethode ist jetzt der Standard für zukünftige Rechnungen."
                    ),
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
                { name: "phoneLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Phone", "Telefon") },
                { name: "addressLine1Label", type: "text", required: true, localized: true, defaultValue: localizedDefault("Address line 1", "Adresszeile 1") },
                { name: "addressLine2Label", type: "text", required: true, localized: true, defaultValue: localizedDefault("Address line 2", "Adresszeile 2") },
                { name: "cityLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("City", "Stadt") },
                { name: "stateLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("State", "Bundesland") },
                { name: "postalCodeLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Postal code", "Postleitzahl") },
                { name: "countryLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Country code", "Ländercode") },
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
                    name: "paymentMethodSetupError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The payment method could not be updated.", "Die Zahlungsmethode konnte nicht aktualisiert werden."),
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
                    defaultValue: localizedDefault("Self-hosted licenses have no editable namespace.", "Self-hosted-Lizenzen besitzen keinen bearbeitbaren Namespace."),
                },
            ],
        },
        {
            name: "subscriptionPreview",
            label: "Subscription Change Preview",
            type: "group",
            admin: { description: "Shared between the billing and upgrade dialogs, both of which preview a change through subscriptionsPreviewUpdate before applying it." },
            fields: [
                { name: "totalLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("New total", "Neuer Gesamtbetrag") },
                { name: "prorationLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Charged today", "Heute berechnet") },
                {
                    name: "immediateNote",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("This change applies immediately.", "Diese Änderung wird sofort wirksam."),
                },
                {
                    name: "scheduledNote",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault(
                        "This change applies at the end of your current billing period.",
                        "Diese Änderung wird am Ende der aktuellen Abrechnungsperiode wirksam."
                    ),
                },
                { name: "loadingLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Calculating…", "Wird berechnet …") },
                { name: "error", type: "text", required: true, localized: true, defaultValue: localizedDefault("The change could not be previewed.", "Die Änderung konnte nicht vorausberechnet werden.") },
            ],
        },
        {
            name: "billing",
            type: "group",
            fields: [
                { name: "title", type: "text", required: true, localized: true, defaultValue: localizedDefault("Billing", "Abrechnung") },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Review your subscription and change how often you're billed.", "Sieh dir dein Abonnement an und ändere, wie oft du abgerechnet wirst."),
                },
                { name: "periodLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Billing period", "Abrechnungsintervall") },
                { name: "currentPeriodEndLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Current period ends", "Aktuelle Periode endet") },
                { name: "pendingChangeLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Scheduled change", "Geplante Änderung") },
                {
                    name: "updateError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The billing period could not be updated.", "Das Abrechnungsintervall konnte nicht aktualisiert werden."),
                },
            ],
        },
        {
            name: "cancel",
            type: "group",
            fields: [
                { name: "title", type: "text", required: true, localized: true, defaultValue: localizedDefault("Cancel subscription", "Abonnement kündigen") },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault(
                        "You'll keep access until the end of the period you already paid for.",
                        "Du behältst den Zugriff bis zum Ende der bereits bezahlten Periode."
                    ),
                },
                { name: "confirmLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Cancel subscription", "Abonnement kündigen") },
                { name: "pendingHeading", type: "text", required: true, localized: true, defaultValue: localizedDefault("Your subscription is set to cancel", "Dein Abonnement wird gekündigt") },
                {
                    name: "pendingDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("You'll keep access until the date below.", "Du behältst den Zugriff bis zum unten stehenden Datum."),
                },
                { name: "cancelAtLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Access ends", "Zugriff endet") },
                { name: "resumeLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("Keep my subscription", "Abonnement behalten") },
                {
                    name: "cancelError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The subscription could not be cancelled.", "Das Abonnement konnte nicht gekündigt werden."),
                },
                {
                    name: "resumeError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The cancellation could not be reversed.", "Die Kündigung konnte nicht zurückgenommen werden."),
                },
            ],
        },
        {
            name: "upgrade",
            type: "group",
            fields: [
                { name: "title", type: "text", required: true, localized: true, defaultValue: localizedDefault("Upgrade plan", "Plan upgraden") },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("Move to a higher plan or increase your custom usage.", "Wechsle auf einen höheren Plan oder erhöhe deine individuelle Nutzung."),
                },
                { name: "planLabel", type: "text", required: true, localized: true, defaultValue: localizedDefault("New plan", "Neuer Plan") },
                {
                    name: "increaseOnlyNote",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("You can only increase these amounts here.", "Diese Mengen können hier nur erhöht werden."),
                },
                {
                    name: "updateError",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: localizedDefault("The plan could not be upgraded.", "Der Plan konnte nicht aktualisiert werden."),
                },
            ],
        },
    ],
}
