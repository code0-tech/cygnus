"use client"

import type { CheckoutData, SubscriptionConfigData } from "@/lib/cms"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card } from "../ui/Card"
import { Button } from "@code0-tech/pictor"

type SubscriptionPlan = "pro" | "max" | "custom"

const PLAN_ORDER: SubscriptionPlan[] = ["pro", "max", "custom"]

interface CheckoutUpgradePlanProps {
    content?: CheckoutData["upgradeBanner"] | null
    subscriptionConfig?: SubscriptionConfigData | null
}

export function CheckoutUpgradePlan({ content, subscriptionConfig }: CheckoutUpgradePlanProps) {
    const router = useRouter()
    const params = useParams<{ locale?: string }>()
    const searchParams = useSearchParams()

    if (!content || !subscriptionConfig) return null

    const locale = params?.locale === "de" ? "de" : "en"
    const currentPlan = searchParams.get("plan") as SubscriptionPlan | null
    const currentIndex = currentPlan ? PLAN_ORDER.indexOf(currentPlan) : -1
    const nextPlan = currentIndex >= 0 && currentIndex < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIndex + 1] : null
    if (!nextPlan) return null

    const nextPlanTitle = subscriptionConfig.packages[nextPlan].title
    const [textBeforePlan, textAfterPlan] = content.text.split("{plan}")

    const handleUpgrade = () => {
        const nextSearchParams = new URLSearchParams(searchParams.toString())
        nextSearchParams.set("plan", nextPlan)
        nextSearchParams.delete("aiTokens")
        nextSearchParams.delete("workflowExecutions")
        router.push(`/${locale}/checkout?${nextSearchParams.toString()}`)
    }

    return (
        <Card className="flex justify-between items-center gap-x-1.5 bg-linear-to-r from-brand/15 to-primary text-sm text-white bg-clip-padding">
            <span>
                {textBeforePlan}
                <span className="text-brand font-medium">{nextPlanTitle}</span>
                {textAfterPlan}
            </span>
            <Button variant="filled" onClick={handleUpgrade} className="bg-white/80! hover:bg-white! text-primary! py-1! px-2! rounded-lg!">
                {content.buttonLabel}
            </Button>
        </Card>
    )
}
