"use client"

import type { PaymentPeriod, SubscriptionPlan } from "@/lib/subscription/types"
import { SubscriptionPendingUpdateNotice } from "@/components/licenses/shared/SubscriptionPendingUpdateNotice"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseTabAlert, LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { PackageSlider } from "@/components/ui/PackageSlider"
import { ButtonLoader } from "@/components/ui/Loader"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import { createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { resolveSubscriptionCustomerType } from "@/lib/crater/values"
import { updateSubscription } from "@/lib/subscription/client"
import { calculateSubscriptionQuote } from "@/lib/subscription/calculator"
import { getSubscriptionCatalog } from "@/lib/subscription/catalog"
import { normalizePaymentPeriod } from "@/lib/subscription/configurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { normalizeUsagePackages, snapToUsagePackage } from "@/lib/subscription/usagePackages"
import { Button, Flex, Spacing, Text } from "@code0-tech/pictor"
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

const PLAN_ORDER: Record<SubscriptionPlan, number> = { pro: 0, max: 1, custom: 2 }
const PLANS: SubscriptionPlan[] = ["pro", "max", "custom"]

export function LicenseUpgradeDialog({ content, customerId, errors, licenseId, locale, subscriptionConfig, subscriptionPrices }: LicenseUpgradeDialogProps) {
    const router = useRouter()
    const { customers, licenses, updateLicense } = useLicenseData()
    const resolvedCustomerId = resolveCustomerRouteId(customerId)
    const resolvedSubscriptionId = resolveSubscriptionRouteId(licenseId)
    const license = licenses.find((candidate) => candidate.id === resolvedSubscriptionId && candidate.customerId === resolvedCustomerId)
    const close = () => router.replace(createLicensePath(locale, resolvedCustomerId, resolvedSubscriptionId))

    const customerType = resolveSubscriptionCustomerType(license?.customerType)
    const currentPlan = ((license?.plan as SubscriptionPlan | undefined) ?? "pro") satisfies SubscriptionPlan

    const upgradeTargets = PLANS.filter((candidate) => PLAN_ORDER[candidate] > PLAN_ORDER[currentPlan])
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const plan = selectedPlan ?? upgradeTargets[0] ?? currentPlan
    const wasCustom = currentPlan === "custom"

    const checkoutLimits = customers.find((candidate) => candidate.id === license?.customerId)?.checkoutLimits
    const aiTokenPackages = checkoutLimits?.aiTokens.length ? normalizeUsagePackages(checkoutLimits.aiTokens) : []
    const workflowExecutionPackages = checkoutLimits?.workflowExecutions.length ? normalizeUsagePackages(checkoutLimits.workflowExecutions) : []
    const aiTokensDefault = snapToUsagePackage(
        wasCustom && typeof license?.aiTokens === "number" ? license.aiTokens : (aiTokenPackages[0] ?? 0),
        aiTokenPackages
    )
    const workflowExecutionsDefault = snapToUsagePackage(
        wasCustom && typeof license?.workflowExecutions === "number" ? license.workflowExecutions : (workflowExecutionPackages[0] ?? 0),
        workflowExecutionPackages
    )

    const [aiTokens, setAiTokens] = useState<number | null>(null)
    const [workflowExecutions, setWorkflowExecutions] = useState<number | null>(null)
    const resolvedAiTokens = aiTokens ?? aiTokensDefault
    const resolvedWorkflowExecutions = workflowExecutions ?? workflowExecutionsDefault

    const quantitiesChanged = plan === "custom" && (resolvedAiTokens !== aiTokensDefault || resolvedWorkflowExecutions !== workflowExecutionsDefault)
    const hasChange = Boolean(license?.subscriptionId) && (plan !== currentPlan || quantitiesChanged)

    const paymentPeriod = normalizePaymentPeriod((license?.paymentPeriod as PaymentPeriod | undefined) ?? "monthly")
    const deployment = license?.deploymentType === "self_hosted" ? "self_hosted" : "cloud"
    const catalog = useMemo(() => getSubscriptionCatalog(subscriptionConfig, subscriptionPrices), [subscriptionConfig, subscriptionPrices])
    const localQuote = useMemo(
        () => calculateSubscriptionQuote({ plan, deployment, customerType, paymentPeriod, aiTokens: resolvedAiTokens, workflowExecutions: resolvedWorkflowExecutions }, catalog),
        [catalog, customerType, deployment, paymentPeriod, plan, resolvedAiTokens, resolvedWorkflowExecutions]
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
                pendingUpdate: subscription.pendingUpdate ?? null,
                ...(subscription.status ? { subscriptionStatus: subscription.status } : {}),
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

    const planSelection =
        upgradeTargets.length > 1 ? (
            <div role="radiogroup" aria-label={content.upgrade.title} className="grid grid-cols-2 gap-2">
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
                        justify="center"
                        className={cn("text-sm!", plan === option && "shadow-[inset_0_1px_1px_#bfbfbf1a]! bg-white/5!")}
                        onClick={() => setSelectedPlan(option)}
                    >
                        {subscriptionConfig.plan[option].title}
                    </Button>
                ))}
            </div>
        ) : null
    const planFeatures =
        subscriptionConfig.plan[plan].features?.flatMap((feature, index) => {
            const text = feature.text?.trim()
            return text ? [{ key: feature.id ?? `${index}-${text}`, text }] : []
        }) ?? []

    return (
        <>
            <SubscriptionPendingUpdateNotice update={license?.pendingUpdate} content={content} locale={locale} />
            <LicenseTabHeader title={content.upgrade.title} description={content.upgrade.description} />

            <LicenseTabSection title={content.upgrade.planHeading}>
                {planSelection ? <LicenseTabRow>{planSelection}</LicenseTabRow> : null}
                {plan === "custom" ? (
                    <>
                        <LicenseTabRow title={content.dashboard.aiTokensLabel}>
                            <PackageSlider
                                packages={aiTokenPackages}
                                value={resolvedAiTokens}
                                onChange={setAiTokens}
                                onValueCommit={setAiTokens}
                                ariaLabel={content.dashboard.aiTokensLabel}
                                size="sm"
                                variant="gradient"
                                shape="cone-incline"
                            />
                        </LicenseTabRow>
                        <LicenseTabRow title={content.dashboard.workflowExecutionsLabel}>
                            <PackageSlider
                                packages={workflowExecutionPackages}
                                value={resolvedWorkflowExecutions}
                                onChange={setWorkflowExecutions}
                                onValueCommit={setWorkflowExecutions}
                                ariaLabel={content.dashboard.workflowExecutionsLabel}
                                size="sm"
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

            <LicenseTabSection title={content.upgrade.previewHeading}>
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
            {saveError ? <LicenseTabAlert>{saveError}</LicenseTabAlert> : null}
            <Spacing spacing="lg" />
            <Flex justify="end">
                <Button type="button" variant="filled" disabled={!hasChange || isSaving || isLoadingPreview || !preview || Boolean(previewError) || !acceptedTerms} onClick={() => void save()}>
                    {isSaving ? <ButtonLoader label={content.upgrade.submitLabel} /> : content.upgrade.submitLabel}
                </Button>
            </Flex>
        </>
    )
}
