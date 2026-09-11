"use client"

import type { PaymentMethodDisplayDetails } from "@/lib/licenses/customerPaymentMethods"
import { cn } from "@/lib/utils"
import { Badge, Card, Text } from "@code0-tech/pictor"
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
        <Card className="flex items-center gap-4 bg-light!">
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
        </Card>
    )
}
