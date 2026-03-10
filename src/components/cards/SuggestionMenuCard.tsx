import { getFeatureBySlug } from "@/lib/cms"
import { type AppLocale } from "@/lib/i18n"
import type { InputSuggestion } from "@code0-tech/pictor"
import { FeatureCardText } from "../FeatureCardText"
import { SuggesstionMenuClient } from "../ui/SuggesstionMenuClient"
import { FeatureCard } from "./FeatureCard"

interface SuggestionMenuCardProps {
    locale: AppLocale
}

export async function SuggestionMenuCard({ locale }: SuggestionMenuCardProps) {
    const content = await getFeatureBySlug("suggestion-menu", locale)

    const suggestions: InputSuggestion[] = [
        {
            children: "@Nico",
            value: "@nico",
            valueData: { id: "user_1", type: "user", label: "Nico Schmidt" },
            groupBy: "Members",
            insertMode: "replace",
        },
        {
            children: "#roadmap",
            value: "#roadmap",
            valueData: { id: "channel_4", type: "channel", label: "Roadmap" },
            groupBy: "Channels",
            insertMode: "append",
        },
        {
            children: "/assign @Nico",
            value: "/assign @nico",
            valueData: { action: "assign", assigneeId: "user_1" },
            groupBy: "Actions",
            insertMode: "insert",
        },
        {
            children: "{{deadline}}",
            value: "{{deadline}}",
            valueData: { variable: "deadline", format: "YYYY-MM-DD" },
            groupBy: "Variables",
            insertMode: "prepend",
        },
    ]

    return (
        <FeatureCard className="col-span-1 row-span-7" tone="aqua">
            <SuggesstionMenuClient suggestions={suggestions} />
            <FeatureCardText content={content} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-primary via-primary/70 to-transparent" />
        </FeatureCard>
    )
}
