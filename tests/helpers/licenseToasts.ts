import type { LicenseToastsContent } from "../../src/lib/cms"

const entry = (title: string, description = `${title}.`) => ({ title, description })

export const licenseToastContent: LicenseToastsContent = {
    errorTitle: "Something went wrong",
    customerSaved: entry("Customer details saved"),
    planUpdated: entry("Plan updated"),
    changeScheduled: entry("Subscription change scheduled", "Applies on {date}."),
    periodUpdated: entry("Billing period updated"),
    canceled: entry("Subscription canceled"),
    cancellationScheduled: entry("Cancellation scheduled", "Access ends on {date}."),
    resumed: entry("Cancellation withdrawn"),
    paymentAssigned: entry("Payment method updated"),
    paymentRemoved: entry("Payment method removed"),
    paymentConfirmed: entry("Payment method added"),
    namespaceLinked: entry("Namespace linked", "Namespace verknüpft."),
}
