"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, DialogFooter, TextInput } from "@code0-tech/pictor"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
}

export function LicenseEditDialog({ content, customerId, errors, licenseId, locale }: LicenseEditDialogProps) {
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
            if (!response.ok) throw new Error(errors.licenseUpdate)
            const updated: unknown = await response.json()
            const updatedAt = updated && typeof updated === "object" && "updatedAt" in updated && typeof updated.updatedAt === "string" ? updated.updatedAt : undefined

            updateLicense(license.id, { namespaceId: namespaceId.trim(), ...(updatedAt ? { updatedAt } : {}) })
            close()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : errors.licenseUpdate)
        } finally {
            setIsSaving(false)
        }
    }

    const isCloud = license?.deploymentType === "cloud"

    return (
        <LicenseDialog backLabel={content.editor.cancelLabel} description={license && isCloud ? content.editor.licenseDescription : undefined} onClose={close} title={content.editor.licenseTitle}>
            <form onSubmit={save} className="space-y-4">
                {license && isCloud && <TextInput label={content.editor.namespaceLabel} value={namespaceId} onChange={(event) => setNamespaceId(event.currentTarget.value)} className="w-full!" />}
                {error && (
                    <p role="alert" className="text-sm text-error">
                        {error}
                    </p>
                )}
                <DialogFooter className="gap-3! pt-2! justify-between!">
                    {license?.subscriptionId && (
                        <Button
                            type="button"
                            variant="normal"
                            onClick={() => router.push(`/${locale}/licenses/customer/${encodeURIComponent(license.customerId)}/license/${encodeURIComponent(license.id)}/cancel`)}
                        >
                            {content.cancel.confirmLabel}
                        </Button>
                    )}
                    <div className="flex gap-3">
                        {(!license || isCloud) && (
                            <Button type="submit" variant="filled" disabled={!license || !namespaceId.trim() || isSaving}>
                                {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </form>
        </LicenseDialog>
    )
}
