"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { useCheckoutStage } from "@/components/checkout/CheckoutStage"
import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { getCheckoutContactDraftCustomerId, getOrCreateCheckoutDraftKey, saveCheckoutContactDraft, takeCheckoutContactDraft } from "@/lib/checkout/checkoutDraft"
import { replaceCheckoutPage } from "@/lib/checkout/checkoutNavigation"
import {
    calculateCheckoutTax,
    CheckoutSubmissionError,
    createCheckoutCustomer,
    createCheckoutSession,
    getCheckoutCustomers,
    type CheckoutCustomerData,
    type CheckoutSessionData,
    type CheckoutStripePricingData,
    type CheckoutTaxQuoteData,
} from "@/lib/checkout/checkoutSubmission"
import type { AppLocale } from "@/lib/i18n"
import type { StripeCheckoutContact } from "@stripe/stripe-js"
import { useSearchParams } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]
type CheckoutPromotionCodeActions = {
    apply: (code: string) => Promise<void>
    remove: () => Promise<void>
}
const CHECKOUT_SESSION_REFRESH_LEAD_MS = 60_000
const MAX_BROWSER_TIMEOUT_MS = 2_147_000_000
const CHECKOUT_LOAD_RECOVERY_KEY = "code0.checkout.sessionLoadRecovery"
const CHECKOUT_LOAD_RECOVERY_TTL_MS = 60_000

function getPreparationErrorMessage(error: unknown, errors: ErrorsContent) {
    if (!(error instanceof CheckoutSubmissionError)) return errors.paymentFallback
    if (error.status === 429) {
        return error.retryAfterSeconds ? `${error.message} (${error.retryAfterSeconds}s)` : error.message
    }
    if (error.errorCode === "CUSTOMER_TYPE_MISMATCH") return errors.customerTypeMismatch
    if (error.errorCode === "INVALID_CHECKOUT_CUSTOMER") return errors.checkoutCustomer
    if (error.kind === "session") return error.message
    return error.kind === "customer" ? errors.customerCreation : errors.checkoutSession
}

function useCreateCheckoutFormState(content: CheckoutFormContent, errors: ErrorsContent, locale: AppLocale) {
    const searchParams = useSearchParams()
    const { stage, setStage, setHasError } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionData | null>(null)
    const [customers, setCustomers] = useState<CheckoutCustomerData[]>([])
    const [hasExistingCustomers, setHasExistingCustomers] = useState<boolean | null>(null)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [taxQuote, setTaxQuote] = useState<CheckoutTaxQuoteData | null>(null)
    const [stripePricing, setStripePricing] = useState<CheckoutStripePricingData | null>(null)
    const [checkoutSessionPromotionCode, setCheckoutSessionPromotionCode] = useState<string | null | undefined>(undefined)
    const [promotionCodeActionsReady, setPromotionCodeActionsReady] = useState(false)
    const [isRefreshingSession, setIsRefreshingSession] = useState(false)
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
    const [stripeBillingAddress, setStripeBillingAddress] = useState<StripeCheckoutContact | null>(null)
    const [stripeEmail, setStripeEmail] = useState<string | null>(null)
    const [stripeSessionError, setStripeSessionError] = useState<string | null>(null)
    const [preparationAttempt, setPreparationAttempt] = useState(0)
    const preparedSessionKeyRef = useRef<string | null>(null)
    const sessionRefreshRequestRef = useRef(0)
    const checkoutRefreshPromiseRef = useRef<Promise<boolean> | null>(null)
    const promotionCodeActionsRef = useRef<CheckoutPromotionCodeActions | null>(null)
    const selectedCustomerIdRef = useRef<string | null>(null)
    const stageRef = useRef(stage)
    const stripeBillingAddressRef = useRef<StripeCheckoutContact | null>(null)
    const stripeEmailRef = useRef<string | null>(null)
    const expiredRefreshAttemptsRef = useRef(0)
    selectedCustomerIdRef.current = selectedCustomerId
    stageRef.current = stage
    stripeBillingAddressRef.current = stripeBillingAddress
    stripeEmailRef.current = stripeEmail
    const { authenticated, error: sessionError, isLoading: isSessionLoading } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const searchParamsString = searchParams.toString()
    const resolvedError = errorMessage ?? sessionError ?? stripeSessionError

    useEffect(() => {
        setHasError(Boolean(resolvedError))
    }, [resolvedError, setHasError])

    useEffect(() => () => setHasError(false), [setHasError])

    const startCheckoutSessionRefresh = useCallback((checkoutSearchParams: URLSearchParams) => {
        const customerId = selectedCustomerIdRef.current
        if (!customerId) return Promise.resolve(false)
        const requestId = ++sessionRefreshRequestRef.current
        setCheckoutSession(null)
        setTaxQuote(null)
        setStripePricing(null)
        setIsRefreshingSession(true)
        setErrorMessage(null)
        setStripeSessionError(null)

        let request: Promise<boolean>
        request = createCheckoutSession({ customerId, locale, searchParams: checkoutSearchParams })
            .then((session) => {
                if (requestId !== sessionRefreshRequestRef.current) return false
                setCheckoutSession(session)
                setCheckoutSessionPromotionCode(null)
                void calculateCheckoutTax({ searchParams: checkoutSearchParams })
                    .then((quote) => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(quote)
                    })
                    .catch(() => {
                        if (requestId === sessionRefreshRequestRef.current) setTaxQuote(null)
                    })
                return true
            })
            .catch((error) => {
                if (requestId !== sessionRefreshRequestRef.current) return false
                console.error("Failed to refresh the Crater checkout session:", error)
                setCheckoutSessionPromotionCode(undefined)
                setErrorMessage(getPreparationErrorMessage(error, errors))
                return false
            })
            .finally(() => {
                if (checkoutRefreshPromiseRef.current === request) checkoutRefreshPromiseRef.current = null
                if (requestId === sessionRefreshRequestRef.current) setIsRefreshingSession(false)
            })

        checkoutRefreshPromiseRef.current = request
        return request
    }, [errors, locale])

    const refreshCheckoutSession = useCallback(() => {
        if (checkoutRefreshPromiseRef.current) return checkoutRefreshPromiseRef.current.then(() => undefined)

        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        return startCheckoutSessionRefresh(checkoutSearchParams).then(() => undefined)
    }, [searchParamsString, startCheckoutSessionRefresh])

    const updateCheckoutPromotionCode = useCallback(
        async (nextPromotionCode: string | null) => {
            if (!selectedCustomerIdRef.current) throw new Error(errors.checkoutSession)
            if (checkoutSession && checkoutSessionPromotionCode === nextPromotionCode) return "updated" as const
            const actions = promotionCodeActionsRef.current
            if (!actions) throw new Error(errors.discountSessionRequired)

            if (nextPromotionCode) await actions.apply(nextPromotionCode)
            else await actions.remove()
            setCheckoutSessionPromotionCode(nextPromotionCode)
            return "updated" as const
        },
        [checkoutSession, checkoutSessionPromotionCode, errors.checkoutSession, errors.discountSessionRequired]
    )

    const setPromotionCodeActions = useCallback((actions: CheckoutPromotionCodeActions | null) => {
        promotionCodeActionsRef.current = actions
        setPromotionCodeActionsReady(Boolean(actions))
    }, [])

    const refreshExpiredCheckoutSession = useCallback(() => {
        if (expiredRefreshAttemptsRef.current >= 1) return Promise.resolve(false)
        expiredRefreshAttemptsRef.current += 1
        return refreshCheckoutSession().then(() => true)
    }, [refreshCheckoutSession])

    const recoverCheckoutSessionLoad = useCallback(() => {
        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        const recoveryId = checkoutSearchParams.toString()

        try {
            const stored: unknown = JSON.parse(window.sessionStorage.getItem(CHECKOUT_LOAD_RECOVERY_KEY) ?? "null")
            if (stored && typeof stored === "object" && "recoveryId" in stored && "expiresAt" in stored && stored.recoveryId === recoveryId && typeof stored.expiresAt === "number" && stored.expiresAt > Date.now()) {
                return Promise.resolve(false)
            }

            window.sessionStorage.setItem(
                CHECKOUT_LOAD_RECOVERY_KEY,
                JSON.stringify({ recoveryId, expiresAt: Date.now() + CHECKOUT_LOAD_RECOVERY_TTL_MS })
            )
        } catch {
            // A reload still has a chance to recover Stripe when session storage is unavailable.
        }

        if (selectedCustomerIdRef.current) {
            saveCheckoutContactDraft({
                billingAddress: stripeBillingAddressRef.current,
                customerId: selectedCustomerIdRef.current,
                email: stripeEmailRef.current,
                searchParams: checkoutSearchParams,
                stage: stageRef.current,
            })
        }
        replaceCheckoutPage(window.location.href)
        return Promise.resolve(true)
    }, [searchParamsString])

    const markCheckoutSessionReady = useCallback(() => {
        expiredRefreshAttemptsRef.current = 0
        try {
            window.sessionStorage.removeItem(CHECKOUT_LOAD_RECOVERY_KEY)
        } catch {
            // Session recovery already succeeded; storage cleanup is best-effort.
        }
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
        setStripePricing(null)
        setStripeBillingAddress(null)
        setStripeEmail(null)
        setStripeSessionError(null)
        setStage("billingAddress")

        void (async () => {
            try {
                const availableCustomers = await getCheckoutCustomers()
                if (requestId !== sessionRefreshRequestRef.current) return
                const matchingCustomers = availableCustomers.filter((candidate) => candidate.customerType === customerType)
                const restoredCustomerId = getCheckoutContactDraftCustomerId(checkoutSearchParams)
                setHasExistingCustomers(matchingCustomers.length > 0)
                let customer = restoredCustomerId ? matchingCustomers.find((candidate) => candidate.id === restoredCustomerId) : undefined
                if (!customer && restoredCustomerId) {
                    const restoredDraftCustomer = await createCheckoutCustomer({ checkoutKey: getOrCreateCheckoutDraftKey(customerType), customerType })
                    if (restoredDraftCustomer.id === restoredCustomerId) customer = restoredDraftCustomer
                }
                customer ??= matchingCustomers[0] ?? (await createCheckoutCustomer({ checkoutKey: getOrCreateCheckoutDraftKey(customerType), customerType }))
                if (requestId !== sessionRefreshRequestRef.current) return
                setCustomers(matchingCustomers)
                selectedCustomerIdRef.current = customer.id
                setSelectedCustomerId(customer.id)

                const session = await createCheckoutSession({ customerId: customer.id, locale, searchParams: checkoutSearchParams })
                if (requestId !== sessionRefreshRequestRef.current) return
                const restoredContactDraft = takeCheckoutContactDraft({ customerId: customer.id, searchParams: checkoutSearchParams })
                if (restoredContactDraft) {
                    setStripeBillingAddress(restoredContactDraft.billingAddress)
                    setStripeEmail(restoredContactDraft.email)
                    setStage(restoredContactDraft.stage)
                }
                setCheckoutSession(session)
                expiredRefreshAttemptsRef.current = 0
                setCheckoutSessionPromotionCode(null)
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
                setErrorMessage(getPreparationErrorMessage(error, errors))
            } finally {
                if (requestId === sessionRefreshRequestRef.current) setIsLoading(false)
            }
        })()
    }, [authenticated, content, customerType, errors, locale, preparationAttempt, searchParamsString, setStage])

    const selectCheckoutCustomer = useCallback(
        async (customerId: string | null) => {
            if (isLoading || isRefreshingSession) return

            const requestId = ++sessionRefreshRequestRef.current
            const checkoutSearchParams = new URLSearchParams(searchParamsString)
            setCheckoutSession(null)
            setTaxQuote(null)
            setStripePricing(null)
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

                selectedCustomerIdRef.current = customer.id
                setSelectedCustomerId(customer.id)

                const session = await createCheckoutSession({ customerId: customer.id, locale, searchParams: checkoutSearchParams })
                if (requestId !== sessionRefreshRequestRef.current) return
                setCheckoutSession(session)
                expiredRefreshAttemptsRef.current = 0
                setCheckoutSessionPromotionCode(null)
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
                setErrorMessage(getPreparationErrorMessage(error, errors))
            } finally {
                if (requestId === sessionRefreshRequestRef.current) setIsRefreshingSession(false)
            }
        },
        [content, customerType, customers, errors, isLoading, isRefreshingSession, locale, searchParamsString, setStage]
    )

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
        errors,
        hasExistingCustomers,
        isLoading,
        isConfirmingPayment,
        isRefreshingSession,
        isSessionLoading,
        retryPreparation,
        markCheckoutSessionReady,
        promotionCodeActionsReady,
        refreshExpiredCheckoutSession,
        recoverCheckoutSessionLoad,
        resolvedError,
        selectedCustomerId,
        selectCheckoutCustomer,
        sessionError,
        setStripeBillingAddress,
        setStripeEmail,
        setStripeSessionError,
        setStripePricing,
        setPromotionCodeActions,
        setTaxQuote,
        setIsConfirmingPayment,
        stripeBillingAddress,
        stripeEmail,
        stripeSessionError,
        stripePricing,
        taxQuote,
        updateCheckoutPromotionCode,
    }
}

type CheckoutFormState = ReturnType<typeof useCreateCheckoutFormState>

const CheckoutFormContext = createContext<CheckoutFormState | null>(null)

export function CheckoutFormProvider({
    children,
    content,
    errors,
    locale,
}: {
    children: ReactNode
    content: CheckoutFormContent
    errors: ErrorsContent
    locale: AppLocale
}) {
    const state = useCreateCheckoutFormState(content, errors, locale)
    return <CheckoutFormContext.Provider value={state}>{children}</CheckoutFormContext.Provider>
}

export function useCheckoutFormState() {
    const context = useContext(CheckoutFormContext)
    if (!context) throw new Error("useCheckoutFormState must be used within a CheckoutFormProvider")
    return context
}

export function useOptionalCheckoutFormState() {
    return useContext(CheckoutFormContext)
}
