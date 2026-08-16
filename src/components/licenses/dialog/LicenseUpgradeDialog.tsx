"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { Switch } from "@/components/ui/Switch"
import { Slider } from "@/components/ui/Slider"
import { ButtonLoader } from "@/components/ui/Loader"
import type { LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type SubscriptionPlan = "pro" | "max" | "custom"

interface SubscriptionUpdatePreview {
    currency: string
    effectiveAt: string | null
    immediate: boolean
    prorationAmount: number
    total: number
}

interface LicenseUpgradeDialogProps {
    content: LicenseContent
    customerId: string
    licenseId: string
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
}

// Custom counts as the top tier: it is reached by upgrading from pro or max, never the other way around here.
const PLAN_ORDER: Record<SubscriptionPlan, number> = { pro: 0, max: 1, custom: 2 }
const PLANS: SubscriptionPlan[] = ["pro", "max", "custom"]

export function LicenseUpgradeDialog({ content, customerId, licenseId, locale, subscriptionConfig }: LicenseUpgradeDialogProps) {
    const router = useRouter()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    const customerType = resolveSubscriptionCustomerType(license?.customerType)
    const currentPlan = ((license?.plan?.toLowerCase() as SubscriptionPlan | undefined) ?? "pro") satisfies SubscriptionPlan
    const availablePlans = PLANS.filter((candidate) => PLAN_ORDER[candidate] >= PLAN_ORDER[currentPlan])
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const plan = selectedPlan ?? currentPlan
    const wasCustom = currentPlan === "custom"

    const aiTokensRange = subscriptionConfig.aiTokens[customerType]
    const workflowExecutionsRange = subscriptionConfig.workflowExecutions[customerType]
    const aiTokensMin = wasCustom && typeof license?.aiTokens === "number" ? license.aiTokens : aiTokensRange.min
    const aiTokensDefault = wasCustom && typeof license?.aiTokens === "number" ? license.aiTokens : aiTokensRange.default
    const workflowExecutionsMin = wasCustom && typeof license?.workflowExecutions === "number" ? license.workflowExecutions : workflowExecutionsRange.min
    const workflowExecutionsDefault = wasCustom && typeof license?.workflowExecutions === "number" ? license.workflowExecutions : workflowExecutionsRange.default

    const [aiTokens, setAiTokens] = useState<number | null>(null)
    const [workflowExecutions, setWorkflowExecutions] = useState<number | null>(null)
    const resolvedAiTokens = aiTokens ?? aiTokensDefault
    const resolvedWorkflowExecutions = workflowExecutions ?? workflowExecutionsDefault

    const quantitiesChanged = plan === "custom" && (resolvedAiTokens !== aiTokensDefault || resolvedWorkflowExecutions !== workflowExecutionsDefault)
    const hasChange = Boolean(license?.subscriptionId) && (plan !== currentPlan || quantitiesChanged)

    const [preview, setPreview] = useState<SubscriptionUpdatePreview | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const changeFields = {
        plan,
        ...(plan === "custom" ? { aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions } : {}),
    }

    useEffect(() => {
        if (!hasChange || !license?.subscriptionId) {
            setPreview(null)
            setPreviewError(null)
            return
        }

        let active = true
        setIsLoadingPreview(true)
        setPreviewError(null)

        void fetch("/api/crater/subscriptions/preview", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: license.subscriptionId, ...changeFields }),
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(content.subscriptionPreview.error)
                return (await response.json()) as SubscriptionUpdatePreview
            })
            .then((nextPreview) => {
                if (active) setPreview(nextPreview)
            })
            .catch(() => {
                if (active) setPreviewError(content.subscriptionPreview.error)
            })
            .finally(() => {
                if (active) setIsLoadingPreview(false)
            })

        return () => {
            active = false
        }
    }, [content.subscriptionPreview.error, hasChange, license?.subscriptionId, plan, resolvedAiTokens, resolvedWorkflowExecutions])

    const save = async () => {
        if (!license?.subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)
        setSaveError(null)

        try {
            const response = await fetch("/api/crater/subscriptions", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.subscriptionId, ...changeFields }),
            })
            if (!response.ok) throw new Error(content.upgrade.updateError)
            const updated: unknown = await response.json()
            if (!updated || typeof updated !== "object") throw new Error(content.upgrade.updateError)

            const subscription = updated as {
                aiTokens?: number
                paymentPeriod?: string
                pendingUpdate?: { plan?: string; paymentPeriod?: string; aiTokens?: number; workflowExecutions?: number; effectiveAt?: string } | null
                plan?: string
                updatedAt?: string
                workflowExecutions?: number
            }
            updateLicense(license.id, {
                ...(subscription.plan ? { plan: subscription.plan } : {}),
                ...(typeof subscription.aiTokens === "number" ? { aiTokens: subscription.aiTokens } : {}),
                ...(typeof subscription.workflowExecutions === "number" ? { workflowExecutions: subscription.workflowExecutions } : {}),
                pendingUpdate: subscription.pendingUpdate ?? null,
                ...(subscription.updatedAt ? { updatedAt: subscription.updatedAt } : {}),
            })
            close()
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : content.upgrade.updateError)
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
                        <DialogTitle className="font-normal! text-white!">{content.upgrade.title}</DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{content.upgrade.description}</DialogDescription>
                    </DialogHeader>
                    <div className="absolute right-4 top-4 z-10">
                        <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="size-9! p-0! text-secondary! hover:text-white!">
                            <IconX size={18} />
                        </Button>
                    </div>

                    <div className="space-y-4 pt-6">
                        <div>
                            <p className="mb-2 text-sm text-secondary">{content.upgrade.planLabel}</p>
                            <Switch
                                value={plan}
                                options={availablePlans.map((option) => ({ value: option, label: subscriptionConfig.packages[option].title }))}
                                onChange={(value) => setSelectedPlan(value)}
                            />
                        </div>

                        {plan === "custom" && (
                            <div className="space-y-4">
                                {wasCustom && <p className="text-xs text-tertiary">{content.upgrade.increaseOnlyNote}</p>}
                                <Slider
                                    min={aiTokensMin}
                                    max={aiTokensRange.max}
                                    step={aiTokensRange.step}
                                    value={resolvedAiTokens}
                                    onChange={setAiTokens}
                                    onValueCommit={setAiTokens}
                                    ariaLabel={content.dashboard.aiTokensLabel}
                                    className="rounded-2xl border border-white/10 p-4"
                                    variant="gradient"
                                    shape="cone-incline"
                                />
                                <Slider
                                    min={workflowExecutionsMin}
                                    max={workflowExecutionsRange.max}
                                    step={workflowExecutionsRange.step}
                                    value={resolvedWorkflowExecutions}
                                    onChange={setWorkflowExecutions}
                                    onValueCommit={setWorkflowExecutions}
                                    ariaLabel={content.dashboard.workflowExecutionsLabel}
                                    className="rounded-2xl border border-white/10 p-4"
                                    variant="gradient"
                                    shape="cone-incline"
                                />
                            </div>
                        )}

                        {hasChange && (
                            <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                                {isLoadingPreview ? (
                                    <p className="text-tertiary">{content.subscriptionPreview.loadingLabel}</p>
                                ) : previewError ? (
                                    <p role="alert" className="text-error">
                                        {previewError}
                                    </p>
                                ) : preview ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-secondary">{content.subscriptionPreview.totalLabel}</span>
                                            <span className="text-white">{formatMinorCurrency(preview.total, preview.currency, locale)}</span>
                                        </div>
                                        {preview.prorationAmount > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-secondary">{content.subscriptionPreview.prorationLabel}</span>
                                                <span className="text-white">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</span>
                                            </div>
                                        )}
                                        <p className="text-tertiary">{preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}</p>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {saveError && (
                            <p role="alert" className="text-sm text-error">
                                {saveError}
                            </p>
                        )}

                        <DialogFooter className="gap-3! pt-2!">
                            <Button type="button" variant="none" onClick={close}>
                                {content.editor.cancelLabel}
                            </Button>
                            <Button type="button" variant="filled" disabled={!hasChange || isSaving || isLoadingPreview} onClick={() => void save()}>
                                {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
