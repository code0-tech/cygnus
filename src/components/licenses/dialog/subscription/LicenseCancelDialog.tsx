"use client"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/shared/LicenseDialog"
import { ButtonLoader } from "@/components/ui/Loader"

import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { cancelLicenseSubscription, resumeLicenseSubscription } from "@/lib/licenses/client"
import { Button, DialogFooter } from "@code0-tech/pictor"
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

    return (
        <LicenseDialog
            backLabel={content.editor.closeLabel}
            description={isTerminal ? undefined : isPending ? content.cancel.pendingDescription : content.cancel.description}
            onClose={close}
            title={isTerminal ? subscriptionStatus === "canceled" ? content.values.statuses.canceled : content.values.statuses.incompleteExpired : isPending ? content.cancel.pendingHeading : content.cancel.confirmLabel}
        >
            <div className="space-y-4">
                {canCancelImmediately && license?.immediateCancellationUntil && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                        <p className="text-secondary">{content.cancel.immediateDescription}</p>
                        <p className="mt-3 text-tertiary">{content.cancel.immediateUntilLabel}</p>
                        <p className="mt-1 text-white">{dateFormatter.format(new Date(license.immediateCancellationUntil))}</p>
                    </div>
                )}
                {(isPending || isTerminal) && license?.cancelAt && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                        <p className="text-tertiary">{content.cancel.cancelAtLabel}</p>
                        <p className="mt-1 text-white">{dateFormatter.format(new Date(license.cancelAt))}</p>
                    </div>
                )}

                {error && (
                    <p role="alert" className="text-sm text-error">
                        {error}
                    </p>
                )}

                <DialogFooter className="gap-3! pt-2!">
                    <Button type="button" variant="none" onClick={close}>
                        {content.editor.closeLabel}
                    </Button>
                    {canCancelImmediately && (
                        <Button type="button" variant="normal" disabled={!license?.subscriptionId || isSubmitting} onClick={() => void cancel(true)}>
                            {isSubmitting ? <ButtonLoader label={content.cancel.immediateConfirmLabel} /> : content.cancel.immediateConfirmLabel}
                        </Button>
                    )}
                    {isTerminal ? null : isPending ? (
                        <Button type="button" variant="filled" disabled={!license || isSubmitting} onClick={() => void resume()}>
                            {isSubmitting ? <ButtonLoader label={content.cancel.resumeLabel} /> : content.cancel.resumeLabel}
                        </Button>
                    ) : (
                        <Button type="button" variant="filled" disabled={!license?.subscriptionId || isSubmitting} onClick={() => void cancel()}>
                            {isSubmitting ? <ButtonLoader label={content.cancel.confirmLabel} /> : content.cancel.confirmLabel}
                        </Button>
                    )}
                </DialogFooter>
            </div>
        </LicenseDialog>
    )
}
