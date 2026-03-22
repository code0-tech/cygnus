"use client"

import { Avatar, Card, Text } from "@code0-tech/pictor"

export function ProjectDataTable() {
    const projects = [
        { name: "OpsCanvas" },
        { name: "FlowForge" },
        { name: "SignalStack" },
        { name: "WhiteCloud" },
    ]

    return (
        <Card className="relative mx-auto w-[90%] cursor-default pb-6 md:-mb-16 md:pb-16 mask-[linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]">
            <p className="mb-2 text-white/75 text-lg font-medium">Personal Projects</p>
            <div className="mt-3 w-full overflow-hidden rounded-xl">
                {projects.map((project) => (
                    <div
                        key={project.name}
                        className="flex items-center gap-3 border-b border-white/8 px-3 py-3 last:border-b-0"
                    >
                        <Avatar identifier={project.name} />
                        <Text size="sm" className="text-white/85">
                            {project.name}
                        </Text>
                    </div>
                ))}
            </div>
        </Card>
    )
}
