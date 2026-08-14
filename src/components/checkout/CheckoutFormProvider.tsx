"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { getOrCreateCheckoutDraftKey } from "@/lib/checkout/checkoutDraft"
import {
    calculateCheckoutTax,
    CheckoutSubmissionError,
    createCheckoutCustomer,
    createCheckoutSession,
    getCheckoutCustomers,
    type CheckoutCustomerData,
    type CheckoutSessionData,
    type CheckoutTaxQuoteData,
} from "@/lib/checkout/checkoutSubmission"
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
    if (error.errorCode === "INVALID_CHECKOUT_CUSTOMER") return content.errors.checkoutCustomer
    return error.kind === "customer" ? content.errors.customerCreation : content.errors.checkoutSession
}

function useCreateCheckoutFormState(content: CheckoutFormContent, locale: AppLocale) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionData | null>(null)
    const [customers, setCustomers] = useState<CheckoutCustomerData[]>([])
    const [hasExistingCustomers, setHasExistingCustomers] = useState<boolean | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [taxQuote, setTaxQuote] = useState<CheckoutTaxQuoteData | null>(null)
    const [checkoutSessionPromotionCode, setCheckoutSessionPromotionCode] = useState<string | null | undefined>(undefined)
    const [isRefreshingSession, setIsRefreshingSession] = useState(false)
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
    const [stripeBillingAddress, setStripeBillingAddress] = useState<StripeCheckoutContact | null>(null)
    const [stripeEmail, setStripeEmail] = useState<string | null>(null)
    const [stripeSessionError, setStripeSessionError] = useState<string | null>(null)
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
        if (!selectedCustomerId) return Promise.resolve()
        if (checkoutRefreshPromiseRef.current) return checkoutRefreshPromiseRef.current

        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        setCheckoutSession(null)
        setTaxQuote(null)
        setIsRefreshingSession(true)
        setErrorMessage(null)
        setStripeSessionError(null)

        const request = createCheckoutSession({ customerId: selectedCustomerId, locale, searchParams: checkoutSearchParams })
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
    }, [content.errors.checkoutSession, locale, promotionCode, searchParamsString, selectedCustomerId])

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
        setHasExistingCustomers(null)
        setTaxQuote(null)
        setStripeBillingAddress(null)
        setStripeEmail(null)
        setStripeSessionError(null)
        setStage("billingAddress")

        void (async () => {
            try {
                const availableCustomers = await getCheckoutCustomers()
                if (requestId !== sessionRefreshRequestRef.current) return
                const matchingCustomers = availableCustomers.filter((candidate) => candidate.customerType === customerType)
                setHasExistingCustomers(matchingCustomers.length > 0)
                const customer = matchingCustomers[0] ?? (await createCheckoutCustomer({ checkoutKey: getOrCreateCheckoutDraftKey(customerType), customerType }))
                if (requestId !== sessionRefreshRequestRef.current) return
                setCustomers(matchingCustomers)
                setSelectedCustomerId(customer.id)

                const session = await createCheckoutSession({ customerId: customer.id, locale, searchParams: checkoutSearchParams })
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
            } catch (error) {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to start Crater checkout:", error)
                setErrorMessage(getPreparationErrorMessage(error, content))
            } finally {
                if (requestId === sessionRefreshRequestRef.current) setIsLoading(false)
            }
        })()
    }, [authenticated, content, customerType, locale, preparationAttempt, searchParamsString, setStage])

    const selectCheckoutCustomer = useCallback(
        async (customerId: string | null) => {
            if (isLoading || isRefreshingSession) return

            const requestId = ++sessionRefreshRequestRef.current
            const checkoutSearchParams = new URLSearchParams(searchParamsString)
            setCheckoutSession(null)
            setTaxQuote(null)
            setStripeBillingAddress(null)
            setStripeEmail(null)
            setIsRefreshingSession(true)
            setErrorMessage(null)
            setStripeSessionError(null)
            setStage("billingAddress")

            try {
                const customer = customerId
                    ? customers.find((candidate) => candidate.id === customerId)
                    : await createCheckoutCustomer({ checkoutKey: getOrCreateCheckoutDraftKey(customerType), customerType })
                if (!customer) throw new CheckoutSubmissionError("customer", "INVALID_CHECKOUT_CUSTOMER", "The selected customer is unavailable.")

                setSelectedCustomerId(customer.id)

                const session = await createCheckoutSession({ customerId: customer.id, locale, searchParams: checkoutSearchParams })
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                expiredRefreshAttemptsRef.current = 0
                setCheckoutSessionPromotionCode(promotionCode)
                void calculateCheckoutTax({ searchParams: checkoutSearchParams })
                    .then((quote) => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(quote)
                    })
                    .catch(() => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(null)
                    })
            } catch (error) {
                if (requestId !== sessionRefreshRequestRef.current) return
                console.error("Failed to select the Crater checkout customer:", error)
                setErrorMessage(getPreparationErrorMessage(error, content))
            } finally {
                if (requestId === sessionRefreshRequestRef.current) setIsRefreshingSession(false)
            }
        },
        [content, customerType, customers, isLoading, isRefreshingSession, locale, promotionCode, searchParamsString, setStage]
    )

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
        customers,
        customerType,
        errorMessage,
        hasExistingCustomers,
        isLoading,
        isConfirmingPayment,
        isRefreshingSession,
        isSessionLoading,
        retryPreparation,
        markCheckoutSessionReady,
        refreshExpiredCheckoutSession,
        selectedCustomerId,
        selectCheckoutCustomer,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeSessionError,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeEmail,
        stripeSessionError,
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
