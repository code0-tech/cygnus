"use client"

import { fetchCustomerPaymentMethods, fetchSubscriptionPaymentMethod, type CustomerPaymentMethodSummary, type PaymentMethodDisplayDetails } from "@/lib/licenses/licenseClient"
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

export function useSubscriptionPaymentMethod(subscriptionId: string | undefined, enabled = true) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDisplayDetails | null>(null)
    const [paymentMethodError, setPaymentMethodError] = useState(false)
    const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshPaymentMethod = useCallback(() => setRefreshKey((value) => value + 1), [])

    useEffect(() => {
        if (!enabled || !subscriptionId) return

        const controller = new AbortController()
        setIsLoadingPaymentMethod(true)
        setPaymentMethodError(false)
        void fetchSubscriptionPaymentMethod(subscriptionId, controller.signal)
            .then(setPaymentMethod)
            .catch((error) => {
                if (!isAbortError(error)) setPaymentMethodError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingPaymentMethod(false)
            })

        return () => controller.abort()
    }, [enabled, refreshKey, subscriptionId])

    return { isLoadingPaymentMethod, paymentMethod, paymentMethodError, refreshPaymentMethod }
}
