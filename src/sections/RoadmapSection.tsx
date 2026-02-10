import React, {ReactNode} from "react"
import {
    IconArrowUpRight,
    IconCube,
    IconGlobe,
    IconLock,
    IconManualGearbox,
    IconRocket,
    IconWand
} from "@tabler/icons-react"
import {useTranslations} from "next-intl"
import {GanttFeatureItem, GanttFeatureList, GanttFeatureListGroup, GanttHeader, GanttProvider} from "@/components/Gantt"
import {ScrollArea} from "@/components/ScrollArea"
import { Section } from "@/components/Section"
import { FeatureCard } from "@/components/cards/FeatureCard"

interface RoadmapItem  {
    year: string
    steps: {
        icon: ReactNode,
        startAt: Date
        endAt: Date
        title: string
        content: string
        isPlanned: boolean
    }[]
}

const roadmapItems: RoadmapItem[] = [
    {
        year: "2022",
        steps: [
            {
                icon: <IconRocket size={20} />,
                startAt: new Date(2024, 0, 1),
                endAt: new Date(2024, 6, 0),
                isPlanned: false,
                title: "Unternehmensgründung",
                content:
                    "Gründung von Visionary Tech als spezialisierte Entwicklungsfirma für KI-Lösungen.",
            },
            {
                icon: <IconCube size={20} />,
                startAt: new Date(2024, 6, 1),
                endAt: new Date(2025, 0, 0),
                isPlanned: false,
                title: "Erstes Produkt-Release",
                content:
                    "Launch der ersten KI-gestützten Mobile App für personalisierte Empfehlungen.",
            }
        ]
    },
    {
        year: "2023",
        steps: [
            {
                icon: <IconLock size={20} />,
                startAt: new Date(2024, 0, 1),
                endAt: new Date(2024, 3, 0),
                isPlanned: false,
                title: "Seed-Finanzierung",
                content: "Erfolgreiche Seed-Runde über 3 Mio. USD bei 20 Mio. Bewertung.",
            },
            {
                icon: <IconGlobe size={20} />,
                startAt: new Date(2024, 3, 1),
                endAt: new Date(2024, 9, 0),
                isPlanned: false,
                title: "Internationaler Markteintritt",
                content:
                    "Einführung lokalisierter App-Versionen in fünf internationalen Märkten.",
            },
            {
                icon: <IconManualGearbox size={20} />,
                startAt: new Date(2024, 9, 1),
                endAt: new Date(2025, 0, 0),
                isPlanned: false,
                title: "Algorithmus-Optimierung",
                content:
                    "Weiterentwicklung der Machine-Learning-Modelle für präzisere Vorhersagen.",
            }
        ]
    },
    {
        year: "2025",
        steps: [
            {
                icon: <IconCube size={20} />,
                startAt: new Date(2025, 0, 1),
                endAt: new Date(2025, 6, 0),
                isPlanned: false,
                title: "AI-Automationsplattform",
                content:
                    "Release einer autonomen KI-Plattform zur industriellen Prozessautomatisierung.",
            },
            {
                icon: <IconWand size={20} />,
                startAt: new Date(2025, 6, 1),
                endAt: new Date(2026, 0, 0),
                isPlanned: true,
                title: "VR-Integration",
                content:
                    "Geplante Erweiterung des Produktportfolios um immersive VR-Funktionen.",
            }
        ]
    }
]

export const RoadmapSection: React.FC = () => {
    const t = useTranslations("RoadmapSection")

    const features = roadmapItems.flatMap((item) =>
        item.steps.map((step) => ({
            id: item.year + "-" + step.title,
            name: step.title,
            content: step.content,
            startAt: step.startAt,
            endAt: step.endAt,
            group: { name: item.year },
            icon: step.icon,
        }))
    )

    const grouped = features.reduce((acc, f) => {
        acc[f.group.name] = acc[f.group.name] || []
        acc[f.group.name].push(f)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <Section translationKey="RoadmapSection">
            <div className="w-full h-dvh py-16 px-4">
                <FeatureCard className="w-full h-full">
                    test
                </FeatureCard>
            </div>
        </Section>
    )
}
