"use client"

import { useLicenseData } from "@/components/licenses/LicenseDataProvider"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSaveButton, LicenseTabSection } from "@/components/licenses/dialog/LicenseTabLayout"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { SummaryBadge } from "@/components/checkout/CheckoutSummaryBadge"
import { Slider } from "@/components/ui/Slider"
import { ButtonLoader } from "@/components/ui/Loader"
import { getIcon } from "@/components/ui/IconRenderer"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import { createLicensePath, resolveCustomerRouteId, resolveLicenseRouteId } from "@/lib/licenses/licenseRoute"
import { resolveSubscriptionCustomerType } from "@/lib/licenses/licenseSubscription"
import { updateSubscription } from "@/lib/subscription/client"
import { calculateSubscriptionQuote, type PaymentPeriod } from "@/lib/subscription/calculator"
import { getSubscriptionCatalog } from "@/lib/subscription/catalog"
import { getPaymentPeriodForCustomerType, type SubscriptionPlan } from "@/lib/subscription/configurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { Button, Spacing, Text } from "@code0-tech/pictor"
import { IconCheck } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

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
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedLicenseId = resolveLicenseRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedLicenseId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(createLicensePath(locale, resolvedCustomerId, resolvedLicenseId))

    const customerType = resolveSubscriptionCustomerType(license?.customerType)
    const currentPlan = ((license?.plan as SubscriptionPlan | undefined) ?? "pro") satisfies SubscriptionPlan
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
    const paymentPeriod = getPaymentPeriodForCustomerType(customerType, (license?.paymentPeriod as PaymentPeriod | undefined) ?? "monthly")
    const catalog = useMemo(() => getSubscriptionCatalog(subscriptionConfig, subscriptionPrices), [subscriptionConfig, subscriptionPrices])
    const localQuote = useMemo(
        () => calculateSubscriptionQuote({ plan, deployment: "cloud", customerType, paymentPeriod, aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions }, catalog),
        [catalog, customerType, paymentPeriod, plan, resolvedAiTokens, resolvedWorkflowExecutions]
    )

    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    const changeFields = {
        plan,
        ...(plan === "custom" ? { aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions } : {}),
    }
    const { isLoadingPreview, preview, previewError } = useSubscriptionUpdatePreview(license?.subscriptionId, changeFields, errors.subscriptionPreview, 400)

    const save = async () => {
        if (!license?.subscriptionId || !hasChange || isSaving) return
        setIsSaving(true)
        setSaveError(null)

        try {
            const subscription = await updateSubscription({ id: license.subscriptionId, ...changeFields }, errors.planUpgrade)
            updateLicense(license.id, {
                ...(subscription.plan ? { plan: subscription.plan } : {}),
                ...(typeof subscription.aiTokens === "number" ? { aiTokens: subscription.aiTokens } : {}),
                ...(typeof subscription.workflowExecutions === "number" ? { workflowExecutions: subscription.workflowExecutions } : {}),
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

    const labels = locale === "de" ? { plan: "Plan", preview: "Vorschau" } : { plan: "Plan", preview: "Preview" }

    return (
        <>
            <LicenseTabHeader
                title={content.upgrade.title}
                description={content.upgrade.description}
                action={
                    <LicenseTabSaveButton disabled={!hasChange || isSaving || isLoadingPreview || !preview || Boolean(previewError) || !acceptedTerms} onClick={() => void save()}>
                        {isSaving ? <ButtonLoader label={content.editor.saveLabel} /> : content.editor.saveLabel}
                    </LicenseTabSaveButton>
                }
            />
            {saveError ? <LicenseTabAlert>{saveError}</LicenseTabAlert> : null}

            <LicenseTabSection title={labels.plan}>
                <LicenseTabRow>{planSelection}</LicenseTabRow>
                {plan === "custom" ? (
                    <>
                        <LicenseTabRow title={content.dashboard.aiTokensLabel}>
                            <Slider
                                min={aiTokensRange.min}
                                max={aiTokensRange.max}
                                step={aiTokensRange.step}
                                value={resolvedAiTokens}
                                onChange={setAiTokens}
                                onValueCommit={setAiTokens}
                                ariaLabel={content.dashboard.aiTokensLabel}
                                variant="gradient"
                                shape="cone-incline"
                            />
                        </LicenseTabRow>
                        <LicenseTabRow title={content.dashboard.workflowExecutionsLabel}>
                            <Slider
                                min={workflowExecutionsRange.min}
                                max={workflowExecutionsRange.max}
                                step={workflowExecutionsRange.step}
                                value={resolvedWorkflowExecutions}
                                onChange={setWorkflowExecutions}
                                onValueCommit={setWorkflowExecutions}
                                ariaLabel={content.dashboard.workflowExecutionsLabel}
                                variant="gradient"
                                shape="cone-incline"
                            />
                        </LicenseTabRow>
                    </>
                ) : null}
                {planFeatures.length > 0 ? (
                    <LicenseTabRow>
                        <ul className="space-y-2">
                            {planFeatures.map((feature) => (
                                <li key={feature.key} className="flex items-start gap-2 text-sm text-secondary">
                                    <IconCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-brand" />
                                    <span>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    </LicenseTabRow>
                ) : null}
            </LicenseTabSection>

            <LicenseTabSection title={labels.preview}>
                <LicenseTabRow title={content.subscriptionPreview.totalLabel} action={<Text size="md">{formatMinorCurrency(localQuote.total, "EUR", locale)}</Text>} />
                {isLoadingPreview ? (
                    <LicenseTabRow description={content.subscriptionPreview.loadingLabel} />
                ) : previewError ? (
                    <LicenseTabRow>
                        <Text role="alert" size="sm" className="text-error!">
                            {previewError}
                        </Text>
                    </LicenseTabRow>
                ) : preview ? (
                    <LicenseTabRow
                        title={preview.prorationAmount > 0 ? content.subscriptionPreview.prorationLabel : undefined}
                        description={preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}
                        action={preview.prorationAmount > 0 ? <Text size="md">{formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}</Text> : undefined}
                    />
                ) : null}
            </LicenseTabSection>

            <Spacing spacing="lg" />
            <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />
        </>
    )
}
