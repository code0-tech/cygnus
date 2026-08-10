"use client"

import { useCraterSession } from "@/components/checkout/CraterSessionProvider"
import { useCheckoutStage } from "@/components/checkout/CheckoutStepper"
import type { CheckoutData } from "@/lib/cms"
import { createBillingDetailsValidation, createEmptyBillingDetails, type BillingDetails } from "@/lib/checkout/billingDetails"
import { resolveCraterCustomerType } from "@/lib/checkout/craterCustomer"
import { createCheckoutSession, prepareCheckoutSession, type CheckoutSessionData } from "@/lib/checkout/checkoutSubmission"
import type { AppLocale } from "@/lib/i18n"
import { useForm } from "@code0-tech/pictor"
import { useSearchParams } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

type CheckoutFormContent = CheckoutData["form"]

function useCreateCheckoutFormState(content: CheckoutFormContent, locale: AppLocale) {
    const searchParams = useSearchParams()
    const { setStage } = useCheckoutStage()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionData | null>(null)
    const [checkoutSessionPromotionCode, setCheckoutSessionPromotionCode] = useState<string | null | undefined>(undefined)
    const [isRefreshingSession, setIsRefreshingSession] = useState(false)
    const [mobileStep, setMobileStep] = useState(0)
    const [isStripeAddressComplete, setIsStripeAddressComplete] = useState(false)
    const sessionRefreshRequestRef = useRef(0)
    const { error: sessionError, isLoading: isSessionLoading, token: sessionToken } = useCraterSession()
    const customerType = resolveCraterCustomerType(searchParams.get("customerType"))
    const initialValues = useMemo(createEmptyBillingDetails, [])
    const validation = useMemo(() => createBillingDetailsValidation(customerType, false), [customerType])
    const searchParamsString = searchParams.toString()
    const promotionCode = searchParams.get("promotionCode")?.trim() || null

    const [inputs, validate, values] = useForm({
        useInitialValidation: false,
        initialValues,
        validate: validation,
        onSubmit: (values: BillingDetails) => {
            if (isLoading) return

            setIsLoading(true)
            setErrorMessage(null)

            void (async () => {
                try {
                    if (!sessionToken) {
                        throw new Error(sessionError ?? "A Crater session is required.")
                    }

                    const checkoutSearchParams = new URLSearchParams(searchParamsString)
                    const session = await prepareCheckoutSession({ values, customerType, locale, searchParams: checkoutSearchParams, sessionToken })
                    setCheckoutSession(session)
                    setCheckoutSessionPromotionCode(checkoutSearchParams.get("promotionCode")?.trim() || null)
                    setIsStripeAddressComplete(false)
                    setStage("billingAddress")
                    setIsLoading(false)
                } catch (error) {
                    console.error("Failed to start Crater checkout:", error)
                    setErrorMessage(error instanceof Error ? error.message : content.paymentErrorFallback || "Checkout failed.")
                    setIsLoading(false)
                    setStage("billingAddress")
                }
            })()
        },
    })

    useEffect(() => {
        if (checkoutSessionPromotionCode === undefined || checkoutSessionPromotionCode === promotionCode || !sessionToken) return

        const requestId = ++sessionRefreshRequestRef.current
        const checkoutSearchParams = new URLSearchParams(searchParamsString)
        setCheckoutSession(null)
        setIsRefreshingSession(true)
        setErrorMessage(null)
        setIsStripeAddressComplete(false)
        setStage("billingAddress")

        void createCheckoutSession({ locale, searchParams: checkoutSearchParams, sessionToken })
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
    }, [checkoutSessionPromotionCode, content.paymentErrorFallback, locale, promotionCode, searchParamsString, sessionToken, setStage])

    const resetCheckout = () => {
        sessionRefreshRequestRef.current += 1
        setCheckoutSession(null)
        setCheckoutSessionPromotionCode(undefined)
        setIsRefreshingSession(false)
        setIsStripeAddressComplete(false)
        setStage("billingAddress")
    }

    return {
        checkoutSession,
        content,
        customerType,
        errorMessage,
        inputs,
        isLoading,
        isRefreshingSession,
        isSessionLoading,
        isStripeAddressComplete,
        mobileStep,
        resetCheckout,
        sessionError,
        sessionToken,
        setIsStripeAddressComplete,
        setMobileStep,
        validate,
        values,
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
