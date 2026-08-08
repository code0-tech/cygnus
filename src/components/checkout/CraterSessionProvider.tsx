"use client"

import { readSagittariusToken, removeSagittariusToken } from "@/lib/checkout/checkoutLogin"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface CraterSessionContextValue {
    error: string | null
    isLoading: boolean
    token: string | null
}

const CraterSessionContext = createContext<CraterSessionContextValue>({
    error: null,
    isLoading: true,
    token: null,
})

export function CraterSessionProvider({ children }: { children: ReactNode }) {
    const loginRequestRef = useRef<Promise<string> | null>(null)
    const sagittariusTokenRef = useRef<string | undefined>(undefined)
    const hasReadSagittariusTokenRef = useRef(false)
    const [session, setSession] = useState<CraterSessionContextValue>({
        error: null,
        isLoading: true,
        token: null,
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

        const login = async () => {
            try {
                if (!loginRequestRef.current) {
                    loginRequestRef.current = (async () => {
                        const response = await fetch("/api/crater/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(sagittariusTokenRef.current ? { sagittariusToken: sagittariusTokenRef.current } : {}),
                            referrerPolicy: "no-referrer",
                        })
                        const body: unknown = await response.json()

                        if (!response.ok) {
                            const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Failed to create a Crater session."
                            throw new Error(message)
                        }

                        const token = body && typeof body === "object" && "token" in body && typeof body.token === "string" ? body.token : null
                        if (!token) throw new Error("Crater returned no session token.")

                        return token
                    })()
                }

                const token = await loginRequestRef.current
                if (!active) return

                setSession({ error: null, isLoading: false, token })
            } catch (error) {
                if (!active) return

                setSession({
                    error: error instanceof Error ? error.message : "Failed to create a Crater session.",
                    isLoading: false,
                    token: null,
                })
            }
        }

        login()
        return () => {
            active = false
        }
    }, [])

    return <CraterSessionContext.Provider value={session}>{children}</CraterSessionContext.Provider>
}

export function useCraterSession() {
    return useContext(CraterSessionContext)
}
