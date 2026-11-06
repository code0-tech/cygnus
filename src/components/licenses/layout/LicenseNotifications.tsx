"use client"

import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Toaster } from "sonner"
import type { ErrorsContent, LicenseToastsContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { licenseErrorToast, licenseSuccessToast, type LicenseSuccessToast } from "@/lib/licenses/toasts"

interface LicenseToasts {
    success: (message: LicenseSuccessToast, effectiveAt?: string | null) => void
    error: (message: string) => void
}

const LicenseToastsContext = createContext<LicenseToasts | null>(null)

export function useLicenseToasts() {
    const toasts = useContext(LicenseToastsContext)
    if (!toasts) throw new Error("useLicenseToasts must be used inside LicenseToastsProvider.")
    return toasts
}

interface LicenseToastsProviderProps {
    children?: ReactNode
    locale: AppLocale
    toasts: LicenseToastsContent
}

export function LicenseToastsProvider({ children, locale, toasts }: LicenseToastsProviderProps) {
    const value = useMemo<LicenseToasts>(
        () => ({
            success: (message, effectiveAt) => licenseSuccessToast(toasts, message, locale, effectiveAt),
            error: (message) => licenseErrorToast(toasts, message),
        }),
        [locale, toasts]
    )
    return <LicenseToastsContext.Provider value={value}>{children}</LicenseToastsContext.Provider>
}

function NamespaceCallbackNotification({ errors }: { errors: ErrorsContent }) {
    const pathname = usePathname()
    const toasts = useLicenseToasts()

    useEffect(() => {
        const url = new URL(window.location.href)
        const error = url.searchParams.get("namespaceError")
        const linked = url.searchParams.get("namespaceLinked") === "true"
        if (!error && !linked) return

        url.searchParams.delete("namespaceError")
        url.searchParams.delete("namespaceLinked")
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
        if (error) toasts.error(error === "occupied" ? errors.namespaceInUse : errors.licenseUpdate)
        else toasts.success("namespaceLinked")
    }, [pathname, errors.namespaceInUse, errors.licenseUpdate, toasts])

    return null
}

export function LicenseNotifications({ children, errors, ...props }: LicenseToastsProviderProps & { errors: ErrorsContent }) {
    return (
        <LicenseToastsProvider {...props}>
            <NamespaceCallbackNotification errors={errors} />
            {children}
            <Toaster position="top-center" />
        </LicenseToastsProvider>
    )
}
