"use client"

import { SubscriptionConfiguratorPlan } from "@/lib/subscriptionConfigurator"
import { Card, Text } from "@code0-tech/pictor"
import BorderBeam from "border-beam"

interface UpgradePlanBoxProps {
    plan: SubscriptionConfiguratorPlan
    rotate?: "left" | "right" | null
}

export function UpgradePlanBox({ plan, rotate }: UpgradePlanBoxProps) {
    return (
        <BorderBeam
            style={{ display: "inline-block", transform: rotate === "left" ? "rotate(-10deg)" : rotate === "right" ? "rotate(10deg)" : "" }}
            strength={1}
            colorVariant={plan === "pro" ? "mono" : plan === "max" ? "sunset" : "colorful"}
            size={"sm"}
            theme={"dark"}
            duration={5}
        >
            <Card w={"50px"} h={"50px"} display={"flex"} align={"center"} justify={"center"}>
                <Text style={{ fontWeight: "bold" }}>{plan.toUpperCase()}</Text>
            </Card>
        </BorderBeam>
    )
}
