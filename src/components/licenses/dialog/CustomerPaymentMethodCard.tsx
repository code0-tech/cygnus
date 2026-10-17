"use client"

import type { PaymentMethodDisplayDetails } from "@/lib/licenses/types"
import { cn } from "@/lib/utils"
import { Badge, Text } from "@code0-tech/pictor"
import CardSection from "@code0-tech/pictor/dist/components/card/CardSection"
import { IconCreditCard } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface CustomerPaymentMethodCardProps {
    action?: ReactNode
    defaultLabel?: string
    method: PaymentMethodDisplayDetails & { id?: string; isDefault?: boolean }
}

export function CustomerPaymentMethodCard({ action, defaultLabel, method }: CustomerPaymentMethodCardProps) {
    // Crater resolves the details from Stripe on every read, so they can be missing while Stripe is not
    // answering. The payment method id is then the only thing left to show.
    const title = method.brand?.trim() || method.type?.replaceAll("_", " ") || null
    const expiry = method.expiresMonth && method.expiresYear ? `${String(method.expiresMonth).padStart(2, "0")}/${method.expiresYear}` : null

    return (
        <CardSection border className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/7 text-brand">
                <IconCreditCard aria-hidden="true" size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Text size="sm" fw={500} className={cn("min-w-0", title ? "capitalize" : "break-all")}>
                        {title ? [title, method.last4 ? `•••• ${method.last4}` : null].filter(Boolean).join(" · ") : method.id}
                    </Text>
                    {method.isDefault && defaultLabel ? <Badge color="success">{defaultLabel}</Badge> : null}
                </div>
                {expiry ? (
                    <Text size="sm" hierarchy="tertiary">
                        {expiry}
                    </Text>
                ) : null}
            </div>
            {action}
        </CardSection>
    )
}

// The loading label lives inside the row: any extra element before the first CardSection breaks Pictor's :first-child card styling.
export function CustomerPaymentMethodCardSkeleton({ label }: { label?: string }) {
    return (
        <CardSection border className="flex animate-pulse items-center gap-4 motion-reduce:animate-none">
            {label ? (
                <span role="status" className="sr-only">
                    {label}
                </span>
            ) : null}
            <div aria-hidden="true" className="size-10 shrink-0 rounded-xl bg-white/7" />
            <div aria-hidden="true" className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-36 rounded-full bg-white/10" />
                <div className="h-3 w-14 rounded-full bg-white/7" />
            </div>
        </CardSection>
    )
}
