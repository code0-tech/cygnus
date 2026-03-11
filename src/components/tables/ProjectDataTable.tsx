"use client"

import { Avatar, Card, Text } from "@code0-tech/pictor"

export function ProjectDataTable() {
    const projects = [
        { name: "Test" },
        { name: "Test2" },
        { name: "Test3" }
    ]

    return (
        <Card className="relative w-full self-start -mb-16 pb-16 mask-[linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]">
            <p className="mb-2 text-white text-lg font-medium">Personal Projects</p>
            <p className="text-sm text-white/50">
                Projects created in your personal namespace. You can also create organization projects if you are a member of any organization.
            </p>
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
