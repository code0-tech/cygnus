"use client"

import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout"
import { loadStripe } from "@stripe/stripe-js"
import { usePathname } from "next/navigation"
import { ReactNode, useMemo } from "react"

const stripePromise = loadStripe("pk_test_51TAW1WGWi4696rp6dUs0QXE1rOy0tlj5BBvHzWApIcNVypMCHZMVQHgfKaXaIcRPFYYHW5z1nE2kTnSIC9XGSGrr00rYBtKmAe")

export function CheckoutProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isCheckoutRoute = pathname?.includes("/checkout") && !pathname?.includes("/checkout/success")

    const clientSecret = useMemo(() => {
        if (!isCheckoutRoute || typeof window === "undefined") return null

        const requestBody = Object.fromEntries(new URLSearchParams(window.location.search).entries())

        return fetch("/api/create-checkout-session", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(requestBody),
        }).then(async (response) => {
            const json = await response.json()
            if (!response.ok) {
                throw new Error(json.error ?? "Could not create checkout session.")
            }
            return json.clientSecret
        })
    }, [isCheckoutRoute])

    if (!clientSecret) return <>{children}</>

    return (
        <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
            {children}
        </CheckoutElementsProvider>
    )
}
