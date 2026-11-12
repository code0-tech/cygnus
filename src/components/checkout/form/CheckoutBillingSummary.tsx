"use client"

import { Card } from "@code0-tech/pictor"
import type { StripeCheckoutContact } from "@stripe/stripe-js"

interface CheckoutBillingSummaryProps {
    billingAddress: StripeCheckoutContact
    taxId?: string | null
    changeLabel: string
    disabled?: boolean
    onChange: () => void
}

export function formatBillingAddressLines({ address }: StripeCheckoutContact) {
    const locality = [address.postal_code, address.city, address.state, address.country].filter(Boolean).join(" ")
    return [address.line1, address.line2, locality].filter((line): line is string => Boolean(line))
}

export function CheckoutBillingSummary({ billingAddress, taxId, changeLabel, disabled = false, onChange }: CheckoutBillingSummaryProps) {
    return (
        <Card className="flex! items-center justify-between gap-4 bg-light! p-4!">
            <div className="min-w-0 space-y-0.5">
                {billingAddress.name && <p className="truncate text-[13px] text-white">{billingAddress.name}</p>}
                {formatBillingAddressLines(billingAddress).map((line) => (
                    <p key={line} className="truncate text-xs text-tertiary">
                        {line}
                    </p>
                ))}
                {taxId?.trim() && <p className="truncate text-xs text-tertiary">{taxId.trim()}</p>}
            </div>
            <button
                type="button"
                disabled={disabled}
                onClick={onChange}
                className="-mr-2 inline-block shrink-0 cursor-pointer rounded-[5px] px-2 py-1 text-[11px] font-medium text-brand transition-[background-color,color,box-shadow] duration-150 ease-in-out hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
            >
                {changeLabel}
            </button>
        </Card>
    )
}
