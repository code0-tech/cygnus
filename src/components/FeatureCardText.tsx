import { Button } from "@/components/ui/Button"
import { cn } from "@/utils/cn"
import { IconArrowUpRight } from "@tabler/icons-react"
import Link from "next/link"

export interface FeatureCardContent {
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
        <div className={cn("z-30 w-full flex flex-col gap-1", className)}>
            <p className={"font-semibold text-lg text-brand"}>
                {content.title}
            </p>
            {content.description &&
                <p className={"text-white/50 text-sm"}>
                    {content.description}
                </p>
            }
            {content.link && content.link.label && content.link.url &&
                <Link href={content.link.url}>
                    <Button variant="link" className="mt-2 gap-1 text-xs">
                        {content.link.label}
                        <IconArrowUpRight size={16} />
                    </Button>
                </Link>
            }
        </div>
    )
}
