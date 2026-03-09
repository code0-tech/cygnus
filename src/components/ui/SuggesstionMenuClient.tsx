"use client"

import type { InputSuggestion } from "@code0-tech/pictor"
import { Button, Card, Input, InputSuggestionMenuContentItems, Menu, MenuContent, MenuTrigger } from "@code0-tech/pictor"
import { IconSearch, IconX } from "@tabler/icons-react"

interface SuggesstionMenuClientProps {
    suggestions: InputSuggestion[]
}

export function SuggesstionMenuClient({ suggestions }: SuggesstionMenuClientProps) {
    return (
        <Menu open modal={false}>
            <MenuTrigger asChild>
                <div className="w-full"/>
            </MenuTrigger>
            <MenuContent align="start" sideOffset={8} className="z-40 w-full">
                <Card paddingSize={"xxs"} mt={-0.2} mx={-0.2}>
                    <InputSuggestionMenuContentItems suggestions={suggestions} />
                </Card>
            </MenuContent>
        </Menu>
    )
}
