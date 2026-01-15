import { DFlow } from "@code0-tech/pictor"

interface UseCaseCardProps {
    flowId: `gid://sagittarius/Flow/${number}` | undefined
    title: string
    description: string
}

export function UseCaseCard({ flowId, title, description }: UseCaseCardProps) {

    return (
        <div className="relative h-full w-full">
            <div className={"absolute z-50 w-full flex flex-col gap-4 items-center text-center top-16"}>
                <p className={"text-xl font-semibold"}>{title}</p>
                <p className={"w-2/5 text-white/50"}>{description}</p>
            </div>
            <DFlow flowId={flowId} namespaceId={undefined} projectId={undefined}/>
        </div>

    )
}
