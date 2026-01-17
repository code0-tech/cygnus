import React from "react"
import {IconFolders, IconHierarchy, IconUsersGroup} from "@tabler/icons-react"
import {useTranslations} from "next-intl"

export const ProjectCard: React.FC = () => {
    const t = useTranslations("FeatureSection")

    const cards = [
        {
            icon: <IconFolders size={32} className="text-white/75" />,
            name: "Project Cygnus",
            description: "A next-gen software development platform.",
        },
        {
            icon: <IconUsersGroup size={32} className="text-white/75" />,
            name: "Team Orion",
            description: "The team behind the Cygnus project.",
        },
        {
            icon: <IconHierarchy size={32} className="text-white/75" />,
            name: "Workflow Andromeda",
            description: "Agile development workflow for Cygnus.",
        },
    ]


    return (
        <div className={"relative flex flex-col justify-between items-center overflow-hidden p-4 h-[420px] col-span-3 row-span-2 bg-[#050316] rounded-xl border border-white/10"}>
            <div className={"flex flex-col gap-1 text-center"}>
                <p className={"font-mono font-semibold text-lg text-white/75"}>
                    {t("projectTitle")}
                </p>
                <p className={"text-white/50 text-sm"}>
                    {t("projectDescription")}
                </p>
            </div>
            <div className="w-full flex flex-col items-center justify-end h-full pb-8">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="w-5/6 h-24 flex items-center gap-4 p-4 bg-primary rounded-lg transform transition-all duration-300 -mt-20 first:mt-0 border border-white/10"
                        style={{ scale: 100 + (index * 5) + "%" }}
                    >

                        {card.icon}
                        <div>
                            <p className="text-white/90 font-semibold">{card.name}</p>
                            <p className="text-white/60 text-xs">{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
