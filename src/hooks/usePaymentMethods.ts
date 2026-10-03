"use client"

import { fetchCustomerPaymentMethods, type CustomerPaymentMethodSummary } from "@/lib/licenses/licenseClient"
import { useCallback, useEffect, useState } from "react"

function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === "AbortError"
}

export function useCustomerPaymentMethods(customerId: string | undefined, enabled = true) {
    const [paymentMethods, setPaymentMethods] = useState<CustomerPaymentMethodSummary[] | null>(null)
    const [paymentMethodsError, setPaymentMethodsError] = useState(false)
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshPaymentMethods = useCallback(() => setRefreshKey((value) => value + 1), [])
    const removePaymentMethodLocally = useCallback((paymentMethodId: string) => {
        setPaymentMethods((current) => current?.filter((method) => method.id !== paymentMethodId) ?? null)
    }, [])

    useEffect(() => {
        if (!enabled || !customerId) return

        const controller = new AbortController()
        setIsLoadingPaymentMethods(true)
        setPaymentMethodsError(false)
        void fetchCustomerPaymentMethods(customerId, controller.signal)
            .then(setPaymentMethods)
            .catch((error) => {
                if (!isAbortError(error)) setPaymentMethodsError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingPaymentMethods(false)
            })

        return () => controller.abort()
    }, [customerId, enabled, refreshKey])

    return { isLoadingPaymentMethods, paymentMethods, paymentMethodsError, refreshPaymentMethods, removePaymentMethodLocally }
}
