import type { CheckoutPricingOverviewData } from "@/components/checkout/CheckoutPricingOverview"
import type { CheckoutData, IconColor, SubscriptionConfigData } from "@/lib/cms"
import { formatCompactNumber } from "@/lib/formatters"
import { resolveCheckoutPricing } from "@/lib/subscriptionCalculator"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"
import type { SubscriptionPriceCatalog } from "@/lib/subscriptionPrices"

export type CheckoutSuccessSummary = {
    deployment: "self_hosted" | "cloud"
    overview?: CheckoutPricingOverviewData
    title: string
    rows: { id: string; label: string; value: string; icon: string; tone: IconColor }[]
}

// Mirrors the accent SubscriptionConfigurator hardcodes for the same plans -- there is no CMS field for it.
const PLAN_ICON_FALLBACKS: Record<"pro" | "max" | "custom", string> = {
    pro: "tabler:IconSparkles",
    max: "tabler:IconRocket",
    custom: "tabler:IconSettings",
}
const PLAN_TONES: Record<"pro" | "max" | "custom", IconColor> = {
    pro: "brand",
    max: "magenta",
    custom: "aqua",
}

function formatDeployment(deployment: "self_hosted" | "cloud") {
    return deployment
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

export function buildCheckoutSuccessSummary({
    checkoutContent,
    searchParams,
    subscriptionConfig,
    subscriptionPrices,
}: {
    checkoutContent?: CheckoutData | null
    searchParams: URLSearchParams
    subscriptionConfig?: SubscriptionConfigData | null
    subscriptionPrices?: SubscriptionPriceCatalog | null
}): CheckoutSuccessSummary | null {
    if (!checkoutContent?.summary || !subscriptionConfig || !searchParams.get("plan")) return null

    const { selection } = resolveSubscriptionSelection(searchParams, subscriptionConfig)
    const summary = checkoutContent.summary
    const resolvedPricing = subscriptionPrices
        ? resolveCheckoutPricing({
              aiTokensParam: searchParams.get("aiTokens"),
              customerTypeParam: selection.customerType,
              fallbackPeriodSuffix: summary.pricing.perMonthSuffix,
              paymentPeriodParam: selection.paymentPeriod,
              planParam: selection.plan,
              subscriptionConfig,
              subscriptionPrices,
              workflowExecutionsParam: searchParams.get("workflowExecutions"),
          })
        : null
    const paymentPeriodDiscountAmount = resolvedPricing ? Math.max(0, resolvedPricing.pricing.totalBeforeDiscount - resolvedPricing.pricing.totalPrice) : 0
    const paymentPeriodDiscountPercentage = resolvedPricing && resolvedPricing.pricing.totalBeforeDiscount > 0 ? paymentPeriodDiscountAmount / resolvedPricing.pricing.totalBeforeDiscount : 0
    const paymentPeriodDiscountLabel =
        selection.paymentPeriod === "quarterly" ? summary.pricing.quarterlyDiscountLabel : selection.paymentPeriod === "yearly" ? summary.pricing.yearlyDiscountLabel : null
    const rows = [
        {
            id: "plan",
            label: summary.pricing.planLabel,
            value: subscriptionConfig.packages[selection.plan].title,
            icon: subscriptionConfig.plan[selection.plan].icon?.trim() || PLAN_ICON_FALLBACKS[selection.plan],
            tone: PLAN_TONES[selection.plan],
        },
        {
            id: "customerType",
            label: summary.customerTypeLabel,
            value: selection.customerType.toUpperCase(),
            icon: summary.customerTypeIcons[selection.customerType],
            tone: summary.customerTypeIconColor,
        },
        {
            id: "deployment",
            label: summary.deploymentLabel,
            value: formatDeployment(selection.deployment),
            icon: summary.deploymentIcons[selection.deployment === "cloud" ? "cloud" : "selfHosted"],
            tone: summary.deploymentIconColor,
        },
        {
            id: "paymentPeriod",
            label: subscriptionConfig.paymentPeriod.title,
            value: subscriptionConfig.paymentPeriod[`${selection.paymentPeriod}Text`],
            icon: "tabler:IconCalendarMonth",
            tone: subscriptionConfig.paymentPeriod[`${selection.paymentPeriod}Color`],
        },
    ]

    if (selection.plan === "custom") {
        rows.push(
            { id: "aiTokens", label: summary.aiTokensLabel, value: formatCompactNumber(selection.aiTokens), icon: summary.aiTokensIcon, tone: summary.aiTokensIconColor },
            {
                id: "workflowExecutions",
                label: summary.workflowExecutionsLabel,
                value: formatCompactNumber(selection.workflowExecutions),
                icon: summary.workflowExecutionsIcon,
                tone: summary.workflowExecutionsIconColor,
            }
        )
    }

    return {
        deployment: selection.deployment,
        overview: resolvedPricing
            ? {
                  aiTokenPrice: resolvedPricing.pricing.aiTokenPrice,
                  aiTokens: resolvedPricing.aiTokens,
                  customerType: selection.customerType,
                  deployment: selection.deployment,
                  isCustomPlan: resolvedPricing.isCustomPlan,
                  monthlyPeriodSuffix: subscriptionConfig.paymentPeriod.monthlyPeriodSuffix,
                  paymentPeriodDiscountAmount,
                  paymentPeriodDiscountLabel,
                  paymentPeriodDiscountPercentage,
                  periodSuffix: resolvedPricing.periodSuffix,
                  planPrice: resolvedPricing.planPrice,
                  planTitle: resolvedPricing.planTitle,
                  taxAmount: 0,
                  taxPercentage: null,
                  totalPrice: resolvedPricing.pricing.totalPrice,
                  workflowExecutionPrice: resolvedPricing.pricing.workflowExecutionPrice,
                  workflowExecutions: resolvedPricing.workflowExecutions,
              }
            : undefined,
        title: summary.configurationLabel,
        rows,
    }
}
