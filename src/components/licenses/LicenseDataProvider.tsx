"use client"

import { EMPTY_LICENSE_DASHBOARD_DATA, type LicenseDashboardData } from "@/lib/licenses/licenseTypes"
import { readCraterSessionToken, removeCraterSessionToken } from "@/lib/checkout/craterSession"
import type { AppLocale } from "@/lib/i18n"
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react"

interface LicenseDataContextValue extends LicenseDashboardData {
    error: string | null
    isLoading: boolean
    reload: () => void
    updateCustomer: (id: string, values: { email?: string; name?: string }) => void
    updateLicense: (id: string, values: { namespaceId?: string; updatedAt?: string }) => void
}

const LicenseDataContext = createContext<LicenseDataContextValue | null>(null)

export function LicenseDataProvider({ children, loadError, locale, redirectUrl }: { children: ReactNode; loadError: string; locale: AppLocale; redirectUrl: string }) {
    const sessionTokenRef = useRef<string | null>(null)
    const [data, setData] = useState<LicenseDashboardData>(EMPTY_LICENSE_DASHBOARD_DATA)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const reload = () => setReloadKey((current) => current + 1)

    const updateCustomer: LicenseDataContextValue["updateCustomer"] = (id, values) => {
        setData((current) => ({
            ...current,
            customers: current.customers.map((customer) => (customer.id === id ? { ...customer, ...values } : customer)),
            licenses: current.licenses.map((license) =>
                license.customerId === id ? { ...license, customerName: values.name || values.email || license.customerName } : license
            ),
        }))
    }

    const updateLicense: LicenseDataContextValue["updateLicense"] = (id, values) => {
        setData((current) => ({
            ...current,
            licenses: current.licenses.map((license) => (license.id === id ? { ...license, ...values } : license)),
        }))
    }

    useEffect(() => {
        const controller = new AbortController()
        setError(null)
        setIsLoading(true)
        const currentUrl = new URL(window.location.href)
        const sessionToken = sessionTokenRef.current ?? readCraterSessionToken(currentUrl)

        if (!sessionToken) {
            const accessUrl = new URL("/api/crater/licenses/access", currentUrl.origin)
            const returnUrl = removeCraterSessionToken(currentUrl)
            accessUrl.searchParams.set("locale", locale)
            accessUrl.searchParams.set("returnPath", `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`)
            window.location.replace(accessUrl)
            return () => controller.abort()
        }

        sessionTokenRef.current = sessionToken
        const shouldRemoveToken = currentUrl.searchParams.has("token")

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
                if (!response.ok) throw new Error(loadError)
                return (await response.json()) as LicenseDashboardData
            })
            .then((nextData) => {
                if (!nextData) return
                setData(nextData)
                if (shouldRemoveToken) {
                    window.history.replaceState(window.history.state, "", removeCraterSessionToken(currentUrl).toString())
                }
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return
                console.error(loadError, error)
                setError(loadError)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [loadError, locale, redirectUrl, reloadKey])

    return <LicenseDataContext.Provider value={{ ...data, error, isLoading, reload, updateCustomer, updateLicense }}>{children}</LicenseDataContext.Provider>
}

export function useLicenseData() {
    const context = useContext(LicenseDataContext)
    if (!context) throw new Error("useLicenseData must be used inside LicenseDataProvider.")
    return context
}
