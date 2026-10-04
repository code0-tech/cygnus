"use client"

import type { CheckoutData, ErrorsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createContext, useContext, type ReactNode } from "react"
import { useCheckoutForm } from "./useCheckoutForm"

type CheckoutFormContent = CheckoutData["form"]
type CheckoutFormState = ReturnType<typeof useCheckoutForm>

const CheckoutFormContext = createContext<CheckoutFormState | null>(null)

interface CheckoutFormProviderProps {
    children: ReactNode
    content: CheckoutFormContent
    errors: ErrorsContent
    locale: AppLocale
}

export function CheckoutFormProvider({ children, content, errors, locale }: CheckoutFormProviderProps) {
    const state = useCheckoutForm(content, errors, locale)
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
