"use client"

import type { ReactNode } from "react"
import type { InputSuggestion } from "@code0-tech/pictor"
import { Card, Text } from "@code0-tech/pictor"
import { IconBulb, IconChevronUp, IconCircleDot, IconCirclesRelation, IconFileFunctionFilled } from "@tabler/icons-react"

const FunctionSuggestionType = {
    FUNCTION: "FUNCTION",
    FUNCTION_COMBINATION: "FUNCTION_COMBINATION",
    REF_OBJECT: "REF_OBJECT",
    VALUE: "VALUE",
    DATA_TYPE: "DATA_TYPE",
} as const

type FunctionSuggestionType = typeof FunctionSuggestionType[keyof typeof FunctionSuggestionType]

type SuggestionWithType = InputSuggestion & {
    suggestionType: FunctionSuggestionType
}

export function SuggesstionMenuClient() {
    const iconMap: Record<FunctionSuggestionType, ReactNode> = {
        [FunctionSuggestionType.FUNCTION]: <IconFileFunctionFilled color="#70ffb2" size={16} />,
        [FunctionSuggestionType.FUNCTION_COMBINATION]: <IconFileFunctionFilled color="#70ffb2" size={16} />,
        [FunctionSuggestionType.REF_OBJECT]: <IconCirclesRelation color="#FFBE0B" size={16} />,
        [FunctionSuggestionType.VALUE]: <IconCircleDot color="#D90429" size={16} />,
        [FunctionSuggestionType.DATA_TYPE]: <IconCircleDot color="#D90429" size={16} />,
    }

    const suggestions: SuggestionWithType[] = [
        {
            children: "0-0-2-",
            value: "0-0-2-",
            valueData: { id: "variable_1", type: "variable", label: "0-0-2-" },
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

    return (
        <Card
            paddingSize="xxs"
            className="w-full! rounded-[1.35rem]! border! border-white/10! bg-secondary! shadow-[0_20px_50px_rgba(0,0,0,0.34)]!"
        >
            <div className="relative z-20 flex flex-col gap-2 rounded-[1.2rem] bg-primary p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {groupedEntries
                    .filter(([group]) => group === "Variables")
                    .map(([group, items]) => (
                        <div key={group} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between px-2 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a88a8]">
                                <span>{group}</span>
                                <IconChevronUp size={14} className="text-[#8a88a8]" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {items.map((suggestion) => (
                                    <div
                                        key={`${group}-${suggestion.value}`}
                                        className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-white/92 transition-colors"
                                    >
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                            {iconMap[suggestion.suggestionType]}
                                        </span>
                                        <Text size="sm" className="truncate" style={{ color: "inherit" }}>
                                            {String(suggestion.children ?? suggestion.value)}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                <div className="flex flex-col gap-2 overflow-hidden rounded-xl py-1">
                    {groupedEntries
                        .filter(([group]) => group !== "Variables")
                        .map(([group, items]) => (
                            <div key={group} className="flex flex-col">
                                <div className="flex items-center justify-between px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a88a8]">
                                    <span>{group}</span>
                                    <IconChevronUp size={14} className="text-[#8a88a8]" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {items.map((suggestion) => (
                                        <div
                                            key={`${group}-${suggestion.value}`}
                                            className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-white/92 transition-colors"
                                        >
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                                {iconMap[suggestion.suggestionType]}
                                            </span>
                                            <Text size="sm" className="truncate" style={{ color: "inherit" }}>
                                                {String(suggestion.children ?? suggestion.value)}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-[#8a88a8]">
                <span>Press</span>
                <span className="text-white/70">↵</span>
                <span>to insert</span>
                <IconBulb size={12} className="ml-auto"/>
            </div>
        </Card>
    )
}
