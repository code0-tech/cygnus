"use client"

import { createCraterSession, restoreCraterSession } from "@/lib/checkout/client"
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

            const checkoutPath = window.location.pathname.replace(/\/$/, "")
            if (checkoutPath.endsWith("/checkout") && hasCraterUserLoginMarker()) {
                clearCraterUserLoginMarker()
                window.location.assign(`${checkoutPath}/login${window.location.search}`)
                return "redirecting" as const
            }

            await createCraterSession()
            return undefined
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
