"use client"

import { type PaymentPeriod, PAYMENT_PERIOD_OPTIONS } from "@/lib/subscription/types"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { getLicenseStatusBadgeColor } from "@/components/licenses/shared/LicenseStatusDot"
import { LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import { formatPendingUpdateSelection, parseLicenseDate, resolvePendingUpdateDate } from "@/lib/licenses/pendingUpdate"
import { createLicensePath } from "@/lib/licenses/routes"
import type { LicenseDashboardLicense } from "@/lib/licenses/types"
import { updateSubscription } from "@/lib/subscription/client"
import { Badge, Button, SelectContent, SelectInput, SelectItem, SelectItemText, SelectPortal, SelectTrigger, SelectValue, SelectViewport, Text } from "@code0-tech/pictor"
import { IconChevronDown } from "@tabler/icons-react"
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
    const pendingSelection = formatPendingUpdateSelection(license?.pendingUpdate, content, locale)
    const pendingDate = pendingSelection ? resolvePendingUpdateDate(license?.pendingUpdate, license?.currentPeriodEnd) : null
    const currentPeriodEndDate = pendingDate ?? parseLicenseDate(license?.currentPeriodEnd)
    // Both texts mark the date with {date}; while a change is scheduled the date is the day it applies and the text also names the new selection.
    const currentPeriodEndText =
        pendingSelection && pendingDate
            ? content.billing.currentPeriodEndPendingDescription.replaceAll("{selection}", pendingSelection)
            : content.billing.currentPeriodEndDescription
    const [currentPeriodEndTextBeforeDate, currentPeriodEndTextAfterDate] = currentPeriodEndText.split("{date}")
    const periodLabelFor = (value: PaymentPeriod) => subscriptionConfig.paymentPeriod[`${value}Text`]

    return (
        <>
            <LicenseTabHeader title={title} description={content.editor.licenseEditDescription} />

            <LicenseTabSection title={content.license}>
                {license?.deploymentType === "cloud" ? (
                    <LicenseTabRow
                        tone={license.namespaceName ? undefined : "warning"}
                        title={license.namespaceName ?? content.editor.noNamespaceLabel}
                        description={content.editor.licenseDescription}
                        action={
                            <Button paddingSize="xxs" color={"tertiary"} onClick={() => window.location.assign(namespaceHref)}>
                                {content.editor.changeNamespaceLabel}
                            </Button>
                        }
                    />
                ) : null}

                {license && subscriptionId ? (
                    <>
                        <LicenseTabRow
                            title={content.dashboard.statusLabel}
                            description={content.billing.statusDescription}
                            action={
                                <Badge color={getLicenseStatusBadgeColor(license.subscriptionStatus ?? license.status)}>
                                    <Text c="inherit">{formatLicenseDisplayValue(license.subscriptionStatus ?? license.status, "status", content.values)}</Text>
                                </Badge>
                            }
                        />
                        <LicenseTabRow
                            title={content.billing.currentPeriodEndLabel}
                            description={
                                currentPeriodEndDate ? (
                                    <>
                                        {currentPeriodEndTextBeforeDate}
                                        <span className="font-medium text-white">{dateFormatter.format(currentPeriodEndDate)}</span>
                                        {currentPeriodEndTextAfterDate}
                                    </>
                                ) : (
                                    content.billing.currentPeriodEndUnknownDescription
                                )
                            }
                        />
                    </>
                ) : null}
            </LicenseTabSection>

            {license && subscriptionId ? (
                <>
                    <LicenseTabSection title={content.billing.heading}>
                        <LicenseTabRow
                            title={content.billing.periodLabel}
                            description={content.billing.description}
                            action={
                                <div className="[&_.input-wrapper]:w-auto [&_.input-wrapper]:bg-transparent [&_.input-wrapper]:shadow-none [&_.input-wrapper>*]:pl-0">
                                    <SelectInput value={period} onValueChange={(value) => setSelectedPeriod(value as PaymentPeriod)}>
                                        <SelectTrigger w="fit-content" asChild>
                                            <Button type="button" paddingSize="xxs" color="tertiary">
                                                <SelectValue>{periodLabelFor(period)}</SelectValue>
                                                <IconChevronDown aria-hidden="true" size={13} />
                                            </Button>
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectContent position="popper" sideOffset={4}>
                                                <SelectViewport>
                                                    {periodOptions.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            <SelectItemText>{periodLabelFor(option)}</SelectItemText>
                                                        </SelectItem>
                                                    ))}
                                                </SelectViewport>
                                            </SelectContent>
                                        </SelectPortal>
                                    </SelectInput>
                                </div>
                            }
                        />
                        {hasChange ? (
                            isLoadingPreview ? (
                                <LicenseTabRow title={content.subscriptionPreview.totalLabel} description={content.subscriptionPreview.loadingLabel} />
                            ) : previewError ? (
                                <LicenseTabRow>
                                    <Text role="alert" size="sm" className="text-error!">
                                        {previewError}
                                    </Text>
                                </LicenseTabRow>
                            ) : preview ? (
                                <>
                                    <LicenseTabRow
                                        title={content.subscriptionPreview.totalLabel}
                                        description={content.subscriptionPreview.totalDescription}
                                        action={<Text size="md">{formatMinorCurrency(preview.total, preview.currency, locale)}</Text>}
                                        contentSpacing="md"
                                    >
                                        <Button type="button" variant="normal" color="success" paddingSize="xxs" w="100%" justify="center" disabled={isSaving} onClick={() => void save()}>
                                            {isSaving ? <ButtonLoader label={content.billing.changePeriodLabel} /> : content.billing.changePeriodLabel}
                                        </Button>
                                        {saveError ? (
                                            <Text role="alert" size="sm" className="text-error! mt-2!">
                                                {saveError}
                                            </Text>
                                        ) : null}
                                    </LicenseTabRow>
                                    {preview.prorationAmount > 0 ? (
                                        <LicenseTabRow
                                            title={content.subscriptionPreview.prorationLabel}
                                            description={content.subscriptionPreview.prorationDescription}
                                            action={<Text size="md">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</Text>}
                                        />
                                    ) : null}
                                </>
                            ) : null
                        ) : null}
                    </LicenseTabSection>

                    <LicenseTabSection title={content.editor.cancellationHeading}>
                        <LicenseTabRow
                            title={content.cancel.confirmLabel}
                            description={content.cancel.description}
                            action={
                                <Button
                                    type="button"
                                    variant="normal"
                                    color="tertiary"
                                    paddingSize="xxs"
                                    onClick={() => router.push(`${createLicensePath(locale, license.customerId, license.id)}/cancel`)}
                                >
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
