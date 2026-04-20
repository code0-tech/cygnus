import type { Media } from "@/payload-types"

interface ActionTriggerCardProps {
    type: "trigger" | "functionDef"
    item: Media
}

export function ActionTriggerCard({ type, item }: ActionTriggerCardProps) {
    const href = item.url?.trim()

    if (!href) {
        return null
    }

    return (

    )
}
