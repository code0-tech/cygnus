"use client"

import type { Section } from "@/payload-types"
import { createContext, type ReactNode, useContext, useMemo } from "react"

type SectionType = NonNullable<Section["sectionType"]>
type SectionsMap = Partial<Record<SectionType, Section>>

const SectionsContext = createContext<SectionsMap>({})

interface SectionsProviderProps {
    sections: Section[]
    children: ReactNode
}

export function SectionsProvider({ sections, children }: SectionsProviderProps) {
    const sectionsMap = useMemo<SectionsMap>(() => {
        return sections.reduce<SectionsMap>((acc, section) => {
            acc[section.sectionType] = section
            return acc
        }, {})
    }, [sections])

    return (
        <SectionsContext.Provider value={sectionsMap}>
            {children}
        </SectionsContext.Provider>
    )
}

export function usePreloadedSection(sectionType?: SectionType) {
    const sections = useContext(SectionsContext)
    if (!sectionType) return null
    return sections[sectionType] ?? null
}
