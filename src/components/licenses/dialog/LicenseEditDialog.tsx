"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseGeneralTab } from "@/components/licenses/dialog/LicenseGeneralTab"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { LicenseUpgradeDialog } from "@/components/licenses/dialog/LicenseUpgradeDialog"
import { CustomerPaymentMethodCard, CustomerPaymentMethodCardSkeleton } from "@/components/licenses/dialog/CustomerPaymentMethodCard"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"
import { useCustomerPaymentMethods } from "@/hooks/usePaymentMethods"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { getLicenseEditSectionLabels, isLicenseEditSection, LICENSE_EDIT_SECTIONS, type LicenseEditSection } from "@/lib/licenses/licenseEditSections"
import { createLicensePath, resolveCustomerRouteId, resolveLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { updateSubscription } from "@/lib/subscription/client"
import { NamespaceSelectionError } from "@/components/licenses/NamespaceSelectionError"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { Button, TabContent, TabList, TabTrigger, Text } from "@code0-tech/pictor"
import { IconCreditCard, IconKey, IconTrendingUp } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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
    const sectionLabels = getLicenseEditSectionLabels(content)
    const paymentSectionEnabled = section === "payment"
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

    const assignPaymentMethod = async (paymentMethodId: string) => {
        if (!license?.subscriptionId || assigningPaymentMethodId) return
        setAssigningPaymentMethodId(paymentMethodId)
        setAssignPaymentMethodError(false)

        try {
            const subscription = await updateSubscription({ id: license.subscriptionId, paymentMethodId }, errors.paymentMethodAssign)
            if (subscription.paymentMethodId !== paymentMethodId) throw new Error(errors.paymentMethodAssign)

            updateLicense(license.id, { paymentMethodId })
            refreshCustomerPaymentMethods()
        } catch {
            setAssignPaymentMethodError(true)
        } finally {
            setAssigningPaymentMethodId(null)
        }
    }

    const otherPaymentMethods = customerPaymentMethods?.filter((method) => method.id !== license?.paymentMethodId)
    const paymentMethod = customerPaymentMethods?.find((method) => method.id === license?.paymentMethodId) ?? null
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
            <NamespaceSelectionError error={searchParams.get("namespaceError")} errors={errors} />
            <TabContent value="general">
                <LicenseGeneralTab
                    content={content}
                    errors={errors}
                    license={license}
                    locale={locale}
                    namespaceHref={namespaceHref}
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
                        <LicenseTabHeader title={sectionLabels.payment} description={content.editor.paymentMethodDescription} />

                        <LicenseTabSection title={content.editor.paymentMethodHeading}>
                            {isLoadingCustomerPaymentMethods ? (
                                <CustomerPaymentMethodCardSkeleton label={content.editor.loadingPaymentMethodLabel} />
                            ) : customerPaymentMethodsError ? (
                                <LicenseTabRow
                                    description={<span className="text-error">{errors.paymentMethodLoad}</span>}
                                    action={
                                        <Button type="button" variant="normal" paddingSize="xxs" onClick={refreshCustomerPaymentMethods}>
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
