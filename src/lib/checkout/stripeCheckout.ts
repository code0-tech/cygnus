import type { StripeCheckoutLoadActionsSuccess, StripeCheckoutSession, StripeCheckoutTaxIdInfo, StripeCheckoutTaxIdType, StripeTaxIdElementChangeEvent } from "@stripe/stripe-js"
import type { CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/client"

export type CheckoutPromotionCodeSdk = Pick<StripeCheckoutLoadActionsSuccess, "applyPromotionCode" | "removePromotionCode">

/** Last state the TaxIdElement reported, stored on the session before the payment step unmounts the element. */
export interface CheckoutTaxIdDraft {
    complete: boolean
    empty: boolean
    value: StripeTaxIdElementChangeEvent["value"]
    visible: boolean
}

/**
 * Maps the TaxIdElement value onto the session's tax ID info. The element reports the country specific type
 * (`de_vat`) as `taxIdType` and the Stripe API type (`eu_vat`) as `externalTaxIdType`; the session expects the latter.
 * A hidden or empty element clears the tax ID.
 */
export function getTaxIdInfoFromDraft(draft: CheckoutTaxIdDraft): StripeCheckoutTaxIdInfo | null {
    const taxId = draft.value.taxId?.trim()
    if (!draft.visible || draft.empty || !taxId || !draft.value.externalTaxIdType) return null

    return {
        businessName: draft.value.businessName?.trim() ?? "",
        taxId: { type: draft.value.externalTaxIdType as StripeCheckoutTaxIdType, value: taxId },
    }
}

export function getTaxQuoteFromSession(session: StripeCheckoutSession): CheckoutTaxQuoteData | null {
    if (session.tax?.status !== "ready" || !session.total?.total || !session.total.taxExclusive) return null

    return {
        amountTotal: session.total.total.minorUnitsAmount,
        currency: session.currency,
        taxAmountExclusive: session.total.taxExclusive.minorUnitsAmount,
    }
}

export function getStripePricingFromSession(session: StripeCheckoutSession): CheckoutStripePricingData | null {
    const divisor = session.minorUnitsAmountDivisor
    if (session.tax?.status !== "ready" || !Number.isFinite(divisor) || divisor <= 0) return null

    return {
        billingCountry: session.billingAddress?.address.country || null,
        currency: session.currency,
        discountAmount: session.total.discount.minorUnitsAmount / divisor,
        subtotalPrice: session.total.subtotal.minorUnitsAmount / divisor,
        taxAmount: session.total.taxExclusive.minorUnitsAmount / divisor,
        taxAmountInclusive: session.total.taxInclusive.minorUnitsAmount / divisor,
        taxLines: (session.taxAmounts ?? [])
            .filter((tax) => tax.minorUnitsAmount > 0)
            .map((tax) => ({
                amount: tax.minorUnitsAmount / divisor,
                displayName: tax.displayName,
                inclusive: tax.inclusive,
                percentage: typeof tax.percentage === "number" && Number.isFinite(tax.percentage) ? tax.percentage : null,
            })),
        totalPrice: session.total.total.minorUnitsAmount / divisor,
    }
}
