import { BrandSection } from "@/components/sections/BrandSection"
import { CardRowSection } from "@/components/sections/CardRowSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { BentoSection } from "@/components/sections/BentoSection"
import { HeroSection } from "@/components/sections/HeroSection"
import { InstallSection } from "@/components/sections/InstallSection"
import { OffsetCardsSection } from "@/components/sections/OffsetCardsSection"
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
            return <CtaSection content={block} floatingCta={options.ctaFloating} locale={options.locale} />
        case "install":
            return <InstallSection content={block} />
        case "swipeCards":
            return <SwipeCardSection content={block} />
        default:
            return null
    }
}

export function PageBlocks({ blocks, cardRowChildren, ctaFloating = false, locale }: PageBlocksRendererProps) {
    const renderableBlocks = blocks?.filter((block) => renderPageBlock(block, { cardRowChildren, ctaFloating, locale }) !== null) ?? []

    return (
        <>
            {renderableBlocks.map((block, index) => (
                <React.Fragment key={block.id ?? index}>
                    {index > 0 && <div className="h-32" aria-hidden="true" />}
                    {renderPageBlock(block, { cardRowChildren, ctaFloating, locale })}
                </React.Fragment>
            ))}
        </>
    )
}
