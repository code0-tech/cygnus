"use client"

import { EMPTY_LICENSE_DASHBOARD_DATA, type LicenseDashboardCustomerAddress, type LicenseDashboardData, type LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import { readCraterSessionToken, removeCraterSessionToken } from "@/lib/checkout/craterSession"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { usePathname } from "next/navigation"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react"

const AUTO_REFRESH_INTERVAL_MS = 30_000

interface LicenseDataContextValue extends LicenseDashboardData {
    error: string | null
    isLoading: boolean
    isRefreshing: boolean
    isSidebarLoading: boolean
    reload: () => void
    sidebarLicenses: LicenseDashboardLicense[]
    updateCustomer: (id: string, values: { address?: LicenseDashboardCustomerAddress; email?: string; name?: string; phone?: string }) => void
    updateLicense: (id: string, values: { namespaceId?: string; updatedAt?: string }) => void
}

const LicenseDataContext = createContext<LicenseDataContextValue | null>(null)

export function LicenseDataProvider({ children, loadError, locale, redirectUrl }: { children: ReactNode; loadError: string; locale: AppLocale; redirectUrl: string }) {
    const pathname = usePathname()
    const sessionTokenRef = useRef<string | null>(null)
    const loadedPathRef = useRef<string | null>(null)
    const [data, setData] = useState<LicenseDashboardData>(EMPTY_LICENSE_DASHBOARD_DATA)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const reload = useCallback(() => setReloadKey((current) => current + 1), [])

    const updateCustomer: LicenseDataContextValue["updateCustomer"] = (id, values) => {
        setData((current) => ({
            ...current,
            customers: current.customers.map((customer) => (customer.id === id ? { ...customer, ...values } : customer)),
            licenses: current.licenses.map((license) => (license.customerId === id ? { ...license, customerName: values.name || values.email || id } : license)),
            navigationLicenses: current.navigationLicenses?.map((license) => (license.customerId === id ? { ...license, customerName: values.name || values.email || id } : license)),
        }))
    }

    const updateLicense: LicenseDataContextValue["updateLicense"] = (id, values) => {
        setData((current) => ({
            ...current,
            licenses: current.licenses.map((license) => (license.id === id ? { ...license, ...values } : license)),
            navigationLicenses: current.navigationLicenses?.map((license) => (license.id === id ? { ...license, ...values } : license)),
        }))
    }

    useEffect(() => {
        const controller = new AbortController()
        const isInitialPathLoad = loadedPathRef.current !== pathname
        setError(null)
        if (isInitialPathLoad) setIsLoading(true)
        else setIsRefreshing(true)
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

        const dataUrl = new URL("/api/crater/licenses", currentUrl.origin)
        const pathSegments = pathname.split("/").filter(Boolean)
        const customerSegmentIndex = pathSegments.indexOf("customer")
        const licenseSegmentIndex = pathSegments.indexOf("license")

        if (customerSegmentIndex >= 0 && pathSegments[customerSegmentIndex + 1]) {
            dataUrl.searchParams.set("view", licenseSegmentIndex >= 0 ? "license" : "customer")
            dataUrl.searchParams.set("customerId", decodeLicenseRouteId(pathSegments[customerSegmentIndex + 1]))
            if (licenseSegmentIndex >= 0 && pathSegments[licenseSegmentIndex + 1]) {
                dataUrl.searchParams.set("licenseId", decodeLicenseRouteId(pathSegments[licenseSegmentIndex + 1]))
            }
        }

        void fetch(dataUrl, {
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
                setHasLoadedOnce(true)
                loadedPathRef.current = pathname
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
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                    setIsRefreshing(false)
                }
            })

        return () => controller.abort()
    }, [loadError, locale, pathname, redirectUrl, reloadKey])

    useEffect(() => {
        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") reload()
        }
        const interval = window.setInterval(refreshWhenVisible, AUTO_REFRESH_INTERVAL_MS)
        window.addEventListener("focus", refreshWhenVisible)
        document.addEventListener("visibilitychange", refreshWhenVisible)

        return () => {
            window.clearInterval(interval)
            window.removeEventListener("focus", refreshWhenVisible)
            document.removeEventListener("visibilitychange", refreshWhenVisible)
        }
    }, [reload])

    return (
        <LicenseDataContext.Provider
            value={{
                ...data,
                error,
                isLoading,
                isRefreshing,
                isSidebarLoading: isLoading && !hasLoadedOnce,
                reload,
                sidebarLicenses: data.navigationLicenses ?? data.licenses,
                updateCustomer,
                updateLicense,
            }}
        >
            {children}
        </LicenseDataContext.Provider>
    )
}

export function useLicenseData() {
    const context = useContext(LicenseDataContext)
    if (!context) throw new Error("useLicenseData must be used inside LicenseDataProvider.")
    return context
}
