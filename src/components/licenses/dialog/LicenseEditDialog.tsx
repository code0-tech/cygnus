"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { CustomerPaymentMethodCard, type CustomerPaymentMethodSummary } from "@/components/licenses/dialog/CustomerPaymentMethodCard"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { cn } from "@/lib/utils"
import { Button, ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, Text } from "@code0-tech/pictor"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    namespaceHref: string
}

type LicenseEditSection = "license" | "payment"

interface PaymentMethodSummary {
    brand: string | null
    expiresMonth: number | null
    expiresYear: number | null
    last4: string | null
    type: string
}

export function LicenseEditDialog({ content, customerId, errors, licenseId, locale, namespaceHref }: LicenseEditDialogProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { licenses } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const [section, setSection] = useState<LicenseEditSection>("license")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodSummary | null>(null)
    const [paymentMethodError, setPaymentMethodError] = useState(false)
    const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false)
    const [paymentMethodRefreshKey, setPaymentMethodRefreshKey] = useState(0)
    const [customerPaymentMethods, setCustomerPaymentMethods] = useState<CustomerPaymentMethodSummary[] | null>(null)
    const [customerPaymentMethodsError, setCustomerPaymentMethodsError] = useState(false)
    const [isLoadingCustomerPaymentMethods, setIsLoadingCustomerPaymentMethods] = useState(false)
    const [assigningPaymentMethodId, setAssigningPaymentMethodId] = useState<string | null>(null)
    const [assignPaymentMethodError, setAssignPaymentMethodError] = useState(false)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    useEffect(() => {
        if (new URL(window.location.href).searchParams.has("setup_intent")) setSection("payment")
    }, [])

    useEffect(() => {
        if (section !== "payment" || !license?.subscriptionId) return

        const controller = new AbortController()
        const url = new URL("/api/crater/subscriptions/payment-method", window.location.origin)
        url.searchParams.set("subscriptionId", license.subscriptionId)
        setIsLoadingPaymentMethod(true)
        setPaymentMethodError(false)

        void fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("paymentMethod" in result)) throw new Error("Invalid payment method response.")
                return result.paymentMethod as PaymentMethodSummary | null
            })
            .then(setPaymentMethod)
            .catch((loadError) => {
                if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setPaymentMethodError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingPaymentMethod(false)
            })

        return () => controller.abort()
    }, [license?.subscriptionId, paymentMethodRefreshKey, section])

    const paymentMethodUpdated = useCallback(() => {
        setPaymentMethodRefreshKey((value) => value + 1)
    }, [])

    useEffect(() => {
        if (section !== "payment" || !license?.customerId) return

        const controller = new AbortController()
        const url = new URL("/api/crater/customer/payment-methods", window.location.origin)
        url.searchParams.set("customerId", license.customerId)
        setIsLoadingCustomerPaymentMethods(true)
        setCustomerPaymentMethodsError(false)

        void fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("paymentMethods" in result)) throw new Error("Invalid payment methods response.")
                return result.paymentMethods as CustomerPaymentMethodSummary[]
            })
            .then(setCustomerPaymentMethods)
            .catch((loadError) => {
                if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setCustomerPaymentMethodsError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingCustomerPaymentMethods(false)
            })

        return () => controller.abort()
    }, [license?.customerId, paymentMethodRefreshKey, section])

    const assignPaymentMethod = async (paymentMethodId: string) => {
        if (!license?.subscriptionId || assigningPaymentMethodId) return
        setAssigningPaymentMethodId(paymentMethodId)
        setAssignPaymentMethodError(false)

        try {
            const response = await fetch("/api/crater/subscriptions/payment-method", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ subscriptionId: license.subscriptionId, paymentMethodId }),
            })
            if (!response.ok) throw new Error(errors.paymentMethodAssign)

            paymentMethodUpdated()
        } catch {
            setAssignPaymentMethodError(true)
        } finally {
            setAssigningPaymentMethodId(null)
        }
    }

    const isCloud = license?.deploymentType === "cloud"
    const namespaceSelectionFailed = searchParams.has("namespaceError")
    const sidebar = license?.subscriptionId ? (
        <div role="tablist" aria-label={content.editor.licenseTitle} className="flex flex-col gap-2">
            {(["license", "payment"] as const).map((option) => {
                const selected = section === option
                const label = option === "license" ? content.editor.licenseTitle : content.editor.paymentMethodHeading

                return (
                    <Button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        active={selected}
                        variant={selected ? "normal" : "none"}
                        paddingSize="xxs"
                        w="100%"
                        justify="start"
                        className={cn("text-base!", selected && "bg-white/5! shadow-[inset_0_1px_1px_#bfbfbf1a]!")}
                        onClick={() => setSection(option)}
                    >
                        {label}
                    </Button>
                )
            })}
        </div>
    ) : null
    return (
        <LicenseDialog backLabel={content.editor.closeLabel} onClose={close} sidebar={sidebar} title={content.editor.licenseTitle}>
            {section === "license" || !license?.subscriptionId ? (
                <div className="space-y-4" role="tabpanel">
                    {namespaceSelectionFailed && (
                        <p role="alert" className="text-sm text-error">
                            {errors.licenseUpdate}
                        </p>
                    )}
                    <div className="space-y-6 pt-2">
                        {license && isCloud && (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <Text size="sm" hierarchy="tertiary" className="max-w-xl!">
                                    {content.editor.licenseDescription}
                                </Text>
                                <Button type="button" variant="normal" className="shrink-0" onClick={() => window.location.assign(namespaceHref)}>
                                    {content.editor.changeNamespaceLabel}
                                </Button>
                            </div>
                        )}
                        {license?.subscriptionId && (
                            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <Text size="sm" hierarchy="tertiary" className="max-w-xl!">
                                    {content.cancel.description}
                                </Text>
                                <Button
                                    type="button"
                                    variant="normal"
                                    className="shrink-0"
                                    onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/cancel`)}
                                >
                                    {content.cancel.confirmLabel}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div role="tabpanel" className="space-y-6">
                    <div>
                        <Text hierarchy="secondary" size="lg">
                            {content.editor.paymentMethodHeading}
                        </Text>
                        <Text size="sm" hierarchy="tertiary" className="mt-2!">
                            {content.editor.paymentMethodDescription}
                        </Text>
                    </div>

                    {isLoadingPaymentMethod ? (
                        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                            <div role="status" className="animate-pulse motion-reduce:animate-none">
                                <span className="sr-only">{content.editor.loadingPaymentMethodLabel}</span>
                                <div aria-hidden="true" className="h-5 w-40 rounded-full bg-white/10" />
                                <div aria-hidden="true" className="mt-2 h-4 w-24 rounded-full bg-white/10" />
                            </div>
                        </div>
                    ) : paymentMethodError ? (
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/3 p-4">
                            <Text role="alert" size="sm" className="text-error!">
                                {errors.paymentMethodUpdate}
                            </Text>
                            <Button type="button" variant="normal" paddingSize="xs" onClick={() => setPaymentMethodRefreshKey((value) => value + 1)}>
                                {errors.retry}
                            </Button>
                        </div>
                    ) : paymentMethod ? (
                        <CustomerPaymentMethodCard method={paymentMethod} />
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                            <Text size="sm" hierarchy="tertiary">
                                {content.invoices.unavailableLabel}
                            </Text>
                        </div>
                    )}

                    {isLoadingCustomerPaymentMethods ? null : customerPaymentMethodsError ? (
                        <Text role="alert" size="sm" className="text-error!">
                            {errors.paymentMethodAssign}
                        </Text>
                    ) : customerPaymentMethods && customerPaymentMethods.length > 0 ? (
                        <div className="space-y-3">
                            <Text hierarchy="secondary" size="sm" fw={500}>
                                {content.editor.otherPaymentMethodsHeading}
                            </Text>
                            <ScrollArea h="20rem" type="scroll">
                                <ScrollAreaViewport className="h-full! w-full!">
                                    <div className="space-y-3 pr-3">
                                        {customerPaymentMethods.map((method) => (
                                            <CustomerPaymentMethodCard
                                                key={method.id}
                                                method={method}
                                                action={
                                                    <Button
                                                        type="button"
                                                        variant="normal"
                                                        paddingSize="xs"
                                                        disabled={assigningPaymentMethodId === method.id}
                                                        onClick={() => void assignPaymentMethod(method.id)}
                                                    >
                                                        {assigningPaymentMethodId === method.id ? (
                                                            <ButtonLoader label={content.editor.settingPaymentMethodLabel} />
                                                        ) : (
                                                            content.editor.usePaymentMethodLabel
                                                        )}
                                                    </Button>
                                                }
                                            />
                                        ))}
                                    </div>
                                </ScrollAreaViewport>
                                <ScrollAreaScrollbar orientation="vertical" className="w-1.5!">
                                    <ScrollAreaThumb className="bg-white/15! hover:bg-white/25!" />
                                </ScrollAreaScrollbar>
                            </ScrollArea>
                            {assignPaymentMethodError && (
                                <Text role="alert" size="sm" className="text-error!">
                                    {errors.paymentMethodAssign}
                                </Text>
                            )}
                        </div>
                    ) : null}

                    <PaymentMethodSetupDialog
                        content={content}
                        errors={errors}
                        onSuccess={paymentMethodUpdated}
                        owner={{ subscriptionId: license.subscriptionId, type: "subscription" }}
                        returnPath={`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/edit`}
                        triggerLabel={content.editor.changePaymentMethodLabel}
                    />
                </div>
            )}
        </LicenseDialog>
    )
}
