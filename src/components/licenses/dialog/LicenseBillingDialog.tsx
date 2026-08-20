"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { Switch } from "@/components/ui/Switch"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import type { PaymentPeriod } from "@/lib/subscriptionCalculator"
import { getPaymentPeriodOptions } from "@/lib/subscriptionConfigurator"
import { Button, DialogFooter } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface SubscriptionUpdatePreview {
    currency: string
    effectiveAt: string | null
    immediate: boolean
    prorationAmount: number
    total: number
}

interface LicenseBillingDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
}

export function LicenseBillingDialog({ content, customerId, errors, licenseId, locale, subscriptionConfig }: LicenseBillingDialogProps) {
    const router = useRouter()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    const customerType = resolveSubscriptionCustomerType(license?.customerType)
    const periodOptions = getPaymentPeriodOptions(customerType)
    const currentPeriod = license?.paymentPeriod?.toLowerCase() as PaymentPeriod | undefined
    const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)
    const period = selectedPeriod ?? currentPeriod ?? periodOptions[0]
    const hasChange = Boolean(license?.subscriptionId) && period !== currentPeriod

    const [preview, setPreview] = useState<SubscriptionUpdatePreview | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!hasChange || !license?.subscriptionId) {
            setPreview(null)
            setPreviewError(null)
            return
        }

        let active = true
        setIsLoadingPreview(true)
        setPreviewError(null)

        void fetch("/api/crater/subscriptions/preview", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: license.subscriptionId, paymentPeriod: period }),
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(errors.subscriptionPreview)
                return (await response.json()) as SubscriptionUpdatePreview
            })
            .then((nextPreview) => {
                if (active) setPreview(nextPreview)
            })
            .catch(() => {
                if (active) setPreviewError(errors.subscriptionPreview)
            })
            .finally(() => {
                if (active) setIsLoadingPreview(false)
            })

        return () => {
            active = false
        }
    }, [errors.subscriptionPreview, hasChange, license?.subscriptionId, period])

    const save = async () => {
        if (!license?.subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)
        setSaveError(null)

        try {
            const response = await fetch("/api/crater/subscriptions", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.subscriptionId, paymentPeriod: period }),
            })
            if (!response.ok) throw new Error(errors.billingUpdate)
            const updated: unknown = await response.json()
            if (!updated || typeof updated !== "object") throw new Error(errors.billingUpdate)

            const subscription = updated as {
                paymentPeriod?: string
                pendingUpdate?: { plan?: string; paymentPeriod?: string; aiTokens?: number; workflowExecutions?: number; effectiveAt?: string } | null
                updatedAt?: string
            }
            updateLicense(license.id, {
                ...(subscription.paymentPeriod ? { paymentPeriod: subscription.paymentPeriod } : {}),
                pendingUpdate: subscription.pendingUpdate ?? null,
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            close()
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : errors.billingUpdate)
        } finally {
            setIsSaving(false)
        }
    }

    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    const formatDate = (value?: string | null) => (value ? dateFormatter.format(new Date(value)) : "—")
    const periodLabelFor = (value: PaymentPeriod) => subscriptionConfig.paymentPeriod[`${value}Text`]

    return (
        <LicenseDialog backLabel={content.editor.cancelLabel} description={content.billing.description} onClose={close} title={content.billing.title}>
            <div className="space-y-4">
                {license && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-tertiary">{content.dashboard.statusLabel}</p>
                            <p className="mt-1 text-white">{formatLicenseDisplayValue(license.subscriptionStatus ?? license.status, "status", content.values)}</p>
                        </div>
                        <div>
                            <p className="text-tertiary">{content.billing.currentPeriodEndLabel}</p>
                            <p className="mt-1 text-white">{formatDate(license.currentPeriodEnd)}</p>
                        </div>
                        {license.pendingUpdate && (
                            <div className="col-span-2 rounded-xl border border-white/10 bg-white/3 p-3">
                                <p className="text-tertiary">{content.billing.pendingChangeLabel}</p>
                                <p className="mt-1 text-white">
                                    {license.pendingUpdate.paymentPeriod
                                        ? periodLabelFor(license.pendingUpdate.paymentPeriod.toLowerCase() as PaymentPeriod)
                                        : formatLicenseDisplayValue(license.pendingUpdate.plan, "plan", content.values)}
                                    {" · "}
                                    {formatDate(license.pendingUpdate.effectiveAt)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <p className="mb-2 text-sm text-secondary">{content.billing.periodLabel}</p>
                    <Switch value={period} options={periodOptions.map((option) => ({ value: option, label: periodLabelFor(option) }))} onChange={(value) => setSelectedPeriod(value)} />
                </div>

                {hasChange && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                        {isLoadingPreview ? (
                            <p className="text-tertiary">{content.subscriptionPreview.loadingLabel}</p>
                        ) : previewError ? (
                            <p role="alert" className="text-error">
                                {previewError}
                            </p>
                        ) : preview ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-secondary">{content.subscriptionPreview.totalLabel}</span>
                                    <span className="text-white">{formatMinorCurrency(preview.total, preview.currency, locale)}</span>
                                </div>
                                {preview.prorationAmount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-secondary">{content.subscriptionPreview.prorationLabel}</span>
                                        <span className="text-white">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</span>
                                    </div>
                                )}
                                <p className="text-tertiary">{preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}</p>
                            </div>
                        ) : null}
                    </div>
                )}

                {saveError && (
                    <p role="alert" className="text-sm text-error">
                        {saveError}
                    </p>
                )}

                <DialogFooter className="gap-3! pt-2!">
                    <Button type="button" variant="none" onClick={close}>
                        {content.editor.cancelLabel}
                    </Button>
                    <Button type="button" variant="filled" disabled={!hasChange || isSaving || isLoadingPreview} onClick={() => void save()}>
                        {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                    </Button>
                </DialogFooter>
            </div>
        </LicenseDialog>
    )
}
