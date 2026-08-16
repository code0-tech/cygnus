"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface CraterSessionContextValue {
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
    const sessionRequestRef = useRef<Promise<void> | null>(null)
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
            const response = await fetch("/api/crater/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "same-origin",
                referrerPolicy: "no-referrer",
            })
            if (!response.ok) throw new Error(await readError(response, "Failed to create a Crater session."))
        }

        const restoreOrCreateSession = async () => {
            const statusResponse = await fetch("/api/crater/auth/session", {
                credentials: "same-origin",
                cache: "no-store",
            })
            if (statusResponse.ok) return
            if (statusResponse.status !== 401 && statusResponse.status !== 403) {
                throw new Error(await readError(statusResponse, "Failed to validate the Crater session."))
            }

            await createSession()
        }

        const login = async () => {
            try {
                sessionRequestRef.current ??= restoreOrCreateSession()

                await sessionRequestRef.current
                if (!active) return

                setSession({ authenticated: true, error: null, isLoading: false })
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
