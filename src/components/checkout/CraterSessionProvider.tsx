"use client"

import { readSagittariusToken, removeSagittariusToken } from "@/lib/checkout/checkoutLogin"
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
    const sagittariusTokenRef = useRef<string | undefined>(undefined)
    const hasReadSagittariusTokenRef = useRef(false)
    const [session, setSession] = useState<CraterSessionContextValue>({
        authenticated: false,
        error: null,
        isLoading: true,
    })

    useEffect(() => {
        let active = true

        if (!hasReadSagittariusTokenRef.current) {
            const currentUrl = new URL(window.location.href)
            sagittariusTokenRef.current = readSagittariusToken(currentUrl.searchParams)
            hasReadSagittariusTokenRef.current = true

            if (sagittariusTokenRef.current) {
                const sanitizedUrl = removeSagittariusToken(currentUrl)
                window.history.replaceState(window.history.state, "", `${sanitizedUrl.pathname}${sanitizedUrl.search}${sanitizedUrl.hash}`)
            }
        }

        const readError = async (response: Response, fallback: string) => {
            const body: unknown = await response.json().catch(() => null)
            return body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : fallback
        }

        const createSession = async (sagittariusToken?: string) => {
            const response = await fetch("/api/crater/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sagittariusToken ? { sagittariusToken } : {}),
                credentials: "same-origin",
                referrerPolicy: "no-referrer",
            })
            if (!response.ok) throw new Error(await readError(response, "Failed to create a Crater session."))
        }

        const restoreOrCreateSession = async () => {
            if (sagittariusTokenRef.current) {
                await createSession(sagittariusTokenRef.current)
                return
            }

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
