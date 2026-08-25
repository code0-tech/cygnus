"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseDialog } from "@/components/licenses/dialog/LicenseDialog"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { SummaryBadge } from "@/components/checkout/CheckoutSummaryBadge"
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
import { Button, DialogFooter } from "@code0-tech/pictor"
import { IconCheck } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

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
    const aiTokensDefault = wasCustom && typeof license?.aiTokens === "number" ? license.aiTokens : aiTokensRange.default
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

    const planBadge = (option: SubscriptionPlan) => (
        <SummaryBadge size="lg" icon={getIcon(subscriptionConfig.plan[option].icon, 18)} tone={subscriptionConfig.plan[option].color} value={subscriptionConfig.plan[option].title} />
    )

    const planSelection =
        upgradeTargets.length > 0 ? (
            <div role="radiogroup" aria-label={content.upgrade.title} className="flex flex-col gap-2">
                {upgradeTargets.map((option) => (
                    <Button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={plan === option}
                        active={plan === option}
                        variant={plan === option ? "normal" : "none"}
                        paddingSize="xxs"
                        w="100%"
                        justify="start"
                        className={cn("text-base!", plan === option && "shadow-[inset_0_1px_1px_#bfbfbf1a]! bg-white/5!")}
                        onClick={() => setSelectedPlan(option)}
                    >
                        {subscriptionConfig.plan[option].title}
                    </Button>
                ))}
            </div>
        ) : (
            planBadge(plan)
        )
    const planFeatures =
        subscriptionConfig.plan[plan].features?.flatMap((feature, index) => {
            const text = feature.text?.trim()
            return text ? [{ key: feature.id ?? `${index}-${text}`, text }] : []
        }) ?? []

    return (
        <LicenseDialog backLabel={content.editor.closeLabel} description={content.upgrade.description} onClose={close} title={content.upgrade.title} sidebar={planSelection}>
            <div className="space-y-4">
                {plan === "custom" && (
                    <div className="space-y-4">
                        <Slider
                            min={aiTokensRange.min}
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
                            min={workflowExecutionsRange.min}
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

                {planFeatures.length > 0 && (
                    <ul className="space-y-2 py-2">
                        {planFeatures.map((feature) => (
                            <li key={feature.key} className="flex items-start gap-2 text-sm text-secondary">
                                <IconCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-brand" />
                                <span>{feature.text}</span>
                            </li>
                        ))}
                    </ul>
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
                        {content.editor.closeLabel}
                    </Button>
                    <Button type="button" variant="filled" disabled={!hasChange || isSaving || isLoadingPreview || !preview || Boolean(previewError) || !acceptedTerms} onClick={() => void save()}>
                        {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                    </Button>
                </DialogFooter>
            </div>
        </LicenseDialog>
    )
}
