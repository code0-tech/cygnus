import { BrandSection } from "@/components/sections/BrandSection"
import { CardRowSection } from "@/components/sections/CardRowSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { BentoSection } from "@/components/sections/BentoSection"
import { HeroSection } from "@/components/sections/HeroSection"
import { InstallSection } from "@/components/sections/InstallSection"
import { OffsetCardsSection } from "@/components/sections/OffsetCardsSection"
import { RoadmapSection } from "@/components/sections/RoadmapSection"
import { ScrollCardSection } from "@/components/sections/ScrollCardSection"
import { SwipeCardSection } from "@/components/sections/SwipeCardSection"
import type { AppLocale } from "@/lib/i18n"
import type { Page } from "@/payload-types"
import React, { type ReactNode } from "react"

type PageBlock = NonNullable<Page["layout"]>[number]

interface PageBlocksRendererProps {
    blocks?: PageBlock[] | null
    cardRowChildren?: ReactNode
    ctaFloating?: boolean
    locale?: AppLocale
}

function renderPageBlock(block: PageBlock, options: Pick<PageBlocksRendererProps, "cardRowChildren" | "ctaFloating" | "locale">) {
    switch (block.blockType) {
        case "hero":
            return <HeroSection content={block} />
        case "bento":
            return <BentoSection content={block} locale={options.locale} />
        case "brand":
            return <BrandSection content={block} />
        case "offsetCards":
            return <OffsetCardsSection content={block} />
        case "cardRow":
            return <CardRowSection content={block}>{options.cardRowChildren}</CardRowSection>
        case "faq":
            return <FaqSection content={block} />
        case "cta":
            return <CtaSection content={block} floatingCta={options.ctaFloating} />
        case "install":
            return <InstallSection content={block} />
        case "roadmap":
            return <RoadmapSection content={block} />
        case "scrollCards":
            return <ScrollCardSection content={block} />
        case "swipeCards":
            return <SwipeCardSection content={block} />
        default:
            return null
    }
}

export function PageBlocks({ blocks, cardRowChildren, ctaFloating = false, locale }: PageBlocksRendererProps) {
    const renderableBlocks = blocks?.flatMap((block) => {
        const element = renderPageBlock(block, { cardRowChildren, ctaFloating, locale })
        return element ? [{ block, element }] : []
    }) ?? []

    return (
        <>
            {renderableBlocks.map(({ block, element }, index) => (
                <React.Fragment key={block.id ?? index}>
                    {index > 0 && <div className="h-32" aria-hidden="true" />}
                    {element}
                </React.Fragment>
            ))}
        </>
    )
}
