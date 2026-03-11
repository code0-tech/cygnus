"use client"

import type { InputSuggestion } from "@code0-tech/pictor"
import { Card } from "@code0-tech/pictor"

interface SuggesstionMenuClientProps {
    suggestions: InputSuggestion[]
}

export function SuggesstionMenuClient({ suggestions }: SuggesstionMenuClientProps) {
    return (
        <Card paddingSize={"xxs"} mt={-0.2} mx={-0.2}>
            test
        </Card>
    )
}
