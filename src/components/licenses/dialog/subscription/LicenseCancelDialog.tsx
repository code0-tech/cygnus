"use client"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/shared/LicenseDialog"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { ButtonLoader } from "@/components/ui/Loader"

import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { cancelLicenseSubscription, resumeLicenseSubscription } from "@/lib/licenses/client"
import { Badge, Button } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LicenseCancelDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
}

export function LicenseCancelDialog({ content, customerId, errors, licenseId, locale }: LicenseCancelDialogProps) {
    const router = useRouter()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedSubscriptionId = resolveSubscriptionRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedSubscriptionId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(createLicensePath(locale, resolvedCustomerId, resolvedSubscriptionId))

    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const subscriptionStatus = license?.subscriptionStatus?.toLowerCase()
    const isTerminal = subscriptionStatus === "canceled" || subscriptionStatus === "incomplete_expired"
    const isPending = !isTerminal && Boolean(license?.cancelAt)
    const canCancelImmediately = !isTerminal && license?.immediateCancellationAvailable === true

    const cancel = async (immediately = false) => {
        if (!license?.subscriptionId || isTerminal || isSubmitting || (immediately && !canCancelImmediately)) return
        setIsSubmitting(true)
        setError(null)

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
            close()
        } catch (cancelError) {
            setError(cancelError instanceof Error ? cancelError.message : errors.subscriptionCancel)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resume = async () => {
        if (!license?.subscriptionId || !isPending || isSubmitting) return
        setIsSubmitting(true)
        setError(null)

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
            close()
        } catch (resumeError) {
            setError(resumeError instanceof Error ? resumeError.message : errors.subscriptionResume)
        } finally {
            setIsSubmitting(false)
        }
    }

    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    const title = isTerminal
        ? subscriptionStatus === "canceled" ? content.values.statuses.canceled : content.values.statuses.incompleteExpired
        : isPending ? content.cancel.pendingHeading : content.editor.cancellationHeading
    const description = isPending || isTerminal ? content.cancel.pendingDescription : content.cancel.description
    const cancellationDate = license?.cancelAt ?? license?.currentPeriodEnd

    return (
        <LicenseDialog
            backLabel={content.editor.closeLabel}
            description={description}
            onClose={close}
            title={title}
        >
            <LicenseTabHeader title={title} description={description} />
            {error ? <LicenseTabAlert>{error}</LicenseTabAlert> : null}

            <LicenseTabSection>
                {cancellationDate ? (
                    <LicenseTabRow
                        title={content.cancel.cancelAtLabel}
                        action={<Badge color="tertiary">{dateFormatter.format(new Date(cancellationDate))}</Badge>}
                    />
                ) : null}
                {!isTerminal ? (
                    <LicenseTabRow
                        title={isPending ? content.cancel.resumeLabel : content.cancel.confirmLabel}
                        action={
                            isPending ? (
                                <Button type="button" variant="normal" paddingSize="xxs" disabled={!license?.subscriptionId || isSubmitting} onClick={() => void resume()}>
                                    {isSubmitting ? <ButtonLoader label={content.cancel.resumeLabel} /> : content.cancel.resumeLabel}
                                </Button>
                            ) : (
                                <Button type="button" variant="normal" paddingSize="xxs" color="error" disabled={!license?.subscriptionId || isSubmitting} onClick={() => void cancel()}>
                                    {isSubmitting ? <ButtonLoader label={content.cancel.confirmLabel} /> : content.cancel.confirmLabel}
                                </Button>
                            )
                        }
                    />
                ) : null}
            </LicenseTabSection>

            {canCancelImmediately ? (
                <LicenseTabSection title={content.cancel.immediateConfirmLabel}>
                    {license?.immediateCancellationUntil ? (
                        <LicenseTabRow
                            title={content.cancel.immediateUntilLabel}
                            action={<Badge color="tertiary">{dateFormatter.format(new Date(license.immediateCancellationUntil))}</Badge>}
                        />
                    ) : null}
                    <LicenseTabRow
                        description={content.cancel.immediateDescription}
                        action={
                            <Button type="button" variant="normal" paddingSize="xxs" color="error" disabled={!license?.subscriptionId || isSubmitting} onClick={() => void cancel(true)}>
                                {isSubmitting ? <ButtonLoader label={content.cancel.immediateConfirmLabel} /> : content.cancel.immediateConfirmLabel}
                            </Button>
                        }
                    />
                </LicenseTabSection>
            ) : null}
        </LicenseDialog>
    )
}
