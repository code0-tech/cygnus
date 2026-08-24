import type { DefaultValue, GlobalConfig } from "payload"

const localizedDefault =
    (en: string, de: string): DefaultValue =>
    ({ locale }) =>
        locale === "de" ? de : en

// Error and error-recovery copy shared across the license dashboard, kept out of the licenses global so that one
// global does not also grow every failure message for every dialog it hosts.
export const Errors: GlobalConfig = {
    slug: "errors",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "dashboardLoad",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The license dashboard could not be loaded.", "Das Lizenz-Dashboard konnte nicht geladen werden."),
        },
        { name: "retry", type: "text", required: true, localized: true, defaultValue: localizedDefault("Try again", "Erneut versuchen") },
        {
            name: "customerUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The customer could not be updated.", "Der Kunde konnte nicht aktualisiert werden."),
        },
        {
            name: "paymentMethodUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The payment method could not be updated.", "Die Zahlungsmethode konnte nicht aktualisiert werden."),
        },
        {
            name: "paymentMethodRemove",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The payment method could not be removed.", "Die Zahlungsmethode konnte nicht entfernt werden."),
        },
        {
            name: "paymentMethodInUse",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault(
                "This payment method is still in use by the customer or one of their licenses. Assign a different one first.",
                "Diese Zahlungsmethode wird noch verwendet, entweder als Standard des Kunden oder einer seiner Lizenzen. Weise zuerst eine andere zu."
            ),
        },
        {
            name: "paymentMethodAssign",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The payment method could not be assigned to this license.", "Die Zahlungsmethode konnte dieser Lizenz nicht zugewiesen werden."),
        },
        {
            name: "licenseUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The license could not be updated.", "Die Lizenz konnte nicht aktualisiert werden."),
        },
        {
            name: "subscriptionPreview",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The change could not be previewed.", "Die Änderung konnte nicht vorausberechnet werden."),
        },
        {
            name: "billingUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The billing period could not be updated.", "Das Abrechnungsintervall konnte nicht aktualisiert werden."),
        },
        {
            name: "subscriptionCancel",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The subscription could not be cancelled.", "Das Abonnement konnte nicht gekündigt werden."),
        },
        {
            name: "subscriptionResume",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The cancellation could not be reversed.", "Die Kündigung konnte nicht zurückgenommen werden."),
        },
        {
            name: "planUpgrade",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The plan could not be upgraded.", "Der Plan konnte nicht aktualisiert werden."),
        },
        {
            name: "paymentFallback",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("An unexpected error occurred.", "Ein unerwarteter Fehler ist aufgetreten."),
        },
        {
            name: "sessionUnavailable",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault(
                "Your checkout session could not be authenticated. Please try again.",
                "Deine Checkout-Sitzung konnte nicht authentifiziert werden. Bitte versuche es erneut."
            ),
        },
        {
            name: "customerCreation",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("Your billing customer could not be prepared. Please try again.", "Dein Rechnungskunde konnte nicht vorbereitet werden. Bitte versuche es erneut."),
        },
        {
            name: "customerTypeMismatch",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault(
                "Your existing customer type does not match this checkout configuration.",
                "Dein bestehender Kundentyp stimmt nicht mit dieser Checkout-Konfiguration überein."
            ),
        },
        {
            name: "checkoutCustomer",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The selected billing customer cannot be used for this checkout.", "Der ausgewählte Rechnungskunde kann für diesen Checkout nicht verwendet werden."),
        },
        {
            name: "checkoutSession",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The checkout session could not be created. Please try again.", "Die Checkout-Sitzung konnte nicht erstellt werden. Bitte versuche es erneut."),
        },
        {
            name: "checkoutSessionExpired",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The checkout session expired. A new session is being created.", "Die Checkout-Sitzung ist abgelaufen. Eine neue Sitzung wird erstellt."),
        },
        {
            name: "billingAddressUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault(
                "The billing address could not be saved. Please check your details.",
                "Die Rechnungsadresse konnte nicht gespeichert werden. Bitte überprüfe deine Angaben."
            ),
        },
        {
            name: "emailUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The email address could not be saved. Please check your details.", "Die E-Mail-Adresse konnte nicht gespeichert werden. Bitte überprüfe deine Angaben."),
        },
        {
            name: "taxIdUpdate",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The tax ID could not be saved. Please check your details.", "Die Steuernummer konnte nicht gespeichert werden. Bitte überprüfe deine Angaben."),
        },
        {
            name: "taxIdIncomplete",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("Tax ID type and Tax ID must be provided together.", "Steuernummer-Typ und Steuernummer müssen zusammen angegeben werden."),
        },
        {
            name: "paymentConfirmation",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault(
                "The payment could not be confirmed. Please check your payment details.",
                "Die Zahlung konnte nicht bestätigt werden. Bitte überprüfe deine Zahlungsangaben."
            ),
        },
        {
            name: "discountSessionRequired",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("A checkout session is required to validate a discount.", "Eine Checkout-Sitzung ist erforderlich, um einen Rabatt zu validieren."),
        },
        {
            name: "discountValidation",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("The discount code could not be validated.", "Der Rabattcode konnte nicht validiert werden."),
        },
        {
            name: "checkoutLicenseStatus",
            type: "text",
            required: true,
            localized: true,
            defaultValue: localizedDefault("We could not check whether your license is ready.", "Wir konnten nicht prüfen, ob deine Lizenz bereit ist."),
        },
    ],
}
