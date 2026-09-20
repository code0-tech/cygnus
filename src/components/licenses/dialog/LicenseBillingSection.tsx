"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import { Switch } from "@/components/ui/Switch"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/licenseDisplayValues"
import type { LicenseDashboardLicense } from "@/lib/licenses/licenseTypes"
import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import type { PaymentPeriod } from "@/lib/subscription/calculator"
import { updateSubscription } from "@/lib/subscription/client"
import { getPaymentPeriodOptions } from "@/lib/subscription/configurator"
import { Button, DialogFooter, Text } from "@code0-tech/pictor"
import { useState } from "react"

interface LicenseBillingSectionProps {
    content: LicenseContent
    errors: ErrorsContent
    license: LicenseDashboardLicense
    locale: AppLocale
    onClose: () => void
    subscriptionConfig: SubscriptionConfigData
}

export function LicenseBillingSection({ content, errors, license, locale, onClose, subscriptionConfig }: LicenseBillingSectionProps) {
    const { updateLicense } = useLicenseData()
    const customerType = resolveSubscriptionCustomerType(license.customerType)
    const periodOptions = getPaymentPeriodOptions(customerType)
    const currentPeriod = license.paymentPeriod as PaymentPeriod | undefined
    const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)
    const period = selectedPeriod ?? currentPeriod ?? periodOptions[0]
    const hasChange = Boolean(license.subscriptionId) && period !== currentPeriod
    const { isLoadingPreview, preview, previewError } = useSubscriptionUpdatePreview(hasChange ? license.subscriptionId : undefined, { paymentPeriod: period }, errors.subscriptionPreview)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const save = async () => {
        if (!license.subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)
        setSaveError(null)

        try {
            const subscription = await updateSubscription({ id: license.subscriptionId, paymentPeriod: period }, errors.billingUpdate)
            updateLicense(license.id, {
                ...(subscription.paymentPeriod ? { paymentPeriod: subscription.paymentPeriod } : {}),
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            onClose()
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
        <div role="tabpanel" id="license-edit-panel-billing" aria-labelledby="license-edit-tab-billing" className="space-y-6">
            <div>
                <Text hierarchy="secondary" size="lg">
                    {content.billing.title}
                </Text>
                <Text size="sm" hierarchy="tertiary" className="mt-2!">
                    {content.billing.description}
                </Text>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-tertiary">{content.dashboard.statusLabel}</p>
                    <p className="mt-1 text-white">{formatLicenseDisplayValue(license.subscriptionStatus ?? license.status, "status", content.values)}</p>
                </div>
                <div>
                    <p className="text-tertiary">{content.billing.currentPeriodEndLabel}</p>
                    <p className="mt-1 text-white">{formatDate(license.currentPeriodEnd)}</p>
                </div>
            </div>

            <div>
                <p className="mb-2 text-sm text-secondary">{content.billing.periodLabel}</p>
                <Switch value={period} options={periodOptions.map((option) => ({ value: option, label: periodLabelFor(option) }))} onChange={setSelectedPeriod} />
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
                <Button type="button" variant="filled" disabled={!hasChange || isSaving || isLoadingPreview} onClick={() => void save()}>
                    {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                </Button>
            </DialogFooter>
        </div>
    )
}
