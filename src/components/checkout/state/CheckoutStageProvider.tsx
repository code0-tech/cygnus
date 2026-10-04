"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type CheckoutStage = "billingAddress" | "payment"

interface CheckoutStageContextValue {
    hasError: boolean
    setHasError: (hasError: boolean) => void
    setStage: (stage: CheckoutStage) => void
    stage: CheckoutStage
}

const CheckoutStageContext = createContext<CheckoutStageContextValue | null>(null)

export function CheckoutStageProvider({ children }: { children: ReactNode }) {
    const [stage, setStage] = useState<CheckoutStage>("billingAddress")
    const [hasError, setHasError] = useState(false)
    const value = useMemo(() => ({ stage, setStage, hasError, setHasError }), [stage, hasError])

    return <CheckoutStageContext.Provider value={value}>{children}</CheckoutStageContext.Provider>
}

export function useCheckoutStage() {
    const context = useContext(CheckoutStageContext)
    if (!context) throw new Error("useCheckoutStage must be used within a CheckoutStageProvider")
    return context
}
