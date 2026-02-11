"use client"

import React, {useState} from "react"
import {IconArrowUpRight, IconFolders, IconHierarchy, IconUsersGroup} from "@tabler/icons-react"
import { AnimatedList } from "../AnimatedList"
import { FeatureCard } from "./FeatureCard"
import Link from "next/link"
import { Button } from "@/components/Button"

export const ProjectCard: React.FC = () => {
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
        {
            icon: <IconHierarchy size={32} className="text-white/75" />,
            name: "Workflow Andromeda",
            description: "Agile development workflow for Cygnus.",
        },
        {
            icon: <IconHierarchy size={32} className="text-white/75" />,
            name: "Workflow Andromeda",
            description: "Agile development workflow for Cygnus.",
        },
    ]


    return (
        <FeatureCard className="col-span-1 md:col-span-3">
            <div className="relative w-full -mt-4 flex flex-col items-center justify-end h-full overflow-hidden">
                <AnimatedList
                    stackGap={18}
                    columnGap={80}
                    scaleFactor={0.025}
                    scrollDownDuration={10}
                    formationDuration={3}
                >
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className={`w-5/6 h-18 flex items-center gap-4 p-4 bg-linear-to-t from-primary to-[#0d1120] rounded-lg transform transition-all duration-300 ring ring-white/10`}
                        >

                            {card.icon}
                            <div>
                                <p className="text-white/90 font-semibold">{card.name}</p>
                                <p className="text-white/60 text-xs">{card.description}</p>
                            </div>
                        </div>
                    ))}
                </AnimatedList>
                <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[#050316] to-transparent pointer-events-none" />
            </div>
            <div className={"w-full flex flex-col gap-1"}>
                <p className={"font-semibold text-lg text-brand"}>
                    projectTitle
                </p>
                <p className={"text-white/50 text-sm"}>
                    projectDescription
                </p>
                <Link href="">
                    <Button variant="link" className="mt-2 gap-1 text-xs">
                        featureLinkButton
                        <IconArrowUpRight size={16} />
                    </Button>
                </Link>
            </div>
        </FeatureCard>
    )
}
