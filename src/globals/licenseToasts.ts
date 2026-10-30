import type { Field, GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

function toast(name: string, label: string, title: [string, string], description: [string, string]): Field {
    return {
        name,
        label,
        type: "group",
        fields: [localizedText("title", ...title), localizedText("description", ...description, { type: "textarea" })],
    }
}

// Notifications shown after license dashboard actions. Kept in its own global because the Licenses and License Dialogs
// globals are close to Postgres' 100 argument limit for json_build_array (see licenseDialogs.ts).
export const LicenseToasts: GlobalConfig = {
    slug: "license-toasts",
    label: "License Toasts",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    admin: { description: "Use {date} in a description to insert the date the change takes effect." },
    fields: [
        localizedText("errorTitle", "Something went wrong", "Etwas ist schiefgelaufen", {
            description: "Title of every error toast; the specific error message from the Errors global is shown below it.",
        }),
        toast(
            "customerSaved",
            "Customer saved",
            ["Customer details saved", "Kundendaten gespeichert"],
            [
                "Your contact and billing details were updated and will be used for all future invoices.",
                "Deine Kontakt- und Rechnungsdaten wurden aktualisiert und werden für alle zukünftigen Rechnungen verwendet.",
            ]
        ),
        toast(
            "planUpdated",
            "Plan updated",
            ["Plan updated", "Plan aktualisiert"],
            [
                "Your new plan is active right away. Any price difference is prorated on your next invoice.",
                "Dein neuer Plan ist ab sofort aktiv. Eine Preisdifferenz wird anteilig mit deiner nächsten Rechnung verrechnet.",
            ]
        ),
        toast(
            "changeScheduled",
            "Change scheduled",
            ["Subscription change scheduled", "Abo-Änderung vorgemerkt"],
            [
                "Your current plan stays active until {date}. The change applies automatically from then on.",
                "Dein aktueller Plan bleibt bis zum {date} aktiv. Danach gilt die Änderung automatisch.",
            ]
        ),
        toast(
            "periodUpdated",
            "Billing period updated",
            ["Billing period updated", "Abrechnungsintervall aktualisiert"],
            [
                "Your subscription is now billed in the new interval. Future invoices reflect this change.",
                "Dein Abo wird jetzt im neuen Intervall abgerechnet. Zukünftige Rechnungen berücksichtigen diese Änderung.",
            ]
        ),
        toast(
            "canceled",
            "Subscription canceled",
            ["Subscription canceled", "Abo gekündigt"],
            [
                "Your subscription was canceled immediately and will not be renewed. You can start a new subscription at any time.",
                "Dein Abo wurde sofort gekündigt und wird nicht verlängert. Du kannst jederzeit ein neues Abo abschließen.",
            ]
        ),
        toast(
            "cancellationScheduled",
            "Cancellation scheduled",
            ["Cancellation scheduled", "Kündigung vorgemerkt"],
            [
                "Your license stays fully usable until {date}. You can withdraw the cancellation until then.",
                "Deine Lizenz bleibt bis zum {date} voll nutzbar. Bis dahin kannst du die Kündigung zurücknehmen.",
            ]
        ),
        toast(
            "resumed",
            "Cancellation withdrawn",
            ["Cancellation withdrawn", "Kündigung zurückgenommen"],
            [
                "Your subscription continues as before and renews automatically at the end of the billing period.",
                "Dein Abo läuft wie gewohnt weiter und verlängert sich automatisch zum Ende des Abrechnungszeitraums.",
            ]
        ),
        toast(
            "paymentAssigned",
            "Payment method assigned",
            ["Payment method updated", "Zahlungsmethode aktualisiert"],
            [
                "Future invoices for this license are charged to the selected payment method.",
                "Zukünftige Rechnungen dieser Lizenz werden über die ausgewählte Zahlungsmethode abgerechnet.",
            ]
        ),
        toast(
            "paymentRemoved",
            "Payment method removed",
            ["Payment method removed", "Zahlungsmethode entfernt"],
            [
                "The payment method was removed from your account and will no longer be charged.",
                "Die Zahlungsmethode wurde aus deinem Konto entfernt und wird nicht mehr belastet.",
            ]
        ),
        toast(
            "paymentConfirmed",
            "Payment method confirmed",
            ["Payment method added", "Zahlungsmethode hinzugefügt"],
            [
                "Stripe confirmed your payment method. You can now assign it to your licenses.",
                "Stripe hat deine Zahlungsmethode bestätigt. Du kannst sie jetzt deinen Lizenzen zuweisen.",
            ]
        ),
        toast(
            "namespaceLinked",
            "Namespace linked",
            ["Namespace linked", "Namespace verknüpft"],
            [
                "Your license is now linked to the selected namespace and its features are available there.",
                "Deine Lizenz ist jetzt mit dem ausgewählten Namespace verknüpft und ihre Funktionen stehen dort zur Verfügung.",
            ]
        ),
    ],
}
