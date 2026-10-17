"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { PaymentMethodSetupDialog } from "@/components/licenses/dialog/PaymentMethodSetupDialog"
import { ButtonLoader } from "@/components/ui/Loader"
import type { ErrorsContent, LicenseContent } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { cn } from "@/lib/utils"
import { Button, DialogFooter, Text, TextInput } from "@code0-tech/pictor"
import { IconCreditCard } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { type SyntheticEvent, useCallback, useEffect, useState } from "react"

interface LicenseEditDialogProps {
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
}

type LicenseEditSection = "license" | "payment"

interface PaymentMethodSummary {
    brand: string | null
    expiresMonth: number | null
    expiresYear: number | null
    last4: string | null
    type: string
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
    const [section, setSection] = useState<LicenseEditSection>("license")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodSummary | null>(null)
    const [paymentMethodError, setPaymentMethodError] = useState(false)
    const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false)
    const [paymentMethodRefreshKey, setPaymentMethodRefreshKey] = useState(0)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    useEffect(() => {
        if (license?.namespaceId) setNamespaceId(license.namespaceId)
    }, [license?.namespaceId])

    useEffect(() => {
        if (new URL(window.location.href).searchParams.has("setup_intent")) setSection("payment")
    }, [])

    useEffect(() => {
        if (section !== "payment" || !license?.subscriptionId) return

        const controller = new AbortController()
        const url = new URL("/api/crater/subscriptions/payment-method", window.location.origin)
        url.searchParams.set("subscriptionId", license.subscriptionId)
        setIsLoadingPaymentMethod(true)
        setPaymentMethodError(false)

        void fetch(url, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
            .then(async (response) => {
                const result: unknown = await response.json()
                if (!response.ok || !result || typeof result !== "object" || !("paymentMethod" in result)) throw new Error("Invalid payment method response.")
                return result.paymentMethod as PaymentMethodSummary | null
            })
            .then(setPaymentMethod)
            .catch((loadError) => {
                if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setPaymentMethodError(true)
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingPaymentMethod(false)
            })

        return () => controller.abort()
    }, [license?.subscriptionId, paymentMethodRefreshKey, section])

    const paymentMethodUpdated = useCallback(() => {
        setPaymentMethodRefreshKey((value) => value + 1)
    }, [])

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
    const sidebar = license?.subscriptionId ? (
        <div role="tablist" aria-label={content.editor.licenseTitle} className="flex flex-col gap-2">
            {(["license", "payment"] as const).map((option) => {
                const selected = section === option
                const label = option === "license" ? content.editor.licenseTitle : content.editor.paymentMethodHeading

                return (
                    <Button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        active={selected}
                        variant={selected ? "normal" : "none"}
                        paddingSize="xxs"
                        w="100%"
                        justify="start"
                        className={cn("text-base!", selected && "bg-white/5! shadow-[inset_0_1px_1px_#bfbfbf1a]!")}
                        onClick={() => setSection(option)}
                    >
                        {label}
                    </Button>
                )
            })}
        </div>
    ) : null
    const paymentMethodTitle = paymentMethod?.brand?.trim() || paymentMethod?.type.replaceAll("_", " ")
    const paymentMethodExpiry = paymentMethod?.expiresMonth && paymentMethod.expiresYear ? `${String(paymentMethod.expiresMonth).padStart(2, "0")}/${paymentMethod.expiresYear}` : null

    return (
        <LicenseDialog
            backLabel={content.editor.cancelLabel}
            description={license && isCloud ? content.editor.licenseDescription : undefined}
            onClose={close}
            sidebar={sidebar}
            title={content.editor.licenseTitle}
        >
            {section === "license" || !license?.subscriptionId ? (
                <form onSubmit={save} className="space-y-4" role="tabpanel">
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
            ) : (
                <div role="tabpanel" className="space-y-6">
                    <div>
                        <Text hierarchy="secondary" size="lg">
                            {content.editor.paymentMethodHeading}
                        </Text>
                        <Text size="sm" hierarchy="tertiary" className="mt-2!">
                            {content.editor.paymentMethodDescription}
                        </Text>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                        {isLoadingPaymentMethod ? (
                            <div role="status" className="animate-pulse motion-reduce:animate-none">
                                <span className="sr-only">{content.editor.loadingPaymentMethodLabel}</span>
                                <div aria-hidden="true" className="h-5 w-40 rounded-full bg-white/10" />
                                <div aria-hidden="true" className="mt-2 h-4 w-24 rounded-full bg-white/10" />
                            </div>
                        ) : paymentMethodError ? (
                            <div className="space-y-3">
                                <Text role="alert" size="sm" className="text-error!">
                                    {errors.paymentMethodUpdate}
                                </Text>
                                <Button type="button" variant="normal" paddingSize="xs" onClick={() => setPaymentMethodRefreshKey((value) => value + 1)}>
                                    {errors.retry}
                                </Button>
                            </div>
                        ) : paymentMethod ? (
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/7 text-brand">
                                    <IconCreditCard aria-hidden="true" size={20} />
                                </div>
                                <div className="min-w-0">
                                    <Text size="sm" fw={500} className="capitalize">
                                        {[paymentMethodTitle, paymentMethod.last4 ? `•••• ${paymentMethod.last4}` : null].filter(Boolean).join(" · ")}
                                    </Text>
                                    {paymentMethodExpiry ? (
                                        <Text size="sm" hierarchy="tertiary">
                                            {paymentMethodExpiry}
                                        </Text>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <Text size="sm" hierarchy="tertiary">
                                {content.invoices.unavailableLabel}
                            </Text>
                        )}
                    </div>

                    <PaymentMethodSetupDialog
                        content={content}
                        customerId={license.customerId}
                        errors={errors}
                        licenseId={license.id}
                        locale={locale}
                        onSuccess={paymentMethodUpdated}
                        subscriptionId={license.subscriptionId}
                    />
                </div>
            )}
        </LicenseDialog>
    )
}
