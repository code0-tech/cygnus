"use client"

import type { InputSuggestion } from "@code0-tech/pictor"
import { Card, Text } from "@code0-tech/pictor"

interface SuggesstionMenuClientProps {
    suggestions: InputSuggestion[]
}

export function SuggesstionMenuClient() {
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

    const groupedSuggestions = suggestions.reduce<Record<string, InputSuggestion[]>>((acc, suggestion) => {
        const group = suggestion.groupBy || "Suggestions"

        if (!acc[group]) {
            acc[group] = []
        }

        acc[group].push(suggestion)
        return acc
    }, {})

    return (
        <Card paddingSize="xxs" mt={-0.2} mx={-0.2}>
            <div className="flex min-w-72 flex-col gap-1">
                {Object.entries(groupedSuggestions).map(([group, items]) => (
                    <div key={group} className="flex flex-col">
                        <Text
                            size="xs"
                            style={{
                                padding: "0.35rem 0.5rem",
                                color: "var(--text-secondary)",
                                opacity: 0.8,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                            }}
                        >
                            {group}
                        </Text>
                        <div className="flex flex-col gap-0.5">
                            {items.map((suggestion) => (
                                <button
                                    key={`${group}-${suggestion.value}`}
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-white/6"
                                >
                                    <Text size="sm" style={{ color: "inherit" }}>
                                        {String(suggestion.children ?? suggestion.value)}
                                    </Text>
                                    <Text size="xs" style={{ color: "var(--text-secondary)", opacity: 0.75 }}>
                                        {suggestion.insertMode}
                                    </Text>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
