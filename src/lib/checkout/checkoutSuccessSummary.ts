import type { SubscriptionConfigData } from "@/lib/cms"
import { resolveSubscriptionSelection } from "@/lib/subscriptionConfigurator"

export type CheckoutSuccessSummary = {
    deployment: "self_hosted" | "cloud"
}

export function buildCheckoutSuccessSummary({
    searchParams,
    subscriptionConfig,
}: {
    searchParams: URLSearchParams
    subscriptionConfig?: SubscriptionConfigData | null
}): CheckoutSuccessSummary | null {
    if (!subscriptionConfig || !searchParams.get("plan")) return null

    const { selection } = resolveSubscriptionSelection(searchParams, subscriptionConfig)
    return { deployment: selection.deployment }
}
