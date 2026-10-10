"use client"

import { fetchLicenseDashboard } from "@/lib/licenses/client"
import { EMPTY_LICENSE_DASHBOARD_DATA, type LicenseDashboardCustomerAddress, type LicenseDashboardData, type LicenseDashboardLicense } from "@/lib/licenses/types"
import { deriveLicenseStatus } from "@/lib/licenses/dashboardMapper"
import type { DashboardSubscriptionStatus, SubscriptionPendingUpdate } from "@/lib/licenses/types"
import { usePathname } from "next/navigation"
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react"

const FOCUS_REFRESH_STALE_MS = 5 * 60_000

interface LicenseDataContextValue extends LicenseDashboardData {
    error: string | null
    isLoading: boolean
    isRefreshing: boolean
    isSidebarLoading: boolean
    loadingMore: "customers" | "invoices" | "licenses" | null
    loadMore: (resource: "customers" | "invoices" | "licenses") => Promise<void>
    reload: () => void
    sidebarLicenses: LicenseDashboardLicense[]
    updateCustomer: (id: string, values: { address?: LicenseDashboardCustomerAddress; email?: string; name?: string; phone?: string }) => void
    updateLicense: (
        id: string,
        values: {
            aiTokens?: number
            canceledAt?: string | null
            cancelAt?: string | null
            namespaceId?: string | null
            namespaceName?: string | null
            immediateCancellationAvailable?: boolean
            immediateCancellationUntil?: string
            paymentMethodId?: string
            paymentPeriod?: string
            plan?: string
            pendingUpdate?: SubscriptionPendingUpdate | null
            subscriptionStatus?: DashboardSubscriptionStatus
            updatedAt?: string
            workflowExecutions?: number
        }
    ) => void
}

const LicenseDataContext = createContext<LicenseDataContextValue | null>(null)

type PaginatedResource = "customers" | "invoices" | "licenses"

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
    const merged = new Map(current.map((item) => [item.id, item]))
    for (const item of incoming) merged.set(item.id, item)
    return [...merged.values()]
}

function mergeLicensePages(current: LicenseDashboardLicense[], incoming: LicenseDashboardLicense[]) {
    const merged = new Map(current.map((license) => [license.id, license]))
    for (const license of incoming) {
        const existing = merged.get(license.id)
        merged.set(license.id, existing ? { ...existing, ...license, invoices: mergeById(existing.invoices ?? [], license.invoices ?? []) } : license)
    }
    return [...merged.values()]
}

export function LicenseDataProvider({ children, loadError, redirectUrl }: { children: ReactNode; loadError: string; redirectUrl: string }) {
    const pathname = usePathname()
    const loadedPathRef = useRef<string | null>(null)
    const lastRequestStartedAtRef = useRef(0)
    const requestIdRef = useRef(0)
    const requestInFlightRef = useRef(false)
    const queuedReloadRef = useRef(false)
    const [data, setData] = useState<LicenseDashboardData>(EMPTY_LICENSE_DASHBOARD_DATA)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [loadingMore, setLoadingMore] = useState<PaginatedResource | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const reload = useCallback(() => {
        if (requestInFlightRef.current) {
            queuedReloadRef.current = true
            return
        }

        setReloadKey((current) => current + 1)
    }, [])

    const updateCustomer: LicenseDataContextValue["updateCustomer"] = (id, values) => {
        setData((current) => ({
            ...current,
            customers: current.customers.map((customer) => (customer.id === id ? { ...customer, ...values } : customer)),
            licenses: current.licenses.map((license) => (license.customerId === id ? { ...license, customerName: values.name || values.email || id } : license)),
            navigationLicenses: current.navigationLicenses?.map((license) => (license.customerId === id ? { ...license, customerName: values.name || values.email || id } : license)),
        }))
    }

    const updateLicense: LicenseDataContextValue["updateLicense"] = (id, values) => {
        const { canceledAt, cancelAt, ...rest } = values
        const patch: Partial<LicenseDashboardLicense> = {
            ...rest,
            ...("cancelAt" in values ? { cancelAt: cancelAt ?? undefined } : {}),
            ...("canceledAt" in values ? { canceledAt: canceledAt ?? undefined } : {}),
        }
        const applyPatch = (license: LicenseDashboardLicense) =>
            license.id === id ? { ...license, ...patch, ...(values.subscriptionStatus ? { status: deriveLicenseStatus(values.subscriptionStatus, Boolean(license.licenseId)) } : {}) } : license
        setData((current) => ({
            ...current,
            licenses: current.licenses.map(applyPatch),
            navigationLicenses: current.navigationLicenses?.map(applyPatch),
        }))
    }

    useEffect(() => {
        const controller = new AbortController()
        const requestId = ++requestIdRef.current
        requestInFlightRef.current = true
        lastRequestStartedAtRef.current = Date.now()
        const isInitialPathLoad = loadedPathRef.current !== pathname
        setError(null)
        if (isInitialPathLoad) setIsLoading(true)
        else setIsRefreshing(true)
        const currentUrl = new URL(window.location.href)

        if (
            currentUrl.searchParams.has("token") ||
            currentUrl.searchParams.has("setup_intent") ||
            currentUrl.searchParams.has("setup_intent_client_secret") ||
            currentUrl.searchParams.has("redirect_status")
        ) {
            const sanitizedUrl = new URL(currentUrl)
            sanitizedUrl.searchParams.delete("token")
            sanitizedUrl.searchParams.delete("setup_intent")
            sanitizedUrl.searchParams.delete("setup_intent_client_secret")
            sanitizedUrl.searchParams.delete("redirect_status")
            window.history.replaceState(window.history.state, "", sanitizedUrl.toString())
        }

        void fetchLicenseDashboard(pathname, { origin: currentUrl.origin, signal: controller.signal })
            .then(({ data: nextData, status }) => {
                if (status === 401 || status === 403) {
                    window.location.replace(redirectUrl)
                    return null
                }
                if (!nextData) throw new Error(loadError)
                setData(nextData)
                setHasLoadedOnce(true)
                loadedPathRef.current = pathname
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return
                console.error(loadError, error)
                setError(loadError)
            })
            .finally(() => {
                if (requestId !== requestIdRef.current) return

                requestInFlightRef.current = false
                if (controller.signal.aborted) return

                setIsLoading(false)
                setIsRefreshing(false)
                if (queuedReloadRef.current) {
                    queuedReloadRef.current = false
                    setReloadKey((current) => current + 1)
                }
            })

        return () => controller.abort()
    }, [loadError, pathname, redirectUrl, reloadKey])

    const loadMore = useCallback(
        async (resource: PaginatedResource) => {
            const pageInfo = data.pagination?.[resource]
            if (loadingMore || !pageInfo?.hasNextPage || !pageInfo.endCursor) return

            setLoadingMore(resource)
            try {
                const { data: nextData, status } = await fetchLicenseDashboard(pathname, {
                    origin: window.location.origin,
                    pagination: { cursor: pageInfo.endCursor, customerContext: typeof pageInfo.contextCursor === "string" ? pageInfo.contextCursor : undefined, resource },
                })
                if (status === 401 || status === 403) {
                    window.location.replace(redirectUrl)
                    return
                }
                if (!nextData) throw new Error(loadError)
                setData((current) => ({
                    customers: mergeById(current.customers, nextData.customers),
                    licenses: mergeLicensePages(current.licenses, nextData.licenses),
                    navigationLicenses: mergeLicensePages(current.navigationLicenses ?? [], nextData.navigationLicenses ?? []),
                    pagination: { ...current.pagination, ...nextData.pagination },
                }))
            } catch (error) {
                console.error(loadError, error)
                setError(loadError)
            } finally {
                setLoadingMore(null)
            }
        },
        [data.pagination, loadError, loadingMore, pathname, redirectUrl]
    )

    useEffect(() => {
        const refreshWhenStale = () => {
            if (document.visibilityState !== "visible" || Date.now() - lastRequestStartedAtRef.current < FOCUS_REFRESH_STALE_MS) return
            reload()
        }
        window.addEventListener("focus", refreshWhenStale)
        document.addEventListener("visibilitychange", refreshWhenStale)

        return () => {
            window.removeEventListener("focus", refreshWhenStale)
            document.removeEventListener("visibilitychange", refreshWhenStale)
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
                loadingMore,
                loadMore,
                reload,
                sidebarLicenses: data.navigationLicenses ? mergeLicensePages(data.navigationLicenses, data.licenses) : data.licenses,
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
