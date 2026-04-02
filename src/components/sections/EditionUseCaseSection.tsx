"use client"

import { Section } from "@/components/ui/Section"

interface EditionUseCaseSectionProps {
    content?: string
}

export function EditionUseCaseSection({ content }: EditionUseCaseSectionProps) {
    return (
        <Section showBlur={false} animationPreset="none">
            <div className="relative flex w-full flex-col items-stretch gap-32">

            </div>
        </Section>
    )
}
