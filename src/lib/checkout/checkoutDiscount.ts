// Matches the current Crater CheckoutDiscount schema until the published types catch up.
export interface CheckoutDiscountData {
    amountOff: number | null
    code: string
    currency: string | null
    duration: string
    durationInMonths: number | null
    maxRedemptions: number | null
    percentOff: number | null
    timesRedeemed: number | null
}
