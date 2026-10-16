import type { GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

// Error and error-recovery copy shared across the license dashboard, kept out of the licenses global so that one
// global does not also grow every failure message for every dialog it hosts.
export const Errors: GlobalConfig = {
    slug: "errors",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        localizedText("dashboardLoad", "The license dashboard could not be loaded.", "Das Lizenz-Dashboard konnte nicht geladen werden."),
        localizedText("retry", "Try again", "Erneut versuchen"),
        localizedText("customerUpdate", "The customer could not be updated.", "Der Kunde konnte nicht aktualisiert werden."),
        localizedText("paymentMethodLoad", "The payment methods could not be loaded.", "Die Zahlungsmethoden konnten nicht geladen werden."),
        localizedText("paymentMethodUpdate", "The payment method could not be updated.", "Die Zahlungsmethode konnte nicht aktualisiert werden."),
        localizedText("paymentMethodRemove", "The payment method could not be removed.", "Die Zahlungsmethode konnte nicht entfernt werden."),
        localizedText(
            "paymentMethodInUse",
            "This payment method is still in use by the customer or one of their licenses. Assign a different one first.",
            "Diese Zahlungsmethode wird noch verwendet, entweder als Standard des Kunden oder einer seiner Lizenzen. Weise zuerst eine andere zu."
        ),
        localizedText("paymentMethodAssign", "The payment method could not be assigned to this license.", "Die Zahlungsmethode konnte dieser Lizenz nicht zugewiesen werden."),
        localizedText(
            "namespaceInUse",
            "This namespace is already linked to another subscription. Choose a different namespace.",
            "Dieser Namespace ist bereits mit einem anderen Abonnement verknüpft. Wähle einen anderen Namespace."
        ),
        localizedText("licenseUpdate", "The license could not be updated.", "Die Lizenz konnte nicht aktualisiert werden."),
        localizedText("subscriptionPreview", "The change could not be previewed.", "Die Änderung konnte nicht vorausberechnet werden."),
        localizedText("billingUpdate", "The billing period could not be updated.", "Das Abrechnungsintervall konnte nicht aktualisiert werden."),
        localizedText("subscriptionCancel", "The subscription could not be cancelled.", "Das Abonnement konnte nicht gekündigt werden."),
        localizedText("subscriptionResume", "The cancellation could not be reversed.", "Die Kündigung konnte nicht zurückgenommen werden."),
        localizedText("planUpgrade", "The plan could not be upgraded.", "Der Plan konnte nicht aktualisiert werden."),
        localizedText("paymentFallback", "An unexpected error occurred.", "Ein unerwarteter Fehler ist aufgetreten."),
        localizedText(
            "sessionUnavailable",
            "Your checkout session could not be authenticated. Please try again.",
            "Deine Checkout-Sitzung konnte nicht authentifiziert werden. Bitte versuche es erneut."
        ),
        localizedText("customerCreation", "Your billing customer could not be prepared. Please try again.", "Dein Rechnungskunde konnte nicht vorbereitet werden. Bitte versuche es erneut."),
        localizedText(
            "customerTypeMismatch",
            "Your existing customer type does not match this checkout configuration.",
            "Dein bestehender Kundentyp stimmt nicht mit dieser Checkout-Konfiguration überein."
        ),
        localizedText("checkoutCustomer", "The selected billing customer cannot be used for this checkout.", "Der ausgewählte Rechnungskunde kann für diesen Checkout nicht verwendet werden."),
        localizedText("checkoutSession", "The checkout session could not be created. Please try again.", "Die Checkout-Sitzung konnte nicht erstellt werden. Bitte versuche es erneut."),
        localizedText("checkoutSessionExpired", "The checkout session expired. A new session is being created.", "Die Checkout-Sitzung ist abgelaufen. Eine neue Sitzung wird erstellt."),
        localizedText(
            "billingAddressUpdate",
            "The billing address could not be saved. Please check your details.",
            "Die Rechnungsadresse konnte nicht gespeichert werden. Bitte überprüfe deine Angaben."
        ),
        localizedText("emailUpdate", "The email address could not be saved. Please check your details.", "Die E-Mail-Adresse konnte nicht gespeichert werden. Bitte überprüfe deine Angaben."),
        localizedText(
            "paymentConfirmation",
            "The payment could not be confirmed. Please check your payment details.",
            "Die Zahlung konnte nicht bestätigt werden. Bitte überprüfe deine Zahlungsangaben."
        ),
        localizedText("discountSessionRequired", "A checkout session is required to validate a discount.", "Eine Checkout-Sitzung ist erforderlich, um einen Rabatt zu validieren."),
        localizedText("discountValidation", "The discount code could not be validated.", "Der Rabattcode konnte nicht validiert werden."),
        localizedText("checkoutLicenseStatus", "We could not check whether your license is ready.", "Wir konnten nicht prüfen, ob deine Lizenz bereit ist."),
    ],
}
