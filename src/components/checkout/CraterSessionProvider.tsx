"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

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
    const [session, setSession] = useState<CraterSessionContextValue>({
        error: null,
        isLoading: true,
        token: null,
    })

    useEffect(() => {
        const controller = new AbortController()

        const login = async () => {
            try {
                const response = await fetch("/api/crater/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                    signal: controller.signal,
                })
                const body: unknown = await response.json()

                if (!response.ok) {
                    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Failed to create a Crater session."
                    throw new Error(message)
                }

                const token = body && typeof body === "object" && "token" in body && typeof body.token === "string" ? body.token : null
                if (!token) throw new Error("Crater returned no session token.")

                setSession({ error: null, isLoading: false, token })
            } catch (error) {
                if (controller.signal.aborted) return

                setSession({
                    error: error instanceof Error ? error.message : "Failed to create a Crater session.",
                    isLoading: false,
                    token: null,
                })
            }
        }

        login()
        return () => controller.abort()
    }, [])

    return <CraterSessionContext.Provider value={session}>{children}</CraterSessionContext.Provider>
}

export function useCraterSession() {
    return useContext(CraterSessionContext)
}
