import { LinkButton } from "@/components/ui/LinkButton"
import { cn } from "@/lib/utils"

interface FeatureCardContent {
    title: string
    description: string
    link: {
        label: string
        url: string
    }
}

interface FeatureCardTextProps {
    content?: FeatureCardContent | null
    className?: string
}

export function FeatureCardText({ content, className }: FeatureCardTextProps) {
    if (!content) return null

    return (
        <div className={cn("z-30 w-full flex flex-col", className)}>
            <p className={"font-semibold text-lg text-brand"}>
                {content.title}
            </p>
            {content.description &&
                <p className={"text-white/50 text-sm"}>
                    {content.description}
                </p>
            }
            {content.link && content.link.label && content.link.url &&
                <LinkButton href={content.link.url} className="mt-3 text-xs font-normal text-nowrap">
                    {content.link.label}
                </LinkButton>
            }
        </div>
    )
}
