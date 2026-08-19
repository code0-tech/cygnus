"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { SummaryBadge } from "@/components/checkout/CheckoutSummaryBadge"
import { Switch } from "@/components/ui/Switch"
import { Slider } from "@/components/ui/Slider"
import { ButtonLoader } from "@/components/ui/Loader"
import { getIcon } from "@/components/ui/IconRenderer"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import { decodeLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import { calculateSubscriptionQuote, type PaymentPeriod } from "@/lib/subscriptionCalculator"
import { getSubscriptionCatalog } from "@/lib/subscriptionCatalog"
import { getPaymentPeriodForCustomerType } from "@/lib/subscriptionConfigurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from "@code0-tech/pictor"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

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
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

// Custom counts as the top tier: it is reached by upgrading from pro or max, never the other way around here.
const PLAN_ORDER: Record<SubscriptionPlan, number> = { pro: 0, max: 1, custom: 2 }
const PLANS: SubscriptionPlan[] = ["pro", "max", "custom"]

export function LicenseUpgradeDialog({ content, customerId, errors, licenseId, locale, subscriptionConfig, subscriptionPrices }: LicenseUpgradeDialogProps) {
    const router = useRouter()
    const { licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = decodeLicenseRouteId(customerId)
    const resolvedLicenseId = decodeLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(`/${locale}/licenses/customer/${encodeURIComponent(resolvedCustomerId)}/license/${encodeURIComponent(resolvedLicenseId)}`)

    const customerType = resolveSubscriptionCustomerType(license?.customerType)
    const currentPlan = ((license?.plan?.toLowerCase() as SubscriptionPlan | undefined) ?? "pro") satisfies SubscriptionPlan
    // Only plans strictly above the current one are real upgrade targets. With just one (or zero, already
    // on custom), there is nothing to choose between, so the picker collapses to a plain label.
    const upgradeTargets = PLANS.filter((candidate) => PLAN_ORDER[candidate] > PLAN_ORDER[currentPlan])
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const plan = selectedPlan ?? upgradeTargets[0] ?? currentPlan
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

    // Computed entirely from the CMS/Stripe price catalog already on the client, so it updates on every slider
    // tick without waiting for the debounced Crater preview request below.
    const paymentPeriod = getPaymentPeriodForCustomerType(customerType, (license?.paymentPeriod?.toLowerCase() as PaymentPeriod | undefined) ?? "monthly")
    const catalog = useMemo(() => getSubscriptionCatalog(subscriptionConfig, subscriptionPrices), [subscriptionConfig, subscriptionPrices])
    const localQuote = useMemo(
        () => calculateSubscriptionQuote({ plan, deployment: "cloud", customerType, paymentPeriod, aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions }, catalog),
        [catalog, customerType, paymentPeriod, plan, resolvedAiTokens, resolvedWorkflowExecutions]
    )

    const [preview, setPreview] = useState<SubscriptionUpdatePreview | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    const changeFields = {
        plan,
        ...(plan === "custom" ? { aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions } : {}),
    }

    useEffect(() => {
        if (!license?.subscriptionId) {
            setPreview(null)
            setPreviewError(null)
            return
        }

        let active = true
        setIsLoadingPreview(true)
        setPreviewError(null)

        // While the slider is being dragged, plan/resolvedAiTokens/resolvedWorkflowExecutions change on every
        // tick. Debounce the actual preview request so dragging doesn't spam Crater with a request per pixel.
        const debounceTimer = window.setTimeout(() => {
            void fetch("/api/crater/subscriptions/preview", {
                method: "POST",
                credentials: "same-origin",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: license.subscriptionId, ...changeFields }),
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(errors.subscriptionPreview)
                    return (await response.json()) as SubscriptionUpdatePreview
                })
                .then((nextPreview) => {
                    if (active) setPreview(nextPreview)
                })
                .catch(() => {
                    if (active) setPreviewError(errors.subscriptionPreview)
                })
                .finally(() => {
                    if (active) setIsLoadingPreview(false)
                })
        }, 400)

        return () => {
            active = false
            window.clearTimeout(debounceTimer)
        }
    }, [errors.subscriptionPreview, license?.subscriptionId, plan, resolvedAiTokens, resolvedWorkflowExecutions])

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
            if (!response.ok) throw new Error(errors.planUpgrade)
            const updated: unknown = await response.json()
            if (!updated || typeof updated !== "object") throw new Error(errors.planUpgrade)

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
            setSaveError(error instanceof Error ? error.message : errors.planUpgrade)
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
                        <DialogTitle className="font-normal! text-white! flex items-center gap-2">
                            {content.upgrade.title}
                            <SummaryBadge size="lg" icon={getIcon(subscriptionConfig.plan[plan].icon, 18)} tone={subscriptionConfig.plan[plan].color} value={subscriptionConfig.plan[plan].title} />
                        </DialogTitle>
                        <DialogDescription className="text-sm! text-secondary!">{content.upgrade.description}</DialogDescription>
                    </DialogHeader>
                    <div className="absolute right-4 top-4 z-10">
                        <Button type="button" variant="none" onClick={close} aria-label={content.editor.closeLabel} className="size-9! p-0! text-secondary! hover:text-white!">
                            <IconX size={18} />
                        </Button>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div>
                            {upgradeTargets.length > 1 && (
                                <Switch
                                    value={plan}
                                    options={upgradeTargets.map((option) => ({ value: option, label: subscriptionConfig.packages[option].title }))}
                                    onChange={(value) => setSelectedPlan(value)}
                                />
                            )}
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

                        <div className="space-y-1 rounded-xl border border-white/10 bg-white/3 p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-secondary">{content.subscriptionPreview.totalLabel}</span>
                                <span className="text-white">{formatMinorCurrency(localQuote.total, "EUR", locale)}</span>
                            </div>
                            {isLoadingPreview ? (
                                <p className="text-tertiary">{content.subscriptionPreview.loadingLabel}</p>
                            ) : previewError ? (
                                <p role="alert" className="text-error">
                                    {previewError}
                                </p>
                            ) : preview ? (
                                <>
                                    {preview.prorationAmount > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-secondary">{content.subscriptionPreview.prorationLabel}</span>
                                            <span className="text-white">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</span>
                                        </div>
                                    )}
                                    <p className="text-tertiary">{preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}</p>
                                </>
                            ) : null}
                        </div>

                        {saveError && (
                            <p role="alert" className="text-sm text-error">
                                {saveError}
                            </p>
                        )}

                        <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />

                        <DialogFooter className="gap-3! pt-2!">
                            <Button type="button" variant="none" onClick={close}>
                                {content.editor.cancelLabel}
                            </Button>
                            <Button
                                type="button"
                                variant="filled"
                                disabled={!hasChange || isSaving || isLoadingPreview || !preview || Boolean(previewError) || !acceptedTerms}
                                onClick={() => void save()}
                            >
                                {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}
