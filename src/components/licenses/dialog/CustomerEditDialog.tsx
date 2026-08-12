"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import type { LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, EmailInput, TextInput } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useEffect, useState } from "react"

interface CustomerEditDialogProps {
    content: LicenseContent
    customerId: string
    locale: AppLocale
}

async function responseError(response: Response, fallback: string) {
    try {
        const body: unknown = await response.json()
        if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error
    } catch {
        // Use the localized fallback when the response is not JSON.
    }
    return fallback
}

export function CustomerEditDialog({ content, customerId, locale }: CustomerEditDialogProps) {
    const router = useRouter()
    const { customers, updateCustomer } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const customer = customers.find((candidate) => candidate.id === resolvedCustomerId)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}`)

    useEffect(() => {
        if (!customer) return
        setName(customer.name ?? "")
        setEmail(customer.email ?? "")
    }, [customer])

    const save = async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        event.preventDefault()
        if (!customer || isSaving || (!name.trim() && !email.trim())) return
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch("/api/crater/customer", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: customer.id, ...(name.trim() ? { name: name.trim() } : {}), ...(email.trim() ? { email: email.trim() } : {}) }),
            })
            if (!response.ok) throw new Error(await responseError(response, content.editor.customerError))

            updateCustomer(customer.id, { ...(name.trim() ? { name: name.trim() } : {}), ...(email.trim() ? { email: email.trim() } : {}) })
            close()
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : content.editor.customerError)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogPortal>
                <DialogOverlay className="backdrop-blur-sm" />
                <DialogContent className="max-h-[calc(100dvh-2rem)]! w-[calc(100vw-2rem)]! max-w-xl! overflow-y-auto border border-white/5 bg-primary! p-4! sm:p-6!">
                    <DialogHeader className="pr-10 text-left!">
                        <DialogTitle className="font-normal! text-white!">{content.editor.customerTitle}</DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{content.editor.customerDescription}</DialogDescription>
                    </DialogHeader>
                    <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="absolute right-4 top-4 size-9! p-0! text-secondary! hover:text-white!">
                        <IconX size={18} />
                    </Button>
                    <form onSubmit={save} className="space-y-4 pt-6">
                        <TextInput label={content.editor.nameLabel} value={name} onChange={(event) => setName(event.currentTarget.value)} className="w-full!" />
                        <EmailInput label={content.dashboard.emailLabel} value={email} onChange={(event) => setEmail(event.currentTarget.value)} className="w-full!" />
                        {error && (
                            <p role="alert" className="text-sm text-error">
                                {error}
                            </p>
                        )}
                        <DialogFooter className="gap-3! pt-2!">
                            <Button type="button" variant="none" onClick={close}>
                                {content.editor.cancelLabel}
                            </Button>
                            <Button type="submit" variant="filled" disabled={!customer || isSaving || (!name.trim() && !email.trim())}>
                                {content.editor.saveLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
