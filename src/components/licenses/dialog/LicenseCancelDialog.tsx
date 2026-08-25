"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
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
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isPending = Boolean(license?.cancelAt)

    const cancel = async () => {
        if (!license?.subscriptionId || isSubmitting) return
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/subscriptions/cancel", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.subscriptionId }),
            })
            if (!response.ok) throw new Error(errors.subscriptionCancel)
            const updated: unknown = await response.json()
            const subscription = updated && typeof updated === "object" ? (updated as { cancelAt?: string; updatedAt?: string }) : {}

            updateLicense(license.id, {
                ...(subscription.cancelAt ? { cancelAt: subscription.cancelAt } : {}),
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
        if (!license?.subscriptionId || isSubmitting) return
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/subscriptions/resume", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.subscriptionId }),
            })
            if (!response.ok) throw new Error(errors.subscriptionResume)
            const updated: unknown = await response.json()
            const subscription = updated && typeof updated === "object" ? (updated as { updatedAt?: string }) : {}

            updateLicense(license.id, { cancelAt: null, canceledAt: null, ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}) })
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
            description={isPending ? content.cancel.pendingDescription : content.cancel.description}
            onClose={close}
            title={isPending ? content.cancel.pendingHeading : content.cancel.confirmLabel}
        >
            <div className="space-y-4">
                {isPending && license?.cancelAt && (
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
                    {isPending ? (
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
