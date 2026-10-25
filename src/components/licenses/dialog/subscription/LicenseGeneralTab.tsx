"use client"

import { useLicenseToasts } from "@/components/licenses/layout/LicenseNotifications"
import { type PaymentPeriod, PAYMENT_PERIOD_OPTIONS } from "@/lib/subscription/types"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { CustomerPaymentMethodCardSkeleton } from "@/components/licenses/dialog/customer/CustomerPaymentMethodCard"
import { getLicenseStatusBadgeColor, isLicenseStatusActive, isLicenseStatusCanceled, LICENSE_STATUS_ERROR_BADGE_COLOR } from "@/components/licenses/shared/LicenseStatusDot"
import { LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import { formatMinorCurrency } from "@/lib/formatters"
import type { AppLocale } from "@/lib/i18n"
import { formatLicenseDisplayValue } from "@/lib/licenses/displayValues"
import { formatPendingUpdateSelection, parseLicenseDate, resolvePendingUpdateDate } from "@/lib/licenses/pendingUpdate"
import type { CustomerPaymentMethodSummary, LicenseDashboardLicense, PaymentMethodDisplayDetails } from "@/lib/licenses/types"
import { cancelLicenseSubscription, resumeLicenseSubscription } from "@/lib/licenses/client"
import { updateSubscription } from "@/lib/subscription/client"
import { PICTOR_BADGE_CLASS_NAME, StableBadge } from "@/components/ui/StableBadge"
import { Alert, Badge, Button, SelectContent, SelectInput, SelectItem, SelectItemText, SelectPortal, SelectTrigger, SelectValue, SelectViewport, Text } from "@code0-tech/pictor"
import { IconChevronDown } from "@tabler/icons-react"
import { useState } from "react"

// The CMS texts mark their values with {selection} and {date}; keeping the markers as parts lets them be rendered with their own hierarchy.
function splitTemplate(text: string) {
    return text.split(/(\{selection\}|\{date\})/)
}

// The payment tab shows the full card; inside the billing rows the method is one line of text, like the other row descriptions.
function formatPaymentMethodSummary(method: PaymentMethodDisplayDetails, fallback: string) {
    const label = method.brand?.trim() || method.type?.replaceAll("_", " ") || null
    return [label, method.last4 ? `•••• ${method.last4}` : null].filter(Boolean).join(" · ") || fallback
}

interface LicenseGeneralTabProps {
    content: LicenseContent
    errors: ErrorsContent
    assigningPaymentMethodId?: string | null
    isLoadingPaymentMethod?: boolean
    license?: LicenseDashboardLicense
    locale: AppLocale
    namespaceHref: string
    onAssignPaymentMethod?: (paymentMethodId: string) => void
    onClose: () => void
    onRetryPaymentMethod?: () => void
    paymentMethodError?: boolean
    paymentMethods?: CustomerPaymentMethodSummary[] | null
    subscriptionConfig: SubscriptionConfigData
    title: string
}

export function LicenseGeneralTab({
    assigningPaymentMethodId,
    content,
    errors,
    isLoadingPaymentMethod,
    license,
    locale,
    namespaceHref,
    onAssignPaymentMethod,
    onClose,
    onRetryPaymentMethod,
    paymentMethodError,
    paymentMethods,
    subscriptionConfig,
    title,
}: LicenseGeneralTabProps) {
    const toasts = useLicenseToasts()
    const { updateLicense } = useLicenseData()
    const subscriptionId = license?.subscriptionId
    const periodOptions = PAYMENT_PERIOD_OPTIONS
    const currentPeriod = license?.paymentPeriod as PaymentPeriod | undefined
    const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod | null>(null)
    const period = selectedPeriod ?? currentPeriod ?? periodOptions[0]
    // A scheduled switch is not applied yet, so the select keeps showing the period that is billed today; picking the already scheduled one is no new change.
    const pendingPeriod = (license?.pendingUpdate?.paymentPeriod as PaymentPeriod | undefined) ?? null
    const hasChange = Boolean(subscriptionId) && period !== currentPeriod && period !== pendingPeriod
    const { isLoadingPreview, preview, previewError } = useSubscriptionUpdatePreview(hasChange ? subscriptionId : undefined, { paymentPeriod: period }, errors.subscriptionPreview)
    const [isSaving, setIsSaving] = useState(false)

    const save = async () => {
        if (!license || !subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)

        try {
            const subscription = await updateSubscription({ id: subscriptionId, paymentPeriod: period }, errors.billingUpdate)
            updateLicense(license.id, {
                pendingUpdate: subscription.pendingUpdate ?? null,
                ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
                ...(subscription.paymentPeriod ? { paymentPeriod: subscription.paymentPeriod } : {}),
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            toasts.success(subscription.pendingUpdate ? "changeScheduled" : "periodUpdated", subscription.pendingUpdate?.effectiveAt)
            onClose()
        } catch (error) {
            toasts.error(error instanceof Error ? error.message : errors.billingUpdate)
        } finally {
            setIsSaving(false)
        }
    }

    // Anything but a running subscription is a problem the customer has to act on, so the badge reads red unless the status is active.
    const status = license?.subscriptionStatus ?? license?.status
    const isCanceled = isLicenseStatusCanceled(status)
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    const pendingSelection = formatPendingUpdateSelection(license?.pendingUpdate, content, locale)
    const pendingDate = pendingSelection ? resolvePendingUpdateDate(license?.pendingUpdate, license?.currentPeriodEnd) : null
    // A canceled subscription has nothing scheduled any more, so its row dates the end of the period that is still paid for.
    const currentPeriodEndDate = isCanceled ? parseLicenseDate(license?.currentPeriodEnd) : (pendingDate ?? parseLicenseDate(license?.currentPeriodEnd))
    // All three texts mark the date with {date}; a canceled subscription does not renew, and while a change is scheduled the date is the day it applies and the text also names the new selection.
    const currentPeriodEndText = isCanceled
        ? content.billing.currentPeriodEndCanceledDescription
        : pendingSelection && pendingDate
          ? content.billing.currentPeriodEndPendingDescription.replaceAll("{selection}", pendingSelection)
          : content.billing.currentPeriodEndDescription
    const [currentPeriodEndTextBeforeDate, currentPeriodEndTextAfterDate] = currentPeriodEndText.split("{date}")
    const periodLabelFor = (value: PaymentPeriod) => subscriptionConfig.paymentPeriod[`${value}Text`]
    // The period row has to say that a switch is already scheduled, otherwise the select reads like nothing is going to change.
    const pendingPeriodDate = pendingPeriod ? resolvePendingUpdateDate(license?.pendingUpdate, license?.currentPeriodEnd) : null
    // The scheduled switch continues the row description, with the new period and its date lifted out of the tertiary text like the renewal date above.
    const pendingPeriodNote = pendingPeriod
        ? splitTemplate(pendingPeriodDate ? content.billing.currentPeriodEndPendingDescription : content.billing.pendingChangeNote).map((part, index) =>
              part === "{selection}" || part === "{date}" ? (
                  <span key={index} className="font-medium text-white">
                      {part === "{selection}" ? periodLabelFor(pendingPeriod) : pendingPeriodDate ? dateFormatter.format(pendingPeriodDate) : ""}
                  </span>
              ) : (
                  part
              )
          )
        : null
    // The cancellation rows below replace the former cancel dialog: both the period end and the immediate variant confirm in place, inside the cancellation card.
    const [isCanceling, setIsCanceling] = useState(false)
    const [confirming, setConfirming] = useState<"immediate" | "periodEnd" | null>(null)
    const isCancelPending = !isCanceled && Boolean(license?.cancelAt)
    const canCancelImmediately = !isCanceled && license?.immediateCancellationAvailable === true
    const cancellationDate = parseLicenseDate(license?.cancelAt ?? license?.currentPeriodEnd)
    const immediateCancellationUntil = parseLicenseDate(license?.immediateCancellationUntil)

    const cancel = async (immediately = false) => {
        if (!license?.subscriptionId || isCanceled || isCanceling) return
        setIsCanceling(true)

        try {
            const subscription = await cancelLicenseSubscription(license.subscriptionId, errors.subscriptionCancel, immediately)

            updateLicense(license.id, {
                cancelAt: subscription.cancelAt ?? null,
                canceledAt: subscription.canceledAt ?? null,
                pendingUpdate: null,
                immediateCancellationAvailable: subscription.immediateCancellationAvailable === true,
                ...(subscription.immediateCancellationUntil ? { immediateCancellationUntil: subscription.immediateCancellationUntil } : {}),
                ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            setConfirming(null)
            toasts.success(subscription.status === "CANCELED" ? "canceled" : "cancellationScheduled", subscription.cancelAt)
        } catch (error) {
            toasts.error(error instanceof Error ? error.message : errors.subscriptionCancel)
        } finally {
            setIsCanceling(false)
        }
    }

    const resume = async () => {
        if (!license?.subscriptionId || !isCancelPending || isCanceling) return
        setIsCanceling(true)

        try {
            const subscription = await resumeLicenseSubscription(license.subscriptionId, errors.subscriptionResume)

            updateLicense(license.id, {
                cancelAt: null,
                canceledAt: null,
                immediateCancellationAvailable: subscription.immediateCancellationAvailable === true,
                ...(subscription.immediateCancellationUntil ? { immediateCancellationUntil: subscription.immediateCancellationUntil } : {}),
                ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            setConfirming(null)
            toasts.success("resumed")
        } catch (error) {
            toasts.error(error instanceof Error ? error.message : errors.subscriptionResume)
        } finally {
            setIsCanceling(false)
        }
    }

    // Same rule as the upgrade preview: effectiveAt dates the charge, the new total is first billed with the next period.
    const previewChargedOnDate = preview ? (preview.immediate ? new Date() : parseLicenseDate(preview.effectiveAt)) : null
    const previewNextPeriodDate = parseLicenseDate(license?.currentPeriodEnd)
    const selectedPaymentMethod = paymentMethods?.find((method) => method.id === license?.paymentMethodId) ?? null

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
                                <StableBadge color={isLicenseStatusActive(status) ? getLicenseStatusBadgeColor(status) : LICENSE_STATUS_ERROR_BADGE_COLOR} className={PICTOR_BADGE_CLASS_NAME}>
                                    <Text c="inherit">{formatLicenseDisplayValue(status, "status", content.values)}</Text>
                                </StableBadge>
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
                    {/* A canceled subscription cannot change its payment method or period any more, so the billing card is hidden along with the cancellation action. */}
                    {isCanceled ? null : (
                        <>
                            <LicenseTabSection title={content.billing.heading}>
                                {isLoadingPaymentMethod ? (
                                    <CustomerPaymentMethodCardSkeleton label={content.editor.loadingPaymentMethodLabel} />
                                ) : paymentMethodError ? (
                                    <LicenseTabRow title={content.editor.paymentMethodTabLabel}>
                                        <Alert color="error">
                                            <span className="min-w-0 flex-1">{errors.paymentMethodLoad}</span>
                                            <Button type="button" variant="normal" paddingSize="xxs" onClick={onRetryPaymentMethod}>
                                                {errors.retry}
                                            </Button>
                                        </Alert>
                                    </LicenseTabRow>
                                ) : (
                                    <LicenseTabRow
                                        title={content.editor.paymentMethodTabLabel}
                                        description={content.editor.paymentMethodDescription}
                                        action={
                                            paymentMethods && paymentMethods.length > 0 ? (
                                                <div className="[&_.input-wrapper]:w-auto [&_.input-wrapper]:bg-transparent [&_.input-wrapper]:shadow-none [&_.input-wrapper>*]:pl-0">
                                                    <SelectInput value={license.paymentMethodId ?? undefined} onValueChange={(value) => onAssignPaymentMethod?.(value)}>
                                                        <SelectTrigger w="fit-content" asChild>
                                                            <Button type="button" paddingSize="xxs" color="tertiary" disabled={Boolean(assigningPaymentMethodId)}>
                                                                {assigningPaymentMethodId ? (
                                                                    <ButtonLoader label={content.editor.settingPaymentMethodLabel} />
                                                                ) : (
                                                                    <>
                                                                        <SelectValue placeholder={content.invoices.unavailableLabel}>
                                                                            <span className="capitalize">
                                                                            {selectedPaymentMethod ? formatPaymentMethodSummary(selectedPaymentMethod, content.invoices.unavailableLabel) : content.invoices.unavailableLabel}
                                                                            </span>
                                                                        </SelectValue>
                                                                        <IconChevronDown aria-hidden="true" size={13} />
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </SelectTrigger>
                                                        <SelectPortal>
                                                            <SelectContent position="popper" sideOffset={4}>
                                                                <SelectViewport>
                                                                    {paymentMethods.map((method) => (
                                                                        <SelectItem key={method.id} value={method.id}>
                                                                            <SelectItemText>
                                                                                <span className="capitalize">{formatPaymentMethodSummary(method, content.invoices.unavailableLabel)}</span>
                                                                            </SelectItemText>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectViewport>
                                                            </SelectContent>
                                                        </SelectPortal>
                                                    </SelectInput>
                                                </div>
                                            ) : (
                                                <Text size="md">{content.invoices.unavailableLabel}</Text>
                                            )
                                        }
                                    >
                                    </LicenseTabRow>
                                )}
                                <LicenseTabRow
                                    title={content.billing.periodLabel}
                                    description={
                                        pendingPeriodNote ? (
                                            <>
                                                {content.billing.description} {pendingPeriodNote}
                                            </>
                                        ) : (
                                            content.billing.description
                                        )
                                    }
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
                                            <Alert color="error">
                                                {previewError}
                                            </Alert>
                                        </LicenseTabRow>
                                    ) : preview ? (
                                        <>
                                            <LicenseTabRow
                                                title={content.subscriptionPreview.totalLabel}
                                                description={content.subscriptionPreview.totalDescription}
                                                action={
                                                    <div className="text-right">
                                                        <Text size="md">{formatMinorCurrency(preview.total, preview.currency, locale)}</Text>
                                                        {previewNextPeriodDate ? (
                                                            <Text size="sm" hierarchy="tertiary">
                                                                {dateFormatter.format(previewNextPeriodDate)}
                                                            </Text>
                                                        ) : null}
                                                    </div>
                                                }
                                                contentSpacing="md"
                                            >
                                                <Button type="button" variant="normal" color="success" paddingSize="xxs" w="100%" justify="center" disabled={isSaving} onClick={() => void save()}>
                                                    {isSaving ? <ButtonLoader label={content.billing.changePeriodLabel} /> : content.billing.changePeriodLabel}
                                                </Button>
                                            </LicenseTabRow>
                                            {preview.prorationAmount > 0 ? (
                                                <LicenseTabRow
                                                    title={content.subscriptionPreview.prorationLabel}
                                                    description={content.subscriptionPreview.prorationDescription}
                                                    action={
                                                        <div className="text-right">
                                                            <Text size="md">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</Text>
                                                            {previewChargedOnDate ? (
                                                                <Text size="sm" hierarchy="tertiary">
                                                                    {dateFormatter.format(previewChargedOnDate)}
                                                                </Text>
                                                            ) : null}
                                                        </div>
                                                    }
                                                />
                                            ) : null}
                                        </>
                                    ) : null
                                ) : null}
                            </LicenseTabSection>

                            <LicenseTabSection title={content.editor.cancellationHeading}>
                                {isCancelPending ? (
                                    <>
                                        <LicenseTabRow
                                            title={content.cancel.pendingHeading}
                                            description={content.cancel.pendingDescription}
                                            action={cancellationDate ? <Badge color="tertiary">{dateFormatter.format(cancellationDate)}</Badge> : null}
                                        />
                                        <LicenseTabRow
                                            title={content.cancel.resumeLabel}
                                            action={
                                                <Button type="button" variant="normal" color="tertiary" paddingSize="xxs" disabled={isCanceling} onClick={() => void resume()}>
                                                    {isCanceling ? <ButtonLoader label={content.cancel.resumeLabel} /> : content.cancel.resumeLabel}
                                                </Button>
                                            }
                                        />
                                    </>
                                ) : (
                                    <LicenseTabRow
                                        title={content.cancel.confirmLabel}
                                        description={content.cancel.description}
                                        action={
                                            confirming === "periodEnd" ? null : (
                                                <Button type="button" variant="normal" color="tertiary" paddingSize="xxs" disabled={isCanceling} onClick={() => setConfirming("periodEnd")}>
                                                    {content.cancel.confirmLabel}
                                                </Button>
                                            )
                                        }
                                    >
                                        {/* The confirmation stays in this row instead of opening a dialog: the date it takes effect is right above it. */}
                                        {confirming === "periodEnd" ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button type="button" variant="normal" paddingSize="xxs" w="100%" justify="center" disabled={isCanceling} onClick={() => setConfirming(null)}>
                                                    {content.cancel.immediateConfirmBackLabel}
                                                </Button>
                                                <Button type="button" variant="normal" color="error" paddingSize="xxs" w="100%" justify="center" disabled={isCanceling} onClick={() => void cancel()}>
                                                    {isCanceling ? <ButtonLoader label={content.cancel.confirmLabel} /> : content.cancel.confirmLabel}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </LicenseTabRow>
                                )}

                                {canCancelImmediately ? (
                                    <LicenseTabRow
                                        title={content.cancel.immediateConfirmLabel}
                                        description={
                                            confirming === "immediate"
                                                ? content.cancel.immediateConfirmDescription
                                                : immediateCancellationUntil
                                                  ? `${content.cancel.immediateDescription} ${content.cancel.immediateUntilLabel}: ${dateFormatter.format(immediateCancellationUntil)}`
                                                  : content.cancel.immediateDescription
                                        }
                                        action={
                                            confirming === "immediate" ? null : (
                                                <Button type="button" variant="normal" color="tertiary" paddingSize="xxs" disabled={isCanceling} onClick={() => setConfirming("immediate")}>
                                                    {content.cancel.immediateConfirmLabel}
                                                </Button>
                                            )
                                        }
                                    >
                                        {confirming === "immediate" ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button type="button" variant="normal" paddingSize="xxs" w="100%" justify="center" disabled={isCanceling} onClick={() => setConfirming(null)}>
                                                    {content.cancel.immediateConfirmBackLabel}
                                                </Button>
                                                <Button type="button" variant="normal" color="error" paddingSize="xxs" w="100%" justify="center" disabled={isCanceling} onClick={() => void cancel(true)}>
                                                    {isCanceling ? <ButtonLoader label={content.cancel.immediateConfirmSubmitLabel} /> : content.cancel.immediateConfirmSubmitLabel}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </LicenseTabRow>
                                ) : null}
                            </LicenseTabSection>
                        </>
                    )}
                </>
            ) : null}
        </>
    )
}
