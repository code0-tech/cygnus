import type { StripeCheckoutLoadActionsSuccess, StripeCheckoutSession } from "@stripe/stripe-js"
import type { CheckoutStripePricingData, CheckoutTaxQuoteData } from "@/lib/checkout/client"

export type CheckoutPromotionCodeSdk = Pick<StripeCheckoutLoadActionsSuccess, "applyPromotionCode" | "removePromotionCode">

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
