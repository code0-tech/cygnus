import { iconField } from "@mvriu5/payload-icon-picker"
import type { Field, GlobalConfig } from "payload"
import { localizedText } from "@/fields/localizedText"

const iconColorOptions = [
    { label: "Neutral", value: "neutral" },
    { label: "Brand", value: "brand" },
    { label: "Aqua", value: "aqua" },
    { label: "Blue", value: "blue" },
    { label: "Pink", value: "pink" },
    { label: "Yellow", value: "yellow" },
    { label: "Lime", value: "lime" },
    { label: "Magenta", value: "magenta" },
]

const summaryIconField = (name: string, label: string, defaultValue: string): Field =>
    iconField({
        name,
        label,
        required: true,
        defaultValue,
        placeholder: "Search icons",
        noResultsLabel: "No icons found",
    })

const summaryIconColorField = (name: string, defaultValue: string): Field => ({
    name,
    label: "Icon Color",
    type: "select",
    required: true,
    defaultValue,
    options: iconColorOptions,
})

export const Checkout: GlobalConfig = {
    slug: "checkout",
    access: {
        read: () => true,
        update: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "login",
            label: "Checkout Login",
            type: "group",
            fields: [
                { name: "heading", label: "Login Heading", type: "text", required: true, localized: true, defaultValue: "Sign in to CodeZero" },
                {
                    name: "description",
                    label: "Login Description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Use your CodeZero account to continue with your configured subscription.",
                },
                { name: "loginLabel", type: "text", required: true, localized: true, defaultValue: "Sign in" },
                { name: "guestHeading", type: "text", required: true, localized: true, defaultValue: "Continue as a guest" },
                {
                    name: "guestDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Complete your subscription checkout without signing in.",
                },
                { name: "guestLabel", type: "text", required: true, localized: true, defaultValue: "Continue as guest" },
            ],
        },
        {
            name: "summary",
            type: "group",
            fields: [
                { name: "eyebrow", type: "text", required: true, localized: true, defaultValue: "Order Summary" },
                localizedText("heading", "Your Plan: {plan}", "Dein Plan: {plan}", { description: "{plan} is replaced with the selected plan title." }),
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "This checkout reflects the subscription shape you configured, including runtime.",
                },
                localizedText("nextChargeText", "Next charge on {date} · Cancel anytime before", "Nächste Abbuchung am {date} · Vorher jederzeit kündbar", {
                    description: "Shown below the order summary. {date} is replaced with the end of the first billing period.",
                }),
                {
                    name: "deploymentIcons",
                    label: "Deployment Icons",
                    type: "group",
                    fields: [summaryIconField("cloud", "Cloud Icon", "tabler:IconCloud"), summaryIconField("selfHosted", "Self-hosted Icon", "tabler:IconServer")],
                },
                summaryIconColorField("deploymentIconColor", "aqua"),
                {
                    name: "customerTypeIcons",
                    label: "Customer Type Icons",
                    type: "group",
                    fields: [summaryIconField("b2b", "B2B Icon", "tabler:IconUsers"), summaryIconField("b2c", "B2C Icon", "tabler:IconBuildingStore")],
                },
                summaryIconColorField("customerTypeIconColor", "yellow"),
                {
                    name: "pricing",
                    type: "group",
                    fields: [
                        { name: "planLabel", type: "text", required: true, localized: true, defaultValue: "Plan" },
                        { name: "baseLabel", type: "text", required: true, localized: true, defaultValue: "AI Tokens" },
                        { name: "workflowExecutionsLabel", type: "text", required: true, localized: true, defaultValue: "Workflow Executions" },
                        { name: "quarterlyDiscountLabel", type: "text", required: true, localized: true, defaultValue: "Quarterly discount" },
                        { name: "yearlyDiscountLabel", type: "text", required: true, localized: true, defaultValue: "Yearly discount" },
                        { name: "discountInputPlaceholder", type: "text", required: true, localized: true, defaultValue: "Discount code" },
                        { name: "discountButtonLabel", type: "text", required: true, localized: true, defaultValue: "Apply" },
                        { name: "discountPromptLabel", type: "text", required: true, localized: true, defaultValue: "Have a discount?" },
                        { name: "discountRemoveLabel", type: "text", required: true, localized: true, defaultValue: "Remove" },
                        { name: "taxLabel", type: "text", required: true, localized: true, defaultValue: "Tax" },
                        localizedText("taxInclusiveLabel", "Included tax", "Enthaltene Steuer"),
                        localizedText("taxExclusiveLabel", "Additional tax", "Zusätzliche Steuer"),
                        localizedText("subtotalLabel", "Subtotal", "Zwischensumme"),
                        localizedText("totalExcludingTaxLabel", "Total excluding tax", "Gesamt ohne Steuern"),
                        localizedText("taxRateLabel", "{rate} on {amount}", "{rate} auf {amount}", {
                            description: "Shown after the tax name, for example VAT – Germany (19% on €65.67). {rate} and {amount} are replaced.",
                        }),
                        localizedText("totalDueTodayLabel", "Total due today", "Heute fällig"),
                        localizedText("totalIncludingTaxSuffix", "incl. VAT", "inkl. MwSt.", { description: "Shown next to the total when tax applies." }),
                        { name: "totalLabel", type: "text", required: true, localized: true, defaultValue: "Total" },
                        { name: "perMonthSuffix", type: "text", required: true, localized: true, defaultValue: "/mo" },
                    ],
                },
            ],
        },
        {
            name: "form",
            type: "group",
            fields: [
                { name: "billingHeading", type: "text", required: true, localized: true, defaultValue: "Billing Address" },
                { name: "continueLabel", type: "text", required: true, localized: true, defaultValue: "Continue to Payment" },
                { name: "backToBillingLabel", type: "text", required: true, localized: true, defaultValue: "Back to Billing" },
                { name: "payNowLabel", type: "text", required: true, localized: true, defaultValue: "Pay now" },
                localizedText("sendOfferPrompt", "Need an invoice or a quote first?", "Benötigst du zuerst eine Rechnung oder ein Angebot?"),
                {
                    name: "sendOfferLabel",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: "Send offer",
                    admin: { description: "Shown below the primary billing button for business customers only." },
                },
                localizedText("sendOfferTitle", "Send offer", "Angebot senden"),
                localizedText(
                    "sendOfferDescription",
                    "Enter the email address that should receive this configuration as an offer.",
                    "Gib die E-Mail-Adresse ein, an die diese Konfiguration als Angebot gesendet werden soll.",
                    { type: "textarea" }
                ),
                localizedText(
                    "sendOfferSuccess",
                    "We sent the offer to {email}. It breaks the costs down line by line and is non-binding.",
                    "Wir haben das Angebot an {email} gesendet. Es schlüsselt die Kosten einzeln auf und ist unverbindlich.",
                    { type: "textarea", description: "Use {email} to insert the recipient address." }
                ),
                localizedText(
                    "sendOfferBillingRequired",
                    "Fill in your billing address first. The offer is made out to it and its taxes are calculated from it.",
                    "Fülle zuerst deine Rechnungsadresse aus. Das Angebot wird auf sie ausgestellt und die Steuern werden danach berechnet.",
                    { type: "textarea" }
                ),
                { name: "processingLabel", type: "text", required: true, localized: true, defaultValue: "Processing..." },
                { name: "customerSelectLabel", type: "text", required: true, localized: true, defaultValue: "Billing customer" },
                { name: "newCustomerLabel", type: "text", required: true, localized: true, defaultValue: "Create new customer" },
                { name: "nameLabel", type: "text", required: true, localized: true, defaultValue: "Name" },
                { name: "emailLabel", type: "text", required: true, localized: true, defaultValue: "Email" },
                { name: "emailPlaceholder", type: "text", required: true, localized: true, defaultValue: "billing@example.com" },
                { name: "phoneLabel", type: "text", required: true, localized: true, defaultValue: "Phone" },
                { name: "line1Label", type: "text", required: true, localized: true, defaultValue: "Address" },
                { name: "line2Label", type: "text", required: true, localized: true, defaultValue: "Address line 2" },
                { name: "cityLabel", type: "text", required: true, localized: true, defaultValue: "City" },
                { name: "stateLabel", type: "text", required: true, localized: true, defaultValue: "State" },
                { name: "postalCodeLabel", type: "text", required: true, localized: true, defaultValue: "Postal code" },
                { name: "countryLabel", type: "text", required: true, localized: true, defaultValue: "Country" },
            ],
        },
        {
            name: "nextSteps",
            type: "group",
            admin: {
                description: "Checklist of what happens after paying, always shown below the order summary. Each step shows its title in bold followed by the description.",
            },
            fields: [
                localizedText("heading", "What happens next", "Wie es weitergeht"),
                localizedText("step1Title", "Payment confirmed", "Zahlung bestätigt"),
                localizedText("step1Description", "securely by Stripe", "sicher über Stripe"),
                localizedText("step2Title", "License created", "Lizenz erstellt"),
                localizedText("step2Description", "automatically, invoice sent by email", "automatisch, Rechnung per E-Mail"),
                localizedText("step3Title", "Start building", "Loslegen"),
                localizedText("step3Description", "from your license dashboard", "über dein Lizenz-Dashboard"),
            ],
        },
        {
            name: "success",
            type: "group",
            fields: [
                { name: "heading", type: "text", required: true, localized: true, defaultValue: "Payment submitted" },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Stripe has received your payment confirmation. You can close this page or return to the site.",
                },
                { name: "licenseDashboardLabel", type: "text", required: true, localized: true, defaultValue: "Open license dashboard" },
                localizedText("sculptorLabel", "Open Sculptor", "Sculptor öffnen"),
                localizedText("licenseDownloadLabel", "Download license", "Lizenz herunterladen"),
                localizedText("licenseDownloadError", "The license could not be downloaded.", "Die Lizenz konnte nicht heruntergeladen werden."),
                { name: "licensePendingLabel", type: "text", required: true, localized: true, defaultValue: "Your license is being prepared…" },
                { name: "licenseStatusRetryLabel", type: "text", required: true, localized: true, defaultValue: "Try again" },
                localizedText("delayedHeading", "Processing is taking longer", "Die Verarbeitung dauert länger"),
                localizedText(
                    "delayedConfirmedDescription",
                    "Your payment is confirmed. Preparing your license is taking longer than expected. Please check the status again later. You do not need to pay again.",
                    "Deine Zahlung ist bestätigt. Die Bereitstellung deiner Lizenz dauert länger als erwartet. Bitte prüfe den Status später erneut. Du musst nicht erneut bezahlen.",
                    { type: "textarea", description: "Shown when polling pauses after payment has been confirmed, while the license is still being prepared." }
                ),
                localizedText(
                    "delayedPendingDescription",
                    "Your checkout is still being processed. Please check the status again later before starting another checkout.",
                    "Dein Checkout wird noch verarbeitet. Bitte prüfe den Status später erneut, bevor du einen neuen Checkout startest.",
                    { type: "textarea", description: "Shown when polling pauses before payment has been confirmed." }
                ),
                {
                    name: "receiptHint",
                    type: "text",
                    required: true,
                    localized: true,
                    defaultValue: "Stripe sends the receipt to your email address.",
                    admin: { description: "Shown once the payment is confirmed. The exact amount is on the Stripe receipt, not on this page." },
                },
                localizedText(
                    "guestAccountHint",
                    "You will receive an email with a link to create your account. Complete your account setup using that link to continue.",
                    "Du erhältst eine E-Mail mit einem Link zur Kontoerstellung. Richte darüber dein Konto ein, um anschließend fortzufahren.",
                    { type: "textarea", description: "Shown after payment confirmation for guest checkouts only." }
                ),
                { name: "failedHeading", type: "text", required: true, localized: true, defaultValue: "Payment failed" },
                {
                    name: "failedDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "Stripe could not process your payment. You have not been charged and no subscription was created.",
                },
                { name: "invalidHeading", type: "text", required: true, localized: true, defaultValue: "This checkout link is no longer valid" },
                {
                    name: "invalidDescription",
                    type: "textarea",
                    required: true,
                    localized: true,
                    defaultValue: "The link has expired or belongs to another account. If your payment went through, you will find the license in your license dashboard.",
                },
                { name: "checkoutRetryLabel", type: "text", required: true, localized: true, defaultValue: "Back to checkout" },
            ],
        },
    ],
}
