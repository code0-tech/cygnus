import type { GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

// Split from the Licenses global: Payload reads all localized fields of a global through one json_build_array call,
// and Postgres caps function calls at 100 arguments. getLicenseContent merges both globals back into LicenseContent.
export const LicenseDialogs: GlobalConfig = {
    slug: "license-dialogs",
    label: "License Dialogs",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "editor",
            type: "group",
            fields: [
                localizedText("customerTitle", "Edit customer", "Kunden bearbeiten"),
                localizedText("customerDescription", "Update the customer's contact and default billing details.", "Aktualisiere die Kontakt- und Standard-Rechnungsdaten des Kunden.", {
                    type: "textarea",
                }),
                localizedText("contactHeading", "Contact information", "Kontaktinformationen"),
                localizedText("paymentMethodHeading", "Default payment method", "Standard-Zahlungsmethode"),
                localizedText(
                    "paymentMethodDescription",
                    "Manage the payment method used for future invoices securely through Stripe.",
                    "Verwalte die Zahlungsmethode für zukünftige Rechnungen sicher über Stripe.",
                    { type: "textarea" }
                ),
                localizedText("loadingPaymentMethodLabel", "Loading payment form…", "Zahlungsformular wird geladen …"),
                localizedText("savePaymentMethodLabel", "Save payment method", "Zahlungsmethode speichern"),
                localizedText("savingPaymentMethodLabel", "Saving payment method…", "Zahlungsmethode wird gespeichert …"),
                localizedText("paymentMethodSuccess", "Payment method added successfully.", "Zahlungsmethode erfolgreich hinzugefügt."),
                localizedText("noPaymentMethodsLabel", "No payment methods yet", "Noch keine Zahlungsmethoden"),
                localizedText("addPaymentMethodLabel", "Add new payment method", "Neue Zahlungsmethode hinzufügen"),
                localizedText("removePaymentMethodLabel", "Remove", "Entfernen"),
                localizedText("removingPaymentMethodLabel", "Removing…", "Wird entfernt …"),
                localizedText("otherPaymentMethodsHeading", "Other payment methods", "Weitere Zahlungsmethoden"),
                localizedText("usePaymentMethodLabel", "Use this", "Diese verwenden"),
                localizedText("settingPaymentMethodLabel", "Assigning…", "Wird zugewiesen …"),
                localizedText("licenseTitle", "Edit license", "Lizenz bearbeiten"),
                localizedText("licenseEditDescription", "Manage the license, payment method, and billing period.", "Verwalte die Lizenz, Zahlungsmethode und den Abrechnungszeitraum.", {
                    type: "textarea",
                }),
                localizedText("licenseDescription", "Link this cloud license to a namespace.", "Verknüpfe diese Cloud-Lizenz mit einem Namespace.", { type: "textarea" }),
                localizedText("changeNamespaceLabel", "Change namespace", "Namespace ändern"),
                localizedText("saveLabel", "Save", "Speichern"),
                localizedText("closeLabel", "Close", "Schließen"),
                localizedText("generalTabLabel", "General", "Allgemein"),
                localizedText("paymentMethodsTabLabel", "Payment methods", "Zahlungsmethoden"),
                localizedText("paymentMethodTabLabel", "Payment method", "Zahlungsmethode"),
                localizedText("namespaceHeading", "Namespace", "Namespace"),
                localizedText("cancellationHeading", "Cancellation", "Kündigung"),
                {
                    name: "fieldDescriptions",
                    type: "group",
                    admin: { description: "Descriptions shown below the inputs of the customer edit dialog." },
                    fields: [
                        localizedText("name", "Name of the person or company invoices are addressed to.", "Name der Person oder Firma, an die Rechnungen adressiert werden."),
                        localizedText("email", "Invoice emails are sent to this address.", "Rechnungs-E-Mails werden an diese Adresse gesendet."),
                        localizedText("phone", "Optional phone number for billing questions.", "Optionale Telefonnummer für Rückfragen zur Abrechnung."),
                        localizedText("line1", "Street and house number.", "Straße und Hausnummer."),
                        localizedText("line2", "Additional address details such as floor, suite or c/o.", "Adresszusatz wie Etage, Wohnung oder c/o."),
                        localizedText("postalCode", "Postal code of the billing address.", "Postleitzahl der Rechnungsadresse."),
                        localizedText("city", "City of the billing address.", "Ort der Rechnungsadresse."),
                        localizedText("state", "State, province or region, if applicable.", "Bundesland, Provinz oder Region, falls zutreffend."),
                        localizedText("country", "Two-letter ISO country code, e.g. DE.", "Zweistelliger ISO-Ländercode, z. B. DE."),
                    ],
                },
            ],
        },
        {
            name: "subscriptionPreview",
            label: "Subscription Change Preview",
            type: "group",
            admin: { description: "Shared between the billing and upgrade dialogs, both of which preview a change through subscriptionsPreviewUpdate before applying it." },
            fields: [
                localizedText("totalLabel", "New total", "Neuer Gesamtbetrag"),
                localizedText("pendingChangeText", "Switch to {selection} on {date}.", "Wechsel auf {selection} am {date}.", { description: "Use {selection} and {date} as placeholders." }),
                localizedText("prorationLabel", "Charged today", "Heute berechnet"),
                localizedText("immediateNote", "This change applies immediately.", "Diese Änderung wird sofort wirksam."),
                localizedText("scheduledNote", "This change applies at the end of your current billing period.", "Diese Änderung wird am Ende der aktuellen Abrechnungsperiode wirksam."),
                localizedText("loadingLabel", "Calculating…", "Wird berechnet …"),
            ],
        },
        {
            name: "billing",
            type: "group",
            fields: [
                localizedText("title", "Change Period", "Zahlungsperiode ändern"),
                localizedText("description", "Review your subscription and change how often you're billed.", "Sieh dir dein Abonnement an und ändere, wie oft du abgerechnet wirst.", {
                    type: "textarea",
                }),
                localizedText("periodLabel", "Billing period", "Abrechnungsintervall"),
                localizedText("currentPeriodEndLabel", "Current period ends", "Aktuelle Periode endet"),
                localizedText("changePeriodLabel", "Change period", "Zeitraum ändern"),
            ],
        },
        {
            name: "cancel",
            type: "group",
            fields: [
                localizedText(
                    "description",
                    "Cancellation takes effect at the end of the current billing period. Existing licenses remain valid for the periods already paid for.",
                    "Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam. Bereits bezahlte Lizenzzeiträume bleiben gültig.",
                    { type: "textarea" }
                ),
                localizedText("confirmLabel", "Cancel at period end", "Zum Periodenende kündigen"),
                localizedText("immediateConfirmLabel", "Cancel immediately", "Sofort kündigen"),
                localizedText(
                    "immediateDescription",
                    "You can also cancel immediately until the date below. Existing paid license periods remain valid.",
                    "Bis zum unten stehenden Datum kannst du auch sofort kündigen. Bereits bezahlte Lizenzzeiträume bleiben gültig.",
                    { type: "textarea" }
                ),
                localizedText("immediateUntilLabel", "Immediate cancellation available until", "Sofortkündigung möglich bis"),
                localizedText("pendingHeading", "Your subscription is set to cancel", "Dein Abonnement wird gekündigt"),
                localizedText(
                    "pendingDescription",
                    "The subscription ends on the date below. Existing licenses remain valid for the periods already paid for.",
                    "Das Abonnement endet zum unten stehenden Datum. Bereits bezahlte Lizenzzeiträume bleiben gültig.",
                    { type: "textarea" }
                ),
                localizedText("cancelAtLabel", "Subscription ends", "Abonnement endet"),
                localizedText("resumeLabel", "Keep my subscription", "Abonnement behalten"),
            ],
        },
        {
            name: "upgrade",
            type: "group",
            fields: [
                localizedText("title", "Upgrade plan", "Plan upgraden"),
                localizedText("description", "Move to a higher plan or increase your custom usage.", "Wechsle auf einen höheren Plan oder erhöhe deine individuelle Nutzung.", { type: "textarea" }),
                localizedText("planHeading", "Plan", "Plan"),
                localizedText("previewHeading", "Preview", "Vorschau"),
                localizedText("submitLabel", "Upgrade now", "Jetzt upgraden"),
            ],
        },
    ],
}
