"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, TextInput } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
}

export function LicenseEditDialog({ content, customerId, licenseId, locale }: LicenseEditDialogProps) {
    const router = useRouter()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const [namespaceId, setNamespaceId] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    useEffect(() => {
        if (license?.namespaceId) setNamespaceId(license.namespaceId)
    }, [license?.namespaceId])

    const save = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault()
        if (!license || license.deploymentType !== "cloud" || !namespaceId.trim() || isSaving) return
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/licenses", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.id, namespaceId: namespaceId.trim() }),
            })
            if (!response.ok) throw new Error(content.editor.licenseError)
            const updated: unknown = await response.json()
            const updatedAt = updated && typeof updated === "object" && "updatedAt" in updated && typeof updated.updatedAt === "string" ? updated.updatedAt : undefined

            updateLicense(license.id, { namespaceId: namespaceId.trim(), ...(updatedAt ? { updatedAt } : {}) })
            close()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : content.editor.licenseError)
        } finally {
            setIsSaving(false)
        }
    }

    const isCloud = license?.deploymentType === "cloud"

    return (
        <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="max-h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-xl! overflow-y-auto border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="font-normal! text-white!">{content.editor.licenseTitle}</DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{content.editor.licenseDescription}</DialogDescription>
                    </DialogHeader>
                    <div className="absolute right-4 top-4 z-10">
                        <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="size-9! p-0! text-secondary! hover:text-white!">
                            <IconX size={18} />
                        </Button>
                    </div>
                    <form onSubmit={save} className="space-y-4 pt-6">
                        {license && !isCloud ? (
                            <p className="text-sm text-secondary">{content.editor.selfHostedDescription}</p>
                        ) : (
                            <TextInput label={content.editor.namespaceLabel} value={namespaceId} onChange={(event) => setNamespaceId(event.currentTarget.value)} className="w-full!" />
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
                            {(!license || isCloud) && (
                                <Button type="submit" variant="filled" disabled={!license || !namespaceId.trim() || isSaving}>
                                    {content.editor.saveLabel}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
