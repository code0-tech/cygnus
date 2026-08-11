"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { createCheckoutSession, prepareCheckoutSession, type CheckoutSessionData } from "@/lib/checkout/checkoutSubmission"
import type { AppLocale } from "@/lib/i18n"
import type { StripeCheckoutContact } from "@stripe/stripe-js"
import { useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]

function useCreateCheckoutFormState(content: CheckoutFormContent, locale: AppLocale) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionData | null>(null)
    const [checkoutSessionPromotionCode, setCheckoutSessionPromotionCode] = useState<string | null | undefined>(undefined)
    const [isRefreshingSession, setIsRefreshingSession] = useState(false)
    const [stripeBillingAddress, setStripeBillingAddress] = useState<StripeCheckoutContact | null>(null)
    const [stripeEmail, setStripeEmail] = useState<string | null>(null)
    const [stripeTaxIdType, setStripeTaxIdType] = useState("")
    const [stripeTaxIdValue, setStripeTaxIdValue] = useState("")
    const [preparationAttempt, setPreparationAttempt] = useState(0)
    const preparedSessionKeyRef = useRef<string | null>(null)
    const sessionRefreshRequestRef = useRef(0)
    const { authenticated, error: sessionError, isLoading: isSessionLoading } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const searchParamsString = searchParams.toString()
    const promotionCode = searchParams.get("promotionCode")?.trim() || null

    useEffect(() => {
        if (!authenticated) return

        const preparationKey = String(preparationAttempt)
        if (preparedSessionKeyRef.current === preparationKey) return
        preparedSessionKeyRef.current = preparationKey
        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)

        setIsLoading(true)
        setErrorMessage(null)
        setCheckoutSession(null)
        setStripeBillingAddress(null)
        setStripeEmail(null)
        setStripeTaxIdType("")
        setStripeTaxIdValue("")
        setStage("billingAddress")

        void prepareCheckoutSession({ customerType, locale, searchParams: checkoutSearchParams })
            .then((session) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                setCheckoutSessionPromotionCode(checkoutSearchParams.get("promotionCode")?.trim() || null)
            })
            .catch((error) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to start Crater checkout:", error)
                setErrorMessage(error instanceof Error ? error.message : content.paymentErrorFallback || "Checkout failed.")
            })
            .finally(() => {
                if (requestId === sessionRefreshRequestRef.current) setIsLoading(false)
            })
    }, [authenticated, content.paymentErrorFallback, customerType, locale, preparationAttempt, searchParamsString, setStage])

    useEffect(() => {
        if (checkoutSessionPromotionCode === undefined || checkoutSessionPromotionCode === promotionCode || !authenticated) return

        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        setCheckoutSession(null)
        setIsRefreshingSession(true)
        setErrorMessage(null)
        setStripeBillingAddress(null)
        setStripeEmail(null)
        setStripeTaxIdType("")
        setStripeTaxIdValue("")
        setStage("billingAddress")

        void createCheckoutSession({ locale, searchParams: checkoutSearchParams })
            .then((session) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                setCheckoutSessionPromotionCode(promotionCode)
            })
            .catch((error) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to refresh Crater checkout after discount change:", error)
                setCheckoutSessionPromotionCode(undefined)
                setErrorMessage(error instanceof Error ? error.message : content.paymentErrorFallback || "Checkout failed.")
            })
            .finally(() => {
                if (requestId === sessionRefreshRequestRef.current) setIsRefreshingSession(false)
            })
    }, [authenticated, checkoutSessionPromotionCode, content.paymentErrorFallback, locale, promotionCode, searchParamsString, setStage])

    const retryPreparation = useCallback(() => {
        preparedSessionKeyRef.current = null
        setPreparationAttempt((attempt) => attempt + 1)
    }, [])

    return {
        checkoutSession,
        content,
        customerType,
        errorMessage,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        retryPreparation,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeTaxIdType,
        setStripeTaxIdValue,
        stripeBillingAddress,
        stripeEmail,
        stripeTaxIdType,
        stripeTaxIdValue,
    }
}

type CheckoutFormState = ReturnType<typeof useCreateCheckoutFormState>

const CheckoutFormContext = createContext<CheckoutFormState | null>(null)

export function CheckoutFormProvider({ children, content, locale }: { children: ReactNode; content: CheckoutFormContent; locale: AppLocale }) {
    const state = useCreateCheckoutFormState(content, locale)
    return <CheckoutFormContext.Provider value={state}>{children}</CheckoutFormContext.Provider>
}

export function useCheckoutFormState() {
    const context = useContext(CheckoutFormContext)
    if (!context) throw new Error("useCheckoutFormState must be used within a CheckoutFormProvider")
    return context
}
