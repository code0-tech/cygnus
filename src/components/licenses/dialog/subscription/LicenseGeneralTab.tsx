"use client"

import { SubscriptionPendingUpdateNotice } from "@/components/licenses/shared/SubscriptionPendingUpdateNotice"
import { type PaymentPeriod, PAYMENT_PERIOD_OPTIONS } from "@/lib/subscription/types"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { getLicenseStatusBadgeColor } from "@/components/licenses/shared/LicenseStatusDot"
import { LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"
import { Switch } from "@/components/ui/Switch"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import { createLicensePath, getNamespaceDisplayId } from "@/lib/licenses/routes"
import type { LicenseDashboardLicense } from "@/lib/licenses/types"
import { updateSubscription } from "@/lib/subscription/client"
import { Badge, Button, Text } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LicenseGeneralTabProps {
    content: LicenseContent
    errors: ErrorsContent
    license?: LicenseDashboardLicense
    locale: AppLocale
    namespaceHref: string
    onClose: () => void
    subscriptionConfig: SubscriptionConfigData
    title: string
}

export function LicenseGeneralTab({ content, errors, license, locale, namespaceHref, onClose, subscriptionConfig, title }: LicenseGeneralTabProps) {
    const router = useRouter()
    const { updateLicense } = useLicenseData()
    const subscriptionId = license?.subscriptionId
    const periodOptions = PAYMENT_PERIOD_OPTIONS
    const currentPeriod = license?.paymentPeriod as PaymentPeriod | undefined
    const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)
    const period = selectedPeriod ?? currentPeriod ?? periodOptions[0]
    const hasChange = Boolean(subscriptionId) && period !== currentPeriod
    const { isLoadingPreview, preview, previewError } = useSubscriptionUpdatePreview(hasChange ? subscriptionId : undefined, { paymentPeriod: period }, errors.subscriptionPreview)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const save = async () => {
        if (!license || !subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)
        setSaveError(null)

        try {
            const subscription = await updateSubscription({ id: subscriptionId, paymentPeriod: period }, errors.billingUpdate)
            updateLicense(license.id, {
                pendingUpdate: subscription.pendingUpdate ?? null,
                ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
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
        <>
            <LicenseTabHeader title={title} description={content.editor.licenseEditDescription} />
            <SubscriptionPendingUpdateNotice update={license?.pendingUpdate} content={content} locale={locale} />

            {license?.deploymentType === "cloud" ? (
                <LicenseTabSection title={content.editor.namespaceHeading}>
                    <LicenseTabRow
                        title={getNamespaceDisplayId(license.namespaceId) ?? "—"}
                        description={content.editor.licenseDescription}
                        action={
                            <Button type="button" variant="normal" paddingSize="xxs" onClick={() => window.location.assign(namespaceHref)}>
                                {content.editor.changeNamespaceLabel}
                            </Button>
                        }
                    />
                </LicenseTabSection>
            ) : null}

            {license && subscriptionId ? (
                <>
                    <LicenseTabSection title={content.billing.title}>
                        <LicenseTabRow
                            title={content.dashboard.statusLabel}
                            action={
                                <Badge color={getLicenseStatusBadgeColor(license.subscriptionStatus ?? license.status)}>
                                    {formatLicenseDisplayValue(license.subscriptionStatus ?? license.status, "status", content.values)}
                                </Badge>
                            }
                        />
                        <LicenseTabRow title={content.billing.currentPeriodEndLabel} action={<Badge color="tertiary">{formatDate(license.currentPeriodEnd)}</Badge>} />
                        <LicenseTabRow title={content.billing.periodLabel} description={content.billing.description}>
                            <Switch value={period} options={periodOptions.map((option) => ({ value: option, label: periodLabelFor(option) }))} onChange={setSelectedPeriod} />
                        </LicenseTabRow>
                        {hasChange ? (
                            isLoadingPreview ? (
                                <LicenseTabRow description={content.subscriptionPreview.loadingLabel} />
                            ) : previewError ? (
                                <LicenseTabRow>
                                    <Text role="alert" size="sm" className="text-error!">
                                        {previewError}
                                    </Text>
                                </LicenseTabRow>
                            ) : preview ? (
                                <>
                                    <LicenseTabRow title={content.subscriptionPreview.totalLabel} action={<Text size="md">{formatMinorCurrency(preview.total, preview.currency, locale)}</Text>} />
                                    {preview.prorationAmount > 0 ? (
                                        <LicenseTabRow
                                            title={content.subscriptionPreview.prorationLabel}
                                            action={<Text size="md">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</Text>}
                                        />
                                    ) : null}
                                    <LicenseTabRow
                                        description={preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}
                                        action={
                                            <Button type="button" variant="normal" paddingSize="xxs" disabled={isSaving} onClick={() => void save()}>
                                                {isSaving ? <ButtonLoader label={content.billing.changePeriodLabel} /> : content.billing.changePeriodLabel}
                                            </Button>
                                        }
                                    >
                                        {saveError ? (
                                            <Text role="alert" size="sm" className="text-error!">
                                                {saveError}
                                            </Text>
                                        ) : null}
                                    </LicenseTabRow>
                                </>
                            ) : null
                        ) : null}
                    </LicenseTabSection>

                    <LicenseTabSection title={content.editor.cancellationHeading}>
                        <LicenseTabRow
                            title={content.cancel.confirmLabel}
                            description={content.cancel.description}
                            action={
                                <Button type="button" variant="normal" paddingSize="xxs" onClick={() => router.push(`${createLicensePath(locale, license.customerId, license.id)}/cancel`)}>
                                    {content.cancel.confirmLabel}
                                </Button>
                            }
                        />
                    </LicenseTabSection>
                </>
            ) : null}
        </>
    )
}
