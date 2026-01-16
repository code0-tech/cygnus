import { DFlow } from "@code0-tech/pictor"

interface UseCaseCardProps {
    flowId: `gid://sagittarius/Flow/${number}` | undefined
    title: string
    description: string
}

export function UseCaseCard({ flowId, title, description }: UseCaseCardProps) {

    return (
        <div className="relative h-full w-full">
            <div className={"absolute z-50 w-full flex flex-col items-center text-center top-16"}>
                <div className="w-1/2 p-4 rounded-2xl bg-primary border border-white/10 backdrop-blur-sm flex flex-col gap-4 items-center">
                    <p className={"text-xl font-semibold text-white"}>{title}</p>
                    <p className={" text-neutral-200"}>{description}</p>
                </div>
            </div>
            <DFlow flowId={flowId} namespaceId={undefined} projectId={undefined}/>
        </div>
    )
}
