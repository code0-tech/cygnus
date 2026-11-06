"use client"

import { loadStripe } from "@stripe/stripe-js/pure"
import type { Stripe } from "@stripe/stripe-js"
import { createContext, useContext, useMemo, type ReactNode } from "react"

type StripeMode = "checkout" | "paymentMethod"
type StripePromise = Promise<Stripe | null> | null
const StripeContext = createContext<((mode: StripeMode) => StripePromise) | null>(null)

export function StripeProvider({ children, publicKey }: { children: ReactNode; publicKey: string | null }) {
    const getStripe = useMemo(() => {
        const promises = new Map<StripeMode, StripePromise>()
        return (mode: StripeMode): StripePromise => {
            if (!publicKey) return null
            if (!promises.has(mode)) {
                promises.set(mode, mode === "checkout" ? loadStripe(publicKey, { betas: ["custom_checkout_tax_id_1"], locale: "en" }) : loadStripe(publicKey))
            }
            return promises.get(mode) ?? null
        }
    }, [publicKey])

    return <StripeContext.Provider value={getStripe}>{children}</StripeContext.Provider>
}

export function useStripePromise(mode: StripeMode = "paymentMethod") {
    const getStripe = useContext(StripeContext)
    return useMemo(() => getStripe?.(mode) ?? null, [getStripe, mode])
}
