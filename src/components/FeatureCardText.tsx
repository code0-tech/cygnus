import { Button } from "@/components/Button"
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
}

export function FeatureCardText({ content }: FeatureCardTextProps) {
    if (!content) return

    return (
        <div className={"w-full flex flex-col gap-1"}>
            <p className={"font-semibold text-lg text-brand"}>
                {content.title}
            </p>
            <p className={"text-white/50 text-sm"}>
                {content.description}
            </p>
            <Link href={content.link.url}>
                <Button variant="link" className="mt-2 gap-1 text-xs">
                    {content.link.label}
                    <IconArrowUpRight size={16} />
                </Button>
            </Link>
        </div>
    )
}
