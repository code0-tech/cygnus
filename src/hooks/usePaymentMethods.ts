"use client"

import { fetchCustomerPaymentMethods } from "@/lib/licenses/client"
import type { CustomerPaymentMethodSummary } from "@/lib/licenses/types"
import { useCallback, useEffect, useState } from "react"

const MAX_PAYMENT_METHOD_RETRIES = 3

interface PaymentMethodsState {
    customerId?: string
    paymentMethods: CustomerPaymentMethodSummary[] | null
    error: boolean
    loading: boolean
}

function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === "AbortError"
}

export function useCustomerPaymentMethods(customerId: string | undefined, enabled = true, expectedPaymentMethodId?: string) {
    const [state, setState] = useState<PaymentMethodsState>({ paymentMethods: null, error: false, loading: false })
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshPaymentMethods = useCallback(() => setRefreshKey((value) => value + 1), [])
    const removePaymentMethodLocally = useCallback((paymentMethodId: string) => {
        setState((current) => ({ ...current, paymentMethods: current.paymentMethods?.filter((method) => method.id !== paymentMethodId) ?? null }))
    }, [])

    useEffect(() => {
        if (!enabled || !customerId) return

        const controller = new AbortController()
        let retryTimeout: number | undefined
        setState((current) => ({ customerId, paymentMethods: current.customerId === customerId ? current.paymentMethods : null, error: false, loading: true }))

        const load = async (attempt: number) => {
            try {
                const paymentMethods = await fetchCustomerPaymentMethods(customerId, controller.signal)
                if (controller.signal.aborted) return

                const missingExpectedMethod = Boolean(expectedPaymentMethodId && !paymentMethods.some((method) => method.id === expectedPaymentMethodId))
                const missingDetails = paymentMethods.some((method) => !method.brand?.trim() && !method.type?.trim())
                // Immediately after checkout, the attached methods or their display summaries may lag.
                if (attempt < MAX_PAYMENT_METHOD_RETRIES && (!paymentMethods.length || missingExpectedMethod || missingDetails)) {
                    retryTimeout = window.setTimeout(() => void load(attempt + 1), 1_000 * (attempt + 1))
                    return
                }
                setState({ customerId, paymentMethods, error: missingExpectedMethod || missingDetails, loading: false })
            } catch (error) {
                if (!controller.signal.aborted && !isAbortError(error)) {
                    setState({ customerId, paymentMethods: null, error: true, loading: false })
                }
            }
        }
        void load(0)

        return () => {
            controller.abort()
            if (retryTimeout !== undefined) window.clearTimeout(retryTimeout)
        }
    }, [customerId, enabled, expectedPaymentMethodId, refreshKey])

    const belongsToCustomer = state.customerId === customerId
    return {
        isLoadingPaymentMethods: Boolean(enabled && customerId && (!belongsToCustomer || state.loading)),
        paymentMethods: belongsToCustomer ? state.paymentMethods : null,
        paymentMethodsError: belongsToCustomer && state.error,
        refreshPaymentMethods,
        removePaymentMethodLocally,
    }
}
