"use client"

import type { InputSuggestion } from "@code0-tech/pictor"
import { Text } from "@code0-tech/pictor"
import { IconBulb, IconChevronUp, IconCircleDot, IconNote, IconVariable } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { StableBadge } from "./StableBadge"
import { Card } from "./Card"

const FunctionSuggestionType = {
    FUNCTION: "FUNCTION",
    FUNCTION_COMBINATION: "FUNCTION_COMBINATION",
    REF_OBJECT: "REF_OBJECT",
    VALUE: "VALUE",
    DATA_TYPE: "DATA_TYPE",
} as const

type FunctionSuggestionType = (typeof FunctionSuggestionType)[keyof typeof FunctionSuggestionType]

type SuggestionWithType = InputSuggestion & {
    suggestionType: FunctionSuggestionType
}

function SuggestionContent({ suggestion }: { suggestion: SuggestionWithType }) {
    const label = String(suggestion.children ?? suggestion.value)
    const isVariableReference = suggestion.suggestionType === FunctionSuggestionType.REF_OBJECT && suggestion.valueData?.type === "variable"

    if (isVariableReference) {
        return (
            <StableBadge style={{ verticalAlign: "middle" }} color="warning" border className="py-0!">
                <IconVariable size={12} />
                <StableBadge color="secondary" border className="min-w-0 max-w-full border-pink/40 bg-slate-900/90! text-pink">
                    <IconNote size={12} className="text-pink" />
                    <Text size="sm" className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "inherit" }}>
                        {label}
                    </Text>
                </StableBadge>
            </StableBadge>
        )
    }

    return (
        <Text size="sm" className="truncate" style={{ color: "inherit" }}>
            {label}
        </Text>
    )
}

const iconMap: Record<FunctionSuggestionType, ReactNode> = {
    [FunctionSuggestionType.FUNCTION]: <IconNote className="text-brand" size={16} />,
    [FunctionSuggestionType.FUNCTION_COMBINATION]: <IconNote className="text-brand" size={16} />,
    [FunctionSuggestionType.REF_OBJECT]: <IconVariable className="text-warning" size={16} />,
    [FunctionSuggestionType.VALUE]: <IconCircleDot className="text-error" size={16} />,
    [FunctionSuggestionType.DATA_TYPE]: <IconCircleDot className="text-error" size={16} />,
}

const suggestions: SuggestionWithType[] = [
    {
        children: "Boolean as Number",
        value: "Boolean as Number",
        valueData: { id: "variable_1", type: "variable", label: "Boolean as Number" },
        groupBy: "Variables",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.REF_OBJECT,
    },
    {
        children: "Boolean from Number",
        value: "boolean-from-number",
        valueData: { id: "std_boolean_1", type: "action", label: "Boolean from Number" },
        groupBy: "STD::BOOLEAN",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Boolean from Text",
        value: "boolean-from-text",
        valueData: { id: "std_boolean_2", type: "action", label: "Boolean from Text" },
        groupBy: "STD::BOOLEAN",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Is Equal",
        value: "is-equal-boolean",
        valueData: { id: "std_boolean_3", type: "action", label: "Is Equal" },
        groupBy: "STD::BOOLEAN",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Negate Boolean",
        value: "negate-boolean",
        valueData: { id: "std_boolean_4", type: "action", label: "Negate Boolean" },
        groupBy: "STD::BOOLEAN",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Get Element of List",
        value: "get-element-of-list",
        valueData: { id: "std_list_1", type: "action", label: "Get Element of List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Find Element in List",
        value: "find-element-in-list",
        valueData: { id: "std_list_2", type: "action", label: "Find Element in List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Find Last Element in List",
        value: "find-last-element-in-list",
        valueData: { id: "std_list_3", type: "action", label: "Find Last Element in List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "First Element of List",
        value: "first-element-of-list",
        valueData: { id: "std_list_4", type: "action", label: "First Element of List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Is List Empty",
        value: "is-list-empty",
        valueData: { id: "std_list_5", type: "action", label: "Is List Empty" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Last Element of List",
        value: "last-element-of-list",
        valueData: { id: "std_list_6", type: "action", label: "Last Element of List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Pop from List",
        value: "pop-from-list",
        valueData: { id: "std_list_7", type: "action", label: "Pop from List" },
        groupBy: "STD::LIST",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Is Equal",
        value: "is-equal-number",
        valueData: { id: "std_number_1", type: "action", label: "Is Equal" },
        groupBy: "STD::NUMBER",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Is Greater",
        value: "is-greater",
        valueData: { id: "std_number_2", type: "action", label: "Is Greater" },
        groupBy: "STD::NUMBER",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
    {
        children: "Is Less",
        value: "is-less",
        valueData: { id: "std_number_3", type: "action", label: "Is Less" },
        groupBy: "STD::NUMBER",
        insertMode: "insert",
        suggestionType: FunctionSuggestionType.FUNCTION,
    },
]

const groupedSuggestions = suggestions.reduce<Record<string, SuggestionWithType[]>>((acc, suggestion) => {
    const group = suggestion.groupBy || "Suggestions"

    if (!acc[group]) {
        acc[group] = []
    }

    acc[group].push(suggestion)
    return acc
}, {})
const groupedEntries = Object.entries(groupedSuggestions)
const [variableEntries, otherEntries] = groupedEntries.reduce<[typeof groupedEntries, typeof groupedEntries]>(
    (entries, entry) => {
        entries[entry[0] === "Variables" ? 0 : 1].push(entry)
        return entries
    },
    [[], []]
)

export function SuggesstionMenuClient() {
    return (
        <Card size="lg" className="w-full bg-primary/50 p-2">
            <div className="relative z-20 flex flex-col gap-2 rounded-[1.25rem] bg-primary p-2">
                {variableEntries.map(([group, items]) => (
                    <div key={group} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between px-2 py-1 text-[11px] uppercase text-tertiary">
                            <span>{group}</span>
                            <IconChevronUp size={14} className="text-tertiary" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {items.map((suggestion) => (
                                <div key={`${group}-${suggestion.value}`} className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-1.5 text-left text-white transition-colors">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">{iconMap[suggestion.suggestionType]}</span>
                                    <SuggestionContent suggestion={suggestion} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex flex-col gap-2 overflow-hidden rounded-xl py-1">
                    {otherEntries.map(([group, items]) => (
                        <div key={group} className="flex flex-col">
                            <div className="flex items-center justify-between px-3 py-1 text-[11px] uppercase text-tertiary">
                                <span>{group}</span>
                                <IconChevronUp size={14} className="text-tertiary" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {items.map((suggestion) => (
                                    <div key={`${group}-${suggestion.value}`} className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-white transition-colors">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">{iconMap[suggestion.suggestionType]}</span>
                                        <SuggestionContent suggestion={suggestion} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] uppercase text-tertiary">
                <span>Press</span>
                <span className="text-secondary">Enter</span>
                <span>to insert</span>
                <IconBulb size={12} className="ml-auto" />
            </div>
        </Card>
    )
}
