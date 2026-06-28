"use client"

import { Avatar, Text } from "@code0-tech/pictor"
import { Card } from "../ui/Card"

export function ClientProjectCard() {
    const projects = [{ name: "OpsCanvas" }, { name: "FlowForge" }, { name: "SignalStack" }, { name: "WhiteCloud" }]

    return (
        <Card className="mx-auto w-[90%] pb-6 md:-mb-16 md:pb-16 bg-primary">
            <p className="mb-2 text-secondary text-lg font-medium">Personal Projects</p>
            <div className="mt-3 w-full overflow-hidden rounded-xl">
                {projects.map((project) => (
                    <div key={project.name} className="flex items-center gap-3 border-b border-white/5 px-3 py-3 last:border-b-0">
                        <Avatar identifier={project.name} />
                        <Text size="sm" className="text-white">
                            {project.name}
                        </Text>
                    </div>
                ))}
            </div>
        </Card>
    )
}
