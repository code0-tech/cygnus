"use client"

import { useLicenseToasts } from "@/components/licenses/layout/LicenseNotifications"
import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseGeneralTab } from "@/components/licenses/dialog/subscription/LicenseGeneralTab"
import { isLicenseStatusCanceled } from "@/components/licenses/shared/LicenseStatusDot"
import { LicenseDialog } from "@/components/licenses/dialog/shared/LicenseDialog"
import { LicenseUpgradeDialog } from "@/components/licenses/dialog/subscription/LicenseUpgradeDialog"
import { useCustomerPaymentMethods } from "@/hooks/usePaymentMethods"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getLicenseEditSectionLabels, isLicenseEditSection, LICENSE_EDIT_SECTIONS, type LicenseEditSection } from "@/lib/licenses/editSections"
import { createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { updateSubscription } from "@/lib/subscription/client"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import type { CheckoutPackages } from "@/lib/subscription/usagePackages"
import { IconKey, IconTrendingUp } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type ReactNode, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    checkoutPackages: CheckoutPackages
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    namespaceHref: string
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

export function LicenseEditDialog({ checkoutPackages, content, customerId, errors, licenseId, locale, namespaceHref, subscriptionConfig, subscriptionPrices }: LicenseEditDialogProps) {
    const toasts = useLicenseToasts()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedSubscriptionId = resolveSubscriptionRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedSubscriptionId && candidate.customerId === resolvedCustomerId)
    const requestedTab = searchParams.get("tab")
    // A canceled subscription has no plan left to upgrade, so the upgrade section disappears and any link to it falls back to general.
    const isCanceled = isLicenseStatusCanceled(license?.subscriptionStatus ?? license?.status)
    const sections: readonly LicenseEditSection[] = isCanceled ? ["general"] : LICENSE_EDIT_SECTIONS
    const requestedSection: LicenseEditSection | null = isLicenseEditSection(requestedTab) ? requestedTab : null
    const section: LicenseEditSection = requestedSection && sections.includes(requestedSection) ? requestedSection : "general"
    const sectionLabels = getLicenseEditSectionLabels(content)
    const {
        isLoadingPaymentMethods: isLoadingCustomerPaymentMethods,
        paymentMethods: customerPaymentMethods,
        paymentMethodsError: customerPaymentMethodsError,
        refreshPaymentMethods: refreshCustomerPaymentMethods,
    } = useCustomerPaymentMethods(license?.customerId, section === "general", license?.paymentMethodId)
    const [assigningPaymentMethodId, setAssigningPaymentMethodId] = useState<string | null>(null)
    const close = () => router.replace(createLicensePath(locale, resolvedCustomerId, resolvedSubscriptionId))

    const setSection = (nextSection: LicenseEditSection) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("tab", nextSection)
        nextSearchParams.delete("section")
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
    }

    useEffect(() => {
        if (requestedTab === section) return
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("tab", section)
        nextSearchParams.delete("section")
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
    }, [pathname, requestedTab, router, searchParams, section])

    const assignPaymentMethod = async (paymentMethodId: string) => {
        if (!license?.subscriptionId || assigningPaymentMethodId) return
        setAssigningPaymentMethodId(paymentMethodId)

        try {
            const subscription = await updateSubscription({ id: license.subscriptionId, paymentMethodId }, errors.paymentMethodAssign)
            if (subscription.paymentMethodId !== paymentMethodId) throw new Error(errors.paymentMethodAssign)

            updateLicense(license.id, { paymentMethodId })
            refreshCustomerPaymentMethods()
            toasts.success("paymentAssigned")
        } catch {
            toasts.error(errors.paymentMethodAssign)
        } finally {
            setAssigningPaymentMethodId(null)
        }
    }

    const sectionIcons = { general: IconKey, upgrade: IconTrendingUp } satisfies Record<LicenseEditSection, typeof IconKey>
    const hasSubscription = Boolean(license?.subscriptionId)
    const tabContent: Record<LicenseEditSection, ReactNode> = {
        general: (
            <LicenseGeneralTab
                content={content}
                errors={errors}
                assigningPaymentMethodId={assigningPaymentMethodId}
                isLoadingPaymentMethod={isLoadingCustomerPaymentMethods}
                license={license}
                locale={locale}
                namespaceHref={namespaceHref}
                onAssignPaymentMethod={(paymentMethodId) => void assignPaymentMethod(paymentMethodId)}
                onClose={close}
                onRetryPaymentMethod={refreshCustomerPaymentMethods}
                paymentMethodError={customerPaymentMethodsError}
                paymentMethods={customerPaymentMethods}
                subscriptionConfig={subscriptionConfig}
                title={sectionLabels.general}
            />
        ),
        upgrade: (
            <LicenseUpgradeDialog
                checkoutPackages={checkoutPackages}
                content={content}
                customerId={customerId}
                errors={errors}
                licenseId={licenseId}
                locale={locale}
                subscriptionConfig={subscriptionConfig}
                subscriptionPrices={subscriptionPrices}
            />
        ),
    }

    return (
        <LicenseDialog
            closeLabel={content.editor.closeLabel}
            description={content.editor.licenseEditDescription}
            onClose={close}
            onValueChange={(value) => isLicenseEditSection(value) && setSection(value)}
            tabs={(hasSubscription ? sections : (["general"] as const)).map((value) => ({ value, label: sectionLabels[value], icon: sectionIcons[value], content: tabContent[value] }))}
            title={content.editor.licenseTitle}
            value={hasSubscription ? section : "general"}
        />
    )
}
