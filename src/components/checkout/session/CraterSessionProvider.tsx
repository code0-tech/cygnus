"use client"

import { hasCheckoutConfiguration } from "@/lib/checkout/checkoutLogin"
import { bootstrapCheckout, restoreCraterSession, type CheckoutCustomerPage } from "@/lib/checkout/client"
import { clearCraterUserLoginMarker, hasCraterUserLoginMarker } from "@/lib/crater/userLogin.client"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

interface CraterSessionContextValue {
    guestEmail?: string | null
    authenticated: boolean
    error: string | null
    isLoading: boolean
    takeBootstrapCustomers?: () => CheckoutCustomerPage | null
}

const SESSION_RECHECK_INTERVAL_MS = 60_000

const CraterSessionContext = createContext<CraterSessionContextValue>({
    authenticated: false,
    error: null,
    isLoading: true,
})

export function CraterSessionProvider({ children, errorMessage = "An unexpected error occurred." }: { children: ReactNode; errorMessage?: string }) {
    const sessionRequestRef = useRef<Promise<"redirecting" | { guestEmail: string | null } | undefined> | null>(null)
    const bootstrapCustomersRef = useRef<CheckoutCustomerPage | null>(null)
    const takeBootstrapCustomers = useCallback(() => {
        const page = bootstrapCustomersRef.current
        bootstrapCustomersRef.current = null
        return page
    }, [])
    const [session, setSession] = useState<CraterSessionContextValue>({
        authenticated: false,
        error: null,
        isLoading: true,
    })

    useEffect(() => {
        let active = true
        let checking = false
        let lastCheckedAt = 0

        const currentUrl = new URL(window.location.href)
        if (currentUrl.searchParams.get("authError") === "session") {
            currentUrl.searchParams.delete("authError")
            window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
            setSession({ authenticated: false, error: errorMessage, isLoading: false })
            return () => {
                active = false
            }
        }

        const restoreOrCreateSession = async (recheck: boolean) => {
            const currentUrl = new URL(window.location.href)
            // On the checkout itself the first check also loads the customers, saving the form a sequential request.
            // Rechecks and other pages only need to know whether the session is still valid.
            const isCheckoutPage = currentUrl.pathname.replace(/\/$/, "").endsWith("/checkout")
            let restoredSession: { guestEmail: string | null } | null
            if (isCheckoutPage && !recheck) {
                const bootstrap = await bootstrapCheckout()
                bootstrapCustomersRef.current = bootstrap?.customerPage ?? null
                restoredSession = bootstrap
            } else {
                restoredSession = await restoreCraterSession()
            }
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
                const target = hasCheckoutConfiguration(currentUrl.searchParams) ? `${checkoutPath}/login${currentUrl.search}` : `${checkoutPath.slice(0, -"/checkout".length)}/subscription`
                window.location.assign(target)
                return "redirecting" as const
            }
            throw new Error("The Crater checkout session is missing or has expired.")
        }

        const login = async (recheck = false) => {
            if (checking) return
            checking = true
            if (recheck) sessionRequestRef.current = null
            try {
                sessionRequestRef.current ??= restoreOrCreateSession(recheck)

                const outcome = await sessionRequestRef.current
                if (!active || outcome === "redirecting") return

                const guestEmail = outcome?.guestEmail ?? null
                setSession((current) =>
                    current.authenticated && !current.error && !current.isLoading && current.guestEmail === guestEmail ? current : { authenticated: true, guestEmail, error: null, isLoading: false }
                )
            } catch (error) {
                if (!active) return

                console.error("Failed to authenticate the Crater checkout session:", error)

                setSession({
                    authenticated: false,
                    error: errorMessage,
                    isLoading: false,
                })
            } finally {
                checking = false
                lastCheckedAt = Date.now()
            }
        }

        const recheckOnReturn = () => {
            if (document.visibilityState === "hidden" || Date.now() - lastCheckedAt < SESSION_RECHECK_INTERVAL_MS) return
            void login(true)
        }

        void login()
        window.addEventListener("focus", recheckOnReturn)
        document.addEventListener("visibilitychange", recheckOnReturn)
        return () => {
            active = false
            window.removeEventListener("focus", recheckOnReturn)
            document.removeEventListener("visibilitychange", recheckOnReturn)
        }
    }, [errorMessage])

    const value = useMemo(() => ({ ...session, takeBootstrapCustomers }), [session, takeBootstrapCustomers])
    return <CraterSessionContext.Provider value={value}>{children}</CraterSessionContext.Provider>
}

export function useCraterSession() {
    return useContext(CraterSessionContext)
}
