import React, {ReactNode} from "react"
import {IconCube, IconGlobe, IconLock, IconManualGearbox, IconRocket, IconWand} from "@tabler/icons-react"
import {useTranslations} from "next-intl"
import {cn} from "@/utils/cn"

interface RoadmapItem  {
    year: string
    steps: {
        icon: ReactNode,
        time: string
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
                time: "Q1 Q2",
                isPlanned: false,
                title: "Unternehmensgründung",
                content:
                    "Gründung von Visionary Tech als spezialisierte Entwicklungsfirma für KI-Lösungen.",
            },
            {
                icon: <IconCube size={20} />,
                time: "Q3 Q4",
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
                time: "Q1",
                isPlanned: false,
                title: "Seed-Finanzierung",
                content: "Erfolgreiche Seed-Runde über 3 Mio. USD bei 20 Mio. Bewertung.",
            },
            {
                icon: <IconGlobe size={20} />,
                time: "Q2 Q3",
                isPlanned: false,
                title: "Internationaler Markteintritt",
                content:
                    "Einführung lokalisierter App-Versionen in fünf internationalen Märkten.",
            },
            {
                icon: <IconManualGearbox size={20} />,
                time: "Q4",
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
                time: "Q1 Q2",
                isPlanned: false,
                title: "AI-Automationsplattform",
                content:
                    "Release einer autonomen KI-Plattform zur industriellen Prozessautomatisierung.",
            },
            {
                icon: <IconWand size={20} />,
                time: "Q3 Q4",
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

    return (
        <div className={"grid grid-cols-[10%_80%_10%] w-full"}>
            <div className={""}/>
            <div className={"py-16 flex flex-col items-center justify-center gap-8"}>

                <div className={"w-full flex flex-col gap-4 items-center justify-center text-center"}>
                    <p className={"text-4xl lg:text-6xl text-white"}>{t("title")}</p>
                    <p className={"text-xl text-white/75"}>{t("description")}</p>
                </div>

                <div className={"flex flex-col gap-4 items-start"}>
                    {roadmapItems.map((item) => (
                        <div key={item.year} className={"w-full flex flex-col lg:flex-row items-center gap-4"}>
                            <p className={"text-white/75 text-xl"}>{item.year}</p>
                            {item.steps.map((step) => (

                                <div
                                    key={step.time}
                                    className={cn(
                                        "relative w-full h-full flex rounded-lg text-white border border-white/10",
                                        step.isPlanned ? "bg-white/5" : "bg-white/2"
                                    )}
                                >
                                    <div className={"z-10 h-full w-10 text-wrap p-2 gap-2 flex flex-col items-center justify-center bg-primary rounded-l-lg border-r border-white/10 text-[#353343]"}>
                                        <p className={"text-lg"}>{step.time}</p>
                                    </div>
                                    <div className={"flex flex-col gap-2 p-4 pl-2"}>
                                        <div
                                            className="absolute inset-0 z-0 pointer-events-none"
                                            style={{
                                                backgroundImage: `
                                                repeating-linear-gradient(-40deg, 
                                                  rgba(255, 255, 255, 0.025) 11px, 
                                                  rgba(255, 255, 255, 0.025) 12px, 
                                                  transparent 12px, 
                                                  transparent 24px
                                                )
                                              `,
                                            }}
                                        />
                                        <div className={"z-10 w-full flex justify-between gap-2"}>
                                            <div className={"flex gap-2 text-white items-center"}>
                                                {step.icon}
                                                <p className={"text-lg truncate"}>{step.title}</p>
                                            </div>
                                            <p className={cn("text-sm align-start text-brand/70 font-mono", step.isPlanned ? "flex" : "hidden")}>
                                                PLANNED
                                            </p>
                                        </div>
                                        <p className={"z-10 text-white/50 text-sm"}>{step.content}</p>
                                    </div>

                                </div>

                            ))}
                        </div>
                    ))}
                </div>

            </div>
            <div className={""}/>
        </div>
    )
}

