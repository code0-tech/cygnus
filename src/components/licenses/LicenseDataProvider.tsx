"use client"

import { EMPTY_LICENSE_DASHBOARD_DATA, type LicenseDashboardData } from "@/lib/licenses/licenseTypes"
import { readCraterSessionToken, removeCraterSessionToken } from "@/lib/checkout/craterSession"
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react"

interface LicenseDataContextValue extends LicenseDashboardData {
    isLoading: boolean
}

const LicenseDataContext = createContext<LicenseDataContextValue | null>(null)

export function LicenseDataProvider({ children, redirectUrl }: { children: ReactNode; redirectUrl: string }) {
    const sessionTokenRef = useRef<string | null>(null)
    const [data, setData] = useState<LicenseDashboardData>(EMPTY_LICENSE_DASHBOARD_DATA)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const controller = new AbortController()
        const currentUrl = new URL(window.location.href)
        const sessionToken = sessionTokenRef.current ?? readCraterSessionToken(currentUrl)

        if (!sessionToken) {
            window.location.replace(redirectUrl)
            return () => controller.abort()
        }

        sessionTokenRef.current = sessionToken
        if (currentUrl.searchParams.has("token")) {
            window.history.replaceState(window.history.state, "", removeCraterSessionToken(currentUrl).toString())
        }

        void fetch("/api/crater/licenses", {
            cache: "no-store",
            credentials: "same-origin",
            headers: {
                authorization: `Session ${sessionToken}`,
            },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (response.status === 401 || response.status === 403) {
                    window.location.replace(redirectUrl)
                    return null
                }
                if (!response.ok) throw new Error(`Could not load the license dashboard (${response.status}).`)
                return (await response.json()) as LicenseDashboardData
            })
            .then((nextData) => {
                if (nextData) setData(nextData)
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return
                console.error("Failed to load the license dashboard:", error)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [redirectUrl])

    return <LicenseDataContext.Provider value={{ ...data, isLoading }}>{children}</LicenseDataContext.Provider>
}

export function useLicenseData() {
    const context = useContext(LicenseDataContext)
    if (!context) throw new Error("useLicenseData must be used inside LicenseDataProvider.")
    return context
}
