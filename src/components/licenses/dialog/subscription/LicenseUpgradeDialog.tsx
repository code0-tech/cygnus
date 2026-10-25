"use client"

import { useLicenseToasts } from "@/components/licenses/layout/LicenseNotifications"
import type { PaymentPeriod, SubscriptionPlan } from "@/lib/subscription/types"

import { useLicenseData } from "@/components/licenses/data/LicenseDataProvider"
import { LicenseTabHeader, LicenseTabRow, LicenseTabSection } from "@/components/licenses/dialog/shared/LicenseTabLayout"
import { AcceptTermsCheckbox } from "@/components/forms/AcceptTermsCheckbox"
import { PackageSlider } from "@/components/ui/PackageSlider"
import { ButtonLoader } from "@/components/ui/Loader"
import { useSubscriptionUpdatePreview } from "@/hooks/useSubscriptionUpdatePreview"
import type { ErrorsContent, LicenseContent, SubscriptionConfigData } from "@/lib/cms"
import type { AppLocale } from "@/lib/i18n"
import { formatMinorCurrency } from "@/lib/formatters"
import NumberFlow from "@number-flow/react"
import { parseLicenseDate } from "@/lib/licenses/pendingUpdate"
import { createLicensePath, resolveCustomerRouteId, resolveSubscriptionRouteId } from "@/lib/licenses/routes"
import { resolveSubscriptionCustomerType } from "@/lib/crater/values"
import { updateSubscription } from "@/lib/subscription/client"
import { calculateSubscriptionQuote, formatDiscountBadge } from "@/lib/subscription/calculator"
import { getSubscriptionCatalog } from "@/lib/subscription/catalog"
import { normalizePaymentPeriod } from "@/lib/subscription/configurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscription/prices"
import { normalizeUsagePackages, snapToUsagePackage, type CheckoutPackages } from "@/lib/subscription/usagePackages"
import { getLicenseBenefitGridCellClassName } from "@/components/licenses/shared/licenseDetailGrid"
import { cn } from "@/lib/utils"
import { Alert, Badge, Button, Card, getSize, SegmentedControl, SegmentedControlItem, Spacing, Text } from "@code0-tech/pictor"
import { IconArrowRight, IconTrendingUp } from "@tabler/icons-react"
import BorderBeam, { type BorderBeamColorVariant } from "border-beam"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

interface LicenseUpgradeDialogProps {
    checkoutPackages: CheckoutPackages
    content: LicenseContent
    customerId: string
    errors: ErrorsContent
    licenseId: string
    locale: AppLocale
    subscriptionConfig: SubscriptionConfigData
    subscriptionPrices: SubscriptionPriceCatalog
}

// Sculptor's cloud upgrade dialog heads itself with a beam-lit square card per plan; the upgrade preview marks its plans the same way.
const PLAN_BEAM_COLOR_VARIANT: Record<SubscriptionPlan, BorderBeamColorVariant> = { pro: "mono", max: "sunset", custom: "colorful" }

function PlanBadge({ config, muted, plan }: { config: SubscriptionConfigData["plan"][SubscriptionPlan]; muted?: boolean; plan: SubscriptionPlan }) {
    return (
        <BorderBeam
            active={!muted}
            colorVariant={PLAN_BEAM_COLOR_VARIANT[plan]}
            duration={5}
            size="sm"
            strength={1}
            style={{ display: "inline-block" }}
            theme="dark"
        >
            {/* The square is fixed and sized for the longest plan name, so every badge reads at the same scale. */}
            <Card
                bg={"transparent"}
                h="1.75rem"
                display="flex"
                align="center"
                justify="center"
                style={{ flexShrink: 0, minWidth: "2rem", padding: "0 1rem" }}
            >
                <Text
                    hierarchy={muted ? "tertiary" : "primary"}
                    className="uppercase"
                    style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1, letterSpacing: "0.02em" }}
                >
                    {config.title}
                </Text>
            </Card>
        </BorderBeam>
    )
}

const PLAN_ORDER: Record<SubscriptionPlan, number> = { pro: 0, max: 1, custom: 2 }
const PLANS: SubscriptionPlan[] = ["pro", "max", "custom"]

export function LicenseUpgradeDialog({ checkoutPackages, content, customerId, errors, licenseId, locale, subscriptionConfig, subscriptionPrices }: LicenseUpgradeDialogProps) {
    const toasts = useLicenseToasts()
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
            toasts.success(subscription.pendingUpdate ? "changeScheduled" : "planUpdated", subscription.pendingUpdate?.effectiveAt)
            close()
        } catch (error) {
            toasts.error(error instanceof Error ? error.message : errors.planUpgrade)
        } finally {
            setIsSaving(false)
        }
    }

    const planSelection =
        upgradeTargets.length > 1 ? (
            <SegmentedControl
                tabIndex={-1}
                type="single"
                color={"tertiary"}
                value={plan}
                onValueChange={(value: string) => {
                    // Radix allows deselecting the active item; the upgrade always needs a target plan.
                    if (value) setSelectedPlan(value as SubscriptionPlan)
                }}
            >
                {upgradeTargets.map((option) => (
                    <SegmentedControlItem tabIndex={-1} key={option} value={option} style={{ padding: `${getSize("xxs")} ${getSize("xs")}` }}>
                        <Text>{subscriptionConfig.plan[option].title}</Text>
                    </SegmentedControlItem>
                ))}
            </SegmentedControl>
        ) : (
            <Text size="md">{subscriptionConfig.plan[plan].title}</Text>
        )
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    // effectiveAt is when the change takes effect, so it dates the charge; the new total is first billed with the next period.
    const chargedOnDate = preview ? (preview.immediate ? new Date() : parseLicenseDate(preview.effectiveAt)) : null
    const nextPeriodDate = parseLicenseDate(license?.currentPeriodEnd)
    const planConfig = subscriptionConfig.plan[plan]
    const currentPlanConfig = subscriptionConfig.plan[currentPlan]
    const planFeatures =
        planConfig.features?.flatMap((feature, index) => {
            const text = feature.text?.trim()
            return text ? [{ key: feature.id ?? `${index}-${text}`, text }] : []
        }) ?? []
    // Crater resolves the quantities the change lands on; the slider values stand in while the preview is still loading.
    const nextAiTokens = preview?.aiTokens ?? (plan === "custom" ? resolvedAiTokens : null)
    const nextWorkflowExecutions = preview?.workflowExecutions ?? (plan === "custom" ? resolvedWorkflowExecutions : null)
    // A standard plan's quantities are its configured entitlement, so they describe the current state even when the subscription itself carries none.
    const currentPlanQuantities = currentPlan === "custom" ? null : checkoutPackages.planQuantities[currentPlan]
    const currentAiTokens = license?.aiTokens ?? currentPlanQuantities?.aiTokens
    const currentWorkflowExecutions = license?.workflowExecutions ?? currentPlanQuantities?.workflowExecutions
    const usageComparisons = [
        { current: currentAiTokens, key: "aiTokens", label: content.dashboard.aiTokensLabel, next: nextAiTokens },
        { current: currentWorkflowExecutions, key: "workflowExecutions", label: content.dashboard.workflowExecutionsLabel, next: nextWorkflowExecutions },
    ].flatMap((usage) => (typeof usage.next === "number" ? [{ ...usage, next: usage.next }] : []))
    const benefitCells = [
        {
            badge: null,
            current: null,
            key: "plan",
            label: content.upgrade.planHeading,
            next: null,
            value: (
                <span className="flex flex-wrap items-center gap-2">
                    {plan === currentPlan ? null : (
                        <>
                            <PlanBadge config={currentPlanConfig} muted plan={currentPlan} />
                            <IconArrowRight aria-hidden="true" size={14} className="shrink-0 text-tertiary" />
                        </>
                    )}
                    <PlanBadge config={planConfig} plan={plan} />
                </span>
            ),
        },
        ...usageComparisons.map((usage) => {
            const current = typeof usage.current === "number" ? usage.current : null
            // The badge quantifies the gain the way Sculptor's stat cards do: how much more the plan grants than the licence holds today.
            const increase = current !== null && current > 0 && usage.next > current ? (usage.next - current) / current : null
            return {
                badge: increase === null ? null : `+${formatDiscountBadge(increase, locale)}`,
                current,
                key: usage.key,
                label: usage.label,
                next: usage.next,
                value: null,
            }
        }),
        // Without quantities from Crater the plan is described by its features instead.
        ...(usageComparisons.length > 0
            ? []
            : planFeatures.slice(0, 2).map((feature) => ({ badge: null, current: null, key: feature.key, label: null, next: feature.text, value: null }))),
    ]
    return (
        <>
            <LicenseTabHeader title={content.upgrade.title} description={content.upgrade.description} />

            <LicenseTabSection title={content.upgrade.planHeading}>
                <LicenseTabRow title={content.upgrade.planHeading} description={content.upgrade.description} action={planSelection} />
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
            </LicenseTabSection>

            <LicenseTabSection title={content.upgrade.previewHeading}>
                <LicenseTabRow
                    title={content.subscriptionPreview.prorationLabel}
                    description={
                        <>
                            {content.subscriptionPreview.prorationDescription}
                            {preview ? ` ${preview.immediate ? content.subscriptionPreview.immediateNote : content.subscriptionPreview.scheduledNote}` : null}
                        </>
                    }
                    action={
                        isLoadingPreview ? (
                            <span role="status" aria-label={content.subscriptionPreview.loadingLabel} className="inline-block h-5 w-20 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
                        ) : preview ? (
                            <div className="text-right">
                                <Text size="md" hierarchy="primary" fw={500}>
                                    {formatMinorCurrency(preview.prorationAmount, preview.currency, locale)}
                                </Text>
                                {chargedOnDate ? (
                                    <Text size="sm" hierarchy="tertiary">
                                        {dateFormatter.format(chargedOnDate)}
                                    </Text>
                                ) : null}
                            </div>
                        ) : null
                    }
                    contentSpacing="md"
                >
                    {previewError ? (
                        <Alert color="error">
                            {previewError}
                        </Alert>
                    ) : null}
                </LicenseTabRow>
                {benefitCells.length > 0 ? (
                    <LicenseTabRow className="p-0!">
                        <ul className={cn("grid grid-cols-1", benefitCells.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                            {benefitCells.map((cell, index) => (
                                <li key={cell.key} className={getLicenseBenefitGridCellClassName(index)}>
                                    {cell.label ? (
                                        <div className="flex items-center justify-between gap-2">
                                            <Text size="sm" hierarchy="tertiary" display="block" className="truncate">
                                                {cell.label}
                                            </Text>
                                            {cell.badge ? (
                                                <Badge color="success" className="shrink-0">
                                                    <IconTrendingUp aria-hidden="true" size={12} />
                                                    {cell.badge}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {cell.current !== null ? (
                                            <>
                                                <Text size="md" hierarchy="tertiary" className="truncate line-through">
                                                    <NumberFlow value={cell.current} locales="en-US" format={{ notation: "compact", maximumFractionDigits: 1 }} />
                                                </Text>
                                                <IconArrowRight aria-hidden="true" size={14} className="shrink-0 text-tertiary" />
                                            </>
                                        ) : null}
                                        {cell.value ?? (
                                            <Text fw={400} title={cell.next === null ? undefined : String(cell.next)} className="truncate text-xl! leading-tight! text-white!">
                                                {typeof cell.next === "number" ? (
                                                    <NumberFlow value={cell.next} locales="en-US" format={{ notation: "compact", maximumFractionDigits: 1 }} />
                                                ) : cell.next}
                                            </Text>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </LicenseTabRow>
                ) : null}
                <LicenseTabRow
                    title={content.subscriptionPreview.totalLabel}
                    description={content.subscriptionPreview.totalDescription}
                    action={
                        <div className="text-right">
                            {isLoadingPreview ? (
                                <span role="status" aria-label={content.subscriptionPreview.loadingLabel} className="inline-block h-5 w-20 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
                            ) : (
                                <Text size="md" hierarchy="tertiary">
                                    {formatMinorCurrency(localQuote.total, "EUR", locale)}
                                </Text>
                            )}
                            {nextPeriodDate ? (
                                <Text size="sm" hierarchy="tertiary">
                                    {dateFormatter.format(nextPeriodDate)}
                                </Text>
                            ) : null}
                        </div>
                    }
                />
                <LicenseTabRow>
                    <AcceptTermsCheckbox locale={locale} initialValue={false} formValidation={{ setValue: setAcceptedTerms, valid: true }} />
                    <Spacing spacing="md" />
                    <Button
                        type="button"
                        variant="normal"
                        color="success"
                        paddingSize="xxs"
                        w="100%"
                        justify="center"
                        disabled={!hasChange || isSaving || isLoadingPreview || !preview || Boolean(previewError) || !acceptedTerms}
                        onClick={() => void save()}
                    >
                        {isSaving ? <ButtonLoader label={content.upgrade.submitLabel} /> : content.upgrade.submitLabel}
                    </Button>
                </LicenseTabRow>
            </LicenseTabSection>

        </>
    )
}
