"use client"

import { hasCheckoutConfiguration } from "@/lib/checkout/checkoutLogin"
import { restoreCraterSession } from "@/lib/checkout/client"
import { clearCraterUserLoginMarker, hasCraterUserLoginMarker } from "@/lib/crater/userLogin.client"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface CraterSessionContextValue {
    guestEmail?: string | null
    authenticated: boolean
    error: string | null
    isLoading: boolean
}

const CraterSessionContext = createContext<CraterSessionContextValue>({
    authenticated: false,
    error: null,
    isLoading: true,
})

export function CraterSessionProvider({ children, errorMessage = "An unexpected error occurred." }: { children: ReactNode; errorMessage?: string }) {
    const sessionRequestRef = useRef<Promise<"redirecting" | { guestEmail: string | null } | undefined> | null>(null)
    const [session, setSession] = useState<CraterSessionContextValue>({
        authenticated: false,
        error: null,
        isLoading: true,
    })

    useEffect(() => {
        let active = true

        const currentUrl = new URL(window.location.href)
        if (currentUrl.searchParams.get("authError") === "session") {
            currentUrl.searchParams.delete("authError")
            window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
            setSession({ authenticated: false, error: errorMessage, isLoading: false })
            return () => {
                active = false
            }
        }

        const restoreOrCreateSession = async () => {
            const restoredSession = await restoreCraterSession()
            if (restoredSession) return { guestEmail: currentUrl.searchParams.has("guestCheckout") ? restoredSession.guestEmail : null }

            if (currentUrl.searchParams.has("guestCheckout")) {
                const checkoutPath = currentUrl.pathname.replace(/\/$/, "")
                if (checkoutPath.endsWith("/checkout")) {
                    currentUrl.searchParams.delete("guestCheckout")
                    window.location.assign(`${checkoutPath}/login${currentUrl.search}`)
                    return "redirecting" as const
                }
                throw new Error("The guest checkout session has expired.")
            }

            // Without a Crater session the checkout cannot continue: send the visitor to the login choice, or
            // back to the subscription configurator when there is no configuration to check out.
            if (hasCraterUserLoginMarker()) clearCraterUserLoginMarker()
            const checkoutPath = currentUrl.pathname.replace(/\/$/, "")
            if (checkoutPath.endsWith("/checkout")) {
                const target = hasCheckoutConfiguration(currentUrl.searchParams)
                    ? `${checkoutPath}/login${currentUrl.search}`
                    : `${checkoutPath.slice(0, -"/checkout".length)}/subscription`
                window.location.assign(target)
                return "redirecting" as const
            }
            throw new Error("The Crater checkout session is missing or has expired.")
        }

        const login = async () => {
            try {
                sessionRequestRef.current ??= restoreOrCreateSession()

                const outcome = await sessionRequestRef.current
                if (!active || outcome === "redirecting") return

                setSession({ authenticated: true, guestEmail: outcome?.guestEmail ?? null, error: null, isLoading: false })
            } catch (error) {
                if (!active) return

                console.error("Failed to authenticate the Crater checkout session:", error)

                setSession({
                    authenticated: false,
                    error: errorMessage,
                    isLoading: false,
                })
            }
        }

        login()
        return () => {
            active = false
        }
    }, [errorMessage])

    return <CraterSessionContext.Provider value={session}>{children}</CraterSessionContext.Provider>
}

export function useCraterSession() {
    return useContext(CraterSessionContext)
}
