import { SectionLinkButton } from "@/components/ui/SectionLinkButton"
import { SectionMotion, type SectionAnimation } from "@/components/ui/SectionMotion"
import { cn } from "@/lib/utils"
import { createElement, type ReactNode } from "react"

interface SectionLink {
    label?: string | null
    url?: string | null
}

function hasHighlightedHeading(heading?: string | null) {
    return Boolean(heading && /\*\*.*?\*\*/.test(heading))
}

function FormattedText({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\*\*.*?\*\*)/g).flatMap((part, partIndex) => {
                const highlighted = part.startsWith("**") && part.endsWith("**") && part.length > 4
                const value = highlighted ? part.slice(2, -2) : part

                return value.split(/(\\n|\r\n|\n|\r)/g).map((linePart, lineIndex) => {
                    const key = `${partIndex}-${lineIndex}`

                    if (/^(\\n|\r\n|\n|\r)$/.test(linePart)) {
                        return <br key={key} />
                    }

                    if (!highlighted) return linePart

                    return (
                        <span className="text-white" key={key}>
                            {linePart}
                        </span>
                    )
                })
            })}
        </>
    )
}

interface SectionProps {
    children: ReactNode
    funnelType?: "center" | "left"
    className?: string
    heading?: string | null
    description?: string | null
    linkButton?: SectionLink | null
    showFunnel?: boolean
    showLinkButton?: boolean
    fullHeight?: boolean
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
    animation?: SectionAnimation
}

export function Section({
    heading,
    description,
    linkButton,
    children,
    className,
    funnelType = "center",
    showFunnel = true,
    showLinkButton = true,
    fullHeight = false,
    animation,
    headingLevel = 2,
}: SectionProps) {
    const rawLinkUrl = linkButton?.url?.trim()
    const shouldShowFunnel = showFunnel && Boolean(heading || description || (showLinkButton && rawLinkUrl && linkButton?.label))
    const headingTag = `h${headingLevel}` as const
    const headingClassName = cn("section-stagger-item text-4xl font-semibold", hasHighlightedHeading(heading) ? "text-secondary" : "text-white")
    const funnelClassName = funnelType === "center" ? "section-funnel flex flex-col gap-4 items-center justify-center text-center" : "section-funnel flex flex-col gap-4 text-left"
    const descriptionClassName = cn(
        "section-stagger-item relative z-10 max-w-[90vw] text-xl font-medium text-secondary lg:w-1/2",
        funnelType === "center" && "text-center"
    )

    return (
        <SectionMotion animation={animation} className={className} fullHeight={fullHeight}>
            {shouldShowFunnel && (
                <div className={funnelClassName}>
                    {createElement(headingTag, { className: headingClassName }, heading ? <FormattedText text={heading} /> : null)}
                    {description && (
                        <p className={descriptionClassName}>
                            <FormattedText text={description} />
                        </p>
                    )}
                    {showLinkButton && rawLinkUrl && (
                        <div className="section-stagger-item">
                            <SectionLinkButton label={linkButton?.label} url={rawLinkUrl} />
                        </div>
                    )}
                </div>
            )}
            {children}
        </SectionMotion>
    )
}
