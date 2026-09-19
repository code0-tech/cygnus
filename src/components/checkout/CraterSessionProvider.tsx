"use client"

import { checkoutFetch } from "@/lib/checkout/checkoutClient"
import { clearCraterUserLoginMarker, hasCraterUserLoginMarker } from "@/lib/checkout/craterUserLogin"
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

        // Only ever reaches console.error; the user always sees the configured CMS message. Crater's errorCode is the
        // one field that says why a login failed, so dropping it would leave the console with nothing actionable.
        const readError = async (response: Response, fallback: string) => {
            const body: unknown = await response.json().catch(() => null)
            if (!body || typeof body !== "object") return fallback

            const payload = body as Record<string, unknown>
            const message = typeof payload.error === "string" ? payload.error : fallback
            const errorCode = typeof payload.errorCode === "string" ? payload.errorCode : null
            const details = Array.isArray(payload.details) ? payload.details.filter((detail): detail is string => typeof detail === "string") : []
            const diagnostics = [errorCode, details.join(", ")].filter(Boolean)

            return diagnostics.length ? `${message} (${diagnostics.join(": ")})` : message
        }

        const createSession = async () => {
            const response = await checkoutFetch("/api/crater/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "same-origin",
                referrerPolicy: "no-referrer",
            })
            if (!response.ok) throw new Error(await readError(response, "Failed to create a Crater session."))
        }

        const restoreOrCreateSession = async () => {
            const statusResponse = await checkoutFetch("/api/crater/auth/session", {
                credentials: "same-origin",
                cache: "no-store",
            })
            if (statusResponse.ok) {
                const body: unknown = await statusResponse.json()
                const guestEmail = currentUrl.searchParams.has("guestCheckout") && body && typeof body === "object" && "guestEmail" in body && typeof body.guestEmail === "string" ? body.guestEmail : null
                return { guestEmail }
            }
            if (statusResponse.status !== 401 && statusResponse.status !== 403) {
                throw new Error(await readError(statusResponse, "Failed to validate the Crater session."))
            }

            if (currentUrl.searchParams.has("guestCheckout")) {
                // Never substitute an account or shared session for an expired guest purchase.
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

            await createSession()
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
