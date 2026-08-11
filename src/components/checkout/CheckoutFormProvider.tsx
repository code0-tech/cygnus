"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { calculateCheckoutTax, CheckoutSubmissionError, createCheckoutSession, prepareCheckoutSession, type CheckoutSessionData, type CheckoutTaxQuoteData } from "@/lib/checkout/checkoutSubmission"
import type { AppLocale } from "@/lib/i18n"
import type { StripeCheckoutContact } from "@stripe/stripe-js"
import { useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]
const CHECKOUT_SESSION_REFRESH_LEAD_MS = 60_000
const MAX_BROWSER_TIMEOUT_MS = 2_147_000_000

function getPreparationErrorMessage(error: unknown, content: CheckoutFormContent) {
    if (!(error instanceof CheckoutSubmissionError)) return content.paymentErrorFallback
    if (error.errorCode === "CUSTOMER_TYPE_MISMATCH") return content.errors.customerTypeMismatch
    return error.kind === "customer" ? content.errors.customerCreation : content.errors.checkoutSession
}

function useCreateCheckoutFormState(content: CheckoutFormContent, locale: AppLocale) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionData | null>(null)
    const [taxQuote, setTaxQuote] = useState<CheckoutTaxQuoteData | null>(null)
    const [checkoutSessionPromotionCode, setCheckoutSessionPromotionCode] = useState<string | null | undefined>(undefined)
    const [isRefreshingSession, setIsRefreshingSession] = useState(false)
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
    const [stripeBillingAddress, setStripeBillingAddress] = useState<StripeCheckoutContact | null>(null)
    const [stripeEmail, setStripeEmail] = useState<string | null>(null)
    const [stripeTaxIdType, setStripeTaxIdType] = useState("")
    const [stripeTaxIdValue, setStripeTaxIdValue] = useState("")
    const [preparationAttempt, setPreparationAttempt] = useState(0)
    const preparedSessionKeyRef = useRef<string | null>(null)
    const sessionRefreshRequestRef = useRef(0)
    const checkoutRefreshPromiseRef = useRef<Promise<void> | null>(null)
    const expiredRefreshAttemptsRef = useRef(0)
    const { authenticated, error: sessionError, isLoading: isSessionLoading } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const searchParamsString = searchParams.toString()
    const promotionCode = searchParams.get("promotionCode")?.trim() || null

    const refreshCheckoutSession = useCallback(() => {
        if (checkoutRefreshPromiseRef.current) return checkoutRefreshPromiseRef.current

        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        setCheckoutSession(null)
        setTaxQuote(null)
        setIsRefreshingSession(true)
        setErrorMessage(null)
        setStage("billingAddress")

        const request = createCheckoutSession({ locale, searchParams: checkoutSearchParams })
            .then((session) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                setCheckoutSessionPromotionCode(promotionCode)
                void calculateCheckoutTax({ searchParams: checkoutSearchParams })
                    .then((quote) => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(quote)
                    })
                    .catch(() => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(null)
                    })
            })
            .catch((error) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to refresh the Crater checkout session:", error)
                setCheckoutSessionPromotionCode(undefined)
                setErrorMessage(content.errors.checkoutSession)
            })
            .finally(() => {
                checkoutRefreshPromiseRef.current = null
                if (requestId === sessionRefreshRequestRef.current) setIsRefreshingSession(false)
            })

        checkoutRefreshPromiseRef.current = request
        return request
    }, [content.errors.checkoutSession, locale, promotionCode, searchParamsString, setStage])

    const refreshExpiredCheckoutSession = useCallback(() => {
        if (expiredRefreshAttemptsRef.current >= 1) return Promise.resolve()
        expiredRefreshAttemptsRef.current += 1
        return refreshCheckoutSession()
    }, [refreshCheckoutSession])

    const markCheckoutSessionReady = useCallback(() => {
        expiredRefreshAttemptsRef.current = 0
    }, [])

    useEffect(() => {
        if (!authenticated) return

        const preparationSearchParams = new URLSearchParams(searchParamsString)
        preparationSearchParams.delete("promotionCode")
        const preparationKey = `${preparationSearchParams.toString()}:${preparationAttempt}`
        if (preparedSessionKeyRef.current === preparationKey) return
        preparedSessionKeyRef.current = preparationKey
        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)

        setIsLoading(true)
        setErrorMessage(null)
        setCheckoutSession(null)
        setTaxQuote(null)
        setStripeBillingAddress(null)
        setStripeEmail(null)
        setStripeTaxIdType("")
        setStripeTaxIdValue("")
        setStage("billingAddress")

        void prepareCheckoutSession({ customerType, locale, searchParams: checkoutSearchParams })
            .then((session) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                expiredRefreshAttemptsRef.current = 0
                setCheckoutSessionPromotionCode(checkoutSearchParams.get("promotionCode")?.trim() || null)
                void calculateCheckoutTax({ searchParams: checkoutSearchParams })
                    .then((quote) => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(quote)
                    })
                    .catch((error) => {
                        if (requestId !== sessionRefreshRequestRef.current) return
                        console.warn("Could not load the non-binding checkout tax preview:", error)
                        setTaxQuote(null)
                    })
            })
            .catch((error) => {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to start Crater checkout:", error)
                setErrorMessage(getPreparationErrorMessage(error, content))
            })
            .finally(() => {
                if (requestId === sessionRefreshRequestRef.current) setIsLoading(false)
            })
    }, [authenticated, content, customerType, locale, preparationAttempt, searchParamsString, setStage])

    useEffect(() => {
        if (checkoutSessionPromotionCode === undefined || checkoutSessionPromotionCode === promotionCode || !authenticated) return

        void refreshCheckoutSession()
    }, [authenticated, checkoutSessionPromotionCode, promotionCode, refreshCheckoutSession])

    useEffect(() => {
        if (!checkoutSession?.expiresAt || isConfirmingPayment) return

        const refreshDelay = Math.min(MAX_BROWSER_TIMEOUT_MS, Math.max(0, checkoutSession.expiresAt * 1_000 - Date.now() - CHECKOUT_SESSION_REFRESH_LEAD_MS))
        const timer = window.setTimeout(() => void refreshCheckoutSession(), refreshDelay)
        return () => window.clearTimeout(timer)
    }, [checkoutSession, isConfirmingPayment, refreshCheckoutSession])

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
        isConfirmingPayment,
        isRefreshingSession,
        isSessionLoading,
        retryPreparation,
        markCheckoutSessionReady,
        refreshExpiredCheckoutSession,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeTaxIdType,
        setStripeTaxIdValue,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeEmail,
        stripeTaxIdType,
        stripeTaxIdValue,
        taxQuote,
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
