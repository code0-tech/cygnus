"use client"

import { Badge, Card, Text } from "@code0-tech/pictor"
import { IconCreditCard } from "@tabler/icons-react"
import type { ReactNode } from "react"

export interface CustomerPaymentMethodSummary {
    brand: string | null
    expiresMonth: number | null
    expiresYear: number | null
    id: string
    isDefault: boolean
    last4: string | null
    type: string
}

interface CustomerPaymentMethodCardProps {
    action?: ReactNode
    defaultLabel?: string
    method: Pick<CustomerPaymentMethodSummary, "brand" | "expiresMonth" | "expiresYear" | "last4" | "type"> & Partial<Pick<CustomerPaymentMethodSummary, "id" | "isDefault">>
}

export function CustomerPaymentMethodCard({ action, defaultLabel, method }: CustomerPaymentMethodCardProps) {
    const title = method.brand?.trim() || method.type.replaceAll("_", " ")
    const expiry = method.expiresMonth && method.expiresYear ? `${String(method.expiresMonth).padStart(2, "0")}/${method.expiresYear}` : null

    return (
        <Card className="flex items-center gap-4 bg-light!">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/7 text-brand">
                <IconCreditCard aria-hidden="true" size={20} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Text size="sm" fw={500} className="capitalize">
                        {[title, method.last4 ? `•••• ${method.last4}` : null].filter(Boolean).join(" · ")}
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
