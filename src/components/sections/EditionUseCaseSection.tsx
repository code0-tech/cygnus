"use client"

import { Section } from "@/components/ui/Section"
import { Media } from "@/payload-types"

interface EditionUseCaseItem {
    title: string
    description: string
    image?: Media | number | null
    link?: {
        label?: string | null
        url?: string | null
    } | null
    id?: string | null
}

interface EditionUseCaseSectionContent {
    heading: string
    subheading: string
    useCases: EditionUseCaseItem[] | null
}

interface EditionUseCaseSectionProps {
    content?: EditionUseCaseSectionContent | null
}

export function EditionUseCaseSection({ content }: EditionUseCaseSectionProps) {
    if (!content?.heading || !content?.subheading || !content?.useCases?.length) return null

    return (
        <Section showBlur={false} animationPreset="none">
            <div className="relative flex w-full flex-col items-stretch gap-32">

            </div>
        </Section>
    )
}
