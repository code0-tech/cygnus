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
        <div className={"relative overflow-hidden flex flex-col items-center justify-center gap-16 mb-16 -mx-4"}>

            <div
                className="
                    pointer-events-none
                    absolute -inset-16
                    opacity-20 blur-lg
                    will-change-filter
                    [background:radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_45%)]
                "
            />

            <div className={"w-full flex flex-col gap-4 items-center justify-center text-center pt-32"}>
                <p className={"text-4xl md:text-6xl text-white"}>{t("title")}</p>
                <p className={"max-w-[90vw] text-center font-medium text-white/75 text-xl"}>{t("description")}</p>
                <button className={"flex items-center gap-1 border-b border-dashed border-white/25 text-sm text-white/50 hover:text-brand"}>
                    {t("linkButton")}
                    <IconArrowUpRight size={16} />
                </button>
            </div>

            <ScrollArea className={"mx-auto h-full w-[90%] rounded-xl border border-white/10"} orientation="horizontal">
                <GanttProvider>
                    <GanttHeader />
                    <GanttFeatureList>
                        {Object.entries(grouped).map(([group, features]) => (
                            <GanttFeatureListGroup key={group}>
                                {features.map((feature) => (
                                    <div className="flex" key={feature.id}>
                                        <GanttFeatureItem {...feature}/>
                                    </div>
                                ))}
                            </GanttFeatureListGroup>
                        ))}
                    </GanttFeatureList>
                </GanttProvider>
            </ScrollArea>
        </div>
    )
}
