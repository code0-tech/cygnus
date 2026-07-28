import { LinkButton } from "@/components/ui/LinkButton"
import { cn } from "@/lib/utils"

export interface FeatureCardContent {
    title?: string | null
    description?: string | null
    link?: {
        label?: string | null
        url?: string | null
    } | null
}

interface FeatureCardTextProps {
    content?: FeatureCardContent | null
    className?: string
}

export function FeatureCardText({ content, className }: FeatureCardTextProps) {
    if (!content?.title) return null

    return (
        <div className={cn("z-30 flex w-full min-w-0 flex-col", className)}>
            <p className={"font-semibold text-lg text-brand tracking-normal leading-6"}>{content.title}</p>
            {content.description && <p className={"text-secondary text-sm"}>{content.description}</p>}
            {content.link && content.link.label && content.link.url && (
                <LinkButton href={content.link.url} className="mt-3 inline-flex max-w-full min-w-0 text-xs font-normal">
                    {content.link.label}
                </LinkButton>
            )}
        </div>
    )
}
