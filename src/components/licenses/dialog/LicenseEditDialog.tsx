"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseGeneralTab } from "@/components/licenses/dialog/LicenseGeneralTab"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { LicenseUpgradeDialog } from "@/components/licenses/dialog/LicenseUpgradeDialog"
import { CustomerPaymentMethodCard, CustomerPaymentMethodCardSkeleton } from "@/components/licenses/dialog/CustomerPaymentMethodCard"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/LicenseTabLayout"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import { useCustomerPaymentMethods, useSubscriptionPaymentMethod } from "@/hooks/usePaymentMethods"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getLicenseEditSectionLabels, isLicenseEditSection, LICENSE_EDIT_SECTIONS, type LicenseEditSection } from "@/lib/licenses/licenseEditSections"
import { createLicensePath, resolveCustomerRouteId, resolveLicenseRouteId } from "@/lib/licenses/licenseRoute"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { Button, TabContent, TabList, TabTrigger, Text } from "@code0-tech/pictor"
import { IconCreditCard, IconKey, IconTrendingUp } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    namespaceHref: string
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

export function LicenseEditDialog({ content, customerId, errors, licenseId, locale, namespaceHref, subscriptionConfig, subscriptionPrices }: LicenseEditDialogProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedLicenseId = resolveLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const requestedTab = searchParams.get("tab")
    // Legacy "license" and "billing" tabs were merged into "general".
    const section: LicenseEditSection = isLicenseEditSection(requestedTab) ? requestedTab : searchParams.has("setup_intent") ? "payment" : "general"
    const sectionLabels = getLicenseEditSectionLabels(locale, content.upgrade.title)
    const paymentSectionEnabled = section === "payment"
    const { isLoadingPaymentMethod, paymentMethod, paymentMethodError, refreshPaymentMethod } = useSubscriptionPaymentMethod(license?.subscriptionId, paymentSectionEnabled)
    const {
        isLoadingPaymentMethods: isLoadingCustomerPaymentMethods,
        paymentMethods: customerPaymentMethods,
        paymentMethodsError: customerPaymentMethodsError,
        refreshPaymentMethods: refreshCustomerPaymentMethods,
    } = useCustomerPaymentMethods(license?.customerId, paymentSectionEnabled)
    const [assigningPaymentMethodId, setAssigningPaymentMethodId] = useState<string | null>(null)
    const [assignPaymentMethodError, setAssignPaymentMethodError] = useState(false)
    const close = () => router.replace(createLicensePath(locale, resolvedCustomerId, resolvedLicenseId))

    const setSection = (nextSection: LicenseEditSection) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("tab", nextSection)
        nextSearchParams.delete("section")
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
    }

    useEffect(() => {
        if (isLicenseEditSection(requestedTab)) return
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("tab", section)
        nextSearchParams.delete("section")
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
    }, [pathname, requestedTab, router, searchParams, section])

    const paymentMethodUpdated = useCallback(() => {
        refreshPaymentMethod()
        refreshCustomerPaymentMethods()
    }, [refreshCustomerPaymentMethods, refreshPaymentMethod])

    const assignPaymentMethod = async (paymentMethodId: string) => {
        if (!license?.subscriptionId || assigningPaymentMethodId) return
        setAssigningPaymentMethodId(paymentMethodId)
        setAssignPaymentMethodError(false)

        try {
            const response = await fetch("/api/crater/subscriptions/payment-method", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ subscriptionId: license.subscriptionId, paymentMethodId }),
            })
            if (!response.ok) throw new Error(errors.paymentMethodAssign)

            updateLicense(license.id, { paymentMethodId })
            paymentMethodUpdated()
        } catch {
            setAssignPaymentMethodError(true)
        } finally {
            setAssigningPaymentMethodId(null)
        }
    }

    const otherPaymentMethods = customerPaymentMethods?.filter((method) => method.id !== license?.paymentMethodId)
    const namespaceSelectionFailed = searchParams.has("namespaceError")
    const sectionIcons = { general: IconKey, payment: IconCreditCard, upgrade: IconTrendingUp } satisfies Record<LicenseEditSection, typeof IconKey>
    const sidebar = license?.subscriptionId ? (
        <TabList aria-label={content.editor.licenseTitle}>
            {LICENSE_EDIT_SECTIONS.map((value) => {
                const TabIcon = sectionIcons[value]

                return (
                    <TabTrigger key={value} value={value} w="100%" asChild>
                        <Button type="button" paddingSize="xxs" variant="none" justify="start" className="rounded-2xl! h-8!">
                            <TabIcon aria-hidden="true" size={13} />
                            <Text className="truncate" size="md">
                                {sectionLabels[value]}
                            </Text>
                        </Button>
                    </TabTrigger>
                )
            })}
        </TabList>
    ) : null
    return (
        <LicenseDialog
            backLabel={content.editor.closeLabel}
            description={content.editor.licenseEditDescription}
            onClose={close}
            onValueChange={(value) => isLicenseEditSection(value) && setSection(value)}
            sidebar={sidebar}
            title={content.editor.licenseTitle}
            value={license?.subscriptionId ? section : "general"}
        >
            <TabContent value="general">
                <LicenseGeneralTab
                    content={content}
                    errors={errors}
                    license={license}
                    locale={locale}
                    namespaceHref={namespaceHref}
                    namespaceSelectionFailed={namespaceSelectionFailed}
                    onClose={close}
                    subscriptionConfig={subscriptionConfig}
                    title={sectionLabels.general}
                />
            </TabContent>
            {license?.subscriptionId ? (
                <>
                    <TabContent value="upgrade">
                        <LicenseUpgradeDialog
                            content={content}
                            customerId={customerId}
                            errors={errors}
                            licenseId={licenseId}
                            locale={locale}
                            subscriptionConfig={subscriptionConfig}
                            subscriptionPrices={subscriptionPrices}
                        />
                    </TabContent>
                    <TabContent value="payment">
                        <LicenseTabHeader
                            title={sectionLabels.payment}
                            description={content.editor.paymentMethodDescription}
                            action={
                                <PaymentMethodSetupDialog
                                    content={content}
                                    errors={errors}
                                    onSuccess={paymentMethodUpdated}
                                    owner={{ customerId: license.customerId }}
                                    returnPath={`${createLicensePath(locale, license.customerId, license.id)}/edit`}
                                    triggerLabel={content.editor.changePaymentMethodLabel}
                                />
                            }
                        />

                        <LicenseTabSection title={content.editor.paymentMethodHeading}>
                            {isLoadingPaymentMethod ? (
                                <CustomerPaymentMethodCardSkeleton label={content.editor.loadingPaymentMethodLabel} />
                            ) : paymentMethodError ? (
                                <LicenseTabRow
                                    description={<span className="text-error">{errors.paymentMethodLoad}</span>}
                                    action={
                                        <Button type="button" variant="normal" paddingSize="xxs" onClick={refreshPaymentMethod}>
                                            {errors.retry}
                                        </Button>
                                    }
                                />
                            ) : paymentMethod ? (
                                <CustomerPaymentMethodCard method={paymentMethod} />
                            ) : (
                                <LicenseTabRow description={content.invoices.unavailableLabel} />
                            )}
                        </LicenseTabSection>

                        {isLoadingCustomerPaymentMethods ? null : customerPaymentMethodsError ? (
                            <LicenseTabAlert>{errors.paymentMethodLoad}</LicenseTabAlert>
                        ) : otherPaymentMethods && otherPaymentMethods.length > 0 ? (
                            <LicenseTabSection title={content.editor.otherPaymentMethodsHeading}>
                                {otherPaymentMethods.map((method) => (
                                    <CustomerPaymentMethodCard
                                        key={method.id}
                                        method={method}
                                        action={
                                            <Button
                                                type="button"
                                                variant="normal"
                                                paddingSize="xxs"
                                                disabled={assigningPaymentMethodId === method.id}
                                                onClick={() => void assignPaymentMethod(method.id)}
                                            >
                                                {assigningPaymentMethodId === method.id ? <ButtonLoader label={content.editor.settingPaymentMethodLabel} /> : content.editor.usePaymentMethodLabel}
                                            </Button>
                                        }
                                    />
                                ))}
                            </LicenseTabSection>
                        ) : null}
                        {assignPaymentMethodError ? <LicenseTabAlert>{errors.paymentMethodAssign}</LicenseTabAlert> : null}
                    </TabContent>
                </>
            ) : null}
        </LicenseDialog>
    )
}
