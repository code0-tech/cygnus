"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
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
        <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="max-h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-xl! overflow-y-auto border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="font-normal! text-white!">{isPending ? content.cancel.pendingHeading : content.cancel.title}</DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{isPending ? content.cancel.pendingDescription : content.cancel.description}</DialogDescription>
                    </DialogHeader>
                    <div className="absolute right-4 top-4 z-10">
                        <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="size-9! p-0! text-secondary! hover:text-white!">
                            <IconX size={18} />
                        </Button>
                    </div>

                    <div className="space-y-4 pt-6">
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
                                {content.editor.cancelLabel}
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
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
